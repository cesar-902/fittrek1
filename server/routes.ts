import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertWorkoutLogSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure storage for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "profileImage") {
      // Ensure the directory exists
      if (!fs.existsSync("uploads/profile-images")) {
        fs.mkdirSync("uploads/profile-images", { recursive: true });
      }
      cb(null, "uploads/profile-images/");
    } else {
      // For other uploads (CSV, etc.)
      cb(null, "uploads/");
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Create multer instance for CSV uploads
const csvUpload = multer({ 
  storage: storage_config,
  fileFilter: (req, file, cb) => {
    // Allow CSV files
    if (
      file.mimetype === "text/csv" || 
      file.mimetype === "application/vnd.ms-excel" || 
      file.originalname.endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Create multer instance for profile image uploads
const imageUpload = multer({
  storage: storage_config,
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (
      file.mimetype === "image/jpeg" || 
      file.mimetype === "image/png" || 
      file.mimetype === "image/jpg" || 
      file.mimetype === "image/gif"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size for images
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Workout routes
  app.get("/api/workouts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = (req.user as Express.User).id;
    const workouts = await storage.getWorkouts(userId);
    res.json(workouts);
  });
  
  app.post("/api/workouts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = (req.user as Express.User).id;
    const workout = await storage.createWorkout({
      ...req.body,
      userId,
    });
    
    res.status(201).json(workout);
  });
  
  // Upload workout CSV or PDF (maintaining PDF for backward compatibility)
  app.post(["/api/workouts/:id/csv", "/api/workouts/:id/pdf"], csvUpload.single("csv"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (!req.file) {
      return res.status(400).send("No CSV file uploaded or invalid file format");
    }
    
    const workoutId = parseInt(req.params.id);
    const workout = await storage.getWorkout(workoutId);
    
    if (!workout) {
      // Delete the uploaded file if workout doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).send("Workout not found");
    }
    
    // Check if workout belongs to user
    if (workout.userId !== (req.user as Express.User).id) {
      // Delete the uploaded file if unauthorized
      fs.unlinkSync(req.file.path);
      return res.sendStatus(403);
    }
    
    // Update the workout with the CSV URL
    const fileUrl = `/uploads/${path.basename(req.file.path)}`;
    
    // If there was a previous file, try to delete it (will fail silently if file doesn't exist)
    if (workout.pdfUrl && workout.pdfUrl.startsWith("/uploads/")) {
      const oldFilePath = path.join(process.cwd(), workout.pdfUrl.substring(1));
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        // Ignore errors if file doesn't exist
      }
    }
    
    // Update workout with new CSV URL (using same field as before)
    const updatedWorkout = await storage.updateWorkoutPdf(workoutId, fileUrl);
    
    res.status(200).json(updatedWorkout);
  });
  
  // Serve uploaded files (authenticated)
  app.use("/uploads", (req, res, next) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  }, express.static("uploads"));
  
  // Serve public static files (no authentication required)
  app.use("/images", express.static("public/images"));
  
  // Upload profile image
  app.post("/api/user/profile-image", imageUpload.single("profileImage"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (!req.file) {
      return res.status(400).send("No image uploaded or invalid file format");
    }
    
    const userId = (req.user as Express.User).id;
    
    // Create the profile image URL
    const fileUrl = `/uploads/profile-images/${path.basename(req.file.path)}`;
    
    try {
      // Get current user data
      const user = await storage.getUser(userId);
      
      // If user has existing profile image, delete it
      if (user?.profileImage && user.profileImage.startsWith("/uploads/")) {
        const oldFilePath = path.join(process.cwd(), user.profileImage.substring(1));
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) {
          // Ignore errors if file doesn't exist
        }
      }
      
      // Update user with new profile image
      const updatedUser = await storage.updateUserProfileImage(userId, fileUrl);
      
      // Return updated user data without the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(500).send("Failed to update profile image");
    }
  });
  
  // Update user stats (weight, height, fullName, age)
  app.put("/api/user/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = (req.user as Express.User).id;
    const { weight, height, fullName, age } = req.body;
    
    try {
      // Validate input
      if (!weight || !height || 
          typeof weight !== 'number' || typeof height !== 'number' ||
          weight < 30000 || weight > 300000 || // 30kg a 300kg
          height < 100 || height > 250) { // 100cm a 250cm
        return res.status(400).json({ 
          error: "Peso e altura inválidos. Peso deve estar entre 30kg e 300kg, altura entre 100cm e 250cm."
        });
      }
      
      // Validar nome e idade (se fornecidos)
      if (fullName !== undefined && (!fullName || typeof fullName !== 'string')) {
        return res.status(400).json({ 
          error: "Nome completo inválido."
        });
      }
      
      if (age !== undefined && (typeof age !== 'number' || age < 12 || age > 100)) {
        return res.status(400).json({ 
          error: "Idade inválida. Deve estar entre 12 e 100 anos."
        });
      }
      
      // Update user stats
      const updatedUser = await storage.updateUserStats(userId, weight, height, fullName, age);
      
      // Return updated user data without the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user stats:", error);
      res.status(500).send("Falha ao atualizar dados do usuário");
    }
  });
  
  app.get("/api/workouts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const id = parseInt(req.params.id);
    const workout = await storage.getWorkout(id);
    
    if (!workout) {
      return res.status(404).send("Workout not found");
    }
    
    // Check if workout belongs to user
    if (workout.userId !== (req.user as Express.User).id) {
      return res.sendStatus(403);
    }
    
    res.json(workout);
  });
  
  // Workout days routes
  app.get("/api/workouts/:workoutId/days", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const workoutId = parseInt(req.params.workoutId);
    const workout = await storage.getWorkout(workoutId);
    
    if (!workout) {
      return res.status(404).send("Workout not found");
    }
    
    // Check if workout belongs to user
    if (workout.userId !== (req.user as Express.User).id) {
      return res.sendStatus(403);
    }
    
    const workoutDays = await storage.getWorkoutDays(workoutId);
    res.json(workoutDays);
  });
  
  app.post("/api/workouts/:workoutId/days", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const workoutId = parseInt(req.params.workoutId);
    const workout = await storage.getWorkout(workoutId);
    
    if (!workout) {
      return res.status(404).send("Workout not found");
    }
    
    // Check if workout belongs to user
    if (workout.userId !== (req.user as Express.User).id) {
      return res.sendStatus(403);
    }
    
    const workoutDay = await storage.createWorkoutDay({
      ...req.body,
      workoutId,
    });
    
    res.status(201).json(workoutDay);
  });

  // Workout logs routes
  app.post("/api/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = (req.user as Express.User).id;
    
    try {
      // Validate the request body
      const validatedData = insertWorkoutLogSchema.parse({
        ...req.body,
        userId,
      });
      
      const workoutLog = await storage.createWorkoutLog(validatedData);
      res.status(201).json(workoutLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Failed to create workout log");
    }
  });
  
  app.get("/api/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = (req.user as Express.User).id;
    
    // Parse date query parameters if provided
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
    }
    
    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
    }
    
    const logs = await storage.getWorkoutLogs(userId, startDate, endDate);
    res.json(logs);
  });
  
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = (req.user as Express.User).id;
    
    // Parse days parameter if provided
    let days = 30; // Default to 30 days
    
    if (req.query.days) {
      days = parseInt(req.query.days as string);
      if (isNaN(days) || days <= 0) {
        days = 30;
      }
    }
    
    const stats = await storage.getWorkoutStats(userId, days);
    res.json(stats);
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
