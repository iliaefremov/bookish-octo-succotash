import React from 'react';

interface IconProps {
  className?: string;
  isActive?: boolean;
}

// --- Новые иконки для навигации из библиотеки Phosphor Icons ---

/**
 * Новая, надежная иконка календаря с датой.
 * Использует стандартную иконку Phosphor и накладывает на нее
 * текст с помощью CSS для максимальной совместимости.
 */
export const ScheduleIcon: React.FC<IconProps> = ({ className, isActive }) => {
    const day = new Date().getDate();
    return (
        // Контейнер для позиционирования
        <div className="relative">
            {/* Базовая иконка календаря */}
            <i className={`${className} ph-${isActive ? 'fill' : 'bold'} ph-calendar-blank`} />
            {/* Число, спозиционированное поверх иконки */}
            <span 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] font-bold ${isActive ? 'text-white dark:text-slate-900' : 'text-text-primary dark:text-dark-text-primary'}`}
                style={{ 
                    fontSize: '48%', // Увеличен размер для лучшей читаемости
                }}
            >
                {day}
            </span>
        </div>
    );
};


export const GradesIcon: React.FC<IconProps> = ({ className, isActive }) => (
  <i className={`${className} ph-${isActive ? 'fill' : 'bold'} ph-graduation-cap`} />
);

export const DashboardIcon: React.FC<IconProps> = ({ className, isActive }) => (
  <i className={`${className} ph-${isActive ? 'fill' : 'bold'} ph-chart-pie-slice`} />
);


// --- Стандартные иконки (оставлены для совместимости) ---

/** Иконка "Отправить" (Бумажный самолетик) */
export const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

/** Иконка "График" (Линейный график) */
export const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 13h12l3-13" />
    </svg>
);

/** Иконка "Обновить" */
export const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 4v6h-6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 20v-6h6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.51 9a9 9 0 0114.85-3.36L23 10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 15a9 9 0 01-14.85 3.36L1 14" />
    </svg>
);


/** Устаревшая иконка "Чат" (Облако диалога) */
export const LegacyChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
