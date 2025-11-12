import React, { useMemo, useState } from 'react';
import type { SubjectGrade } from '../types';
import BottomSheet from './BottomSheet';
import AnalyticsSheetContent from './AnalyticsSheetContent';
import { getGradeAnalysis } from '../services/geminiService';

const getSubjectIcon = (subject: string): string => {
    const lowerCaseSubject = subject.toLowerCase();
    if (lowerCaseSubject.includes('физическая культура') || lowerCaseSubject.includes('физкультура')) return '🏃‍♀️';
    if (lowerCaseSubject.includes('анатомия')) return '💀';
    if (lowerCaseSubject.includes('философия')) return '🧠';
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

const getAvgGradeColor = (score: number | null): string => {
    if (score === null) return 'text-gray-500 dark:text-gray-400';
    if (score >= 86) return 'text-green-500 dark:text-green-400';
    if (score >= 71) return 'text-yellow-500 dark:text-yellow-400';
    if (score >= 56) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
};

const getScorePillColor = (score: SubjectGrade['score']): string => {
    const baseStyle = 'shadow-sm border bg-white dark:bg-dark-secondary';

    if (score === 'н') return `${baseStyle} text-gray-600 border-gray-200 dark:text-slate-300 dark:border-slate-700`;
    if (score === 'б') return `${baseStyle} text-green-700 border-green-200 dark:text-green-300 dark:border-green-900/50`;
    if (score === 'зачет') return `${baseStyle} text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-900/50`;
    if (typeof score === 'number') {
        if (score >= 86) return `${baseStyle} text-green-700 border-green-200 dark:text-green-300 dark:border-green-900/50`;
        if (score >= 71) return `${baseStyle} text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-900/50`;
        if (score >= 56) return `${baseStyle} text-orange-700 border-orange-200 dark:text-orange-300 dark:border-orange-900/50`;
        return `${baseStyle} text-red-700 border-red-200 dark:text-red-300 dark:border-red-900/50`;
    }
    return `${baseStyle} text-text-primary border-border-color dark:text-dark-text-primary dark:border-dark-border-color`;
};

const formatScore = (score: SubjectGrade['score']): string => {
    if (score === 'н') return 'Н';
    if (score === 'б') return 'Б';
    if (score === 'зачет') return 'З';
    if (score === null) return '';
    return score.toString();
};

const getPluralForm = (number: number, one: string, two: string, five: string): string => {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
};


interface GradeListItemProps {
  grade: SubjectGrade;
}

const GradeListItem: React.FC<GradeListItemProps> = ({ grade }) => (
    <li className="flex justify-between items-center bg-white/50 dark:bg-dark-primary/60 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/20 dark:border-white/5 shadow-soft-subtle dark:shadow-dark-soft-subtle">
        <div className="min-w-0 pr-2">
            <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary break-words">{grade.topic}</p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-0.5">
                {new Date(grade.date).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
        </div>
        {grade.score !== null && (
          <div className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${getScorePillColor(grade.score)}`}>
              {formatScore(grade.score)}
          </div>
        )}
    </li>
);

interface SubjectGradeCardProps {
  subject: string;
  grades: SubjectGrade[];
  cachedAnalysis: { data: string; timestamp: number } | undefined;
  onAnalysisFetched: (recommendation: string) => void;
}

const SubjectGradeCard: React.FC<SubjectGradeCardProps> = ({ subject, grades, cachedAnalysis, onAnalysisFetched }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyticsOpen, setAnalyticsOpen] = useState(false);
  const [isAbsencesOpen, setAbsencesOpen] = useState(false);
  const [isFetchingAnalytics, setIsFetchingAnalytics] = useState(false);
  
  const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

  const { absences, avgScore } = useMemo(() => {
    const subjectAbsences = grades.filter(g => g.score === 'н');
    const avgScoreFromSheet = grades.find(g => g.avg_score !== undefined)?.avg_score;
    const finalAvgScore: number | null = avgScoreFromSheet !== undefined ? avgScoreFromSheet : null;
    
    return {
        absences: subjectAbsences,
        avgScore: finalAvgScore,
    };
  }, [grades]);
  
  const handleOpenAnalytics = async () => {
    setAnalyticsOpen(true);
    const isCacheValid = cachedAnalysis && (Date.now() - cachedAnalysis.timestamp < CACHE_DURATION);
    
    // Fetch only if cache is invalid and not currently fetching.
    if (!isCacheValid && !isFetchingAnalytics) {
        setIsFetchingAnalytics(true);
        try {
            const rec = await getGradeAnalysis(subject, grades);
            onAnalysisFetched(rec);
        } catch (e) {
            console.error(e);
            onAnalysisFetched("Не удалось загрузить рекомендации из-за ошибки.");
        } finally {
            setIsFetchingAnalytics(false);
        }
    }
  };


  const displayedGrades = isExpanded ? grades : grades.slice(0, 1);
  const hasAbsences = absences.length > 0;

  return (
    <>
    <div className="bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-soft-lg dark:shadow-dark-soft-lg rounded-3xl transition-all duration-300 ease-in-out p-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl" role="img" aria-hidden="true">{getSubjectIcon(subject)}</span>
          <h3 className="font-bold text-text-primary dark:text-dark-text-primary break-words flex-1">{subject}</h3>
        </div>
        {avgScore !== null && (
          <div className={`text-2xl font-bold whitespace-nowrap pl-2 ${getAvgGradeColor(avgScore)}`}>
            {avgScore.toFixed(2)}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          onClick={() => setAbsencesOpen(true)}
          className={`w-full text-sm font-semibold bg-white dark:bg-dark-secondary py-2 px-3 rounded-full shadow-sm border flex items-center justify-center transition-colors ${
              hasAbsences
              ? 'text-red-700 border-red-200 dark:text-red-400 dark:border-red-900/80 hover:bg-red-50 dark:hover:bg-red-500/10'
              : 'text-green-700 border-green-200 dark:text-green-400 dark:border-green-900/80 hover:bg-green-50 dark:hover:bg-green-500/10'
          }`}
          aria-label={hasAbsences ? `Показать отработки по предмету ${subject}, количество: ${absences.length}` : `Нет отработок по предмету ${subject}`}
        >
          {hasAbsences ? (
            <>
              <i className="ph-bold ph-calendar-dots mr-2 text-base"></i>
              <span>
                {`${absences.length} ${getPluralForm(absences.length, 'отработка', 'отработки', 'отработок')}`}
              </span>
            </>
          ) : (
            <>
              <span role="img" aria-hidden="true" className="mr-2 text-base">🎉</span>
              <span>Нет отработок</span>
            </>
          )}
        </button>
        <button
          onClick={handleOpenAnalytics}
          className="w-full text-sm font-semibold bg-white text-blue-700 border-blue-200 dark:bg-dark-secondary dark:text-blue-400 dark:border-blue-900/80 py-2 px-3 rounded-full shadow-sm border flex items-center justify-center transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10"
          aria-label={`Показать аналитику по предмету ${subject}`}
        >
          <i className="ph-bold ph-chart-bar mr-2 text-base"></i>
          <span>Аналитика</span>
        </button>
      </div>
      
        {grades.length > 0 && (
            <div
                className={`relative mt-4 ${grades.length > 1 ? 'cursor-pointer group' : ''} mb-2`}
                onClick={grades.length > 1 ? () => setIsExpanded(!isExpanded) : undefined}
                aria-expanded={isExpanded}
                role={grades.length > 1 ? 'button' : undefined}
                tabIndex={grades.length > 1 ? 0 : -1}
                onKeyDown={grades.length > 1 ? (e) => (e.key === 'Enter' || e.key === ' ') && setIsExpanded(!isExpanded) : undefined}
                aria-label={isExpanded ? "Скрыть оценки" : `Показать все ${grades.length} оценки`}
            >
                {/* Элементы для эффекта стопки */}
                {!isExpanded && grades.length > 2 && (
                    <div className="absolute top-0 left-0 w-full h-full bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-3xl transform translate-y-2 opacity-75 transition-transform duration-300 group-hover:translate-y-3"></div>
                )}
                {!isExpanded && grades.length > 1 && (
                    <div className="absolute top-0 left-0 w-full h-full bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-3xl transform translate-y-1 opacity-90 transition-transform duration-300 group-hover:translate-y-1.5"></div>
                )}

                <ul className="space-y-2 relative">
                    {displayedGrades.map((grade, index) => (
                        <GradeListItem key={`${grade.date}-${grade.topic}-${index}`} grade={grade} />
                    ))}
                </ul>
            </div>
        )}

    </div>

    <BottomSheet isOpen={isAnalyticsOpen} onClose={() => setAnalyticsOpen(false)} title={`Аналитика по предмету ${subject.toLowerCase()}`}>
        <AnalyticsSheetContent 
            subject={subject} 
            grades={grades} 
            isGenerating={isFetchingAnalytics || !cachedAnalysis}
            recommendation={cachedAnalysis?.data}
        />
    </BottomSheet>

    <BottomSheet isOpen={isAbsencesOpen} onClose={() => setAbsencesOpen(false)} title={`Отработки по предмету ${subject.toLowerCase()}`}>
        {absences.length > 0 ? (
            <ul className="space-y-2">
                {[...absences].reverse().map((absence, index) => (
                    <li key={index} className="flex justify-between items-center bg-secondary dark:bg-dark-secondary px-3 py-2 rounded-xl border border-border-color dark:border-dark-border-color">
                        <div className="min-w-0 pr-2">
                            <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary break-words">{absence.topic}</p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-0.5">
                                {new Date(absence.date).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
             <p className="text-center text-text-secondary dark:text-dark-text-secondary py-8">Пропусков по этому предмету нет.</p>
        )}
    </BottomSheet>
    </>
  );
};

export default SubjectGradeCard;