import { useState, useEffect } from "react";
import { Users, Wallet, Gift } from "lucide-react";

interface StatsCardProps {
  isRealData?: boolean;
}

export default function StatsCard({ isRealData = false }: StatsCardProps) {
  const [userCount, setUserCount] = useState(isRealData ? 0 : 15000);
  const [totalPayout, setTotalPayout] = useState(isRealData ? 0 : 2400000);
  const [dailyBonus, setDailyBonus] = useState(500);
  
  useEffect(() => {
    // Fetch real stats if isRealData is true
    if (isRealData) {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
          setUserCount(data.totalUsers);
          setTotalPayout(data.totalPayout);
          setDailyBonus(data.dailyBonus);
        })
        .catch(error => {
          console.error('Failed to fetch stats:', error);
        });
    } else {
      // Animate the mock counters
      const userCountTarget = 15427;
      const totalPayoutTarget = 2457820;
      
      let startTimestamp: number | null = null;
      const duration = 2000;
      
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        setUserCount(Math.floor(progress * (userCountTarget - 15000) + 15000));
        setTotalPayout(Math.floor(progress * (totalPayoutTarget - 2400000) + 2400000));
        
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      
      requestAnimationFrame(step);
      
      // Periodically increase the counters for realistic effect
      const interval = setInterval(() => {
        setUserCount(prevCount => prevCount + Math.floor(Math.random() * 3));
        setTotalPayout(prevPayout => prevPayout + Math.floor(Math.random() * 1000));
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isRealData]);
  
  return (
    <div className="flex flex-wrap justify-center gap-3 md:gap-5">
      <div className="bg-card rounded-lg py-2 px-4 flex items-center">
        <div className="mr-2 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Users</p>
          <p className="font-bold">{userCount.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-card rounded-lg py-2 px-4 flex items-center">
        <div className="mr-2 text-green-500">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Payouts</p>
          <p className="font-bold">₦{totalPayout.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="bg-card rounded-lg py-2 px-4 flex items-center">
        <div className="mr-2 text-yellow-400">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Daily Bonus</p>
          <p className="font-bold">₦{dailyBonus.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
