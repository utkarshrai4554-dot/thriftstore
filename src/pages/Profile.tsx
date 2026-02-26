import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  Heart, 
  Edit,
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useTheme } from "@/contexts/ThemeContext";
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { checkAndAwardBirthdayReward, getTotalRewardPoints, hasValidBirthdayReward, getUserProfile, ensureUserHasRewardPoints, cleanupExpiredBirthdayRewards, saveUpdatedRewardPoints, getBirthdayCountdown, isBirthdayApproaching } from "@/services/userService";
import { updateUserProfile } from "@/services/userService";
import BirthdayCountdownAlert from "@/components/BirthdayCountdownAlert";

const Profile = () => {
  const { user, userProfile, logout } = useAuth();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    birthdate: '',
    rewardPoints: 50,
    birthdayRewardPoints: 0,
    birthdayRewardExpiry: null as Date | null,
    hasValidBirthdayReward: false,
    timeRemaining: '', // Countdown timer string for birthday bonus expiry
    birthdayCountdown: '' // Countdown timer string to next birthday
  });
  const [birthdateLocked, setBirthdateLocked] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      try {
        // Fetch from both collections first
        const [userProfileDoc, profileDoc] = await Promise.all([
          getUserProfile(user.uid),
          getDoc(doc(db, 'userProfiles', user.uid))
        ]);
        
        // Merge data from both sources
        const mergedData = {
          displayName: userProfile?.displayName || profileDoc?.data()?.displayName || '',
          email: user?.email || '',
          phone: userProfile?.phone || profileDoc?.data()?.phone || '',
          address: userProfile?.address || profileDoc?.data()?.address || '',
          birthdate: userProfile?.birthdate || profileDoc?.data()?.birthdate || '',
          rewardPoints: userProfile?.rewardPoints || 50, // Total points (base + birthday bonus)
          birthdayRewardPoints: userProfile?.birthdayRewardPoints || 0,
          birthdayRewardExpiry: userProfile?.birthdayRewardExpiry?.toDate() || null,
          hasValidBirthdayReward: userProfile ? hasValidBirthdayReward(userProfile) : false,
          timeRemaining: '',
          birthdayCountdown: ''
        };
        
        setFormData(mergedData);
        
        // Now fix any separate birthday reward points after data is loaded
        await ensureUserHasRewardPoints(user.uid);
        
        // Check for birthday reward
        await checkBirthdayReward();
        
        // Check if birthdate is already set (can only be set once)
        if (mergedData.birthdate) {
          setBirthdateLocked(true);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Fallback to default values
        setFormData({
          displayName: userProfile?.displayName || '',
          email: user?.email || '',
          phone: userProfile?.phone || '',
          address: userProfile?.address || '',
          birthdate: '',
          rewardPoints: userProfile?.rewardPoints || 50, // Total points (base + birthday bonus)
          birthdayRewardPoints: userProfile?.birthdayRewardPoints || 0,
          birthdayRewardExpiry: userProfile?.birthdayRewardExpiry?.toDate() || null,
          hasValidBirthdayReward: userProfile ? hasValidBirthdayReward(userProfile) : false,
          timeRemaining: '',
          birthdayCountdown: ''
        });
      }
    };

    loadUserProfile();
  }, [user, userProfile]);

  // Birthday countdown timer (countdown to next birthday)
  useEffect(() => {
    if (!formData.birthdate) return;

    const interval = setInterval(() => {
      const countdown = getBirthdayCountdown(formData.birthdate);
      if (countdown) {
        setFormData(prev => ({
          ...prev,
          birthdayCountdown: countdown.timeString
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [formData.birthdate]);

  // Countdown timer for birthday bonus expiry
  useEffect(() => {
    if (!formData.hasValidBirthdayReward || !formData.birthdayRewardExpiry) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(formData.birthdayRewardExpiry);
      const timeDiff = expiry.getTime() - now.getTime();

      if (timeDiff <= 0) {
        // Birthday bonus expired, update state and database without reload
        clearInterval(interval);
        
        // Update local state immediately
        const newTotalPoints = formData.rewardPoints - formData.birthdayRewardPoints;
        setFormData(prev => ({
          ...prev,
          rewardPoints: newTotalPoints,
          birthdayRewardPoints: 0,
          birthdayRewardExpiry: null,
          hasValidBirthdayReward: false,
          timeRemaining: ''
        }));
        
        // Update database in background
        cleanupExpiredBirthdayRewards(user!.uid).then((result) => {
          if (result.cleaned) {
            toast.info(result.message);
          }
        }).catch((error) => {
          console.error('Error cleaning up expired birthday reward:', error);
        });
        
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      let timeString = '';
      if (days > 0) {
        timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      } else if (hours > 0) {
        timeString = `${hours}h ${minutes}m ${seconds}s`;
      } else {
        timeString = `${minutes}m ${seconds}s`;
      }
      
      setFormData(prev => ({
        ...prev,
        timeRemaining: timeString
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [formData.hasValidBirthdayReward, formData.birthdayRewardExpiry, user, formData.rewardPoints, formData.birthdayRewardPoints]);

  const checkBirthdayReward = async () => {
    if (!user) return;
    
    try {
      const result = await checkAndAwardBirthdayReward(user.uid);
      if (result.awarded) {
        toast.success(`🎉 ${result.message}`);
        // Reload profile to get updated points
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (result.message !== 'Today is not your birthday' && result.message !== 'No birthdate set') {
        // Show other messages (like already awarded) but don't reload
        console.log('Birthday check:', result.message);
      }
    } catch (error) {
      console.error('Error checking birthday reward:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Prevent birthdate changes if it's already been set
    if (name === 'birthdate' && birthdateLocked) {
      toast.error('Birthdate can only be set once and cannot be changed');
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (!user) {
        toast.error('Please login to update your profile');
        return;
      }

      // Save to Firestore user profile collection
      const profileRef = doc(db, 'userProfiles', user.uid);
      const profileData: any = {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        birthdate: formData.birthdate,
        rewardPoints: formData.rewardPoints, // Total points (base + birthday bonus)
        updatedAt: serverTimestamp()
      };

      // Only set birthdate if it's not already set or if this is the first time setting it
      if (!birthdateLocked && formData.birthdate) {
        profileData.birthdate = formData.birthdate;
        profileData.birthdateSetAt = serverTimestamp();
      }

      await setDoc(profileRef, profileData, { merge: true });

      // Also save to users collection for consistency with birthday rewards
      await updateUserProfile(user.uid, {
        displayName: formData.displayName,
        phone: formData.phone,
        address: formData.address,
        birthdate: formData.birthdate,
        rewardPoints: formData.rewardPoints, // Total points (base + birthday bonus)
        updatedAt: new Date()
      });
      
      // Lock birthdate after saving if it wasn't locked before
      if (!birthdateLocked && formData.birthdate) {
        setBirthdateLocked(true);
      }
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  if (!user) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <User className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Please Login</h2>
            <p className="text-muted-foreground mb-6">You need to be logged in to view your profile.</p>
            <Link to="/auth">
              <Button size="lg">Login to Your Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">My Profile</h1>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  Save Changes
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Birthday Countdown Alert */}
        <BirthdayCountdownAlert 
          birthdate={formData.birthdate} 
          hasValidBirthdayReward={formData.hasValidBirthdayReward} 
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userProfile?.photoURL} />
                    <AvatarFallback className="text-lg font-display">
                      {userProfile?.displayName?.[0] || user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-semibold">
                      {userProfile?.displayName || user?.email?.split('@')[0]}
                    </h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                    <Badge variant="secondary" className="mt-1">
                      Member since {new Date(user?.metadata.creationTime || '').getFullYear()}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="Enter your address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="birthdate">Birth Date</Label>
                    <Input
                      id="birthdate"
                      name="birthdate"
                      type="date"
                      value={formData.birthdate}
                      onChange={handleInputChange}
                      disabled={!isEditing || birthdateLocked}
                      placeholder="Enter your birth date"
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    />
                    {birthdateLocked && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Birth date can only be set once and cannot be changed
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Account Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">{getCartCount()}</div>
                    <div className="text-sm text-muted-foreground">Cart Items</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-red-500">{getWishlistCount()}</div>
                    <div className="text-sm text-muted-foreground">Wishlist Items</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{formData.rewardPoints}</div>
                    <div className="text-sm text-muted-foreground">
                      Your Reward Points
                      {formData.hasValidBirthdayReward && (
                        <div className="text-xs text-green-600 mt-1">
                          +{formData.birthdayRewardPoints} Birthday Bonus Already Added
                          {formData.timeRemaining && (
                            <div className="text-xs text-orange-600 font-medium mt-1 bg-orange-50 rounded px-2 py-1 inline-block">
                              ⏰ Expires in: {formData.timeRemaining}
                            </div>
                          )}
                        </div>
                      )}
                      {formData.birthdate && !formData.hasValidBirthdayReward && formData.birthdayCountdown && (
                        <div className="text-xs text-blue-600 mt-1">
                          🎂 Next birthday in: {formData.birthdayCountdown}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/cart">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    View Cart ({getCartCount()})
                  </Button>
                </Link>
                <div className="h-2"></div>
                <Link to="/wishlist">
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="h-4 w-4 mr-2" />
                    View Wishlist ({getWishlistCount()})
                  </Button>
                </Link>
                <div className="h-2"></div>
                <Link to="/orders">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Order History
                  </Button>
                </Link>
                <div className="h-2"></div>
                <Link to="/sell">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Sell Product
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Switch to Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Switch to Dark Mode
                    </>
                  )}
                </Button>
                <Separator />
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
