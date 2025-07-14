import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function authenticateToken(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Autenticación requerida" });
  }
  next();
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'jasana-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
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
          return done(null, false, { message: 'Usuario no encontrado' });
        }
        
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: 'Contraseña incorrecta' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, name, area, adminPassword } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Usuario ya existe" });
      }

      if (area !== 'admin') {
        const adminUser = await storage.getAdminUser();
        if (!adminUser || !adminPassword) {
          return res.status(400).json({ message: "Se requiere clave de admin" });
        }
        
        const isAdminPasswordValid = await comparePasswords(adminPassword, adminUser.password);
        if (!isAdminPasswordValid) {
          return res.status(400).json({ message: "Contraseña no valida" });
        }
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        name,
        area,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return res.status(500).json({ message: "Error interno del servidor" });
      }
      
      if (!user) {
        const message = info?.message || "Credenciales incorrectas";
        return res.status(401).json({ message });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error al iniciar sesión" });
        }
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user?.area !== 'admin') {
        return res.status(403).json({ message: "Clave admin requerida" });
      }

      const { userId, newPassword } = req.body;
      const hashedPassword = await hashPassword(newPassword);
      
      await storage.resetUserPassword(userId, hashedPassword);
      res.json({ message: "Se restablecio la contraseña" });
    } catch (error) {
      res.status(500).json({ message: "No se restablecio la contraseña" });
    }
  });
}
