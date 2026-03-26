import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, ArrowLeft, ShoppingBag } from "lucide-react";
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
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
          
          <div className="text-center py-16">
            <div className="relative">
              <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="h-12 w-12 text-muted-foreground/30" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Start adding items you love to your wishlist!</p>
            <Link to="/products">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddAllToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Add All to Cart
            </Button>
            <Button variant="outline" onClick={handleClearWishlist}>
              Clear Wishlist
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            Your Wishlist ({items.length} items)
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="relative mb-4">
                  <Link to={`/products/${item.id}`}>
                    <div className="aspect-[3/4] rounded-lg bg-muted overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card"
                    onClick={() => handleRemoveFromWishlist(item.id)}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.condition}
                    </Badge>
                  </div>
                  
                  <Link to={`/products/${item.id}`}>
                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-lg">₹{item.price}</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="mr-2 h-3 w-3" /> Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
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

        <div className="mt-12 text-center">
          <div className="bg-muted rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="font-display text-xl font-bold mb-2">Love your wishlist?</h3>
            <p className="text-muted-foreground mb-4">
              Share your wishlist with friends and family or add items to cart when you're ready to checkout.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleAddAllToCart}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Add All to Cart
              </Button>
              <Button variant="outline">
                Share Wishlist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
