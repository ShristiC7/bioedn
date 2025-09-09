import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, jsonb, boolean, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default("citizen"),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const samples = pgTable("samples", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  filename: text("filename").notNull(),
  originalFormat: text("original_format").notNull(),
  processedFormat: text("processed_format"),
  location: jsonb("location").notNull(), // {lat: number, lng: number, name?: string}
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, failed
  metadata: jsonb("metadata"), // environmental data, collection info
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

export const species = pgTable("species", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  scientificName: text("scientific_name").notNull().unique(),
  commonName: text("common_name"),
  category: text("category").notNull(), // fish, coral, algae, invertebrate
  conservationStatus: text("conservation_status"), // IUCN status
  isInvasive: boolean("is_invasive").notNull().default(false),
  isEndangered: boolean("is_endangered").notNull().default(false),
  description: text("description"),
  imageUrl: text("image_url"),
});

export const detections = pgTable("detections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sampleId: uuid("sample_id").references(() => samples.id).notNull(),
  speciesId: uuid("species_id").references(() => species.id).notNull(),
  confidence: real("confidence").notNull(),
  abundance: integer("abundance"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
});

export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  detectionId: uuid("detection_id").references(() => detections.id).notNull(),
  type: text("type").notNull(), // endangered, invasive, biodiversity_change
  severity: text("severity").notNull(), // low, medium, high, critical
  message: text("message").notNull(),
  location: jsonb("location").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const predictions = pgTable("predictions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  location: jsonb("location").notNull(),
  timeframe: text("timeframe").notNull(), // 30_days, 90_days, 1_year
  predictedChange: real("predicted_change").notNull(),
  confidence: real("confidence").notNull(),
  factors: jsonb("factors"), // environmental factors considered
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // first_sample, explorer, conservationist, top_contributor
  title: text("title").notNull(),
  description: text("description").notNull(),
  points: integer("points").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  samples: many(samples),
  achievements: many(achievements),
}));

export const samplesRelations = relations(samples, ({ one, many }) => ({
  user: one(users, {
    fields: [samples.userId],
    references: [users.id],
  }),
  detections: many(detections),
}));

export const speciesRelations = relations(species, ({ many }) => ({
  detections: many(detections),
}));

export const detectionsRelations = relations(detections, ({ one, many }) => ({
  sample: one(samples, {
    fields: [detections.sampleId],
    references: [samples.id],
  }),
  species: one(species, {
    fields: [detections.speciesId],
    references: [species.id],
  }),
  alerts: many(alerts),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  detection: one(detections, {
    fields: [alerts.detectionId],
    references: [detections.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSampleSchema = createInsertSchema(samples).omit({
  id: true,
  uploadedAt: true,
  processedAt: true,
});

export const insertSpeciesSchema = createInsertSchema(species).omit({
  id: true,
});

export const insertDetectionSchema = createInsertSchema(detections).omit({
  id: true,
  detectedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).omit({
  id: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  earnedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type Sample = typeof samples.$inferSelect;
export type InsertSample = z.infer<typeof insertSampleSchema>;
export type Species = typeof species.$inferSelect;
export type InsertSpecies = z.infer<typeof insertSpeciesSchema>;
export type Detection = typeof detections.$inferSelect;
export type InsertDetection = z.infer<typeof insertDetectionSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
