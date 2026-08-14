const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }], // الخيارات: A, B, C, D
  correctAnswer: { type: String, required: true }, // الإجابة الصحيحة
  explanation: { type: String, default: '' }, // شرح الأدمن للاجابة
  explanationImages: [{ type: String }], // صور للشرح (لأنك طلبت صور في الشرح)
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }, // إذا كان هذا السؤال تابع لدرس معين
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' } // أو إذا كان تابعاً لامتحان
}, { timestamps: true });

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);