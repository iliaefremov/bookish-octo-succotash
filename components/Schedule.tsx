import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { SCHEDULE_WEEK_1, SCHEDULE_WEEK_2, NURSING_COURSE_USER_IDS } from '../constants';
import type { ScheduleItem, DaySchedule, Homework, TelegramUser } from './../types';
import { RefreshIcon } from './icons/Icons';

// --- Новая вспомогательная функция для иконок ---
const getSubjectIcon = (subject: string): string => {
    const lowerCaseSubject = subject.toLowerCase();
    if (lowerCaseSubject.includes('физическая культура')) return '🏃‍♀️';
    if (lowerCaseSubject.includes('анатомия')) return '💀';
    if (lowerCaseSubject.includes('философия')) return '🤔';
    if (lowerCaseSubject.includes('физиология')) return '🫀';
    if (lowerCaseSubject.includes('иммунология')) return '🦠';
    if (lowerCaseSubject.includes('биохимия')) return '🧪';
    if (lowerCaseSubject.includes('гистология')) return '🔬';
    if (lowerCaseSubject.includes('безопасность жизнедеятельности')) return '⛑️';
    if (lowerCaseSubject.includes('сестринское дело')) return '🩹';
    if (lowerCaseSubject.includes('коммуникативный тренинг')) return '🗣️';
    if (lowerCaseSubject.includes('биоэтика')) return '❤️‍🩹';
    return '📚'; // Иконка по умолчанию
};


// --- Вспомогательные функции (вынесены для чистоты кода) ---

const DAYS_OF_WEEK = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

/**
 * ОПРЕДЕЛЯЕТ НОМЕР ТЕКУЩЕЙ УЧЕБНОЙ НЕДЕЛИ (1 или 2)
 * Полностью переписанная логика, использующая опорную дату для 100% точности.
 * @param {Date} currentDate - Текущая дата для расчета.
 * @returns {1 | 2} Номер недели расписания (1 для нечетных, 2 для четных).
 */
const getCurrentAcademicWeek = (currentDate: Date): 1 | 2 => {
    // 1. Опорная точка: 1 сентября 2025 г. — это понедельник 1-й (нечетной) учебной недели.
    // Нечетной неделе присваиваем индекс 0.
    const referenceMonday = new Date('2025-09-01T00:00:00');
    const referenceWeekIndex = 0; // 0 = первая/нечетная неделя

    // 2. Нормализуем текущую дату к началу дня (локальное время).
    const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

    // 3. Находим понедельник текущей недели.
    const dayOfWeek = today.getDay(); // 0 = Вс, 1 = Пн, ... 6 = Сб
    const diffToMonday = 1 - (dayOfWeek === 0 ? 7 : dayOfWeek);
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + diffToMonday);

    // 4. Считаем разницу в неделях между текущим и опорным понедельником.
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysDifference = Math.round((currentMonday.getTime() - referenceMonday.getTime()) / MS_PER_DAY);
    const weeksDifference = Math.floor(daysDifference / 7);

    // 5. Вычисляем индекс текущей недели на основе разницы.
    const currentWeekIndex = referenceWeekIndex + weeksDifference;
    
    // 6. Определяем тип недели (1 или 2) через остаток от деления.
    // Используем ((n % m) + m) % m для корректной работы с отрицательными числами.
    const weekTypeIndex = ((currentWeekIndex % 2) + 2) % 2;

    // weekTypeIndex = 0 => первая/нечетная неделя
    // weekTypeIndex = 1 => вторая/четная неделя
    return weekTypeIndex === 0 ? 1 : 2;
};


/**
 * Определяет, какую неделю показывать по умолчанию при загрузке.
 * Всегда отображает текущую учебную неделю для ясности и точности.
 */
const getInitialDisplayedWeek = (currentDate: Date): 1 | 2 => {
    return getCurrentAcademicWeek(currentDate);
};


