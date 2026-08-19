const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Module = require('../models/Module');
const Quiz = require('../models/Quiz');
const { notifyUser } = require('../utils/notify');

// 1. Liste des étudiants de la même année
router.get('/students', async (req, res) => {
  try {
    const { year, userId } = req.query;
    if (!year) return res.status(400).json({ message: 'Année manquante.' });
    const filter = { role: { $ne: 'admin' }, year };
    if (userId) filter._id = { $ne: userId };
    const students = await User.find(filter).select('username pseudo year email createdAt');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Liste des modules (groupes) de la même année
router.get('/modules-groups', async (req, res) => {
  try {
    const { year, semester } = req.query;
    if (!year) return res.status(400).json({ message: 'Année manquante.' });
    const filter = { year };
    if (semester) filter.semester = semester;
    const modules = await Module.find(filter).select('title year semester imageUrl');
    res.json(modules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Créer ou récupérer une conversation directe
router.post('/conversations/direct', async (req, res) => {
  try {
    const { userId, otherUserId } = req.body;
    if (!userId || !otherUserId) return res.status(400).json({ message: 'Identifiants manquants.' });
    if (userId === otherUserId) return res.status(400).json({ message: 'Action invalide.' });

    let conv = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [userId, otherUserId], $size: 2 }
    });
    if (!conv) {
      conv = new Conversation({ type: 'direct', participants: [userId, otherUserId] });
      await conv.save();
    }
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Créer ou récupérer une conversation de groupe pour un module
router.get('/conversations/module/:moduleId', async (req, res) => {
  try {
    let conv = await Conversation.findOne({ type: 'group', moduleId: req.params.moduleId });
    if (!conv) {
      const mod = await Module.findById(req.params.moduleId);
      if (!mod) return res.status(404).json({ message: 'Module non trouvé.' });
      conv = new Conversation({ type: 'group', moduleId: mod._id, year: mod.year, title: mod.title });
      await conv.save();
    }
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4bis. Créer ou récupérer une conversation pour un QCM
router.get('/conversations/quiz/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    let conv = await Conversation.findOne({ type: 'quiz', quizId });
    if (!conv) {
      const quiz = await Quiz.findById(quizId).populate('moduleId');
      if (!quiz) return res.status(404).json({ message: 'Quiz non trouvé.' });
      conv = new Conversation({ type: 'quiz', quizId, year: quiz.year, title: `Discussion - ${quiz.title || quiz.year}` });
      await conv.save();
    }
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Liste des conversations de l'utilisateur
router.get('/conversations', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'Identifiant manquant.' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const directConvs = await Conversation.find({ type: 'direct', participants: userId })
      .populate('participants', 'username pseudo');
    const modules = await Module.find({ year: user.year }).select('_id');
    const moduleIds = modules.map(m => m._id);
    const groupConvs = await Conversation.find({ type: 'group', moduleId: { $in: moduleIds } });
    const quizConvs = await Conversation.find({ type: 'quiz' }).populate('quizId', 'title year');

    const allConvs = [...directConvs, ...groupConvs, ...quizConvs];

    const lastReadMap = {};
    (user.lastReadConversations || []).forEach(r => { lastReadMap[r.conversationId.toString()] = r.date; });

    const results = await Promise.all(allConvs.map(async (conv) => {
      const lastMsg = await Message.findOne({ conversationId: conv._id }).sort({ createdAt: -1 });
      const lastRead = lastReadMap[conv._id.toString()] || new Date(0);
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        createdAt: { $gt: lastRead },
        senderId: { $ne: userId }
      });

      let displayTitle = conv.title;
      if (conv.type === 'direct') {
        const other = conv.participants.find(p => p._id.toString() !== userId);
        displayTitle = other ? (other.pseudo || other.username) : 'Utilisateur';
      } else if (conv.type === 'quiz' && conv.quizId) {
        displayTitle = `💬 ${conv.quizId.title || 'QCM'}`;
      }

      return {
        _id: conv._id,
        type: conv.type,
        moduleId: conv.moduleId,
        quizId: conv.quizId,
        title: displayTitle,
        lastMessage: lastMsg ? { text: lastMsg.text, date: lastMsg.createdAt, hasAttachment: (lastMsg.attachments || []).length > 0 } : null,
        unreadCount
      };
    }));

    results.sort((a, b) => new Date(b.lastMessage?.date || 0) - new Date(a.lastMessage?.date || 0));
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 6. Récupérer les messages d'une conversation
router.get('/messages/:conversationId', async (req, res) => {
  try {
    const messages = await Message.find({ conversationId: req.params.conversationId })
      .populate('senderId', 'username pseudo')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 7. Envoyer un message
router.post('/messages', async (req, res) => {
  try {
    const { conversationId, senderId, text, attachments } = req.body;
    if (!conversationId || !senderId) return res.status(400).json({ message: 'Champs manquants.' });
    if (!text?.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message vide.' });
    }
    const msg = new Message({ conversationId, senderId, text: text || '', attachments: attachments || [] });
    await msg.save();
    await msg.populate('senderId', 'username pseudo');

    const io = req.app.get('io');
    io.to(conversationId).emit('new-message', msg);

    const conv = await Conversation.findById(conversationId);
    if (conv) {
      let recipientIds = [];
      if (conv.type === 'direct') {
        recipientIds = conv.participants.map(p => p.toString()).filter(id => id !== senderId);
      } else if (conv.type === 'group') {
        const mod = await Module.findById(conv.moduleId);
        if (mod) {
          const students = await User.find({ year: mod.year, role: { $ne: 'admin' }, _id: { $ne: senderId } }).select('_id');
          recipientIds = students.map(s => s._id.toString());
        }
      } else if (conv.type === 'quiz') {
        const quiz = await Quiz.findById(conv.quizId);
        if (quiz) {
          const students = await User.find({ year: quiz.year, role: { $ne: 'admin' }, _id: { $ne: senderId } }).select('_id');
          recipientIds = students.map(s => s._id.toString());
        }
      }

      const senderName = msg.senderId?.pseudo || msg.senderId?.username || 'Un étudiant';
      const title = conv.type === 'group' ? conv.title : `${senderName} a envoyé un message`;
      const body = conv.type === 'direct' ? `De : ${senderName}` : `${senderName} : ${msg.text || 'Pièce jointe'}`;

      for (const uid of recipientIds) {
        try { await notifyUser(io, uid, { title, body, conversationId: conv._id, conversationType: conv.type, conversationTitle: conv.title }); } catch (e) { console.error('Erreur notification :', e); }
      }
    }
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 8. Ajouter / Retirer un like
router.put('/messages/:messageId/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: 'Message non trouvé.' });
    const idx = msg.likes.findIndex(id => id.toString() === userId);
    if (idx > -1) msg.likes.splice(idx, 1);
    else msg.likes.push(userId);
    await msg.save();
    res.json(msg.likes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ 9. Marquer une conversation comme lue (معالج الأخطاء 500)
router.put('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    
    // تأكد من أن المصفوفة موجودة لتجنب خطأ 500
    if (!user.lastReadConversations) user.lastReadConversations = [];
    
    const existing = user.lastReadConversations.find(r => r.conversationId.toString() === req.params.conversationId);
    if (existing) existing.date = new Date();
    else user.lastReadConversations.push({ conversationId: req.params.conversationId, date: new Date() });
    
    await user.save();
    res.json({ message: 'ok' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 10. Compter le nombre total de messages non lus
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: 'Identifiant manquant.' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

    const directConvs = await Conversation.find({ type: 'direct', participants: userId }).select('_id');
    const modules = await Module.find({ year: user.year }).select('_id');
    const moduleIds = modules.map(m => m._id);
    const groupConvs = await Conversation.find({ type: 'group', moduleId: { $in: moduleIds } }).select('_id');
    const quizConvs = await Conversation.find({ type: 'quiz' }).select('_id');

    const allConvs = [...directConvs, ...groupConvs, ...quizConvs];
    const lastReadMap = {};
    (user.lastReadConversations || []).forEach(r => { lastReadMap[r.conversationId.toString()] = r.date; });

    let total = 0;
    for (const conv of allConvs) {
      const lastRead = lastReadMap[conv._id.toString()] || new Date(0);
      total += await Message.countDocuments({ conversationId: conv._id, createdAt: { $gt: lastRead }, senderId: { $ne: userId } });
    }
    res.json({ unreadCount: total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ إضافة مسار حذف الرسالة (حل مشكلة 404)
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    // 1. البحث عن الرسالة
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'الرسالة غير موجودة.' });
    }

    // 2. التحقق من أن المستخدم الحالي هو الكاتب (أو الأدمن)
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: 'لا يمكنك حذف رسالة ليست لك.' });
    }

    // 3. حذف الرسالة
    await Message.findByIdAndDelete(messageId);

    // 4. إعلام المتصلين عبر Socket.io بحذف الرسالة (اختياري)
    // const io = req.app.get('io');
    // io.to(message.conversationId).emit('message-deleted', { messageId });

    res.status(200).json({ message: 'تم حذف الرسالة بنجاح.' });
  } catch (err) {
    console.error('Erreur lors de la suppression du message:', err);
    res.status(500).json({ message: 'خطأ في الخادم أثناء الحذف.' });
  }
});

module.exports = router;
