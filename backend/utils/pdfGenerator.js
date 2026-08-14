const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// استيراد الإصدار القديم الخاص بـ Node.js
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

async function generateModifiedPDF(originalUrl, strokes) {
  try {
    // 1. تحميل الملف الأصلي
    const response = await axios.get(originalUrl, { responseType: 'arraybuffer' });
    const pdfBytes = response.data;

    // 2. استخدام pdfjs لتحويل كل صفحة إلى صورة
    const loadingTask = pdfjs.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    const newPdfDoc = await PDFDocument.create();

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      // استخدام مقياس 1.5 للدقة
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d');

      // رسم الصفحة على canvas
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      await page.render(renderContext).promise;

      // تطبيق strokes (الرسوم)
      const pageStrokes = strokes[i] || [];
      pageStrokes.forEach(stroke => {
        ctx.beginPath();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.mode === 'highlighter' ? 0.35 : 1;
        ctx.lineWidth = stroke.mode === 'highlighter' ? 18 : 3;
        const pts = stroke.points;
        if (pts.length === 0) return;
        ctx.moveTo(pts[0].x * canvas.width, pts[0].y * canvas.height);
        for (let j = 1; j < pts.length; j++) {
          ctx.lineTo(pts[j].x * canvas.width, pts[j].y * canvas.height);
        }
        ctx.stroke();
      });

      // تحويل canvas إلى صورة PNG
      const imageData = canvas.toBuffer('image/png');
      const image = await newPdfDoc.embedPng(imageData);
      const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
      newPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }

    // حفظ PDF الجديد
    const pdfBytesModified = await newPdfDoc.save();
    const fileName = `modified_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../uploads', fileName);
    fs.writeFileSync(filePath, pdfBytesModified);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${fileName}`;
  } catch (error) {
    console.error('Error in generateModifiedPDF:', error);
    throw new Error('Failed to generate modified PDF: ' + error.message);
  }
}

module.exports = { generateModifiedPDF };