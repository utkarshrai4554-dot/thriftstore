import { useParams, Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Heart, Share2, Star, Truck, Shield, Sparkles, Package } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useReviews } from "@/contexts/ReviewContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReviewForm from "@/components/ReviewForm";
import ReviewList from "@/components/ReviewList";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
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
          const productData = { id: productDoc.id, ...productDoc.data() };
          setProduct(productData);
          
          // Increment view count
          try {
            await updateDoc(productRef, {
              views: ((productData as any).views || 0) + 1
            });
          } catch (error) {
            console.error('Error updating views:', error);
          }
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
    <div className="min-h-screen py-8 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 mb-6 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" /> 
          <span className="group-hover:text-primary">Back to Shop</span>
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden bg-muted aspect-[3/4] shadow-xl hover:shadow-2xl transition-all duration-300">
              <img 
                src={product.images?.[selectedImage] || product.image} 
                alt={product.title || product.name} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
              />
            </div>
            
            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                      selectedImage === index ? 'border-primary shadow-md' : 'border-muted-foreground/20 hover:border-primary/50'
                    }`}
                  >
                    <img src={image} alt={`Product view ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200">
                  {product.category}
                </Badge>
                <Badge variant="outline" className="capitalize hover:border-primary/50 transition-colors duration-200">
                  {product.condition}
                </Badge>
                {(product.views || 0) > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    👁️ {(product.views || 0).toLocaleString()} views
                  </Badge>
                )}
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {product.title || product.name}
              </h1>
              <div className="flex items-center gap-4 mb-4">
                <p className="font-display text-4xl font-bold text-primary">₹{product.sellingPrice || product.price}</p>
                {product.originalPrice && product.originalPrice > (product.sellingPrice || product.price) && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-muted-foreground line-through">₹{product.originalPrice}</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200">
                      {Math.round((1 - (product.sellingPrice || product.price) / product.originalPrice) * 100)}% OFF
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Rating */}
              {totalReviews > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 transition-all duration-200 ${
                          star <= Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-muted/50 rounded-xl p-6 border border-muted-foreground/10">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Product Details
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
              
              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-muted-foreground/10">
                {product.brand && (
                  <div>
                    <span className="text-xs text-muted-foreground">Brand</span>
                    <p className="font-medium text-foreground">{product.brand}</p>
                  </div>
                )}
                {product.color && (
                  <div>
                    <span className="text-xs text-muted-foreground">Color</span>
                    <p className="font-medium text-foreground capitalize">{product.color}</p>
                  </div>
                )}
                {product.size && (
                  <div>
                    <span className="text-xs text-muted-foreground">Size</span>
                    <p className="font-medium text-foreground">{product.size}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground">Condition</span>
                  <p className="font-medium text-foreground capitalize">{product.condition}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transform transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl" 
                onClick={handleAddToCart}
                disabled={(product.quantity || 1) - (product.soldQuantity || 0) <= 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> 
                {(product.quantity || 1) - (product.soldQuantity || 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className={`transform transition-all duration-200 hover:scale-105 ${
                    isInWishlist(product.id) ? 'border-red-200 text-red-600 hover:bg-red-50' : 'hover:border-primary hover:text-primary'
                  }`}
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`mr-2 h-4 w-4 transition-colors duration-200 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} /> 
                  {isInWishlist(product.id) ? 'Saved' : 'Wishlist'}
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="transform transition-all duration-200 hover:scale-105 hover:border-primary hover:text-primary"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-muted-foreground/10 hover:bg-muted transition-colors duration-200">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Free Delivery</p>
                  <p className="text-xs text-muted-foreground">On orders above ₹499</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-muted-foreground/10 hover:bg-muted transition-colors duration-200">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Verified Quality</p>
                  <p className="text-xs text-muted-foreground">100% authentic</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-muted-foreground/10 hover:bg-muted transition-colors duration-200">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Rewards</p>
                  <p className="text-xs text-muted-foreground">Earn 10 points</p>
                </div>
              </div>
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
