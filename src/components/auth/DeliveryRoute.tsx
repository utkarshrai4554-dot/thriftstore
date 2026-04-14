import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface DeliveryRouteProps {
  children: ReactNode;
}

export const DeliveryRoute: React.FC<DeliveryRouteProps> = ({ children }) => {
  const { user, userProfile, loading } = useAuth();

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

  // Check if user has delivery role from userProfile
  // If userProfile is not yet loaded, show loading state
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  const isDeliveryAgent = userProfile.role === 'delivery';
  
  if (isDeliveryAgent) {
    return <>{children}</>;
  }

  // If user exists but is not delivery agent, redirect to delivery login
  return <Navigate to="/delivery-login" replace />;
};
