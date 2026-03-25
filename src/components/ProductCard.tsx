import { ShoppingCart, Heart, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useReviews } from "@/contexts/ReviewContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  category: string;
  condition: string;
  image: string;
  views: number;
  averageRating?: number;
  totalReviews?: number;
  quantity?: number;
  soldQuantity?: number;
}

const ProductCard = ({ id, name, price, category, condition, image, views, averageRating = 0, totalReviews = 0, quantity = 1, soldQuantity = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, loading: wishlistLoading } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const remainingQuantity = quantity - soldQuantity;
  const isOutOfStock = remainingQuantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to add items to cart');
      navigate('/auth');
      return;
    }
    
    addToCart({ id, name, price, image, category, condition });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to add items to wishlist');
      navigate('/auth');
      return;
    }
    
    const inWishlist = isInWishlist(id);
    
    if (inWishlist) {
      removeFromWishlist(id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({ id, name, price, image, category, condition });
      toast.success('Added to wishlist!');
    }
  };

  return (
    <Link to={`/products/${id}`} className="group block animate-fade-in transform transition-all duration-300 hover:scale-[1.02]">
      <div className="relative overflow-hidden rounded-lg bg-card aspect-[3/4] border border-border shadow-sm hover:shadow-xl transition-all duration-300">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-card-foreground text-xs border-border hover:scale-105 transition-transform">
            {category}
          </Badge>
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              Sold Out
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card hover:scale-110 border-border transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={handleToggleWishlist}
          >
            <Heart className={`h-4 w-4 transition-colors duration-200 ${isInWishlist(id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors duration-200 text-card-foreground">{name}</h3>
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-lg text-card-foreground group-hover:text-primary transition-colors duration-200">₹{price}</span>
          <span className="text-xs text-muted-foreground capitalize group-hover:text-foreground transition-colors duration-200">{condition}</span>
        </div>
        {!isOutOfStock && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="group-hover:text-foreground transition-colors duration-200">Available: {remainingQuantity}</span>
            <span className="text-green-600 font-medium group-hover:text-green-700 transition-colors duration-200">In Stock</span>
          </div>
        )}
        {totalReviews > 0 && (
          <div className="flex items-center gap-1 group-hover:gap-2 transition-all duration-200">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 transition-all duration-200 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400 group-hover:fill-yellow-500 group-hover:text-yellow-500'
                      : 'text-muted-foreground group-hover:text-muted-foreground/70'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-200">
              {averageRating.toFixed(1)} ({totalReviews})
            </span>
          </div>
        )}
        <Button
          size="sm"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-border transform transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:hover:scale-100"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {isOutOfStock ? (
            <>Sold Out</>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4 group-hover:animate-bounce" /> Add to Cart
            </>
          )}
        </Button>
      </div>
    </Link>
  );
};

export default ProductCard;
