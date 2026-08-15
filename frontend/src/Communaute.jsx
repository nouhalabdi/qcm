import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, MessageCircle, GraduationCap, Mail, FolderOpen } from 'lucide-react';
import ChatWindow from './ChatWindow';

function Communaute() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [semester, setSemester] = useState('Semestre 1');

  // ✅ حالة المحادثة النشطة
  const [activeChat, setActiveChat] = useState(null);

  // ✅ 1. عند تحميل الصفحة أو تغيير الرابط، نقرأ المعطيات ونفتح الشات
  useEffect(() => {
    const conversationId = searchParams.get('conversationId');
    const title = searchParams.get('title');
    const type = searchParams.get('type') || 'direct';

    if (conversationId && title) {
      setActiveChat({ conversationId, title, type });
    } else {
      setActiveChat(null);
    }
  }, [searchParams]);

  // ✅ 2. جلب الطلاب والمجموعات
  useEffect(() => {
    if (!user || !user._id) return;

    const abortController = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsRes, groupsRes] = await Promise.all([
          fetch(`https://reussite-qcmss-1nc7.onrender.com/api/community/students?year=${encodeURIComponent(user.year)}&userId=${user._id}`, {
            signal: abortController.signal
          }),
          fetch(`https://reussite-qcmss-1nc7.onrender.com/api/community/modules-groups?year=${encodeURIComponent(user.year)}&semester=${encodeURIComponent(semester)}`, {
            signal: abortController.signal
          })
        ]);

        if (!studentsRes.ok || !groupsRes.ok) {
          throw new Error('Erreur lors du chargement des données');
        }

        const studentsData = await studentsRes.json();
        const groupsData = await groupsRes.json();

        // ✅ On ne pose les données que si la requête n'a pas été annulée
        if (!abortController.signal.aborted) {
          setStudents(studentsData);
          setGroups(groupsData);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      } finally {
        // ✅ CORRIGÉ : on arrête toujours le "Chargement...", qu'il y ait eu abort ou non.
        // Avant, ce setLoading(false) était protégé par "if (!abortController.signal.aborted)",
        // ce qui fait qu'en cas de double-exécution de l'effet (StrictMode) ou de tout autre
        // abort inattendu, le spinner restait bloqué indéfiniment sur "Chargement...".
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [user?.id, user?.year, semester]);

  // ✅ 3. دوال فتح المحادثات
  const openDirectChat = async (student) => {
    try {
      const res = await fetch('https://reussite-qcmss-1nc7.onrender.com/api/community/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, otherUserId: student._id })
      });
      const conv = await res.json();

      setSearchParams({
        conversationId: conv._id,
        title: student.pseudo || student.username,
        type: 'direct'
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ouverture de la discussion.");
    }
  };

  const openGroupChat = async (module) => {
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/community/conversations/module/${module._id}`);
      const conv = await res.json();

      setSearchParams({
        conversationId: conv._id,
        title: `${module.title} (Groupe)`,
        type: 'group'
      });
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ouverture du groupe.");
    }
  };

  // ✅ 4. عند إغلاق الشات، نقوم بمسح المعطيات من الرابط
  const handleCloseChat = () => {
    setSearchParams({});
    setActiveChat(null);
  };

  const avatarColors = [
    'from-blue-400 to-blue-600', 'from-sky-500 to-blue-700', 'from-indigo-500 to-blue-700',
    'from-cyan-500 to-blue-600', 'from-blue-600 to-slate-800', 'from-violet-500 to-blue-700'
  ];

  if (!user) return <div className="p-10 text-center text-slate-500">Veuillez vous connecter.</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Communauté</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Échangez avec les étudiants de {user.year}.</p>

        <div className="flex flex-wrap items-center gap-2 mb-6 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit">
          <button
            onClick={() => setTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'students' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <Users size={16} /> Étudiants
          </button>
          <button
            onClick={() => setTab('groups')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'groups' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            <FolderOpen size={16} /> Groupes par module
          </button>
        </div>

        {tab === 'groups' && (
          <div className="mb-6 max-w-xs">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Semestre</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            >
              <option value="Semestre 1">Semestre 1</option>
              <option value="Semestre 2">Semestre 2</option>
            </select>
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 text-center py-10">Chargement...</p>
        ) : tab === 'students' ? (
          students.length === 0 ? (
            <p className="text-slate-500 text-center py-10">Aucun autre étudiant dans votre année pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {students.map((student, index) => {
                const initial = student.username ? student.username.charAt(0).toUpperCase() : '?';
                const colorClass = avatarColors[index % avatarColors.length];
                return (
                  <div key={student._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center text-center hover:shadow-md transition">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-2xl mb-3`}>
                      {initial}
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white">
                      {student.pseudo || student.username}
                    </p>
                    {student.pseudo && <p className="text-xs text-slate-400 dark:text-slate-500">@{student.username}</p>}
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <GraduationCap size={12} /> {student.year}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-1 truncate w-full justify-center">
                      <Mail size={12} className="flex-shrink-0" /> <span className="truncate">{student.email}</span>
                    </div>
                    <button
                      onClick={() => openDirectChat(student)}
                      className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle size={16} /> Envoyer un message
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : groups.length === 0 ? (
          <p className="text-slate-500 text-center py-10">Aucun module trouvé pour votre année et ce semestre.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {groups.map((module) => (
              <div key={module._id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition">
                <div className="w-full h-24 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FolderOpen size={32} className="text-white/80" />
                </div>
                <div className="p-4">
                  <p className="font-bold text-slate-800 dark:text-white truncate">{module.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{module.semester}</p>
                  <button
                    onClick={() => openGroupChat(module)}
                    className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow flex items-center justify-center gap-2 transition"
                  >
                    <Users size={16} /> Rejoindre le groupe
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ 5. نافذة الدردشة */}
      {activeChat && (
        <ChatWindow
          key={activeChat.conversationId}
          conversationId={activeChat.conversationId}
          title={activeChat.title}
          type={activeChat.type}
          user={user}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
}

export default Communaute;