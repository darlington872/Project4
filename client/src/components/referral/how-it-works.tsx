import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How It Works</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
            1
          </div>
          <div>
            <p className="font-medium">Share your referral link</p>
            <p className="text-muted-foreground text-sm mt-1">
              Send your unique referral link to friends and family through WhatsApp, 
              Facebook, Twitter, or any other platform.
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
            2
          </div>
          <div>
            <p className="font-medium">They sign up using your link</p>
            <p className="text-muted-foreground text-sm mt-1">
              When someone uses your link to register and create an account, 
              they become your referral, connected to your account.
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
            3
          </div>
          <div>
            <p className="font-medium">You earn ₦1,000 per referral</p>
            <p className="text-muted-foreground text-sm mt-1">
              For each successful referral, ₦1,000 is instantly added to your 
              ReferPay account balance. The more people you refer, the more you earn!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
