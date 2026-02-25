import { Eye, ShoppingCart, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
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
}

const ProductCard = ({ id, name, price, category, condition, image, views }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist, loading: wishlistLoading } = useWishlist();
  const { user } = useAuth();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    
    addToCart({ id, name, price, image, category, condition });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please login to add items to wishlist');
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
    <Link to={`/products/${id}`} className="group block animate-fade-in">
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[3/4]">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground text-xs">
            {category}
          </Badge>
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-muted-foreground">
          <Eye className="h-3 w-3" /> {views}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-sm hover:bg-card"
            onClick={handleToggleWishlist}
          >
            <Heart className={`h-4 w-4 ${isInWishlist(id) ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{name}</h3>
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-lg">₹{price}</span>
          <span className="text-xs text-muted-foreground capitalize">{condition}</span>
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
        </Button>
      </div>
    </Link>
  );
};

export default ProductCard;
