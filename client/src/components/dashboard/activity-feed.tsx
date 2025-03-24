import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@shared/schema";
import { BarChart3, CalendarDays, Gift, UserPlus, Wallet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ActivityFeed() {
  // Fetch user transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Get the 5 most recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Get the appropriate icon and color for each transaction type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "referral":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "bonus":
        return <Gift className="h-5 w-5 text-yellow-400" />;
      case "withdrawal":
        return <Wallet className="h-5 w-5 text-blue-500" />;
      case "refund":
        return <Wallet className="h-5 w-5 text-primary" />;
      default:
        return <BarChart3 className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Format amount with sign and color class
  const formatAmount = (transaction: Transaction) => {
    const isPositive = transaction.amount > 0;
    const amountText = `${isPositive ? "+" : ""}₦${Math.abs(transaction.amount).toLocaleString()}`;
    const colorClass = isPositive ? "text-green-500" : "text-red-500";
    
    return <span className={colorClass}>{amountText}</span>;
  };

  // Format the date to relative time
  const formatDate = (dateString: Date) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      
      <CardContent className="p-0">
        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No recent transactions
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted mr-3">
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="font-semibold">
                  {formatAmount(transaction)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
