// AdminModuleContent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Video, BookOpen, Trash2, Clock, Calendar, Edit, X, ImagePlus, CheckCircle } from 'lucide-react';

// Génération des années
const generateYears = () => {
  const years = [];
  for (let i = 2011; i <= 2028; i++) {
    years.push(`${i}-${i+1}`);
  }
  return years;
};
const ALL_YEARS = generateYears();

const INPUT_CLASS = "p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition";

// ---------- Composant FileList ----------
const FileList = ({ items, onRemove, onRename }) => {
  return items.length > 0 ? (
    <ul className="mt-1 space-y-1">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 px-2 py-1 rounded">
          <span className="truncate text-sm">{item.name || 'Sans nom'}</span>
          <div className="flex gap-1 flex-shrink-0">
            <button type="button" onClick={() => onRename(idx)} className="text-blue-500 hover:text-blue-700 text-xs" title="Renommer">✏️</button>
            <button type="button" onClick={() => onRemove(idx)} className="text-red-500 hover:text-red-700 text-xs" title="Supprimer">✕</button>
          </div>
        </li>
      ))}
    </ul>
  ) : null;
};

// ---------- YearFilesBlock ----------
const YearFilesBlock = ({ year, versions, onAddFiles, onRemoveFile, onRenameFile }) => {
  return (
    <div className="border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 bg-blue-50/60 dark:bg-slate-900/40">
      <h5 className="font-bold text-sm mb-3 text-blue-700 dark:text-blue-400">📅 Contenu pour {year}</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {versions.map((version, vIndex) => (
          <div key={version.language} className="p-3 border rounded bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <h6 className="font-bold text-xs mb-2 text-slate-700 dark:text-slate-300">
              {version.language === 'fr' ? 'Français 🇫🇷' : 'English 🇬🇧'}
            </h6>
            <div className="space-y-3 text-xs">
              {/* PDF */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">PDF du cours</label>
                <input type="file" accept=".pdf" multiple className="w-full text-xs" onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length) onAddFiles(vIndex, 'pdf', files);
                  e.target.value = '';
                }} />
                <FileList
                  items={version.pdf || []}
                  onRemove={(idx) => onRemoveFile(vIndex, 'pdf', idx)}
                  onRename={(idx) => onRenameFile(vIndex, 'pdf', idx)}
                />
              </div>
              {/* Vidéo */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Vidéo</label>
                <input type="file" accept="video/*" multiple className="w-full text-xs" onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length) onAddFiles(vIndex, 'video', files);
                  e.target.value = '';
                }} />
                <FileList
                  items={version.video || []}
                  onRemove={(idx) => onRemoveFile(vIndex, 'video', idx)}
                  onRename={(idx) => onRenameFile(vIndex, 'video', idx)}
                />
              </div>
              {/* Résumé */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Résumé</label>
                <input type="file" accept=".pdf" multiple className="w-full text-xs" onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length) onAddFiles(vIndex, 'summary', files);
                  e.target.value = '';
                }} />
                <FileList
                  items={version.summary || []}
                  onRemove={(idx) => onRemoveFile(vIndex, 'summary', idx)}
                  onRename={(idx) => onRenameFile(vIndex, 'summary', idx)}
                />
              </div>
              {/* TD */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">TD</label>
                <input type="file" accept=".pdf" multiple className="w-full text-xs" onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length) onAddFiles(vIndex, 'td', files);
                  e.target.value = '';
                }} />
                <FileList
                  items={version.td || []}
                  onRemove={(idx) => onRemoveFile(vIndex, 'td', idx)}
                  onRename={(idx) => onRenameFile(vIndex, 'td', idx)}
                />
              </div>
              {/* Correction TD */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Correction TD</label>
                <input type="file" accept=".pdf" multiple className="w-full text-xs" onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length) onAddFiles(vIndex, 'correction', files);
                  e.target.value = '';
                }} />
                <FileList
                  items={version.correction || []}
                  onRemove={(idx) => onRemoveFile(vIndex, 'correction', idx)}
                  onRename={(idx) => onRenameFile(vIndex, 'correction', idx)}
                />
              </div>
              {/* Autres */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Autres sources</label>
                <input type="file" multiple className="w-full text-xs" onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length) onAddFiles(vIndex, 'other', files);
                  e.target.value = '';
                }} />
                <FileList
                  items={version.other || []}
                  onRemove={(idx) => onRemoveFile(vIndex, 'other', idx)}
                  onRename={(idx) => onRenameFile(vIndex, 'other', idx)}
                />
              </div>
              {/* Cours IA */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Cours IA</label>
                <input type="file" multiple className="w-full text-xs" onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length) onAddFiles(vIndex, 'ai', files);
                  e.target.value = '';
                }} />
                <FileList
                  items={version.ai || []}
                  onRemove={(idx) => onRemoveFile(vIndex, 'ai', idx)}
                  onRename={(idx) => onRenameFile(vIndex, 'ai', idx)}
                />
              </div>
              {/* Résumé IA */}
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1">Résumé IA</label>
                <input type="file" accept=".pdf" multiple className="w-full text-xs" onChange={(e) => {
                  const files = Array.from(e.target.files);
                  if (files.length) onAddFiles(vIndex, 'aiSummary', files);
                  e.target.value = '';
                }} />
                <FileList
                  items={version.aiSummary || []}
                  onRemove={(idx) => onRemoveFile(vIndex, 'aiSummary', idx)}
                  onRename={(idx) => onRenameFile(vIndex, 'aiSummary', idx)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- QuestionsBuilder ----------
const emptyQuestion = () => ({
  questionText: '',
  options: ['', ''],
  correctAnswer: '',
  explanation: '',
  explanationImages: []
});

const QuestionsBuilder = ({ questions, onChange, uploadFile }) => {
  const updateQuestion = (qIndex, field, value) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], [field]: value };
    onChange(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    const oldVal = updated[qIndex].options[oIndex];
    const options = [...updated[qIndex].options];
    options[oIndex] = value;
    const correctAnswer = updated[qIndex].correctAnswer === oldVal ? value : updated[qIndex].correctAnswer;
    updated[qIndex] = { ...updated[qIndex], options, correctAnswer };
    onChange(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], options: [...updated[qIndex].options, ''] };
    onChange(updated);
  };

  const removeOption = (qIndex, oIndex) => {
    const updated = [...questions];
    const removedVal = updated[qIndex].options[oIndex];
    const options = updated[qIndex].options.filter((_, i) => i !== oIndex);
    const correctAnswer = updated[qIndex].correctAnswer === removedVal ? '' : updated[qIndex].correctAnswer;
    updated[qIndex] = { ...updated[qIndex], options, correctAnswer };
    onChange(updated);
  };

  const addQuestion = () => onChange([...questions, emptyQuestion()]);
  const removeQuestion = (qIndex) => onChange(questions.filter((_, i) => i !== qIndex));

  const addExplanationImages = async (qIndex, files) => {
    const urls = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (url) urls.push(url);
    }
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], explanationImages: [...(updated[qIndex].explanationImages || []), ...urls] };
    onChange(updated);
  };

  const removeExplanationImage = (qIndex, url) => {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], explanationImages: updated[qIndex].explanationImages.filter(u => u !== url) };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">Total : <span className="font-bold text-blue-600 dark:text-blue-400">{questions.length}</span> question(s)</span>
      </div>
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 bg-blue-50/60 dark:bg-slate-900/40">
          <div className="flex items-center justify-between mb-2">
            <h6 className="font-bold text-sm text-blue-700 dark:text-blue-400">Question {qIndex + 1}</h6>
            {questions.length > 1 && (
              <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700 text-xs">✕ Supprimer</button>
            )}
          </div>
          <textarea
            placeholder="Texte de la question"
            required
            rows="2"
            className={`w-full mb-3 text-sm ${INPUT_CLASS}`}
            value={q.questionText}
            onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Coche la bonne réponse :</p>
          <div className="space-y-2 mb-3">
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={q.correctAnswer !== '' && q.correctAnswer === opt}
                  onChange={() => updateQuestion(qIndex, 'correctAnswer', opt)}
                  className="flex-shrink-0"
                />
                <input
                  type="text"
                  placeholder={`Option ${oIndex + 1}`}
                  required
                  className={`flex-1 text-sm ${INPUT_CLASS}`}
                  value={opt}
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                />
                {q.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="text-red-500 hover:text-red-700 text-xs flex-shrink-0">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addOption(qIndex)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ Ajouter une option</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Explication (Optionnel)</label>
            <textarea
              rows="2"
              placeholder="Explique pourquoi cette réponse est correcte..."
              className={`w-full mb-2 text-sm ${INPUT_CLASS}`}
              value={q.explanation}
              onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
            />
            <label className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              <ImagePlus size={14} /> Images d'explication
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              className="w-full text-xs text-slate-700 dark:text-slate-300"
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length) addExplanationImages(qIndex, files);
                e.target.value = '';
              }}
            />
            {(q.explanationImages || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {q.explanationImages.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`explication ${i + 1}`} className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-slate-600" />
                    <button type="button" onClick={() => removeExplanationImage(qIndex, url)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center leading-none">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addQuestion}
        className="w-full py-2.5 border-2 border-dashed border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
      >
        + Ajouter une question
      </button>
    </div>
  );
};

// ---------- JsonImportBox ----------
const JsonImportBox = ({ onImport }) => {
  const [showBox, setShowBox] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  const handleImport = () => {
    setError('');
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      setError('JSON invalide.');
      return;
    }

    let allQuestions = [];
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].questions) {
      for (const yearBlock of parsed) {
        if (!Array.isArray(yearBlock.questions)) continue;
        for (const q of yearBlock.questions) {
          let correct = '';
          if (q.correctAnswers && Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0 && q.correctAnswers[0] !== '') {
            correct = q.correctAnswers[0];
          } else if (q.correctAnswer && q.correctAnswer !== '') {
            correct = q.correctAnswer;
          }
          if (q.question && Array.isArray(q.options) && correct !== '') {
            const images = Array.isArray(q.photo) ? q.photo : (q.photo ? [q.photo] : []);
            allQuestions.push({
              questionText: q.question,
              options: [...q.options],
              correctAnswer: correct,
              explanation: q.solutionText || '',
              explanationImages: images
            });
          }
        }
      }
    } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
      for (const q of parsed) {
        let correct = '';
        if (q.correctAnswers && Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0 && q.correctAnswers[0] !== '') {
          correct = q.correctAnswers[0];
        } else if (q.correctAnswer && q.correctAnswer !== '') {
          correct = q.correctAnswer;
        }
        if (q.question && Array.isArray(q.options) && correct !== '') {
          const images = Array.isArray(q.photo) ? q.photo : (q.photo ? [q.photo] : []);
          allQuestions.push({
            questionText: q.question,
            options: [...q.options],
            correctAnswer: correct,
            explanation: q.solutionText || q.explanation || '',
            explanationImages: images
          });
        }
      }
    } else {
      setError('Format JSON invalide.');
      return;
    }

    if (allQuestions.length === 0) {
      setError('Aucune question valide.');
      return;
    }

    setQuestionCount(allQuestions.length);
    setShowBox(false);
    setJsonText('');
    onImport(allQuestions);
  };

  return (
    <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4">
      <button type="button" onClick={() => setShowBox(!showBox)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
        {showBox ? '▲ Fermer l\'import JSON' : '▼ Importer des questions via JSON'}
      </button>
      {showBox && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Colle un tableau JSON (questions ou années).</p>
          <textarea rows="8" className={`w-full text-xs font-mono ${INPUT_CLASS}`} placeholder='[{ "question": "...", "options": ["A", "B"], "correctAnswer": "A" }]' value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          {questionCount > 0 && !error && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle size={14} /> {questionCount} question(s) importée(s).
            </p>
          )}
          <button type="button" onClick={handleImport} className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm rounded-lg shadow">Importer</button>
        </div>
      )}
    </div>
  );
};

