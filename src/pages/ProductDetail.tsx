import { useParams, Link, useNavigate } from "react-router-dom";
import { mockProducts } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, ShoppingCart, Heart, Share2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = mockProducts.find((p) => p.id === id);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Product Not Found</h2>
          <Link to="/products" className="text-primary hover:underline">Back to shop</Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }
    
    addToCart({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      image: product.image, 
      category: product.category, 
      condition: product.condition 
    });
    toast.success('Added to cart!');
  };

  const handleToggleWishlist = () => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      navigate('/auth');
      return;
    }
    
    const inWishlist = isInWishlist(product.id);
    
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({ 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        image: product.image, 
        category: product.category, 
        condition: product.condition 
      });
      toast.success('Added to wishlist!');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out this ${product.name} on StyleEase!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="rounded-xl overflow-hidden bg-muted aspect-[3/4]">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{product.category}</Badge>
                <Badge variant="outline" className="capitalize">{product.condition}</Badge>
              </div>
              <h1 className="font-display text-3xl font-bold mb-2">{product.name}</h1>
              <p className="font-display text-4xl font-bold text-primary">₹{product.price}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {product.views} views</span>
              <span>Age: {product.age}</span>
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            <div className="border-t pt-6 space-y-3">
              <Button size="lg" className="w-full text-base" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="flex-1" onClick={handleToggleWishlist}>
                  <Heart className={`mr-2 h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} /> 
                  {isInWishlist(product.id) ? 'Remove from Wishlist' : 'Wishlist'}
                </Button>
                <Button variant="outline" size="lg" className="flex-1" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            <div className="bg-muted rounded-xl p-4 text-sm">
              <p className="font-medium mb-1">✨ Earn 10 reward points with this purchase</p>
              <p className="text-muted-foreground">Upload original bill for 50 bonus points after admin verification.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
