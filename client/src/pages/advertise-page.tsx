import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/dashboard-layout";
import AdvertisementForm from "@/components/advertise/advertisement-form";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { Advertisement } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdvertisePage() {
  // Fetch advertisements
  const { data: myAds = [], isLoading: isLoadingMyAds } = useQuery<Advertisement[]>({
    queryKey: ["/api/my-advertisements"],
  });
  
  // Fetch public advertisements
  const { data: publicAds = [], isLoading: isLoadingPublicAds } = useQuery<Advertisement[]>({
    queryKey: ["/api/advertisements"],
  });
  
  // Table columns
  const columns: ColumnDef<Advertisement>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.title}</div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={
            status === "pending" ? "bg-yellow-500" :
            status === "approved" ? "bg-green-500" :
            "bg-destructive"
          }>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Advertise">
      <div className="py-6">
        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Post Your Advertisement</h2>
          <AdvertisementForm />
        </div>
        
        {myAds.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-6">Your Advertisements</h2>
            
            {isLoadingMyAds ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable columns={columns} data={myAds} />
            )}
          </div>
        )}
        
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-6">Marketplace</h2>
          
          {isLoadingPublicAds ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : publicAds.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publicAds.map((ad) => (
                <Card key={ad.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{ad.title}</CardTitle>
                      <div className="bg-primary/10 text-primary rounded-full p-1">
                        <Megaphone className="h-4 w-4" />
                      </div>
                    </div>
                    <CardDescription>
                      {format(new Date(ad.createdAt), "MMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {ad.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <p className="text-sm font-medium">Contact:</p>
                    <p className="text-sm">{ad.contactInfo}</p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No advertisements available</AlertTitle>
              <AlertDescription>
                There are no advertisements to display at the moment. 
                Be the first to post an advertisement!
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
