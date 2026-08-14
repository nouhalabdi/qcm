import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { X, MessageCircle, Bell } from 'lucide-react';
import io from 'socket.io-client';
import Navbar from './Navbar';
import Home from './Home';
import Auth from './Auth';
import QCMs from './QCMs';
import Subscription from './Subscription';
import AdminDashboard from './AdminDashboard';
import StudentProfile from './StudentProfile';
import StudentCourseView from './StudentCourseView';
import StudentModuleDetail from './StudentModuleDetail';
import StudentQuizView from './StudentQuizView';
import StudentSimulation from './StudentSimulation';
import Communaute from './Communaute';
import Classement from './Classement';
import StudentProgress from './StudentProgress';

function NotificationToast({ notification, onClose, onClick }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSystem = notification.conversationType === 'system';

  return (
    <div
      onClick={() => {
        onClick();
        onClose();
      }}
      className="fixed bottom-4 right-4 z-[9999] bg-white dark:bg-slate-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 cursor-pointer hover:shadow-xl transition-all duration-300 animate-slide-up flex items-start gap-3 max-w-sm w-full"
    >
      <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
        {isSystem ? <Bell size={20} /> : <MessageCircle size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
          {notification.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
          {notification.body}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 transition"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function AppContent({ darkMode, toggleDarkMode, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [toastNotifications, setToastNotifications] = useState([]);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !user._id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (socketRef.current) return;

    console.log('🔌 Connexion à Socket.io...');
    const newSocket = io('https://reussite-qcms.onrender.com');
    socketRef.current = newSocket;

    const joinUser = () => {
      if (user && user._id) {
        newSocket.emit('join-user', user._id);
        console.log(`📤 Envoi join-user: ${user._id}`);
      }
    };

    joinUser();

    newSocket.on('connect', () => {
      console.log('🟢 Socket reconnecté, envoi de join-user...');
      joinUser();
    });

    newSocket.on('notification', (notif) => {
      console.log('📩 Notification reçue dans App.js:', notif);

      const { _id, title, body, conversationId, conversationType, conversationTitle } = notif;

      setNotifications(prev => {
        if (prev.some(n => n.id === _id)) return prev; 
        const newNotifs = [{ id: _id, title, body, conversationId, conversationType, conversationTitle }, ...prev];
        localStorage.setItem('notifications', JSON.stringify(newNotifs));
        return newNotifs;
      });

      setToastNotifications(prev => [
        ...prev,
        { id: _id, title, body, conversationId, conversationType, conversationTitle }
      ]);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Erreur de connexion Socket.io :', err.message);
    });

    return () => {
      newSocket.off('notification');
      newSocket.off('connect');
      newSocket.off('connect_error');
    };
  }, [user]);

  useEffect(() => {
    if (!user || !user._id) return;
    (async () => {
      try {
        const res = await fetch(`https://reussite-qcms.onrender.com/api/notifications?userId=${user._id}`);
        const data = await res.json();
        const mapped = data.map(n => ({
          id: n._id,
          title: n.title,
          body: n.body,
          conversationId: n.conversationId,
          conversationType: n.conversationType,
          conversationTitle: n.conversationTitle
        }));
        setNotifications(mapped);
        localStorage.setItem('notifications', JSON.stringify(mapped));
      } catch (err) {
        console.error('❌ Erreur chargement notifications:', err);
      }
    })();
  }, [user]);

  const removeNotification = (id) => {
    setNotifications(prev => {
      const newNotifs = prev.filter(n => n.id !== id);
      localStorage.setItem('notifications', JSON.stringify(newNotifs));
      return newNotifs;
    });
    fetch(`https://reussite-qcms.onrender.com/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleNotificationItemClick = (notif) => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard/students');
    } else if (notif.conversationType === 'system') {
      navigate('/profile');
    } else if (notif.conversationId) {
      navigate(
        `/communaute?conversationId=${notif.conversationId}&title=${encodeURIComponent(notif.conversationTitle || '')}&type=${notif.conversationType}`
      );
    }
    removeNotification(notif.id);
  };

  const removeToast = (id) => {
    setToastNotifications((prev) => prev.filter(n => n.id !== id));
  };

  const handleToastClick = (notif) => {
    handleNotificationItemClick(notif);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      {!isAdminRoute && (
        <Navbar 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          notifications={notifications}
          onNotificationClick={handleNotificationItemClick}
        />
      )}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/simulations" element={user && user.isSubscribed ? <StudentSimulation /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        <Route path="/cours" element={user && user.isSubscribed ? <StudentCourseView /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        <Route path="/qcms" element={user && user.isSubscribed ? <QCMs /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        <Route path="/cours/module/:moduleId" element={user && user.isSubscribed ? <StudentModuleDetail /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        <Route path="/profile" element={user && user.isSubscribed ? <StudentProfile /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        <Route path="/quiz/lesson/:quizId" element={user && user.isSubscribed ? <StudentQuizView /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        <Route path="/quiz/exam/:quizId" element={user && user.isSubscribed ? <StudentQuizView /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        <Route path="/communaute" element={user && user.isSubscribed ? <Communaute /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        <Route path="/classement" element={user && user.isSubscribed ? <Classement /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        <Route path="/progression" element={user && user.isSubscribed ? <StudentProgress /> : <Navigate to={user ? "/subscription" : "/auth"} />} />
        
        <Route path="/admin/dashboard/*" element={
          user && user.role === 'admin' 
            ? <AdminDashboard 
                darkMode={darkMode} 
                toggleDarkMode={toggleDarkMode} 
                notifications={notifications}
                onNotificationClick={handleNotificationItemClick}
              /> 
            : <Navigate to="/auth" />
        } />
      </Routes>

      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] space-y-3">
        {toastNotifications.map((notif) => (
          <NotificationToast
            key={notif.id}
            notification={notif}
            onClose={() => removeToast(notif.id)}
            onClick={() => handleToastClick(notif)}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  
  // ✅ CORRECTION ICI : Lecture sécurisée du localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      const parsed = JSON.parse(storedUser);
      // On ne garde que si le rôle existe (sinon c'est des données corrompues)
      if (parsed && parsed.role) return parsed;
      localStorage.removeItem('user');
      return null;
    } catch (err) {
      localStorage.removeItem('user');
      return null;
    }
  });

  // ✅ CORRECTION ICI : Vérification automatique de la session au démarrage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      fetch('https://reussite-qcms.onrender.com/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Session invalide');
        return res.json();
      })
      .then(data => {
        // Mise à jour des données si elles ont changé sur le serveur
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
      })
      .catch(err => {
        console.error('Session expirée:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
      });
    }
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  return (
    <Router>
      <AppContent darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} user={user} />
    </Router>
  );
}

export default App;