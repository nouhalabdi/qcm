// StudentProgress.js - تحميل فوري مع localStorage وحساب النسبة المئوية (مصحح)
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle, Clock, Filter,
  ArrowLeft, TrendingUp, Zap, Award
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

function StudentProgress() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const extraFetched = useRef(false);

  // --- تحميل فوري من localStorage مع معالجة التواريخ ---
  const loadFromCache = (key, fallback) => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          // إذا كانت البيانات تحتوي على تواريخ، نحولها إلى Date
          if (key === 'progress_stats' && data.readLessons) {
            data.readLessons = data.readLessons.map(r => ({
              ...r,
              readAt: r.readAt ? new Date(r.readAt) : null
            }));
            data.completedQuizzes = (data.completedQuizzes || []).map(q => ({
              ...q,
              date: q.date ? new Date(q.date) : null
            }));
          }
          return data;
        }
      }
    } catch (e) {
      console.warn('Erreur chargement cache:', e);
    }
    return fallback;
  };

  const [stats, setStats] = useState(() => loadFromCache('progress_stats', {
    progress: 0,
    completedExams: 0,
    completedLessonQCMs: 0,
    lessonsRead: 0,
    totalLessons: 0,
    readLessons: [],
    completedQuizzes: [],
  }));
  const [filterPeriod, setFilterPeriod] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [allModules, setAllModules] = useState(() => loadFromCache('progress_modules', []));
  const [allLessons, setAllLessons] = useState(() => loadFromCache('progress_lessons', []));
  const [allQuizzes, setAllQuizzes] = useState(() => loadFromCache('progress_quizzes', []));
  const [loadingExtra, setLoadingExtra] = useState(true);

  // --- حساب التقدم كنسبة مئوية (0-100) ---
  const progressPercent = useMemo(() => {
    const total = stats.totalLessons || 1;
    const read = stats.lessonsRead || 0;
    return Math.min(100, Math.round((read / total) * 100));
  }, [stats.totalLessons, stats.lessonsRead]);

  // --- حساب متوسط النقاط ---
  const averageScore = useMemo(() => {
    if (stats.completedQuizzes.length === 0) return null;
    const total = stats.completedQuizzes.reduce((acc, q) => acc + (q.score || 0), 0);
    return Math.round(total / stats.completedQuizzes.length);
  }, [stats.completedQuizzes]);

  // --- تحميل البيانات الأساسية في الخلفية ---
  useEffect(() => {
    if (!user || !user._id) {
      navigate('/auth');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/profile/stats?userId=${user._id}`);
        if (!res.ok) throw new Error('Erreur serveur');
        const data = await res.json();

        // تحويل التواريخ مع التحقق من الصلاحية
        const readLessons = (data.readLessons || []).map(r => {
          let readAt = r.readAt;
          if (typeof readAt === 'string') readAt = new Date(readAt);
          if (!(readAt instanceof Date) || isNaN(readAt.getTime())) readAt = null;
          return {
            ...r,
            readAt,
            lessonId: r.lessonId || { title: 'Cours sans titre' }
          };
        }).filter(r => r.readAt !== null);

        const completedQuizzes = (data.completedQuizzes || []).map(q => {
          let date = q.date;
          if (typeof date === 'string') date = new Date(date);
          if (!(date instanceof Date) || isNaN(date.getTime())) date = null;
          return {
            ...q,
            date,
            quizId: q.quizId || { title: 'QCM sans titre', lessonId: null, moduleId: null }
          };
        }).filter(q => q.date !== null);

        const newStats = {
          ...data,
          readLessons,
          completedQuizzes,
          lessonsRead: readLessons.length,
          completedLessonQCMs: completedQuizzes.filter(q => q.type === 'lesson').length,
          completedExams: completedQuizzes.filter(q => q.type === 'module' || q.type === 'simulation').length
        };
        setStats(newStats);
        localStorage.setItem('progress_stats', JSON.stringify({ data: newStats, timestamp: Date.now() }));
        setLoadingExtra(false);
      } catch (err) {
        console.error(err);
        setLoadingExtra(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  // --- تحميل البيانات الإضافية في الخلفية (مرة واحدة) ---
  useEffect(() => {
    if (!user || !user.year || extraFetched.current) return;
    extraFetched.current = true;

    const fetchExtra = async () => {
      try {
        const cachedModules = loadFromCache('progress_modules', null);
        const cachedLessons = loadFromCache('progress_lessons', null);
        const cachedQuizzes = loadFromCache('progress_quizzes', null);
        if (cachedModules && cachedLessons && cachedQuizzes) {
          setAllModules(cachedModules);
          setAllLessons(cachedLessons);
          setAllQuizzes(cachedQuizzes);
          setLoadingExtra(false);
          return;
        }

        const modulesRes = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/modules?year=${user.year}`);
        const modulesData = await modulesRes.json();
        setAllModules(modulesData);
        localStorage.setItem('progress_modules', JSON.stringify({ data: modulesData, timestamp: Date.now() }));

        const lessonsPromises = modulesData.map(mod =>
          fetch(`https://reussite-qcmss-1nc7.onrender.com/api/lessons?moduleId=${mod._id}`).then(r => r.json())
        );
        const quizzesPromises = modulesData.map(mod =>
          fetch(`https://reussite-qcmss-1nc7.onrender.com/api/quizzes?moduleId=${mod._id}`).then(r => r.json())
        );

        const [lessonsResults, quizzesResults] = await Promise.allSettled([
          Promise.all(lessonsPromises),
          Promise.all(quizzesPromises)
        ]);

        let allLessonsData = [];
        let allQuizzesData = [];
        if (lessonsResults.status === 'fulfilled') {
          allLessonsData = lessonsResults.value.flat();
          localStorage.setItem('progress_lessons', JSON.stringify({ data: allLessonsData, timestamp: Date.now() }));
        }
        if (quizzesResults.status === 'fulfilled') {
          allQuizzesData = quizzesResults.value.flat();
          localStorage.setItem('progress_quizzes', JSON.stringify({ data: allQuizzesData, timestamp: Date.now() }));
        }
        setAllLessons(allLessonsData);
        setAllQuizzes(allQuizzesData);
        setLoadingExtra(false);
      } catch (err) {
        console.error('Erreur chargement données extra:', err);
        setLoadingExtra(false);
      }
    };

    fetchExtra();
  }, [user]);

  // --- دالة استخراج اسم الوحدة ---
  const getModuleNameFromQuiz = useCallback((quiz) => {
    if (!quiz) return 'Module inconnu';
    if (quiz.moduleId && typeof quiz.moduleId === 'object' && quiz.moduleId.title) return quiz.moduleId.title;
    if (quiz.lessonId) {
      const lessonId = quiz.lessonId._id || quiz.lessonId;
      const lesson = allLessons.find(l => l._id === lessonId);
      if (lesson && lesson.moduleId) {
        const moduleId = lesson.moduleId._id || lesson.moduleId;
        const module = allModules.find(m => m._id === moduleId);
        if (module) return module.title;
      }
    }
    if (quiz.moduleId) {
      const moduleId = quiz.moduleId._id || quiz.moduleId;
      const module = allModules.find(m => m._id === moduleId);
      if (module) return module.title;
    }
    return 'Module inconnu';
  }, [allLessons, allModules]);

  // --- تحضير بيانات المنحنى (مع التحقق من صحة التاريخ) ---
  const prepareChartData = useCallback((readLessons, completedQuizzes, filter) => {
    const dailyMap = {};

    readLessons.forEach(r => {
      // التأكد من أن readAt هو كائن Date صالح
      let date = r.readAt;
      if (typeof date === 'string') date = new Date(date);
      if (!(date instanceof Date) || isNaN(date.getTime())) return;

      const key = date.toISOString().split('T')[0];
      if (!dailyMap[key]) dailyMap[key] = { date: key, lessons: 0, quizzes: 0 };
      dailyMap[key].lessons++;
    });

    completedQuizzes.forEach(q => {
      let date = q.date;
      if (typeof date === 'string') date = new Date(date);
      if (!(date instanceof Date) || isNaN(date.getTime())) return;

      const key = date.toISOString().split('T')[0];
      if (!dailyMap[key]) dailyMap[key] = { date: key, lessons: 0, quizzes: 0 };
      dailyMap[key].quizzes++;
    });

    const now = new Date();
    let startDate, endDate = new Date();
    switch (filter) {
      case 'week': {
        const dayOfWeek = now.getDay();
        const diffToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        startDate = new Date(now);
        startDate.setDate(now.getDate() - diffToMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      default: {
        const allDates = Object.keys(dailyMap).sort();
        if (allDates.length === 0) return [];
        startDate = new Date(allDates[0]);
        endDate = new Date(allDates[allDates.length - 1]);
        break;
      }
    }

    const dateRange = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dateRange.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dateRange.map(date => ({
      date,
      lessons: dailyMap[date]?.lessons || 0,
      quizzes: dailyMap[date]?.quizzes || 0
    }));
  }, []);

  // --- تحديث المنحنى عند تغيير الفلتر أو البيانات ---
  useEffect(() => {
    if (stats.readLessons.length === 0 && stats.completedQuizzes.length === 0) {
      setChartData([]);
      return;
    }
    const data = prepareChartData(stats.readLessons, stats.completedQuizzes, filterPeriod);
    setChartData(data);
  }, [filterPeriod, stats.readLessons, stats.completedQuizzes, prepareChartData]);

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois-ci';
      case 'year': return 'Cette année';
      default: return 'Depuis le début';
    }
  };

  // --- عرض الصفحة فوراً ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {loadingExtra && (
          <div className="text-center text-xs text-blue-500 dark:text-blue-400 animate-pulse mb-2">
            Mise à jour des données en arrière-plan...
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/profile')} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"><ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" /></button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><TrendingUp size={28} className="text-blue-600 dark:text-blue-400" /> Ma Progression</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{getPeriodLabel()} · {user?.username}</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-wrap items-center gap-3">
          <Filter size={18} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Période :</span>
          <div className="flex flex-wrap gap-2">
            {['week', 'month', 'year', 'all'].map(p => (
              <button key={p} onClick={() => setFilterPeriod(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterPeriod === p ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : p === 'year' ? 'Année' : 'Tout'}
              </button>
            ))}
          </div>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3"><BookOpen size={20} className="text-blue-600" /><div><p className="text-xs text-slate-500">Cours lus</p><p className="text-xl font-bold text-slate-800 dark:text-white">{stats.lessonsRead}</p></div></div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3"><Zap size={20} className="text-yellow-600" /><div><p className="text-xs text-slate-500">QCMs résolus</p><p className="text-xl font-bold text-slate-800 dark:text-white">{stats.completedQuizzes?.length || 0}</p></div></div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3"><Clock size={20} className="text-orange-600" /><div><p className="text-xs text-slate-500">Progression</p><p className="text-xl font-bold text-slate-800 dark:text-white">{progressPercent}%</p></div></div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3"><Award size={20} className="text-green-600" /><div><p className="text-xs text-slate-500">Score moyen</p><p className="text-xl font-bold text-slate-800 dark:text-white">{averageScore !== null ? `${averageScore}%` : '—'}</p></div></div>
          </div>
        </div>

        {/* Graphique */}
        {chartData.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Évolution quotidienne</h3>
            <div className="h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="lessons" stroke="#3B82F6" strokeWidth={2} name="Cours lus" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="quizzes" stroke="#F59E0B" strokeWidth={2} name="QCMs résolus" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center mb-6">
            <p className="text-slate-500 dark:text-slate-400">Aucune donnée disponible pour la période sélectionnée.</p>
          </div>
        )}

        {/* Détails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><BookOpen size={18} className="text-blue-600" /> Cours lus</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stats.readLessons?.length > 0 ? (
                stats.readLessons.map((r, i) => {
                  const lessonId = r.lessonId?._id || r.lessonId;
                  const lesson = allLessons.find(l => l._id === lessonId);
                  const moduleId = lesson?.moduleId?._id || lesson?.moduleId;
                  const module = allModules.find(m => m._id === moduleId);
                  const moduleName = module?.title || '';
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{r.lessonId?.title || 'Cours sans titre'}</span>
                      {moduleName && <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">{moduleName}</span>}
                    </div>
                  );
                })
              ) : <p className="text-xs text-slate-400">Aucun cours lu.</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2"><Zap size={18} className="text-yellow-600" /> QCMs résolus</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stats.completedQuizzes?.length > 0 ? (
                stats.completedQuizzes.map((q, i) => {
                  const typeLabel = q.type === 'module' ? 'Examen' : q.type === 'simulation' ? 'Simulation' : 'QCM cours';
                  const moduleName = getModuleNameFromQuiz(q.quizId || q);
                  const lessonName = q.quizId?.lessonId?.title || '';
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{typeLabel} - {moduleName} {lessonName && `(${lessonName})`}</span>
                      <span className="text-xs text-slate-400 ml-auto">{q.score}%</span>
                    </div>
                  );
                })
              ) : <p className="text-xs text-slate-400">Aucun QCM résolu.</p>}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={() => navigate('/cours')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2 mx-auto"><BookOpen size={18} /> Continuer à étudier</button>
        </div>
      </div>
    </div>
  );
}

export default StudentProgress;
