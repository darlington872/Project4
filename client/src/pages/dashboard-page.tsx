import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import BalanceCard from "@/components/dashboard/balance-card";
import ReferralStats from "@/components/dashboard/referral-stats";
import DailyBonus from "@/components/dashboard/daily-bonus";
import QuickActions from "@/components/dashboard/quick-actions";
import ActivityFeed from "@/components/dashboard/activity-feed";
import { useAuth } from "@/hooks/use-auth";
import LiveActivity from "@/components/home/live-activity";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch user profile with referrals and transactions
  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });
  
  return (
    <DashboardLayout title="Dashboard">
      {/* Balance Overview */}
      <section className="py-4">
        <BalanceCard />
      </section>
      
      {/* Live Activity Feed for visual effect */}
      <LiveActivity />
      
      {/* Statistics Cards */}
      <section className="py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ReferralStats />
          <DailyBonus />
        </div>
      </section>
      
      {/* Recent Activity */}
      <section className="py-4">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <ActivityFeed />
      </section>
    </DashboardLayout>
  );
}

