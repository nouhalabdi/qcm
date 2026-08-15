const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// تكوين Cloudinary (استخدم متغيرات البيئة)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// إعداد التخزين على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'reussite-qcms',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'mp4', 'webm', 'ogg'],
    resource_type: 'auto' // يسمح بكل أنواع الملفات
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 100 } // 100MB
});

// مسار رفع ملف واحد
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });
    
    // Cloudinary يعيد الرابط مباشرة
    const fileUrl = req.file.path; // أو req.file.secure_url

    console.log('📁 Fichier uploadé sur Cloudinary:', req.file.filename);
    console.log('🔗 URL:', fileUrl);

    res.json({ 
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (err) {
    console.error('❌ Erreur upload:', err);
    res.status(500).json({ error: err.message });
  }
});

// مسار رفع عدة ملفات
router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }

    const files = req.files.map(file => ({
      url: file.path || file.secure_url,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    console.log(`📁 ${files.length} fichiers uploadés sur Cloudinary`);
    res.json({ files });
  } catch (err) {
    console.error('❌ Erreur upload multiple:', err);
    res.status(500).json({ error: err.message });
  }
});

// مسار حذف ملف (اختياري)
router.delete('/:publicId', async (req, res) => {
  try {
    const result = await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ message: 'Fichier supprimé', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;