const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// ✅ تكوين Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ إعداد التخزين على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'reussite-qcms',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm'],
    resource_type: 'auto'
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 50 } // 50MB
});

// ✅ مسار رفع الملفات
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu.' });
    }
    
    // Cloudinary يعيد URL مباشرة
    console.log(' Fichier uploadé sur Cloudinary:', req.file.filename);
    res.json({ url: req.file.path });
    
  } catch (err) {
    console.error('Erreur upload:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;