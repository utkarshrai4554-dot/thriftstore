import { Eye, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{name}</h3>
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-lg">${price}</span>
          <span className="text-xs text-muted-foreground capitalize">{condition}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
