import { GoogleGenAI } from "@google/genai";
import type { DaySchedule, SubjectGrade, TelegramUser } from '../types';

// Предполагается, что process.env.API_KEY доступен в среде выполнения.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const model = 'gemini-2.5-flash';

/**
 * Генерирует рекомендации по улучшению успеваемости для конкретного предмета.
 * @param {string} subject - Название предмета.
 * @param {SubjectGrade[]} grades - Список оценок по этому предмету.
 * @returns {Promise<string>} Текст с рекомендациями от AI.
 */
export const getGradeAnalysis = async (subject: string, grades: SubjectGrade[]): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("AI-анализ временно недоступен.");
    }

    const topicsToImprove = grades
        .filter(g => typeof g.score === 'number' && g.score <= 56)
        .map(g => `"${g.topic}" (${g.score} баллов)`);

    if (topicsToImprove.length === 0) {
        return "Отличная работа! Все темы усвоены хорошо. Продолжай в том же духе!";
    }

    const allGradesString = grades
      .map(g => `Тема: "${g.topic}", Оценка: ${g.score}`)
      .join('; ');

    const prompt = `
      Ты — опытный AI-наставник для студента-медика.
      Проанализируй успеваемость по предмету "${subject}".
      
      Вот все оценки студента по этому предмету: ${allGradesString}.
      
      Особое внимание удели темам, которые требуют улучшения (балл 56 и ниже): ${topicsToImprove.join(', ')}.
      
      Дай краткие, четкие и практические рекомендации по улучшению знаний именно по этим "проблемным" темам. 
      Не нужно писать общие советы. Твои рекомендации должны быть конкретными и по делу.
      Отвечай на русском языке. Отформатруй ответ как простой текст, без списков.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting grade analysis from Gemini API:", error);
        return "Не удалось сгенерировать рекомендации. Пожалуйста, попробуйте еще раз позже.";
    }
};


/**
 * Генерирует мотивирующее сообщение на основе рейтинга пользователя.
 * @param currentUserRank - Объект с данными о рейтинге текущего пользователя.
 * @param allRankedUsers - Массив всех пользователей в рейтинге.
 * @param userName - Имя текущего пользователя.
 * @returns {Promise<string>} Мотивационное сообщение от AI.
 */
export const getRatingAnalysis = async (
  currentUserRank: { id: string; name: string; avg?: number; rank: number } | null,
  allRankedUsers: { id: string; name: string; avg?: number; rank: number }[],
  userName: string
): Promise<string> => {
    if (!API_KEY || !currentUserRank) {
        return Promise.resolve("Анализ рейтинга временно недоступен.");
    }

    if (currentUserRank.rank === 1) {
        return "Поздравляю, ты на первом месте! Это потрясающий результат. Так держать!";
    }

    // Находим пользователя, который находится на одну позицию выше
    const userAbove = allRankedUsers.find(u => u.rank === currentUserRank.rank - 1);

    let goalDescription = '';
    if (userAbove && userAbove.avg && currentUserRank.avg) {
        const diff = (userAbove.avg - currentUserRank.avg).toFixed(2);
        goalDescription = `Чтобы подняться выше и обогнать ${userAbove.name}, тебе нужно набрать всего ${diff} балла.`;
    } else {
        goalDescription = 'Продолжай усердно работать, чтобы подняться в рейтинге!';
    }

    const prompt = `
        Ты — AI-ассистент, который должен мотивировать студента по имени ${userName}.
        Его текущее место в рейтинге: ${currentUserRank.rank} из ${allRankedUsers.length}.
        Средний балл: ${currentUserRank.avg?.toFixed(2)}.
        ${goalDescription}
        
        Напиши короткое, дружелюбное и мотивирующее сообщение (2-3 предложения). 
        Подбодри студента, скажи, что у него всё получится. Не используй списки или markdown.
        Говори как друг и помощник.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting rating analysis from Gemini API:", error);
        return "Не удалось получить персональный совет. Но я уверен, у тебя все получится!";
    }
};

/**
 * Генерирует совет на основе данных о пропусках занятий.
 * @param absencesBySubject - Объект, где ключи - названия предметов, а значения - массивы пропусков.
 * @param userName - Имя текущего пользователя.
 * @returns {Promise<string>} Совет от AI.
 */
export const getAbsenceAnalysis = async (
  // FIX: Updated the type for `absencesBySubject` to be more specific, which resolves a type inference issue in the consuming component.
  absencesBySubject: Record<string, SubjectGrade[]>,
  userName: string
): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("Анализ отработок временно недоступен.");
    }

    const subjectsWithAbsences = Object.entries(absencesBySubject)
        .map(([subject, absences]) => ({ subject, count: absences.length }))
        .filter(item => item.count > 0);

    if (subjectsWithAbsences.length === 0) {
        return "Отлично! У тебя нет пропусков практических занятий. Так держать!";
    }

    // Находим предмет с наибольшим количеством пропусков
    const subjectToFocusOn = subjectsWithAbsences.sort((a, b) => b.count - a.count)[0];

    const prompt = `
        Ты — дружелюбный AI-ассистент для студента по имени ${userName}.
        Проанализируй его пропуски занятий.
        Больше всего пропусков (${subjectToFocusOn.count}) по предмету "${subjectToFocusOn.subject}".
        
        Напиши короткое (2-3 предложения), ободряющее сообщение. 
        Посоветуй студенту обратить особое внимание на этот предмет, чтобы не накопить долги и вовремя всё сдать.
        Не используй списки или markdown. Твой тон должен быть поддерживающим, а не ругающим.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting absence analysis from Gemini API:", error);
        return "Не удалось получить персональный совет. Постарайся не пропускать занятия!";
    }
};