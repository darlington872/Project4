import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, HandCoins, RotateCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function BalanceCard() {
  const { user } = useAuth();
  const balance = user?.balance || 0;

  return (
    <Card className="border-primary/30 shadow-lg shadow-primary/10 overflow-hidden relative">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent"></div>
      
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl text-muted-foreground mb-1">Your Balance</h2>
            <div className="flex items-end">
              <p className={cn(
                "text-4xl md:text-5xl font-bold",
                balance > 0 ? "text-white" : "text-muted-foreground"
              )}>
                ₦{balance.toLocaleString()}<span className="text-primary">.</span>00
              </p>
              
              {/* This would be dynamic in a real app */}
              <p className="ml-2 text-green-500 flex items-center mb-1">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>+1,000</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 md:flex md:space-x-4 w-full md:w-auto">
            <Button asChild className="bg-primary/90 hover:bg-primary">
              <Link href="/withdraw">
                <a className="flex items-center gap-2">
                  <HandCoins className="h-4 w-4" />
                  <span>Withdraw</span>
                </a>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="border-primary">
              <Link href="/refer">
                <a className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Refer</span>
                </a>
              </Link>
            </Button>
            
            <Button variant="secondary" className="flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              <span>History</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
