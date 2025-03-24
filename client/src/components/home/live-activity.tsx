import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

// Activity types
type ActivityType = "withdrawal" | "referral" | "bonus";

// Activity item interface
interface ActivityItem {
  id: string;
  type: ActivityType;
  username: string;
  amount: number;
  time: string;
}

export default function LiveActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Generate random activities for display
  const generateActivities = () => {
    const types: ActivityType[] = ["withdrawal", "referral", "bonus"];
    const amounts = {
      withdrawal: [15000, 20000, 25000, 30000, 45000],
      referral: [1000],
      bonus: [500]
    };
    
    const times = ["just now", "2 min ago", "5 min ago", "7 min ago", "12 min ago"];
    
    // Create a pool of activities
    const activityPool: ActivityItem[] = [];
    
    for (let i = 0; i < 15; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = amounts[type][Math.floor(Math.random() * amounts[type].length)];
      const time = times[Math.floor(Math.random() * times.length)];
      
      activityPool.push({
        id: `activity-${i}`,
        type,
        username: `***${Math.floor(Math.random() * 1000)}`,
        amount,
        time
      });
    }
    
    setActivities(activityPool);
  };

  useEffect(() => {
    generateActivities();
    
    // Update activities periodically to simulate real-time updates
    const interval = setInterval(() => {
      const type = Math.random() > 0.7 ? "withdrawal" : (Math.random() > 0.5 ? "referral" : "bonus");
      const amount = type === "withdrawal" 
        ? [15000, 20000, 25000, 30000, 45000][Math.floor(Math.random() * 5)]
        : type === "referral" ? 1000 : 500;
        
      const newActivity = {
        id: `activity-${Date.now()}`,
        type: type as ActivityType,
        username: `***${Math.floor(Math.random() * 1000)}`,
        amount,
        time: "just now"
      };
      
      setActivities(prev => {
        const updated = [newActivity, ...prev.slice(0, 14)];
        return updated;
      });
      
      // Update the time descriptions
      setActivities(prev => 
        prev.map(activity => ({
          ...activity,
          time: activity.time === "just now" ? "1 min ago" 
              : activity.time === "1 min ago" ? "2 min ago"
              : activity.time === "2 min ago" ? "5 min ago"
              : activity.time === "5 min ago" ? "7 min ago"
              : activity.time === "7 min ago" ? "12 min ago"
              : activity.time
        }))
      );
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getColorByType = (type: ActivityType) => {
    switch (type) {
      case "withdrawal":
        return "bg-green-500";
      case "referral":
        return "bg-primary";
      case "bonus":
        return "bg-yellow-400";
      default:
        return "bg-muted-foreground";
    }
  };

  const getTextByType = (type: ActivityType, username: string, amount: number) => {
    switch (type) {
      case "withdrawal":
        return (
          <>
            <span className="font-semibold">{username}</span> withdrew{" "}
            <span className="text-green-500 font-semibold">₦{amount.toLocaleString()}</span>
          </>
        );
      case "referral":
        return (
          <>
            <span className="font-semibold">{username}</span> earned{" "}
            <span className="text-primary font-semibold">₦{amount.toLocaleString()}</span> from referral
          </>
        );
      case "bonus":
        return (
          <>
            <span className="font-semibold">{username}</span> received{" "}
            <span className="text-yellow-400 font-semibold">₦{amount.toLocaleString()}</span> daily bonus
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-4 overflow-hidden border-t border-b border-border relative">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10"></div>
      
      <div className="flex items-center whitespace-nowrap animate-marquee">
        {activities.map((activity) => (
          <Badge
            key={activity.id}
            variant="outline"
            className="flex items-center bg-secondary py-1 px-4 mr-4 rounded-full"
          >
            <div className={`w-2 h-2 rounded-full ${getColorByType(activity.type)} mr-2`}></div>
            <p className="text-sm">
              {getTextByType(activity.type, activity.username, activity.amount)} {activity.time}
            </p>
          </Badge>
        ))}
      </div>
    </div>
  );
}
