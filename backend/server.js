const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
require('dotenv').config();

// ✅ Cloudinary configuration (added)
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully!'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// ✅ Socket.io connection
io.on('connection', (socket) => {
  console.log('🟢 Client connecté:', socket.id);

  socket.on('join-user', (userId) => {
    if (!userId) return;
    socket.join(`user-${userId}`);
    console.log(`👤 Socket ${socket.id} rejoint sa room utilisateur: user-${userId}`);
  });

  socket.on('join-room', (conversationId) => {
    socket.join(conversationId);
    console.log(`🔗 Socket ${socket.id} a rejoint la room ${conversationId}`);
  });

  socket.on('leave-room', (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client déconnecté:', socket.id);
  });
});

app.set('io', io);

// Import des routes
const authRoutes = require('./routes/authRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const examRoutes = require('./routes/examRoutes');
const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const quizRoutes = require('./routes/quizRoutes');
const communityRoutes = require('./routes/communityRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// ❌ REMOVED: app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const User = require('./models/User');
const { notifyUser } = require('./utils/notify');

// ✅ Cron job for To-Do List notifications
cron.schedule('*/15 * * * *', async () => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const users = await User.find({
      todoList: {
        $elemMatch: {
          date: { $gte: startOfDay, $lte: endOfDay },
          done: false,
          notified: false
        }
      }
    });

    for (const user of users) {
      const dueTasks = user.todoList.filter(t =>
        t.date >= startOfDay && t.date <= endOfDay && !t.done && !t.notified
      );
      if (dueTasks.length === 0) continue;

      console.log(`📤 Envoi rappel To-Do à user-${user._id}`);
      await notifyUser(io, user._id, {
        title: 'Rappel To-Do List',
        body: dueTasks.length === 1
          ? `Rappel : "${dueTasks[0].text}" est prévu aujourd'hui 📝`
          : `Vous avez ${dueTasks.length} tâche(s) prévue(s) aujourd'hui 📝`,
        conversationType: 'system',
        conversationTitle: 'Rappel To-Do List'
      });

      dueTasks.forEach(t => { t.notified = true; });
      await user.save();
    }
  } catch (err) {
    console.error('❌ Erreur job cron to-do list :', err);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
});