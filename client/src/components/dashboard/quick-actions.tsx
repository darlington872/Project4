import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  UserPlus,
  MessageCircle,
  BellRing,
  HandCoins,
  ShoppingCart,
  Package
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  className?: string;
}

export default function QuickActions({ className }: QuickActionsProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        <div className="text-primary">
          <BellRing className="h-5 w-5" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 bg-muted hover:bg-muted/80"
            asChild
          >
            <Link href="/refer">
              <UserPlus className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm">Refer Friends</span>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 bg-muted hover:bg-muted/80"
            asChild
          >
            <Link href="/marketplace">
              <ShoppingCart className="h-8 w-8 text-indigo-400 mb-2" />
              <span className="text-sm">Marketplace</span>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 bg-muted hover:bg-muted/80"
            asChild
          >
            <Link href="/withdraw">
              <HandCoins className="h-8 w-8 text-green-500 mb-2" />
              <span className="text-sm">Withdraw</span>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 bg-muted hover:bg-muted/80"
            asChild
          >
            <Link href="/orders">
              <Package className="h-8 w-8 text-amber-400 mb-2" />
              <span className="text-sm">My Orders</span>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 bg-muted hover:bg-muted/80"
            asChild
          >
            <Link href="/advertise">
              <MessageCircle className="h-8 w-8 text-blue-400 mb-2" />
              <span className="text-sm">Advertise</span>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-24 bg-muted hover:bg-muted/80"
            asChild
          >
            <Link href="/contact-gain">
              <BellRing className="h-8 w-8 text-yellow-400 mb-2" />
              <span className="text-sm">Contact Gain</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