const isCurrentTimeInRange = (timeString: string): boolean => {
    try {
        const now = new Date();
        const [startTimeStr, endTimeStr] = timeString.split(' - ');
        if (!startTimeStr || !endTimeStr) return false;
        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        const [endHour, endMinute] = endTimeStr.split(':').map(Number);
        if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) return false;
        const classStartTime = new Date(now);
        classStartTime.setHours(startHour, startMinute, 0, 0);
        const classEndTime = new Date(now);
        classEndTime.setHours(endHour, endMinute, 0, 0);
        return now >= classStartTime && now < classEndTime;
    } catch (e) {
        console.error("Ошибка при парсинге строки времени:", timeString, e);
        return false;
    }
};

/**
 * Надежная функция для получения понедельника на основе локальной даты.
 * @param {Date} date - Исходная дата.
 * @returns {Date} Объект Date, представляющий понедельник недели в 00:00:00 локального времени.
 */
const getMonday = (date: Date): Date => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // 0 = Вс, 1 = Пн, ... 6 = Сб
    const diff = 1 - (day === 0 ? 7 : day); // Рассчитываем смещение до понедельника
    d.setDate(d.getDate() + diff);
    return d;
};


const getFormattedClassType = (type: string): 'Лекция' | 'Практика' | null => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('лекция')) return 'Лекция';
    if (typeLower.includes('практика')) return 'Практика';
    return null;
};

const formatClassroom = (classroom: string): string => {
    if (!classroom) return '';
    return classroom.replace(/ауд\./g, 'аудитория').replace(/каб\./g, 'кабинет').replace(/#/g, '№');
};

const getClassTypeBadgeColor = (classType: 'Лекция' | 'Практика' | null): string => {
  const baseStyle = 'shadow-sm border';
  switch (classType) {
    case 'Лекция': return `${baseStyle} bg-white text-purple-800 border-purple-200 dark:bg-dark-secondary dark:text-purple-400 dark:border-purple-900/80`;
    case 'Практика': return `${baseStyle} bg-white text-orange-800 border-orange-200 dark:bg-dark-secondary dark:text-orange-400 dark:border-orange-900/80`;
    default: return `${baseStyle} bg-white text-text-secondary border-border-color dark:bg-dark-secondary dark:text-dark-text-secondary dark:border-dark-border-color`;
  }
};

const parseSimpleMarkdown = (text: string | undefined) => {
    if (!text) return { __html: '' };

    // 1. Normalize <br> tags from the source into newline characters.
    let processedText = text.replace(/<br\s*\/?>/gi, '\n');

    const customLinkRegex = /\[([^|\]]+)\|([^\]]+)\]/g;
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

    // Helper function to process standard markdown that is NOT a custom link
    const processStandardMarkdown = (str: string) => {
        let processed = str.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-accent dark:text-dark-accent hover:underline">${url}</a>`);
        processed = processed.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
        processed = processed.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
        processed = processed.replace(/~~(.*?)~~/g, '<del>$1$2</del>');
        return processed;
    };

    let resultHtml = '';
    let lastIndex = 0;
    let match;

    // Iterate over custom link matches
    while ((match = customLinkRegex.exec(processedText)) !== null) {
        // Process the text before the custom link match
        const textBefore = processedText.substring(lastIndex, match.index);
        resultHtml += processStandardMarkdown(textBefore);

        // Process the custom link itself
        const [_, linkText, url] = match;
        const safeUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
        resultHtml += `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-accent dark:text-dark-accent hover:underline">${linkText.trim()}</a>`;
        
        lastIndex = customLinkRegex.lastIndex;
    }

    // Process the remaining text after the last custom link
    const textAfter = processedText.substring(lastIndex);
    resultHtml += processStandardMarkdown(textAfter);

    // Finally, convert all newline characters (original and normalized from <br>) into HTML <br /> tags.
    resultHtml = resultHtml.replace(/\n/g, '<br />');

    return { __html: resultHtml };
};


// --- Оптимизированный компонент DayCard (вынесен и мемоизирован) ---

interface DayCardProps {
  dayData: DaySchedule;
  weekNumber: 1 | 2;
  date: Date;
  currentAcademicWeek: 1 | 2;
  today: Date;
  homeworkMap: Map<string, string>;
  isLoadingHomework: boolean;
  user: TelegramUser | null;
}

