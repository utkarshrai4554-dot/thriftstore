import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BirthdayBonusAlert } from "@/components/BirthdayBonusAlert";
import { categories, conditions } from "@/lib/mockData";
import { useReviews } from "@/contexts/ReviewContext";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  color?: string;
  size?: string;
  condition: string;
  originalPrice?: number;
  sellingPrice: number;
  description: string;
  images: string[];
  sellerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'sold';
  quantity: number;
  soldQuantity: number;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

const Products = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [condition, setCondition] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { getProductAverageRating, getProductTotalReviews } = useReviews();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const q = query(
          productsRef,
          where('status', '==', 'approved')
        );
        
        // Sort in JavaScript instead of Firestore query to avoid index requirement
        const querySnapshot = await getDocs(q);
        const sortedProducts = querySnapshot.docs.sort((a, b) => 
          (b.data().createdAt?.toMillis() || 0) - (a.data().createdAt?.toMillis() || 0)
        );
        const fetchedProducts: Product[] = [];
        
        sortedProducts.forEach((doc) => {
          const data = doc.data();
          fetchedProducts.push({
            id: doc.id,
            title: data.title || '',
            brand: data.brand || '',
            category: data.category || '',
            color: data.color,
            size: data.size,
            condition: data.condition || 'Good',
            originalPrice: data.originalPrice,
            sellingPrice: data.sellingPrice || 0,
            description: data.description || '',
            images: data.images || [],
            sellerId: data.sellerId || '',
            status: data.status || 'approved',
            quantity: data.quantity || 1,
            soldQuantity: data.soldQuantity || 0,
            views: data.views || 0,
            likes: data.likes || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          });
        });
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    
    // Set up interval to refresh products every 30 seconds
    const interval = setInterval(fetchProducts, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || p.category === category;
    const matchCondition = condition === "All" || p.condition === condition;
    const hasQuantity = (p.quantity - (p.soldQuantity || 0)) > 0;
    return matchSearch && matchCategory && matchCondition && hasQuantity;
  });

  return (
    <div className="min-h-screen py-8">
      <BirthdayBonusAlert />
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Shop Pre-Loved</h1>
          <p className="text-muted-foreground">Discover unique finds at great prices</p>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">Categories</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge
                key={c}
                variant={category === c ? "default" : "outline"}
                className="cursor-pointer px-3 py-1"
                onClick={() => setCategory(c)}
              >
                {c}
              </Badge>
            ))}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-card rounded-xl border animate-fade-in">
            <div>
              <p className="text-sm font-medium mb-2">Condition</p>
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <Badge
                    key={c}
                    variant={condition === c ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => setCondition(c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading products...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{filtered.length} items found</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((p) => (
                <ProductCard 
                  key={p.id} 
                  id={p.id}
                  name={p.title}
                  price={p.sellingPrice}
                  category={p.category}
                  condition={p.condition}
                  image={p.images[0] || '/placeholder.jpg'}
                  views={p.views}
                  averageRating={getProductAverageRating(p.id)}
                  totalReviews={getProductTotalReviews(p.id)}
                  quantity={p.quantity}
                  soldQuantity={p.soldQuantity}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">
                  {products.length === 0 
                    ? "No approved products available yet. Check back soon!" 
                    : "No products match your filters."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;
