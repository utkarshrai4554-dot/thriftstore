import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Heart, MessageCircle, User, Package, BarChart3, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const navLinks = [
  { to: "/products", label: "Shop" },
  { to: "/sell", label: "Sell" },
  { to: "/donate", label: "Donate" },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/admin", label: "Admin", icon: BarChart3 },
  { to: "/delivery", label: "Delivery", icon: Package }
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const location = useLocation();

  const cartCount = getCartCount();
  const wishlistCount = getWishlistCount();

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="font-display text-2xl font-bold text-primary tracking-tight">
          StyleEase
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === l.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
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

          {user ? (
            <Link to="/dashboard">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" size="sm">
                <User className="h-4 w-4 mr-2" />
                {userProfile?.displayName || user?.email?.split('@')[0]}
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" size="sm">
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
            <Link to="/cart" onClick={() => setOpen(false)} className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link to="/wishlist" onClick={() => setOpen(false)} className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </div>
          
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-2">
            <Link to="/admin" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm">Admin</Button>
            </Link>
            <Link to="/delivery" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm">Delivery</Button>
            </Link>
            {user ? (
              <Link to="/dashboard" onClick={() => setOpen(false)}>
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  {userProfile?.displayName || user?.email?.split('@')[0]}
                </Button>
              </Link>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)}>
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" size="sm">
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
