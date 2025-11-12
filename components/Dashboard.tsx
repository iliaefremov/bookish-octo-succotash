import React, { useMemo, useState } from 'react';
import type { SubjectGrade } from '../types';
import BottomSheet from './BottomSheet';

// --- Типы данных для дашборда ---
interface SubjectAnalytics {
  avgScore: number | null;
  gradeCount: number;
  absences: number;
}

interface StudentAnalytics {
  id: string;
  name: string;
  overallAvgScore: number | null;
  rank: number;
  totalAbsences: number;
  subjects: Record<string, SubjectAnalytics>;
}

const getAvgGradeColor = (score: number | null): string => {
    const baseStyle = 'shadow-sm border';
    if (score === null) return `${baseStyle} bg-white text-gray-500 border-gray-200 dark:bg-dark-secondary dark:text-gray-400 dark:border-gray-700`;
    if (score >= 86) return `${baseStyle} bg-white text-green-700 border-green-200 dark:bg-dark-secondary dark:text-green-400 dark:border-green-900/80`;
    if (score >= 71) return `${baseStyle} bg-white text-yellow-700 border-yellow-200 dark:bg-dark-secondary dark:text-yellow-400 dark:border-yellow-900/80`;
    if (score >= 56) return `${baseStyle} bg-white text-orange-700 border-orange-200 dark:bg-dark-secondary dark:text-orange-400 dark:border-orange-900/80`;
    return `${baseStyle} bg-white text-red-700 border-red-200 dark:bg-dark-secondary dark:text-red-500 dark:border-red-900/80`;
};

const getScorePillColor = (score: SubjectGrade['score']): string => {
    if (score === 'н') return 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-slate-300';
    if (score === 'б') return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    if (score === 'зачет') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    if (typeof score === 'number') {
        if (score >= 86) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
        if (score >= 71) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
        if (score >= 56) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
        return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
    }
    return 'bg-highlight text-text-primary dark:bg-dark-highlight dark:text-dark-text-primary';
};

const formatScore = (score: SubjectGrade['score']): string => {
    if (score === 'н') return 'Н';
    if (score === 'б') return 'Б';
    if (score === 'зачет') return 'З';
    if (score === null) return '';
    return score.toString();
};


