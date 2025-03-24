import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Link } from "wouter";

export default function ReferralStats() {
  // Fetching referral data
  const { data: referrals = [] } = useQuery({
    queryKey: ["/api/referrals"],
  });
  
  // Fetching settings for minimum required referrals
  const { data: settings } = useQuery({
    queryKey: ["/api/admin/settings"],
  });
  
  // Calculate required referrals (default to 20 if not loaded)
  const minReferrals = settings?.find(s => s.key === "minimumReferralsForWithdrawal")?.value || "20";
  const referralsNeeded = Math.max(0, parseInt(minReferrals) - referrals.length);
  
  // Calculate total earnings from referrals
  const totalEarnings = referrals.length * 1000; // ₦1000 per referral
  
  // We'll assume active referrals are all of them for now
  const activeReferrals = referrals.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Referral Stats</CardTitle>
        <Users className="text-primary h-5 w-5" />
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-sm">Total Referrals</p>
            <p className="text-2xl font-bold">{referrals.length}</p>
          </div>
          
          <div>
            <p className="text-muted-foreground text-sm">Active Referrals</p>
            <p className="text-2xl font-bold">{activeReferrals}</p>
          </div>
          
          <div>
            <p className="text-muted-foreground text-sm">Earnings</p>
            <p className="text-2xl font-bold">₦{totalEarnings.toLocaleString()}</p>
          </div>
          
          <div>
            <p className="text-muted-foreground text-sm">Need for Withdrawal</p>
            <p className="text-2xl font-bold text-yellow-400">
              {referralsNeeded > 0 ? `${referralsNeeded} more` : "Eligible"}
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <Button asChild className="w-full">
            <Link href="/refer">
              <a>Get Referral Link</a>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
