import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from './firebase';
import logoImg from './assets/logo.png';

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    year: '',
    phone: ''  // ✅ إضافة حقل الهاتف
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? 'login' : 'register';
    const deviceId = getDeviceId();

    const body = isLogin 
      ? { email: formData.email, password: formData.password, deviceId }
      : { 
          username: formData.name, 
          email: formData.email, 
          password: formData.password, 
          year: formData.year,
          phone: formData.phone  // ✅ إرسال رقم الهاتف
        };

    try {
      const response = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erreur de connexion au serveur');
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (!data.user.isSubscribed) {
          window.location.href = '/subscription';
        } else {
          window.location.href = '/';
        }
      } else {
        alert('Compte créé avec succès ! Connectez-vous maintenant.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const userData = await signInWithGoogle();
      
      const deviceId = getDeviceId();
      
      const response = await fetch('https://reussite-qcmss-1nc7.onrender.com/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          displayName: userData.displayName,
          deviceId
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (!data.user.isSubscribed) {
        window.location.href = '/subscription';
      } else {
        window.location.href = '/';
      }

    } catch (error) {
      setError("Erreur lors de la connexion avec Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto min-h-[480px]">
        <div className="w-full md:w-[45%] bg-gradient-to-br from-blue-700 to-indigo-800 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoImg} alt="Logo" className="h-9 w-auto object-contain bg-white rounded-lg p-1" />
              <span className="text-2xl font-bold font-serif text-blue-100">Réussite</span>
              <span className="text-2xl font-bold text-white tracking-tighter">QCMs</span>
            </div>
            <h2 className="text-2xl font-medium font-sans mb-4 leading-relaxed text-blue-50 mt-4">
              {isLogin ? "Connectez-vous" : "Rejoignez la communauté"}
            </h2>
            <ul className="space-y-2 text-blue-100/90 text-sm leading-relaxed">
              <li className="flex items-start gap-3"><span className="mt-1 text-white bg-blue-500/30 p-1 rounded-full text-[10px]">✓</span><span>Accédez à des milliers de QCMs corrigés.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 text-white bg-blue-500/30 p-1 rounded-full text-[10px]">✓</span><span>Suivez votre progression en temps réel.</span></li>
              <li className="flex items-start gap-3"><span className="mt-1 text-white bg-blue-500/30 p-1 rounded-full text-[10px]">✓</span><span>Révisez avec des simulations d'examens.</span></li>
            </ul>
          </div>
          <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-sm p-4 rounded-xl text-sm text-blue-100 border border-white/20">
            <div className="flex -space-x-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-blue-300 border-2 border-white"></div>
              <div className="w-6 h-6 rounded-full bg-blue-400 border-2 border-white"></div>
              <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white"></div>
              <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white"></div>
            </div>
            <p>Rejoignez <span className="font-bold text-white">5000</span> étudiants.</p>
          </div>
        </div>

        <div className="w-full md:w-[55%] p-6 md:p-8 flex flex-col justify-center">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-sans">
              {isLogin ? "Connexion" : "Inscription"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-light">
              {isLogin ? "Bienvenue ! Entrez vos identifiants." : "Créez votre compte pour commencer."}
            </p>
          </div>
          <div className="flex rounded-full bg-gray-100 dark:bg-slate-700 p-1 mb-4 shadow-inner">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-full text-xs font-medium transition-all duration-300 ${isLogin ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Connexion</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-full text-xs font-medium transition-all duration-300 ${!isLogin ? 'bg-white dark:bg-slate-800 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Inscription</button>
          </div>
          {error && (<div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-200 dark:border-red-800">{error}</div>)}
          
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name" className="block text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wider">
                    Nom complet
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-gray-400 text-sm"
                    placeholder="Entrez votre nom"
                  />
                </div>
                <div>
                  <label htmlFor="year" className="block text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wider">
                    Année d'étude
                  </label>
                  <select
                    id="year"
                    name="year"
                    autoComplete="off"
                    required
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                  >
                    <option value="">Choisir Votre année</option>
                    <option value="1ère Année">1ère Année</option>
                    <option value="2ème Année">2ème Année</option>
                    <option value="3ème Année">3ème Année</option>
                    <option value="4ème Année">4ème Année</option>
                    <option value="5ème Année">5ème Année</option>
                  </select>
                </div>
                {/* ✅ إضافة حقل رقم الهاتف */}
                <div>
                  <label htmlFor="phone" className="block text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wider">
                    Numéro de téléphone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-gray-400 text-sm"
                    placeholder="05XX-XX-XX-XX"
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="block text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-gray-400 text-sm"
                placeholder="exemple@gmail.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[10px] font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wider">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-gray-400 text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all duration-300 shadow-blue-600/20 text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-slate-600"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-3 bg-white dark:bg-slate-800 text-gray-400">OU</span></div>
          </div>
          <button onClick={handleGoogleLogin} className="mt-3 w-full py-2 border border-gray-200 dark:border-slate-600 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition bg-white dark:bg-slate-800">
            <GoogleIcon />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Continuer avec Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;