import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Gift } from 'lucide-react';
import { calculateShoppingPoints, getPointsTiers, formatPoints } from '@/utils/pointsCalculator';
import { Button } from '@/components/ui/button';

interface PointsInfoProps {
  cartTotal: number;
  className?: string;
}

export const PointsInfo: React.FC<PointsInfoProps> = ({ cartTotal, className = '' }) => {
  const pointsBreakdown = calculateShoppingPoints(cartTotal);
  const shoppingTiers = getPointsTiers('SHOPPING');

  return (
    <Card className={`bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Reward Points</h3>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Earn Points
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Current Purchase Points */}
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">This Purchase</span>
              <span className="font-bold text-purple-600 text-lg">
                +{formatPoints(pointsBreakdown.totalPoints)}
              </span>
            </div>
            
            {pointsBreakdown.tier && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Base Points:</span>
                  <span>+{formatPoints(pointsBreakdown.basePoints)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Earned ({pointsBreakdown.tier.rate}):</span>
                  <span>+{formatPoints(pointsBreakdown.tieredPoints)}</span>
                </div>
                {pointsBreakdown.bonusPoints > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>🎁 Bonus:</span>
                    <span>+{formatPoints(pointsBreakdown.bonusPoints)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Points Tiers */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-900">Points Tiers</h4>
            <div className="space-y-1">
              {shoppingTiers.slice(-3).map((tier, index) => (
                <div 
                  key={tier.level}
                  className={`flex justify-between items-center text-xs p-2 rounded ${
                    pointsBreakdown.tier?.range === tier.range 
                      ? 'bg-purple-100 text-purple-900 font-medium' 
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
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="flex items-start gap-2">
              <Gift className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">💡 Earn More Points!</p>
                <ul className="space-y-0.5 text-blue-700">
                  <li>• Higher purchases = Better point rates</li>
                  <li>• Get bonus points at higher tiers</li>
                  <li>• Points can be used for discounts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsInfo;
