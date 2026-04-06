import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { checkAndAwardBirthdayReward } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { X, Gift, Cake } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

interface BirthdayRewardCheckerProps {
  onRewardAwarded?: () => void;
}

export const BirthdayRewardChecker = ({ onRewardAwarded }: BirthdayRewardCheckerProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [showAlert, setShowAlert] = useState(false);
  const [message, setMessage] = useState('');
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user || checked) return;

    const checkBirthdayReward = async () => {
      try {
        console.log('🎂 Checking birthday reward for user:', user.uid);
        const result = await checkAndAwardBirthdayReward(user.uid);
        
        if (result.awarded) {
          setMessage(result.message);
          setShowAlert(true);
          toast.success(result.message);
          onRewardAwarded?.();
        }
      } catch (error) {
        console.error('Error checking birthday reward:', error);
      } finally {
        setChecked(true);
      }
    };

    // Check birthday reward when user logs in
    if (user) {
      checkBirthdayReward();
    }
  }, [user, checked, onRewardAwarded]);

  const handleClose = () => {
    setShowAlert(false);
  };

  if (!showAlert || !user) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-sm animate-in slide-in-from-right duration-300 ${
      theme === 'dark' ? 'bg-card border-border' : 'bg-white border-green-200'
    } border rounded-lg shadow-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className={`rounded-full p-2 flex-shrink-0 ${
          theme === 'dark' ? 'bg-warm' : 'bg-green-100'
        }`}>
          <Cake className={`h-5 w-5 ${
            theme === 'dark' ? 'text-warm-foreground' : 'text-green-700'
          }`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-card-foreground font-medium mb-1">
            🎉 Birthday Reward Awarded!
          </div>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'
          }`}>
            {message}
          </div>
          <div className={`text-xs mt-2 ${
            theme === 'dark' ? 'text-muted-foreground/70' : 'text-gray-500'
          }`}>
            Valid for 30 days from today
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className={`rounded-full h-6 w-6 p-0 flex-shrink-0 ${
            theme === 'dark' 
              ? 'text-muted-foreground hover:text-card-foreground hover:bg-muted' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
