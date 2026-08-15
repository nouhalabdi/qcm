import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, GraduationCap, Mail, CheckCircle2, Clock, Calendar } from 'lucide-react';

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // دالة لجلب الطلاب من الخادم
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('https://reussite-qcmss-1nc7.onrender.com/api/users');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const toggleSubscription = async (userId, currentStatus) => {
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSubscribed: !currentStatus })
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour');
      // إعادة جلب القائمة لتحديث الواجهة
      await fetchStudents();
    } catch (err) {
      alert('Erreur lors du changement d\'abonnement');
    }
  };

  const avatarColors = [
    'from-blue-400 to-blue-600',
    'from-sky-500 to-blue-700',
    'from-blue-500 to-indigo-700',
    'from-cyan-500 to-blue-600',
    'from-blue-600 to-slate-800',
    'from-indigo-500 to-blue-700',
  ];

  if (loading) {
    return <p className="text-slate-500 dark:text-slate-400">Chargement...</p>;
  }

  if (students.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">Aucun étudiant pour le moment.</p>;
  }

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-800 dark:text-white">Gestion des Étudiants</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {students.map((student, index) => {
          const initial = student.username ? student.username.charAt(0).toUpperCase() : '?';
          const colorClass = avatarColors[index % avatarColors.length];

          const completed = student.completedQuizzes || [];
          const quizCount = completed.length;
          const avgScore = quizCount > 0
            ? Math.round(completed.reduce((acc, q) => acc + (q.score || 0), 0) / quizCount)
            : null;

          return (
            <div
              key={student._id}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-4 sm:p-6 hover:shadow-md transition"
            >
              {/* رأس البطاقة */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 dark:text-white leading-tight truncate">
                      {student.username}
                      {student.pseudo && <span className="text-xs text-blue-600 ml-1">({student.pseudo})</span>}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">ID: {student._id.slice(-6)}</p>
                  </div>
                </div>
                <span
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-full flex-shrink-0 whitespace-nowrap ${
                    student.isSubscribed
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}
                >
                  {student.isSubscribed ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  {student.isSubscribed ? 'Activé' : 'En attente'}
                </span>
              </div>

              {/* معلومات الطالب */}
              <div className="space-y-2 mb-5 pb-5 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 min-w-0">
                  <Mail size={14} className="text-slate-400 flex-shrink-0" />
                  <span className="truncate">{student.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <GraduationCap size={14} className="text-slate-400 flex-shrink-0" />
                  <span>{student.year}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                  <span>Université de Sétif</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                  <span>
                    Inscrit Ee {student.createdAt
                      ? new Date(student.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
              </div>

              {/* نتائج الطالب */}
              <div className="mb-5 pb-5 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Résultats</p>
                  {quizCount > 0 ? (
                    <span className={`text-sm font-bold ${avgScore >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                      Moyenne : {avgScore}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Aucun test passé</span>
                  )}
                </div>
                {quizCount > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {completed.map((q, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-slate-900/50 rounded-lg px-2 py-1.5 gap-2">
                        <span className="text-slate-600 dark:text-slate-300 truncate">
                          {q.type === 'module' ? 'Examen' : q.type === 'simulation' ? 'Simulation' : 'QCM cours'}
                          {q.quizId?.year ? ` • ${q.quizId.year}` : ''}
                        </span>
                        <span className={`font-semibold flex-shrink-0 ${q.score >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                          {q.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* زر الأكشن */}
              <button
                onClick={() => toggleSubscription(student._id, student.isSubscribed)}
                className={`w-full py-2.5 rounded-xl font-medium text-sm transition ${
                  student.isSubscribed
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {student.isSubscribed ? 'Désactiver l\'abonnement' : 'Activer l\'abonnement'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminStudents;