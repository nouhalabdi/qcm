import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Layers, Zap, BarChart2, MessageCircle, Users, Monitor, Trophy, Star, Play, 
  ChevronLeft, ChevronRight, X  // ✅ تمت إضافة X هنا
} from 'lucide-react';

import pathwayImg from './assets/pathway.png';
import doctorsImg from './assets/doctors.png';
// افترض أن لديك صورًا في مجلد assets، يمكنك تسميتها مثلاً: slide1.png, slide2.png, ...
import slide1 from './assets/photo22.png';
import slide2 from './assets/photo33.png';
import slide3 from './assets/photo44.png';
import slide4 from './assets/photo55.png';
import slide5 from './assets/photo66.png';
import slide6 from './assets/photo77.png';
import slide7 from './assets/photo88.png';
import slide8 from './assets/photo99.png';
import slide9 from './assets/photo100.png';

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // حالة عرض الشرائح
  const [showCarousel, setShowCarousel] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9]; // يمكنك إضافة المزيد من الصور

  const handleStart = () => {
    if (!user) navigate('/auth');
    else if (!user.isSubscribed) navigate('/subscription');
    else navigate('/cours');
  };

  const handleJoin = () => {
    if (!user) navigate('/auth');
    else if (!user.isSubscribed) navigate('/subscription');
    else navigate('/cours');
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const targetId = location.state?.scrollTo;
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location.state]);

  return (
    <main className="flex-1 bg-white dark:bg-slate-900">

      {/* ---------------- HERO SECTION ---------------- */}
      <section id="hero" className="relative w-full pt-10 sm:pt-16 md:pt-24 lg:pt-32 pb-10 sm:pb-16 md:pb-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 leading-tight">
                Ton parcours aujourd'hui,<br />
                <span className="text-blue-600 dark:text-blue-400">ton succès demain</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Entraîne-toi avec des QCMs, révise tes cours, simule tes examens et suis ta progression jusqu'à devenir un excellent chirurgien-dentiste.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4">
                <button onClick={handleStart} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2">
                  Commencer maintenant <span>→</span>
                </button>
                <button onClick={() => setShowCarousel(true)} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm sm:text-base font-semibold rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-all duration-200 flex items-center gap-2">
                  <Play size={16} className="fill-blue-600 text-blue-600" /> Voir comment ça marche
                </button>
              </div>
            </div>

            <div className="flex-1 lg:flex-[1.3] w-full">
              <img src={pathwayImg} alt="Parcours vers la réussite" className="w-full h-auto max-w-md sm:max-w-xl lg:max-w-none mx-auto object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FEATURES SECTION ---------------- */}
      <section id="services" className="py-10 sm:py-16 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3 text-blue-600 dark:text-blue-400"><BookOpen size={22} /></div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">QCMs corrigés</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Des milliers de QCMs avec corrections.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3 text-green-600 dark:text-green-400"><Layers size={22} /></div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">Cours complets</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tous les cours illustrés et organisés.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3 text-orange-600 dark:text-orange-400"><Zap size={22} /></div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">Simulations</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Examens chronométrés en conditions réelles.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3 text-purple-600 dark:text-purple-400"><BarChart2 size={22} /></div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">Statistiques</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Suis ta progression avec des graphiques.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 text-center col-span-2 sm:col-span-2 md:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 dark:bg-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3 text-pink-600 dark:text-pink-400"><MessageCircle size={22} /></div>
              <h3 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">Communauté</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Échange avec d'autres étudiants.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- STATS SECTION ---------------- */}
      <section id="stats" className="bg-blue-50 dark:bg-slate-800 py-8 sm:py-10 border-y border-blue-100 dark:border-slate-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center sm:justify-around items-center gap-6 md:gap-12">
            <div className="flex items-center gap-3">
              <div className="text-blue-600 dark:text-blue-400"><Users size={28} className="sm:hidden" /><Users size={32} className="hidden sm:block" /></div>
              <div><p className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-300">5000+</p><p className="text-xs text-blue-500/80 dark:text-blue-400/80 font-medium">Étudiants actifs</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-blue-600 dark:text-blue-400"><Monitor size={28} className="sm:hidden" /><Monitor size={32} className="hidden sm:block" /></div>
              <div><p className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-300">20 000+</p><p className="text-xs text-blue-500/80 dark:text-blue-400/80 font-medium">QCMs disponibles</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-blue-600 dark:text-blue-400"><Trophy size={28} className="sm:hidden" /><Trophy size={32} className="hidden sm:block" /></div>
              <div><p className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-300">95%</p><p className="text-xs text-blue-500/80 dark:text-blue-400/80 font-medium">Taux de réussite</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-blue-600 dark:text-blue-400"><Star size={28} className="sm:hidden" /><Star size={32} className="hidden sm:block" /></div>
              <div><p className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-300">4.9/5</p><p className="text-xs text-blue-500/80 dark:text-blue-400/80 font-medium">Note moyenne</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- PLATEFORME SECTION ---------------- */}
      <section id="join" className="bg-white dark:bg-slate-900 py-10 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="w-full bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 rounded-3xl p-6 sm:p-10 lg:p-14 border border-blue-200 dark:border-slate-600 shadow-sm flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300 mb-4">Une plateforme pensée pour ta réussite</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg max-w-xl mx-auto lg:mx-0">Réussite QCMs t'accompagne à chaque étape de ton parcours pour t'aider à atteindre ton rêve de devenir chirurgien-dentiste.</p>
              <button onClick={handleJoin} className="px-6 sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-bold rounded-xl shadow-md transition duration-200">Rejoindre maintenant →</button>
            </div>
            <div className="flex-1 flex justify-center lg:justify-end w-full">
              <img src={doctorsImg} alt="Chirurgiens-dentistes" className="w-full max-w-[220px] sm:max-w-sm h-auto object-contain drop-shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 py-6 sm:py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-lg sm:text-xl">Réussite QCMs</span>
            <span className="text-gray-400 text-xs sm:text-sm">- Tous droits réservés © 2026</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span>Développé par</span>
            <a href="https://www.facebook.com/profile.php?id=61590728369782" target="_blank" rel="noopener noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full font-medium transition duration-200 shadow-sm">NL dev</a>
          </div>
        </div>
      </footer>

      {/* ---------------- CAROUSEL MODAL ---------------- */}
      {showCarousel && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full p-4 sm:p-6 relative max-h-[95vh] overflow-y-auto">
            <button onClick={() => setShowCarousel(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-red-500 hover:text-red-700"><X size={22} /></button>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800 dark:text-white mb-4 text-center pr-6">Comment ça marche ?</h3>
            <div className="relative flex items-center justify-center">
              <button onClick={prevSlide} className="absolute left-0 z-10 p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"><ChevronLeft size={20} /></button>
              <div className="w-full overflow-hidden rounded-lg">
                <img src={slides[currentSlide]} alt={`Slide ${currentSlide + 1}`} className="w-full h-auto max-h-[45vh] sm:max-h-[60vh] object-contain" />
              </div>
              <button onClick={nextSlide} className="absolute right-0 z-10 p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"><ChevronRight size={20} /></button>
            </div>
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${i === currentSlide ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default Home;