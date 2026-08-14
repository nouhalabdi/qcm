import React from 'react';

function Subscription() {
  const handleTelegram = () => {
    window.open('https://t.me/futurdrm', '_blank');
  };

  const handleRequestActivation = async () => {
    alert("Votre demande a été envoyée à l'administrateur. Veuillez attendre l'approbation.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-lg text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4">Abonnement requis</h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
          Pour accéder aux cours, aux QCMs et aux examens, vous devez activer votre abonnement. <br />
          Veuillez contacter l'administrateur via Telegram pour payer et activer votre compte.
        </p>
        <div className="space-y-4">
          <button onClick={handleTelegram} className="w-full py-3 bg-[#0088cc] hover:bg-[#0077b3] text-white text-sm sm:text-base rounded-lg font-bold flex items-center justify-center gap-2 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span className="truncate">Contacter l'Admin sur Telegram</span>
          </button>
          <button onClick={handleRequestActivation} className="w-full py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm sm:text-base rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition">
            J'ai déjà payé (Activer mon compte)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Subscription;