const DayCard = React.memo<DayCardProps>(({ dayData, weekNumber, date, currentAcademicWeek, today, homeworkMap, isLoadingHomework, user }) => {
    const { day: dayName, classes } = dayData;
    const isToday = currentAcademicWeek === weekNumber && date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    const formattedDate = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

    const filteredClasses = useMemo(() => {
        const userId = user?.id.toString();
        return classes.filter(item => {
            const isNursing = item.subject.toLowerCase().includes('сестринское дело');
            if (isNursing && !NURSING_COURSE_USER_IDS.includes(userId ?? '')) {
                return false; // Скрываем сестринское дело, если ID пользователя не в списке
            }
            return true;
        });
    }, [classes, user]);

    const firstClassTime = useMemo(() => {
        if (filteredClasses.length > 0) {
            const timeParts = filteredClasses[0].time.split(' - ');
            return timeParts[0];
        }
        return null;
    }, [filteredClasses]);


    return (
        <div className={`flex-shrink-0 w-full flex flex-col p-4 rounded-3xl transition-all duration-300 ${isToday ? 'bg-accent/20 dark:bg-dark-accent/20 backdrop-blur-3xl border-2 border-accent/30 dark:border-dark-accent/30 shadow-soft-lg dark:shadow-dark-soft-lg' : 'bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-soft-lg dark:shadow-dark-soft-lg'}`}>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-bold ${isToday ? 'text-accent dark:text-dark-accent' : 'text-text-primary dark:text-dark-text-primary'}`}>{dayName}</h3>
                <div className="flex items-center gap-2">
                    {firstClassTime && (
                        <span className="text-sm font-bold px-3 py-1 rounded-full bg-white text-red-600 shadow-sm border border-red-200/50 dark:bg-dark-secondary dark:text-red-500 dark:border-red-900/80">{`к ${firstClassTime}`}</span>
                    )}
                    <span className={`text-sm font-medium px-3 py-1 rounded-full shadow-sm border ${isToday ? 'bg-white text-accent border-accent/20 dark:bg-dark-secondary dark:text-dark-accent dark:border-dark-accent/20' : 'bg-white text-text-secondary border-border-color dark:bg-dark-secondary dark:text-dark-text-secondary dark:border-dark-border-color'}`}>{formattedDate}</span>
                </div>
            </div>
            <div className="space-y-3">
                {filteredClasses.length > 0 ? filteredClasses.map((item) => {
                    const isNow = isToday && isCurrentTimeInRange(item.time);
                    const classType = getFormattedClassType(item.type);
                    const homeworkKey = `${weekNumber}-${dayName.trim().toLowerCase()}-${item.subject.trim().toLowerCase()}`;
                    const homeworkTask = homeworkMap.get(homeworkKey);
                    
                    const cardBgClass = isToday
                        ? 'bg-white/80 dark:bg-dark-secondary/70'
                        : 'bg-white/50 dark:bg-dark-primary/60';
                    const cardBorderClass = 'border-white/20 dark:border-white/5';

                    let glowClass = '';
                    if (isNow) {
                        if (classType === 'Лекция') {
                            glowClass = 'shadow-lg shadow-purple-500/20 dark:shadow-purple-400/20';
                        } else if (classType === 'Практика') {
                            glowClass = 'shadow-lg shadow-orange-500/20 dark:shadow-orange-400/20';
                        } else {
                            glowClass = 'shadow-lg shadow-accent/20 dark:shadow-dark-accent/20';
                        }
                    }

                    return (
                        <div key={item.id} className={`relative group ${cardBgClass} backdrop-blur-md rounded-2xl p-4 flex flex-col text-sm transition-all duration-300 ease-in-out border shadow-soft dark:shadow-dark-soft ${cardBorderClass} ${glowClass}`}>
                            <div className="flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3 flex-grow min-w-0">
                                        <span className="text-xl" role="img" aria-hidden="true">{getSubjectIcon(item.subject)}</span>
                                        <p className="font-bold text-text-primary dark:text-dark-text-primary pr-2">{item.subject}</p>
                                    </div>
                                    {classType && <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${getClassTypeBadgeColor(classType)}`}>{classType}</span>}
                                </div>
                                <div className="space-y-2 text-text-secondary dark:text-dark-text-secondary text-xs">
                                    <p className="flex items-center">
                                        <span className="opacity-75 mr-2.5" role="img" aria-hidden="true">⏰</span>
                                        <span className="font-medium text-text-primary dark:text-dark-text-primary whitespace-nowrap">{item.time}</span>
                                        {isNow && (
                                            <span className="ml-3 flex items-center gap-1.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                                Сейчас
                                            </span>
                                        )}
                                        {item.classroom && (
                                            <span className="min-w-0 ml-2">{formatClassroom(item.classroom)}</span>
                                        )}
                                    </p>
                                    {item.teacher && (
                                        <p className="flex items-center">
                                            <span className="opacity-75 mr-2.5" role="img" aria-hidden="true">🧑‍🏫</span>
                                            <span className="font-semibold text-text-primary dark:text-dark-text-primary">{item.teacher}</span>
                                        </p>
                                    )}
                                </div>
                                {isLoadingHomework ? (
                                    <div className="text-xs mt-3 border-t border-border-color dark:border-dark-border-color pt-3">
                                        <div className="flex items-start gap-2">
                                            <span role="img" aria-label="Домашнее задание" className="text-lg text-text-secondary dark:text-dark-text-secondary pt-1.5">🔗</span>
                                            <div className="flex-1 bg-highlight dark:bg-dark-highlight h-10 w-full rounded-lg animate-pulse"></div>
                                        </div>
                                    </div>
                                ) : homeworkTask && (
                                    <div className="text-xs mt-3 border-t border-border-color dark:border-dark-border-color pt-3">
                                        <div className="flex items-start gap-2">
                                            <span role="img" aria-label="Домашнее задание" className="text-lg text-text-secondary dark:text-dark-text-secondary pt-2">🔗</span>
                                            <div 
                                                className="flex-1 text-text-primary dark:text-dark-text-primary bg-blue-50 dark:bg-blue-500/10 p-2.5 rounded-lg break-words leading-snug"
                                                dangerouslySetInnerHTML={parseSimpleMarkdown(homeworkTask)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className={`rounded-2xl text-center text-text-secondary dark:text-dark-text-secondary flex items-center justify-center border-2 border-dashed border-highlight dark:border-dark-highlight p-4 min-h-[100px]`}>
                        <p className="text-sm">Пар нет, можно отдохнуть!</p>
                    </div>
                )}
            </div>
        </div>
    );
});

