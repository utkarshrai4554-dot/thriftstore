import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { manuallyTriggerBirthdayChecks } from "@/utils/birthdayScheduler";
import { Gift, Users, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const BirthdayRewardAdmin = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleRunBirthdayChecks = async () => {
    setIsRunning(true);
    try {
      const result = await manuallyTriggerBirthdayChecks();
      setLastResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Failed to run birthday checks');
      console.error('Birthday check error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Birthday Reward Administration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Manual Birthday Check</h4>
            <p className="text-sm text-muted-foreground">
              Trigger birthday reward checks for all users immediately
            </p>
          </div>
          <Button 
            onClick={handleRunBirthdayChecks}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isRunning ? 'Running...' : 'Run Birthday Checks'}
          </Button>
        </div>

        {lastResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h5 className="font-medium mb-2">Last Check Results</h5>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  Users processed: <strong>{lastResult.processed}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  Birthday rewards awarded: <strong>{lastResult.awarded}</strong>
                </span>
              </div>
              <Badge variant={lastResult.success ? "default" : "destructive"}>
                {lastResult.success ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Success
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Failed
                  </>
                )}
              </Badge>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
          <strong>Note:</strong> In production, birthday checks should be automated 
          using server-side cron jobs or cloud functions that run daily at a specific time.
        </div>
      </CardContent>
    </Card>
  );
};

export default BirthdayRewardAdmin;
