import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Play, Calendar, BookOpen, BarChart2, Trophy } from 'lucide-react';

function StudentSimulation() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const studentYear = user?.year || '1ère Année';
  const [semester, setSemester] = useState('Semestre 1');
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [completedQuizIds, setCompletedQuizIds] = useState([]);
  
  const [rankings, setRankings] = useState({});
  const [selectedRankingQuiz, setSelectedRankingQuiz] = useState(null);

  // جلب الوحدات
  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/modules?year=${studentYear}&semester=${semester}`);
        const data = await res.json();
        setModules(data);
        setSelectedModule(null);
        setSimulations([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [studentYear, semester]);

  // جلب الامتحانات المكتملة للمستخدم
  useEffect(() => {
    if (!user) return;
    const fetchCompleted = async () => {
      try {
        const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/profile/stats?userId=${user._id}`);
        const data = await res.json();
        const completedIds = (data.completedQuizzes || []).map(q => String(q.quizId?._id || q.quizId));
        setCompletedQuizIds(completedIds);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCompleted();
  }, [user]);

  // اختيار وحدة وعرض محاكياتها
  const handleSelectModule = async (moduleId) => {
    setLoading(true);
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/quizzes?moduleId=${moduleId}&type=simulation`);
      const data = await res.json();
      setSimulations(data);
      setSelectedModule(moduleId);
      setRankings({});
      setSelectedRankingQuiz(null);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement des simulations.');
    } finally {
      setLoading(false);
    }
  };

  // جلب الترتيب (Modal)
  const fetchRanking = async (quizId) => {
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/quizzes/${quizId}/ranking`);
      const data = await res.json();
      setRankings(prev => ({ ...prev, [quizId]: data }));
      setSelectedRankingQuiz(quizId);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement du classement.');
    }
  };

  // بدء الامتحان (للمرة الأولى فقط)
  const handleStartSimulation = (quizId, quizTitle) => {
    navigate(`/quiz/exam/${quizId}?type=module&title=${encodeURIComponent('Simulation - ' + quizTitle)}`);
  };

  if (!user) return <div className="p-10 text-center text-slate-500">Veuillez vous connecter.</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 sm:mb-6">Simulations</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm sm:text-base">Entraînez-vous avec des examens chronométrés.</p>

        {/* فلترة السوماستر */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Semestre</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="Semestre 1">Semestre 1</option>
              <option value="Semestre 2">Semestre 2</option>
            </select>
          </div>
        </div>

        {/* عرض الوحدات */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" /> Choisir une unité
          </h2>
          {loading ? (
            <p className="text-slate-500">Chargement des unités...</p>
          ) : modules.length === 0 ? (
            <p className="text-slate-500">Aucune unité trouvée.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {modules.map(mod => (
                <button key={mod._id} onClick={() => handleSelectModule(mod._id)} className={`text-left p-4 border-2 rounded-xl transition hover:shadow-md ${selectedModule === mod._id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400'}`}>
                  <p className="font-bold text-slate-800 dark:text-white">{mod.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{mod.description?.substring(0, 40)}...</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* عرض المحاكيات الخاصة بالوحدة */}
        {selectedModule && (
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-orange-600 dark:text-orange-400 flex-shrink-0" /> Simulations disponibles
            </h2>
            {loading ? (
              <p className="text-slate-500">Chargement...</p>
            ) : simulations.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-8 text-center border border-dashed border-slate-300 dark:border-slate-600">
                <Clock size={40} className="mx-auto text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Aucune simulation disponible.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {simulations.map(sim => {
                  // ✅ التأكد من حالة الإكمال بدقة
                  const isCompleted = completedQuizIds.includes(String(sim._id));
                  
                  return (
                    // ✅ تمت إزالة أي معالج ضغط (onClick) من البطاقة نفسها
                    // الضغط على البطاقة لن يفعل شيئاً، فقط الأزرار الداخلية تعمل
                    <div 
                      key={sim._id} 
                      className={`bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow border ${isCompleted ? 'border-green-200 dark:border-green-900/30' : 'border-orange-200 dark:border-orange-900/20'} hover:shadow-lg transition`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="min-w-0">
                          <h4 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white truncate">{sim.title || `Simulation ${sim.year}`}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{sim.questions?.length || 0} Questions • {sim.durationMinutes} min</p>
                          <p className="text-xs text-slate-400 mt-1">Auteur : {sim.authorName || 'Inconnu'}</p>
                          {isCompleted && <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">✅ Terminé</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {isCompleted ? (
                          <>
                            {/* ✅ عرض التصحيح مباشرة (بدل إعادة الامتحان) */}
                            <button 
                              onClick={() => handleStartSimulation(sim._id, sim.title || sim.year)} 
                              className="w-full py-2 bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-xl transition text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <Play size={16} /> Voir la correction
                            </button>
                            <button 
                              onClick={() => fetchRanking(sim._id)} 
                              className="w-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl transition text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <BarChart2 size={16} /> Voir le classement
                            </button>
                          </>
                        ) : (
                          // ✅ زر "Démarrer" يظهر فقط إذا لم يكتمل الامتحان
                          <button 
                            onClick={() => handleStartSimulation(sim._id, sim.title || sim.year)} 
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow flex items-center justify-center gap-2 text-sm font-medium transition"
                          >
                            <Play size={16} /> Démarrer la simulation
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* عرض الترتيب داخل نافذة منبثقة (لا تغادر الصفحة) */}
        {selectedRankingQuiz && rankings[selectedRankingQuiz] && (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Trophy size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Classement des étudiants</h3>
              <button onClick={() => setSelectedRankingQuiz(null)} className="ml-auto text-sm text-red-500 hover:text-red-700">Fermer</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankings[selectedRankingQuiz].map((student, index) => {
                const initial = student.username ? student.username.charAt(0).toUpperCase() : '?';
                let medalClass = "bg-slate-100 text-slate-600";
                let icon = null;
                if (index === 0) { medalClass = "bg-yellow-400 text-white"; icon = "🥇"; }
                else if (index === 1) { medalClass = "bg-gray-300 text-white"; icon = "🥈"; }
                else if (index === 2) { medalClass = "bg-orange-400 text-white"; icon = "🥉"; }
                
                return (
                  <div key={student.userId} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition">
                    <div className="flex-shrink-0">
                      {icon ? <span className="text-2xl">{icon}</span> : <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${medalClass}`}>{index + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{initial}</div>
                        <div className="truncate">
                          <p className="font-medium text-slate-800 dark:text-white truncate">{student.username}{student.pseudo && <span className="text-blue-600 text-xs ml-1">(@{student.pseudo})</span>}</p>
                          <p className="text-xs text-slate-500">{student.year || 'Année inconnue'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right"><p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{student.score}%</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentSimulation;