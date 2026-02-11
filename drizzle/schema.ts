import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, longtext, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with additional tables for diary features.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Diary entries - main content storage for diary posts
 * Each entry can contain text, mood, and associated media
 */
export const diaryEntries = mysqlTable("diary_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  content: longtext("content"),
  mood: mysqlEnum("mood", ["excellent", "good", "neutral", "sad", "terrible"]),
  moodIntensity: int("moodIntensity"), // 1-10 scale for mood intensity
  date: timestamp("date").notNull(), // The date this entry is for
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryEntry = typeof diaryEntries.$inferInsert;

/**
 * Media files - stores references to photos and videos
 * Actual files are stored in S3, this table stores metadata
 */
export const mediaFiles = mysqlTable("media_files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  diaryEntryId: int("diaryEntryId"),
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(), // S3 public URL
  fileType: mysqlEnum("fileType", ["image", "video"]).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileName: varchar("fileName", { length: 255 }),
  fileSize: int("fileSize"), // in bytes
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = typeof mediaFiles.$inferInsert;

/**
 * Habits - user-defined habits to track daily
 */
export const habits = mysqlTable("habits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // hex color for UI display
  icon: varchar("icon", { length: 50 }), // lucide icon name
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = archived
});

export type Habit = typeof habits.$inferSelect;
export type InsertHabit = typeof habits.$inferInsert;

/**
 * Habit completions - tracks daily habit completion status
 */
export const habitCompletions = mysqlTable("habit_completions", {
  id: int("id").autoincrement().primaryKey(),
  habitId: int("habitId").notNull(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(), // The date this habit was completed
  completed: int("completed").default(0).notNull(), // 1 = completed, 0 = not completed
  notes: text("notes"),
  completedAt: timestamp("completedAt"), // When the habit was marked complete
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HabitCompletion = typeof habitCompletions.$inferSelect;
export type InsertHabitCompletion = typeof habitCompletions.$inferInsert;

/**
 * Mood history - stores daily mood snapshots for trend analysis
 */
export const moodHistory = mysqlTable("mood_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(), // The date of this mood entry
  mood: mysqlEnum("mood", ["excellent", "good", "neutral", "sad", "terrible"]).notNull(),
  moodIntensity: int("moodIntensity").notNull(), // 1-10 scale
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MoodHistory = typeof moodHistory.$inferSelect;
export type InsertMoodHistory = typeof moodHistory.$inferInsert;

/**
 * Mood insights - pre-calculated insights about mood patterns
 * Regenerated periodically or on-demand
 */
export const moodInsights = mysqlTable("mood_insights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  period: mysqlEnum("period", ["week", "month", "year"]).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  averageMoodScore: decimal("averageMoodScore", { precision: 3, scale: 2 }),
  dominantMood: varchar("dominantMood", { length: 50 }),
  moodDistribution: json("moodDistribution"), // JSON object with mood counts
  topHabitsCorrelation: json("topHabitsCorrelation"), // JSON array of habits correlated with positive moods
  insights: longtext("insights"), // AI-generated or calculated insights
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MoodInsight = typeof moodInsights.$inferSelect;
export type InsertMoodInsight = typeof moodInsights.$inferInsert;
