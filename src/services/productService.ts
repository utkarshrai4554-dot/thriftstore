import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const updateProductSoldQuantity = async (productId: string, soldQuantity: number) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      const currentData = productDoc.data();
      const currentSoldQuantity = currentData?.soldQuantity || 0;
      
      await updateDoc(productRef, {
        soldQuantity: currentSoldQuantity + soldQuantity,
        updatedAt: new Date()
      });
      
      console.log(`✅ Updated product ${productId}: sold ${currentSoldQuantity + soldQuantity} units`);
    }
  } catch (error) {
    console.error('❌ Error updating product quantity:', error);
    throw error;
  }
};

export const getProductById = async (productId: string) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      return {
        id: productDoc.id,
        ...productDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    throw error;
  }
};
