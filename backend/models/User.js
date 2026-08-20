// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // --- Informations de base ---
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  year: { type: String, required: true },
  role: { type: String, default: 'student' },
  isSubscribed: { type: Boolean, default: false },
  deviceIds: [{ type: String }],
  pseudo: { type: String, default: '' },
  phone: { type: String, default: '' },
  
  // --- Anciens champs (conservés pour compatibilité) ---
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }], 
  progress: { type: Number, default: 0 },

  // --- Cours favoris et lus ---
  favoriteLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  readLessons: [{
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    readAt: { type: Date, default: Date.now }
  }],
  favoriteQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],

  // --- Notes personnelles sur les QCMs (globales) ---
  quizNotes: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    noteText: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now }
  }],

  // --- Liste des tâches (To-Do List) ---
  todoList: [{ 
    text: String, 
    done: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    notified: { type: Boolean, default: false }
  }],

  // --- Historique des QCMs terminés (avec timeTaken) ---
  completedQuizzes: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    type: { type: String }, // 'lesson', 'module' ou 'simulation'
    score: Number,          // en pourcentage (0-100)
    date: { type: Date, default: Date.now },
    timeTaken: { type: Number, default: 0 }
  }],

  // --- Annotations et surlignages sur les PDF ---
  annotations: [{
    fileUrl: String,
    data: mongoose.Schema.Types.Mixed
  }],

  // --- Fichiers personnalisés de l'étudiant (versions modifiées) ---
  customFiles: [{
    fileUrl: { type: String, required: true },
    originalLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    year: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],

  // ========== NOUVEAUX CHAMPS POUR LES QUESTIONS ==========
  // --- Questions favorites (par QCM et index) ---
  favoriteQuestions: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    questionIndex: { type: Number, required: true }
  }],

  // --- Notes sur des questions spécifiques ---
  questionNotes: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    questionIndex: { type: Number, required: true },
    noteText: { type: String, default: '' }
  }]

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
