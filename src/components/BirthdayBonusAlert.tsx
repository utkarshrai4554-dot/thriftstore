import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserProfile, hasValidBirthdayReward } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { X, Clock, Gift } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface BirthdayBonusAlertProps {
  onClose?: () => void;
}

export const BirthdayBonusAlert = ({ onClose }: BirthdayBonusAlertProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showAlert, setShowAlert] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [birthdayPoints, setBirthdayPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkBirthdayBonus = async () => {
      try {
        const userProfile = await getUserProfile(user.uid);
        if (!userProfile) return;

        const hasValid = hasValidBirthdayReward(userProfile);
        
        if (hasValid && userProfile.birthdayRewardExpiry) {
          setShowAlert(true);
          setBirthdayPoints(userProfile.birthdayRewardPoints || 0);
          setTotalPoints(userProfile.rewardPoints || 0);

          // Start countdown timer
          const interval = setInterval(() => {
            const now = new Date();
            const expiry = userProfile.birthdayRewardExpiry instanceof Date 
              ? userProfile.birthdayRewardExpiry 
              : userProfile.birthdayRewardExpiry.toDate();
            const timeDiff = expiry.getTime() - now.getTime();

            if (timeDiff <= 0) {
              clearInterval(interval);
              setShowAlert(false);
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
            
            setTimeRemaining(timeString);
          }, 1000);

          return () => clearInterval(interval);
        } else {
          setShowAlert(false);
        }
      } catch (error) {
        console.error('Error checking birthday bonus:', error);
      }
    };

    checkBirthdayBonus();
  }, [user]);

  const handleClose = () => {
    setShowAlert(false);
    onClose?.();
  };

  if (!showAlert || !user) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${theme === 'dark' ? 'bg-warm' : 'bg-green-100'}`}>
            <Gift className={`h-4 w-4 ${theme === 'dark' ? 'text-warm-foreground' : 'text-green-700'}`} />
          </div>
          <div>
            <div className="text-card-foreground font-medium mb-1">
              🎂 Birthday Bonus Active!
            </div>
            <div className="text-muted-foreground text-sm">
              You have <span className={`font-semibold ${theme === 'dark' ? 'text-warm-foreground' : 'text-green-600'}`}>{totalPoints}</span> points 
              <span className="text-muted-foreground/70 ml-1">({birthdayPoints} bonus)</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`rounded-full px-3 py-1.5 flex items-center gap-1.5 border ${theme === 'dark' ? 'bg-muted border-border' : 'bg-green-50 border-green-200'}`}>
            <Clock className={`h-3 w-3 ${theme === 'dark' ? 'text-warm-foreground' : 'text-green-600'}`} />
            <span className="text-sm font-medium text-card-foreground">
              {timeRemaining}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className={`rounded-full h-6 w-6 p-0 ${theme === 'dark' ? 'text-muted-foreground hover:text-card-foreground hover:bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-green-50'}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
