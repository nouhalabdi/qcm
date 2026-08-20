// StudentProgress.js
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

  // السنة الأكاديمية المطلوبة
  const TARGET_ACADEMIC_YEAR = '2026-2027';

  // بيانات الإحصائيات الأساسية
  const [stats, setStats] = useState({
    progress: 0,
    completedExams: 0,
    completedLessonQCMs: 0,
    lessonsRead: 0,
    totalLessons: 0,
    readLessons: [],
    completedQuizzes: [],
  });

  const [filterPeriod, setFilterPeriod] = useState('week');
  const [chartData, setChartData] = useState([]);

  // بيانات إضافية (موديولات، دروس، QCMs)
  const [allModules, setAllModules] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const extraFetched = useRef(false);

  // --- حساب متوسط النقاط ---
  const averageScore = useMemo(() => {
    if (stats.completedQuizzes.length === 0) return null;
    const total = stats.completedQuizzes.reduce((acc, q) => acc + (q.score || 0), 0);
    return Math.round(total / stats.completedQuizzes.length);
  }, [stats.completedQuizzes]);

  // --- تحميل بيانات المستخدم ---
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

        const readLessons = (data.readLessons || []).map(r => ({
          ...r,
          readAt: r.readAt ? new Date(r.readAt) : null,
          lessonId: r.lessonId || { title: 'Cours sans titre' }
        })).filter(r => r.readAt && !isNaN(r.readAt.getTime()));

        const completedQuizzes = (data.completedQuizzes || []).map(q => ({
          ...q,
          date: q.date ? new Date(q.date) : null,
          quizId: q.quizId || { title: 'QCM sans titre', lessonId: null, moduleId: null }
        })).filter(q => q.date && !isNaN(q.date.getTime()));

        setStats({
          ...data,
          readLessons,
          completedQuizzes,
          lessonsRead: readLessons.length,
          completedLessonQCMs: completedQuizzes.filter(q => q.type === 'lesson').length,
          completedExams: completedQuizzes.filter(q => q.type === 'module' || q.type === 'simulation').length
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, [user, navigate]);

  // --- تحميل البيانات الإضافية ---
  useEffect(() => {
    if (!user || !user.year || extraFetched.current) return;
    extraFetched.current = true;

    const CACHE_KEY = `progress_extra_${user.year}`;
    const CACHE_EXPIRY = 5 * 60 * 1000;

    const loadFromCache = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            return data;
          }
        }
      } catch (e) {}
      return null;
    };

    const saveToCache = (data) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (e) {}
    };

    const fetchExtraData = async () => {
      const cachedData = loadFromCache();
      if (cachedData) {
        setAllModules(cachedData.modules);
        setAllLessons(cachedData.allLessons);
        setAllQuizzes(cachedData.allQuizzes);
        return;
      }

      try {
        const modulesRes = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/modules?year=${user.year}`);
        const modulesData = await modulesRes.json();
        setAllModules(modulesData);

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
        }
        if (quizzesResults.status === 'fulfilled') {
          allQuizzesData = quizzesResults.value.flat();
        }

        setAllLessons(allLessonsData);
        setAllQuizzes(allQuizzesData);

        saveToCache({
          modules: modulesData,
          allLessons: allLessonsData,
          allQuizzes: allQuizzesData
        });
      } catch (err) {
        console.error('Erreur chargement données extra:', err);
      }
    };

    fetchExtraData();
  }, [user]);

  // --- دالة مساعدة لاستخراج اسم الوحدة ---
  const getModuleNameFromQuiz = useCallback((quiz) => {
    if (!quiz) return 'Module inconnu';
    if (quiz.moduleId && typeof quiz.moduleId === 'object' && quiz.moduleId.title) {
      return quiz.moduleId.title;
    }
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

  // --- تحضير بيانات المنحنى ---
  const prepareChartData = useCallback((readLessons, completedQuizzes, filter) => {
    const dailyMap = {};

    readLessons.forEach(r => {
      if (!r.readAt) return;
      const key = r.readAt.toISOString().split('T')[0];
      if (!dailyMap[key]) dailyMap[key] = { date: key, lessons: 0, quizzes: 0 };
      dailyMap[key].lessons++;
    });

    completedQuizzes.forEach(q => {
      if (!q.date) return;
      const key = q.date.toISOString().split('T')[0];
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

  // --- تحديث المنحنى ---
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

  // ✅ فلترة الدروس المقروءة: فقط التي تحتوي على محتوى فعلي للسنة 2026-2027
  const filteredReadLessons = useMemo(() => {
    if (!allLessons || !stats.readLessons) return [];
    return stats.readLessons.filter(r => {
      const lessonId = r.lessonId?._id || r.lessonId;
      const lesson = allLessons.find(l => l._id === lessonId);
      if (!lesson) return false;

      const yearContent = (lesson.yearContents || []).find(yc => yc.year === TARGET_ACADEMIC_YEAR);
      if (!yearContent) return false;

      const hasContent = yearContent.versions.some(version =>
        version.pdf?.length > 0 || version.video?.length > 0 || version.summary?.length > 0 ||
        version.td?.length > 0 || version.correction?.length > 0 || version.other?.length > 0 ||
        version.ai?.length > 0 || version.aiSummary?.length > 0
      );
      return hasContent;
    });
  }, [stats.readLessons, allLessons]);

  // ---------- JSX (تمت إزالة شاشة التحميل لتصبح الصفحة سريعة) ----------
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp size={28} className="text-blue-600 dark:text-blue-400" />
              Ma Progression
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {getPeriodLabel()} · {user?.username}
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-wrap items-center gap-3">
          <Filter size={18} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Période :</span>
          <div className="flex flex-wrap gap-2">
            {['week', 'month', 'year', 'all'].map(p => (
              <button
                key={p}
                onClick={() => setFilterPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filterPeriod === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : p === 'year' ? 'Année' : 'Tout'}
              </button>
            ))}
          </div>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <BookOpen size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-slate-500">Cours lus</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.lessonsRead}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Zap size={20} className="text-yellow-600" />
              <div>
                <p className="text-xs text-slate-500">QCMs résolus</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.completedQuizzes?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-orange-600" />
              <div>
                <p className="text-xs text-slate-500">Progression</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.progress}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Award size={20} className="text-green-600" />
              <div>
                <p className="text-xs text-slate-500">Score moyen</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  {averageScore !== null ? `${averageScore}%` : '—'}
                </p>
              </div>
            </div>
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="lessons"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Cours lus"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="quizzes"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="QCMs résolus"
                    dot={{ r: 3 }}
                  />
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
          {/* ✅ Cours lus: فقط الدروس التي تحتوي على محتوى فعلي للسنة 2026-2027 */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-600" /> Cours lus ({TARGET_ACADEMIC_YEAR})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredReadLessons?.length > 0 ? (
                filteredReadLessons.map((r, i) => {
                  const lessonId = r.lessonId?._id || r.lessonId;
                  const lesson = allLessons.find(l => l._id === lessonId);
                  const moduleId = lesson?.moduleId?._id || lesson?.moduleId;
                  const module = allModules.find(m => m._id === moduleId);
                  const moduleName = module?.title || '';
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {r.lessonId?.title || 'Cours sans titre'}
                      </span>
                      {moduleName && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
                          {moduleName}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">Aucun cours lu pour {TARGET_ACADEMIC_YEAR}.</p>
              )}
            </div>
          </div>

          {/* QCMs résolus: كل السنوات (مع تحسين العرض) */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Zap size={18} className="text-yellow-600" /> QCMs résolus
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stats.completedQuizzes?.length > 0 ? (
                stats.completedQuizzes.map((q, i) => {
                  const moduleName = getModuleNameFromQuiz(q.quizId || q);
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-slate-700 dark:text-slate-300 truncate break-words whitespace-normal">
                        {q.type === 'module' ? (
                          <>{moduleName} ({q.quizId?.year || 'Année inconnue'})</>
                        ) : q.type === 'lesson' && q.quizId?.isIA ? (
                          <>QCM IA{q.quizId?.title ? ` - ${q.quizId?.title}` : ''} ({moduleName})</>
                        ) : q.type === 'lesson' ? (
                          <>QCM Cours{q.quizId?.title ? ` - ${q.quizId?.title}` : ''} ({moduleName})</>
                        ) : (
                          <>{q.type === 'simulation' ? 'Simulation' : 'QCM'} - {moduleName}</>
                        )}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto">{q.score}%</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">Aucun QCM résolu.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/cours')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2 mx-auto"
          >
            <BookOpen size={18} /> Continuer à étudier
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentProgress;
