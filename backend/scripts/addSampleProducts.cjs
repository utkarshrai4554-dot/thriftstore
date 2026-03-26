const { admin } = require('../config/firebase.cjs');

// Sample products based on mockData.ts
const sampleProducts = [
  {
    title: "Vintage Leather Jacket",
    brand: "Vintage Brand",
    category: "Clothes",
    color: "Brown",
    size: "M",
    condition: "good",
    originalPrice: 150,
    sellingPrice: 89,
    description: "Beautiful vintage leather jacket in great condition. Minor wear on the cuffs.",
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop"],
    sellerId: "sample-seller-1",
    status: 'approved',
    quantity: 1,
    soldQuantity: 0,
    views: 234,
    likes: 12
  },
  {
    title: "Retro Gold Necklace",
    brand: "Vintage Jewelry",
    category: "Jewellery",
    condition: "excellent",
    originalPrice: 60,
    sellingPrice: 35,
    description: "Stunning vintage gold necklace with intricate detailing.",
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop"],
    sellerId: "sample-seller-2",
    status: 'approved',
    quantity: 1,
    soldQuantity: 0,
    views: 180,
    likes: 8
  },
  {
    title: "Classic Canvas Sneakers",
    brand: "Classic Footwear",
    category: "Shoes",
    color: "White",
    size: "9",
    condition: "fair",
    originalPrice: 50,
    sellingPrice: 28,
    description: "Classic canvas sneakers with some wear but plenty of life left.",
    images: ["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=500&fit=crop"],
    sellerId: "sample-seller-3",
    status: 'approved',
    quantity: 2,
    soldQuantity: 0,
    views: 156,
    likes: 5
  },
  {
    title: "Art Deco Vase",
    brand: "Antique Decor",
    category: "Artifacts",
    condition: "excellent",
    originalPrice: 120,
    sellingPrice: 65,
    description: "Gorgeous Art Deco vase in perfect condition.",
    images: ["https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&h=500&fit=crop"],
    sellerId: "sample-seller-4",
    status: 'approved',
    quantity: 1,
    soldQuantity: 0,
    views: 312,
    likes: 15
  },
  {
    title: "Floral Midi Dress",
    brand: "Fashion Brand",
    category: "Clothes",
    color: "Multi",
    size: "S",
    condition: "good",
    originalPrice: 80,
    sellingPrice: 42,
    description: "Beautiful floral midi dress, perfect for summer.",
    images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop"],
    sellerId: "sample-seller-5",
    status: 'approved',
    quantity: 1,
    soldQuantity: 0,
    views: 98,
    likes: 7
  },
  {
    title: "Antique Pocket Watch",
    brand: "Vintage Timepieces",
    category: "Vintage",
    condition: "good",
    originalPrice: 200,
    sellingPrice: 120,
    description: "Rare antique pocket watch, still keeps time.",
    images: ["https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=400&h=500&fit=crop"],
    sellerId: "sample-seller-6",
    status: 'approved',
    quantity: 1,
    soldQuantity: 0,
    views: 445,
    likes: 22
  },
  {
    title: "Suede Ankle Boots",
    brand: "Boot Maker",
    category: "Shoes",
    color: "Tan",
    size: "8",
    condition: "good",
    originalPrice: 90,
    sellingPrice: 55,
    description: "Quality suede boots with minor scuffing.",
    images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop"],
    sellerId: "sample-seller-7",
    status: 'approved',
    quantity: 1,
    soldQuantity: 0,
    views: 201,
    likes: 9
  },
  {
    title: "Beaded Bracelet Set",
    brand: "Handmade Jewelry",
    category: "Jewellery",
    condition: "excellent",
    originalPrice: 30,
    sellingPrice: 18,
    description: "Handmade beaded bracelet set, like new.",
    images: ["https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=500&fit=crop"],
    sellerId: "sample-seller-8",
    status: 'approved',
    quantity: 3,
    soldQuantity: 0,
    views: 89,
    likes: 4
  }
];

async function addSampleProducts() {
  try {
    console.log('✅ Adding sample products...');
    
    const productsRef = admin.firestore().collection('products');
    
    // Clear existing products first
    const existingSnapshot = await productsRef.get();
    if (!existingSnapshot.empty) {
      console.log(`🗑️ Clearing ${existingSnapshot.size} existing products...`);
      const batch = admin.firestore().batch();
      existingSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    
    // Add sample products
    let addedCount = 0;
    for (const product of sampleProducts) {
      const productData = {
        ...product,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await productsRef.add(productData);
      console.log(`✅ Added: ${product.title}`);
      addedCount++;
    }
    
    console.log(`\n🎉 Success! Added ${addedCount} sample products.`);
    console.log(`🌐 Shop Page: http://localhost:8081/products`);
    console.log(`🛍️ Products should now be visible!`);
    
  } catch (error) {
    console.error('❌ Error adding sample products:', error);
  }
}

// Run the script
addSampleProducts().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
