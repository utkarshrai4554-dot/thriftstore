import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, Gift, Percent, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { updateProductSoldQuantity } from "@/services/productService";
import { createOrder, updatePaymentStatus, cancelOrder } from "@/services/orderService";
import { validateCoupon, useCoupon, getUserPoints, addUserPoints, redeemPoints } from "@/services/couponService";
import { saveUpdatedRewardPoints, getUserProfile, deductBonusPoints, addBackBonusPoints } from "@/services/userService";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Cart = () => {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart, loading } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [userPoints, setUserPoints] = useState<any>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      toast.success('Item removed from cart');
    } else if (newQuantity > 1) {
      // Let the context handle the toast for quantity > 1
      updateQuantity(id, newQuantity);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  // Load user points from user profile (bonus points) instead of coupon service
  useEffect(() => {
    if (user) {
      // Get bonus points from user profile
      getUserProfile(user.uid).then(profile => {
        if (profile) {
          setUserPoints({ points: profile.rewardPoints || 0 });
          console.log(`🔍 Loaded bonus points from profile: ${profile.rewardPoints || 0}`);
        } else {
          setUserPoints({ points: 0 });
          console.log('🔍 No user profile found, setting points to 0');
        }
      }).catch(error => {
        console.error('❌ Error loading user profile:', error);
        setUserPoints({ points: 0 });
      });
    }
  }, [user]);

  // Calculate tiered bonus points based on order amount
  const getTieredBonus = (orderAmount: number) => {
    if (orderAmount > 3499) return { tier: 3, bonus: 40, text: '₹3499+', description: 'Earn 40 bonus points!' };
    if (orderAmount > 2499) return { tier: 2, bonus: 35, text: '₹2499+', description: 'Earn 35 bonus points!' };
    if (orderAmount > 1499) return { tier: 1, bonus: 25, text: '₹1499+', description: 'Earn 25 bonus points!' };
    return { tier: 0, bonus: 0, text: 'Below ₹1499', description: 'No bonus points' };
  };

  const currentTier = getTieredBonus(getCartTotal());
  const refreshPoints = async () => {
    if (user) {
      console.log('🔄 Manually refreshing points...');
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserPoints({ points: profile.rewardPoints || 0 });
        console.log(`🔄 Refreshed points to: ${profile.rewardPoints || 0}`);
      }
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    try {
      const coupon = await validateCoupon(couponCode);
      if (!coupon) {
        toast.error('Invalid coupon code');
        return;
      }

      if (coupon.minAmount && getCartTotal() < coupon.minAmount) {
        toast.error(`Minimum order amount ₹${coupon.minAmount} required for this coupon`);
        return;
      }

      const discountText = coupon.type === 'percentage' 
        ? `${coupon.value}% off` 
        : `₹${coupon.value} off`;
      
      toast.success(`Coupon applied: ${discountText}`);
      setCouponCode('');
    } catch (error) {
      toast.error('Failed to apply coupon');
    }
  };

  const handlePointsChange = (value: number) => {
    if (value <= (userPoints?.points || 0)) {
      setPointsToUse(value);
    } else {
      toast.error('Insufficient points');
      setPointsToUse(userPoints?.points || 0);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    if (!user) {
      toast.error('Please login to checkout');
      return;
    }
    
    let orderId: string | null = null;
    let couponApplied = false;
    let pointsRedeemed = false;
    
    try {
      // Calculate totals properly
      const cartTotal = getCartTotal();
      let couponDiscount = 0;
      let pointsDiscount = 0;
      
      // Validate and prepare coupon (but don't apply yet)
      let coupon = null;
      if (couponCode) {
        coupon = await validateCoupon(couponCode);
        if (!coupon) {
          toast.error('Invalid coupon code');
          return;
        }

        if (coupon.minAmount && getCartTotal() < coupon.minAmount) {
          toast.error(`Minimum order amount ₹${coupon.minAmount} required for this coupon`);
          return;
        }
        
        if (coupon.type === 'percentage') {
          couponDiscount = cartTotal * (coupon.value / 100);
        } else {
          couponDiscount = coupon.value;
        }
      }
      
      // Validate points (but don't redeem yet)
      if (usePoints && pointsToUse > 0) {
        // Use user profile bonus points for validation, not coupon service points
        const userProfile = await getUserProfile(user.uid);
        const availableBonusPoints = userProfile?.rewardPoints || 0;
        
        if (availableBonusPoints < pointsToUse) {
          toast.error(`Insufficient bonus points. Available: ${availableBonusPoints}, Required: ${pointsToUse}`);
          return;
        }
        pointsDiscount = pointsToUse;
        console.log(`🔍 Validated bonus points: Available ${availableBonusPoints}, Using ${pointsToUse}`);
      }
      
      const shipping = 0; // Free shipping
      const tax = Math.round((cartTotal - couponDiscount - pointsDiscount) * 0.18);
      const totalAfterDiscounts = cartTotal - couponDiscount - pointsDiscount + shipping + tax;
      const finalTotal = totalAfterDiscounts;
      
      // Create order with pending payment status first
      const orderData: any = {
        userId: user.uid,
        orderNumber: 'ORD-' + Date.now(),
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          quantity: item.quantity,
          category: item.category
        })),
        totalAmount: cartTotal,
        discountAmount: couponDiscount + pointsDiscount,
        taxAmount: tax,
        shippingAmount: shipping,
        finalAmount: finalTotal,
        status: 'confirmed' as const,
        paymentMethod: 'Mock Payment Gateway',
        paymentStatus: 'pending' as const,
        paymentId: 'mock_payment_' + Date.now(),
        shippingAddress: {
          street: '123 Fashion Street',
          city: 'Style City',
          state: 'ST',
          zipCode: '12345',
          country: 'USA'
        },
        createdAt: new Date()
      };
      
      // Only add couponCode if it exists
      if (couponCode && coupon) {
        orderData.couponCode = couponCode;
      }
      
      // Only add pointsUsed if points are used
      if (usePoints && pointsToUse > 0) {
        orderData.pointsUsed = pointsToUse;
      }
      
      orderId = await createOrder(orderData);
      console.log(`✅ Order created with ID: ${orderId}`);
      
      // Simulate payment processing
      toast.success('Processing payment...');
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment success (95% success rate for demo)
      const paymentSuccessful = Math.random() > 0.05;
      
      if (!paymentSuccessful) {
        throw new Error('Payment failed: Insufficient funds');
      }
      
      // PAYMENT SUCCESSFUL - Now deduct points and apply coupons
      
      // Apply coupon discount
      if (coupon && couponCode) {
        await useCoupon(coupon.id, user.uid);
        couponApplied = true;
        const discountText = coupon.type === 'percentage' 
          ? `${coupon.value}% off` 
          : `₹${coupon.value} off`;
        toast.success(`Coupon applied: ${discountText}`);
      }
      
      // Redeem points
      if (usePoints && pointsToUse > 0) {
        console.log(`🔍 Starting points redemption process for ${pointsToUse} points`);
        
        // Check user profile before deduction
        const profileBefore = await getUserProfile(user.uid);
        console.log('🔍 User profile before deduction:', {
          uid: profileBefore?.uid,
          rewardPoints: profileBefore?.rewardPoints || 0,
          birthdayPoints: profileBefore?.birthdayRewardPoints || 0
        });
        
        // First deduct from couponService points system
        console.log('🔍 Deducting from coupon service...');
        await redeemPoints(user.uid, pointsToUse);
        pointsRedeemed = true;
        console.log('✅ Coupon service points deducted successfully');
        
        // Also deduct from userService bonus points system for consistency
        console.log('🔍 Deducting from user service bonus points...');
        const deductionResult = await deductBonusPoints(user.uid, pointsToUse);
        if (deductionResult.success) {
          toast.success(`${pointsToUse} points redeemed successfully`);
          console.log(`✅ Bonus points deducted. New balance: ${deductionResult.newBalance}`);
          
          // Update the cart state to reflect new points balance
          setUserPoints({ points: deductionResult.newBalance || 0 });
          console.log(`🔍 Updated cart display to: ${deductionResult.newBalance || 0} points`);
          
          // Check user profile after deduction
          const profileAfter = await getUserProfile(user.uid);
          console.log('🔍 User profile after deduction:', {
            uid: profileAfter?.uid,
            rewardPoints: profileAfter?.rewardPoints || 0,
            birthdayPoints: profileAfter?.birthdayRewardPoints || 0
          });
        } else {
          console.error('❌ Failed to deduct bonus points:', deductionResult.message);
          toast.error(`Failed to deduct bonus points: ${deductionResult.message}`);
          // Continue with order even if bonus points deduction fails, as couponService points were deducted
        }
      }
      
      // Update order status to paid
      await updatePaymentStatus(orderId, 'paid');
      
      // Update product quantities and move to sold products
      for (const item of items) {
        await updateProductSoldQuantity(item.id, item.quantity);
        console.log(`✅ Updated product ${item.id}: sold ${item.quantity} units`);
        
        // Move product to sold collection
        const response = await fetch(`/api/products/${item.id}/mark-sold`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            quantity: item.quantity,
            buyerId: user.uid 
          }),
        });
        
        if (response.ok) {
          console.log(`✅ Product ${item.id} moved to sold products`);
        } else {
          console.error(`❌ Failed to move product ${item.id} to sold`);
        }
      }
      
      // Add tiered bonus points based on order amount
      let tieredBonusPoints = 0;
      
      // Calculate tiered bonus points based on order amount
      if (finalTotal > 3499) {
        tieredBonusPoints = 40;
        console.log(`🎁 Tier 3 Bonus: Adding ${tieredBonusPoints} points for order above ₹3499`);
      } else if (finalTotal > 2499) {
        tieredBonusPoints = 35;
        console.log(`🎁 Tier 2 Bonus: Adding ${tieredBonusPoints} points for order above ₹2499`);
      } else if (finalTotal > 1499) {
        tieredBonusPoints = 25;
        console.log(`🎁 Tier 1 Bonus: Adding ${tieredBonusPoints} points for order above ₹1499`);
      } else {
        console.log(`🎁 No tiered bonus: Order amount ₹${finalTotal} is below ₹1499 threshold`);
      }
      
      const totalPointsEarned = tieredBonusPoints;
      
      await addUserPoints(user.uid, totalPointsEarned, `Purchase reward: Tiered Bonus(${tieredBonusPoints})`);
      
      console.log(`🎉 Points earned breakdown:`);
      console.log(`   - Tiered bonus: ${tieredBonusPoints}`);
      console.log(`   - Total points earned: ${totalPointsEarned}`);
      
      toast.success(`Earned ${totalPointsEarned} points! (${tieredBonusPoints > 0 ? `${tieredBonusPoints} bonus` : 'No bonus'})`);
      
      // Update cart state to reflect newly earned points
      const updatedProfile = await getUserProfile(user.uid);
      if (updatedProfile) {
        const newTotalPoints = updatedProfile?.rewardPoints || 0;
        setUserPoints({ points: newTotalPoints });
        console.log(`🔍 Updated cart display to: ${newTotalPoints} points (includes new earned points)`);
        
        // Reset points usage fields after successful payment
        setUsePoints(false);
        setPointsToUse(0);
      }
      
      toast.success('Payment successful! Order confirmed.');
      
      // Clear cart and redirect after delay
      setTimeout(() => {
        clearCart();
        setCouponCode('');
        window.location.href = `/payment-success?payment_id=${orderData.paymentId}`;
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      
      // ROLLBACK: If order was created but payment failed, cancel it
      if (orderId) {
        try {
          await cancelOrder(orderId, `Payment failed: ${error.message}`);
          console.log(`✅ Order ${orderId} cancelled due to payment failure`);
        } catch (rollbackError) {
          console.error('❌ Failed to cancel order after payment failure:', rollbackError);
        }
      }
      
      // ROLLBACK: Restore points if they were redeemed
      if (pointsRedeemed && usePoints && pointsToUse > 0) {
        try {
          // Restore couponService points
          await addUserPoints(user.uid, pointsToUse, 'Rollback - Payment failed');
          console.log(`✅ Coupon service points rolled back: ${pointsToUse} points restored`);
          
          // Also restore bonus points in userService
          const restoreResult = await addBackBonusPoints(user.uid, pointsToUse, 'Payment failed rollback');
          if (restoreResult.success) {
            console.log(`✅ Bonus points rolled back: ${pointsToUse} points restored. New balance: ${restoreResult.newBalance}`);
            
            // Update the cart state to reflect restored points balance
            setUserPoints({ points: restoreResult.newBalance || 0 });
            console.log(`🔍 Updated cart display to: ${restoreResult.newBalance || 0} points`);
          } else {
            console.error('❌ Failed to rollback bonus points:', restoreResult.message);
          }
        } catch (rollbackError) {
          console.error('❌ Failed to rollback points:', rollbackError);
        }
      }
      
      // ROLLBACK: Restore coupon usage if it was applied
      if (couponApplied && couponCode) {
        try {
          const coupon = await validateCoupon(couponCode);
          if (coupon) {
            const couponRef = doc(db, 'coupons', coupon.id);
            await updateDoc(couponRef, {
              usedCount: Math.max(0, (coupon.usedCount || 1) - 1)
            });
            console.log(`✅ Coupon usage rolled back: ${couponCode}`);
          }
        } catch (rollbackError) {
          console.error('❌ Failed to rollback coupon:', rollbackError);
        }
      }
      
      toast.error(`Payment failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your cart...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
          
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link to="/products">
              <Button size="lg">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link to="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Link>
          <Button variant="outline" onClick={handleClearCart}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear Cart
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h1 className="font-display text-3xl font-bold mb-6">Your Cart ({items.length} items)</h1>
            
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-lg truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{item.category} • {item.condition}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 text-center h-8"
                            min="1"
                            max="1"
                            readOnly
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-display font-semibold text-lg">₹{item.price}</p>
                          <p className="text-sm text-muted-foreground">₹{item.price * item.quantity} total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Coupon Code</label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleApplyCoupon} variant="outline">
                        Apply
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Reward Points</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Available: {userPoints?.points || 0}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={refreshPoints}
                          className="h-6 w-6 p-0"
                        >
                          ↻
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="usePoints"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor="usePoints" className="text-sm">Use points for discount</label>
                    </div>
                    <Input
                      type="number"
                      placeholder="Points"
                      value={pointsToUse}
                      onChange={(e) => handlePointsChange(parseInt(e.target.value) || 0)}
                      disabled={!usePoints}
                      className="flex-1 h-10 border-input focus:ring-primary"
                      min="0"
                      max={userPoints?.points || 0}
                    />
                  </div>
                  {usePoints && pointsToUse > 0 && (
                    <div className="mt-2 p-2 bg-primary/10 rounded border">
                      <div className="flex items-center justify-between text-primary">
                        <span className="text-xs">You'll save:</span>
                        <span className="font-bold">₹{pointsToUse}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{items.length} items</span>
                    <span className="font-bold">₹{getCartTotal()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">₹0</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">₹{Math.round((getCartTotal() - (couponCode ? Math.round(getCartTotal() * 0.1) : 0) - (usePoints ? pointsToUse : 0)) * 0.18)}</span>
                  </div>
                  {(couponCode) && (
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 font-medium">Coupon Applied</span>
                      <span className="font-bold text-green-800">-₹{Math.round(getCartTotal() * 0.1)}</span>
                    </div>
                  )}
                  {usePoints && pointsToUse > 0 && (
                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                      <Gift className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-700 font-medium">Points Used</span>
                      <span className="font-bold text-blue-800">-₹{pointsToUse}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-lg text-primary">₹{getCartTotal() + Math.round((getCartTotal() - (couponCode ? Math.round(getCartTotal() * 0.1) : 0) - (usePoints ? pointsToUse : 0)) * 0.18) - (couponCode ? Math.round(getCartTotal() * 0.1) : 0) - (usePoints ? pointsToUse : 0)}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleCheckout}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Complete Purchase
                </Button>
                
                <Link to="/products">
                  <Button variant="outline" size="lg" className="w-full mt-3">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
