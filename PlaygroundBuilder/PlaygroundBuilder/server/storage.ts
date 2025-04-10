import { 
  reservations, 
  vehicles, 
  users,
  type Reservation, 
  type InsertReservation, 
  type Vehicle, 
  type InsertVehicle,
  type User,
  type InsertUser
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, not } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Storage interface for the application
export interface IStorage {
  // Session storage
  sessionStore: session.Store;
  
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Reservation operations
  getReservations(): Promise<Reservation[]>;
  getReservationsByDateRange(startDate: Date, endDate: Date): Promise<Reservation[]>;
  getReservationsByVehicle(vehicleId: number): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;
  checkReservationOverlap(vehicleId: number, startTime: Date, endTime: Date, excludeId?: number): Promise<boolean>;
  
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
}

// Session store erstellen
const PostgresSessionStore = connectPg(session);

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Session store
  sessionStore: session.Store;
  
  constructor() {
    // Session-Store mit PostgreSQL
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }
  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(vehicle)
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return result.count > 0;
  }

  // Reservation operations
  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations);
  }

  async getReservationsByDateRange(startDate: Date, endDate: Date): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(
        or(
          // Reservierungen, die im Datumsbereich beginnen
          and(
            gte(reservations.startTime, startDate),
            lte(reservations.startTime, endDate)
          ),
          // Reservierungen, die im Datumsbereich enden
          and(
            gte(reservations.endTime, startDate),
            lte(reservations.endTime, endDate)
          ),
          // Reservierungen, die den Datumsbereich umfassen
          and(
            lte(reservations.startTime, startDate),
            gte(reservations.endTime, endDate)
          )
        )
      );
  }

  async getReservationsByVehicle(vehicleId: number): Promise<Reservation[]> {
    return await db
      .select()
      .from(reservations)
      .where(eq(reservations.vehicleId, vehicleId));
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(eq(reservations.id, id));
    return reservation;
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const [newReservation] = await db
      .insert(reservations)
      .values(reservation)
      .returning();
    return newReservation;
  }

  async updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const [updatedReservation] = await db
      .update(reservations)
      .set(reservation)
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const result = await db
      .delete(reservations)
      .where(eq(reservations.id, id));
    return result.count > 0;
  }

  async checkReservationOverlap(
    vehicleId: number, 
    startTime: Date, 
    endTime: Date, 
    excludeId?: number
  ): Promise<boolean> {
    // Alle Reservierungen für dieses Fahrzeug abrufen
    const vehicleReservations = await this.getReservationsByVehicle(vehicleId);
    
    // Wenn excludeId angegeben ist, aktuelle Reservierung ausschließen
    const otherReservations = excludeId
      ? vehicleReservations.filter(r => r.id !== excludeId)
      : vehicleReservations;
    
    // Auf Überlappungen prüfen
    return otherReservations.some(r => {
      const existingStart = new Date(r.startTime);
      const existingEnd = new Date(r.endTime);
      
      // Prüfen, ob die neue Reservierung mit einer bestehenden überlappt
      return (startTime < existingEnd && endTime > existingStart);
    });
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.count > 0;
  }

  // Initialisierungsfunktion für Beispieldaten
  async seedInitialVehicles(): Promise<void> {
    const existingVehicles = await this.getVehicles();
    
    if (existingVehicles.length === 0) {
      const sampleVehicles: InsertVehicle[] = [
        { name: "VW Passat", licensePlate: "ZH-1234", description: "Mittelklassewagen", isActive: 1 },
        { name: "Mercedes Sprinter", licensePlate: "ZH-5678", description: "Transporter", isActive: 1 },
        { name: "BMW X5", licensePlate: "ZH-9012", description: "SUV", isActive: 1 }
      ];
      
      for (const vehicle of sampleVehicles) {
        await this.createVehicle(vehicle);
      }
      
      console.log("Sample vehicles created");
    }
  }
  
  // Initialisierungsfunktion für Standardbenutzer
  async seedInitialUsers(hashedPasswordFn: (password: string) => Promise<string>): Promise<void> {
    const existingUsers = await this.getUsers();
    
    if (existingUsers.length === 0) {
      const standardUser: InsertUser = {
        username: "Zubbrandenburg",
        password: await hashedPasswordFn("ZUBBRB"),
        isAdmin: false
      };
      
      const adminUser: InsertUser = {
        username: "Admin",
        password: await hashedPasswordFn("localadmin"),
        isAdmin: true
      };
      
      await this.createUser(standardUser);
      await this.createUser(adminUser);
      
      console.log("Standard users created");
    }
  }
}

export const storage = new DatabaseStorage();
