const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// مجلد التخزين المحلي
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Dossier uploads créé par uploadRoutes');
}

// إعداد التخزين المحلي
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // تنظيف اسم الملف
    const cleanName = file.originalname.replace(/\s/g, '_').replace(/[^a-zA-Z0-9.]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(cleanName));
  }
});

// فلترة أنواع الملفات المسموح بها
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg'
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 100 } // 100 MB
});

// مسار رفع ملف واحد
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const baseUrl = process.env.BACKEND_URL || 'https://reussite-qcmss-1nc7.onrender.com';
    // التأكد من HTTPS
    const secureBaseUrl = baseUrl.replace(/^http:/, 'https:');
    const fileUrl = `${secureBaseUrl}/uploads/${req.file.filename}`;

    console.log('📁 Fichier uploadé (local):', req.file.filename);
    console.log('🔗 URL:', fileUrl);

    res.json({
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error('❌ Erreur upload:', err);
    res.status(500).json({ error: err.message || 'Erreur interne du serveur.' });
  }
});

// مسار رفع عدة ملفات
router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const baseUrl = process.env.BACKEND_URL || 'https://reussite-qcmss-1nc7.onrender.com';
    const secureBaseUrl = baseUrl.replace(/^http:/, 'https:');
    const files = req.files.map(file => ({
      url: `${secureBaseUrl}/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    console.log(`📁 ${files.length} fichiers uploadés localement`);
    res.json({ files });
  } catch (err) {
    console.error('❌ Erreur upload multiple:', err);
    res.status(500).json({ error: err.message });
  }
});

// مسار حذف ملف (اختياري)
router.delete('/:filename', (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier non trouvé.' });
    }
    fs.unlinkSync(filePath);
    console.log('🗑️ Fichier supprimé:', req.params.filename);
    res.json({ message: 'Fichier supprimé avec succès.' });
  } catch (err) {
    console.error('❌ Erreur suppression:', err);
    res.status(500).json({ error: err.message });
  }
});

// معالج أخطاء Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux (max 100MB).' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;