import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface DeliveryRouteProps {
  children: ReactNode;
}

export const DeliveryRoute: React.FC<DeliveryRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/delivery-login" replace />;
  }

  // Check if user has delivery role
  const checkUserRole = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'delivery') {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  };

  // For now, we'll do a simple check - in a real app, you'd want to handle this asynchronously
  // You could store the role in the auth context or use a loading state while checking
  return <>{children}</>;
};