// --- Основной компонент Schedule ---

interface ScheduleProps {
    user: TelegramUser | null;
    homeworks: Homework[];
    isLoadingHomework: boolean;
}

const Schedule: React.FC<ScheduleProps> = ({ user, homeworks, isLoadingHomework }) => {
    const [scheduleWeek1] = useState<DaySchedule[]>(SCHEDULE_WEEK_1);
    const [scheduleWeek2] = useState<DaySchedule[]>(SCHEDULE_WEEK_2);
    const [now, setNow] = useState(() => new Date());
    
    useEffect(() => {
        const timerId = setInterval(() => setNow(new Date()), 60 * 1000);
        return () => clearInterval(timerId);
    }, []);

    const currentAcademicWeek = useMemo(() => getCurrentAcademicWeek(now), [now]);
    const [activeWeek, setActiveWeek] = useState<1 | 2>(() => getInitialDisplayedWeek(now));
    const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Automatically switch to the correct week's view when the academic week changes (e.g., on Monday).
    // This ensures the user starts the new week with the correct schedule.
    useEffect(() => {
        setActiveWeek(getInitialDisplayedWeek(now));
    }, [currentAcademicWeek, now]);

    const homeworkMap = useMemo(() => {
        const map = new Map<string, string>();
        homeworks.forEach(hw => {
            const key = `${hw.week}-${hw.day.trim().toLowerCase()}-${hw.subject.trim().toLowerCase()}`;
            map.set(key, hw.task);
        });
        return map;
    }, [homeworks]);

    const today = useMemo(() => now, [now]);
    const scrollToDayName = useMemo(() => {
        const dayIndex = today.getDay();
        return (dayIndex > 0 && dayIndex < 6) ? DAYS_OF_WEEK[dayIndex - 1] : 'Понедельник';
    }, [today]);

    const todayDateFormatted = useMemo(() => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(today), [today]);

    const activeWeekMonday = useMemo(() => {
        const monday = getMonday(now);
        if (activeWeek !== currentAcademicWeek) {
            // If current week is 1 and we want to see week 2, add 7 days.
            if (currentAcademicWeek === 1 && activeWeek === 2) {
                monday.setDate(monday.getDate() + 7);
            }
            // If current week is 2 and we want to see week 1, subtract 7 days.
            else if (currentAcademicWeek === 2 && activeWeek === 1) {
                monday.setDate(monday.getDate() - 7);
            }
        }
        return monday;
    }, [activeWeek, currentAcademicWeek, now]);

    const displayedSchedule = useMemo(() => {
        const scheduleData = activeWeek === 1 ? scheduleWeek1 : scheduleWeek2;
        return [...scheduleData].sort((a, b) => DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day));
    }, [activeWeek, scheduleWeek1, scheduleWeek2]);

    useEffect(() => {
        if (activeWeek === currentAcademicWeek && scrollToDayName && !isLoadingHomework) {
            const dayElement = dayRefs.current[scrollToDayName];
            if (dayElement) {
                const animationFrameId = requestAnimationFrame(() => {
                    dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                return () => cancelAnimationFrame(animationFrameId);
            }
        }
    }, [activeWeek, currentAcademicWeek, scrollToDayName, isLoadingHomework]);

    return (
        <div className="animate-fade-in">
            <div className="mb-6 p-4 bg-blue-500/10 dark:bg-blue-400/10 backdrop-blur-xl rounded-3xl border border-blue-500/20 dark:border-blue-400/20 text-left space-y-1">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                    🗓️ <span className="font-semibold">Зимняя сессия:</span> с 12 по 25 января 2025 г.
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                    🌴 <span className="font-semibold">Каникулы:</span> с 26 января по 1 февраля 2025 г.
                </p>
            </div>

            <div className="flex gap-3 mb-6">
                <button onClick={() => setActiveWeek(1)} className={`flex-1 py-1.5 px-4 rounded-2xl text-sm font-bold transition-all duration-300 backdrop-blur-md border dark:border-white/10 relative flex items-center justify-center ${activeWeek === 1 ? 'bg-white/70 dark:bg-white/20 text-accent dark:text-dark-accent shadow-soft' : 'bg-white/30 dark:bg-white/10 text-text-secondary dark:text-dark-text-secondary hover:bg-white/50 dark:hover:bg-white/15'}`}>
                    <span>Первая неделя</span>
                </button>
                <button onClick={() => setActiveWeek(2)} className={`flex-1 py-1.5 px-4 rounded-2xl text-sm font-bold transition-all duration-300 backdrop-blur-md border dark:border-white/10 relative flex items-center justify-center ${activeWeek === 2 ? 'bg-white/70 dark:bg-white/20 text-accent dark:text-dark-accent shadow-soft' : 'bg-white/30 dark:bg-white/10 text-text-secondary dark:text-dark-text-secondary hover:bg-white/50 dark:hover:bg-white/15'}`}>
                    <span>Вторая неделя</span>
                </button>
            </div>

            <div className="space-y-6">
                {displayedSchedule.map((dayData, index) => {
                    const dayDate = new Date(activeWeekMonday);
                    dayDate.setDate(dayDate.getDate() + index);
                    const isScrollTarget = activeWeek === currentAcademicWeek && dayData.day === scrollToDayName;
                    return (
                        <div key={`w${activeWeek}-${dayData.day}`} ref={el => { dayRefs.current[dayData.day] = el; }} className={isScrollTarget ? 'scroll-target' : ''}>
                            <DayCard
                                dayData={dayData}
                                weekNumber={activeWeek}
                                date={dayDate}
                                currentAcademicWeek={currentAcademicWeek}
                                today={today}
                                homeworkMap={homeworkMap}
                                isLoadingHomework={isLoadingHomework}
                                user={user}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Schedule;