import type { SubjectGrade, Homework } from '../types';

// URL для опубликованной в веб-доступе Google Таблицы в формате CSV.
const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRf6H54cEZ1qHEv6cls6VGdlSm3TsdaMjah9G7FZtnM6caSgF9W0jQiUUyWlKGcNxV2VWG2VJCEJDzy/pub?output=csv';
const HOMEWORK_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTE-dl9HZNTJa2KADj6mQzi_msTexolAVgvNETQfLgSce8EU2Qin-UDxl1biiI3cjR48meMLcgEAbJO/pub?gid=0&single=true&output=csv';
const LECTURE_ABSENCES_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-PWm0niepH6g0ao4V1lELFT3G4zBBoJara_kwRKIEvqpwEgcWJhELhmaOB6ShPcdXYJF3M4gBzQB4/pub?gid=0&single=true&output=csv';


/**
 * Парсит одну строку CSV, корректно обрабатывая значения в кавычках.
 * @param {string} row - Строка CSV.
 * @returns {string[]} Массив значений ячеек.
 */
const parseCsvRow = (row: string): string[] => {
  const values: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentVal.trim());
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  values.push(currentVal.trim());
  return values;
};

/**
 * Нормализует различные форматы дат в стандартный формат YYYY-MM-DD.
 * @param {string} dateStr - Исходная строка с датой из CSV.
 * @returns {string} Дата в формате YYYY-MM-DD или исходная строка, если парсинг не удался.
 */
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const cleanedDateStr = dateStr.trim();
  const currentYear = new Date().getFullYear();

  let parts = cleanedDateStr.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (parts) {
    return `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }

  parts = cleanedDateStr.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2})$/);
  if (parts) {
    return `20${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  
  parts = cleanedDateStr.match(/^(\d{1,2})[./](\d{1,2})$/);
  if (parts) {
    return `${currentYear}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  
  return cleanedDateStr;
};


/**
 * Загружает и парсит данные об оценках из опубликованной Google Таблицы.
 * @returns {Promise<SubjectGrade[]>} Промис, который разрешается массивом оценок.
 * @throws {Error} Если происходит ошибка сети или парсинга.
 */
export const getGrades = async (): Promise<SubjectGrade[]> => {
  try {
    // Добавляем timestamp для предотвращения кэширования
    const response = await fetch(`${SPREADSHEET_URL}&_=${new Date().getTime()}`);
    if (!response.ok) {
      throw new Error(`Сетевой ответ не был успешным. Статус: ${response.status}`);
    }
    const csvText = await response.text();
    return parseBlockBasedPivotData(csvText);
  } catch (error) {
    console.error(`Ошибка при загрузке или парсинге таблицы:`, error);
    throw new Error('Не удалось загрузить данные из Google Sheets.');
  }
};

/**
 * Парсит CSV-данные со сложной структурой, где предметы организованы в блоки.
 * @param {string} csvText - Исходные CSV-данные в виде строки.
 * @returns {SubjectGrade[]} Отформатированный массив данных об оценках.
 */
const parseBlockBasedPivotData = (csvText: string): SubjectGrade[] => {
  // ВНИМАНИЕ: Этот парсер очень чувствителен к структуре Google Таблицы.
  // Он полагается на жестко заданные номера строк для начала каждого блока данных о предмете.
  // Любое добавление/удаление строк в таблице выше этих блоков сломает парсинг.
  // Рассмотрите возможность перехода на более простую структуру CSV (например, одна строка - одна оценка)
  // для повышения надежности в будущем.
  
  if (!csvText) return [];

  if (csvText.charCodeAt(0) === 0xFEFF) {
    csvText = csvText.substring(1);
  }

  const rows = csvText.trim().split(/\r?\n/);
  if (rows.length < 3) {
    console.warn(`CSV файл содержит менее 3 строк.`);
    return [];
  };

  const allGrades: SubjectGrade[] = [];
  const subjectBlockStartRows = [0, 18, 36, 54, 72, 90, 108, 126, 144, 162];

  subjectBlockStartRows.forEach((startRowIndex) => {
    if (startRowIndex >= rows.length) return;

    const headerRow = parseCsvRow(rows[startRowIndex]);
    const subjectName = headerRow[0]?.trim();
    
    if (!subjectName) return;

    const topicRow = parseCsvRow(rows[startRowIndex + 1]);
    
    const dataRowsForBlock = rows.slice(startRowIndex + 2, startRowIndex + 18);

    dataRowsForBlock.forEach(rowStr => {
      if (!rowStr.trim()) return;

      const row = parseCsvRow(rowStr);
      const userId = row[0]?.trim();
      const userName = row[1]?.trim();
      const avgScoreStr = row[2]?.trim().replace(',', '.');
      const avgScore = avgScoreStr && !isNaN(parseFloat(avgScoreStr)) ? parseFloat(avgScoreStr) : undefined;
      
      if (!userId) return;

      // Итерируемся по колонкам из заголовка, чтобы учесть все темы.
      for (let i = headerRow.length - 1; i >= 3; i--) {
        const date = headerRow[i]?.trim();
        const topic = topicRow[i]?.trim();

        // Пропускаем колонки, где нет даты или темы в заголовке
        if (!date || !topic) {
          continue;
        }

        const scoreStr = row[i]?.trim().replace(/"/g, '') || '';
        let score: SubjectGrade['score'];

        if (scoreStr.toLowerCase() === 'н') {
          score = 'н';
        } else if (scoreStr.toLowerCase() === 'б') {
          score = 'б';
        } else if (scoreStr.toLowerCase().includes('зачет')) {
          score = 'зачет';
        } else if (!isNaN(parseFloat(scoreStr)) && isFinite(Number(scoreStr))) {
          score = Number(scoreStr);
        } else {
          score = null; // Все остальное (включая пустые строки) - это отсутствие оценки
        }
        
        allGrades.push({
          user_id: userId,
          user_name: userName,
          subject: subjectName,
          topic: topic,
          date: normalizeDate(date),
          score: score,
          avg_score: avgScore,
        });
      }
    });
  });

  return allGrades;
};

// FIX: Changed return type from any[] to Homework[] for better type safety. This resolves a downstream type inference issue in Promise.all.
export const getHomeworks = async (): Promise<Homework[]> => {
    try {
        const url = `${HOMEWORK_SPREADSHEET_URL}&_=${new Date().getTime()}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Сетевой ответ не был успешным. Статус: ${response.status}`);
        }
        let csvText = await response.text();
        if (csvText.charCodeAt(0) === 0xFEFF) {
            csvText = csvText.substring(1);
        }
        const rows = csvText.trim().split(/\r?\n/).slice(1);
        return rows.map(rowStr => {
            const [weekStr, day, subject, task] = parseCsvRow(rowStr);
            return { week: parseInt(weekStr, 10), day, subject, task };
        }).filter(hw => !isNaN(hw.week) && hw.day && hw.subject && hw.task);
    } catch (error) {
        console.error(`Ошибка при загрузке ДЗ:`, error);
        throw new Error('Не удалось загрузить домашние задания.');
    }
};

/**
 * Загружает и парсит данные о пропусках лекций.
 * @returns {Promise<SubjectGrade[]>} Массив пропусков в формате SubjectGrade.
 */
export const getLectureAbsences = async (): Promise<SubjectGrade[]> => {
  try {
    const response = await fetch(`${LECTURE_ABSENCES_URL}&_=${new Date().getTime()}`);
    if (!response.ok) throw new Error(`Network response was not ok. Status: ${response.status}`);
    let csvText = await response.text();
    if (csvText.charCodeAt(0) === 0xFEFF) {
      csvText = csvText.substring(1);
    }
    return parseLectureAbsencesCsv(csvText);
  } catch (error) {
    console.error(`Error fetching or parsing lecture absences:`, error);
    throw new Error('Failed to load lecture absences from Google Sheets.');
  }
};

/**
 * Парсит CSV-данные о пропусках лекций.
 * @param {string} csvText - Исходные CSV-данные.
 * @returns {SubjectGrade[]} Отформатированный массив пропусков.
 */
const parseLectureAbsencesCsv = (csvText: string): SubjectGrade[] => {
  const rows = csvText.trim().split(/\r?\n/);
  if (rows.length < 3) return [];

  const allAbsences: SubjectGrade[] = [];
  // Определяем начальные строки для каждого блока с предметами.
  const subjectBlockStartRows = [0, 18, 36, 54, 72, 90, 108, 126, 144, 162];

  subjectBlockStartRows.forEach(startRowIndex => {
    // Проверяем, существует ли блок в файле
    if (startRowIndex >= rows.length || rows.length < startRowIndex + 2) {
      return;
    }

    const dateRow = parseCsvRow(rows[startRowIndex]);
    const subjectName = dateRow[0]?.trim();
    
    // Если в ячейке A нет названия предмета, пропускаем блок
    if (!subjectName) {
      return;
    }

    const topicRow = parseCsvRow(rows[startRowIndex + 1]);
    const dataRowsForBlock = rows.slice(startRowIndex + 2, startRowIndex + 18);

    dataRowsForBlock.forEach(rowStr => {
      if (!rowStr.trim()) return;

      const cells = parseCsvRow(rowStr);
      const userId = cells[0]?.trim();
      const userName = cells[1]?.trim();

      if (!userId) return;

      // Итерируемся по колонкам с датами/темами, начиная с третьей (индекс 2)
      for (let i = 2; i < cells.length; i++) {
        const value = cells[i]?.trim();
        // Ищем отметку о пропуске 'н'
        if (value?.toLowerCase() === 'н') {
          const date = dateRow[i]?.trim();
          const topic = topicRow[i]?.trim() || 'Лекция'; // Если тема не указана, ставим "Лекция"
          
          if (date) {
            allAbsences.push({
              user_id: userId,
              user_name: userName,
              subject: subjectName,
              topic: topic,
              date: normalizeDate(date),
              score: 'н',
            });
          }
        }
      }
    });
  });

  return allAbsences;
};