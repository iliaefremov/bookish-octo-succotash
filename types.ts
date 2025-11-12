/**
 * Этот файл содержит все основные определения типов TypeScript для приложения.
 * This file contains all the primary TypeScript type definitions for the application.
 */

// Расширяем глобальный объект Window для поддержки Telegram WebApp.
// Extending the global Window object to support Telegram WebApp.
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe?: {
          user?: TelegramUser;
        };
        ready: () => void;
        // FIX: Added optional expand property to the Telegram WebApp type definition to match its usage.
        expand?: () => void;
        // Можно добавить другие свойства Telegram WebApp по мере необходимости.
        // Other Telegram WebApp properties can be added as needed.
      };
    };
  }
}

// --- Типы для Расписания (Schedule) ---

/** Описывает одно занятие в расписании. */
export interface ScheduleItem {
  id: number;
  subject: string;
  time: string;
  classroom: string;
  teacher: string;
  type: string;
}

/** Описывает расписание на один день. */
export interface DaySchedule {
  day: string;
  classes: ScheduleItem[];
}

/** Описывает одно домашнее задание. */
export interface Homework {
  week: number;
  day: string;
  subject: string;
  task: string;
}

// --- Типы для Успеваемости (Grades) ---

/** Описывает одну оценку по предмету. */
export interface SubjectGrade {
  user_id: string;
  user_name?: string;
  subject: string;
  topic: string;
  date: string; // Формат: YYYY-MM-DD
  score: number | 'зачет' | 'н' | 'б' | null; // 'н' - неявка, 'б' - больничный, null - нет оценки
  avg_score?: number; // Средний балл по предмету (из Google Sheets)
}

/** Описывает одно достижение (ачивку). */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  points: number;
  unlocked: boolean;
}

// --- Общие типы ---

/** Описывает пользователя Telegram. */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}
