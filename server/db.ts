import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, diaryEntries, mediaFiles, habits, habitCompletions, moodHistory, moodInsights } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Diary entry queries
export async function getDiaryEntries(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(diaryEntries).where(eq(diaryEntries.userId, userId)).orderBy(desc(diaryEntries.date)).limit(limit).offset(offset);
}

export async function getDiaryEntryByDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return undefined;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const result = await db.select().from(diaryEntries).where(
    and(eq(diaryEntries.userId, userId), gte(diaryEntries.date, startOfDay), lte(diaryEntries.date, endOfDay))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createDiaryEntry(entry: typeof diaryEntries.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(diaryEntries).values(entry);
  return result;
}

export async function updateDiaryEntry(id: number, updates: Partial<typeof diaryEntries.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(diaryEntries).set(updates).where(eq(diaryEntries.id, id));
}

// Media file queries
export async function getMediaFilesByDiaryEntry(diaryEntryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mediaFiles).where(eq(mediaFiles.diaryEntryId, diaryEntryId));
}

export async function getMediaFilesByUser(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(mediaFiles).where(eq(mediaFiles.userId, userId)).orderBy(desc(mediaFiles.uploadedAt)).limit(limit);
}

export async function createMediaFile(file: typeof mediaFiles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(mediaFiles).values(file);
}

// Habit queries
export async function getHabitsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.isActive, 1))).orderBy(habits.createdAt);
}

export async function createHabit(habit: typeof habits.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(habits).values(habit);
}

export async function updateHabit(id: number, updates: Partial<typeof habits.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(habits).set(updates).where(eq(habits.id, id));
}

// Habit completion queries
export async function getHabitCompletionsByDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return [];
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return db.select().from(habitCompletions).where(
    and(eq(habitCompletions.userId, userId), gte(habitCompletions.date, startOfDay), lte(habitCompletions.date, endOfDay))
  );
}

export async function getHabitCompletionsByHabitAndDateRange(habitId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(habitCompletions).where(
    and(eq(habitCompletions.habitId, habitId), gte(habitCompletions.date, startDate), lte(habitCompletions.date, endDate))
  ).orderBy(habitCompletions.date);
}

export async function upsertHabitCompletion(habitId: number, userId: number, date: Date, completed: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const existing = await db.select().from(habitCompletions).where(
    and(eq(habitCompletions.habitId, habitId), eq(habitCompletions.userId, userId), gte(habitCompletions.date, startOfDay), lte(habitCompletions.date, endOfDay))
  ).limit(1);
  
  if (existing.length > 0) {
    return db.update(habitCompletions).set({ completed: completed ? 1 : 0, completedAt: completed ? new Date() : null }).where(eq(habitCompletions.id, existing[0].id));
  } else {
    return db.insert(habitCompletions).values({ habitId, userId, date, completed: completed ? 1 : 0, completedAt: completed ? new Date() : null });
  }
}

// Mood history queries
export async function getMoodHistoryByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moodHistory).where(
    and(eq(moodHistory.userId, userId), gte(moodHistory.date, startDate), lte(moodHistory.date, endDate))
  ).orderBy(desc(moodHistory.date));
}

export async function getMoodHistoryByDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return undefined;
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const result = await db.select().from(moodHistory).where(
    and(eq(moodHistory.userId, userId), gte(moodHistory.date, startOfDay), lte(moodHistory.date, endOfDay))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertMoodHistory(userId: number, date: Date, mood: string, moodIntensity: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const existing = await db.select().from(moodHistory).where(
    and(eq(moodHistory.userId, userId), gte(moodHistory.date, startOfDay), lte(moodHistory.date, endOfDay))
  ).limit(1);
  
  if (existing.length > 0) {
    return db.update(moodHistory).set({ mood: mood as any, moodIntensity, notes }).where(eq(moodHistory.id, existing[0].id));
  } else {
    return db.insert(moodHistory).values({ userId, date, mood: mood as any, moodIntensity, notes });
  }
}

// Mood insights queries
export async function getMoodInsightsByPeriod(userId: number, period: 'week' | 'month' | 'year', periodStart: Date, periodEnd: Date) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(moodInsights).where(
    and(eq(moodInsights.userId, userId), eq(moodInsights.period, period), gte(moodInsights.periodStart, periodStart), lte(moodInsights.periodEnd, periodEnd))
  ).limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function createMoodInsight(insight: typeof moodInsights.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(moodInsights).values(insight);
}

export async function updateMoodInsight(id: number, updates: Partial<typeof moodInsights.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(moodInsights).set(updates).where(eq(moodInsights.id, id));
}
