import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, ArrowLeft, ShoppingBag, Sparkles, Share2, Gift } from "lucide-react";
import { toast } from "sonner";

const Wishlist = () => {
  const { items, removeFromWishlist, clearWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: any) => {
    addToCart(item);
    toast.success('Added to cart!');
  };

  const handleRemoveFromWishlist = (id: string) => {
    removeFromWishlist(id);
    toast.success('Removed from wishlist');
  };

  const handleClearWishlist = () => {
    clearWishlist();
    toast.success('Wishlist cleared');
  };

  const handleAddAllToCart = () => {
    items.forEach(item => addToCart(item));
    toast.success(`Added ${items.length} items to cart!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your wishlist...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-8 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" /> 
            <span className="group-hover:text-primary">Back to Shop</span>
          </Link>
          
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-red-50 to-pink-50 rounded-full mb-6 hover:scale-105 transition-transform duration-300 relative">
              <Heart className="h-16 w-16 text-red-500 fill-red-500 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="h-24 w-24 text-red-200 fill-red-200 animate-ping" />
              </div>
            </div>
            <h2 className="font-display text-3xl font-bold mb-3 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">Your wishlist is empty</h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">Start adding items you love to your wishlist and never lose track of your favorite products!</p>
            <Link to="/products">
              <Button size="lg" className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 mb-2 group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" /> 
              <span className="group-hover:text-primary">Back to Shop</span>
            </Link>
            <h1 className="font-display text-3xl md:text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              <Heart className="h-8 w-8 text-red-500 fill-red-500 animate-pulse" />
              Your Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleAddAllToCart}
              className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:scale-105"
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Add All to Cart
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClearWishlist}
              className="hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-all duration-200 hover:scale-105"
            >
              Clear Wishlist
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold text-red-600">{items.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Gift className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold text-green-600">₹{items.reduce((sum, item) => sum + item.price, 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-xl font-bold text-purple-600">{new Set(items.map(item => item.category)).size}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <Card key={item.id} className="group hover:shadow-2xl transition-all duration-300 border-muted-foreground/10 overflow-hidden transform hover:scale-[1.02]">
              <CardContent className="p-4">
                <div className="relative mb-4">
                  <Link to={`/products/${item.id}`}>
                    <div className="aspect-[3/4] rounded-xl bg-muted overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  </Link>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => handleRemoveFromWishlist(item.id)}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>

                  {/* Quick Add Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-red-500 text-white text-xs hover:bg-red-600 transition-colors duration-200">
                      ❤️ Saved
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs hover:bg-primary/10 transition-colors duration-200">
                      {item.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize hover:border-primary/50 transition-colors duration-200">
                      {item.condition}
                    </Badge>
                  </div>
                  
                  <Link to={`/products/${item.id}`}>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors duration-200 line-clamp-2">
                      {item.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xl text-primary">₹{item.price}</span>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">Wishlist</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transform transition-all duration-200 hover:scale-105"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="mr-2 h-3 w-3" /> Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="hover:border-primary hover:text-primary transition-colors duration-200"
                    >
                      <Link to={`/products/${item.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-muted/50 to-muted rounded-2xl p-8 max-w-3xl mx-auto border border-muted-foreground/10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-6 w-6 text-red-500 fill-red-500 animate-pulse" />
              <h3 className="font-display text-2xl font-bold">Love your wishlist?</h3>
            </div>
            <p className="text-muted-foreground text-lg mb-6 max-w-2xl mx-auto">
              Share your wishlist with friends and family or add items to cart when you're ready to checkout.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handleAddAllToCart}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <ShoppingCart className="mr-2 h-4 w-4" /> Add All to Cart
              </Button>
              <Button 
                variant="outline"
                className="hover:border-primary hover:text-primary transition-all duration-200 hover:scale-105"
              >
                <Share2 className="mr-2 h-4 w-4" /> Share Wishlist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
