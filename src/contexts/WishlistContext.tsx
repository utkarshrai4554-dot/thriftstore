import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  condition: string;
  addedAt?: any;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
  getWishlistCount: () => number;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [firestoreAvailable, setFirestoreAvailable] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('wishlist');
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        console.log('Loaded wishlist from localStorage:', parsedWishlist);
        setItems(parsedWishlist);
      }
    } catch (error) {
      console.error('Error loading wishlist from localStorage:', error);
      localStorage.removeItem('wishlist'); // Clear corrupted data
    }
    // Set loading to false after attempting localStorage load
    setTimeout(() => setLoading(false), 100);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (!loading && items.length >= 0) {
      try {
        localStorage.setItem('wishlist', JSON.stringify(items));
        console.log('Saved wishlist to localStorage:', items);
      } catch (error) {
        console.error('Error saving wishlist to localStorage:', error);
      }
    }
  }, [items, loading]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Wishlist auth state changed:', user ? `User ${user.uid}` : 'No user');
      
      if (user && firestoreAvailable) {
        try {
          // Clear localStorage when different user logs in
          const currentUserId = localStorage.getItem('currentUserId');
          if (currentUserId && currentUserId !== user.uid) {
            console.log('Different user detected, clearing localStorage wishlist');
            localStorage.removeItem('wishlist');
          }
          localStorage.setItem('currentUserId', user.uid);
          
          // Listen to real-time updates for user's wishlist
          const wishlistRef = doc(db, 'wishlists', user.uid);
          
          const unsubscribeWishlist = onSnapshot(wishlistRef, (docSnapshot) => {
            console.log('Wishlist snapshot received:', docSnapshot.exists() ? 'Data exists' : 'No data');
            if (docSnapshot.exists()) {
              const wishlistData = docSnapshot.data();
              console.log('Wishlist items from Firestore:', wishlistData.items);
              setItems(wishlistData.items || []);
              // Update localStorage with Firestore data
              localStorage.setItem('wishlist', JSON.stringify(wishlistData.items || []));
            } else {
              console.log('No wishlist document found, initializing empty wishlist');
              setItems([]);
              localStorage.setItem('wishlist', JSON.stringify([]));
            }
            setLoading(false);
          }, (error) => {
            console.error('Error listening to wishlist:', error);
            setFirestoreAvailable(false);
            setLoading(false);
            // Fall back to localStorage
            const savedWishlist = localStorage.getItem('wishlist');
            if (savedWishlist) {
              try {
                setItems(JSON.parse(savedWishlist));
              } catch (e) {
                console.error('Error parsing wishlist from localStorage:', e);
              }
            }
          });

          return () => unsubscribeWishlist();
        } catch (error) {
          console.error('Firestore setup failed:', error);
          setFirestoreAvailable(false);
          setLoading(false);
        }
      } else if (user) {
        // User logged in but Firestore unavailable, use localStorage
        console.log('User logged in but Firestore unavailable, using localStorage');
        const savedWishlist = localStorage.getItem('wishlist');
        if (savedWishlist) {
          try {
            setItems(JSON.parse(savedWishlist));
          } catch (e) {
            console.error('Error parsing wishlist from localStorage:', e);
          }
        }
        setLoading(false);
      } else {
        console.log('User logged out, clearing wishlist and userId');
        setItems([]);
        localStorage.removeItem('wishlist');
        localStorage.removeItem('currentUserId');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firestoreAvailable]);

  const saveWishlistToFirestore = async (userId: string, wishlistItems: WishlistItem[]) => {
    if (!firestoreAvailable) {
      console.log('Firestore unavailable, using localStorage only');
      return;
    }
    
    try {
      console.log('Saving wishlist to Firestore for user:', userId, 'Items:', wishlistItems);
      const wishlistRef = doc(db, 'wishlists', userId);
      
      // Remove serverTimestamp from individual items and only use it at document level
      const cleanItems = wishlistItems.map(({ addedAt, ...item }) => item);
      
      await setDoc(wishlistRef, {
        userId,
        items: cleanItems,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('Wishlist saved successfully to Firestore');
    } catch (error) {
      console.error('Error saving wishlist to Firestore:', error);
      setFirestoreAvailable(false);
      toast.error('Using local storage - database unavailable');
    }
  };

  const addToWishlist = async (item: WishlistItem) => {
    if (!auth.currentUser) return;

    // Don't add serverTimestamp to individual items
    const newItem: WishlistItem = {
      ...item
    };

    setItems(prevItems => {
      const existingItem = prevItems.find(wishlistItem => wishlistItem.id === item.id);
      if (existingItem) {
        return prevItems; // Item already in wishlist
      }
      const updatedItems = [...prevItems, newItem];
      saveWishlistToFirestore(auth.currentUser!.uid, updatedItems);
      return updatedItems;
    });
  };

  const removeFromWishlist = async (id: string) => {
    if (!auth.currentUser) return;

    setItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== id);
      saveWishlistToFirestore(auth.currentUser!.uid, updatedItems);
      return updatedItems;
    });
  };

  const isInWishlist = (id: string) => {
    return items.some(item => item.id === id);
  };

  const clearWishlist = async () => {
    if (!auth.currentUser) return;

    setItems([]);
    await saveWishlistToFirestore(auth.currentUser.uid, []);
  };

  const getWishlistCount = () => {
    return items.length;
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        getWishlistCount,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
