// StudentModuleDetail.jsx - مع تحديث customFiles محلياً واستبدال النسخة القديمة
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Video, BookOpen, Play, CheckCircle, X } from 'lucide-react';
import PdfAnnotatorModal from './PdfAnnotatorModal';
import VideoPlayerModal from './VideoPlayerModal';

function StudentModuleDetail() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?._id;

  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleImage, setModuleImage] = useState('');
  const [lessons, setLessons] = useState([]);
  const [exams, setExams] = useState([]);
  const [iaQuizzes, setIaQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLang, setSelectedLang] = useState('fr');
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const [qcmModal, setQcmModal] = useState({ open: false, type: null });
  const [pdfViewer, setPdfViewer] = useState(null);
  const [videoPlayer, setVideoPlayer] = useState(null);

  const [readLessons, setReadLessons] = useState([]);
  const [customFiles, setCustomFiles] = useState([]);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editingYear, setEditingYear] = useState(null);

  const [iaCourseQuizModal, setIaCourseQuizModal] = useState({ open: false, quizzes: [], title: '' });

  // ✅ دالة لضمان استخدام HTTPS للروابط
  const ensureHttps = (url) => {
    if (!url) return url;
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      if (!moduleId) {
        if (isMounted) {
          setError("Identifiant du module manquant.");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const baseUrl = 'https://reussite-qcmss-1nc7.onrender.com/api';
        const moduleUrl = `${baseUrl}/modules/${moduleId}`;
        const lessonsUrl = `${baseUrl}/lessons?moduleId=${moduleId}`;
        const examsUrl = `${baseUrl}/quizzes?moduleId=${moduleId}&type=module&isIA=false`;
        const iaUrl = `${baseUrl}/quizzes?moduleId=${moduleId}&isIA=true`;
        const statsUrl = userId ? `${baseUrl}/users/profile/stats?userId=${userId}` : null;

        const fetchPromises = [
          fetch(moduleUrl, { signal: abortController.signal }),
          fetch(lessonsUrl, { signal: abortController.signal }),
          fetch(examsUrl, { signal: abortController.signal }),
          fetch(iaUrl, { signal: abortController.signal }),
        ];
        if (statsUrl) {
          fetchPromises.push(fetch(statsUrl, { signal: abortController.signal }));
        }

        const responses = await Promise.all(fetchPromises);
        const [modRes, lesRes, examRes, iaRes, statsRes] = responses;

        if (!modRes.ok) throw new Error(`Erreur module: ${modRes.status}`);
        if (!lesRes.ok) throw new Error(`Erreur leçons: ${lesRes.status}`);
        if (!examRes.ok) throw new Error(`Erreur examens: ${examRes.status}`);
        if (!iaRes.ok) throw new Error(`Erreur IA: ${iaRes.status}`);
        if (statsUrl && statsRes && !statsRes.ok) {
          console.warn("⚠️ Erreur statistiques, on continue sans.");
        }

        const modData = await modRes.json();
        const lesData = await lesRes.json();
        const examData = await examRes.json();
        const iaData = await iaRes.json();

        if (isMounted) {
          setModuleTitle(modData.title || 'Module sans titre');
          setModuleImage(modData.imageUrl || '');
          setLessons(lesData.sort((a, b) => a.order - b.order));
          setExams(examData.filter(e => !e.isIA));
          setIaQuizzes(iaData);

          if (statsUrl && statsRes && statsRes.ok) {
            const statsData = await statsRes.json();
            const readLessonIds = (statsData.readLessons || [])
              .map(r => r.lessonId?._id?.toString() || r.lessonId?.toString())
              .filter(Boolean);
            setReadLessons(readLessonIds);
            // الحفاظ على ملف واحد لكل (lessonId, year) في حالة وجود تكرار
            const uniqueFiles = {};
            (statsData.customFiles || []).forEach(f => {
              const key = `${f.originalLessonId?.toString()}-${f.year}`;
              uniqueFiles[key] = f; // آخر ملف يبقى
            });
            setCustomFiles(Object.values(uniqueFiles));
          } else {
            setReadLessons([]);
            setCustomFiles([]);
          }

          setLoading(false);
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted) {
          console.error("❌ Erreur:", err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [moduleId, userId]);

  const isLessonRead = (lessonId) => readLessons.includes(lessonId);

  const toggleReadStatus = async (lessonId) => {
    if (!userId) return;
    const isRead = isLessonRead(lessonId);
    setReadLessons(prev => isRead ? prev.filter(id => id !== lessonId) : [...prev, lessonId]);

    try {
      const response = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/read/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur serveur");
      }
    } catch (error) {
      console.error("Erreur mise à jour lecture:", error);
      alert("❌ Erreur réseau ou serveur.");
      setReadLessons(prev => isRead ? [...prev, lessonId] : prev.filter(id => id !== lessonId));
    }
  };

  const getYearsForCategory = (category) => {
    const years = new Set();
    if (category === 'exams-year') {
      exams.forEach(e => years.add(e.year));
    } else if (category === 'exams-lesson') {
      lessons.forEach(lesson => {
        if (lesson.yearContents) {
          lesson.yearContents.forEach(yc => years.add(yc.year));
        }
      });
    } else {
      lessons.forEach(lesson => {
        (lesson.yearContents || []).forEach(yc => {
          const v = yc.versions.find(v => v.language === selectedLang);
          if (v) {
            let hasContent = false;
            if (category === 'cours') hasContent = v.pdf?.length > 0 || v.ai?.length > 0 || v.aiSummary?.length > 0;
            else if (category === 'resume') hasContent = v.summary?.length > 0;
            else if (category === 'video') hasContent = v.video?.length > 0;
            else if (category === 'td') hasContent = v.td?.length > 0 || v.correction?.length > 0;
            if (hasContent) years.add(yc.year);
          }
        });
      });
    }
    return Array.from(years);
  };

  const getLessonFilesAndExtras = (lesson, year) => {
    const yearContent = (lesson.yearContents || []).find(yc => yc.year === year);
    if (!yearContent) return { originalFiles: [], modifiedFiles: [], aiFiles: [], aiSummary: null, iaQuizzes: [] };
    const version = yearContent.versions.find(v => v.language === selectedLang);
    if (!version) return { originalFiles: [], modifiedFiles: [], aiFiles: [], aiSummary: null, iaQuizzes: [] };

    const originalFiles = (version.pdf || []).map(f => ({ url: ensureHttps(f.url), name: f.name || 'Cours', isModified: false }));
    // تصفية الملفات المعدلة للحصول على واحد فقط لكل (lesson, year)
    const modifiedFiles = (customFiles || [])
      .filter(f => f.originalLessonId?.toString() === lesson._id?.toString() && f.year === year)
      .map(f => ({ url: ensureHttps(f.fileUrl), name: 'Cours modifié', isModified: true }));

    const aiFiles = (version.ai || []).map(f => ({ url: ensureHttps(f.url), name: f.name || 'Cours IA' }));
    const aiSummary = version.aiSummary && version.aiSummary.length > 0 ? { url: ensureHttps(version.aiSummary[0].url), name: version.aiSummary[0].name || 'Résumé IA' } : null;
    const iaQuizzesForLesson = iaQuizzes.filter(q => q.type === 'lesson' && q.lessonId?._id?.toString() === lesson._id?.toString());

    return { originalFiles, modifiedFiles, aiFiles, aiSummary, iaQuizzes: iaQuizzesForLesson };
  };

  // تحديث customFiles محلياً واستبدال القديم بالجديد
  const handleModifiedSaved = (newUrl) => {
    const secureUrl = ensureHttps(newUrl);
    setCustomFiles(prev => {
      // حذف الملفات القديمة لنفس الدرس والسنة
      const filtered = prev.filter(f =>
        !(f.originalLessonId?.toString() === editingLessonId?.toString() && f.year === editingYear)
      );
      // إضافة الجديد
      const updated = [...filtered, { fileUrl: secureUrl, originalLessonId: editingLessonId, year: editingYear }];
      // تحديث الخادم بالقائمة الجديدة
      fetch('https://reussite-qcmss-1nc7.onrender.com/api/users/custom-files', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, customFiles: updated })
      }).catch(err => console.error('Erreur mise à jour customFiles sur serveur', err));
      return updated;
    });
    setEditingLessonId(null);
    setEditingYear(null);
  };

  const handleNavigateToQuiz = async (year, type) => {
    if (type === 'exams-year') {
      const exam = exams.find(e => e.year === year);
      if (exam) {
        navigate(`/quiz/exam/${exam._id}?type=module&title=${encodeURIComponent(exam.year)}`);
      } else alert("Examen introuvable.");
    } else if (type === 'exams-lesson') {
      const lessonWithQcm = lessons.find(lesson =>
        lesson.yearContents && lesson.yearContents.some(yc => yc.year === year)
      );
      if (lessonWithQcm) {
        const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/quizzes?lessonId=${lessonWithQcm._id}&type=lesson&isIA=false`);
        const data = await res.json();
        if (data.length > 0) {
          navigate(`/quiz/lesson/${data[0]._id}?type=lesson&title=${encodeURIComponent(lessonWithQcm.title)}`);
        } else alert("Aucun QCM disponible pour ce cours.");
      }
    }
  };

  const handleCategorySelect = (category) => {
    if (category === 'qcms') {
      setQcmModal({ open: true, type: null });
      return;
    }

    if (['cours', 'resume', 'video', 'td', 'exams-year', 'exams-lesson'].includes(category)) {
      setActiveCategory(category);
      setSelectedYear(null);
      setShowYearPicker(true);
      return;
    }

    setActiveCategory(category);
    setSelectedYear(null);
    setShowYearPicker(true);
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setShowYearPicker(false);
  };

  // ✅ دالة مفتوحة PDF مع HTTPS
  const openPdfViewer = (url, title, canAnnotate, canDownload, originalLessonId = null, year = null) => {
    const secureUrl = ensureHttps(url);
    setEditingLessonId(originalLessonId);
    setEditingYear(year);
    setPdfViewer({ url: secureUrl, title, canAnnotate, canDownload, originalLessonId, year });
  };

  const openIaCourseQuizzes = (lessonId) => {
    const quizzes = iaQuizzes.filter(q => q.type === 'lesson' && q.lessonId?._id?.toString() === lessonId);
    setIaCourseQuizModal({ open: true, quizzes, title: 'QCM IA' });
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Chargement du module...</div>;
  if (error) return (
    <div className="p-10 text-center">
      <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Erreur de chargement</h2>
      <p className="text-slate-700 dark:text-slate-300">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow">Réessayer</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 relative">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-3xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header et titre du module */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
          <Link to="/cours" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition">
            <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md">
              <ArrowLeft size={18} />
            </div>
          </Link>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
            <button onClick={() => setSelectedLang('fr')} className={`px-3 py-1 text-sm font-medium rounded-lg transition ${selectedLang === 'fr' ? 'bg-white dark:bg-slate-800 shadow text-blue-600' : 'text-slate-500'}`}>FR</button>
            <button onClick={() => setSelectedLang('en')} className={`px-3 py-1 text-sm font-medium rounded-lg transition ${selectedLang === 'en' ? 'bg-white dark:bg-slate-800 shadow text-blue-600' : 'text-slate-500'}`}>EN</button>
          </div>
          <div className="text-blue-600">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" /></svg>
          </div>
        </div>

        <div 
          className="relative p-6 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden min-h-[160px]"
          style={{
            backgroundColor: moduleImage ? 'transparent' : '#FDF4F2',
            backgroundImage: moduleImage ? `url(${ensureHttps(moduleImage)})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 bg-white/75 dark:bg-slate-800/75"></div>
          <h2 className="relative z-10 text-3xl font-bold text-slate-900 dark:text-white">{moduleTitle}</h2>
          <div className="relative z-10 w-32 h-32 flex-shrink-0">
            {moduleImage ? (
              <img src={ensureHttps(moduleImage)} alt={moduleTitle} className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg" />
            ) : (
              <div className="w-full h-full bg-cyan-100 rounded-full flex items-center justify-center text-cyan-700">
                <BookOpen size={48} />
              </div>
            )}
          </div>
        </div>

        {/* 5 boutons */}
        <h3 className="text-center text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-6 mb-4">LES CATÉGORIES :</h3>
        <div className="flex flex-wrap justify-center gap-1 sm:gap-2 px-4 pb-6">
          <button onClick={() => handleCategorySelect('cours')} className="flex-1 min-w-[60px] sm:min-w-[100px] flex flex-col items-center justify-center p-2 sm:p-4 bg-[#2EC4B6] text-white rounded-2xl shadow-sm hover:opacity-90 transition h-14 sm:h-20">
            <FileText size={16} className="mb-1 sm:mb-2" /> <span className="font-bold text-[10px] sm:text-xs text-center">COURS</span>
          </button>
          <button onClick={() => handleCategorySelect('resume')} className="flex-1 min-w-[60px] sm:min-w-[100px] flex flex-col items-center justify-center p-2 sm:p-4 bg-[#FF5A5F] text-white rounded-2xl shadow-sm hover:opacity-90 transition h-14 sm:h-20">
            <BookOpen size={16} className="mb-1 sm:mb-2" /> <span className="font-bold text-[10px] sm:text-xs text-center">RÉSUMÉS</span>
          </button>
          <button onClick={() => handleCategorySelect('td')} className="flex-1 min-w-[60px] sm:min-w-[100px] flex flex-col items-center justify-center p-2 sm:p-4 bg-[#1A3B66] text-white rounded-2xl shadow-sm hover:opacity-90 transition h-14 sm:h-20">
            <FileText size={16} className="mb-1 sm:mb-2" /> <span className="font-bold text-[10px] sm:text-xs text-center">TDs</span>
          </button>
          <button onClick={() => handleCategorySelect('qcms')} className="flex-1 min-w-[60px] sm:min-w-[100px] flex flex-col items-center justify-center p-2 sm:p-4 bg-[#FBA94D] text-white rounded-2xl shadow-sm hover:opacity-90 transition h-14 sm:h-20">
            <Play size={16} className="mb-1 sm:mb-2" /> <span className="font-bold text-[10px] sm:text-xs text-center">QCMS</span>
          </button>
          <button onClick={() => handleCategorySelect('video')} className="flex-1 min-w-[60px] sm:min-w-[100px] flex flex-col items-center justify-center p-2 sm:p-4 bg-[#6C63FF] text-white rounded-2xl shadow-sm hover:opacity-90 transition h-14 sm:h-20">
            <Video size={16} className="mb-1 sm:mb-2" /> <span className="font-bold text-[10px] sm:text-xs text-center">VIDÉO</span>
          </button>
        </div>

        {/* Modale choix année */}
        {showYearPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Choisir une année</h4>
                <button onClick={() => setShowYearPicker(false)} className="text-slate-500 hover:text-red-500"><X size={20} /></button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {(() => {
                  const yearsList = getYearsForCategory(activeCategory);
                  return yearsList.length > 0 ? yearsList.map(year => (
                    <button
                      key={year}
                      onClick={() => {
                        if (activeCategory === 'exams-year' || activeCategory === 'exams-lesson') {
                          handleNavigateToQuiz(year, activeCategory);
                          setShowYearPicker(false);
                        } else {
                          handleYearSelect(year);
                        }
                      }}
                      className="w-full text-left p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 transition bg-slate-50 dark:bg-slate-900"
                    >
                      <p className="font-medium text-slate-800 dark:text-white">{year}</p>
                    </button>
                  )) : <p className="text-center text-slate-500">Aucune année disponible</p>;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Modale choix QCM (hors IA) */}
        {qcmModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Choisir le type de QCM</h4>
                <button onClick={() => setQcmModal({ open: false, type: null })} className="text-slate-500 hover:text-red-500"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <button onClick={() => { setQcmModal({ open: false, type: null }); handleCategorySelect('exams-year'); }} className="w-full p-4 border border-orange-200 dark:border-orange-900/30 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-center">
                  <p className="font-bold text-orange-600 dark:text-orange-400">Examen par année</p>
                  <p className="text-xs text-slate-500">Examens généraux du module (hors IA)</p>
                </button>
                <button onClick={() => { setQcmModal({ open: false, type: null }); handleCategorySelect('exams-lesson'); }} className="w-full p-4 border border-green-200 dark:border-green-900/30 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-center">
                  <p className="font-bold text-green-600 dark:text-green-400">Examen par cours</p>
                  <p className="text-xs text-slate-500">QCMs propres à chaque leçon (hors IA)</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal QCM IA du cours */}
        {iaCourseQuizModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{iaCourseQuizModal.title}</h4>
                <button onClick={() => setIaCourseQuizModal({ open: false, quizzes: [], title: '' })} className="text-slate-500 hover:text-red-500"><X size={20} /></button>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {iaCourseQuizModal.quizzes.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Aucun QCM IA disponible pour ce cours.</p>
                ) : (
                  iaCourseQuizModal.quizzes.map((quiz) => (
                    <div key={quiz._id} className="flex items-center justify-between p-3 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{quiz.title || 'QCM IA'}</p>
                        <p className="text-xs text-slate-500">{quiz.questions?.length || 0} questions · {quiz.durationMinutes} min</p>
                      </div>
                      <button
                        onClick={() => {
                          setIaCourseQuizModal({ open: false, quizzes: [], title: '' });
                          navigate(`/quiz/lesson/${quiz._id}?type=lesson&title=${encodeURIComponent(quiz.title || 'QCM IA')}`);
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg shadow transition"
                      >
                        Démarrer
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Affichage du contenu selon la catégorie */}
        {activeCategory && (
          <div className="px-4 pb-8 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white border-b-2 border-blue-500 pb-1">
                {activeCategory === 'cours' ? 'COURS' :
                 activeCategory === 'resume' ? 'RÉSUMÉS' :
                 activeCategory === 'video' ? 'VIDÉOS' :
                 activeCategory === 'exams-year' ? 'EXAMENS PAR ANNÉE' :
                 activeCategory === 'exams-lesson' ? 'EXAMENS PAR COURS' :
                 activeCategory === 'td' ? 'TD' : ''}
                {selectedYear && ` - ${selectedYear}`}
              </h4>
              <button onClick={() => { setActiveCategory(null); setSelectedYear(null); }} className="text-xs text-red-500 hover:text-red-700">Fermer</button>
            </div>

            {/* ---- CATÉGORIE COURS (avec QCM IA) ---- */}
            {activeCategory === 'cours' && selectedYear && (
              <div className="space-y-4">
                {(() => {
                  const lessonsForYear = lessons.filter(lesson =>
                    lesson.yearContents && lesson.yearContents.some(yc => yc.year === selectedYear)
                  );
                  if (lessonsForYear.length === 0) return <p className="text-slate-400 text-center py-4">Aucun cours pour cette année.</p>;

                  return lessonsForYear.map((lesson) => {
                    const { originalFiles, modifiedFiles, aiFiles, aiSummary, iaQuizzes: lessonIaQuizzes } = getLessonFilesAndExtras(lesson, selectedYear);
                    
                    if (originalFiles.length === 0 && modifiedFiles.length === 0 && aiFiles.length === 0 && !aiSummary && lessonIaQuizzes.length === 0) return null;

                    return (
                      <div key={lesson._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-800 dark:text-white">{lesson.title}</h5>
                          <button
                            onClick={() => toggleReadStatus(lesson._id)}
                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition"
                            style={{ borderColor: isLessonRead(lesson._id) ? '#22C55E' : '#CBD5E1' }}
                          >
                            {isLessonRead(lesson._id) ? (
                              <CheckCircle size={20} className="text-green-500" />
                            ) : (
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            )}
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {/* الملفات الأصلية */}
                          {originalFiles.map((file, idx) => (
                            <button
                              key={idx}
                              onClick={() => openPdfViewer(file.url, file.name, true, true, lesson._id, selectedYear)}
                              className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition"
                            >
                              <FileText size={14} /> {file.name}
                            </button>
                          ))}

                          {/* الملفات المعدلة (نسخة واحدة فقط) */}
                          {modifiedFiles.map((file, idx) => (
                            <button
                              key={`mod-${idx}`}
                              onClick={() => openPdfViewer(file.url, file.name, true, true, lesson._id, selectedYear)}
                              className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition"
                            >
                              <FileText size={14} /> {file.name}
                            </button>
                          ))}

                          {/* Cours IA */}
                          {aiFiles.map((file, idx) => (
                            <button
                              key={`ai-${idx}`}
                              onClick={() => openPdfViewer(file.url, file.name, false, false, lesson._id, selectedYear)}
                              className="flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition"
                            >
                              <FileText size={14} /> {file.name}
                            </button>
                          ))}

                          {/* Résumé IA */}
                          {aiSummary && (
                            <button
                              onClick={() => openPdfViewer(aiSummary.url, aiSummary.name || 'Résumé IA', false, false, lesson._id, selectedYear)}
                              className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition"
                            >
                              <BookOpen size={14} /> Résumé IA
                            </button>
                          )}

                          {/* QCM IA — va directement à la liste des QCM IA de ce cours */}
                          <button
                            onClick={() => openIaCourseQuizzes(lesson._id)}
                            className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition"
                          >
                            <Play size={14} /> QCM IA
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* ---- RÉSUMÉS ---- */}
            {activeCategory === 'resume' && selectedYear && (
              <div className="space-y-3">
                {(() => {
                  const items = [];
                  lessons.forEach(lesson => {
                    const yearContent = (lesson.yearContents || []).find(yc => yc.year === selectedYear);
                    if (!yearContent) return;
                    const version = yearContent.versions.find(v => v.language === selectedLang);
                    if (!version || !version.summary || version.summary.length === 0) return;
                    items.push({ lesson, files: version.summary.map(f => ({ ...f, url: ensureHttps(f.url) })) });
                  });
                  if (items.length === 0) return <p className="text-slate-400 text-center py-4">Aucun résumé disponible.</p>;
                  return items.map(({ lesson, files }) => (
                    <div key={lesson._id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">{lesson.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {files.map((f, i) => (
                            <button
                              key={i}
                              onClick={() => openPdfViewer(f.url, f.name || 'Résumé', false, false, lesson._id, selectedYear)}
                              className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                            >
                              <FileText size={14} /> {f.name || 'Voir'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => toggleReadStatus(lesson._id)} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition" style={{ borderColor: isLessonRead(lesson._id) ? '#22C55E' : '#CBD5E1' }}>
                        {isLessonRead(lesson._id) ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-2 h-2 bg-gray-300 rounded-full"></div>}
                      </button>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* ---- VIDÉO ---- */}
            {activeCategory === 'video' && selectedYear && (
              <div className="space-y-3">
                {(() => {
                  const items = [];
                  lessons.forEach(lesson => {
                    const yearContent = (lesson.yearContents || []).find(yc => yc.year === selectedYear);
                    if (!yearContent) return;
                    const version = yearContent.versions.find(v => v.language === selectedLang);
                    if (!version || !version.video || version.video.length === 0) return;
                    items.push({ lesson, files: version.video.map(f => ({ ...f, url: ensureHttps(f.url) })) });
                  });
                  if (items.length === 0) return <p className="text-slate-400 text-center py-4">Aucune vidéo disponible.</p>;
                  return items.map(({ lesson, files }) => (
                    <div key={lesson._id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">{lesson.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {files.map((f, i) => (
                            <button key={i} onClick={() => setVideoPlayer({ url: f.url, title: f.name || lesson.title })} className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition">
                              <Video size={14} /> {f.name || 'Vidéo'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button onClick={() => toggleReadStatus(lesson._id)} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition" style={{ borderColor: isLessonRead(lesson._id) ? '#22C55E' : '#CBD5E1' }}>
                        {isLessonRead(lesson._id) ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-2 h-2 bg-gray-300 rounded-full"></div>}
                      </button>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* ---- TD ---- */}
            {activeCategory === 'td' && selectedYear && (
              <div className="space-y-3">
                {(() => {
                  const items = [];
                  lessons.forEach(lesson => {
                    const yearContent = (lesson.yearContents || []).find(yc => yc.year === selectedYear);
                    if (!yearContent) return;
                    const version = yearContent.versions.find(v => v.language === selectedLang);
                    if (!version) return;
                    const tdFiles = (version.td || []).map(f => ({ ...f, url: ensureHttps(f.url) }));
                    const correctionFiles = (version.correction || []).map(f => ({ ...f, url: ensureHttps(f.url) }));
                    const allFiles = [...tdFiles, ...correctionFiles];
                    if (allFiles.length === 0) return;
                    items.push({ lesson, files: allFiles, version });
                  });
                  if (items.length === 0) return <p className="text-slate-400 text-center py-4">Aucun TD ou correction disponible.</p>;
                  return items.map(({ lesson, files, version }) => (
                    <div key={lesson._id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">{lesson.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {files.map((f, i) => {
                            const isCorrection = version.correction && version.correction.some(c => c.url === f.url);
                            const label = isCorrection ? 'Correction' : 'TD';
                            return (
                              <button key={i} onClick={() => openPdfViewer(f.url, f.name || label, false, true, lesson._id, selectedYear)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition ${isCorrection ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                                <FileText size={14} /> {f.name || label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={() => toggleReadStatus(lesson._id)} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition" style={{ borderColor: isLessonRead(lesson._id) ? '#22C55E' : '#CBD5E1' }}>
                        {isLessonRead(lesson._id) ? <CheckCircle size={20} className="text-green-500" /> : <div className="w-2 h-2 bg-gray-300 rounded-full"></div>}
                      </button>
                    </div>
                  ));
                })()}
              </div>
            )}

            {(activeCategory === 'exams-year' || activeCategory === 'exams-lesson') && (
              <p className="text-slate-400 text-center py-4">Veuillez sélectionner une année dans la fenêtre précédente.</p>
            )}
          </div>
        )}
      </div>

      {pdfViewer && (
        <PdfAnnotatorModal
          fileUrl={pdfViewer.url}
          title={pdfViewer.title}
          userId={userId}
          originalLessonId={pdfViewer.originalLessonId}
          year={pdfViewer.year}
          canAnnotate={pdfViewer.canAnnotate}
          canDownload={pdfViewer.canDownload}
          onClose={() => setPdfViewer(null)}
          onModifiedSaved={handleModifiedSaved}
        />
      )}
      {videoPlayer && (
        <VideoPlayerModal
          url={videoPlayer.url}
          title={videoPlayer.title}
          onClose={() => setVideoPlayer(null)}
        />
      )}
    </div>
  );
}

export default StudentModuleDetail;