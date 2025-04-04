import { 
  users, workouts, workoutDays, workoutLogs, 
  type User, type InsertUser, 
  type Workout, type InsertWorkout, 
  type WorkoutDay, type InsertWorkoutDay, 
  type WorkoutLog, type InsertWorkoutLog,
  type Exercise, type WorkoutStats
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfileImage(userId: number, profileImage: string): Promise<User>;
  updateUserStats(userId: number, weight: number, height: number, fullName?: string, age?: number): Promise<User>;
  
  getWorkouts(userId: number): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkoutPdf(id: number, pdfUrl: string): Promise<Workout>;
  
  getWorkoutDays(workoutId: number): Promise<WorkoutDay[]>;
  getWorkoutDay(id: number): Promise<WorkoutDay | undefined>;
  createWorkoutDay(workoutDay: InsertWorkoutDay): Promise<WorkoutDay>;
  
  // Workout logs
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  getWorkoutLogs(userId: number, startDate?: Date, endDate?: Date): Promise<WorkoutLog[]>;
  getWorkoutStats(userId: number, days?: number): Promise<WorkoutStats>;
  
  sessionStore: any; // Use any type to avoid SessionStore error
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workouts: Map<number, Workout>;
  private workoutDays: Map<number, WorkoutDay>;
  private workoutLogs: Map<number, WorkoutLog>;
  sessionStore: any; // Use any type for session store
  currentUserId: number;
  currentWorkoutId: number;
  currentWorkoutDayId: number;
  currentWorkoutLogId: number;

  constructor() {
    this.users = new Map();
    this.workouts = new Map();
    this.workoutDays = new Map();
    this.workoutLogs = new Map();
    this.currentUserId = 1;
    this.currentWorkoutId = 1;
    this.currentWorkoutDayId = 1;
    this.currentWorkoutLogId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with sample workout data
    this.initializeData();
  }

  private initializeData(): void {
    // This is only sample data for the memory storage
    // Will be created properly when users register and create their workouts
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    // Certifique-se de que todos os campos necessários estão incluídos
    const user: User = { 
      ...insertUser, 
      id,
      fullName: insertUser.fullName || null,
      age: insertUser.age || null,
      profileImage: null,
      weight: insertUser.weight || 70000, // 70kg padrão se não for fornecido
      height: insertUser.height || 170 // 170cm padrão se não for fornecido
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserProfileImage(userId: number, profileImage: string): Promise<User> {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser: User = { ...user, profileImage };
    this.users.set(userId, updatedUser);
    
    return updatedUser;
  }
  
  async updateUserStats(userId: number, weight: number, height: number, fullName?: string, age?: number): Promise<User> {
    const user = this.users.get(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser: User = { 
      ...user, 
      weight, 
      height,
      fullName: fullName !== undefined ? fullName : user.fullName,
      age: age !== undefined ? age : user.age
    };
    this.users.set(userId, updatedUser);
    
    return updatedUser;
  }
  
  async getWorkouts(userId: number): Promise<Workout[]> {
    return Array.from(this.workouts.values()).filter(
      (workout) => workout.userId === userId,
    );
  }
  
  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }
  
  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = this.currentWorkoutId++;
    const workout: Workout = { 
      ...insertWorkout, 
      id, 
      pdfUrl: null // Ensure pdfUrl is initialized to null
    };
    this.workouts.set(id, workout);
    return workout;
  }
  
  async getWorkoutDays(workoutId: number): Promise<WorkoutDay[]> {
    return Array.from(this.workoutDays.values()).filter(
      (workoutDay) => workoutDay.workoutId === workoutId,
    );
  }
  
  async getWorkoutDay(id: number): Promise<WorkoutDay | undefined> {
    return this.workoutDays.get(id);
  }
  
  async createWorkoutDay(insertWorkoutDay: InsertWorkoutDay): Promise<WorkoutDay> {
    const id = this.currentWorkoutDayId++;
    // Ensure exercises is properly cast as Exercise[]
    const workoutDay: WorkoutDay = { 
      ...insertWorkoutDay, 
      id,
      exercises: Array.isArray(insertWorkoutDay.exercises) 
        ? insertWorkoutDay.exercises as Exercise[] 
        : []
    };
    this.workoutDays.set(id, workoutDay);
    return workoutDay;
  }
  
  async updateWorkoutPdf(id: number, pdfUrl: string): Promise<Workout> {
    const workout = this.workouts.get(id);
    
    if (!workout) {
      throw new Error("Workout not found");
    }
    
    const updatedWorkout: Workout = { ...workout, pdfUrl };
    this.workouts.set(id, updatedWorkout);
    
    return updatedWorkout;
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const id = this.currentWorkoutLogId++;
    
    // Construindo o objeto de log manualmente para evitar problemas com tipos opcionais
    const workoutLog: WorkoutLog = {
      id,
      userId: log.userId,
      workoutId: log.workoutId !== undefined ? log.workoutId : null,
      date: log.date !== undefined ? log.date : new Date(),
      completedExercises: log.completedExercises !== undefined ? log.completedExercises : 0,
      waterIntake: log.waterIntake !== undefined ? log.waterIntake : 0,
      duration: log.duration !== undefined ? log.duration : 0,
      notes: log.notes !== undefined ? log.notes : null
    };
    
    this.workoutLogs.set(id, workoutLog);
    return workoutLog;
  }
  
  async getWorkoutLogs(userId: number, startDate?: Date, endDate?: Date): Promise<WorkoutLog[]> {
    let logs = Array.from(this.workoutLogs.values()).filter(
      (log) => log.userId === userId
    );
    
    if (startDate) {
      logs = logs.filter((log) => log.date >= startDate);
    }
    
    if (endDate) {
      logs = logs.filter((log) => log.date <= endDate);
    }
    
    return logs.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async getWorkoutStats(userId: number, days: number = 30): Promise<WorkoutStats> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const logs = await this.getWorkoutLogs(userId, startDate, endDate);
    
    if (logs.length === 0) {
      return {
        totalWorkouts: 0,
        totalWaterIntake: 0,
        totalDuration: 0,
        averageWaterPerWorkout: 0,
        completionPercentage: 0,
        lastWorkoutDate: null
      };
    }
    
    const totalWorkouts = logs.length;
    const totalWaterIntake = logs.reduce((sum, log) => sum + log.waterIntake, 0);
    const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
    const averageWaterPerWorkout = totalWorkouts > 0 ? totalWaterIntake / totalWorkouts : 0;
    
    // Assumindo que um usuário deve treinar 3 vezes por semana
    const expectedWorkouts = Math.floor(days / 7) * 3;
    const completionPercentage = expectedWorkouts > 0 
      ? Math.min(100, (totalWorkouts / expectedWorkouts) * 100) 
      : 0;
    
    const lastWorkoutDate = logs.length > 0 ? logs[0].date : null;
    
    return {
      totalWorkouts,
      totalWaterIntake,
      totalDuration,
      averageWaterPerWorkout,
      completionPercentage,
      lastWorkoutDate
    };
  }
}

export const storage = new MemStorage();
