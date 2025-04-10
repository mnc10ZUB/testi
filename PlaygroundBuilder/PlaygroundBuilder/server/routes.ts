import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertReservationSchema, 
  insertVehicleSchema,
  reservationValidationSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth, requireAuth, requireAdmin } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentifizierung einrichten
  setupAuth(app);
  // Vehicle routes
  app.get("/api/vehicles", requireAuth, async (_req: Request, res: Response) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }

      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", requireAdmin, async (req: Request, res: Response) => {
    try {
      const validationResult = insertVehicleSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const newVehicle = await storage.createVehicle(validationResult.data);
      res.status(201).json(newVehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.put("/api/vehicles/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }

      const validationResult = insertVehicleSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const updatedVehicle = await storage.updateVehicle(id, validationResult.data);
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(updatedVehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }

      const deleted = await storage.deleteVehicle(id);
      if (!deleted) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Reservation routes
  app.get("/api/reservations", requireAuth, async (req: Request, res: Response) => {
    try {
      const { start, end, vehicleId } = req.query;
      
      // If date range is provided, filter by date range
      if (start && end) {
        const startDate = new Date(start as string);
        const endDate = new Date(end as string);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        
        const reservations = await storage.getReservationsByDateRange(startDate, endDate);
        return res.json(reservations);
      }
      
      // If vehicle ID is provided, filter by vehicle
      if (vehicleId) {
        const vId = parseInt(vehicleId as string);
        if (isNaN(vId)) {
          return res.status(400).json({ message: "Invalid vehicle ID" });
        }
        
        const reservations = await storage.getReservationsByVehicle(vId);
        return res.json(reservations);
      }
      
      // Otherwise, return all reservations
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  app.get("/api/reservations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid reservation ID" });
      }

      const reservation = await storage.getReservation(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservation" });
    }
  });

  app.post("/api/reservations", requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate input
      const validationResult = reservationValidationSchema.safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }

      const { vehicleId, startTime, endTime } = validationResult.data;
      
      // Convert dates for processing
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      
      // Check if the vehicle exists
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Fahrzeug nicht gefunden" });
      }
      
      // Check for overlapping reservations
      const hasOverlap = await storage.checkReservationOverlap(
        vehicleId, 
        startDate, 
        endDate
      );
      
      if (hasOverlap) {
        return res.status(409).json({ 
          message: "Dieses Fahrzeug ist im ausgewählten Zeitraum bereits reserviert" 
        });
      }
      
      // Create the reservation with proper date objects and user information
      const reservationData = {
        ...validationResult.data,
        startTime: startDate,
        endTime: endDate,
        // Wenn kein Benutzername angegeben wurde, den aktuellen Benutzernamen verwenden
        userName: validationResult.data.userName || req.user?.username || ""
      };
      
      const newReservation = await storage.createReservation(reservationData);
      res.status(201).json(newReservation);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Erstellen der Reservierung" });
    }
  });

  app.put("/api/reservations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ungültige Reservierungs-ID" });
      }

      // Get existing reservation to verify it exists
      const existingReservation = await storage.getReservation(id);
      if (!existingReservation) {
        return res.status(404).json({ message: "Reservierung nicht gefunden" });
      }
      
      // Alle Benutzer können jetzt alle Reservierungen bearbeiten
      // Diese Prüfung wird entfernt, da der Standard-Benutzer alle Reservierungen bearbeiten können soll

      // Validate input
      const validationResult = reservationValidationSchema.partial().safeParse(req.body);
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Parse the update data and convert dates
      const updateData: Partial<{
        vehicleId: number; 
        userName: string; 
        reason: string; 
        startTime: Date; 
        endTime: Date; 
        notes?: string | null;
      }> = {};

      // Copy over non-date fields
      if (validationResult.data.vehicleId !== undefined) updateData.vehicleId = validationResult.data.vehicleId;
      if (validationResult.data.userName !== undefined) updateData.userName = validationResult.data.userName;
      if (validationResult.data.reason !== undefined) updateData.reason = validationResult.data.reason;
      if (validationResult.data.notes !== undefined) updateData.notes = validationResult.data.notes;

      // Handle date fields with explicit conversion
      if (validationResult.data.startTime !== undefined) {
        updateData.startTime = new Date(validationResult.data.startTime);
      }
      if (validationResult.data.endTime !== undefined) {
        updateData.endTime = new Date(validationResult.data.endTime);
      }
      
      // Check for overlapping reservations if time or vehicle is being changed
      if (
        (updateData.vehicleId !== undefined || 
         updateData.startTime !== undefined || 
         updateData.endTime !== undefined)
      ) {
        const vehicleId = updateData.vehicleId ?? existingReservation.vehicleId;
        const startTime = updateData.startTime ?? existingReservation.startTime;
        const endTime = updateData.endTime ?? existingReservation.endTime;
        
        // Check for overlapping reservations
        const hasOverlap = await storage.checkReservationOverlap(
          vehicleId, 
          startTime, 
          endTime, 
          id // Exclude the current reservation from the overlap check
        );
        
        if (hasOverlap) {
          return res.status(409).json({ 
            message: "Dieses Fahrzeug ist im ausgewählten Zeitraum bereits reserviert" 
          });
        }
      }
      
      // Update the reservation
      const updatedReservation = await storage.updateReservation(id, updateData);
      res.json(updatedReservation);
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Aktualisieren der Reservierung" });
    }
  });

  app.delete("/api/reservations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Ungültige Reservierungs-ID" });
      }

      // Prüfen, ob die Reservierung existiert
      const reservation = await storage.getReservation(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservierung nicht gefunden" });
      }

      // Alle Benutzer können jetzt alle Reservierungen löschen
      // Diese Prüfung wird entfernt, da der Standard-Benutzer alle Reservierungen löschen können soll

      const deleted = await storage.deleteReservation(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Fehler beim Löschen der Reservierung" });
    }
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
