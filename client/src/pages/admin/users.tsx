import DashboardLayout from "@/components/layout/dashboard-layout";
import UsersTable from "@/components/admin/users-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function UsersPage() {
  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Calculate stats
  const totalUsers = users.length;
  const bannedUsers = users.filter(user => user.isBanned).length;
  const activeUsers = totalUsers - bannedUsers;
  const admins = users.filter(user => user.isAdmin).length;
  const regularUsers = totalUsers - admins;
  
  // Calculate users with features
  const withContactGain = users.filter(user => user.contactGainStatus === "active").length;
  const withAds = users.filter(user => user.advertisementEnabled).length;
  
  // Prepare chart data
  const statusData = [
    { name: "Active", value: activeUsers, color: "#4ade80" },
    { name: "Banned", value: bannedUsers, color: "#f43f5e" },
  ];
  
  const typeData = [
    { name: "Regular", value: regularUsers, color: "#8b5cf6" },
    { name: "Admin", value: admins, color: "#3b82f6" },
  ];
  
  const featuresData = [
    { name: "Contact Gain", value: withContactGain, color: "#eab308" },
    { name: "Advertisement", value: withAds, color: "#ec4899" },
  ];

  return (
    <DashboardLayout title="Manage Users">
      <div className="py-6 space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>User Status</CardTitle>
              <CardDescription>Active vs banned users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} users`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>User Types</CardTitle>
              <CardDescription>Admin vs regular users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} users`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Premium Features</CardTitle>
              <CardDescription>Users with paid features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={featuresData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {featuresData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value} users`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>
              Manage all users registered on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