// --- Карточка студента ---
const StudentAnalyticsCard: React.FC<{ student: StudentAnalytics, allStudentGrades: SubjectGrade[] }> = ({ student, allStudentGrades }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeSheet, setActiveSheet] = useState<{ type: 'grades' | 'absences', subject: string } | null>(null);

    const gradesForSheet = useMemo(() => {
        if (!activeSheet) return [];
        return allStudentGrades.filter(g => g.subject === activeSheet.subject);
    }, [activeSheet, allStudentGrades]);

    const absencesForSheet = useMemo(() => {
        if (activeSheet?.type !== 'absences') return [];
        return gradesForSheet.filter(g => g.score === 'н');
    }, [activeSheet, gradesForSheet]);

    const handleButtonClick = (e: React.MouseEvent, type: 'grades' | 'absences', subject: string) => {
        e.stopPropagation(); // Предотвращаем сворачивание карточки
        setActiveSheet({ type, subject });
    };

    return (
        <>
            <div 
                className="bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-soft-lg dark:shadow-dark-soft-lg rounded-3xl transition-all duration-300 ease-in-out p-4 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="font-bold text-text-primary dark:text-dark-text-primary truncate">{student.name}</p>
                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Место в рейтинге: {student.rank}</p>
                    </div>
                    <div className="flex items-center gap-4 text-center">
                        <div>
                            <p className="font-bold text-xl text-accent dark:text-dark-accent">{student.overallAvgScore?.toFixed(2) ?? '–'}</p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Cр. балл</p>
                        </div>
                         <div>
                            <p className="font-bold text-xl text-red-600 dark:text-red-400">{student.totalAbsences}</p>
                            <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Отработки</p>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border-color dark:border-dark-border-color space-y-2 animate-fade-in">
                        <h4 className="font-bold text-sm text-text-primary dark:text-dark-text-primary mb-2">Успеваемость по предметам:</h4>
                        
                        <div className="grid grid-cols-[1fr_5rem_6rem] gap-x-4 px-2 pb-1 text-xs font-semibold text-text-secondary dark:text-dark-text-secondary">
                            <span>Предмет</span>
                            <span className="text-center">Ср. балл</span>
                            <span className="text-center">Задолженности</span>
                        </div>
                        
                        <div className="space-y-2">
                            {Object.keys(student.subjects).sort((a, b) => a.localeCompare(b)).map((subjectName) => {
                                const subjectData = student.subjects[subjectName];
                                return (
                                <div key={subjectName} className="grid grid-cols-[1fr_5rem_6rem] gap-x-4 items-center bg-white/50 dark:bg-dark-primary/60 backdrop-blur-sm p-2 rounded-xl text-sm">
                                    <span className="font-medium text-text-primary dark:text-dark-text-primary truncate pr-2">{subjectName}</span>
                                    
                                    <button onClick={(e) => handleButtonClick(e, 'grades', subjectName)} className="flex flex-col items-center text-center rounded-lg py-1 hover:bg-highlight dark:hover:bg-dark-highlight transition-colors">
                                        <span className={`font-bold py-1 px-3 rounded-full text-xs ${getAvgGradeColor(subjectData.avgScore)}`}>
                                            {subjectData.avgScore?.toFixed(2) ?? '–'}
                                        </span>
                                        <span className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
                                            {subjectData.gradeCount} {subjectData.gradeCount === 1 ? 'оценка' : 'оценок'}
                                        </span>
                                    </button>

                                    <button onClick={(e) => handleButtonClick(e, 'absences', subjectName)} className="flex flex-col items-center text-center rounded-lg py-1 hover:bg-highlight dark:hover:bg-dark-highlight transition-colors disabled:cursor-default disabled:hover:bg-transparent" disabled={subjectData.absences === 0}>
                                        <span className={`font-semibold text-base ${subjectData.absences > 0 ? 'text-red-600 dark:text-red-400' : 'text-text-secondary dark:text-dark-text-secondary'}`}>
                                            {subjectData.absences > 0 ? subjectData.absences : '–'}
                                        </span>
                                        <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
                                            {subjectData.absences > 0 ? 'долгов' : 'нет'}
                                        </span>
                                    </button>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            
            <BottomSheet isOpen={activeSheet !== null} onClose={() => setActiveSheet(null)} title={`${activeSheet?.type === 'grades' ? 'Оценки' : 'Отработки'} по "${activeSheet?.subject}"`}>
                {activeSheet?.type === 'grades' && (
                    gradesForSheet.length > 0 ? (
                        <ul className="space-y-2">
                            {gradesForSheet.map((grade, index) => (
                                <li key={`${grade.date}-${grade.topic}-${index}`} className="flex justify-between items-center bg-secondary dark:bg-dark-secondary px-3 py-2 rounded-xl border border-border-color dark:border-dark-border-color">
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
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-text-secondary dark:text-dark-text-secondary py-8">Нет оценок по этому предмету.</p>
                    )
                )}

                {activeSheet?.type === 'absences' && (
                     absencesForSheet.length > 0 ? (
                        <ul className="space-y-2">
                             {absencesForSheet.map((absence, index) => (
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
                         <p className="text-center text-text-secondary dark:text-dark-text-secondary py-8">Нет отработок по этому предмету.</p>
                     )
                )}
            </BottomSheet>
        </>
    );
};


// --- Основной компонент дашборда ---
interface DashboardProps {
    allGrades: SubjectGrade[];
    isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ allGrades, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const studentAnalytics = useMemo((): StudentAnalytics[] => {
        if (!allGrades.length) return [];

        const gradesByStudent: Record<string, SubjectGrade[]> = allGrades.reduce((acc, grade) => {
            if (!acc[grade.user_id]) acc[grade.user_id] = [];
            acc[grade.user_id].push(grade);
            return acc;
        }, {} as Record<string, SubjectGrade[]>);
        
        let analyticsData = Object.entries(gradesByStudent).map(([id, grades]) => {
            const name = grades[0]?.user_name || `User ${id}`;
            const totalAbsences = grades.filter(g => g.score === 'н').length;
            
            const gradesBySubjectForStudent: Record<string, SubjectGrade[]> = grades.reduce((acc, grade) => {
                if (!acc[grade.subject]) acc[grade.subject] = [];
                acc[grade.subject].push(grade);
                return acc;
            }, {} as Record<string, SubjectGrade[]>);

            const subjectAvgsMap = new Map<string, number>();

            const subjects: Record<string, SubjectAnalytics> = Object.fromEntries(
                Object.entries(gradesBySubjectForStudent).map(([subjectName, subjectGrades]) => {
                    const gradeCount = subjectGrades.filter(g => g.score !== 'н' && g.score !== 'б' && g.score !== null).length;
                    const absences = subjectGrades.filter(g => g.score === 'н').length;
                    
                    // Correctly get the pre-calculated avg_score from the sheet for this subject.
                    const avgScoreFromSheet = subjectGrades.find(g => typeof g.avg_score === 'number')?.avg_score;
                    const avgScore: number | null = avgScoreFromSheet !== undefined ? avgScoreFromSheet : null;

                    if (avgScore !== null) {
                        subjectAvgsMap.set(subjectName, avgScore);
                    }

                    return [subjectName, { avgScore, gradeCount, absences }];
                })
            );
            
            // Correctly calculate the overall average score from the average of subject averages
            const subjectAvgsArray = Array.from(subjectAvgsMap.values());
            let overallAvgScore: number | null = null;
            if (subjectAvgsArray.length > 0) {
                overallAvgScore = subjectAvgsArray.reduce((sum, score) => sum + score, 0) / subjectAvgsArray.length;
            }

            return { id, name, overallAvgScore, totalAbsences, subjects, rank: 0 };
        });

        // Calculate ranks based on the correct overall average score
        analyticsData.sort((a, b) => (b.overallAvgScore ?? 0) - (a.overallAvgScore ?? 0));
        
        let currentRank = 0;
        let lastScore = -1;
        analyticsData.forEach((student, index) => {
            if (student.overallAvgScore !== lastScore) {
                currentRank = index + 1;
                lastScore = student.overallAvgScore!;
            }
            student.rank = currentRank;
        });

        // Return sorted by last name for display
        return analyticsData.sort((a, b) => {
            const getLastName = (fullName: string) => {
                const parts = fullName.split(' ');
                // Use the last word as the last name. Handles single-word names.
                return parts.length > 1 ? parts[parts.length - 1] : parts[0];
            };

            const lastNameA = getLastName(a.name);
            const lastNameB = getLastName(b.name);

            const lastNameComparison = lastNameA.localeCompare(lastNameB, 'ru');

            // If last names are different, sort by last name
            if (lastNameComparison !== 0) {
                return lastNameComparison;
            }

            // If last names are the same, sort by the full name (effectively by first name)
            return a.name.localeCompare(b.name, 'ru');
        });
    }, [allGrades]);

    const filteredStudents = useMemo(() => {
        if (!searchTerm) return studentAnalytics;
        return studentAnalytics.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [studentAnalytics, searchTerm]);

    if (isLoading) {
        return (
            <div className="animate-fade-in space-y-4">
                 <div className="bg-secondary dark:bg-dark-secondary p-4 rounded-3xl animate-pulse h-14"></div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-secondary dark:bg-dark-secondary p-4 rounded-3xl animate-pulse h-20"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-4">
            <div className="relative">
                <i className="ph-bold ph-magnifying-glass absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary dark:text-dark-text-secondary"></i>
                <input
                    type="text"
                    placeholder="Найти студента..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-soft-lg dark:shadow-dark-soft-lg rounded-3xl py-3 pl-11 pr-4 text-text-primary dark:text-dark-text-primary placeholder:text-text-secondary dark:placeholder:text-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent"
                />
            </div>
            {filteredStudents.length > 0 ? (
                filteredStudents.map(student => {
                    const studentGrades = allGrades.filter(g => g.user_id === student.id);
                    return <StudentAnalyticsCard key={student.id} student={student} allStudentGrades={studentGrades} />
                })
            ) : (
                <div className="text-center py-10 text-text-secondary dark:text-dark-text-secondary">
                    <p>Студенты не найдены.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;