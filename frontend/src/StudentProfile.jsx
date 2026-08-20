// StudentProfile.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle, LogOut, Edit, Save, X,
  Heart, ListTodo, StickyNote, Calendar as CalendarIcon, FileText, Pencil, Trash2,
  MapPin, GraduationCap, Calendar, ArrowRight, Clock, Zap, Award, TrendingUp,
  ChevronDown, ChevronUp, Phone
} from 'lucide-react';

// --- Fonctions d'aide pour le calendrier ---
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const sameDay = (d1, d2) => d1 && d2 &&
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const formatDateNice = (date) => {
  return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
};

// ---------- Composant TodoCalendar ----------
const TodoCalendar = ({ todoList, onAdd, onToggle, onDelete, onEdit }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTaskText, setNewTaskText] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState('');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const todosWithIndex = todoList.map((t, i) => ({ ...t, _index: i }));
  const hasTasksOn = (date) => todosWithIndex.some(t => t.date && sameDay(new Date(t.date), date));
  const isToday = (date) => sameDay(date, new Date());
  const isSelected = (date) => sameDay(date, selectedDate);
  const tasksForSelected = todosWithIndex.filter(t => t.date && sameDay(new Date(t.date), selectedDate));

  const handleAdd = () => {
    if (!newTaskText.trim()) return;
    onAdd(selectedDate, newTaskText.trim());
    setNewTaskText('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-bold">‹</button>
          <p className="text-sm font-bold text-slate-800 dark:text-white">{MONTH_NAMES[month]} {year}</p>
          <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 font-bold">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1">{WEEKDAYS.map(w => <div key={w}>{w}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => (
            date ? (
              <button key={i} onClick={() => setSelectedDate(date)} className={`relative h-9 rounded-lg text-xs font-medium transition ${isSelected(date) ? 'bg-blue-600 text-white' : isToday(date) ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                {date.getDate()}
                {hasTasksOn(date) && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected(date) ? 'bg-white' : 'bg-blue-500'}`}></span>}
              </button>
            ) : <div key={i} />
          ))}
        </div>
        <button onClick={() => { setViewDate(new Date()); setSelectedDate(new Date()); }} className="mt-3 w-full text-xs text-blue-600 dark:text-blue-400 hover:underline">Aujourd'hui</button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-800 dark:text-white capitalize">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tasksForSelected.length >= 6 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>{tasksForSelected.length}/6</span>
        </div>

        {tasksForSelected.length >= 6 ? (
          <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 rounded-lg p-2.5 mb-4">Maximum de 6 tâches atteint pour ce jour. Supprimez-en une pour en ajouter une nouvelle.</p>
        ) : (
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Nouvelle tâche pour ce jour..." value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }} className="flex-1 p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow text-sm font-medium flex-shrink-0">Ajouter</button>
          </div>
        )}

        {tasksForSelected.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">Aucune tâche pour ce jour.</p>
        ) : (
          <div className="space-y-2">
            {tasksForSelected.map((task) => (
              <div key={task._index} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700 group">
                <input type="checkbox" checked={task.done || false} onChange={() => onToggle(task._index)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0 cursor-pointer" />
                {editingIndex === task._index ? (
                  <input type="text" autoFocus value={editingText} onChange={(e) => setEditingText(e.target.value)} onBlur={() => { onEdit(task._index, editingText); setEditingIndex(null); }} onKeyDown={(e) => { if (e.key === 'Enter') { onEdit(task._index, editingText); setEditingIndex(null); } }} className="flex-1 p-1 border rounded bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-white" />
                ) : (
                  <span onClick={() => { setEditingIndex(task._index); setEditingText(task.text); }} className={`flex-1 text-sm cursor-text ${task.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{task.text}</span>
                )}
                <button onClick={() => onDelete(task._index)} className="p-1 text-red-400 hover:text-red-600 transition flex-shrink-0 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Composant principal StudentProfile ----------
function StudentProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));

  const TARGET_ACADEMIC_YEAR = '2026-2027';

  // États pour les données du profil
  const [stats, setStats] = useState({
    progress: 0, completedExams: 0, completedLessonQCMs: 0,
    averageScore: 0, lessonsRead: 0, totalLessons: 0,
    quizNotes: [], favoriteLessons: [], favoriteQuizzes: [], todoList: [],
    completedQuizzes: [], readLessons: [],
    // nouveaux champs pour les questions
    favoriteQuestions: [],
    questionNotes: []
  });
  const [todoList, setTodoList] = useState([]);

  // États pour les données supplémentaires (cours, modules, QCMs)
  const [modules, setModules] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const extraFetched = useRef(false);

  const [periodStats, setPeriodStats] = useState({
    day: { exams: 0, avg: 0, lessons: 0, qcmLessons: 0, progress: 0 }
  });

  // États pour les notes
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');

  // États pour l'édition du profil
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: user?.username || '', phone: user?.phone || '', pseudo: user?.pseudo || '' });
  const [updating, setUpdating] = useState(false);

  // États pour afficher plus/moins dans le résumé
  const [showAllLessons, setShowAllLessons] = useState(false);
  const [showAllQuizzes, setShowAllQuizzes] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);

  // États pour l'affichage des favoris/questions
  const [favoriteQuestionsList, setFavoriteQuestionsList] = useState([]);
  const [questionNotesList, setQuestionNotesList] = useState([]);
  const [selectedQuizForFavorites, setSelectedQuizForFavorites] = useState(null);
  const [selectedQuizForNotes, setSelectedQuizForNotes] = useState(null);

  // ---------- Chargement des données principales ----------
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

        const fixedTodoList = (data.todoList || []).map(item => ({ ...item, date: item.date ? new Date(item.date) : null }));
        setStats(data);
        setTodoList(fixedTodoList);

        // Calcul des stats du jour
        const now = new Date();
        const completed = data.completedQuizzes || [];
        const readLessons = data.readLessons || [];

        const filteredExams = completed.filter(q => sameDay(new Date(q.date), now));
        const filteredLessons = readLessons.filter(l => sameDay(new Date(l.readAt), now));
        const examsCount = filteredExams.length;
        const lessonsCount = filteredLessons.length;
        const qcmLessonsCount = filteredExams.filter(q => q.type === 'lesson').length;
        const avg = examsCount > 0 ? Math.round(filteredExams.reduce((acc, q) => acc + (q.score || 0), 0) / examsCount) : 0;
        const totalLessons = data.totalLessons || 1;
        const progress = Math.round((lessonsCount / totalLessons) * 100);

        setPeriodStats({
          day: { exams: examsCount, avg, lessons: lessonsCount, qcmLessons: qcmLessonsCount, progress }
        });
      } catch (err) {
        console.error(err);
      }
    };

    fetchStats();
  }, [user, navigate]);

  // ---------- Chargement des données supplémentaires ----------
  useEffect(() => {
    if (!user || !user.year || extraFetched.current) return;
    extraFetched.current = true;

    const CACHE_KEY = `profile_extra_${user.year}`;
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
        setModules(cachedData.modules);
        setAllLessons(cachedData.allLessons);
        setAllQuizzes(cachedData.allQuizzes);
        return;
      }

      try {
        const modulesRes = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/modules?year=${user.year}`);
        const modulesData = await modulesRes.json();
        setModules(modulesData);

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
        console.error('Erreur chargement données supplémentaires:', err);
      }
    };

    fetchExtraData();
  }, [user]);

  // ---------- Charger les favoris et notes de questions ----------
  useEffect(() => {
    if (!user) return;
    const fetchQuestionData = async () => {
      try {
        const favRes = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/favorite-questions?userId=${user._id}`);
        if (favRes.ok) setFavoriteQuestionsList(await favRes.json());

        const notesRes = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/question-notes?userId=${user._id}`);
        if (notesRes.ok) setQuestionNotesList(await notesRes.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchQuestionData();
  }, [user]);

  // ---------- Fonctions pour le To-Do ----------
  const updateTodoLocalAndBackend = async (newList) => {
    setTodoList(newList);
    try {
      await fetch('https://reussite-qcmss-1nc7.onrender.com/api/users/todo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, todoList: newList })
      });
    } catch (e) { console.error(e); }
  };

  const toggleTodoDone = (index) => {
    const newList = [...todoList];
    newList[index] = { ...newList[index], done: !newList[index].done };
    updateTodoLocalAndBackend(newList);
  };

  const editTodoText = (index, newText) => {
    if (!newText.trim()) return;
    const newList = [...todoList];
    newList[index] = { ...newList[index], text: newText.trim() };
    updateTodoLocalAndBackend(newList);
  };

  const deleteTodo = (index) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;
    const newList = todoList.filter((_, i) => i !== index);
    updateTodoLocalAndBackend(newList);
  };

  const addTodoForDate = (date, text) => {
    const countForDate = todoList.filter(t => t.date && sameDay(new Date(t.date), date)).length;
    if (countForDate >= 6) { alert('Maximum 6 tâches par jour.'); return; }
    const newList = [...todoList, { text, done: false, date }];
    updateTodoLocalAndBackend(newList);
  };

  // ---------- Mise à jour du profil ----------
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch('https://reussite-qcmss-1nc7.onrender.com/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: user._id, username: formData.username, phone: formData.phone, pseudo: formData.pseudo })
      });
      if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.message || 'Erreur lors de la mise à jour.'); }
      const data = await res.json();
      const updatedUser = { ...user, username: data.username, phone: data.phone, pseudo: data.pseudo };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);
      alert('Profil mis à jour avec succès !');
    } catch (err) { alert(`Erreur : ${err.message}`); } finally { setUpdating(false); }
  };

  // ---------- Gestion des notes (anciennes) ----------
  const updateNote = async (quizId, newText) => {
    try {
      await fetch('https://reussite-qcmss-1nc7.onrender.com/api/users/quiz-note', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, quizId, noteText: newText })
      });
      setStats(prev => ({ ...prev, quizNotes: prev.quizNotes.map(n => n.quizId === quizId ? { ...n, noteText: newText } : n) }));
      setEditingNoteId(null);
    } catch (e) { alert('Erreur lors de la mise à jour de la note.'); }
  };

  const deleteNote = async (quizId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette note ?")) return;
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/quiz-note/${quizId}?userId=${user._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setStats(prev => ({ ...prev, quizNotes: prev.quizNotes.filter(n => n.quizId !== quizId) }));
    } catch (e) { alert('Erreur lors de la suppression.'); }
  };

  const handleLogout = () => { localStorage.clear(); navigate('/auth'); window.location.reload(); };

  // ---------- Fonctions utilitaires ----------
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
        const module = modules.find(m => m._id === moduleId);
        if (module) return module.title;
      }
    }
    if (quiz.moduleId) {
      const moduleId = quiz.moduleId._id || quiz.moduleId;
      const module = modules.find(m => m._id === moduleId);
      if (module) return module.title;
    }
    return 'Module inconnu';
  };

  const getModuleNameFromNote = (note) => {
    if (!note) return 'Module inconnu';
    if (note.moduleId && typeof note.moduleId === 'object' && note.moduleId.title) {
      return note.moduleId.title;
    }
    if (note.quizId) {
      const quizId = note.quizId._id || note.quizId;
      const quiz = allQuizzes.find(q => q._id === quizId);
      if (quiz) {
        return getModuleNameFromQuiz(quiz);
      }
    }
    return 'Module inconnu';
  };

  // --- Helper to get module title from a quiz object (populated or not) ---
  const getModuleTitle = (quiz) => {
    if (!quiz) return 'Module inconnu';
    if (quiz.moduleId && typeof quiz.moduleId === 'object' && quiz.moduleId.title) {
      return quiz.moduleId.title;
    }
    // Try to find module from allModules
    if (quiz.moduleId) {
      const mod = modules.find(m => m._id === (quiz.moduleId._id || quiz.moduleId));
      return mod?.title || 'Module inconnu';
    }
    return 'Module inconnu';
  };

  // ---------- حساب الحالات باستخدام useMemo ----------
  const readLessonIds = useMemo(() => {
    return stats.readLessons.map(r => r.lessonId?._id?.toString() || r.lessonId?.toString()).filter(Boolean);
  }, [stats.readLessons]);

  const completedQuizIds = useMemo(() => {
    return stats.completedQuizzes.map(q => q.quizId?._id?.toString() || q.quizId?.toString()).filter(Boolean);
  }, [stats.completedQuizzes]);

  // ... (reste du code inchangé pour moduleProgress, etc.)

  // On garde le même code pour moduleProgress, lessonStatus, quizStatus, unreadLessons, incompleteModules, unresolvedQuizzes.
  // Je vais réutiliser le code existant que vous aviez, je ne le répète pas pour économiser l'espace, mais il reste identique.

  // Pour la démonstration, je vais inclure seulement la partie modifiée pour l'affichage des favoris et notes.
  // Vous devez conserver tout le reste de votre code de calcul.

  // ...

  // ---------- JSX ----------
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* --- Profile card, Todo, etc. (inchangé) --- */}
        {/* ... */}

        {/* ---------- Mes Favoris QCM (modifié) ---------- */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4"><Heart size={20} className="text-red-500" /><h3 className="text-xl font-bold text-slate-900 dark:text-white">Mes Favoris QCM</h3></div>
          {favoriteQuestionsList.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">Aucune question en favori pour le moment.</p>
          ) : (
            (() => {
              const groups = {};
              favoriteQuestionsList.forEach((item) => {
                const moduleName = getModuleTitle(item); // item.quizId?._doc?.moduleId? etc.
                const key = moduleName + (item.year ? ` (${item.year})` : '');
                if (!groups[key]) groups[key] = { title: key, items: [] };
                groups[key].items.push(item);
              });
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.values(groups).map((group, gIdx) => (
                    <div key={gIdx} className="bg-red-50 dark:bg-slate-800 rounded-xl shadow border border-red-100 dark:border-slate-700 p-4">
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-3">{group.title}</h4>
                      <div className="space-y-2">
                        {group.items.map((item, i) => {
                          const question = item.question;
                          const quiz = item; // contains quizId, etc.
                          return (
                            <div key={i} className="bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-red-100 dark:border-slate-700">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Question {item.questionIndex + 1}: {question?.questionText || 'Sans texte'}
                              </p>
                              <div className="mt-1 text-xs text-slate-500">
                                <p>Options: {question?.options?.join(' • ')}</p>
                                {question?.correctAnswer && <p className="text-green-600">✅ Réponse correcte: {question.correctAnswer}</p>}
                                {!question?.correctAnswer && <p className="text-orange-500">⚠️ Aucune réponse correcte définie.</p>}
                              </div>
                              <button
                                onClick={() => setSelectedQuizForFavorites(item)}
                                className="mt-2 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg shadow transition"
                              >
                                Aller au QCM →
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>

        {/* ---------- Mes Notes QCM (modifié) ---------- */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4"><StickyNote size={20} className="text-purple-500" /><h3 className="text-xl font-bold text-slate-900 dark:text-white">Mes Notes (par question)</h3></div>
          {questionNotesList.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">Vous n'avez pas encore enregistré de notes sur des questions.</p>
          ) : (
            (() => {
              const groups = {};
              questionNotesList.forEach((item) => {
                const moduleName = getModuleTitle(item);
                const key = moduleName + (item.year ? ` (${item.year})` : '');
                if (!groups[key]) groups[key] = { title: key, items: [] };
                groups[key].items.push(item);
              });
              return (
                <div className="space-y-3">
                  {Object.values(groups).map((group, gIdx) => (
                    <div key={gIdx} className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition">
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{group.title}</h4>
                      <div className="space-y-2">
                        {group.items.map((item, i) => {
                          const question = item.question;
                          return (
                            <div key={i} className="border-b border-slate-200 dark:border-slate-700 pb-2 last:border-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                Question {item.questionIndex + 1}: {question?.questionText || 'Sans texte'}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">📝 {item.noteText}</p>
                              <button
                                onClick={() => setSelectedQuizForNotes(item)}
                                className="mt-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg shadow transition"
                              >
                                Voir le QCM →
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>

        {/* --- Modal pour afficher toutes les questions d'un quiz (pour favoris) --- */}
        {selectedQuizForFavorites && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {getModuleTitle(selectedQuizForFavorites)} - {selectedQuizForFavorites.year}
                </h3>
                <button onClick={() => setSelectedQuizForFavorites(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                {selectedQuizForFavorites.quizId?.questions?.map((q, idx) => {
                  const isFav = favoriteQuestionsList.some(f => f.quizId === selectedQuizForFavorites.quizId && f.questionIndex === idx);
                  return (
                    <div key={idx} className={`p-4 border rounded-lg ${isFav ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}>
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-slate-800 dark:text-white">Question {idx+1}: {q.questionText}</p>
                        {isFav && <Heart size={16} className="text-red-500 fill-current" />}
                      </div>
                      <div className="mt-2 space-y-1">
                        {q.options?.map((opt, oi) => (
                          <div key={oi} className={`p-1 rounded ${q.correctAnswer === opt ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : ''}`}>
                            {opt} {q.correctAnswer === opt && '✅'}
                          </div>
                        ))}
                      </div>
                      {!q.correctAnswer && <p className="text-orange-500 text-xs mt-1">Aucune réponse correcte définie.</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- Modal pour les notes (similaire) --- */}
        {selectedQuizForNotes && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {getModuleTitle(selectedQuizForNotes)} - {selectedQuizForNotes.year}
                </h3>
                <button onClick={() => setSelectedQuizForNotes(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X size={24} /></button>
              </div>
              <div className="space-y-6">
                {selectedQuizForNotes.quizId?.questions?.map((q, idx) => {
                  const note = questionNotesList.find(n => n.quizId === selectedQuizForNotes.quizId && n.questionIndex === idx);
                  return (
                    <div key={idx} className={`p-4 border rounded-lg ${note ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'}`}>
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-slate-800 dark:text-white">Question {idx+1}: {q.questionText}</p>
                        {note && <StickyNote size={16} className="text-purple-500" />}
                      </div>
                      <div className="mt-2 space-y-1">
                        {q.options?.map((opt, oi) => (
                          <div key={oi} className={`p-1 rounded ${q.correctAnswer === opt ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : ''}`}>
                            {opt} {q.correctAnswer === opt && '✅'}
                          </div>
                        ))}
                      </div>
                      {note && <p className="mt-2 text-sm text-purple-700 dark:text-purple-400">📝 {note.noteText}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentProfile;
