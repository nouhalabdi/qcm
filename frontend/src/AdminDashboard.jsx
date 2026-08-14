import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, FolderOpen, FileQuestion, Settings, Bell, Search, Menu, X, Sun, Moon } from 'lucide-react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import AdminModules from './AdminModules';
import AdminStudents from './AdminStudents';
import AdminModuleContent from './AdminModuleContent';
import AdminSimulation from './AdminSimulation';

// ✅ مكون قائمة الإشعارات للأدمن (جرس خاص)
function AdminNotificationDropdown({ notifications, onNotificationClick }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition"
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[88vw] max-w-xs sm:w-80 sm:max-w-none bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-[9999] max-h-[70vh] sm:max-h-[400px] flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-white text-sm">Notifications</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-4">Aucune notification</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    onNotificationClick(notif);
                    setIsOpen(false);
                  }}
                  className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-slate-700 transition text-sm"
                >
                  <p className="font-semibold text-slate-800 dark:text-white">{notif.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{notif.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ darkMode, toggleDarkMode, notifications, onNotificationClick }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // ✅ عند الضغط على إشعار، نستعمل الدالة الموحدة من App.js (تنقل + تحذف)
  const handleNotificationClick = (notif) => {
    onNotificationClick?.(notif);
  };

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubscribed: 0,
    totalModules: 0,
    totalQuizQuestions: 0,
    monthlyRegistrations: []
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetch('https://reussite-qcms.onrender.com/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoadingStats(false);
      })
      .catch(err => {
        console.error('Erreur lors du chargement des statistiques :', err);
        setLoadingStats(false);
      });
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 relative">
      
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 fixed top-0 left-0 md:sticky md:top-0 z-40 h-screen overflow-y-auto`}>
        <Sidebar />
      </div>

      <main className="flex-1 flex flex-col w-full min-w-0">
        
        <header className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 p-3 px-4 sm:p-4 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-30">
          <div className="flex items-center gap-4 w-full max-w-md ml-10 md:ml-0 min-w-0">
            <div className="relative w-full hidden xs:block sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* ✅ جرس الأدمن الخاص */}
            <AdminNotificationDropdown 
              notifications={notifications} 
              onNotificationClick={handleNotificationClick} 
            />

            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-slate-700">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                A
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Admin</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            
            <Routes>
              <Route path="/" element={
                <>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 sm:mb-8 gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Bienvenue sur votre tableau de bord de gestion.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <Settings size={20} className="text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Total Étudiants</p>
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-1">
                            {loadingStats ? '...' : stats.totalStudents.toLocaleString()}
                          </h3>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500"><Users size={22} /></div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Étudiants Abonnés</p>
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-1">
                            {loadingStats ? '...' : stats.totalSubscribed.toLocaleString()}
                          </h3>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-500"><UserCheck size={22} /></div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Total Modules</p>
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-1">
                            {loadingStats ? '...' : stats.totalModules.toLocaleString()}
                          </h3>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-500"><FolderOpen size={22} /></div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Total QCMs</p>
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-1">
                            {loadingStats ? '...' : stats.totalQuizQuestions.toLocaleString()}
                          </h3>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-500"><FileQuestion size={22} /></div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white">Évolution (7 derniers mois)</h3>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1 text-green-500"><span className="w-2 h-2 rounded-full bg-green-500"></span> Étudiants inscrits</span>
                          <span className="flex items-center gap-1 text-blue-500"><span className="w-2 h-2 rounded-full bg-blue-500"></span> QCMs ajoutés</span>
                        </div>
                      </div>
                      <div className="h-[200px] sm:h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats.monthlyRegistrations} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorQuizzes" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} allowDecimals={false} width={30} />
                            <Tooltip />
                            <Area type="monotone" dataKey="students" name="Étudiants inscrits" stroke="#82ca9d" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={2} />
                            <Area type="monotone" dataKey="quizzes" name="QCMs ajoutés" stroke="#3b82f6" fillOpacity={1} fill="url(#colorQuizzes)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              } />

              <Route path="modules" element={<AdminModules />} />
              <Route path="simulation" element={<AdminSimulation />} />
              <Route path="module/:moduleId" element={<AdminModuleContent />} />
              <Route path="students" element={<AdminStudents />} />
            </Routes>

          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;