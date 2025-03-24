import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { nanoid } from "nanoid";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid stored password format");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

function generateReferralCode(username: string): string {
  const randomPart = nanoid(6).toUpperCase();
  const usernamePart = username.substring(0, 4).toUpperCase();
  return `${usernamePart}${randomPart}`;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "referpay_secret_key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        if (user.isBanned) {
          return done(null, false, { message: "Your account has been banned" });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      
      if (user && user.isBanned) {
        return done(null, false);
      }
      
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register new user
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, fullName, referredBy } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Generate referral code
      const referralCode = generateReferralCode(username);
      
      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      
      let referrerId = null;
      if (referredBy) {
        // Find referrer by code
        const referrer = Array.from((await storage.listUsers())).find(
          u => u.referralCode === referredBy
        );
        
        if (referrer) {
          referrerId = referrer.id;
        }
      }
      
      // Check if user used the special admin referral code
      const isAdmin = referredBy === "vesta1212";
      
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        referralCode,
        referredBy: referrerId,
        isAdmin: isAdmin, // Set admin status based on special code
      });
      
      // Remove password from returned user object
      const { password: _, ...userWithoutPassword } = user;
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message || "Authentication failed" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from returned user object
        const { password, ...userWithoutPassword } = user;
        
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove password from returned user object
    const { password, ...userWithoutPassword } = req.user;
    
    res.json(userWithoutPassword);
  });
  
  // Check maintenance mode middleware
  app.use(async (req, res, next) => {
    // Skip for admin users and auth routes
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    
    if (
      req.path === "/api/login" || 
      req.path === "/api/register" || 
      req.path === "/api/logout" ||
      req.path === "/api/user" ||
      !req.path.startsWith("/api/")
    ) {
      return next();
    }
    
    const maintenanceMode = await storage.getSetting("maintenanceMode");
    if (maintenanceMode === "true") {
      return res.status(503).json({ message: "System is currently under maintenance" });
    }
    
    next();
  });
}

