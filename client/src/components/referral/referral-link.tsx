import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FaFacebook, FaTwitter, FaWhatsapp, FaTelegram } from "react-icons/fa";

export default function ReferralLink() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Create referral link
  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/auth?ref=${user?.referralCode}`;
  
  // Social share links
  const whatsappLink = `https://wa.me/?text=Join%20ReferPay%20and%20earn%20money%20through%20referrals!%20Use%20my%20referral%20link:%20${encodeURIComponent(referralLink)}`;
  const twitterLink = `https://twitter.com/intent/tweet?text=Join%20ReferPay%20and%20earn%20money%20through%20referrals!%20Use%20my%20referral%20link:&url=${encodeURIComponent(referralLink)}`;
  const facebookLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
  const telegramLink = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Join%20ReferPay%20and%20earn%20money%20through%20referrals!%20Use%20my%20referral%20link:`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <Card className="border-primary/30 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          <span>Your Referral Link</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center gap-2 mb-6">
          <Input 
            value={referralLink}
            readOnly
            className="bg-muted font-mono text-sm"
          />
          <Button onClick={handleCopy} variant={copied ? "default" : "outline"}>
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button className="bg-[#25D366] hover:bg-[#25D366]/90" asChild>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <FaWhatsapp className="h-4 w-4 mr-2" />
              Share on WhatsApp
            </a>
          </Button>
          
          <Button className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90" asChild>
            <a href={twitterLink} target="_blank" rel="noopener noreferrer">
              <FaTwitter className="h-4 w-4 mr-2" />
              Share on Twitter
            </a>
          </Button>
          
          <Button className="bg-[#3b5998] hover:bg-[#3b5998]/90" asChild>
            <a href={facebookLink} target="_blank" rel="noopener noreferrer">
              <FaFacebook className="h-4 w-4 mr-2" />
              Share on Facebook
            </a>
          </Button>
          
          <Button className="bg-[#0088cc] hover:bg-[#0088cc]/90" asChild>
            <a href={telegramLink} target="_blank" rel="noopener noreferrer">
              <FaTelegram className="h-4 w-4 mr-2" />
              Share on Telegram
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
