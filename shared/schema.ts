import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"), // Nome completo
  age: integer("age"), // Idade
  profileImage: text("profile_image"),
  weight: integer("weight"), // Peso em gramas (ex: 70000 = 70kg)
  height: integer("height"), // Altura em centímetros (ex: 175 = 1,75m)
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  pdfUrl: text("pdf_url"),
});

export const workoutDays = pgTable("workout_days", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  day: text("day").notNull(),
  name: text("name").notNull(),
  exercises: jsonb("exercises").$type<Exercise[]>().notNull(),
});

export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  workoutId: integer("workout_id"),
  date: timestamp("date").notNull().defaultNow(),
  completedExercises: integer("completed_exercises").notNull().default(0),
  waterIntake: integer("water_intake").notNull().default(0),
  duration: integer("duration").notNull().default(0), // Duration in seconds
  notes: text("notes"),
});

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
};

export type WorkoutStats = {
  totalWorkouts: number;
  totalWaterIntake: number;
  totalDuration: number;
  averageWaterPerWorkout: number;
  completionPercentage: number;
  lastWorkoutDate: Date | null;
};

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  age: true,
  weight: true,
  height: true,
});

export const insertWorkoutSchema = createInsertSchema(workouts)
  .pick({
    userId: true,
    name: true,
    pdfUrl: true,
  })
  .partial({
    pdfUrl: true,
  });

export const insertWorkoutDaySchema = createInsertSchema(workoutDays).pick({
  workoutId: true,
  day: true,
  name: true,
  exercises: true,
});

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs)
  .pick({
    userId: true,
    workoutId: true,
    date: true,
    completedExercises: true,
    waterIntake: true,
    duration: true,
    notes: true,
  })
  .partial({
    workoutId: true,
    date: true,
    notes: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type InsertWorkoutDay = z.infer<typeof insertWorkoutDaySchema>;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;

export type User = typeof users.$inferSelect;
export type Workout = typeof workouts.$inferSelect;
export type WorkoutDay = typeof workoutDays.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;

// Funções de utilidade para cálculos de IMC
export function calculateBMI(weightInGrams: number, heightInCm: number): number {
  // Converter gramas para kg e cm para metros
  const weightInKg = weightInGrams / 1000;
  const heightInMeters = heightInCm / 100;
  
  // Calcular IMC (peso / altura²)
  const bmi = weightInKg / (heightInMeters * heightInMeters);
  
  // Arredondar para 1 casa decimal
  return Math.round(bmi * 10) / 10;
}

export function getBMIClassification(bmi: number): string {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade Grau I";
  if (bmi < 40) return "Obesidade Grau II";
  return "Obesidade Grau III";
}
