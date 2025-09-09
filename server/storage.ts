import { 
  users, samples, species, detections, alerts, predictions, achievements,
  type User, type InsertUser, type UpsertUser, type Sample, type InsertSample,
  type Species, type InsertSpecies, type Detection, type InsertDetection,
  type Alert, type InsertAlert, type Prediction, type InsertPrediction,
  type Achievement, type InsertAchievement
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPoints(id: string, points: number): Promise<void>;
  getTopUsers(limit?: number): Promise<User[]>;
  
  // Samples
  getSample(id: string): Promise<Sample | undefined>;
  getSamplesByUser(userId: string): Promise<Sample[]>;
  createSample(sample: InsertSample): Promise<Sample>;
  updateSampleStatus(id: string, status: string, processedFormat?: string): Promise<void>;
  getProcessingSamples(): Promise<Sample[]>;
  
  // Species
  getSpecies(id: string): Promise<Species | undefined>;
  getSpeciesByName(scientificName: string): Promise<Species | undefined>;
  getAllSpecies(): Promise<Species[]>;
  createSpecies(species: InsertSpecies): Promise<Species>;
  getEndangeredSpecies(): Promise<Species[]>;
  getInvasiveSpecies(): Promise<Species[]>;
  
  // Detections
  getDetection(id: string): Promise<Detection | undefined>;
  getDetectionsBySample(sampleId: string): Promise<Detection[]>;
  createDetection(detection: InsertDetection): Promise<Detection>;
  getRecentDetections(limit?: number): Promise<Detection[]>;
  getSpeciesDistribution(): Promise<{ speciesId: string; count: number; category: string }[]>;
  
  // Alerts
  getAlert(id: string): Promise<Alert | undefined>;
  getUnreadAlerts(): Promise<Alert[]>;
  getRecentAlerts(limit?: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: string): Promise<void>;
  
  // Predictions
  getPrediction(id: string): Promise<Prediction | undefined>;
  getRecentPredictions(limit?: number): Promise<Prediction[]>;
  createPrediction(prediction: InsertPrediction): Promise<Prediction>;
  
  // Achievements
  getAchievement(id: string): Promise<Achievement | undefined>;
  getAchievementsByUser(userId: string): Promise<Achievement[]>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  
  // Analytics
  getSpeciesCount(): Promise<number>;
  getActiveSamplesCount(): Promise<number>;
  getAlertsCount(): Promise<number>;
  getCitizenScientistsCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Since we're using Replit auth, we don't have usernames anymore
    // This method is kept for interface compatibility but returns undefined
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPoints(id: string, points: number): Promise<void> {
    await db.update(users).set({ points }).where(eq(users.id, id));
  }

  async getTopUsers(limit = 10): Promise<User[]> {
    return await db.select().from(users)
      .orderBy(desc(users.points))
      .limit(limit);
  }

  // Samples
  async getSample(id: string): Promise<Sample | undefined> {
    const [sample] = await db.select().from(samples).where(eq(samples.id, id));
    return sample || undefined;
  }

  async getSamplesByUser(userId: string): Promise<Sample[]> {
    return await db.select().from(samples)
      .where(eq(samples.userId, userId))
      .orderBy(desc(samples.uploadedAt));
  }

  async createSample(sample: InsertSample): Promise<Sample> {
    const [newSample] = await db.insert(samples).values(sample).returning();
    return newSample;
  }

  async updateSampleStatus(id: string, status: string, processedFormat?: string): Promise<void> {
    const updateData: any = { status };
    if (processedFormat) {
      updateData.processedFormat = processedFormat;
      updateData.processedAt = new Date();
    }
    await db.update(samples).set(updateData).where(eq(samples.id, id));
  }

  async getProcessingSamples(): Promise<Sample[]> {
    return await db.select().from(samples)
      .where(eq(samples.status, 'processing'))
      .orderBy(samples.uploadedAt);
  }

  // Species
  async getSpecies(id: string): Promise<Species | undefined> {
    const [speciesRecord] = await db.select().from(species).where(eq(species.id, id));
    return speciesRecord || undefined;
  }

  async getSpeciesByName(scientificName: string): Promise<Species | undefined> {
    const [speciesRecord] = await db.select().from(species)
      .where(eq(species.scientificName, scientificName));
    return speciesRecord || undefined;
  }

  async getAllSpecies(): Promise<Species[]> {
    return await db.select().from(species);
  }

  async createSpecies(speciesData: InsertSpecies): Promise<Species> {
    const [newSpecies] = await db.insert(species).values(speciesData).returning();
    return newSpecies;
  }

  async getEndangeredSpecies(): Promise<Species[]> {
    return await db.select().from(species).where(eq(species.isEndangered, true));
  }

  async getInvasiveSpecies(): Promise<Species[]> {
    return await db.select().from(species).where(eq(species.isInvasive, true));
  }

  // Detections
  async getDetection(id: string): Promise<Detection | undefined> {
    const [detection] = await db.select().from(detections).where(eq(detections.id, id));
    return detection || undefined;
  }

  async getDetectionsBySample(sampleId: string): Promise<Detection[]> {
    return await db.select().from(detections)
      .where(eq(detections.sampleId, sampleId))
      .orderBy(desc(detections.confidence));
  }

  async createDetection(detection: InsertDetection): Promise<Detection> {
    const [newDetection] = await db.insert(detections).values(detection).returning();
    return newDetection;
  }

  async getRecentDetections(limit = 50): Promise<Detection[]> {
    return await db.select().from(detections)
      .orderBy(desc(detections.detectedAt))
      .limit(limit);
  }

  async getSpeciesDistribution(): Promise<{ speciesId: string; count: number; category: string }[]> {
    return await db.select({
      speciesId: detections.speciesId,
      count: sql<number>`count(*)::int`,
      category: species.category
    })
    .from(detections)
    .innerJoin(species, eq(detections.speciesId, species.id))
    .groupBy(detections.speciesId, species.category);
  }

  // Alerts
  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async getUnreadAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts)
      .where(eq(alerts.isRead, false))
      .orderBy(desc(alerts.createdAt));
  }

  async getRecentAlerts(limit = 20): Promise<Alert[]> {
    return await db.select().from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(limit);
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [newAlert] = await db.insert(alerts).values(alert).returning();
    return newAlert;
  }

  async markAlertAsRead(id: string): Promise<void> {
    await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
  }

  // Predictions
  async getPrediction(id: string): Promise<Prediction | undefined> {
    const [prediction] = await db.select().from(predictions).where(eq(predictions.id, id));
    return prediction || undefined;
  }

  async getRecentPredictions(limit = 10): Promise<Prediction[]> {
    return await db.select().from(predictions)
      .orderBy(desc(predictions.createdAt))
      .limit(limit);
  }

  async createPrediction(prediction: InsertPrediction): Promise<Prediction> {
    const [newPrediction] = await db.insert(predictions).values(prediction).returning();
    return newPrediction;
  }

  // Achievements
  async getAchievement(id: string): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement || undefined;
  }

  async getAchievementsByUser(userId: string): Promise<Achievement[]> {
    return await db.select().from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.earnedAt));
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  // Analytics
  async getSpeciesCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(distinct ${species.id})::int` }).from(species);
    return result?.count || 0;
  }

  async getActiveSamplesCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(samples)
      .where(eq(samples.status, 'processing'));
    return result?.count || 0;
  }

  async getAlertsCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(alerts)
      .where(eq(alerts.isRead, false));
    return result?.count || 0;
  }

  async getCitizenScientistsCount(): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(users)
      .where(eq(users.role, 'citizen'));
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
