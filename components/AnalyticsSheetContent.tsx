import React, { useMemo } from 'react';
import type { SubjectGrade } from '../types';

// Вспомогательный компонент для парсинга markdown от AI
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const html = useMemo(() => {
        return text.replace(/\n/g, '<br />');
    }, [text]);

    return <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
};

interface AnalyticsSheetContentProps {
  subject: string;
  grades: SubjectGrade[];
  recommendation: string | undefined;
  isGenerating: boolean;
}

const AnalyticsSheetContent: React.FC<AnalyticsSheetContentProps> = ({ subject, grades, recommendation, isGenerating }) => {

    const stats = useMemo(() => {
        const numericGrades = grades.filter(g => typeof g.score === 'number').map(g => g.score as number);
        const topicsToImprove = grades.filter(g => typeof g.score === 'number' && g.score <= 56);
        
        if (numericGrades.length === 0) {
            return { best: '-', worst: '-', avg: '-', topicsToImprove: [] };
        }

        const best = Math.max(...numericGrades);
        const worst = Math.min(...numericGrades);
        const avg = numericGrades.reduce((sum, score) => sum + score, 0) / numericGrades.length;

        return {
            best,
            worst,
            avg: avg.toFixed(2),
            topicsToImprove
        };
    }, [grades]);

    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-bold text-text-primary dark:text-dark-text-primary mb-3">AI Рекомендации</h4>
                {isGenerating ? (
                    <div className="flex items-center space-x-2 p-4 bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-sm rounded-xl border border-border-color dark:border-dark-border-color">
                         <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                         <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                         <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                         <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Анализирую оценки...</span>
                    </div>
                ) : (
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 mt-1 rounded-full bg-highlight dark:bg-dark-highlight flex items-center justify-center text-lg">
                            <i className="ph-bold ph-sparkle text-accent dark:text-dark-accent"></i>
                        </div>
                        <div className="w-full bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-sm text-text-primary dark:text-dark-text-primary rounded-2xl rounded-bl-lg px-4 py-3 shadow-soft-subtle dark:shadow-dark-soft-subtle border border-border-color dark:border-dark-border-color">
                             <SimpleMarkdown text={recommendation || "Не удалось загрузить рекомендации."} />
                        </div>
                    </div>
                )}
            </div>
            
            <div>
                 <h4 className="font-bold text-text-primary dark:text-dark-text-primary mb-3">Ключевые показатели</h4>
                 <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-500/10 backdrop-blur-sm p-3 rounded-2xl border border-green-500/20">
                        <p className="text-xs text-green-800 dark:text-green-300 font-semibold">Лучшая</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.best}</p>
                    </div>
                    <div className="bg-blue-500/10 backdrop-blur-sm p-3 rounded-2xl border border-blue-500/20">
                        <p className="text-xs text-blue-800 dark:text-blue-300 font-semibold">Средняя</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.avg}</p>
                    </div>
                    <div className="bg-red-500/10 backdrop-blur-sm p-3 rounded-2xl border border-red-500/20">
                        <p className="text-xs text-red-800 dark:text-red-300 font-semibold">Худшая</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.worst}</p>
                    </div>
                 </div>
            </div>

            {stats.topicsToImprove.length > 0 && (
                <div>
                    <h4 className="font-bold text-text-primary dark:text-dark-text-primary mb-3">Темы которые ты можешь улучшить</h4>
                    <ul className="space-y-2">
                        {stats.topicsToImprove.map((grade, index) => (
                            <li key={index} className="flex justify-between items-center bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/20 dark:border-white/5">
                                <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary break-words pr-2">{grade.topic}</span>
                                <span className="text-sm font-bold text-red-600 dark:text-red-400">{grade.score}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AnalyticsSheetContent;