import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Vehicle schema - for managing the fleet
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  licensePlate: text("license_plate").notNull(),
  description: text("description"),
  colorHue: integer("color_hue"), // Farbton für das Fahrzeug (0-360 für HSL)
  isActive: integer("is_active").default(1).notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true
});

// Reservation schema - for booking vehicles
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  userName: text("user_name").notNull(),
  reason: text("reason").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true
});

// Extend the reservation schema with validation rules
export const reservationValidationSchema = insertReservationSchema.extend({
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
});

// User schema - for authentication and authorization
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

// Define types
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type ReservationValidation = z.infer<typeof reservationValidationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
