import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { nanoid } from "nanoid";
import { z } from "zod";
import { 
  insertWithdrawalSchema, 
  insertAdvertisementSchema, 
  insertNotificationSchema, 
  insertPaymentSchema,
  insertProductSchema,
  insertOrderSchema,
  insertOrderItemSchema
} from "@shared/schema";

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Admin middleware
function isAdmin(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
  // Dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const totalUsers = await storage.getTotalUserCount();
      const totalPayout = await storage.getTotalPayout();
      const dailyBonus = await storage.getSetting("dailyBonus");
      
      res.json({
        totalUsers,
        totalPayout,
        dailyBonus: parseInt(dailyBonus || "500"),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats" });
    }
  });
  
  // Profile routes
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      
      const referrals = await storage.getUserReferrals(user.id);
      const transactions = await storage.getUserTransactions(user.id);
      
      res.json({
        user: userWithoutPassword,
        referrals,
        transactions,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });
  
  app.patch("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const allowedUpdates = ["fullName", "email", "bankName", "accountNumber", "accountName"];
      const updates: Record<string, any> = {};
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });
      
      const updatedUser = await storage.updateUser(req.user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  // Referral routes
  app.get("/api/referrals", isAuthenticated, async (req, res) => {
    try {
      const referrals = await storage.getUserReferrals(req.user.id);
      
      // Get referred users' details
      const referredUsersPromises = referrals.map(async (referral) => {
        const user = await storage.getUser(referral.referredId);
        return {
          ...referral,
          referredUser: user ? {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
          } : null,
        };
      });
      
      const referralsWithUsers = await Promise.all(referredUsersPromises);
      
      res.json(referralsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get referrals" });
    }
  });
  
  // Transaction routes
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.user.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });
  
  // Daily bonus
  app.post("/api/claim-bonus", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if bonus already claimed today
      const now = new Date();
      const lastClaimed = user.dailyBonusLastClaimed;
      
      if (lastClaimed) {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastClaimedDate = new Date(
          lastClaimed.getFullYear(), 
          lastClaimed.getMonth(), 
          lastClaimed.getDate()
        );
        
        if (today.getTime() === lastClaimedDate.getTime()) {
          return res.status(400).json({ message: "Daily bonus already claimed today" });
        }
      }
      
      // Get bonus amount from settings
      const bonusAmountStr = await storage.getSetting("dailyBonus");
      const bonusAmount = parseInt(bonusAmountStr || "500");
      
      // Update user
      const updatedUser = await storage.updateUser(req.user.id, {
        balance: user.balance + bonusAmount,
        dailyBonusClaimed: true,
        dailyBonusLastClaimed: now,
      });
      
      // Create transaction
      await storage.createTransaction({
        userId: user.id,
        type: "bonus",
        amount: bonusAmount,
        description: "Daily bonus",
        status: "completed",
        metadata: null,
      });
      
      const { password, ...userWithoutPassword } = updatedUser!;
      
      res.json({
        message: "Daily bonus claimed successfully",
        bonusAmount,
        user: userWithoutPassword,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to claim bonus" });
    }
  });
  
  // Withdrawal routes
  app.post("/api/withdrawals", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request
      const schema = insertWithdrawalSchema.extend({
        amount: z.number().min(15000, "Minimum withdrawal amount is ₦15,000"),
      });
      
      const validData = schema.parse(req.body);
      
      // Check if user has bank details
      if (!user.bankName || !user.accountNumber || !user.accountName) {
        return res.status(400).json({ message: "Bank details not set" });
      }
      
      // Check minimum referrals
      const minReferralsStr = await storage.getSetting("minimumReferralsForWithdrawal");
      const minReferrals = parseInt(minReferralsStr || "20");
      const referralCount = await storage.getReferralCount(user.id);
      
      // Check for bypass
      const bypassed = req.body.bypassed || false;
      let canWithdraw = referralCount >= minReferrals;
      
      if (!canWithdraw && !bypassed) {
        return res.status(400).json({
          message: `Need at least ${minReferrals} referrals or bypass the requirement`,
          referralCount,
          minReferrals,
        });
      }
      
      // Check sufficient balance (amount + fee)
      const fee = 100; // Fixed fee
      if (user.balance < validData.amount + fee) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create withdrawal
      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount: validData.amount,
        bankName: user.bankName,
        accountNumber: user.accountNumber,
        accountName: user.accountName,
        bypassed,
      });
      
      res.status(201).json({
        message: "Withdrawal request submitted successfully",
        withdrawal,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });
  
  app.get("/api/withdrawals", isAuthenticated, async (req, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.user.id);
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get withdrawals" });
    }
  });
  
  // Advertisement routes
  app.post("/api/advertisements", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has paid for advertisement
      if (!user.advertisementEnabled) {
        return res.status(403).json({ message: "Advertisement feature not enabled" });
      }
      
      // Validate request
      const validData = insertAdvertisementSchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      // Create advertisement
      const advertisement = await storage.createAdvertisement(validData);
      
      res.status(201).json({
        message: "Advertisement submitted successfully",
        advertisement,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create advertisement" });
    }
  });
  
  app.get("/api/advertisements", async (req, res) => {
    try {
      const status = req.isAuthenticated() && req.user.isAdmin ? undefined : "approved";
      const advertisements = await storage.listAdvertisements(status);
      res.json(advertisements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get advertisements" });
    }
  });
  
  app.get("/api/my-advertisements", isAuthenticated, async (req, res) => {
    try {
      const advertisements = await storage.getUserAdvertisements(req.user.id);
      res.json(advertisements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get advertisements" });
    }
  });
  
  // Payment routes (for contact gain and advertisement registration)
  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request
      const schema = insertPaymentSchema.extend({
        type: z.enum(["contact_gain", "advertisement", "withdrawal_bypass"]),
        amount: z.number().positive(),
        proofOfPayment: z.string().optional(),
      });
      
      const validData = schema.parse({
        ...req.body,
        userId: user.id,
      });
      
      // Check payment type and amount
      let requiredAmount: number;
      
      if (validData.type === "contact_gain") {
        const contactGainFeeStr = await storage.getSetting("contactGainFee");
        requiredAmount = parseInt(contactGainFeeStr || "2000");
        
        // Check if user already has active contact gain
        if (user.contactGainStatus === "active") {
          return res.status(400).json({ message: "Contact gain already active" });
        }
      } else if (validData.type === "advertisement") {
        const adFeeStr = await storage.getSetting("advertisementFee");
        requiredAmount = parseInt(adFeeStr || "3000");
        
        // Check if user already has active advertisement
        if (user.advertisementEnabled) {
          return res.status(400).json({ message: "Advertisement already enabled" });
        }
      } else if (validData.type === "withdrawal_bypass") {
        const bypassFeeStr = await storage.getSetting("withdrawalBypassFee");
        requiredAmount = parseInt(bypassFeeStr || "2500");
      } else {
        return res.status(400).json({ message: "Invalid payment type" });
      }
      
      // Check amount
      if (validData.amount !== requiredAmount) {
        return res.status(400).json({ 
          message: `Incorrect amount. Required: ₦${requiredAmount}`,
          requiredAmount,
        });
      }
      
      // Create payment
      const payment = await storage.createPayment({
        userId: user.id,
        type: validData.type,
        amount: validData.amount,
      });
      
      res.status(201).json({
        message: "Payment submitted successfully",
        payment,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });
  
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getUserPayments(req.user.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get payments" });
    }
  });
  
  // Notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });
  
  app.post("/api/notifications/read/:id", isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });
  
  // Contact gain routes
  app.post("/api/contact-gain", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough referrals
      const requiredReferralsStr = await storage.getSetting("referralsForContactGain");
      const requiredReferrals = parseInt(requiredReferralsStr || "15");
      const referralCount = await storage.getReferralCount(user.id);
      
      // Check status
      if (user.contactGainStatus === "active") {
        return res.status(400).json({ message: "Contact gain already active" });
      }
      
      if (referralCount < requiredReferrals) {
        return res.status(400).json({
          message: `Need at least ${requiredReferrals} referrals or make a payment`,
          referralCount,
          requiredReferrals,
        });
      }
      
      // Activate contact gain
      const updatedUser = await storage.updateUser(user.id, {
        contactGainStatus: "active",
      });
      
      const { password, ...userWithoutPassword } = updatedUser!;
      
      res.json({
        message: "Contact gain activated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate contact gain" });
    }
  });
  
  // Admin routes
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      
      // Remove passwords
      const usersWithoutPassword = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  
  app.post("/api/admin/users/:id/ban", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.banUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User banned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to ban user" });
    }
  });
  
  app.post("/api/admin/users/:id/unban", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.unbanUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unban user" });
    }
  });
  
  app.get("/api/admin/withdrawals", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const withdrawals = await storage.listWithdrawals(status);
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ message: "Failed to get withdrawals" });
    }
  });
  
  app.patch("/api/admin/withdrawals/:id", isAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const status = req.body.status;
      
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const withdrawal = await storage.updateWithdrawalStatus(withdrawalId, status);
      
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }
      
      res.json({
        message: `Withdrawal ${status}`,
        withdrawal,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update withdrawal" });
    }
  });
  
  app.get("/api/admin/payments", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const payments = await storage.listPayments(status);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get payments" });
    }
  });
  
  app.patch("/api/admin/payments/:id", isAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const status = req.body.status;
      
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const payment = await storage.updatePaymentStatus(paymentId, status);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json({
        message: `Payment ${status}`,
        payment,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment" });
    }
  });
  
  app.get("/api/admin/advertisements", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const advertisements = await storage.listAdvertisements(status);
      res.json(advertisements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get advertisements" });
    }
  });
  
  app.patch("/api/admin/advertisements/:id", isAdmin, async (req, res) => {
    try {
      const advertisementId = parseInt(req.params.id);
      const status = req.body.status;
      
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const advertisement = await storage.updateAdvertisementStatus(advertisementId, status);
      
      if (!advertisement) {
        return res.status(404).json({ message: "Advertisement not found" });
      }
      
      res.json({
        message: `Advertisement ${status}`,
        advertisement,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update advertisement" });
    }
  });
  
  app.post("/api/admin/broadcast", isAdmin, async (req, res) => {
    try {
      const schema = insertNotificationSchema.extend({
        title: z.string().min(1, "Title is required"),
        message: z.string().min(1, "Message is required"),
      });
      
      const validData = schema.parse({
        ...req.body,
        isGlobal: true,
      });
      
      const notification = await storage.createNotification(validData);
      
      res.status(201).json({
        message: "Broadcast sent successfully",
        notification,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to send broadcast" });
    }
  });
  
  app.get("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get settings" });
    }
  });
  
  app.patch("/api/admin/settings/:key", isAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const success = await storage.updateSetting(key, value.toString());
      
      if (!success) {
        return res.status(400).json({ message: "Failed to update setting" });
      }
      
      res.json({
        message: "Setting updated successfully",
        key,
        value,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });
  
  app.post("/api/admin/maintenance", isAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;
      
      if (enabled === undefined) {
        return res.status(400).json({ message: "Enabled status is required" });
      }
      
      const value = enabled ? "true" : "false";
      const success = await storage.updateSetting("maintenanceMode", value);
      
      if (!success) {
        return res.status(400).json({ message: "Failed to update maintenance mode" });
      }
      
      res.json({
        message: `Maintenance mode ${enabled ? "enabled" : "disabled"}`,
        enabled,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update maintenance mode" });
    }
  });

  // Marketplace routes
  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const products = await storage.listProducts(category);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get product" });
    }
  });

  app.post("/api/products", isAdmin, async (req, res) => {
    try {
      const schema = insertProductSchema.extend({
        name: z.string().min(1, "Name is required"),
        description: z.string().min(1, "Description is required"),
        price: z.number().positive("Price must be positive"),
        category: z.string().min(1, "Category is required"),
        image: z.string().min(1, "Image URL is required"),
      });
      
      const validData = schema.parse(req.body);
      const product = await storage.createProduct(validData);
      
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const updates = req.body;
      
      const product = await storage.updateProduct(productId, updates);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Orders
  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const schema = z.object({
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number().int().positive(),
        })),
      });
      
      const { items } = schema.parse(req.body);
      
      if (items.length === 0) {
        return res.status(400).json({ message: "No items in order" });
      }
      
      // Calculate total
      let totalAmount = 0;
      
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }
        
        if (!product.inStock) {
          return res.status(400).json({ message: `Product ${product.name} is out of stock` });
        }
        
        // Use discount price if available
        const price = product.discountPrice !== null ? product.discountPrice : product.price;
        totalAmount += price * item.quantity;
      }
      
      // Check user balance
      if (user.balance < totalAmount) {
        return res.status(400).json({ 
          message: "Insufficient balance",
          required: totalAmount,
          balance: user.balance
        });
      }
      
      // Create order
      const order = await storage.createOrder({
        userId: user.id,
        totalAmount,
      });
      
      // Create order items
      const orderItemsPromises = items.map(async (item) => {
        const product = await storage.getProduct(item.productId);
        const price = product!.discountPrice !== null ? product!.discountPrice! : product!.price;
        
        return storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price,
        });
      });
      
      const orderItems = await Promise.all(orderItemsPromises);
      
      // Update user balance
      await storage.updateUser(user.id, {
        balance: user.balance - totalAmount,
      });
      
      // Create transaction
      await storage.createTransaction({
        userId: user.id,
        type: "purchase",
        amount: -totalAmount,
        description: `Purchase of ${items.length} product(s)`,
        status: "completed",
        metadata: { orderId: order.id },
      });
      
      res.status(201).json({
        message: "Order created successfully",
        order,
        items: orderItems,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getUserOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if order belongs to user or user is admin
      if (order.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const items = await storage.getOrderItems(orderId);
      
      // Get product details for each order item
      const itemsWithProductDetails = await Promise.all(
        items.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return {
            ...item,
            product,
          };
        })
      );
      
      res.json({
        order,
        items: itemsWithProductDetails,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  // Admin marketplace routes
  app.get("/api/admin/orders", isAdmin, async (req, res) => {
    try {
      // Get all orders (can be filtered by status in the future)
      const orders = await storage.listOrders();
      
      // Get basic user info for each order
      const ordersWithUserInfo = await Promise.all(
        orders.map(async (order) => {
          const user = await storage.getUser(order.userId);
          return {
            ...order,
            user: user ? {
              id: user.id,
              username: user.username,
              email: user.email,
            } : null,
          };
        })
      );
      
      res.json(ordersWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.patch("/api/admin/orders/:id/status", isAdmin, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const order = await storage.updateOrderStatus(orderId, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Send notification to user
      if (status !== "pending") {
        await storage.createNotification({
          userId: order.userId,
          title: "Order Update",
          message: `Your order #${order.id} has been ${status}.`,
          isGlobal: false,
        });
      }
      
      res.json({
        message: `Order status updated to ${status}`,
        order,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
