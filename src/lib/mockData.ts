export const mockProducts = [
  { id: "1", name: "Vintage Leather Jacket", price: 89, category: "Clothes", condition: "good", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop", views: 234, age: "5 years", description: "Beautiful vintage leather jacket in great condition. Minor wear on the cuffs.", reviews: [], averageRating: 0, totalReviews: 0 },
  { id: "2", name: "Retro Gold Necklace", price: 35, category: "Jewellery", condition: "excellent", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop", views: 180, age: "10 years", description: "Stunning vintage gold necklace with intricate detailing.", reviews: [], averageRating: 0, totalReviews: 0 },
  { id: "3", name: "Classic Canvas Sneakers", price: 28, category: "Shoes", condition: "fair", image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=500&fit=crop", views: 156, age: "2 years", description: "Classic canvas sneakers with some wear but plenty of life left.", reviews: [], averageRating: 0, totalReviews: 0 },
  { id: "4", name: "Art Deco Vase", price: 65, category: "Artifacts", condition: "excellent", image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&h=500&fit=crop", views: 312, age: "30 years", description: "Gorgeous Art Deco vase in perfect condition.", reviews: [], averageRating: 0, totalReviews: 0 },
  { id: "5", name: "Floral Midi Dress", price: 42, category: "Clothes", condition: "good", image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop", views: 98, age: "3 years", description: "Beautiful floral midi dress, perfect for summer.", reviews: [], averageRating: 0, totalReviews: 0 },
  { id: "6", name: "Antique Pocket Watch", price: 120, category: "Vintage", condition: "good", image: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=400&h=500&fit=crop", views: 445, age: "50 years", description: "Rare antique pocket watch, still keeps time.", reviews: [], averageRating: 0, totalReviews: 0 },
  { id: "7", name: "Suede Ankle Boots", price: 55, category: "Shoes", condition: "good", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop", views: 201, age: "4 years", description: "Quality suede boots with minor scuffing.", reviews: [], averageRating: 0, totalReviews: 0 },
  { id: "8", name: "Beaded Bracelet Set", price: 18, category: "Jewellery", condition: "excellent", image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=500&fit=crop", views: 89, age: "1 year", description: "Handmade beaded bracelet set, like new.", reviews: [], averageRating: 0, totalReviews: 0 },
];

export const categories = ["All", "Clothes", "Shoes", "Jewellery", "Artifacts", "Vintage", "Others"];
export const conditions = ["All", "excellent", "good", "fair", "poor"];

export const rewardTiers = [
  { points: 50, discount: "2%", delivery: "Standard" },
  { points: 100, discount: "5%", delivery: "Standard" },
  { points: 200, discount: "12%", delivery: "Standard" },
  { points: 300, discount: "20%", delivery: "Standard" },
  { points: 400, discount: "22%", delivery: "50% off delivery" },
  { points: 600, discount: "25%", delivery: "Free delivery" },
];

export const donationCauses = ["Charity", "Poor Families", "NGOs", "Disaster Relief"];

export const mockOrders = [
  { id: "ORD001", product: "Vintage Leather Jacket", status: "Transporting", buyer: "Jane D.", date: "2026-02-10" },
  { id: "ORD002", product: "Retro Gold Necklace", status: "Picked up", buyer: "Alex M.", date: "2026-02-11" },
  { id: "ORD003", product: "Art Deco Vase", status: "Delivered", buyer: "Sam K.", date: "2026-02-08" },
];

export const mockChats = [
  { id: "1", name: "Jane Doe", lastMessage: "Is this still available?", time: "2m ago", avatar: "J" },
  { id: "2", name: "Alex Morgan", lastMessage: "Thanks for the quick reply!", time: "1h ago", avatar: "A" },
  { id: "3", name: "Sam Kim", lastMessage: "Can you do ₹30?", time: "3h ago", avatar: "S" },
];
