const mongoose = require('mongoose');

// سؤال واحد (مدمج داخل الـ Quiz مباشرة)
const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, default: '' },
  explanationImages: [{ type: String }]
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  // type: 'lesson' (QCM par cours), 'module' (Examen par année), 'simulation'
  type: { type: String, enum: ['lesson', 'module', 'simulation'], required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
  year: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  authorName: { type: String, default: 'Inconnu' },
  correctionMode: { type: String, enum: ['immediate', 'deferred'], required: true },
  questions: [QuestionSchema],
  isIA: { type: Boolean, default: false } // ✅ AJOUT : QCM généré par IA
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);