import { 
  users, referrals, transactions, withdrawals, advertisements, notifications, payments, settings, 
  products, orders, orderItems,
  User, InsertUser, Referral, InsertReferral, Transaction, InsertTransaction, 
  Withdrawal, InsertWithdrawal, Advertisement, InsertAdvertisement, Notification, InsertNotification, 
  Payment, InsertPayment, Settings, InsertSettings,
  Product, InsertProduct, Order, InsertOrder, OrderItem, InsertOrderItem
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { referralCode: string }): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  banUser(id: number): Promise<boolean>;
  unbanUser(id: number): Promise<boolean>;
  
  // Referral operations
  createReferral(referral: InsertReferral): Promise<Referral>;
  getUserReferrals(userId: number): Promise<Referral[]>;
  getReferralCount(userId: number): Promise<number>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  
  // Withdrawal operations
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getWithdrawal(id: number): Promise<Withdrawal | undefined>;
  listWithdrawals(status?: string): Promise<Withdrawal[]>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
  updateWithdrawalStatus(id: number, status: string): Promise<Withdrawal | undefined>;
  
  // Advertisement operations
  createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement>;
  getAdvertisement(id: number): Promise<Advertisement | undefined>;
  listAdvertisements(status?: string): Promise<Advertisement[]>;
  getUserAdvertisements(userId: number): Promise<Advertisement[]>;
  updateAdvertisementStatus(id: number, status: string): Promise<Advertisement | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  getGlobalNotifications(): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPayment(id: number): Promise<Payment | undefined>;
  listPayments(status?: string): Promise<Payment[]>;
  getUserPayments(userId: number): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string): Promise<Payment | undefined>;
  
  // Settings operations
  getSetting(key: string): Promise<string | undefined>;
  updateSetting(key: string, value: string): Promise<boolean>;
  getSettings(): Promise<Settings[]>;
  
  // Marketplace operations
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: number): Promise<Product | undefined>;
  listProducts(category?: string): Promise<Product[]>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  listOrders(status?: string): Promise<Order[]>;
  
  // Order Item operations
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  
  // Stats
  getTotalUserCount(): Promise<number>;
  getTotalPayout(): Promise<number>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private referrals: Map<number, Referral>;
  private transactions: Map<number, Transaction>;
  private withdrawals: Map<number, Withdrawal>;
  private advertisements: Map<number, Advertisement>;
  private notifications: Map<number, Notification>;
  private payments: Map<number, Payment>;
  private settings: Map<string, Settings>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private referralIdCounter: number;
  private transactionIdCounter: number;
  private withdrawalIdCounter: number;
  private advertisementIdCounter: number;
  private notificationIdCounter: number;
  private paymentIdCounter: number;
  private settingsIdCounter: number;
  private productIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.referrals = new Map();
    this.transactions = new Map();
    this.withdrawals = new Map();
    this.advertisements = new Map();
    this.notifications = new Map();
    this.payments = new Map();
    this.settings = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.userIdCounter = 1;
    this.referralIdCounter = 1;
    this.transactionIdCounter = 1;
    this.withdrawalIdCounter = 1;
    this.advertisementIdCounter = 1;
    this.notificationIdCounter = 1;
    this.paymentIdCounter = 1;
    this.settingsIdCounter = 1;
    this.productIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Create admin user with pre-hashed password
    // Create admin user with properly hashed password
    // Password: admin12345
    this.createUser({
      username: "admin1234",
      password: "5b722b307fce6c944905d132691d5e4a2214b7fe92b738920eb3fce3a90420a19511c3010a0e7712b05e6b6d884e02fdc0861a33872c7747d5f7c6156244cee.1234567890abcdef",
      email: "admin@naijavalue.com",
      fullName: "Admin User",
      referralCode: "ADMIN",
      isAdmin: true,
    });
    
    // Initialize default settings
    this.initializeSettings();
  }
  
  private initializeSettings() {
    const defaultSettings = [
      { key: "referralAmount", value: "1000" },
      { key: "minimumWithdrawal", value: "15000" },
      { key: "withdrawalFee", value: "100" },
      { key: "minimumReferralsForWithdrawal", value: "20" },
      { key: "withdrawalBypassFee", value: "2500" },
      { key: "contactGainFee", value: "2000" },
      { key: "referralsForContactGain", value: "15" },
      { key: "advertisementFee", value: "3000" },
      { key: "dailyBonus", value: "500" },
      { key: "maintenanceMode", value: "false" },
      { key: "totalPayout", value: "0" },
    ];
    
    defaultSettings.forEach((setting, index) => {
      this.settings.set(setting.key, {
        id: index + 1,
        key: setting.key,
        value: setting.value,
        updatedAt: new Date(),
      });
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async createUser(user: InsertUser & { referralCode: string, isAdmin?: boolean }): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    const newUser: User = {
      id,
      username: user.username,
      password: user.password,
      email: user.email || "",
      fullName: user.fullName || "",
      balance: 0,
      referralCode: user.referralCode,
      referredBy: user.referredBy || null,
      referralCount: 0,
      bankName: null,
      accountNumber: null,
      accountName: null,
      dailyBonusClaimed: false,
      dailyBonusLastClaimed: null,
      isAdmin: user.isAdmin || false,
      isBanned: false,
      advertisementEnabled: false,
      contactGainStatus: "inactive",
      createdAt: now,
    };
    
    this.users.set(id, newUser);
    
    // If user was referred, create referral record
    if (newUser.referredBy) {
      const referrer = await this.getUser(newUser.referredBy);
      if (referrer) {
        await this.createReferral({
          referrerId: referrer.id,
          referredId: newUser.id,
          amount: 1000,
        });
        
        // Update referrer's balance and referral count
        const updatedReferrer = {
          ...referrer,
          balance: referrer.balance + 1000,
          referralCount: referrer.referralCount + 1,
        };
        this.users.set(referrer.id, updatedReferrer);
        
        // Create transaction for referrer
        await this.createTransaction({
          userId: referrer.id,
          type: "referral",
          amount: 1000,
          description: `Referral bonus for inviting ${newUser.username}`,
          status: "completed",
          metadata: null,
        });
      }
    }
    
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async banUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;
    
    user.isBanned = true;
    this.users.set(id, user);
    
    return true;
  }
  
  async unbanUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;
    
    user.isBanned = false;
    this.users.set(id, user);
    
    return true;
  }
  
  // Referral operations
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const id = this.referralIdCounter++;
    const now = new Date();
    
    const newReferral: Referral = {
      id,
      referrerId: referral.referrerId,
      referredId: referral.referredId,
      status: "active",
      amount: referral.amount || 1000,
      createdAt: now,
    };
    
    this.referrals.set(id, newReferral);
    
    return newReferral;
  }
  
  async getUserReferrals(userId: number): Promise<Referral[]> {
    return Array.from(this.referrals.values()).filter(
      (referral) => referral.referrerId === userId
    );
  }
  
  async getReferralCount(userId: number): Promise<number> {
    return (await this.getUserReferrals(userId)).length;
  }
  
  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const now = new Date();
    
    const newTransaction: Transaction = {
      id,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status || "completed",
      metadata: transaction.metadata || null,
      createdAt: now,
    };
    
    this.transactions.set(id, newTransaction);
    
    return newTransaction;
  }
  
  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Withdrawal operations
  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const id = this.withdrawalIdCounter++;
    const now = new Date();
    
    const newWithdrawal: Withdrawal = {
      id,
      userId: withdrawal.userId,
      amount: withdrawal.amount,
      fee: 100, // Fixed fee
      status: "pending",
      bankName: withdrawal.bankName,
      accountNumber: withdrawal.accountNumber,
      accountName: withdrawal.accountName,
      bypassed: withdrawal.bypassed || false,
      createdAt: now,
      processedAt: null,
    };
    
    this.withdrawals.set(id, newWithdrawal);
    
    // Update user balance
    const user = await this.getUser(withdrawal.userId);
    if (user) {
      const totalDeduction = withdrawal.amount + 100; // Amount + fee
      user.balance -= totalDeduction;
      this.users.set(user.id, user);
      
      // Create transaction record
      await this.createTransaction({
        userId: user.id,
        type: "withdrawal",
        amount: -totalDeduction,
        description: `Withdrawal of ₦${withdrawal.amount} (fee: ₦100)`,
        status: "completed",
        metadata: null,
      });
    }
    
    return newWithdrawal;
  }
  
  async getWithdrawal(id: number): Promise<Withdrawal | undefined> {
    return this.withdrawals.get(id);
  }
  
  async listWithdrawals(status?: string): Promise<Withdrawal[]> {
    let withdrawals = Array.from(this.withdrawals.values());
    
    if (status) {
      withdrawals = withdrawals.filter(w => w.status === status);
    }
    
    return withdrawals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values())
      .filter(withdrawal => withdrawal.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateWithdrawalStatus(id: number, status: string): Promise<Withdrawal | undefined> {
    const withdrawal = await this.getWithdrawal(id);
    if (!withdrawal) return undefined;
    
    withdrawal.status = status;
    if (status === "approved" || status === "rejected") {
      withdrawal.processedAt = new Date();
    }
    
    this.withdrawals.set(id, withdrawal);
    
    // Update total payout if approved
    if (status === "approved") {
      const totalPayoutSetting = await this.getSetting("totalPayout");
      if (totalPayoutSetting !== undefined) {
        const currentTotal = parseInt(totalPayoutSetting);
        await this.updateSetting("totalPayout", (currentTotal + withdrawal.amount).toString());
      }
      
      // If rejected, refund the user
      if (status === "rejected") {
        const user = await this.getUser(withdrawal.userId);
        if (user) {
          const totalAmount = withdrawal.amount + withdrawal.fee;
          user.balance += totalAmount;
          this.users.set(user.id, user);
          
          // Create refund transaction
          await this.createTransaction({
            userId: user.id,
            type: "refund",
            amount: totalAmount,
            description: `Refund for rejected withdrawal #${withdrawal.id}`,
            status: "completed",
            metadata: null,
          });
        }
      }
    }
    
    return withdrawal;
  }
  
  // Advertisement operations
  async createAdvertisement(ad: InsertAdvertisement): Promise<Advertisement> {
    const id = this.advertisementIdCounter++;
    const now = new Date();
    
    const newAd: Advertisement = {
      id,
      userId: ad.userId,
      title: ad.title,
      description: ad.description,
      contactInfo: ad.contactInfo,
      status: "pending",
      createdAt: now,
      approvedAt: null,
    };
    
    this.advertisements.set(id, newAd);
    
    return newAd;
  }
  
  async getAdvertisement(id: number): Promise<Advertisement | undefined> {
    return this.advertisements.get(id);
  }
  
  async listAdvertisements(status?: string): Promise<Advertisement[]> {
    let ads = Array.from(this.advertisements.values());
    
    if (status) {
      ads = ads.filter(ad => ad.status === status);
    }
    
    return ads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserAdvertisements(userId: number): Promise<Advertisement[]> {
    return Array.from(this.advertisements.values())
      .filter(ad => ad.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateAdvertisementStatus(id: number, status: string): Promise<Advertisement | undefined> {
    const ad = await this.getAdvertisement(id);
    if (!ad) return undefined;
    
    ad.status = status;
    if (status === "approved") {
      ad.approvedAt = new Date();
      
      // Update user's advertisement status
      const user = await this.getUser(ad.userId);
      if (user) {
        user.advertisementEnabled = true;
        this.users.set(user.id, user);
      }
    }
    
    this.advertisements.set(id, ad);
    
    return ad;
  }
  
  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    
    const newNotification: Notification = {
      id,
      userId: notification.userId || null,
      title: notification.title,
      message: notification.message,
      isGlobal: notification.isGlobal || false,
      isRead: false,
      createdAt: now,
    };
    
    this.notifications.set(id, newNotification);
    
    return newNotification;
  }
  
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId || notification.isGlobal)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getGlobalNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.isGlobal)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    notification.isRead = true;
    this.notifications.set(id, notification);
    
    return true;
  }
  
  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const now = new Date();
    
    const newPayment: Payment = {
      id,
      userId: payment.userId,
      type: payment.type,
      amount: payment.amount,
      status: "pending",
      createdAt: now,
      approvedAt: null,
    };
    
    this.payments.set(id, newPayment);
    
    return newPayment;
  }
  
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }
  
  async listPayments(status?: string): Promise<Payment[]> {
    let payments = Array.from(this.payments.values());
    
    if (status) {
      payments = payments.filter(p => p.status === status);
    }
    
    return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserPayments(userId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updatePaymentStatus(id: number, status: string): Promise<Payment | undefined> {
    const payment = await this.getPayment(id);
    if (!payment) return undefined;
    
    payment.status = status;
    if (status === "approved") {
      payment.approvedAt = new Date();
      
      const user = await this.getUser(payment.userId);
      if (user) {
        // Handle different payment types
        if (payment.type === "contact_gain") {
          user.contactGainStatus = "active";
          this.users.set(user.id, user);
          
          // Create transaction record
          await this.createTransaction({
            userId: user.id,
            type: "contact_gain",
            amount: -payment.amount,
            description: "Contact gain activation fee",
            status: "completed",
            metadata: null,
          });
        } else if (payment.type === "advertisement") {
          user.advertisementEnabled = true;
          this.users.set(user.id, user);
          
          // Create transaction record
          await this.createTransaction({
            userId: user.id,
            type: "advertisement",
            amount: -payment.amount,
            description: "Advertisement registration fee",
            status: "completed",
            metadata: null,
          });
        } else if (payment.type === "withdrawal_bypass") {
          // Create transaction record
          await this.createTransaction({
            userId: user.id,
            type: "withdrawal_bypass",
            amount: -payment.amount,
            description: "Withdrawal requirement bypass fee",
            status: "completed",
            metadata: null,
          });
        }
      }
    }
    
    this.payments.set(id, payment);
    
    return payment;
  }
  
  // Settings operations
  async getSetting(key: string): Promise<string | undefined> {
    const setting = this.settings.get(key);
    return setting?.value;
  }
  
  async updateSetting(key: string, value: string): Promise<boolean> {
    const setting = this.settings.get(key);
    if (!setting) {
      const id = this.settingsIdCounter++;
      this.settings.set(key, {
        id,
        key,
        value,
        updatedAt: new Date(),
      });
    } else {
      setting.value = value;
      setting.updatedAt = new Date();
      this.settings.set(key, setting);
    }
    
    return true;
  }
  
  async getSettings(): Promise<Settings[]> {
    return Array.from(this.settings.values());
  }
  
  // Marketplace operations
  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const now = new Date();
    
    const newProduct: Product = {
      id,
      name: product.name,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || null,
      image: product.image,
      category: product.category,
      inStock: product.inStock || true,
      rating: 5.0,
      ratingCount: 0,
      createdAt: now,
    };
    
    this.products.set(id, newProduct);
    
    return newProduct;
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async listProducts(category?: string): Promise<Product[]> {
    let products = Array.from(this.products.values());
    
    if (category) {
      products = products.filter(product => product.category === category);
    }
    
    return products;
  }
  
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    
    return updatedProduct;
  }
  
  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    
    const newOrder: Order = {
      id,
      userId: order.userId,
      status: "pending",
      totalAmount: order.totalAmount,
      createdAt: now,
      updatedAt: now,
    };
    
    this.orders.set(id, newOrder);
    
    return newOrder;
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    order.status = status;
    order.updatedAt = new Date();
    this.orders.set(id, order);
    
    return order;
  }
  
  async listOrders(status?: string): Promise<Order[]> {
    let orders = Array.from(this.orders.values());
    
    if (status) {
      orders = orders.filter(order => order.status === status);
    }
    
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Order Item operations
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const now = new Date();
    
    const newOrderItem: OrderItem = {
      id,
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      price: orderItem.price,
      createdAt: now,
    };
    
    this.orderItems.set(id, newOrderItem);
    
    return newOrderItem;
  }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }
  
  // Stats operations
  async getTotalUserCount(): Promise<number> {
    return this.users.size;
  }
  
  async getTotalPayout(): Promise<number> {
    const totalPayout = await this.getSetting("totalPayout");
    return totalPayout ? parseInt(totalPayout) : 0;
  }
}

export const storage = new MemStorage();
