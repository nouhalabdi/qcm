import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Users, BookOpen, Calendar, Zap, Clock } from 'lucide-react';

function Classement() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const year = currentUser?.year || '1ère Année';
  const [semester, setSemester] = useState('Semestre 1');
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');

  const [activeTab, setActiveTab] = useState('hours'); // 'hours' ou 'simulations'

  const [students, setStudents] = useState([]);
  const [moduleLessons, setModuleLessons] = useState([]);
  const [moduleExams, setModuleExams] = useState([]);
  const [simulations, setSimulations] = useState([]);

  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);

  // جلب الوحدات حسب السنة والسوماستر
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/modules?year=${year}&semester=${semester}`);
        const data = await res.json();
        setModules(data);
        if (!data.find(m => m._id === selectedModule)) {
          setSelectedModule('');
          setStudents([]);
          setModuleLessons([]);
          setModuleExams([]);
          setSimulations([]);
          setRankingData([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchModules();
  }, [year, semester]);

  // عند اختيار وحدة، نجلب الدروس والامتحانات والمحاكيات الخاصة بها
  useEffect(() => {
    if (!selectedModule) {
      setStudents([]);
      setModuleLessons([]);
      setModuleExams([]);
      setSimulations([]);
      setRankingData([]);
      return;
    }

    const fetchModuleData = async () => {
      setLoading(true);
      try {
        const [lessonsRes, examsRes, simRes, studentsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/lessons?moduleId=${selectedModule}`),
          fetch(`http://localhost:5000/api/quizzes?moduleId=${selectedModule}&type=module`),
          fetch(`http://localhost:5000/api/quizzes?moduleId=${selectedModule}&type=simulation`),
          fetch(`http://localhost:5000/api/users?year=${year}`)
        ]);

        let lessonsData = await lessonsRes.json();
        let examsData = await examsRes.json();
        let simData = await simRes.json();
        let studentsData = await studentsRes.json();

        // تصفية الطلاب حسب السنة
        studentsData = studentsData.filter(student => student.year === year);

        setModuleLessons(lessonsData);
        setModuleExams(examsData);
        setSimulations(simData);
        setStudents(studentsData);
        setRankingData([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchModuleData();
  }, [selectedModule, year]);

  // بناء الترتيب حسب ساعات الدراسة (تبويب 'hours')
  useEffect(() => {
    if (students.length === 0 || moduleLessons.length === 0 || activeTab !== 'hours') {
      if (activeTab !== 'hours') return;
      setRankingData([]);
      return;
    }

    const buildHoursRanking = async () => {
      setLoading(true);
      try {
        // جلب إحصائيات كل طالب
        const statsPromises = students.map(async (student) => {
          const res = await fetch(`http://localhost:5000/api/users/profile/stats?userId=${student._id}`);
          if (!res.ok) return null;
          return await res.json();
        });

        const allStats = await Promise.all(statsPromises);

        // قائمة معرفات الدروس في الوحدة
        const lessonIds = moduleLessons.map(l => l._id);
        // قائمة معرفات الامتحانات (type='module') في الوحدة
        const examIds = moduleExams.map(e => e._id);

        const rows = students.map((student, index) => {
          const stats = allStats[index];
          if (!stats) return null;

          // عدد الدروس المقروءة من هذه الوحدة
          const readLessons = stats.readLessons || [];
          const readLessonIds = readLessons.map(r => r.lessonId?._id || r.lessonId || r);
          const lessonsReadInModule = readLessonIds.filter(id => lessonIds.includes(id)).length;

          // عدد الامتحانات المكتملة من هذه الوحدة (type='module')
          const completedQuizzes = stats.completedQuizzes || [];
          const completedExamIds = completedQuizzes
            .filter(q => q.type === 'module')
            .map(q => q.quizId?._id || q.quizId);
          const examsCompletedInModule = completedExamIds.filter(id => examIds.includes(id)).length;

          // حساب الوقت (بالدقائق)
          const totalMinutes = lessonsReadInModule * 30 + examsCompletedInModule * 60;
          const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

          return {
            userId: student._id,
            displayName: student.pseudo || student.username,
            totalHours,
            lessonsReadInModule,
            examsCompletedInModule
          };
        });

        const validRows = rows.filter(r => r !== null);
        validRows.sort((a, b) => b.totalHours - a.totalHours);
        setRankingData(validRows);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    buildHoursRanking();
  }, [students, moduleLessons, moduleExams, activeTab]);

  // بناء الترتيب للمحاكيات (تبويب 'simulations')
  useEffect(() => {
    if (students.length === 0 || simulations.length === 0 || activeTab !== 'simulations') {
      if (activeTab !== 'simulations') return;
      setRankingData([]);
      return;
    }

    const buildSimRanking = async () => {
      setLoading(true);
      try {
        const statsPromises = students.map(async (student) => {
          const res = await fetch(`http://localhost:5000/api/users/profile/stats?userId=${student._id}`);
          if (!res.ok) return null;
          return await res.json();
        });

        const allStats = await Promise.all(statsPromises);

        const rows = students.map((student, index) => {
          const stats = allStats[index];
          if (!stats) return null;

          const completed = stats.completedQuizzes || [];
          // نتائج المحاكيات (type='simulation')
          const simScores = {};
          simulations.forEach(sim => {
            const found = completed.find(q => {
              const qId = q.quizId?._id || q.quizId;
              return String(qId) === String(sim._id) && q.type === 'simulation';
            });
            simScores[sim._id] = found ? Math.round(found.score) : null; // score en %
          });

          // حساب متوسط النقاط على 20 (نأخذ متوسط النسب المئوية ثم نقسم على 5)
          const validScores = Object.values(simScores).filter(v => v !== null);
          const avgPercent = validScores.length > 0
            ? validScores.reduce((a, b) => a + b, 0) / validScores.length
            : null;
          const avgOn20 = avgPercent !== null ? Math.round((avgPercent / 100) * 20 * 10) / 10 : null;

          return {
            userId: student._id,
            displayName: student.pseudo || student.username,
            simScores,
            avgOn20
          };
        });

        const validRows = rows.filter(r => r !== null);
        // ترتيب تنازلي حسب المتوسط
        validRows.sort((a, b) => (b.avgOn20 || 0) - (a.avgOn20 || 0));
        setRankingData(validRows);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    buildSimRanking();
  }, [students, simulations, activeTab]);

  if (!currentUser || !currentUser.isSubscribed) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center gap-3 mb-6">
          <BarChart2 size={28} className="text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Classement</h1>
        </div>

        {/* الفلاتر */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Année</label>
            <p className="font-medium text-slate-800 dark:text-white text-sm p-2">{year}</p>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Semestre</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Semestre 1">Semestre 1</option>
              <option value="Semestre 2">Semestre 2</option>
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Module</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Choisir un module --</option>
              {modules.map(mod => (
                <option key={mod._id} value={mod._id}>{mod.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* تبويبات */}
        {selectedModule && (
          <div className="flex items-center gap-2 mb-6 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
            <button
              onClick={() => setActiveTab('hours')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'hours'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Clock size={16} /> Heures d'etude
            </button>
            <button
              onClick={() => setActiveTab('simulations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'simulations'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Zap size={16} /> Simulations
            </button>
          </div>
        )}

        {/* الجدول */}
        {!selectedModule ? (
          <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
            <Users size={48} className="mx-auto text-slate-400 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Veuillez sélectionner un module pour afficher le classement.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-10 text-slate-500">Chargement du classement...</div>
        ) : rankingData.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
            <BookOpen size={48} className="mx-auto text-slate-400 mb-3" />
            <p className="text-slate-500 dark:text-slate-400">Aucune donnée disponible pour ce module.</p>
          </div>
        ) : activeTab === 'hours' ? (
          // جدول ساعات الدراسة
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium min-w-[120px]">Étudiant</th>
                    <th className="px-4 py-3 font-medium text-center">Heures d'étude</th>
                    <th className="px-4 py-3 font-medium text-center">Cours lus</th>
                    <th className="px-4 py-3 font-medium text-center">Examens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {rankingData.map((row, index) => (
                    <tr key={row.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{row.displayName}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600 dark:text-blue-400">
                        {row.totalHours ? row.totalHours.toFixed(1) : 0} h
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{row.lessonsReadInModule || 0}</td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{row.examsCompletedInModule || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // جدول Simulations
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium min-w-[120px]">Étudiant</th>
                    {simulations.map(sim => (
                      <th key={sim._id} className="px-4 py-3 font-medium text-center min-w-[80px]">
                        <div className="flex flex-col items-center">
                          <span className="text-xs">{sim.title || sim.year}</span>
                          <span className="text-[10px] text-slate-400">{sim.questions?.length || 0} Q</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 font-medium text-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                      Moyenne /20
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {rankingData.map((row, index) => (
                    <tr key={row.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{row.displayName}</td>
                      {simulations.map(sim => {
                        const score = row.simScores && row.simScores[sim._id] !== undefined ? row.simScores[sim._id] : null;
                        return (
                          <td key={sim._id} className="px-4 py-3 text-center">
                            {score !== null && score !== undefined ? (
                              <span className={`font-bold ${score >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {Math.round((score / 100) * 20 * 10) / 10} /20
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">/</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400">
                        {row.avgOn20 !== null && row.avgOn20 !== undefined ? `${row.avgOn20.toFixed(1)} /20` : '/'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Classement;