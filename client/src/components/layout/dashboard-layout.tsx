import { ReactNode } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { useAuth } from "@/hooks/use-auth";

type DashboardLayoutProps = {
  children: ReactNode;
  title: string;
  showSidebar?: boolean;
};

export default function DashboardLayout({
  children,
  title,
  showSidebar = true,
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar title={title} isAdmin={isAdmin} />
      
      <div className="flex flex-1">
        {showSidebar && <Sidebar isAdmin={isAdmin} />}
        
        <main className="flex-1 p-4 md:p-6 bg-background">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
