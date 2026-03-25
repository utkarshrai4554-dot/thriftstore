import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { collection, query, where, getDocs } from "firebase/firestore";
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        
        // Get all products and filter in JavaScript to avoid index requirement
        const querySnapshot = await getDocs(productsRef);
        
        const sortedProducts = querySnapshot.docs.sort((a, b) => 
          (b.data().createdAt?.toMillis() || 0) - (a.data().createdAt?.toMillis() || 0)
        );
        
        const fetchedProducts: Product[] = [];
        
        sortedProducts.forEach((doc) => {
          const data = doc.data();
          // Only include approved products
          if (data.status === 'approved') {
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
          }
        });
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Shop Products
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover unique pre-loved items at great prices
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold text-foreground mb-2">No products available</h3>
            <p className="text-muted-foreground">Check back soon for new arrivals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard 
                key={p.id} 
                id={p.id}
                name={p.title}
                price={p.sellingPrice}
                category={p.category}
                condition={p.condition}
                image={p.images[0] || '/placeholder.jpg'}
                views={p.views}
                averageRating={0}
                totalReviews={0}
                quantity={p.quantity}
                soldQuantity={p.soldQuantity}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
