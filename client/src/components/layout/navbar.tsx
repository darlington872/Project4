import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Notification } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";

type NavbarProps = {
  title: string;
  isAdmin: boolean;
};

export default function Navbar({ title, isAdmin }: NavbarProps) {
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  
  const unreadNotifications = notifications.filter(n => !n.isRead);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const markAsRead = async (id: number) => {
    try {
      await apiRequest("POST", `/api/notifications/read/${id}`);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };
  
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : "U";
  
  return (
    <header className="sticky top-0 z-50 bg-background shadow-sm border-b border-purple-900/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
            
            <Link href={isAdmin ? "/admin" : "/"}>
              <a className="flex items-center gap-2">
                <div className="bg-primary rounded-xl p-1.5">
                  <i className="fas fa-money-bill-wave text-white"></i>
                </div>
                <span className="text-xl font-bold tracking-tight">
                  NaijaValue<span className="text-primary">.</span>
                </span>
              </a>
            </Link>
            
            <div className="hidden md:block">
              <h1 className="text-lg font-medium">{title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0">
                  <div className="px-4 py-2 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No notifications
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 ${
                              notification.isRead ? "opacity-70" : ""
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <h4 className="font-medium">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            )}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium hidden md:block">
                      {user.username}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <a className="w-full">Admin Dashboard</a>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/">
                      <a className="w-full">Dashboard</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/refer">
                      <a className="w-full">Refer & Earn</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/withdraw">
                      <a className="w-full">Withdraw</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/marketplace">
                      <a className="w-full">Marketplace</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">
                      <a className="w-full">My Orders</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden py-4 px-4 border-t border-border">
          <nav className="flex flex-col gap-2">
            <Link href="/">
              <a className="px-3 py-2 rounded-md hover:bg-muted">
                Dashboard
              </a>
            </Link>
            <Link href="/refer">
              <a className="px-3 py-2 rounded-md hover:bg-muted">
                Refer & Earn
              </a>
            </Link>
            <Link href="/withdraw">
              <a className="px-3 py-2 rounded-md hover:bg-muted">
                Withdraw
              </a>
            </Link>
            <Link href="/marketplace">
              <a className="px-3 py-2 rounded-md hover:bg-muted">
                Marketplace
              </a>
            </Link>
            <Link href="/orders">
              <a className="px-3 py-2 rounded-md hover:bg-muted">
                My Orders
              </a>
            </Link>
            <Link href="/advertise">
              <a className="px-3 py-2 rounded-md hover:bg-muted">
                Advertise
              </a>
            </Link>
            <Link href="/contact-gain">
              <a className="px-3 py-2 rounded-md hover:bg-muted">
                Contact Gain
              </a>
            </Link>
            {isAdmin && (
              <>
                <div className="my-2 border-t border-border"></div>
                <Link href="/admin">
                  <a className="px-3 py-2 rounded-md hover:bg-muted">
                    Admin Dashboard
                  </a>
                </Link>
                <Link href="/admin/users">
                  <a className="px-3 py-2 rounded-md hover:bg-muted">
                    Manage Users
                  </a>
                </Link>
                <Link href="/admin/withdrawals">
                  <a className="px-3 py-2 rounded-md hover:bg-muted">
                    Withdrawals
                  </a>
                </Link>
                <Link href="/admin/approvals">
                  <a className="px-3 py-2 rounded-md hover:bg-muted">
                    Approvals
                  </a>
                </Link>
                <Link href="/admin/marketplace">
                  <a className="px-3 py-2 rounded-md hover:bg-muted">
                    Marketplace
                  </a>
                </Link>
                <Link href="/admin/settings">
                  <a className="px-3 py-2 rounded-md hover:bg-muted">
                    Settings
                  </a>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

