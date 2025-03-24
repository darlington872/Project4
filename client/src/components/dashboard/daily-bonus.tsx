import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format, addDays, differenceInSeconds } from "date-fns";
import { cn } from "@/lib/utils";

export default function DailyBonus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  
  // Get daily bonus amount from settings
  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
  });
  
  const dailyBonusAmount = settings?.find(s => s.key === "dailyBonus")?.value || "500";
  
  // Format time left
  const formatTimeLeft = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Update time left
  const updateTimeLeft = () => {
    if (!user?.dailyBonusLastClaimed) return;
    
    const lastClaimed = new Date(user.dailyBonusLastClaimed);
    const nextAvailable = addDays(lastClaimed, 1);
    const now = new Date();
    
    if (now >= nextAvailable) {
      setTimeLeft("Available now");
      return;
    }
    
    const seconds = differenceInSeconds(nextAvailable, now);
    setTimeLeft(formatTimeLeft(seconds));
    
    setTimeout(updateTimeLeft, 1000);
  };
  
  // Start timer when user data is available
  useState(() => {
    if (user?.dailyBonusLastClaimed) {
      updateTimeLeft();
    }
  });
  
  // Claim bonus mutation
  const claimBonusMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/claim-bonus");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Daily Bonus Claimed!",
        description: `₦${data.bonusAmount} has been added to your balance.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to claim bonus",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleClaimBonus = () => {
    claimBonusMutation.mutate();
  };
  
  const canClaim = !user?.dailyBonusClaimed || (
    user?.dailyBonusLastClaimed && 
    new Date() >= addDays(new Date(user.dailyBonusLastClaimed), 1)
  );
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Daily Bonus</CardTitle>
        <div className="text-yellow-400">
          <Gift className="h-5 w-5" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="flex items-center justify-center py-6">
          <div className="text-center">
            {canClaim ? (
              <>
                <div className="w-24 h-24 rounded-full bg-yellow-500/10 border-4 border-yellow-400 flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Gift className="h-10 w-10 text-yellow-400" />
                </div>
                <p className="text-lg font-medium mb-1">Daily Bonus Available!</p>
                <p className="text-muted-foreground">
                  Claim your <span className="text-yellow-400 font-semibold">₦{parseInt(dailyBonusAmount).toLocaleString()}</span> daily bonus
                </p>
                <Button 
                  onClick={handleClaimBonus} 
                  className="mt-6 bg-yellow-500 hover:bg-yellow-600 text-white" 
                  disabled={claimBonusMutation.isPending}
                >
                  {claimBonusMutation.isPending ? "Claiming..." : "Claim Bonus"}
                </Button>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-muted border-4 border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-yellow-400 text-2xl font-bold">✓</span>
                </div>
                <p className="text-lg font-medium mb-1">Daily Bonus Claimed!</p>
                <p className="text-muted-foreground">
                  You earned <span className="text-yellow-400 font-semibold">₦{parseInt(dailyBonusAmount).toLocaleString()}</span> today
                </p>
                <p className={cn("text-sm text-muted-foreground mt-4", 
                  timeLeft === "Available now" && "text-green-500 font-medium"
                )}>
                  {timeLeft ? (
                    timeLeft === "Available now" ? 
                      "Bonus is available now!" : 
                      `Next bonus available in ${timeLeft}`
                  ) : (
                    "Next bonus available tomorrow"
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
