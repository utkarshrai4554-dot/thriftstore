import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Dashboard = () => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Check if user has permission to access dashboard
  const userRole = userProfile?.role || 'customer';
  const hasAccess = userRole === 'admin';

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  // If user is not admin, show unauthorized access
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              You don't have permission to access the dashboard. This area is restricted to admin personnel only.
            </p>
            <Alert className="mb-6 max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your current role: <strong>{userRole}</strong>. If you believe this is an error, please contact an administrator.
              </AlertDescription>
            </Alert>
            <div className="flex gap-4">
              <Button onClick={() => navigate("/")}>
                Go to Homepage
              </Button>
              <Button variant="outline" onClick={() => navigate("/profile")}>
                View Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {userProfile?.displayName || user?.email}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {userProfile?.displayName || 'Not set'}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>User ID:</strong> {user?.uid}</p>
                <p><strong>Status:</strong> {userProfile?.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Member since:</strong> {userProfile?.createdAt ? new Date(userProfile.createdAt.toDate ? userProfile.createdAt.toDate() : userProfile.createdAt).toLocaleDateString() : 'Unknown'}</p>
                <p><strong>Last Login:</strong> {userProfile?.lastLoginAt ? new Date(userProfile.lastLoginAt.toDate ? userProfile.lastLoginAt.toDate() : userProfile.lastLoginAt).toLocaleDateString() : 'Never'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/products")}
              >
                Browse Products
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/sell")}
              >
                Sell Product
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/donate")}
              >
                Donate Item
              </Button>
            </CardContent>
          </Card>

          {/* Account Management Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/orders")}
              >
                View Orders
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/chat")}
              >
                Messages
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
