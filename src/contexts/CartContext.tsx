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

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  condition: string;
  quantity: number;
  size?: string;
  color?: string;
  addedAt?: any;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity' | 'addedAt'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [firestoreAvailable, setFirestoreAvailable] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('Loaded cart from localStorage:', parsedCart);
        setItems(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      localStorage.removeItem('cart'); // Clear corrupted data
    }
    // Set loading to false after attempting localStorage load
    setTimeout(() => setLoading(false), 100);
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (!loading && items.length >= 0) {
      try {
        localStorage.setItem('cart', JSON.stringify(items));
        console.log('Saved cart to localStorage:', items);
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [items, loading]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      
      if (user && firestoreAvailable) {
        try {
          // Clear localStorage when different user logs in
          const currentUserId = localStorage.getItem('currentUserId');
          if (currentUserId && currentUserId !== user.uid) {
            console.log('Different user detected, clearing localStorage cart');
            localStorage.removeItem('cart');
          }
          localStorage.setItem('currentUserId', user.uid);
          
          // Listen to real-time updates for user's cart
          const cartRef = doc(db, 'carts', user.uid);
          
          const unsubscribeCart = onSnapshot(cartRef, (docSnapshot) => {
            console.log('Cart snapshot received:', docSnapshot.exists() ? 'Data exists' : 'No data');
            if (docSnapshot.exists()) {
              const cartData = docSnapshot.data();
              console.log('Cart items from Firestore:', cartData.items);
              setItems(cartData.items || []);
              // Update localStorage with Firestore data
              localStorage.setItem('cart', JSON.stringify(cartData.items || []));
            } else {
              console.log('No cart document found, initializing empty cart');
              setItems([]);
              localStorage.setItem('cart', JSON.stringify([]));
            }
            setLoading(false);
          }, (error) => {
            console.error('Error listening to cart:', error);
            setFirestoreAvailable(false);
            setLoading(false);
            // Fall back to localStorage
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
              try {
                setItems(JSON.parse(savedCart));
              } catch (e) {
                console.error('Error parsing cart from localStorage:', e);
              }
            }
          });

          return () => unsubscribeCart();
        } catch (error) {
          console.error('Firestore setup failed:', error);
          setFirestoreAvailable(false);
          setLoading(false);
        }
      } else if (user) {
        // User logged in but Firestore unavailable, use localStorage
        console.log('User logged in but Firestore unavailable, using localStorage');
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            setItems(JSON.parse(savedCart));
          } catch (e) {
            console.error('Error parsing cart from localStorage:', e);
          }
        }
        setLoading(false);
      } else {
        console.log('User logged out, clearing cart and userId');
        setItems([]);
        localStorage.removeItem('cart');
        localStorage.removeItem('currentUserId');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [firestoreAvailable]);

  const saveCartToFirestore = async (userId: string, cartItems: CartItem[]) => {
    if (!firestoreAvailable) {
      console.log('Firestore unavailable, using localStorage only');
      return;
    }
    
    try {
      console.log('Saving cart to Firestore for user:', userId, 'Items:', cartItems);
      const cartRef = doc(db, 'carts', userId);
      
      // Remove serverTimestamp from individual items and only use it at document level
      const cleanItems = cartItems.map(({ addedAt, ...item }) => item);
      
      await setDoc(cartRef, {
        userId,
        items: cleanItems,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('Cart saved successfully to Firestore');
    } catch (error) {
      console.error('Error saving cart to Firestore:', error);
      setFirestoreAvailable(false);
      toast.error('Using local storage - database unavailable');
    }
  };

  const addToCart = async (item: Omit<CartItem, 'quantity' | 'addedAt'>) => {
    if (!auth.currentUser) return;

    setItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id);
      let updatedItems;
      
      if (existingItem) {
        // Check if item already exists in cart (quantity would be >= 1)
        if (existingItem.quantity >= 1) {
          toast('Only one item available in store as it is thrifted');
          return prevItems; // Don't add more
        }
        // This case shouldn't happen with our logic, but just in case
        updatedItems = prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: 1 }
            : cartItem
        );
      } else {
        // Add new item with quantity 1
        const newItem: CartItem = {
          ...item,
          quantity: 1
        };
        updatedItems = [...prevItems, newItem];
        toast.success('Item added to cart!');
      }

      // Save to Firestore
      saveCartToFirestore(auth.currentUser!.uid, updatedItems);
      return updatedItems;
    });
  };

  const removeFromCart = async (id: string) => {
    if (!auth.currentUser) return;

    setItems(prevItems => {
      const updatedItems = prevItems.filter(item => item.id !== id);
      saveCartToFirestore(auth.currentUser!.uid, updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (!auth.currentUser) return;

    // Limit maximum quantity to 1
    if (quantity > 1) {
      toast('Only one item available in store as it is thrifted');
      return;
    }

    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === id ? { ...item, quantity: 1 } : item
      );
      saveCartToFirestore(auth.currentUser!.uid, updatedItems);
      return updatedItems;
    });
  };

  const clearCart = async () => {
    if (!auth.currentUser) return;

    setItems([]);
    await saveCartToFirestore(auth.currentUser.uid, []);
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
