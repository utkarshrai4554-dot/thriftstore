import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, Gift, Percent, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { updateProductSoldQuantity } from "@/services/productService";
import { createOrder } from "@/services/orderService";
import { validateCoupon, useCoupon, getUserPoints, addUserPoints, redeemPoints } from "@/services/couponService";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

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

  // Load user points
  useEffect(() => {
    if (user) {
      getUserPoints(user.uid).then(points => {
        setUserPoints(points);
      });
    }
  }, [user]);

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
    
    try {
      // Calculate totals properly
      const cartTotal = getCartTotal();
      let couponDiscount = 0;
      let pointsDiscount = 0;
      
      // Apply coupon discount
      if (couponCode) {
        const coupon = await validateCoupon(couponCode);
        if (coupon) {
          if (coupon.type === 'percentage') {
            couponDiscount = cartTotal * (coupon.value / 100);
          } else {
            couponDiscount = coupon.value;
          }
          
          await useCoupon(coupon.id, user.uid);
          toast.success(`Coupon applied: ${coupon.value}${coupon.type === 'percentage' ? '% off' : ' off'}`);
        }
      }
      
      // Apply points discount
      if (usePoints && pointsToUse > 0) {
        pointsDiscount = pointsToUse;
        await redeemPoints(user.uid, pointsToUse);
        toast.success(`${pointsToUse} points redeemed`);
      }
      
      const shipping = 0; // Free shipping
      const tax = Math.round((cartTotal - couponDiscount - pointsDiscount) * 0.18);
      const totalAfterDiscounts = cartTotal - couponDiscount - pointsDiscount + shipping + tax;
      const finalTotal = totalAfterDiscounts;
      
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
      
      // Create order in database
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
        paymentStatus: 'paid' as const,
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
      if (couponCode) {
        orderData.couponCode = couponCode;
      }
      
      // Only add pointsUsed if points are used
      if (usePoints && pointsToUse > 0) {
        orderData.pointsUsed = pointsToUse;
      }
      
      const orderId = await createOrder(orderData);
      console.log(`✅ Order created with ID: ${orderId}`);
      
      // Add points for purchase (5% of order value as points)
      const pointsEarned = Math.floor(finalTotal * 0.05);
      await addUserPoints(user.uid, pointsEarned, 'Purchase reward');
      
      // Clear cart and redirect after delay
      toast.success('Processing payment...');
      setTimeout(() => {
        clearCart();
        setCouponCode('');
        setUsePoints(false);
        setPointsToUse(0);
        window.location.href = `/payment-success?payment_id=${orderData.paymentId}`;
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      toast.error('Failed to process payment. Please try again.');
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
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
                
                {/* Coupon Section */}
                <div className="space-y-3 mb-6 p-4 bg-card rounded-lg border shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Coupon Code</h3>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="pr-10 border-input focus:ring-primary"
                      />
                      {couponCode && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <Percent className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim()}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Apply
                    </Button>
                  </div>
                  {couponCode && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Coupon applied!</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Points Section */}
                <div className="space-y-3 mb-6 p-4 bg-card rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Loyalty Points</h3>
                    </div>
                    {userPoints && (
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        🎁 {userPoints.points} pts
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm" htmlFor="usePoints">
                      <input
                        type="checkbox"
                        id="usePoints"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="h-4 w-4 text-primary border-input focus:ring-primary"
                      />
                      <span className="text-foreground">Use points for discount</span>
                    </label>
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
