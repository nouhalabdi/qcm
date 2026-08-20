// StudentQuizView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, ArrowLeft, ArrowRight, Save, X, FileText, Trophy, Heart, MessageCircle, Maximize2, Minimize2, Trash2, Pencil } from 'lucide-react';
import ChatWindow from './ChatWindow';

function StudentQuizView() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isCorrectionOnly = searchParams.get('mode') === 'correction';
  const returnToFollow = location.state?.returnToFollow;
  const moduleIdFromState = location.state?.moduleId;
  const user = JSON.parse(localStorage.getItem('user'));

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isFirstAttempt, setIsFirstAttempt] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [startTime, setStartTime] = useState(null);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatConversationId, setChatConversationId] = useState(null);
  const [chatTitle, setChatTitle] = useState('');

  // --- Per-question states ---
  const [favoriteQuestions, setFavoriteQuestions] = useState({}); // key: questionIndex, value: boolean
  const [questionNotes, setQuestionNotes] = useState({}); // key: questionIndex, value: note text
  const [activeQuestionNoteIndex, setActiveQuestionNoteIndex] = useState(null);
  const [questionNoteText, setQuestionNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);

  const [rankingData, setRankingData] = useState(null);
  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);

  const [zoomedImage, setZoomedImage] = useState(null);

  // --- Load quiz and per-question data ---
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/quizzes/${quizId}`);
        if (!res.ok) throw new Error('Examen non trouvé');
        const data = await res.json();
        setQuiz(data);
        setTimeLeft(data.durationMinutes * 60);

        const statsRes = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/profile/stats?userId=${user?._id}`);
        const statsData = await statsRes.json();
        const completedEntries = statsData.completedQuizzes?.filter(
          q => String(q.quizId?._id || q.quizId) === String(quizId)
        ) || [];
        if (completedEntries.length > 0 || isCorrectionOnly) {
          setIsReviewMode(true);
          setIsFirstAttempt(false);
          const last = completedEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
          if (last) {
            const totalQuestions = data.questions.length;
            const correctCount = Math.round((last.score / 100) * totalQuestions);
            setScore(correctCount);
            setLastTimeTaken(last.timeTaken || 0);
          }
        }
        // Load per-question favorites and notes
        const questionDataRes = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/question-data?userId=${user?._id}&quizId=${quizId}`);
        if (questionDataRes.ok) {
          const questionData = await questionDataRes.json();
          setFavoriteQuestions(questionData.favoriteQuestions || {});
          setQuestionNotes(questionData.questionNotes || {});
        }

        if (!isReviewMode && !isCorrectionOnly) {
          setStartTime(Date.now());
        }
      } catch (err) {
        console.error(err);
        setQuiz({
          _id: quizId,
          type: 'lesson',
          year: '2024-2025',
          correctionMode: 'immediate',
          durationMinutes: 5,
          questions: [{ questionText: "Erreur de chargement", options: ["Recharger"], correctAnswer: "", explanation: "" }]
        });
        setTimeLeft(5 * 60);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, user?._id]);

  // Timer
  useEffect(() => {
    if (timeLeft === 0 || isFinished || isReviewMode) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, isReviewMode]);

  // --- Per-question favorite toggle ---
  const toggleFavoriteQuestion = async (index) => {
    if (!user) return;
    const newFav = !favoriteQuestions[index];
    setFavoriteQuestions(prev => ({ ...prev, [index]: newFav }));
    try {
      await fetch('https://reussite-qcmss-1nc7.onrender.com/api/users/question-favorite', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, quizId, questionIndex: index, favorite: newFav })
      });
    } catch (err) {
      console.error(err);
      setFavoriteQuestions(prev => ({ ...prev, [index]: !newFav })); // revert
    }
  };

  // --- Per-question note ---
  const openQuestionNote = (index) => {
    setActiveQuestionNoteIndex(index);
    setQuestionNoteText(questionNotes[index] || '');
    setNoteModalOpen(true);
  };

  const saveQuestionNote = async () => {
    if (activeQuestionNoteIndex === null) return;
    setSavingNote(true);
    try {
      const res = await fetch('https://reussite-qcmss-1nc7.onrender.com/api/users/question-note', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, quizId, questionIndex: activeQuestionNoteIndex, noteText: questionNoteText })
      });
      if (res.ok) {
        const updated = { ...questionNotes, [activeQuestionNoteIndex]: questionNoteText };
        setQuestionNotes(updated);
        alert('📝 Note sauvegardée avec succès !');
      } else {
        const errData = await res.json();
        alert(`Erreur: ${errData.message}`);
      }
    } catch (err) {
      alert('Erreur réseau.');
    } finally {
      setSavingNote(false);
      setNoteModalOpen(false);
      setActiveQuestionNoteIndex(null);
    }
  };

  const deleteQuestionNote = async () => {
    if (activeQuestionNoteIndex === null) return;
    if (!window.confirm("Voulez-vous vraiment supprimer cette note ?")) return;
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/question-note?userId=${user._id}&quizId=${quizId}&questionIndex=${activeQuestionNoteIndex}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updated = { ...questionNotes };
        delete updated[activeQuestionNoteIndex];
        setQuestionNotes(updated);
        alert('Note supprimée.');
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    } finally {
      setNoteModalOpen(false);
      setActiveQuestionNoteIndex(null);
    }
  };

  // --- Chat per question (if needed) ---
  const openQuestionChat = async (index) => {
    // Create a conversation for this specific question? 
    // For simplicity, we can reuse the quiz chat or create a new one.
    // But for now, we'll use the existing quiz chat.
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/community/conversations/quiz/${quizId}?userId=${user._id}`);
      const conv = await res.json();
      setChatConversationId(conv._id);
      setChatTitle(`Discussion - Question ${index+1}`);
      setShowChat(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ouverture du chat.");
    }
  };

  // --- Finish and score ---
  const handleFinish = async () => {
    if (isReviewMode) return;
    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (q.correctAnswer && selectedAnswers[idx] === q.correctAnswer) correctCount++;
    });
    setScore(correctCount);
    setIsFinished(true);

    let timeSpent = 0;
    if (startTime) {
      timeSpent = Math.floor((Date.now() - startTime) / 1000);
    }

    setIsSaving(true);
    try {
      const res = await fetch('https://reussite-qcmss-1nc7.onrender.com/api/users/quiz-result', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          quizId,
          type: quiz.type === 'simulation' ? 'module' : quiz.type,
          score: Math.round((correctCount / quiz.questions.length) * 100),
          timeTaken: timeSpent
        })
      });
      const data = await res.json();
      console.log('✅ Score enregistré:', data);
    } catch (e) {
      console.error("❌ Erreur lors de la sauvegarde du score", e);
    } finally {
      setIsSaving(false);
    }
    setIsFirstAttempt(false);
  };

  // --- Answer handling ---
  const handleAnswer = (option) => {
    if (isFinished || isReviewMode) return;
    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
    const effectiveMode = (quiz.type !== 'lesson' && isPracticeMode) ? 'immediate' : quiz.correctionMode;
    if (effectiveMode === 'immediate') {
      setShowExplanation(true);
    }
  };

  const handleNext = () => {
    if (isReviewMode) {
      if (currentQuestionIndex < quiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        if (returnToFollow) {
          navigate('/cours', { state: { returnToFollow: true, moduleId: moduleIdFromState } });
        } else {
          if (quiz.type === 'simulation') navigate('/simulations');
          else navigate('/cours');
        }
      }
      return;
    }

    const effectiveMode = (quiz.type !== 'lesson' && isPracticeMode) ? 'immediate' : quiz.correctionMode;
    if (effectiveMode === 'immediate' && selectedAnswers[currentQuestionIndex] !== undefined) {
      if (!answeredQuestions.has(currentQuestionIndex)) {
        const q = quiz.questions[currentQuestionIndex];
        const isCorrect = q.correctAnswer && selectedAnswers[currentQuestionIndex] === q.correctAnswer;
        if (isCorrect) setScore(prev => prev + 1);
        setAnsweredQuestions(prev => new Set(prev.add(currentQuestionIndex)));
      }
    }
    setShowExplanation(false);
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleExit = () => {
    if (isCorrectionOnly) { navigate('/profile'); return; }
    if (!isFinished && !isReviewMode && !window.confirm("Voulez-vous vraiment quitter l'examen ?")) return;
    if (returnToFollow) {
      navigate('/cours', { state: { returnToFollow: true, moduleId: moduleIdFromState } });
    } else {
      if (quiz.type === 'simulation') navigate('/simulations');
      else navigate('/cours');
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setAnsweredQuestions(new Set());
    setScore(0);
    setIsFinished(false);
    setIsReviewMode(false);
    setShowExplanation(false);
    setCurrentQuestionIndex(0);
    setTimeLeft(quiz.durationMinutes * 60);
    setStartTime(Date.now());
    setIsFirstAttempt(true);
  };

  // --- Ranking ---
  const fetchRanking = async () => {
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/quizzes/${quizId}/ranking`);
      const data = await res.json();
      setRankingData(data);
      setIsRankingModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement du classement.');
    }
  };

  // --- Helpers ---
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const ImageGallery = ({ images, alt }) => {
    if (!images || images.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {images.map((url, idx) => (
          <div key={idx} className="relative group">
            <img
              src={url}
              alt={`${alt} ${idx+1}`}
              className="max-w-[200px] max-h-[150px] object-contain rounded border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg transition"
              onClick={() => setZoomedImage(url)}
            />
            <button
              onClick={() => setZoomedImage(url)}
              className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
              title="Agrandir"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Chargement de l'examen...</div>;
  if (!quiz) return <div className="p-10 text-center text-red-500">Erreur lors du chargement.</div>;

  const totalQuestions = quiz.questions.length;
  const effectiveCorrectionMode = (quiz.type !== 'lesson' && isPracticeMode) ? 'immediate' : quiz.correctionMode;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200 dark:border-slate-700 relative">

        {/* --- Header (simplified) --- */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-700 flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {isCorrectionOnly ? 'Correction du QCM' : quiz.type === 'lesson' ? 'QCM par cours' : quiz.type === 'simulation' ? 'Simulation' : 'Examen par année'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {quiz.year}{quiz.title ? ` (${quiz.title})` : ''}
            </p>
            {isReviewMode && !isCorrectionOnly && <span className="text-xs text-blue-600 dark:text-blue-400 mt-1 block">Mode révision</span>}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {quiz.type !== 'lesson' && !isFinished && !isReviewMode && (
              <button
                onClick={() => setIsPracticeMode(!isPracticeMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isPracticeMode ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {isPracticeMode ? 'Mode Entraînement' : 'Mode Examen'}
              </button>
            )}
            <button onClick={handleExit} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition" title="Quitter l'examen">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* --- Content --- */}
        {!isFinished && !isReviewMode ? (
          <div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs text-slate-400">Question {currentQuestionIndex + 1} / {totalQuestions}</p>
                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                  <Clock size={18} />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">
                {quiz.questions[currentQuestionIndex].questionText}
              </h3>

              {/* Per-question action buttons */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => toggleFavoriteQuestion(currentQuestionIndex)}
                  className="p-2 rounded-full transition hover:bg-gray-100 dark:hover:bg-slate-700"
                  title="Ajouter aux favoris"
                >
                  <Heart size={20} fill={favoriteQuestions[currentQuestionIndex] ? 'red' : 'none'} className={favoriteQuestions[currentQuestionIndex] ? 'text-red-500' : 'text-slate-400'} />
                </button>
                <button
                  onClick={() => openQuestionNote(currentQuestionIndex)}
                  className="p-2 rounded-full transition hover:bg-gray-100 dark:hover:bg-slate-700"
                  title="Ajouter une note"
                >
                  <FileText size={20} className="text-slate-400" />
                </button>
                <button
                  onClick={() => openQuestionChat(currentQuestionIndex)}
                  className="p-2 rounded-full transition hover:bg-gray-100 dark:hover:bg-slate-700"
                  title="Discuter de cette question"
                >
                  <MessageCircle size={20} className="text-slate-400" />
                </button>
              </div>

              <ImageGallery
                images={quiz.questions[currentQuestionIndex].questionImages}
                alt="Image de la question"
              />

              <div className="space-y-3 mt-4">
                {quiz.questions[currentQuestionIndex].options.map((opt, idx) => {
                  let btnClass = "w-full text-left p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 transition";
                  const isSelected = selectedAnswers[currentQuestionIndex] === opt;
                  const isCorrect = opt === quiz.questions[currentQuestionIndex].correctAnswer;
                  const revealCorrection = effectiveCorrectionMode === 'immediate';

                  if (isSelected) {
                    if (revealCorrection) {
                      btnClass = isCorrect
                        ? "w-full text-left p-3 border-2 border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700"
                        : "w-full text-left p-3 border-2 border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700";
                    } else {
                      btnClass = "w-full text-left p-3 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700";
                    }
                  } else if (revealCorrection && showExplanation && isCorrect) {
                    btnClass = "w-full text-left p-3 border-2 border-green-500 bg-green-50/30 dark:bg-green-900/10 text-green-700";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(opt)}
                      disabled={!!selectedAnswers[currentQuestionIndex] || isFinished}
                      className={btnClass}
                    >
                      {opt}
                      {isSelected && revealCorrection && isCorrect && <CheckCircle className="inline ml-2 text-green-600" size={16} />}
                      {isSelected && revealCorrection && !isCorrect && <XCircle className="inline ml-2 text-red-600" size={16} />}
                    </button>
                  );
                })}
              </div>

              {showExplanation && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    <span className="font-bold text-blue-600">Explication :</span> {quiz.questions[currentQuestionIndex].explanation || 'Aucune explication fournie.'}
                  </p>
                  <ImageGallery
                    images={quiz.questions[currentQuestionIndex].explanationImages}
                    alt="Image d'explication"
                  />
                </div>
              )}

              {selectedAnswers[currentQuestionIndex] !== undefined && (
                <button
                  onClick={handleNext}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition flex items-center justify-center gap-2"
                >
                  {currentQuestionIndex === totalQuestions - 1 ? 'Terminer l\'examen' : 'Suivant'}
                </button>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center shadow transition"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, totalQuestions - 1)}
                    step={1}
                    value={currentQuestionIndex}
                    onChange={(e) => setCurrentQuestionIndex(parseInt(e.target.value, 10))}
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${totalQuestions > 1 ? (currentQuestionIndex / (totalQuestions - 1)) * 100 : 0}%, #93c5fd ${totalQuestions > 1 ? (currentQuestionIndex / (totalQuestions - 1)) * 100 : 0}%, #93c5fd 100%)`
                    }}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow
                      [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                  />

                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center shadow transition"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
                  {currentQuestionIndex + 1}/{totalQuestions}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // --- Correction / Finish screen ---
          <div className="text-center py-6">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              {isCorrectionOnly ? 'Correction du QCM (Favori)' : isReviewMode ? 'Révision - Examen terminé !' : 'Examen terminé !'}
            </h2>

            {!isCorrectionOnly && (
              <>
                <div className="flex items-center justify-center gap-6 mb-2 flex-wrap">
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                    {((score / totalQuestions) * 20).toFixed(2)}<span className="text-2xl text-slate-400">/20</span>
                  </div>
                  {lastTimeTaken > 0 && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      ⏱️ Temps : {Math.floor(lastTimeTaken / 60)} min {lastTimeTaken % 60} s
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6 mb-6 flex-wrap">
                  <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                    <CheckCircle size={18} /> {score} bonnes réponses
                  </span>
                  <span className="flex items-center gap-2 text-red-500 dark:text-red-400 font-medium">
                    <XCircle size={18} /> {totalQuestions - score} mauvaises réponses
                  </span>
                </div>
              </>
            )}

            <div className="text-left space-y-4 mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Détail des corrections :</h3>
              {quiz.questions.map((q, idx) => {
                const studentAnswer = selectedAnswers[idx];
                let wasCorrect = false;
                if (q.correctAnswer) {
                  wasCorrect = studentAnswer === q.correctAnswer;
                } else {
                  wasCorrect = false;
                }
                return (
                  <div key={idx} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{idx + 1}. {q.questionText}</p>
                    {studentAnswer !== undefined && (
                      <p className={`text-sm mt-1 ${wasCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {wasCorrect ? '✅' : '❌'} Votre réponse : {studentAnswer}
                      </p>
                    )}
                    {q.correctAnswer && (studentAnswer === undefined || !wasCorrect) && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">✅ Réponse correcte : {q.correctAnswer}</p>
                    )}
                    {!q.correctAnswer && studentAnswer !== undefined && (
                      <p className="text-sm text-orange-500 dark:text-orange-400 mt-1">⚠️ Aucune réponse correcte définie.</p>
                    )}
                    {quiz.type === 'simulation' && q.explanation && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-line">{q.explanation}</p>
                    )}
                    {(q.explanationImages || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.explanationImages.map((url, i) => (
                          <div key={i} className="relative group">
                            <img
                              src={url}
                              alt={`explication ${i+1}`}
                              className="max-w-[150px] max-h-[120px] object-contain rounded border border-slate-200 dark:border-slate-600 cursor-pointer hover:shadow-lg transition"
                              onClick={() => setZoomedImage(url)}
                            />
                            <button
                              onClick={() => setZoomedImage(url)}
                              className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                              title="Agrandir"
                            >
                              <Maximize2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {!isCorrectionOnly && (
                <button onClick={handleRetry} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow transition">
                  Refaire le QCM
                </button>
              )}
              <button
                onClick={() => {
                  if (returnToFollow) {
                    navigate('/cours', { state: { returnToFollow: true, moduleId: moduleIdFromState } });
                  } else {
                    navigate(isCorrectionOnly ? '/profile' : (quiz.type === 'simulation' ? '/simulations' : '/cours'));
                  }
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
              >
                {isCorrectionOnly ? 'Retour à mon profil' : (quiz.type === 'simulation' ? 'Retour aux simulations' : 'Retour aux cours')}
              </button>
              {!isCorrectionOnly && quiz.type === 'simulation' && (
                <button onClick={fetchRanking} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow transition flex items-center justify-center gap-2">
                  <Trophy size={18} /> Voir le classement
                </button>
              )}
            </div>
          </div>
        )}

        {/* --- Modales --- */}
        {/* Note modal per question */}
        {noteModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
              <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
                <div className="text-sm font-medium text-slate-800 dark:text-white">
                  Note pour la question {activeQuestionNoteIndex !== null ? activeQuestionNoteIndex + 1 : ''}
                </div>
                <button onClick={() => setNoteModalOpen(false)} className="text-slate-500 hover:text-red-500"><X size={18} /></button>
              </div>
              <div className="p-4 flex-1 bg-white dark:bg-slate-800">
                <textarea className="w-full h-64 md:h-96 bg-transparent border-none resize-none text-base text-slate-800 dark:text-slate-200 focus:ring-0 font-mono leading-relaxed" placeholder="Écrivez vos notes..." value={questionNoteText} onChange={(e) => setQuestionNoteText(e.target.value)} />
              </div>
              <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 border-t border-slate-200 dark:border-slate-600 flex justify-end gap-3">
                <button onClick={() => setNoteModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 transition font-medium">Annuler</button>
                <button onClick={deleteQuestionNote} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow font-medium">Supprimer</button>
                <button onClick={saveQuestionNote} disabled={savingNote} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition font-medium flex items-center gap-2">
                  <Save size={16} /> {savingNote ? 'Enregistrement...' : 'Enregistrer la note'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ranking modal (unchanged) */}
        {isRankingModalOpen && rankingData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-500" /> Classement des étudiants
                </h3>
                <button onClick={() => setIsRankingModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><X size={22} /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rankingData.map((student, index) => {
                  const initial = student.username ? student.username.charAt(0).toUpperCase() : '?';
                  let medalClass = "bg-slate-100 text-slate-600";
                  let icon = null;
                  if (index === 0) { medalClass = "bg-yellow-400 text-white"; icon = "🥇"; }
                  else if (index === 1) { medalClass = "bg-gray-300 text-white"; icon = "🥈"; }
                  else if (index === 2) { medalClass = "bg-orange-400 text-white"; icon = "🥉"; }
                  return (
                    <div key={student.userId} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition">
                      <div className="flex-shrink-0">{icon ? <span className="text-2xl">{icon}</span> : <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${medalClass}`}>{index + 1}</span>}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{initial}</div>
                          <div className="truncate">
                            <p className="font-medium text-slate-800 dark:text-white truncate">{student.username}{student.pseudo && <span className="text-blue-600 text-xs ml-1">(@{student.pseudo})</span>}</p>
                            <p className="text-xs text-slate-500">{student.year || 'Année inconnue'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right"><p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{student.score}%</p></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-center">
                <button onClick={() => setIsRankingModalOpen(false)} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition">Fermer</button>
              </div>
            </div>
          </div>
        )}

        {showChat && chatConversationId && (
          <ChatWindow
            conversationId={chatConversationId}
            title={chatTitle}
            type="group"
            user={user}
            onClose={() => setShowChat(false)}
            onRead={() => {}}
          />
        )}

        {zoomedImage && (
          <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img src={zoomedImage} alt="Agrandissement" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
                title="Fermer"
              >
                <X size={24} />
              </button>
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentQuizView;
