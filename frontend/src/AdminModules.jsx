import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Edit, X } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

function AdminModules() {
  // État de filtrage (année et semestre)
  const [filters, setFilters] = useState({ year: '1ère Année', semester: 'Semestre 1' });
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    year: '1ère Année',
    semester: 'Semestre 1',
    imageUrl: ''
  });

  // États pour le modal d'édition
  const [isEditModuleOpen, setIsEditModuleOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);

  const moduleListRef = useRef(null);

  // Récupération des modules
  const fetchModules = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/modules?year=${filters.year}&semester=${filters.semester}`);
      const data = await res.json();
      setModules(data);
    } catch (err) {
      console.error(err);
    }
  }, [filters.year, filters.semester]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Ajouter un module
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (res.ok) {
        alert('Module ajouté avec succès !');
        setForm({ title: '', description: '', year: filters.year, semester: filters.semester, imageUrl: '' });
        await fetchModules();
        if (moduleListRef.current) {
          moduleListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        alert(data.message || 'Erreur lors de l\'ajout.');
      }
    } catch (err) {
      alert('Erreur réseau lors de l\'ajout.');
    }
  };

  // Supprimer un module
  const handleDelete = async (moduleId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce module ?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/modules/${moduleId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Module supprimé avec succès !');
        await fetchModules();
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch (err) {
      alert('Erreur réseau lors de la suppression.');
    }
  };

  // Modifier un module
  const handleModuleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/modules/${editingModule._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingModule)
      });
      if (res.ok) {
        alert('Module modifié avec succès !');
        setIsEditModuleOpen(false);
        setEditingModule(null);
        await fetchModules();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Erreur lors de la modification.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-slate-900 dark:text-white">Gestion des Modules (Unités)</h2>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md mb-6 space-y-4 border border-gray-200 dark:border-slate-700">
        <h3 className="text-lg sm:text-xl font-bold mb-4 text-slate-800 dark:text-white">Ajouter un nouveau Module</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Titre du module (ex: Anatomie)"
            required
            className="p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
          />
          <input
            type="text"
            placeholder="Lien de l'image (URL)"
            className="p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={form.imageUrl}
            onChange={(e) => setForm({...form, imageUrl: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            className="p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={form.year}
            onChange={(e) => setForm({...form, year: e.target.value})}
          >
            {['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            className="p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={form.semester}
            onChange={(e) => setForm({...form, semester: e.target.value})}
          >
            <option value="Semestre 1">Semestre 1</option>
            <option value="Semestre 2">Semestre 2</option>
          </select>
        </div>

        <textarea
          placeholder="Description du module"
          rows="2"
          className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          value={form.description}
          onChange={(e) => setForm({...form, description: e.target.value})}
        ></textarea>
        <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition">Ajouter le module</button>
      </form>

      {/* Section filtrage */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Année</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({...filters, year: e.target.value})}
            className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            {['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année'].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Semestre</label>
          <select
            value={filters.semester}
            onChange={(e) => setFilters({...filters, semester: e.target.value})}
            className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          >
            <option value="Semestre 1">Semestre 1</option>
            <option value="Semestre 2">Semestre 2</option>
          </select>
        </div>
      </div>

      {/* Affichage des modules */}
      <div ref={moduleListRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {modules.map((module) => (
          <div key={module._id} className="bg-blue-50 dark:bg-slate-800 p-4 rounded-xl shadow border border-blue-100 dark:border-slate-700 hover:shadow-lg transition relative group">

            {/* Bouton Modifier */}
            <button
              onClick={() => {
                setEditingModule(module);
                setIsEditModuleOpen(true);
              }}
              className="absolute top-2 right-10 p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
              title="Modifier ce module"
            >
              <Edit size={16} />
            </button>

            {/* Bouton Supprimer */}
            <button
              onClick={() => handleDelete(module._id)}
              className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition opacity-100 md:opacity-0 md:group-hover:opacity-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              title="Supprimer ce module"
            >
              <Trash2 size={16} />
            </button>

            {/* ✅ تعديل عرض الصورة: إذا كانت imageUrl موجودة، تظهر، وإلا لا يظهر شيء */}
            <div className="w-full h-32 bg-gray-100 dark:bg-slate-700 rounded-lg mb-3 overflow-hidden">
              {module.imageUrl ? (
                <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400 pr-16">{module.title}</h4>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{module.year}</span>
              {module.semester === 'Semestre 1' ? (
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded font-semibold">S1</span>
              ) : (
                <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded font-semibold">S2</span>
              )}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{module.description}</p>

            <div className="mt-4 flex justify-between items-center border-t border-gray-100 dark:border-slate-700 pt-3">
              <span className="text-xs text-slate-400 dark:text-slate-500">Cliquez pour voir les cours</span>
              <RouterLink to={`/admin/dashboard/module/${module._id}`} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                Voir les cours →
              </RouterLink>
            </div>
          </div>
        ))}
      </div>

      {/* Modal d'édition du module */}
      {isEditModuleOpen && editingModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">Modifier le Module</h3>
              <button onClick={() => setIsEditModuleOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleModuleEditSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Titre du module"
                required
                className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={editingModule.title}
                onChange={(e) => setEditingModule({...editingModule, title: e.target.value})}
              />
              <input
                type="text"
                placeholder="Lien de l'image (URL)"
                className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={editingModule.imageUrl}
                onChange={(e) => setEditingModule({...editingModule, imageUrl: e.target.value})}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingModule.year}
                  onChange={(e) => setEditingModule({...editingModule, year: e.target.value})}
                >
                  {['1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={editingModule.semester}
                  onChange={(e) => setEditingModule({...editingModule, semester: e.target.value})}
                >
                  <option value="Semestre 1">Semestre 1</option>
                  <option value="Semestre 2">Semestre 2</option>
                </select>
              </div>
              <textarea
                placeholder="Description du module"
                rows="3"
                className="w-full p-2 border rounded bg-gray-50 dark:bg-slate-900 border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={editingModule.description}
                onChange={(e) => setEditingModule({...editingModule, description: e.target.value})}
              ></textarea>
              <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition">
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminModules;