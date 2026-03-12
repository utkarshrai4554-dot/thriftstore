import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ReviewProvider } from "@/contexts/ReviewContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import AdminLogin from "@/pages/AdminLogin";
import AdminOrders from "@/pages/AdminOrders";
import BuyOrders from "@/pages/BuyOrders";
import Index from "./pages/Index";
import GetStarted from "./pages/GetStarted";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import SellProduct from "./pages/SellProduct";
import Donate from "./pages/Donate";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import OrderTracking from "./pages/OrderTracking";
import Orders from "./pages/Orders";
import AdminDashboard from "./pages/AdminDashboard";
import AdminNGOApproval from "./pages/AdminNGOApproval";
import NGODashboard from "./pages/NGODashboard";
import NGORegister from "./pages/NGORegister";
import NGOLogin from "./pages/NGOLogin";
import NGOAcceptedOrders from "./pages/NGOAcceptedOrders";
import NGORequestedOrders from "./pages/NGORequestedOrders";
import AdminDonationAssignment from "./pages/AdminDonationAssignment";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import TestAuth from "./pages/TestAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/test-auth" element={<TestAuth />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sell" 
          element={
            <ProtectedRoute>
              <SellProduct />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/donate" 
          element={
            <ProtectedRoute>
              <Donate />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/login" 
          element={<AdminLogin />} 
        />
        <Route 
          path="/admin/orders" 
          element={
            <AdminRoute>
              <AdminOrders />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/products" 
          element={
            <AdminRoute>
              <AdminNGOApproval />
            </AdminRoute>
          } 
        />
        <Route 
          path="/ngo-register" 
          element={<NGORegister />} 
        />
        <Route 
          path="/ngo-login" 
          element={<NGOLogin />} 
        />
        <Route 
          path="/admin/ngo-approval" 
          element={
            <AdminRoute>
              <AdminNGOApproval />
            </AdminRoute>
          } 
        />
        <Route 
          path="/ngo-dashboard" 
          element={
            <ProtectedRoute>
              <NGODashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ngo-accepted-orders" 
          element={
            <ProtectedRoute>
              <NGOAcceptedOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ngo-requested-orders" 
          element={
            <ProtectedRoute>
              <NGORequestedOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/donation-assignment" 
          element={
            <AdminRoute>
              <AdminDonationAssignment />
            </AdminRoute>
          } 
        />
        <Route 
          path="/my-orders" 
          element={
            <ProtectedRoute>
              <BuyOrders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route 
          path="/delivery" 
          element={
            <AdminRoute>
              <DeliveryDashboard />
            </AdminRoute>
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ReviewProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </ReviewProvider>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
