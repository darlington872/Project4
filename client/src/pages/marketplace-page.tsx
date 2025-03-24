import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { Product } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function MarketplacePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<{productId: number; quantity: number}[]>([]);

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory 
        ? `/api/products?category=${encodeURIComponent(selectedCategory)}`
        : "/api/products";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }
  });

  const categories = products ? [...new Set(products.map(p => p.category))].sort() : [];

  const orderMutation = useMutation({
    mutationFn: async (items: {productId: number; quantity: number}[]) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to place order");
      }
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed Successfully",
        description: "Your items will be delivered soon!",
      });
      setCart([]);
      setCartOpen(false);
      // Invalidate queries that should be updated
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addToCart = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;
    
    // Check if product is already in cart
    const existingItem = cart.find(item => item.productId === selectedProduct.id);
    
    if (existingItem) {
      // Update quantity
      setCart(cart.map(item => 
        item.productId === selectedProduct.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      // Add new item
      setCart([...cart, { productId: selectedProduct.id, quantity }]);
    }
    
    toast({
      title: "Added to Cart",
      description: `${quantity} × ${selectedProduct.name} added to your cart.`
    });
    
    setSelectedProduct(null);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const placeOrder = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is Empty",
        description: "Add some products to your cart first!",
        variant: "destructive"
      });
      return;
    }
    
    orderMutation.mutate(cart);
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => {
    const product = products?.find(p => p.id === item.productId);
    if (!product) return total;
    
    const price = product.discountPrice !== null ? product.discountPrice : product.price;
    return total + (price * item.quantity);
  }, 0);

  return (
    <DashboardLayout title="Marketplace" showSidebar>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Marketplace</h2>
            <p className="text-muted-foreground">
              Purchase products using your balance
            </p>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            Cart ({cart.length})
          </Button>
        </div>
        
        <Separator />
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 flex flex-wrap">
            <TabsTrigger 
              value="all" 
              onClick={() => setSelectedCategory(null)}
              className="mr-2 mb-2"
            >
              All Products
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                onClick={() => setSelectedCategory(category)}
                className="mr-2 mb-2"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No products found</p>
              </div>
            )}
          </TabsContent>
          
          {categories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products && products.filter(p => p.category === category).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.filter(p => p.category === category).map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No products found in this category</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Product Quantity Dialog */}
      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Cart</DialogTitle>
              <DialogDescription>
                How many {selectedProduct.name} would you like to add?
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Input 
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                  min="1"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Price: ₦{selectedProduct.discountPrice !== null 
                    ? selectedProduct.discountPrice 
                    : selectedProduct.price} each
                </p>
                <p className="font-medium mt-1">
                  Total: ₦{(selectedProduct.discountPrice !== null 
                    ? selectedProduct.discountPrice 
                    : selectedProduct.price) * quantity}
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                Cancel
              </Button>
              <Button onClick={confirmAddToCart}>
                Add to Cart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Shopping Cart Dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Your Shopping Cart</DialogTitle>
            <DialogDescription>
              Review your items before checkout
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {cart.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">Your cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => {
                  const product = products?.find(p => p.id === item.productId);
                  if (!product) return null;
                  
                  const price = product.discountPrice !== null 
                    ? product.discountPrice 
                    : product.price;
                    
                  return (
                    <div key={item.productId} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} × ₦{price} = ₦{price * item.quantity}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFromCart(item.productId)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
                
                <Separator className="my-4" />
                
                <div className="flex justify-between">
                  <p className="font-semibold">Total:</p>
                  <p className="font-semibold">₦{cartTotal}</p>
                </div>
                
                {user && user.balance < cartTotal && (
                  <p className="text-sm text-destructive mt-2">
                    Insufficient balance. You need ₦{cartTotal - user.balance} more.
                  </p>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCartOpen(false)}>
              Continue Shopping
            </Button>
            <Button 
              onClick={placeOrder} 
              disabled={cart.length === 0 || orderMutation.isPending || (user && user.balance < cartTotal)}
            >
              {orderMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
      <div className="aspect-[16/9] bg-muted relative overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/50">
            <p className="text-muted-foreground">No image</p>
          </div>
        )}
        
        {product.discountPrice !== null && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            Sale
          </Badge>
        )}
        
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Badge className="bg-destructive text-white text-lg py-1 px-3">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{product.name}</CardTitle>
          <Badge variant="outline">{product.category}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-3">
          {product.description}
        </p>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start gap-4 pt-0">
        <div className="w-full flex justify-between items-center">
          <div>
            {product.discountPrice !== null ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">₦{product.discountPrice}</span>
                <span className="text-muted-foreground line-through">₦{product.price}</span>
              </div>
            ) : (
              <span className="text-xl font-bold">₦{product.price}</span>
            )}
          </div>
          
          <Button 
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
          >
            Add to Cart
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}