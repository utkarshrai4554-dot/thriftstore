import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Heart, User, Package, BarChart3, ShoppingCart, Moon, Sun, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const navLinks = [
  { to: "/products", label: "Shop" },
  { to: "/sell", label: "Sell" },
  { to: "/donate", label: "Donate", icon: Heart },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/admin", label: "Admin", icon: BarChart3 },
  { to: "/delivery", label: "Delivery", icon: Package }
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile, logout } = useAuth();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const location = useLocation();

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  // Filter navLinks based on user role
  const filteredNavLinks = navLinks.filter(link => {
    if (link.to === "/admin" || link.to === "/delivery") {
      return userProfile?.role === 'admin';  // Only admin and delivery for admins
    }
    // Restrict Shop, Sell, and Donate for NGO users
    if (userProfile?.role === 'ngo' && (link.to === "/products" || link.to === "/sell" || link.to === "/donate")) {
      return false;
    }
    return true;  // Show all other links for everyone
  });

  // NGO-specific navigation links
  const ngoNavLinks = [
    { to: "/ngo/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/ngo-accepted-orders", label: "Accepted Orders", icon: Package },
    { to: "/ngo-requested-orders", label: "Requested Orders", icon: ShoppingCart }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="font-display text-2xl font-bold text-primary tracking-tight">
          StyleEase
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {/* Show NGO-specific navigation for NGO users */}
          {userProfile?.role === 'ngo' ? (
            ngoNavLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === l.to ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))
          ) : (
            filteredNavLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === l.to ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          {/* Cart Icon */}
          <Link to="/cart">
            <Button variant="ghost" size="sm" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Wishlist Icon */}
          <Link to="/wishlist">
            <Button variant="ghost" size="sm" className="relative">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Button>
          </Link>

          <button onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Auth Button - Right Corner */}
        <div className="hidden md:flex items-center gap-2">
          {/* Cart Icon */}
          <Link to="/cart">
            <Button variant="ghost" size="sm" className={`relative ${theme === 'dark' ? 'text-card-foreground hover:bg-warm/10' : 'text-foreground hover:bg-muted'}`}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className={`absolute -top-1 -right-1 text-xs rounded-full h-5 w-5 flex items-center justify-center ${theme === 'dark' ? 'bg-warm text-warm-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Wishlist Icon */}
          <Link to="/wishlist">
            <Button variant="ghost" size="sm" className={`relative ${theme === 'dark' ? 'text-card-foreground hover:bg-warm/10' : 'text-foreground hover:bg-muted'}`}>
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className={`absolute -top-1 -right-1 text-xs rounded-full h-5 w-5 flex items-center justify-center ${theme === 'dark' ? 'bg-warm text-warm-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {wishlistCount}
                </span>
              )}
            </Button>
          </Link>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={`relative ${theme === 'dark' ? 'text-card-foreground hover:bg-warm/10' : 'text-foreground hover:bg-muted'}`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`${theme === 'dark' ? 'border-warm text-warm-foreground hover:bg-warm/10' : 'border-primary text-primary hover:bg-primary/10'}`} size="sm">
                  <User className="h-4 w-4 mr-2" />
                  {userProfile?.displayName || user?.email?.split('@')[0]}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600 focus:text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className={`${theme === 'dark' ? 'border-warm text-warm-foreground hover:bg-warm/10' : 'border-primary text-primary hover:bg-primary/10'}`} size="sm">
                Login / Register
              </Button>
            </Link>
          )}
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-card px-4 pb-4 animate-fade-in">
          {/* Mobile Cart and Wishlist */}
          <div className="flex gap-4 py-3 border-b">
            <Link to="/cart" onClick={() => setOpen(false)} className={`flex items-center gap-2 ${theme === 'dark' ? 'text-card-foreground hover:text-warm-foreground' : 'text-foreground hover:text-primary'}`}>
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className={`text-xs rounded-full px-2 py-1 ${theme === 'dark' ? 'bg-warm text-warm-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {cartCount}
                </span>
              )}
            </Link>
            <Link to="/wishlist" onClick={() => setOpen(false)} className={`flex items-center gap-2 ${theme === 'dark' ? 'text-card-foreground hover:text-warm-foreground' : 'text-foreground hover:text-primary'}`}>
              <Heart className="h-5 w-5" />
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className={`text-xs rounded-full px-2 py-1 ${theme === 'dark' ? 'bg-warm text-warm-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {wishlistCount}
                </span>
              )}
            </Link>
          </div>
          
          {/* Mobile Navigation Links */}
          {userProfile?.role === 'ngo' ? (
            ngoNavLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {l.label}
              </Link>
            ))
          ) : (
            filteredNavLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                {l.label}
              </Link>
            ))
          )}
          <div className="flex gap-2 pt-2">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="border-warm text-warm-foreground hover:bg-warm/10" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {userProfile?.displayName || user?.email?.split('@')[0]}
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }} 
                  className="border-red-500 text-red-500 hover:bg-red-50" 
                  size="sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)}>
                <Button variant="outline" className="border-warm text-warm-foreground hover:bg-warm/10" size="sm">
                  Login / Register
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