// ---------- QuizModal (avec isIA) ----------
const blankQuiz = (type) => ({
  _id: null,
  type,
  year: ALL_YEARS[0],
  durationMinutes: 20,
  authorName: '',
  correctionMode: type === 'lesson' ? 'immediate' : 'deferred',
  questions: [emptyQuestion()],
  isIA: false
});

const QuizModal = ({ isOpen, onClose, type, targetId, targetLabel, uploadFile, moduleIdProp }) => {
  const [view, setView] = useState('list');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  // ✅ الدالة المصححة - بدون علامة اقتباس زائدة
  const fetchQuizzes = async () => {
    if (!targetId) {
      setQuizzes([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      let url;
      if (type === 'lesson') {
        url = `https://reussite-qcms.onrender.com/api/quizzes?lessonId=${targetId}`;
      } else {
        url = `https://reussite-qcms.onrender.com/api/quizzes?moduleId=${targetId}&type=module`;
      }
      
      console.log('🔍 Fetching quizzes:', url);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        console.error(`❌ Server responded with ${res.status}`);
        setQuizzes([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      setQuizzes(data);
    } catch (err) {
      console.error('❌ Network error:', err);
      setQuizzes([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      setView('list');
      fetchQuizzes();
    }
  }, [isOpen, targetId, type]);

  if (!isOpen) return null;

  const openNewBuilder = () => {
    const fresh = blankQuiz(type);
    if (type === 'lesson') {
      fresh.lessonId = targetId;
      fresh.moduleId = moduleIdProp;
    } else if (type === 'module') {
      fresh.moduleId = targetId;
    }
    setEditingQuiz(fresh);
    setView('builder');
  };

  const openEditBuilder = (quiz) => {
    setEditingQuiz({ ...quiz, questions: quiz.questions.map(q => ({ ...q, options: [...q.options], explanationImages: [...(q.explanationImages || [])] })) });
    setView('builder');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingQuiz.authorName.trim()) {
      alert("Veuillez indiquer l'auteur.");
      return;
    }
    for (const q of editingQuiz.questions) {
      if (!q.correctAnswer) {
        alert('Chaque question doit avoir une réponse correcte.');
        return;
      }
    }
    try {
      const payload = { ...editingQuiz };
      delete payload._id;
      const isEdit = !!editingQuiz._id;
      const res = await fetch(
        isEdit ? `https://reussite-qcms.onrender.com/api/quizzes/${editingQuiz._id}` : 'https://reussite-qcms.onrender.com/api/quizzes',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (res.ok) {
        alert(isEdit ? 'QCM modifié !' : 'QCM ajouté !');
        setView('list');
        await fetchQuizzes();
      } else {
        const errorData = await res.json();
        alert(`Erreur: ${errorData.message || 'Erreur inconnue'}`);
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Supprimer ce QCM ?')) return;
    try {
      const res = await fetch(`https://reussite-qcms.onrender.com/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchQuizzes();
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
            {type === 'lesson' ? 'QCM — ' : 'Examens — '}{targetLabel}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><X size={22} /></button>
        </div>

        {view === 'list' && (
          <div className="space-y-3">
            <button onClick={openNewBuilder} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow flex items-center justify-center gap-2 text-sm font-medium">
              <Plus size={16} /> Nouveau {type === 'lesson' ? 'QCM' : 'Examen'}
            </button>
            {loading ? <p className="text-sm text-slate-500">Chargement...</p> : quizzes.length === 0 ? <p className="text-sm text-slate-500">Aucun QCM.</p> : quizzes.map(quiz => (
              <div key={quiz._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border border-blue-100 dark:border-slate-700 bg-blue-50/60 dark:bg-slate-900/40 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-white">
                    {quiz.isIA ? (
                      <span className="text-xs bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded mr-1">🤖 QCM IA</span>
                    ) : (
                      `${quiz.year} — `
                    )}
                    {quiz.questions.length} question(s)
                  </p>
                  <p className="text-xs text-slate-500">{quiz.durationMinutes} min · Auteur : {quiz.authorName || 'Inconnu'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEditBuilder(quiz)} className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 transition" title="Modifier"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteQuiz(quiz._id)} className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 transition" title="Supprimer"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'builder' && editingQuiz && (
          <form onSubmit={handleSave} className="space-y-4">
            <button type="button" onClick={() => setView('list')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <ArrowLeft size={12} /> Retour
            </button>
            <p className="text-xs text-slate-500 bg-gray-50 dark:bg-slate-900/50 p-2 rounded">
              {type === 'lesson' ? "Correction après chaque question." : "Correction à la fin."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Année {type === 'lesson' && editingQuiz.isIA && <span className="text-slate-400">(non applicable — QCM IA)</span>}
                </label>
                <select
                  className={`w-full ${INPUT_CLASS} ${type === 'lesson' && editingQuiz.isIA ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={editingQuiz.year}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, year: e.target.value })}
                  disabled={type === 'lesson' && editingQuiz.isIA}
                >
                  {ALL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Durée (min)</label>
                <input type="number" min="1" className={`w-full ${INPUT_CLASS}`} value={editingQuiz.durationMinutes} onChange={(e) => setEditingQuiz({ ...editingQuiz, durationMinutes: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Auteur</label>
                <input type="text" placeholder="Professeur" className={`w-full ${INPUT_CLASS}`} value={editingQuiz.authorName} onChange={(e) => setEditingQuiz({ ...editingQuiz, authorName: e.target.value })} />
              </div>
            </div>

            {/* QCM IA : uniquement pour les QCM "par cours" (type === 'lesson'). Retiré des examens "par année". */}
            {type === 'lesson' && (
              <div className="flex items-center gap-2 mt-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">🤖 QCM IA</label>
                <input
                  type="checkbox"
                  checked={editingQuiz.isIA || false}
                  onChange={(e) => setEditingQuiz({ ...editingQuiz, isIA: e.target.checked })}
                  className="w-4 h-4"
                />
              </div>
            )}

            <QuestionsBuilder
              questions={editingQuiz.questions}
              onChange={(questions) => setEditingQuiz({ ...editingQuiz, questions })}
              uploadFile={uploadFile}
            />

            <JsonImportBox onImport={(importedQuestions) => setEditingQuiz({ ...editingQuiz, questions: importedQuestions })} />

            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow font-medium">
              {editingQuiz._id ? 'Enregistrer' : `Enregistrer le ${type === 'lesson' ? 'QCM' : 'examen'}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ---------- Composant principal AdminModuleContent ----------
function AdminModuleContent() {
  const { moduleId } = useParams();
  const [moduleTitle, setModuleTitle] = useState('');
  const [lessons, setLessons] = useState([]);

  const [filterYear, setFilterYear] = useState('all');
  const [viewYearByLesson, setViewYearByLesson] = useState({});

  const [form, setForm] = useState({
    title: '',
    order: 1,
    selectedYears: [],
    yearContents: {}
  });

  const [editForm, setEditForm] = useState(null);
  const [newCustomYear, setNewCustomYear] = useState('');
  const [editNewCustomYear, setEditNewCustomYear] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [quizModal, setQuizModal] = useState({ open: false, type: 'lesson', targetId: null, targetLabel: '' });

  // ✅ Ref pour empêcher les doublons lors de l'upload dans le modal d'édition
  const isUploadingRef = useRef(false);

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('https://reussite-qcms.onrender.com/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`Erreur : ${errData.error || 'fichier trop volumineux'}`);
        return '';
      }
      const data = await res.json();
      return data.url;
    } catch (err) {
      console.error(err);
      alert('Erreur réseau.');
      return '';
    }
  };

  const fetchLessons = async () => {
    try {
      const lesRes = await fetch(`https://reussite-qcms.onrender.com/api/lessons?moduleId=${moduleId}`);
      const lesData = await lesRes.json();
      setLessons(lesData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const modRes = await fetch(`https://reussite-qcms.onrender.com/api/modules/${moduleId}`);
        const modData = await modRes.json();
        setModuleTitle(modData.title);
        await fetchLessons();
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [moduleId]);

  // ---- Gestion des années pour le formulaire d'ajout ----
  const toggleYear = (year) => {
    setForm(prev => {
      const isSelected = prev.selectedYears.includes(year);
      const newSelectedYears = isSelected ? prev.selectedYears.filter(y => y !== year) : [...prev.selectedYears, year];
      const newYearContents = { ...prev.yearContents };
      if (isSelected) {
        delete newYearContents[year];
      } else {
        newYearContents[year] = [
          { language: 'fr', pdf: [], video: [], summary: [], td: [], correction: [], other: [], ai: [], aiSummary: [] },
          { language: 'en', pdf: [], video: [], summary: [], td: [], correction: [], other: [], ai: [], aiSummary: [] }
        ];
      }
      return { ...prev, selectedYears: newSelectedYears, yearContents: newYearContents };
    });
  };

  const handleAddCustomYear = () => {
    const year = newCustomYear.trim();
    if (!year) { alert('Veuillez entrer une année.'); return; }
    if (form.selectedYears.includes(year)) { alert('Déjà sélectionnée.'); return; }
    setForm(prev => ({
      ...prev,
      selectedYears: [...prev.selectedYears, year],
      yearContents: {
        ...prev.yearContents,
        [year]: [
          { language: 'fr', pdf: [], video: [], summary: [], td: [], correction: [], other: [], ai: [], aiSummary: [] },
          { language: 'en', pdf: [], video: [], summary: [], td: [], correction: [], other: [], ai: [], aiSummary: [] }
        ]
      }
    }));
    setNewCustomYear('');
  };

  const handleAddFiles = async (versionIndex, field, files) => {
    const year = form.selectedYears.find(y => form.yearContents[y] && form.yearContents[y][versionIndex]);
    if (!year) return;
    const newItems = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (!url) continue;
      let defaultName = file.name.replace(/\.[^/.]+$/, "");
      const customName = prompt(`Nom pour "${file.name}" :`, defaultName);
      if (customName !== null) defaultName = customName.trim() || defaultName;
      newItems.push({ url, name: defaultName });
    }
    if (newItems.length === 0) return;
    setForm(prev => {
      const versions = [...prev.yearContents[year]];
      const existing = versions[versionIndex][field] || [];
      // Éviter les doublons
      const combined = [...existing];
      newItems.forEach(item => {
        if (!combined.some(ex => ex.url === item.url)) {
          combined.push(item);
        }
      });
      versions[versionIndex] = { ...versions[versionIndex], [field]: combined };
      return { ...prev, yearContents: { ...prev.yearContents, [year]: versions } };
    });
  };

  const handleRemoveFile = (versionIndex, field, index) => {
    const year = form.selectedYears.find(y => form.yearContents[y] && form.yearContents[y][versionIndex]);
    if (!year) return;
    setForm(prev => {
      const versions = [...prev.yearContents[year]];
      const items = [...versions[versionIndex][field]];
      items.splice(index, 1);
      versions[versionIndex] = { ...versions[versionIndex], [field]: items };
      return { ...prev, yearContents: { ...prev.yearContents, [year]: versions } };
    });
  };

  const handleRenameFile = (versionIndex, field, index) => {
    const year = form.selectedYears.find(y => form.yearContents[y] && form.yearContents[y][versionIndex]);
    if (!year) return;
    const current = form.yearContents[year][versionIndex][field][index];
    const newName = prompt('Nouveau nom :', current.name);
    if (newName !== null && newName.trim()) {
      setForm(prev => {
        const versions = [...prev.yearContents[year]];
        const items = [...versions[versionIndex][field]];
        items[index] = { ...items[index], name: newName.trim() };
        versions[versionIndex] = { ...versions[versionIndex], [field]: items };
        return { ...prev, yearContents: { ...prev.yearContents, [year]: versions } };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.selectedYears.length === 0) {
      alert('Sélectionnez au moins une année.');
      return;
    }
    try {
      const yearContentsArray = form.selectedYears.map(year => ({ year, versions: form.yearContents[year] }));
      const res = await fetch('https://reussite-qcms.onrender.com/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, order: form.order, moduleId, yearContents: yearContentsArray })
      });
      if (res.ok) {
        alert('Leçon ajoutée !');
        setForm({ title: '', order: lessons.length + 1, selectedYears: [], yearContents: {} });
        await fetchLessons();
      } else {
        const errorData = await res.json();
        alert(`Erreur: ${errorData.message}`);
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  // ---- Gestion de la modification ----
  const openEditModal = (lesson) => {
    setEditForm({
      _id: lesson._id,
      title: lesson.title,
      order: lesson.order,
      yearContents: (lesson.yearContents || []).map(yc => ({ year: yc.year, versions: yc.versions.map(v => ({ ...v })) }))
    });
    setIsEditModalOpen(true);
  };

  // ✅ Fonction modifiée avec le flag pour éviter les doublons et vérification d'existence
  const handleEditAddFiles = async (yearIndex, versionIndex, field, files) => {
    // Empêcher les appels simultanés
    if (isUploadingRef.current) return;
    isUploadingRef.current = true;

    const newItems = [];
    for (const file of files) {
      const url = await uploadFile(file);
      if (!url) continue;
      let defaultName = file.name.replace(/\.[^/.]+$/, "");
      const customName = prompt(`Nom pour "${file.name}" :`, defaultName);
      if (customName !== null) defaultName = customName.trim() || defaultName;
      newItems.push({ url, name: defaultName });
    }
    if (newItems.length > 0) {
      setEditForm(prev => {
        const yearContents = [...prev.yearContents];
        const existing = yearContents[yearIndex].versions[versionIndex][field] || [];
        // Éviter les doublons
        const combined = [...existing];
        newItems.forEach(item => {
          if (!combined.some(ex => ex.url === item.url)) {
            combined.push(item);
          }
        });
        yearContents[yearIndex].versions[versionIndex] = { ...yearContents[yearIndex].versions[versionIndex], [field]: combined };
        return { ...prev, yearContents };
      });
    }
    isUploadingRef.current = false;
  };

  const handleEditRemoveFile = (yearIndex, versionIndex, field, index) => {
    setEditForm(prev => {
      const yearContents = [...prev.yearContents];
      const items = [...yearContents[yearIndex].versions[versionIndex][field]];
      items.splice(index, 1);
      yearContents[yearIndex].versions[versionIndex] = { ...yearContents[yearIndex].versions[versionIndex], [field]: items };
      return { ...prev, yearContents };
    });
  };

  const handleEditRenameFile = (yearIndex, versionIndex, field, index) => {
    const current = editForm.yearContents[yearIndex].versions[versionIndex][field][index];
    const newName = prompt('Nouveau nom :', current.name);
    if (newName !== null && newName.trim()) {
      setEditForm(prev => {
        const yearContents = [...prev.yearContents];
        const items = [...yearContents[yearIndex].versions[versionIndex][field]];
        items[index] = { ...items[index], name: newName.trim() };
        yearContents[yearIndex].versions[versionIndex] = { ...yearContents[yearIndex].versions[versionIndex], [field]: items };
        return { ...prev, yearContents };
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://reussite-qcms.onrender.com/api/lessons/${editForm._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        alert('Leçon modifiée !');
        setIsEditModalOpen(false);
        await fetchLessons();
      } else {
        const errorData = await res.json();
        alert(`Erreur: ${errorData.message}`);
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Supprimer cette leçon ?')) return;
    try {
      const res = await fetch(`https://reussite-qcms.onrender.com/api/lessons/${lessonId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Leçon supprimée !');
        await fetchLessons();
      } else {
        const errorData = await res.json();
        alert(`Erreur: ${errorData.message}`);
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  // ---- Affichage des liens ----
  const renderVersionLinks = (v) => (
    <div key={v.language} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-blue-100 dark:border-slate-700 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
      <span className="font-medium text-slate-600 dark:text-slate-300">{v.language === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}</span>
      <div className="flex flex-wrap gap-2">
        {v.pdf?.map((item, i) => <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 p-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded dark:bg-red-900/20 dark:text-red-400"><FileText size={14} /> {item.name || `Cours ${i+1}`}</a>)}
        {v.video?.map((item, i) => <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 p-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded dark:bg-blue-900/20 dark:text-blue-400"><Video size={14} /> {item.name || `Vidéo ${i+1}`}</a>)}
        {v.summary?.map((item, i) => <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 p-1 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded dark:bg-green-900/20 dark:text-green-400"><BookOpen size={14} /> {item.name || `Résumé ${i+1}`}</a>)}
        {v.td?.map((item, i) => <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 p-1 text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 rounded dark:bg-orange-900/20 dark:text-orange-400"><FileText size={14} /> {item.name || `TD ${i+1}`}</a>)}
        {v.correction?.map((item, i) => <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 p-1 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 rounded dark:bg-purple-900/20 dark:text-purple-400"><FileText size={14} /> {item.name || `Corr. TD ${i+1}`}</a>)}
        {v.other?.map((item, i) => <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 p-1 text-xs bg-gray-200 text-gray-600 hover:bg-gray-300 rounded dark:bg-gray-700 dark:text-gray-400"><FileText size={14} /> {item.name || `Autre ${i+1}`}</a>)}
        {v.ai?.map((item, i) => <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 p-1 text-xs bg-purple-200 text-purple-600 hover:bg-purple-300 rounded dark:bg-purple-900/30 dark:text-purple-400"><Video size={14} /> {item.name || `IA ${i+1}`}</a>)}
        {v.aiSummary?.map((item, i) => <a key={i} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 p-1 text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded dark:bg-indigo-900/30 dark:text-indigo-400"><BookOpen size={14} /> {item.name || `Résumé IA ${i+1}`}</a>)}
      </div>
    </div>
  );

  const availableYears = ['all', ...new Set([...ALL_YEARS, ...lessons.flatMap(l => (l.yearContents || []).map(yc => yc.year))])];
  const filteredLessons = filterYear === 'all' ? lessons : lessons.filter(l => (l.yearContents || []).some(yc => yc.year === filterYear));

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/dashboard/modules" className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition text-slate-700 dark:text-white flex-shrink-0">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white truncate">Gestion du Module : {moduleTitle}</h2>
      </div>

      {/* Formulaire d'ajout de leçon */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md mb-8 border border-gray-200 dark:border-slate-700">
        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Plus size={20} /> Ajouter une Leçon</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Titre de la leçon" className={INPUT_CLASS} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input type="number" placeholder="Ordre" required className={INPUT_CLASS} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value === '' ? 1 : parseInt(e.target.value) })} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-full sm:w-auto">Années :</span>
            {ALL_YEARS.map(year => (
              <label key={year} className="flex items-center gap-1 text-sm cursor-pointer bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-white px-3 py-1.5 rounded-lg">
                <input type="checkbox" checked={form.selectedYears.includes(year)} onChange={() => toggleYear(year)} /> {year}
              </label>
            ))}
            <div className="flex items-center gap-2 mt-2 w-full sm:w-auto">
              <input type="text" placeholder="Ex: 2026-2027" className={`text-sm w-full sm:w-40 ${INPUT_CLASS}`} value={newCustomYear} onChange={(e) => setNewCustomYear(e.target.value)} />
              <button type="button" onClick={handleAddCustomYear} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg shadow flex-shrink-0">+ Ajouter</button>
            </div>
          </div>
          {form.selectedYears.length > 0 && (
            <div className="space-y-4 border-t border-gray-100 dark:border-slate-700 pt-4">
              {form.selectedYears.map(year => (
                <YearFilesBlock
                  key={year}
                  year={year}
                  versions={form.yearContents[year]}
                  onAddFiles={(vIndex, field, files) => handleAddFiles(vIndex, field, files)}
                  onRemoveFile={(vIndex, field, idx) => handleRemoveFile(vIndex, field, idx)}
                  onRenameFile={(vIndex, field, idx) => handleRenameFile(vIndex, field, idx)}
                />
              ))}
            </div>
          )}
          <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition">Enregistrer la Leçon</button>
        </form>
      </div>

      {/* Bouton gestion des examens du module */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={() => setQuizModal({ open: true, type: 'module', targetId: moduleId, targetLabel: moduleTitle })} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow flex items-center gap-2 text-sm font-medium">
          <Calendar size={18} /> Gérer les Examens du Module
        </button>
      </div>

      {/* Liste des leçons */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Leçons existantes</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Filtrer par année :</label>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className={`text-sm w-full sm:w-auto ${INPUT_CLASS}`}>
              {availableYears.map(y => <option key={y} value={y}>{y === 'all' ? 'Toutes les années' : y}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.sort((a, b) => a.order - b.order).map((lesson) => {
            const lessonYears = (lesson.yearContents || []).map(yc => yc.year);
            const currentViewYear = viewYearByLesson[lesson._id] || lessonYears[0];
            const currentYearContent = (lesson.yearContents || []).find(yc => yc.year === currentViewYear);
            return (
              <div key={lesson._id} className="bg-blue-50 dark:bg-slate-800 rounded-xl shadow border border-blue-100 dark:border-slate-700 overflow-hidden hover:shadow-lg transition relative group">
                <button onClick={() => openEditModal(lesson)} className="absolute top-2 right-10 p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition opacity-0 group-hover:opacity-100 dark:bg-blue-900/30 dark:text-blue-400" title="Modifier"><Edit size={16} /></button>
                <button onClick={() => handleDeleteLesson(lesson._id)} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition opacity-0 group-hover:opacity-100 dark:bg-red-900/30 dark:text-red-400" title="Supprimer"><Trash2 size={16} /></button>
                <div className="p-4 border-b border-blue-100 dark:border-slate-700 bg-blue-100/40 dark:bg-slate-800/50">
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded mb-2 inline-block">Leçon {lesson.order}</span>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white break-words">{lesson.title}</h4>
                  {lessonYears.length > 0 && (
                    <div className="mt-3">
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Choisir l'année :</label>
                      <select value={currentViewYear} onChange={(e) => setViewYearByLesson({ ...viewYearByLesson, [lesson._id]: e.target.value })} className={`text-xs w-full ${INPUT_CLASS}`}>
                        {lessonYears.map(year => <option key={year} value={year}>{year}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2 bg-blue-50 dark:bg-slate-800">
                  {currentYearContent ? currentYearContent.versions.map(v => renderVersionLinks(v)) : <p className="text-xs text-slate-400">Aucun fichier.</p>}
                </div>
                <div className="p-4 bg-blue-100/40 dark:bg-slate-800/50 border-t border-blue-100 dark:border-slate-700">
                  <button onClick={() => setQuizModal({ open: true, type: 'lesson', targetId: lesson._id, targetLabel: lesson.title })} className="w-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 py-2 rounded hover:bg-green-200 transition flex items-center justify-center gap-2">
                    <Clock size={14} /> Gérer les QCM de ce cours
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal QCM */}
      <QuizModal 
        isOpen={quizModal.open} 
        onClose={() => setQuizModal({ ...quizModal, open: false })} 
        type={quizModal.type} 
        targetId={quizModal.targetId} 
        targetLabel={quizModal.targetLabel} 
        uploadFile={uploadFile} 
        moduleIdProp={moduleId}
      />

      {/* Modal d'édition de leçon */}
      {isEditModalOpen && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Modifier la Leçon</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><X size={24} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Titre" className={INPUT_CLASS} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                <input type="number" placeholder="Ordre" required className={INPUT_CLASS} value={editForm.order} onChange={(e) => setEditForm({ ...editForm, order: e.target.value === '' ? 1 : parseInt(e.target.value) })} />
              </div>
              <div className="space-y-4 border-t border-gray-100 dark:border-slate-700 pt-4">
                {editForm.yearContents.map((yc, yearIndex) => (
                  <YearFilesBlock
                    key={yc.year}
                    year={yc.year}
                    versions={yc.versions}
                    onAddFiles={(vIndex, field, files) => handleEditAddFiles(yearIndex, vIndex, field, files)}
                    onRemoveFile={(vIndex, field, idx) => handleEditRemoveFile(yearIndex, vIndex, field, idx)}
                    onRenameFile={(vIndex, field, idx) => handleEditRenameFile(yearIndex, vIndex, field, idx)}
                  />
                ))}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input type="text" placeholder="Nouvelle année" className={`text-sm w-full sm:w-40 ${INPUT_CLASS}`} value={editNewCustomYear} onChange={(e) => setEditNewCustomYear(e.target.value)} />
                  <button type="button" onClick={() => {
                    const year = editNewCustomYear.trim();
                    if (!year) return alert('Entrez une année.');
                    if (editForm.yearContents.some(yc => yc.year === year)) return alert('Déjà présente.');
                    setEditForm(prev => ({
                      ...prev,
                      yearContents: [
                        ...prev.yearContents,
                        { year, versions: [{ language: 'fr', pdf: [], video: [], summary: [], td: [], correction: [], other: [], ai: [], aiSummary: [] }, { language: 'en', pdf: [], video: [], summary: [], td: [], correction: [], other: [], ai: [], aiSummary: [] }] }
                      ]
                    }));
                    setEditNewCustomYear('');
                  }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg shadow flex-shrink-0">+ Ajouter année</button>
                </div>
              </div>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow">Enregistrer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminModuleContent;