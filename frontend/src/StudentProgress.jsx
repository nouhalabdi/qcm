import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, BookOpen, CheckCircle, Clock, Calendar, Filter,
  ArrowLeft, TrendingUp, Zap, Award, Users, FileText
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

function StudentProgress() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [stats, setStats] = useState({
    progress: 0,
    completedExams: 0,
    completedLessonQCMs: 0,
    lessonsRead: 0,
    totalLessons: 0,
    readLessons: [],
    completedQuizzes: [],
    totalModules: 0,
    completedModules: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('today');
  const [chartData, setChartData] = useState([]);

  // États pour les données supplémentaires (nécessaires pour retrouver les noms de modules)
  const [allModules, setAllModules] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);

  useEffect(() => {
    if (!user || !user._id) {
      navigate('/auth');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`https://reussite-qcms.onrender.com/api/users/profile/stats?userId=${user._id}`);
        if (!res.ok) throw new Error('Erreur serveur');
        const data = await res.json();

        // معالجة التواريخ غير الصالحة
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

        const completedModules = new Set(
          completedQuizzes
            .filter(q => q.type === 'module')
            .map(q => q.quizId?._id || q.quizId)
        ).size;

        setStats({
          ...data,
          readLessons,
          completedQuizzes,
          completedModules,
          totalModules: data.totalModules || 1,
          lessonsRead: readLessons.length,
          completedLessonQCMs: completedQuizzes.filter(q => q.type === 'lesson').length,
          completedExams: completedQuizzes.filter(q => q.type === 'module' || q.type === 'simulation').length
        });

        // تحضير بيانات الرسم البياني بعد جلب البيانات
        prepareChartData(readLessons, completedQuizzes);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // جلب البيانات الإضافية (modules, lessons, quizzes) لاستخدامها في استخراج اسم الوحدة
  useEffect(() => {
    if (!user || !user.year) return;
    const fetchExtraData = async () => {
      try {
        const modulesRes = await fetch(`https://reussite-qcms.onrender.com/api/modules?year=${user.year}`);
        const modulesData = await modulesRes.json();
        setAllModules(modulesData);

        const lessonsPromises = modulesData.map(mod =>
          fetch(`https://reussite-qcms.onrender.com/api/lessons?moduleId=${mod._id}`).then(r => r.json())
        );
        const lessonsArrays = await Promise.all(lessonsPromises);
        const allLessonsData = lessonsArrays.flat();
        setAllLessons(allLessonsData);

        const quizzesPromises = modulesData.map(mod =>
          fetch(`https://reussite-qcms.onrender.com/api/quizzes?moduleId=${mod._id}`).then(r => r.json())
        );
        const quizzesArrays = await Promise.all(quizzesPromises);
        const allQuizzesData = quizzesArrays.flat();
        setAllQuizzes(allQuizzesData);
      } catch (err) {
        console.error('Erreur chargement données extra:', err);
      }
    };
    fetchExtraData();
  }, [user]);

  // دالة مساعدة لاستخراج اسم الوحدة من كائن quiz
  const getModuleNameFromQuiz = (quiz) => {
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
    if (quiz.lessonId) {
      const lessonId = quiz.lessonId._id || quiz.lessonId;
      const lesson = allLessons.find(l => l._id === lessonId);
      if (lesson && lesson.moduleId) {
        const moduleId = lesson.moduleId._id || lesson.moduleId;
        const module = allModules.find(m => m._id === moduleId);
        if (module) return module.title;
      }
    }
    return 'Module inconnu';
  };

  // دالة لإنشاء مصفوفة من التواريخ بين تاريخين
  const getDateRange = (startDate, endDate) => {
    const dates = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const prepareChartData = (readLessons, completedQuizzes) => {
    // تجميع البيانات حسب اليوم
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

    // تحديد نطاق التواريخ حسب الفلتر
    const now = new Date();
    let startDate, endDate = new Date();

    switch (filterPeriod) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default: // 'all'
        // نأخذ أول تاريخ موجود في البيانات
        const allDates = Object.keys(dailyMap).sort();
        if (allDates.length === 0) {
          setChartData([]);
          return;
        }
        startDate = new Date(allDates[0]);
        endDate = new Date(allDates[allDates.length - 1]);
        break;
    }

    // توليد جميع أيام الفترة
    let dateRange;
    if (filterPeriod === 'all') {
      dateRange = getDateRange(startDate, endDate);
    } else {
      dateRange = getDateRange(startDate, endDate);
    }

    // بناء البيانات مع تعبئة الأيام الفارغة بقيمة 0
    const result = dateRange.map(date => ({
      date,
      lessons: dailyMap[date]?.lessons || 0,
      quizzes: dailyMap[date]?.quizzes || 0
    }));

    setChartData(result);
  };

  // إعادة تحضير البيانات عند تغيير الفلتر
  useEffect(() => {
    if (stats.readLessons.length > 0 || stats.completedQuizzes.length > 0) {
      prepareChartData(stats.readLessons, stats.completedQuizzes);
    }
  }, [filterPeriod]);

  const getPeriodLabel = () => {
    switch (filterPeriod) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois-ci';
      case 'year': return 'Cette année';
      default: return 'Depuis le début';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-10 flex items-center justify-center">
      <div className="text-center text-slate-500">Chargement de votre progression...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header avec retour */}
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
                <p className="text-xs text-slate-500">Modules complétés</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">
                  {stats.completedModules || 0}/{stats.totalModules || 1}
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

        {/* Détails : Cours et QCMs (Modules supprimé) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cours */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-blue-600" /> Cours lus
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stats.readLessons?.length > 0 ? (
                stats.readLessons.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle size={14} className="text-green-600" />
                    <span className="text-slate-700 dark:text-slate-300 truncate">
                      {r.lessonId?.title || 'Cours sans titre'}
                    </span>
                    {r.lessonId?.moduleId?.title && (
                      <span className="text-xs text-slate-400 ml-auto">
                        {r.lessonId.moduleId.title}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Aucun cours lu.</p>
              )}
            </div>
          </div>

          {/* QCMs */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Zap size={18} className="text-yellow-600" /> QCMs résolus
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {stats.completedQuizzes?.length > 0 ? (
                stats.completedQuizzes.map((q, i) => {
                  const typeLabel = q.type === 'module' ? 'Examen' : q.type === 'simulation' ? 'Simulation' : 'QCM cours';
                  // استخراج اسم المادة والدرس باستخدام الدالة المساعدة
                  const moduleName = getModuleNameFromQuiz(q.quizId || q);
                  const lessonName = q.quizId?.lessonId?.title || '';
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {typeLabel} - {moduleName} {lessonName && `(${lessonName})`}
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

        {/* Bouton retour vers les cours */}
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