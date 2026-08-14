import React, { useState, useEffect } from 'react';
import { Clock, Save, ArrowLeft, Trash2, CheckCircle, XCircle, Users, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function AdminSimulation() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ year: '1ère Année', semester: 'Semestre 1' });
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [simulations, setSimulations] = useState([]);
  const [loadingSims, setLoadingSims] = useState(false);
  const [form, setForm] = useState({ title: '', durationMinutes: 30, questions: [] });
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rankingData, setRankingData] = useState(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch(`https://reussite-qcms.onrender.com/api/modules?year=${filters.year}&semester=${filters.semester}`);
        const data = await res.json();
        setModules(data);
      } catch (err) { console.error(err); }
    };
    fetchModules();
  }, [filters.year, filters.semester]);

  useEffect(() => {
    if (!selectedModule) { setSimulations([]); return; }
    const fetchSimulations = async () => {
      setLoadingSims(true);
      try {
        const res = await fetch(`https://reussite-qcms.onrender.com/api/quizzes?moduleId=${selectedModule}&type=simulation`);
        const data = await res.json();
        setSimulations(data);
      } catch (err) { console.error(err); } finally { setLoadingSims(false); }
    };
    fetchSimulations();
  }, [selectedModule]);

  const handleImportJson = () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('JSON invalide.');
      const validQuestions = parsed.map(q => {
        const questionText = q.question || q.questionText || '';
        if (!questionText) throw new Error('Champ question manquant.');
        if (!Array.isArray(q.options) || q.options.length < 2) throw new Error('Options invalides.');
        let correctAnswer = q.correctAnswer || (q.correctAnswers?.[0]);
        if (!correctAnswer) throw new Error('Réponse correcte manquante.');
        if (!q.options.includes(correctAnswer)) throw new Error('Réponse correcte non dans les options.');
        return { id: Date.now().toString(36) + Math.random().toString(36).substring(2), questionText, options: q.options, correctAnswer, explanation: q.solutionText || q.explanation || '', explanationImages: Array.isArray(q.photo) ? q.photo : (q.photo ? [q.photo] : []) };
      });
      setForm(prev => ({ ...prev, questions: validQuestions }));
      setJsonInput('');
      alert(`${validQuestions.length} question(s) importée(s).`);
    } catch (err) { setJsonError(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModule) return alert('Veuillez sélectionner un module.');
    if (form.questions.length === 0) return alert('Veuillez importer au moins une question.');
    setLoading(true);
    try {
      const payload = { type: 'simulation', moduleId: selectedModule, year: filters.year, durationMinutes: form.durationMinutes, authorName: 'Admin', correctionMode: 'deferred', questions: form.questions.map(({ id, ...rest }) => rest) };
      const res = await fetch('https://reussite-qcms.onrender.com/api/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        alert('Simulation créée avec succès !');
        setForm({ title: '', durationMinutes: 30, questions: [] });
        setJsonInput('');
        const refreshRes = await fetch(`https://reussite-qcms.onrender.com/api/quizzes?moduleId=${selectedModule}&type=simulation`);
        setSimulations(await refreshRes.json());
      } else { const errorData = await res.json(); alert(`Erreur: ${errorData.message}`); }
    } catch (err) { alert('Erreur réseau.'); } finally { setLoading(false); }
  };

  const handleDelete = async (simId) => {
    if (!window.confirm('Supprimer cette simulation ?')) return;
    try {
      const res = await fetch(`https://reussite-qcms.onrender.com/api/quizzes/${simId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Supprimée avec succès.');
        const refreshRes = await fetch(`https://reussite-qcms.onrender.com/api/quizzes?moduleId=${selectedModule}&type=simulation`);
        setSimulations(await refreshRes.json());
      } else alert('Erreur lors de la suppression.');
    } catch (err) { alert('Erreur réseau.'); }
  };

  const fetchRanking = async (simId) => {
    try {
      const res = await fetch(`https://reussite-qcms.onrender.com/api/quizzes/${simId}/ranking`);
      setRankingData(await res.json());
    } catch (err) { console.error(err); alert('Erreur de chargement du classement.'); }
  };

  const removeQuestion = (id) => setForm({ ...form, questions: form.questions.filter(q => q.id !== id) });

  return (
    <div className="p-6 max-w-4xl mx-auto text-slate-900 dark:text-white">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/dashboard')} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition text-slate-700 dark:text-white">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Créer une Simulation (JSON)</h2>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">Année</label>
          <select value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})} className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            {['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">Semestre</label>
          <select value={filters.semester} onChange={(e) => setFilters({...filters, semester: e.target.value})} className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="Semestre 1">Semestre 1</option>
            <option value="Semestre 2">Semestre 2</option>
          </select>
        </div>
      </div>

      {/* Choix module */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Choisir un Module</label>
        <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">-- Sélectionnez un module --</option>
          {modules.map(m => <option key={m._id} value={m._id}>{m.title} ({m.year})</option>)}
        </select>
      </div>

      {/* Liste des simulations existantes */}
      {selectedModule && (
        <div className="mb-8 bg-white dark:bg-slate-800 p-4 rounded-xl shadow border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Users size={20} className="text-blue-600 dark:text-blue-400" /> Simulations existantes</h3>
          {loadingSims ? <p className="text-slate-500 dark:text-slate-400">Chargement...</p> : simulations.length === 0 ? <p className="text-slate-500 dark:text-slate-400 text-center py-4">Aucune simulation créée.</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulations.map(sim => (
                <div key={sim._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900/50">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{sim.title || sim.year}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{sim.questions?.length || 0} Questions • {sim.durationMinutes} min</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => fetchRanking(sim._id)} className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition" title="Voir classement"><BarChart2 size={16} /></button>
                    <button onClick={() => handleDelete(sim._id)} className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition" title="Supprimer"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedModule && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-700 pb-4">
            <Clock size={20} className="text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Créer une nouvelle Simulation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Titre</label>
              <input type="text" className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Durée (min)</label>
              <input type="number" className="w-full p-2 border rounded bg-slate-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" value={form.durationMinutes} onChange={(e) => setForm({...form, durationMinutes: parseInt(e.target.value) || 0})} min="1" required />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <h4 className="font-bold text-slate-800 dark:text-white mb-2">Importer les questions (JSON)</h4>
            <textarea rows="8" className="w-full p-3 border rounded bg-slate-50 dark:bg-slate-900 text-sm font-mono border-gray-300 dark:border-slate-600 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder='[{ "question": "...", "options": ["A", "B"], "correctAnswer": "A" }]' value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} />
            <button type="button" onClick={handleImportJson} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow text-sm transition">Importer</button>
            {jsonError && <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs p-2 rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"><XCircle size={14} /> {jsonError}</div>}
            {form.questions.length > 0 && !jsonError && <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400 text-xs p-2 rounded border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"><CheckCircle size={14} /> {form.questions.length} question(s).</div>}
          </div>

          {form.questions.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Aperçu</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {form.questions.map(q => (
                  <div key={q.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{q.questionText}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Options: {q.options.join(' • ')}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">✅ {q.correctAnswer}</p>
                    </div>
                    <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow">{loading ? 'Création...' : <><Save size={18} className="inline mr-2" /> Enregistrer</>}</button>
        </form>
      )}

      {/* نافذة الترتيب للأدمن */}
      {rankingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Résultats des étudiants</h3>
              <button onClick={() => setRankingData(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><XCircle size={22} /></button>
            </div>
            <div className="space-y-3">
              {rankingData.length === 0 ? <p className="text-center text-slate-500 dark:text-slate-400">Aucun étudiant.</p> : rankingData.map((student, index) => (
                <div key={student.userId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-400 text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-orange-400 text-black' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{student.username}</p>
                      {student.pseudo && <p className="text-xs text-blue-600 dark:text-blue-400">@{student.pseudo}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400">{student.score}%</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{student.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSimulation;