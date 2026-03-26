import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageURL: string;
  description?: string;
  tags?: string[];
  gender?: string;
  color?: string;
  style?: string;
  size?: string;
  brand?: string;
  condition?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QueryConstraint {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'array-contains-any' | 'in';
  value: any;
}

/**
 * Get products with dynamic filtering
 */
export async function getProductsByFilters(constraints: QueryConstraint[]): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    
    // Build query with constraints
    let q = query(productsRef);
    
    constraints.forEach(constraint => {
      q = query(q, where(constraint.field, constraint.operator, constraint.value));
    });

    // Add ordering and limit
    q = query(q, orderBy('createdAt', 'desc'), limit(50));

    const querySnapshot = await getDocs(q);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
        price: Number(data.price) || 0,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Product);
    });

    return products;
  } catch (error) {
    console.error('Error fetching products with filters:', error);
    return [];
  }
}

/**
 * Search products by text query
 */
export async function searchProducts(searchQuery: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    
    // Create a simple text search by checking multiple fields
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const products: Product[] = [];

    // Get all products (for demo - in production, implement proper full-text search)
    const q = query(productsRef, orderBy('createdAt', 'desc'), limit(100));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const product = {
        id: doc.id,
        ...data,
        price: Number(data.price) || 0,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Product;

      // Simple text matching
      const searchText = [
        product.name,
        product.description,
        product.category,
        product.tags?.join(' '),
        product.color,
        product.style,
        product.brand
      ].join(' ').toLowerCase();

      const matchesAllTerms = searchTerms.every(term => searchText.includes(term));
      
      if (matchesAllTerms) {
        products.push(product);
      }
    });

    return products.slice(0, 50); // Limit results
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

/**
 * Get product by ID
 */
export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const productDoc = doc(db, 'products', productId);
    const docSnapshot = await getDoc(productDoc);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        price: Number(data.price) || 0,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Product;
    }

    return null;
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
}

/**
 * Get trending products (most recently added with high engagement)
 */
export async function getTrendingProducts(limitCount: number = 10): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
        price: Number(data.price) || 0,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Product);
    });

    return products;
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return [];
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string, limitCount: number = 20): Promise<Product[]> {
  try {
    return await getProductsByFilters([
      { field: 'category', operator: '==', value: category }
    ]);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

/**
 * Get products in price range
 */
export async function getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
  try {
    return await getProductsByFilters([
      { field: 'price', operator: '>=', value: minPrice },
      { field: 'price', operator: '<=', value: maxPrice }
    ]);
  } catch (error) {
    console.error('Error fetching products by price range:', error);
    return [];
  }
}

/**
 * Get similar products based on tags, category, and style
 */
export async function getSimilarProducts(productId: string, limitCount: number = 6): Promise<Product[]> {
  try {
    const baseProduct = await getProductById(productId);
    if (!baseProduct) return [];

    const productsRef = collection(db, 'products');
    const constraints: QueryConstraint[] = [
      { field: 'id', operator: '!=', value: productId }
    ];

    // Try to match by category first
    if (baseProduct.category) {
      constraints.push({ field: 'category', operator: '==', value: baseProduct.category });
    }

    // Add style match if available
    if (baseProduct.style) {
      constraints.push({ field: 'style', operator: '==', value: baseProduct.style });
    }

    const similarProducts = await getProductsByFilters(constraints);

    // If we don't have enough similar products, get more by category only
    if (similarProducts.length < limitCount && baseProduct.category) {
      const categoryProducts = await getProductsByCategory(baseProduct.category, limitCount);
      const additionalProducts = categoryProducts.filter(p => p.id !== productId);
      
      // Merge and deduplicate
      const allProducts = [...similarProducts];
      additionalProducts.forEach(product => {
        if (!allProducts.find(p => p.id === product.id)) {
          allProducts.push(product);
        }
      });

      return allProducts.slice(0, limitCount);
    }

    return similarProducts.slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching similar products:', error);
    return [];
  }
}

/**
 * Get products with multiple tags
 */
export async function getProductsWithTags(tags: string[]): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('tags', 'array-contains-any', tags),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const querySnapshot = await getDocs(q);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        ...data,
        price: Number(data.price) || 0,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Product);
    });

    return products;
  } catch (error) {
    console.error('Error fetching products with tags:', error);
    return [];
  }
}

/**
 * Advanced product search with multiple criteria
 */
export async function advancedProductSearch(searchParams: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  style?: string;
  gender?: string;
  tags?: string[];
  limit?: number;
}): Promise<Product[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (searchParams.category) {
      constraints.push({ field: 'category', operator: '==', value: searchParams.category });
    }

    if (searchParams.minPrice !== undefined) {
      constraints.push({ field: 'price', operator: '>=', value: searchParams.minPrice });
    }

    if (searchParams.maxPrice !== undefined) {
      constraints.push({ field: 'price', operator: '<=', value: searchParams.maxPrice });
    }

    if (searchParams.color) {
      constraints.push({ field: 'color', operator: '==', value: searchParams.color });
    }

    if (searchParams.style) {
      constraints.push({ field: 'style', operator: '==', value: searchParams.style });
    }

    if (searchParams.gender) {
      constraints.push({ field: 'gender', operator: '==', value: searchParams.gender });
    }

    if (searchParams.tags && searchParams.tags.length > 0) {
      constraints.push({ field: 'tags', operator: 'array-contains-any', value: searchParams.tags });
    }

    // If we have filters, use them
    if (constraints.length > 0) {
      const products = await getProductsByFilters(constraints);
      
      // If there's also a text query, filter the results further
      if (searchParams.query) {
        const searchTerms = searchParams.query.toLowerCase().split(' ');
        return products.filter(product => {
          const searchText = [
            product.name,
            product.description,
            product.category,
            product.tags?.join(' '),
            product.color,
            product.style,
            product.brand
          ].join(' ').toLowerCase();

          return searchTerms.every(term => searchText.includes(term));
        });
      }

      return products.slice(0, searchParams.limit || 50);
    }

    // If only text query, use search function
    if (searchParams.query) {
      return await searchProducts(searchParams.query);
    }

    return [];
  } catch (error) {
    console.error('Error in advanced product search:', error);
    return [];
  }
}
