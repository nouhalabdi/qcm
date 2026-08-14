import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  Calendar, 
  MessageSquare, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  Clock // ✅ تمت إضافة Clock هنا
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import logoImg from './assets/logo.png';

function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'Modules', icon: <FolderOpen size={20} />, path: '/admin/dashboard/modules' },
    { name: 'Students', icon: <Users size={20} />, path: '/admin/dashboard/students' },
    { name: 'Simulation', icon: <Clock size={20} />, path: '/admin/dashboard/simulation' },
    
  ];

  return (
    <aside className="w-60 sm:w-64 min-h-screen bg-gradient-to-b from-blue-700 to-blue-400 text-white p-4 sm:p-6 flex flex-col shadow-xl relative overflow-hidden">
      {/* تأثيرات خلفية زخرفية (Glow effect) */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* اللوجو الخاص بالـ Sidebar */}
      <div className="relative z-10 flex items-center gap-2 mb-8 sm:mb-10">
        <img src={logoImg} alt="Logo" className="h-9 sm:h-10 w-auto object-contain bg-white rounded-lg p-1 flex-shrink-0" />
        <div className="leading-tight min-w-0">
          <p className="font-bold text-base sm:text-lg text-white tracking-wide truncate" style={{ fontFamily: "'Times New Roman', Times, serif" }}>RÉUSSITE QCMS</p>
          <p className="text-white/70 text-[9px] sm:text-[10px] tracking-wider truncate" style={{ fontFamily: "'Times New Roman', Times, serif" }}>Avec réussite qcms vous allez réussir</p>
        </div>
      </div>

      {/* القائمة الرئيسية */}
      <nav className="relative z-10 flex-1 space-y-2">
        <p className="text-white/60 text-xs uppercase tracking-wider mb-4">Menu Principal</p>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 ${
                isActive 
                ? 'bg-white text-blue-700 shadow-lg' 
                : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* الجزء السفلي (معلومات الأدمن وزر الخروج) */}
      <div className="relative z-10 mt-auto pt-6 border-t border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center flex-shrink-0">
            <User size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Admin User</p>
            <p className="text-xs text-white/70 truncate">Super Admin</p>
          </div>
        </div>
        <button 
          onClick={() => {
            // نمسحو غير بيانات الجلسة، نخليو device_id ثابت (نفس السبب كيما فـ Navbar.jsx)
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('notifications');
            window.location.href = '/auth';
          }}
          className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 py-2 rounded-xl transition text-sm"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;