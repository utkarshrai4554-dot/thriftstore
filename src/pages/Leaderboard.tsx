import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Trophy, Heart, Calendar, Package, ArrowLeft, Users, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Donor {
  id: string;
  name: string;
  email: string;
  totalItems: number;
  totalDonations: number;
  uniqueItems: Set<string>;
  causes: Set<string>;
  firstDonation: Date | null;
  lastDonation: Date | null;
  impactScore: number;
  badges: Badge[];
  ngoHelpCount: number; // Number of NGO requests helped
}

interface Badge {
  label: string;
  color: string;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [topDonors, setTopDonors] = useState<Donor[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonorData();
  }, []);

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      console.log('🚀 fetchDonorData called!');
      
      // Fetch individual donations
      const donationsQuery = query(collection(db, 'donations'));
      const donationsSnapshot = await getDocs(donationsQuery);
      
      // Fetch NGO accepted orders (to track who helped NGOs)
      const ngoAcceptedOrdersQuery = query(collection(db, 'ngoAcceptedOrders'));
      const ngoAcceptedOrdersSnapshot = await getDocs(ngoAcceptedOrdersQuery);
      
      console.log(`📊 Found ${donationsSnapshot.docs.length} donation documents, ${ngoAcceptedOrdersSnapshot.docs.length} NGO accepted orders`);
      
      // Group donations by user
      const donorMap = new Map();
      
      // Process individual donations
      donationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId || data.donorId;
        
        // Debug logging
        console.log('🔍 Donation data:', {
          docId: doc.id,
          userId: userId,
          donorName: data.donorName,
          donorEmail: data.donorEmail
        });
        
        if (!donorMap.has(userId)) {
          // Use a consistent naming strategy
          let donorName = data.donorName || 'Anonymous Donor';
          
          // If the name looks like an email, extract the part before @
          if (donorName.includes('@')) {
            donorName = donorName.split('@')[0];
          }
          
          console.log('👤 Creating donor entry:', {
            userId: userId,
            name: donorName,
            email: data.donorEmail
          });
          
          donorMap.set(userId, {
            id: userId,
            name: donorName,
            email: data.donorEmail || '',
            totalItems: 0,
            totalDonations: 0,
            uniqueItems: new Set(),
            causes: new Set(),
            firstDonation: null,
            lastDonation: null,
            impactScore: 0,
            badges: [],
            ngoHelpCount: 0
          });
        }
        
        const donor = donorMap.get(userId);
        donor.totalDonations++;
        donor.totalItems += data.quantity || 1;
        donor.uniqueItems.add(data.items || 'Unknown');
        if (data.cause) donor.causes.add(data.cause);
        
        const donationDate = data.createdAt?.toDate();
        if (donationDate) {
          if (!donor.firstDonation || donationDate < donor.firstDonation) {
            donor.firstDonation = donationDate;
          }
          if (!donor.lastDonation || donationDate > donor.lastDonation) {
            donor.lastDonation = donationDate;
          }
        }
        
        // Calculate impact score
        donor.impactScore += (data.quantity || 1) * 10;
        if (data.cause === 'Education') donor.impactScore += 5;
        if (data.cause === 'Healthcare') donor.impactScore += 5;
        if (data.cause === 'Emergency') donor.impactScore += 8;
      });
      
      // Process NGO accepted orders to track who helped NGOs
      ngoAcceptedOrdersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const helperId = data.donorId || data.userId; // User who helped
        const ngoId = data.ngoId; // NGO that was helped
        
        if (helperId && ngoId) {
          console.log('🤝 NGO Help data:', {
            helperId: helperId,
            ngoId: ngoId,
            items: data.items,
            quantity: data.quantity
          });
          
          // Add NGO help to the user's record
          if (donorMap.has(helperId)) {
            const donor = donorMap.get(helperId);
            donor.ngoHelpCount++;
            donor.totalItems += data.quantity || 1;
            donor.uniqueItems.add(data.items || 'NGO Help');
            donor.causes.add('NGO Support');
            
            // Add extra impact score for helping NGOs
            donor.impactScore += (data.quantity || 1) * 15; // Higher score for NGO help
            
            // Update last activity
            const helpDate = data.createdAt?.toDate();
            if (helpDate && (!donor.lastDonation || helpDate > donor.lastDonation)) {
              donor.lastDonation = helpDate;
            }
          }
        }
      });
      
      // Convert to array and sort by impact score
      const donors = Array.from(donorMap.values());
      donors.sort((a, b) => b.impactScore - a.impactScore);
      
      // Add badges based on achievements
      donors.forEach((donor, index) => {
        const badges = [];
        
        // Donation badges
        if (donor.totalDonations >= 10) badges.push({ label: 'Dedicated Donor', color: 'bg-amber-100 text-amber-800' });
        if (donor.totalDonations >= 25) badges.push({ label: 'Super Donor', color: 'bg-stone-100 text-stone-800' });
        if (donor.totalDonations >= 50) badges.push({ label: 'Elite Donor', color: 'bg-orange-100 text-orange-800' });
        
        if (donor.causes.size >= 3) badges.push({ label: 'Versatile', color: 'bg-green-100 text-green-800' });
        if (donor.uniqueItems.size >= 10) badges.push({ label: 'Variety Pack', color: 'bg-blue-100 text-blue-800' });
        
        // NGO Help badges
        if (donor.ngoHelpCount >= 1) badges.push({ label: '🤝 NGO Helper', color: 'bg-purple-100 text-purple-800' });
        if (donor.ngoHelpCount >= 3) badges.push({ label: '🌟 NGO Supporter', color: 'bg-purple-200 text-purple-900' });
        if (donor.ngoHelpCount >= 5) badges.push({ label: '💜 NGO Champion', color: 'bg-purple-300 text-purple-900' });
        if (donor.ngoHelpCount >= 10) badges.push({ label: '👑 NGO Hero', color: 'bg-purple-500 text-white' });
        
        // Top rank badges
        if (index === 0) badges.push({ label: '👑 Champion', color: 'bg-amber-500 text-white' });
        
        donor.badges = badges;
      });
      
      // Set top donors (show top 10)
      setTopDonors(donors.slice(0, 10));
      
    } catch (error) {
      console.error('Error fetching donor data:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-stone-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-semibold">Back to Home</span>
              </Link>
              <div className="h-8 w-px bg-stone-300"></div>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-amber-600" />
                <h1 className="text-2xl font-bold text-stone-900">Donor Leaderboard</h1>
              </div>
              <Button 
                onClick={fetchDonorData} 
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-sm"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {user && userStats && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-stone-600">Your Rank</p>
                  <p className="text-2xl font-bold text-stone-900">#{userRank || '--'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-600">Impact Score</p>
                  <p className="text-2xl font-bold text-amber-700">{userStats?.impactScore || 0}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border border-stone-200">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-stone-900">{topDonors.length}</p>
              <p className="text-sm text-stone-600">Total Donors</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border border-stone-200">
            <CardContent className="p-6 text-center">
              <Package className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-stone-900">
                {topDonors.reduce((sum, donor) => sum + donor.totalItems, 0)}
              </p>
              <p className="text-sm text-stone-600">Items Donated</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border border-stone-200">
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-stone-900">
                {topDonors.reduce((sum, donor) => sum + donor.totalDonations, 0)}
              </p>
              <p className="text-sm text-stone-600">Total Donations</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border border-stone-200">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-stone-900">
                {Math.round(topDonors.reduce((sum, donor) => sum + donor.impactScore, 0) / topDonors.length || 0)}
              </p>
              <p className="text-sm text-stone-600">Avg Impact Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard */}
        {topDonors.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-amber-100 to-stone-100 rounded-full mb-8">
              <Trophy className="h-16 w-16 text-amber-700" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-4">No Donors Yet</h2>
            <p className="text-xl text-stone-600 mb-8 max-w-md mx-auto">
              Be the first to make a difference! Start donating to see your name on the leaderboard.
            </p>
            <Link to="/donate">
              <Button className="bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white px-8 py-3 text-lg font-semibold shadow-lg">
                <Heart className="h-5 w-5 mr-2" />
                Make Your First Donation
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* 2nd Place */}
              {topDonors[1] && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-stone-200 to-stone-300 rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-stone-400 rounded-full mb-4">
                      <span className="text-3xl">🥈</span>
                    </div>
                    <h3 className="text-2xl font-bold text-stone-800 mb-2">{topDonors[1].name}</h3>
                    <div className="space-y-3 text-stone-600">
                      <div className="flex items-center justify-center gap-2">
                        <Package className="h-5 w-5" />
                        <span className="font-semibold text-lg">{topDonors[1].totalItems}</span>
                        <span className="text-stone-500">items</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Heart className="h-5 w-5" />
                        <span className="font-semibold text-lg">{topDonors[1].totalDonations}</span>
                        <span className="text-stone-500">donations</span>
                      </div>
                      {topDonors[1].firstDonation && (
                        <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
                          <Calendar className="h-4 w-4" />
                          <span>Since {topDonors[1].firstDonation.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {topDonors[1].badges.map((badge, idx) => (
                        <Badge key={idx} className={badge.color}>
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-stone-500 mt-4">2nd Place</div>
                </div>
              )}
              
              {/* 1st Place */}
              {topDonors[0] && (
                <div className="text-center md:transform md:scale-110">
                  <div className="bg-gradient-to-br from-amber-200 to-amber-300 rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-amber-600 to-stone-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                        👑 Champion
                      </div>
                    </div>
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-600 to-stone-600 rounded-full mb-4 shadow-lg">
                      <span className="text-4xl">👑</span>
                    </div>
                    <h3 className="text-3xl font-bold text-stone-800 mb-2">{topDonors[0].name}</h3>
                    <div className="space-y-3 text-stone-600">
                      <div className="flex items-center justify-center gap-2">
                        <Package className="h-5 w-5" />
                        <span className="font-semibold text-lg">{topDonors[0].totalItems}</span>
                        <span className="text-stone-500">items</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Heart className="h-5 w-5" />
                        <span className="font-semibold text-lg">{topDonors[0].totalDonations}</span>
                        <span className="text-stone-500">donations</span>
                      </div>
                      {topDonors[0].firstDonation && (
                        <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
                          <Calendar className="h-4 w-4" />
                          <span>Since {topDonors[0].firstDonation.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {topDonors[0].badges.map((badge, idx) => (
                        <Badge key={idx} className={badge.color}>
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-amber-700 mt-4">🏆 Top Donor</div>
                </div>
              )}
              
              {/* 3rd Place */}
              {topDonors[2] && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-full mb-4">
                      <span className="text-3xl">🥉</span>
                    </div>
                    <h3 className="text-2xl font-bold text-stone-800 mb-2">{topDonors[2].name}</h3>
                    <div className="space-y-3 text-stone-600">
                      <div className="flex items-center justify-center gap-2">
                        <Package className="h-5 w-5" />
                        <span className="font-semibold text-lg">{topDonors[2].totalItems}</span>
                        <span className="text-stone-500">items</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Heart className="h-5 w-5" />
                        <span className="font-semibold text-lg">{topDonors[2].totalDonations}</span>
                        <span className="text-stone-500">donations</span>
                      </div>
                      {topDonors[2].firstDonation && (
                        <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
                          <Calendar className="h-4 w-4" />
                          <span>Since {topDonors[2].firstDonation.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {topDonors[2].badges.map((badge, idx) => (
                        <Badge key={idx} className={badge.color}>
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mt-4">3rd Place</div>
                </div>
              )}
            </div>

            {/* Rest of Leaderboard */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 p-8">
              <h3 className="text-xl font-bold text-stone-900 mb-6">All Donors</h3>
              <div className="space-y-4">
                {topDonors.map((donor, index) => (
                  <div key={donor.id || `donor-${index}`} className="flex items-center gap-6 p-4 bg-white rounded-xl border border-stone-200 hover:shadow-md transition-all duration-300">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-amber-600' : 
                        index === 1 ? 'bg-stone-400' : 
                        index === 2 ? 'bg-orange-600' : 
                        'bg-blue-500'
                      }`}>
                        {index === 0 ? '👑' : index + 1}
                      </div>
                    </div>
                    
                    {/* Donor Info */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-stone-900">{donor.name}</h4>
                          {user && user.uid === donor.id && (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-stone-700">#{index + 1}</div>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-6 text-sm text-stone-600">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span>{donor.totalItems} items</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{donor.totalDonations} donations</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          <span>{donor.impactScore} impact</span>
                        </div>
                        {donor.firstDonation && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Since {donor.firstDonation.toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {donor.badges.map((badge, idx) => (
                          <Badge key={idx} className={badge.color}>
                            {badge.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
        </>
      )}

      {/* Call to Action */}
      <div className="text-center py-12">
        <Link to="/donate">
          <Button className="bg-gradient-to-r from-amber-700 to-stone-700 hover:from-amber-800 hover:to-stone-800 text-white px-8 py-3 text-lg font-semibold shadow-lg transform transition-all duration-300 hover:scale-105">
            <Heart className="h-5 w-5 mr-2" />
            Donate Now
          </Button>
        </Link>
      </div>
    </div>
  </div>
  );
};

export default Leaderboard;
