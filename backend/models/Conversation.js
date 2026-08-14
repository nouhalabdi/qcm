const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  // ✅ ajout de 'quiz' dans l'enum
  type: { type: String, enum: ['direct', 'group', 'quiz'], required: true },

  // ✅ pour les conversations directes (étudiants)
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ✅ pour les groupes de module
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },

  // ✅ AJOUT : pour les discussions autour d'un QCM
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },

  year: { type: String },
  title: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);