import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { toast } from 'sonner';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewContextType {
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  getProductReviews: (productId: string) => Review[];
  getProductAverageRating: (productId: string) => number;
  getProductTotalReviews: (productId: string) => number;
  loading: boolean;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reviews from Firestore on mount
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(reviewsQuery);
        const reviewsData: Review[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          reviewsData.push({
            id: doc.id,
            productId: data.productId,
            userId: data.userId,
            userName: data.userName,
            rating: data.rating,
            comment: data.comment,
            date: data.date,
          });
        });
        
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error loading reviews:', error);
        toast.error('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, []);

  const addReview = async (review: Omit<Review, 'id' | 'date'>) => {
    try {
      const reviewData = {
        ...review,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      // Add to Firestore
      const docRef = doc(collection(db, 'reviews'));
      await setDoc(docRef, reviewData);

      // Update local state
      const newReview: Review = {
        ...reviewData,
        id: docRef.id,
      };
      
      setReviews(prev => [newReview, ...prev]);
      toast.success('Review added successfully!');
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error('Failed to add review');
    }
  };

  const getProductReviews = (productId: string) => {
    return reviews.filter(review => review.productId === productId);
  };

  const getProductAverageRating = (productId: string) => {
    const productReviews = getProductReviews(productId);
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / productReviews.length;
  };

  const getProductTotalReviews = (productId: string) => {
    return getProductReviews(productId).length;
  };

  return (
    <ReviewContext.Provider
      value={{
        reviews,
        addReview,
        getProductReviews,
        getProductAverageRating,
        getProductTotalReviews,
        loading,
      }}
    >
      {children}
    </ReviewContext.Provider>
  );
};
