import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function StudentCourseView() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const studentYear = user?.year || '1ère Année';
  const [semester, setSemester] = useState('Semestre 1');

  const CACHE_EXPIRY = 5 * 60 * 1000; // 5 دقائق

  const loadFromCache = (year, sem) => {
    try {
      const cached = localStorage.getItem(`course_modules_${year}_${sem}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) return data;
      }
    } catch (e) {}
    return null;
  };

  const saveToCache = (year, sem, data) => {
    try {
      localStorage.setItem(`course_modules_${year}_${sem}`, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {}
  };

  // ✅ نبداو مباشرة بالمحتوى المخزن (إذا موجود) بدل شاشة "Chargement..." فارغة
  const [modules, setModules] = useState(() => loadFromCache(studentYear, semester) || []);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(() => !!loadFromCache(studentYear, semester));

  useEffect(() => {
    // ✅ كي تتبدل السنة/السوماستر، نبينو المخزن ديالهم فورًا (إذا كاين) بلا ننتظرو
    const cached = loadFromCache(studentYear, semester);
    if (cached) {
      setModules(cached);
      setHasFetchedOnce(true);
    }

    const fetchModules = async () => {
      try {
        const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/modules?year=${studentYear}&semester=${semester}`);
        const data = await res.json();
        setModules(data);
        saveToCache(studentYear, semester, data);
      } catch (err) {
        console.error(err);
      } finally {
        setHasFetchedOnce(true);
      }
    };
    fetchModules();
  }, [studentYear, semester]);

  if (!user) return <div className="p-10 text-center text-slate-500">Veuillez vous connecter.</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mes Cours ({studentYear})</h1>
            <p className="text-slate-500 dark:text-slate-400">Sélectionne un module pour accéder aux cours.</p>
          </div>
        </div>

        {/* ✅ تعديل عرض الحاوية ليكون w-full sm:max-w-xs */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-wrap items-end gap-4 w-full sm:max-w-xs">
          <div className="w-full">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Semestre</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Semestre 1">Semestre 1</option>
              <option value="Semestre 2">Semestre 2</option>
            </select>
          </div>
        </div>

        {modules.length === 0 ? (
          hasFetchedOnce ? (
            <div className="text-center text-slate-500 py-10 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              Aucun module trouvé pour votre année et le semestre sélectionnés.
            </div>
          ) : null /* ✅ أول تحميل بلا cache: ما نبينوش رسالة "فارغ" وقتاش لازال الجلب جاري */
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <div key={mod._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-slate-700 overflow-hidden hover:shadow-lg transition duration-300 group">
                <div className="h-24 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
                  {mod.imageUrl && <img src={mod.imageUrl} alt={mod.title} className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/20"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-blue-600 transition">{mod.title}</h4>
                    <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">{mod.semester}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{mod.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-end gap-2">
                    <button
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-lg transition shadow-md shadow-blue-600/30"
                      onClick={() => navigate(`/cours/module/${mod._id}`)}
                    >
                      Accéder →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentCourseView;
