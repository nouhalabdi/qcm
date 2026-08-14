import React, { useState } from 'react';
import { Moon, Sun, Menu, X, Bell } from 'lucide-react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from './assets/logo.png';

function Navbar({ darkMode, toggleDarkMode, notifications, onNotificationClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user'));
  const isLoggedIn = !!user;

  const handleNotificationClick = (notif) => {
    setIsNotifOpen(false);
    onNotificationClick?.(notif);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('notifications');
    navigate('/auth');
    window.location.reload();
  };

  const activeClass = "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1";
  const normalClass = "text-black dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors pb-1";

  const goHome = () => {
    setIsMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById('hero');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const scrollToSection = (sectionId) => {
    setIsMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-slate-800">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={logoImg} alt="Logo" className="h-8 sm:h-10 w-auto object-contain" />
          <div className="leading-tight block">
            <p className="font-bold text-xs sm:text-lg text-slate-900 dark:text-white tracking-wide" style={{ fontFamily: "'Times New Roman', Times, serif" }}>RÉUSSITE QCMS</p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-base font-medium">
          {isLoggedIn ? (
            <>
              <NavLink to="/" className={({ isActive }) => isActive ? activeClass : normalClass}>Accueil</NavLink>
              <NavLink to="/profile" className={({ isActive }) => isActive ? activeClass : normalClass}>Mon Profil</NavLink>
              <NavLink to="/progression" className={({ isActive }) => isActive ? activeClass : normalClass}>Mon Progrès</NavLink>
              <NavLink to="/simulations" className={({ isActive }) => isActive ? activeClass : normalClass}>Simulations</NavLink>
              <NavLink to="/classement" className={({ isActive }) => isActive ? activeClass : normalClass}>Classement</NavLink>
              <NavLink to="/communaute" className={({ isActive }) => isActive ? activeClass : normalClass}>Communauté</NavLink>
            </>
          ) : (
            <>
              <button onClick={goHome} className={normalClass}>Accueil</button>
              <button onClick={() => scrollToSection('services')} className={normalClass}>Nos Services</button>
              <button onClick={() => scrollToSection('stats')} className={normalClass}>Nos Chiffres</button>
              <button onClick={() => scrollToSection('join')} className={normalClass}>Rejoindre</button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <button onClick={toggleDarkMode} className="p-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            {darkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>
          
          {isLoggedIn && (
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <Bell size={22} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden z-[9999] max-h-[400px] flex flex-col">
                  <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-white text-sm">Notifications</span>
                    <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-slate-400 text-sm py-4">Aucune notification</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
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
          )}
          
          {isLoggedIn ? (
            <button onClick={handleLogout} className="hidden md:block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition">
              Se déconnecter
            </button>
          ) : (
            <Link to="/auth" className="hidden md:block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition">
              Se connecter
            </Link>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-lg p-4 z-50 flex flex-col gap-3">
          {isLoggedIn ? (
            <>
              <NavLink to="/" className="text-base font-medium text-black dark:text-white hover:text-blue-600 transition" onClick={() => setIsMenuOpen(false)}>Accueil</NavLink>
              <NavLink to="/profile" className="text-base font-medium text-black dark:text-white hover:text-blue-600 transition" onClick={() => setIsMenuOpen(false)}>Mon Profil</NavLink>
              <NavLink to="/progression" className={({ isActive }) => isActive ? activeClass : normalClass} onClick={() => setIsMenuOpen(false)}>Mon Progrès</NavLink> 
              <NavLink to="/simulations" className="text-base font-medium text-black dark:text-white hover:text-blue-600 transition" onClick={() => setIsMenuOpen(false)}>Simulations</NavLink>
              <NavLink to="/classement" className="text-base font-medium text-black dark:text-white hover:text-blue-600 transition" onClick={() => setIsMenuOpen(false)}>Classement</NavLink>
              <NavLink to="/communaute" className="text-base font-medium text-black dark:text-white hover:text-blue-600 transition" onClick={() => setIsMenuOpen(false)}>Communauté</NavLink>
              <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg shadow-md transition w-full text-center">
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <button onClick={goHome} className="text-left text-base font-medium text-black dark:text-white hover:text-blue-600 transition">Accueil</button>
              <button onClick={() => scrollToSection('services')} className="text-left text-base font-medium text-black dark:text-white hover:text-blue-600 transition">Nos Services</button>
              <button onClick={() => scrollToSection('stats')} className="text-left text-base font-medium text-black dark:text-white hover:text-blue-600 transition">Nos Chiffres</button>
              <button onClick={() => scrollToSection('join')} className="text-left text-base font-medium text-black dark:text-white hover:text-blue-600 transition">Rejoindre</button>
              <Link to="/auth" className="mt-2 block text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-md transition" onClick={() => setIsMenuOpen(false)}>
                Se connecter
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
export default Navbar;