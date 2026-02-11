import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Diary entries
  diary: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        return db.getDiaryEntries(ctx.user.id, input.limit, input.offset);
      }),

    getByDate: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ ctx, input }) => {
        return db.getDiaryEntryByDate(ctx.user.id, input.date);
      }),

    create: protectedProcedure
      .input(z.object({ title: z.string().optional(), content: z.string().optional(), date: z.date() }))
      .mutation(async ({ ctx, input }) => {
        return db.createDiaryEntry({ userId: ctx.user.id, ...input });
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().optional(), content: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const entry = await db.getDiaryEntryByDate(ctx.user.id, new Date());
        if (!entry || entry.id !== input.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.updateDiaryEntry(input.id, { title: input.title, content: input.content });
      }),
  }),

  // Media files
  media: router({
    listByUser: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        return db.getMediaFilesByUser(ctx.user.id, input.limit);
      }),

    listByEntry: protectedProcedure
      .input(z.object({ diaryEntryId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getMediaFilesByDiaryEntry(input.diaryEntryId);
      }),

    upload: protectedProcedure
      .input(z.object({ fileName: z.string(), fileData: z.string(), fileType: z.enum(["image", "video"]), mimeType: z.string(), diaryEntryId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const buffer = Buffer.from(input.fileData, "base64");
          const fileKey = `${ctx.user.id}/media/${Date.now()}-${input.fileName}`;
          const { url } = await storagePut(fileKey, buffer, input.mimeType);
          
          return db.createMediaFile({
            userId: ctx.user.id,
            diaryEntryId: input.diaryEntryId,
            fileKey,
            fileUrl: url,
            fileType: input.fileType,
            mimeType: input.mimeType,
            fileName: input.fileName,
            fileSize: buffer.length,
          });
        } catch (error) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upload media" });
        }
      }),
  }),

  // Habits
  habits: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getHabitsByUser(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional(), color: z.string().optional(), icon: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return db.createHabit({ userId: ctx.user.id, ...input });
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), color: z.string().optional(), icon: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return db.updateHabit(input.id, { name: input.name, description: input.description, color: input.color, icon: input.icon });
      }),

    archive: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.updateHabit(input.id, { isActive: 0 });
      }),
  }),

  // Habit completions
  habitCompletions: router({
    getByDate: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ ctx, input }) => {
        return db.getHabitCompletionsByDate(ctx.user.id, input.date);
      }),

    getByHabitAndRange: protectedProcedure
      .input(z.object({ habitId: z.number(), startDate: z.date(), endDate: z.date() }))
      .query(async ({ ctx, input }) => {
        return db.getHabitCompletionsByHabitAndDateRange(input.habitId, input.startDate, input.endDate);
      }),

    toggle: protectedProcedure
      .input(z.object({ habitId: z.number(), date: z.date(), completed: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertHabitCompletion(input.habitId, ctx.user.id, input.date, input.completed);
      }),
  }),

  // Mood tracking
  mood: router({
    getByDate: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ ctx, input }) => {
        return db.getMoodHistoryByDate(ctx.user.id, input.date);
      }),

    getByRange: protectedProcedure
      .input(z.object({ startDate: z.date(), endDate: z.date() }))
      .query(async ({ ctx, input }) => {
        return db.getMoodHistoryByDateRange(ctx.user.id, input.startDate, input.endDate);
      }),

    record: protectedProcedure
      .input(z.object({ date: z.date(), mood: z.enum(["excellent", "good", "neutral", "sad", "terrible"]), moodIntensity: z.number().min(1).max(10), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return db.upsertMoodHistory(ctx.user.id, input.date, input.mood, input.moodIntensity, input.notes);
      }),
  }),

  // Mood insights
  insights: router({
    getByPeriod: protectedProcedure
      .input(z.object({ period: z.enum(["week", "month", "year"]), periodStart: z.date(), periodEnd: z.date() }))
      .query(async ({ ctx, input }) => {
        return db.getMoodInsightsByPeriod(ctx.user.id, input.period, input.periodStart, input.periodEnd);
      }),

    generateInsights: protectedProcedure
      .input(z.object({ period: z.enum(["week", "month", "year"]), periodStart: z.date(), periodEnd: z.date() }))
      .mutation(async ({ ctx, input }) => {
        const moods = await db.getMoodHistoryByDateRange(ctx.user.id, input.periodStart, input.periodEnd);
        const habits = await db.getHabitsByUser(ctx.user.id);
        
        if (moods.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No mood data available for this period" });
        }

        // Calculate mood distribution
        const moodCounts: Record<string, number> = {};
        let totalIntensity = 0;
        moods.forEach(m => {
          moodCounts[m.mood || "unknown"] = (moodCounts[m.mood || "unknown"] || 0) + 1;
          totalIntensity += m.moodIntensity || 0;
        });
        
        const averageMoodScore = (totalIntensity / moods.length).toFixed(2);
        const dominantMood = Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral";

        const insight = {
          userId: ctx.user.id,
          period: input.period as "week" | "month" | "year",
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          averageMoodScore: averageMoodScore as any,
          dominantMood,
          moodDistribution: moodCounts as any,
          topHabitsCorrelation: JSON.stringify(habits.slice(0, 3).map(h => ({ id: h.id, name: h.name }))),
          insights: `During this ${input.period}, your dominant mood was ${dominantMood} with an average intensity of ${averageMoodScore}/10. You tracked ${moods.length} mood entries.`,
        };

        return db.createMoodInsight(insight);
      }),
  }),
});

export type AppRouter = typeof appRouter;
