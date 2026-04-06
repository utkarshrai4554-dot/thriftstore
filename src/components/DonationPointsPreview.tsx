import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Gift, Package } from 'lucide-react';
import { previewDonationPoints, getDonationPointsInfo } from '@/services/donationPointsService';
import { formatPoints } from '@/utils/pointsCalculator';

interface DonationPointsPreviewProps {
  items: string;
  quantity: number;
  className?: string;
}

export const DonationPointsPreview: React.FC<DonationPointsPreviewProps> = ({ 
  items, 
  quantity, 
  className = '' 
}) => {
  const pointsBreakdown = previewDonationPoints(items, quantity);
  const donationInfo = getDonationPointsInfo();

  return (
    <Card className={`bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Donation Points</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Preview
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Current Donation Points */}
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">You'll Earn</span>
              <span className="font-bold text-green-600 text-lg">
                +{formatPoints(pointsBreakdown.totalPoints)}
              </span>
            </div>
            
            {pointsBreakdown.itemType && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Base Points:</span>
                  <span>+{formatPoints(pointsBreakdown.basePoints)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{pointsBreakdown.itemType.charAt(0).toUpperCase() + pointsBreakdown.itemType.slice(1)} Items:</span>
                  <span>+{formatPoints(pointsBreakdown.itemPoints)}</span>
                </div>
                {pointsBreakdown.quantityBonus > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>🎁 Quantity Bonus:</span>
                    <span>+{formatPoints(pointsBreakdown.quantityBonus)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Item Type Information */}
          {pointsBreakdown.itemConfig && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-900">Item Type: {pointsBreakdown.itemType}</h4>
              <div className="text-xs text-muted-foreground bg-green-50 rounded p-2">
                <p>{pointsBreakdown.itemConfig.basePoints} base points</p>
                <p>+{pointsBreakdown.itemConfig.perItem} points per item</p>
                <p>Max {pointsBreakdown.itemConfig.maxMultiplier}x multiplier</p>
              </div>
            </div>
          )}

          {/* Quantity Bonus Tiers */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-green-900">Quantity Bonuses</h4>
            <div className="space-y-1">
              {donationInfo.quantityTiers.slice(-3).map((tier: any) => (
                <div 
                  key={tier.level}
                  className={`flex justify-between items-center text-xs p-2 rounded ${
                    pointsBreakdown.quantityTier?.range === tier.range 
                      ? 'bg-green-100 text-green-900 font-medium' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <span>{tier.range}</span>
                  <span>{tier.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
            <div className="flex items-start gap-2">
              <Gift className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div className="text-xs text-emerald-800">
                <p className="font-medium mb-1">💡 Earn More Points!</p>
                <ul className="space-y-0.5 text-emerald-700">
                  <li>• Different items have different point values</li>
                  <li>• More items = quantity bonus points</li>
                  <li>• Points help you get discounts on shopping</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DonationPointsPreview;
