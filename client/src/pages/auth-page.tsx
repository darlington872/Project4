import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Redirect } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import StatsCard from "@/components/home/stats-card";
import LiveActivity from "@/components/home/live-activity";
import TestimonialCard from "@/components/home/testimonial-card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Login schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referredBy: z.string().optional(),
});

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  
  // Get referral code from URL if present
  const searchParams = new URLSearchParams(window.location.search);
  const referralCode = searchParams.get("ref");
  
  // Set up login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Set up registration form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      referredBy: referralCode || "",
    },
  });
  
  // Handle login form submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };
  
  // Handle registration form submission
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values);
  };
  
  // Redirect to dashboard if already logged in
  if (user) {
    return <Redirect to="/" />;
  }
  
  // Setup testimonial data
  const testimonials = [
    {
      name: "Oluwaseun T.",
      initial: "O",
      text: "I was skeptical at first but NaijaValue has proven to be legitimate. I've withdrawn over ₦45,000 in just my first month!",
      rating: 5
    },
    {
      name: "Chioma N.",
      initial: "C",
      text: "This platform has been a game-changer for me. The referral system is easy and the payouts come on time. Highly recommended!",
      rating: 4.5
    },
    {
      name: "Adebayo K.",
      initial: "A",
      text: "The daily bonus feature adds extra value. I've earned over ₦60,000 in 2 months just from referrals and daily bonuses.",
      rating: 5
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="relative py-10 px-6 md:py-16 md:px-10 overflow-hidden">
        <div className="absolute inset-0 opacity-20 texture-bg"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-8 md:mb-0">
              <div className="bg-primary purple-glow rounded-xl p-2 mr-3">
                <i className="fas fa-money-bill-wave text-white text-2xl"></i>
              </div>
              <h1 className="text-3xl font-bold tracking-tight glow-text">
                NaijaValue<span className="text-primary">.</span>
              </h1>
            </div>
            
            <StatsCard />
          </div>
          
          <div className="mt-12 md:mt-20 grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                <span className="text-primary">Refer</span> Friends,<br/>
                <span>Earn</span> Real Money
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Join thousands of Nigerians already earning through our referral system. Get ₦1,000 for each successful referral directly to your account.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Button 
                  className="bg-primary hover:bg-primary/90 shadow-lg purple-glow"
                  onClick={() => setActiveTab("register")}
                >
                  Get Started Now
                </Button>
                <Button variant="outline" className="border-primary">
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="bg-card rounded-2xl p-6 shadow-2xl purple-glow">
              <Tabs 
                defaultValue="login" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="mt-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                      </Button>
                      
                      <div className="text-center">
                        <Button variant="link" className="text-primary hover:text-primary/90 p-0 h-auto text-sm">
                          Forgot password?
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="register" className="mt-6">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Create a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="referredBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referral Code (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter referral code if any" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Creating account..." : "Register Now"}
                      </Button>
                      
                      <div className="text-center text-sm text-muted-foreground">
                        By registering, you agree to our Terms of Service and Privacy Policy
                      </div>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </header>

      {/* Live Activity Feed */}
      <LiveActivity />

      {/* Testimonials */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">What Our Users Say</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Join thousands of Nigerians who are already earning daily through our platform.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                initial={testimonial.initial}
                text={testimonial.text}
                rating={testimonial.rating}
              />
            ))}
          </div>
        </div>
      </section>
      
      <footer className="bg-card py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="bg-primary rounded-xl p-2 mr-3">
                <i className="fas fa-money-bill-wave text-white"></i>
              </div>
              <h2 className="text-xl font-bold">NaijaValue</h2>
            </div>
            
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <i className="fab fa-telegram"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
          </div>
          
          <div className="border-t border-border mt-6 pt-6 text-center md:text-left">
            <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} NaijaValue. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
