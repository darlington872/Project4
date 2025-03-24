import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  UserPlus,
  WalletCards,
  LucideIcon,
  FileText,
  ContactIcon,
  Users,
  CreditCard,
  ClipboardCheck,
  Settings,
  ShoppingCart,
  Package,
  ShoppingBag,
} from "lucide-react";

type NavLinkProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

const NavLink = ({ href, label, icon: Icon, active }: NavLinkProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </a>
    </Link>
  );
};

type SidebarProps = {
  isAdmin: boolean;
};

export default function Sidebar({ isAdmin }: SidebarProps) {
  const [location] = useLocation();
  
  const userNavItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/refer",
      label: "Refer & Earn",
      icon: UserPlus,
    },
    {
      href: "/withdraw",
      label: "Withdraw",
      icon: WalletCards,
    },
    {
      href: "/marketplace",
      label: "Marketplace",
      icon: ShoppingCart,
    },
    {
      href: "/orders",
      label: "My Orders",
      icon: Package,
    },
    {
      href: "/advertise",
      label: "Advertise",
      icon: FileText,
    },
    {
      href: "/contact-gain",
      label: "Contact Gain",
      icon: ContactIcon,
    },
  ];
  
  const adminNavItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/admin/users",
      label: "Manage Users",
      icon: Users,
    },
    {
      href: "/admin/withdrawals",
      label: "Withdrawals",
      icon: CreditCard,
    },
    {
      href: "/admin/approvals",
      label: "Approvals",
      icon: ClipboardCheck,
    },
    {
      href: "/admin/marketplace",
      label: "Marketplace",
      icon: ShoppingBag,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
  ];
  
  const navItems = isAdmin ? adminNavItems : userNavItems;
  
  return (
    <aside className="w-64 hidden md:block bg-background border-r border-border shrink-0">
      <div className="p-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={location === item.href}
            />
          ))}
        </nav>
        
        {isAdmin && (
          <>
            <div className="mt-6 mb-4 border-t border-border"></div>
            <p className="px-3 text-xs font-medium text-muted-foreground mb-2">
              User Area
            </p>
            <nav className="space-y-1">
              {userNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={location === item.href}
                />
              ))}
            </nav>
          </>
        )}
      </div>
    </aside>
  );
}
