import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getBirthdayCountdown, isBirthdayApproaching } from "@/services/userService";
import { Cake, Gift } from "lucide-react";

interface BirthdayCountdownAlertProps {
  birthdate: string;
  hasValidBirthdayReward: boolean;
}

const BirthdayCountdownAlert = ({ birthdate, hasValidBirthdayReward }: BirthdayCountdownAlertProps) => {
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number; timeString: string } | null>(null);
  const [isApproaching, setIsApproaching] = useState(false);

  useEffect(() => {
    if (!birthdate) return;

    const updateCountdown = () => {
      const countdownData = getBirthdayCountdown(birthdate);
      setCountdown(countdownData);
      setIsApproaching(isBirthdayApproaching(birthdate, 7)); // Show alert 7 days before
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [birthdate]);

  if (!birthdate || !countdown || hasValidBirthdayReward) {
    return null;
  }

  // Show special alert for birthdays within 7 days
  if (isApproaching) {
    return (
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Cake className="h-8 w-8 text-blue-600" />
            <div className="flex-1">
              <div className="font-semibold text-blue-900">
                🎉 Your Birthday is Coming Soon!
              </div>
              <div className="text-sm text-blue-700">
                Get ready for your special day! You'll receive 50 bonus reward points on your birthday, valid for 30 days.
              </div>
              <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-800">
                <Gift className="h-3 w-3 mr-1" />
                {countdown.days > 0 ? `${countdown.days} days` : countdown.timeString}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show regular countdown for all other cases
  if (countdown.days <= 30) { // Only show if birthday is within 30 days
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Cake className="h-6 w-6 text-purple-600" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                Next Birthday Countdown
              </div>
              <div className="text-sm text-gray-600">
                {countdown.timeString}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default BirthdayCountdownAlert;
