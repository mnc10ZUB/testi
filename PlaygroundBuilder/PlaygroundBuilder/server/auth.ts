import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";

type UserWithId = User & { id: number };

declare global {
  namespace Express {
    // @ts-ignore
    interface User extends UserWithId {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

const PostgresSessionStore = connectPg(session);

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "zubcarpoolbrandenburg-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
      secure: process.env.NODE_ENV === "production",
    },
    store: new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    }),
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Falscher Benutzername oder Passwort" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Erstelle Standardbenutzer, wenn noch keine existieren
  storage.seedInitialUsers(hashPassword).catch(err => {
    console.error("Fehler beim Erstellen der Standardbenutzer:", err);
  });

  // Authentifizierungs-API-Routen
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
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

  app.post("/api/register", async (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Nur Administratoren können neue Benutzer registrieren");
    }

    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Benutzername existiert bereits");
      }

      const newUser = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  });

  // Admin-Api für Benutzerverwaltung
  app.get("/api/users", async (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Nur Administratoren können Benutzer verwalten");
    }

    try {
      const users = await storage.getUsers();
      // Passwords aus der Antwort entfernen
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/users/:id", async (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Nur Administratoren können Benutzer löschen");
    }

    try {
      const userId = parseInt(req.params.id);
      
      // Verhindere, dass ein Administrator sich selbst löscht
      if (userId === req.user.id) {
        return res.status(400).send("Sie können Ihren eigenen Account nicht löschen");
      }
      
      const success = await storage.deleteUser(userId);
      if (!success) {
        return res.status(404).send("Benutzer nicht gefunden");
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}

// Middleware zum Schutz von Routen
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Nicht authentifiziert" });
}

// Middleware zum Schutz von Admin-Routen
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Keine Administratorrechte" });
}