import { useParams, Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Heart, Share2, Star } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useReviews } from "@/contexts/ReviewContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { getProductAverageRating, getProductTotalReviews } = useReviews();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        // First try to get from products collection (approved products)
        const productRef = doc(db, 'products', id);
        const productDoc = await getDoc(productRef);
        
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() });
        } else {
          // If not found in products, try sellProducts collection (pending products)
          const sellProductRef = doc(db, 'sellProducts', id);
          const sellProductDoc = await getDoc(sellProductRef);
          
          if (sellProductDoc.exists()) {
            setProduct({ id: sellProductDoc.id, ...sellProductDoc.data() });
          } else {
            setProduct(null);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const averageRating = getProductAverageRating(id || '');
  const totalReviews = getProductTotalReviews(id || '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

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
      name: product.title || product.name, 
      price: product.sellingPrice || product.price, 
      image: product.images?.[0] || product.image, 
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
        name: product.title || product.name, 
        price: product.sellingPrice || product.price, 
        image: product.images?.[0] || product.image, 
        category: product.category, 
        condition: product.condition 
      });
      toast.success('Added to wishlist!');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title || product.name,
        text: `Check out this ${product.title || product.name} on StyleEase!`,
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
            <img src={product.images?.[0] || product.image} alt={product.title || product.name} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{product.category}</Badge>
                <Badge variant="outline" className="capitalize">{product.condition}</Badge>
              </div>
              <h1 className="font-display text-3xl font-bold mb-2" style={{ color: 'hsl(var(--dark-brown))' }}>{product.title || product.name}</h1>
              <p className="font-display text-4xl font-bold text-primary mb-2">₹{product.sellingPrice || product.price}</p>
              {totalReviews > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {averageRating.toFixed(1)} ({totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6" style={{ color: 'hsl(var(--dark-brown))' }}>{product.description}</p>

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

        {/* Reviews Section */}
        <div className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold mb-2">Customer Reviews</h2>
            <p className="text-muted-foreground">See what others think about this product</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <ReviewForm productId={product.id} productName={product.title || product.name} />
            </div>
            <div>
              <ReviewList productId={product.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
