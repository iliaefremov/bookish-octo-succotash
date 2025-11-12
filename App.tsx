import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Schedule from './components/Schedule';
import Grades from './components/Grades';
import Dashboard from './components/Dashboard';
import { ScheduleIcon, GradesIcon, DashboardIcon } from './components/icons/Icons';
import { GRADES_DATA, ALLOWED_TELEGRAM_USER_IDS, ADMIN_TELEGRAM_IDS } from './constants';
import type { TelegramUser, SubjectGrade, DaySchedule, Homework } from './types';
import { getGrades, getHomeworks, getLectureAbsences } from './services/googleSheetsService';

type Tab = 'schedule' | 'grades' | 'dashboard';
type Theme = 'light' | 'dark';

interface UnauthorizedScreenProps {
  userId?: number;
}

const UnauthorizedScreen: React.FC<UnauthorizedScreenProps> = ({ userId }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (userId) {
            navigator.clipboard.writeText(userId.toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-6">
            <div className="relative bg-white/40 dark:bg-slate-900/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 rounded-3xl p-8 shadow-soft-lg dark:shadow-dark-soft-lg animate-fade-in flex flex-col items-center">
                 <div className="text-6xl mb-5 animate-swing" role="img" aria-label="Lock Icon">🔐</div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Доступ ограничен</h2>
                {userId ? (
                    <>
                        <p className="text-text-secondary dark:text-dark-text-secondary max-w-sm mb-6">
                            К сожалению, ваш аккаунт не имеет доступа к этому приложению.
                        </p>
                        <div className="text-center">
                             <p className="text-xs text-text-secondary dark:text-dark-text-secondary mb-2">Ваш Telegram ID:</p>
                             <button 
                                onClick={handleCopy} 
                                className="bg-highlight dark:bg-dark-highlight px-4 py-2 rounded-xl font-mono text-sm text-text-primary dark:text-dark-text-primary hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-dark-accent"
                                title="Нажмите, чтобы скопировать"
                             >
                                 {userId}
                             </button>
                             {copied && <p className="text-xs text-green-600 dark:text-green-400 mt-2 animate-fade-in">Скопировано!</p>}
                        </div>
                    </>
                ) : (
                    <p className="text-text-secondary dark:text-dark-text-secondary max-w-sm">
                        Пожалуйста, откройте это приложение внутри Telegram, чтобы мы могли вас идентифицировать.
                    </p>
                )}
            </div>
        </div>
    );
};

interface PageHeaderProps {
  activeTab: Tab;
  toggleTheme: () => void;
  theme: Theme;
  loadAllData: () => void;
  isDataLoading: boolean;
  user: TelegramUser | null;
}

const PageHeader: React.FC<PageHeaderProps> = ({ activeTab, toggleTheme, theme, loadAllData, isDataLoading, user }) => {
    const { title, subtitle } = useMemo(() => {
        const today = new Date();
        const formattedDate = new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(today);

        switch (activeTab) {
            case 'schedule': 
                return { title: 'Расписание', subtitle: formattedDate };
            case 'grades':
                const userName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : null;
                return { title: 'Оценки', subtitle: userName };
            case 'dashboard': 
                return { title: 'Дашборд', subtitle: null };
            default: 
                return { title: 'Студент', subtitle: null };
        }
    }, [activeTab, user]);

    return (
        <header className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{title}</h1>
                {subtitle && (
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">{subtitle}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={loadAllData}
                    disabled={isDataLoading}
                    className="w-11 h-11 flex items-center justify-center bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-soft-lg dark:shadow-dark-soft-lg rounded-full text-text-primary dark:text-dark-text-primary hover:bg-white/60 dark:hover:bg-dark-secondary/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Обновить данные"
                >
                    <i className={`ph-bold ph-arrow-clockwise text-xl ${isDataLoading ? 'animate-spin' : ''}`}></i>
                </button>
                <button 
                    onClick={toggleTheme} 
                    className="w-11 h-11 flex items-center justify-center bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-soft-lg dark:shadow-dark-soft-lg rounded-full text-text-primary dark:text-dark-text-primary hover:bg-white/60 dark:hover:bg-dark-secondary/70 transition-colors"
                    aria-label={theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'}
                >
                    <i className={`ph-bold ${theme === 'light' ? 'ph-moon' : 'ph-sun'} text-xl`}></i>
                </button>
            </div>
        </header>
    );
};

const BottomNav: React.FC<{ activeTab: Tab, setActiveTab: (tab: Tab) => void, user: TelegramUser | null }> = ({ activeTab, setActiveTab, user }) => {
    const navItems = useMemo(() => {
        const allItems = [
            { id: 'schedule', label: 'Расписание', icon: ScheduleIcon },
            { id: 'grades', label: 'Оценки', icon: GradesIcon },
            { id: 'dashboard', label: 'Дашборд', icon: DashboardIcon },
        ];
        
        const isAdmin = user ? ADMIN_TELEGRAM_IDS.includes(user.id.toString()) : false;

        if (isAdmin) {
            return allItems;
        }
        return allItems.filter(item => item.id !== 'dashboard');
    }, [user]);

    return (
        <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto p-2 z-50">
            <div className="flex justify-around items-center bg-white/40 dark:bg-dark-secondary/50 backdrop-blur-3xl border border-white/30 dark:border-white/10 shadow-soft-lg dark:shadow-dark-soft-lg rounded-full p-1.5">
                {navItems.map(item => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as Tab)}
                            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-full transition-all duration-300 ease-in-out ${isActive ? 'bg-accent/10 dark:bg-dark-accent/20 text-accent dark:text-dark-accent' : 'text-text-secondary dark:text-dark-text-secondary hover:bg-highlight/50 dark:hover:bg-dark-highlight/50'}`}
                            aria-current={isActive}
                        >
                            <Icon className="text-2xl mb-1" isActive={isActive} />
                            <span className="text-xs font-bold">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unauthorizedId, setUnauthorizedId] = useState<number | null>(null);

  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [lectureAbsences, setLectureAbsences] = useState<SubjectGrade[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') as Theme;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const isAdmin = useMemo(() => user ? ADMIN_TELEGRAM_IDS.includes(user.id.toString()) : false, [user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const loadAllData = useCallback(async () => {
    setIsDataLoading(true);
    setDataError(null);
    try {
      const [gradesData, homeworksData, lectureAbsencesData] = await Promise.all([
          getGrades(),
          getHomeworks(),
          getLectureAbsences()
      ]);
      setGrades(gradesData);
      setHomeworks(homeworksData);
      setLectureAbsences(lectureAbsencesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      setDataError("Не удалось обновить данные. Проверьте подключение к интернету.");
      setGrades(GRADES_DATA); 
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    // ---- РЕЖИМ АДМИНИСТРАТОРА ----
    // Выключен для публикации
    const DEV_ADMIN_OVERRIDE = false;
    
    if (DEV_ADMIN_OVERRIDE) {
        // Этот блок используется только для локальной разработки.
        setUser({ id: parseInt(ADMIN_TELEGRAM_IDS[0], 10), first_name: 'Admin', last_name: 'View' });
    } else {
      // Рабочая логика: аутентификация через Telegram.
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand?.();
        const tgUser = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (tgUser && ALLOWED_TELEGRAM_USER_IDS.includes(tgUser.id.toString())) {
          setUser(tgUser);
        } else {
          setUnauthorizedId(tgUser?.id ?? null);
        }
      } else {
        // Если приложение открыто не в Telegram, пользователь не авторизован.
        setUnauthorizedId(null);
      }
    }
    setIsLoading(false);
  }, []);
  
  // Если не-админ как-то попал на вкладку дашборда, переключить его на расписание
  useEffect(() => {
      if (!isAdmin && activeTab === 'dashboard') {
          setActiveTab('schedule');
      }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, loadAllData]);

  const { userGrades, userLectureAbsences } = useMemo(() => {
    if (!user) return { userGrades: [], userLectureAbsences: [] };
    const userId = user.id.toString();
    return {
        userGrades: grades.filter(g => g.user_id === userId),
        userLectureAbsences: lectureAbsences.filter(la => la.user_id === userId),
    };
  }, [grades, lectureAbsences, user]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen animate-blink">Загрузка...</div>;
  }
  
  if (!user) {
    return <UnauthorizedScreen userId={unauthorizedId ?? undefined} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28"> 
      <PageHeader 
        activeTab={activeTab}
        toggleTheme={toggleTheme} 
        theme={theme}
        loadAllData={loadAllData}
        isDataLoading={isDataLoading}
        user={user}
      />
      <main>
        {activeTab === 'schedule' && <Schedule user={user} homeworks={homeworks} isLoadingHomework={isDataLoading} />}
        {activeTab === 'grades' && <Grades user={user} allGrades={grades} userGrades={userGrades} userLectureAbsences={userLectureAbsences} isLoading={isDataLoading} error={dataError} />}
        {isAdmin && activeTab === 'dashboard' && <Dashboard allGrades={grades} isLoading={isDataLoading} />}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
    </div>
  );
};

export default App;