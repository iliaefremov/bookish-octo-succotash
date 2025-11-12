import React from 'react';
import type { SubjectGrade } from '../types';

interface GradeChartProps {
    grades: SubjectGrade[];
}

export const GradeChart: React.FC<GradeChartProps> = ({ grades }) => {
    const numericGrades = grades
        .filter(g => typeof g.score === 'number')
        .map(g => g.score as number)
        .reverse(); // reverse to show chronological order from left to right

    if (numericGrades.length < 2) {
        return (
            <div className="h-40 flex items-center justify-center text-center text-text-secondary dark:text-dark-text-secondary">
                <p className="text-sm">Недостаточно данных для построения графика.</p>
            </div>
        );
    }

    const width = 300;
    const height = 100;
    // Увеличиваем отступ, чтобы график не выезжал за пределы
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxScore = 100;
    const minScore = 0;

    const points = numericGrades.map((score, index) => {
        const x = (index / (numericGrades.length - 1)) * chartWidth + padding;
        const y = chartHeight - ((score - minScore) / (maxScore - minScore)) * chartHeight + padding;
        return `${x},${y}`;
    }).join(' ');
    
    const lastPoint = points.split(' ').pop()?.split(',');
    const lastPointX = lastPoint ? parseFloat(lastPoint[0]) : 0;
    const lastPointY = lastPoint ? parseFloat(lastPoint[1]) : 0;
    const lastGrade = numericGrades[numericGrades.length - 1];

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby="chart-title" role="img">
            <title id="chart-title">График динамики оценок</title>
            <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#3879E8" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3879E8" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3879E8" stopOpacity="0" />
                </linearGradient>
            </defs>
            <g>
                {/* Y-Axis Lines */}
                {[25, 50, 75, 100].map(val => {
                    const y = chartHeight - ((val - minScore) / (maxScore - minScore)) * chartHeight + padding;
                    return (
                        <g key={val}>
                            <line
                                x1={padding}
                                y1={y}
                                x2={width - padding}
                                y2={y}
                                className="stroke-current text-gray-200 dark:text-slate-700"
                                strokeWidth="0.5"
                                strokeDasharray="2,3"
                            />
                            <text
                                x={padding - 5}
                                y={y}
                                dy="0.3em"
                                textAnchor="end"
                                className="text-[8px] fill-current text-text-secondary dark:text-dark-text-secondary"
                            >
                                {val}
                            </text>
                        </g>
                    )
                })}
            </g>
            <g>
                 {/* Area under the line */}
                 <polygon points={`${padding},${height-padding} ${points} ${width-padding},${height-padding}`} fill="url(#areaGradient)" />

                {/* The main line */}
                <polyline
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                />
                 {/* Points on the line */}
                {points.split(' ').map((point, index) => {
                    const [x, y] = point.split(',');
                    return (
                        <g key={index}>
                          <circle cx={x} cy={y} r="3" fill="white" className="stroke-current text-accent dark:text-dark-accent" strokeWidth="1.5" />
                        </g>
                    )
                })}
                {/* Last point with label */}
                <g>
                    <circle cx={lastPointX} cy={lastPointY} r="4" fill="white" className="stroke-current text-accent dark:text-dark-accent" strokeWidth="2" />
                    <text x={lastPointX} y={lastPointY - 8} textAnchor="middle" className="text-xs font-bold fill-current text-accent dark:text-dark-accent">{lastGrade}</text>
                </g>
            </g>
        </svg>
    );
};