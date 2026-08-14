// PdfAnnotatorModal.jsx - إصلاح عرض الصفحات في النسخة المعدلة
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PDFDocument } from 'pdf-lib';
import {
  X, ChevronLeft, ChevronRight, Pen, Highlighter, Eraser,
  Save, Download, Trash2, Loader2, ZoomIn, ZoomOut, Maximize2, Minimize2
} from 'lucide-react';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const COLORS = ['#facc15', '#f87171', '#4ade80', '#60a5fa', '#c084fc', '#1e293b'];

const drawStrokesOnCanvas = (canvas, strokes, width, height, clear = true) => {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (clear) ctx.clearRect(0, 0, width, height);
  strokes.forEach((stroke) => {
    if (!stroke || !stroke.points || stroke.points.length === 0) return;
    ctx.beginPath();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.globalAlpha = stroke.mode === 'highlighter' ? 0.35 : 1;
    ctx.lineWidth = (stroke.mode === 'highlighter' ? 18 : 3) * (width / (stroke.baseWidth || width));
    const pts = stroke.points;
    ctx.moveTo(pts[0].x * width, pts[0].y * height);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * width, pts[i].y * height);
    }
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
};

function PdfAnnotatorModal({
  fileUrl,
  title,
  userId,
  originalLessonId,
  year,
  canAnnotate = false,
  canDownload = true,
  onClose,
  onModifiedSaved
}) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [loadingAnnotations, setLoadingAnnotations] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [allStrokes, setAllStrokes] = useState({});
  const [pageSizes, setPageSizes] = useState({});

  const canvasRefs = useRef({});
  const [activePage, setActivePage] = useState(1);

  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const mountedRef = useRef(true);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(err => console.warn(err));
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      canvasRefs.current = {};
    };
  }, []);

  useEffect(() => {
    if (!canAnnotate || !userId) {
      setLoadingAnnotations(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`https://reussite-qcms.onrender.com/api/users/annotation?userId=${userId}&fileUrl=${encodeURIComponent(fileUrl)}`);
        const data = await res.json();
        if (mountedRef.current && data && typeof data === 'object') {
          setAllStrokes(data);
        }
      } catch (err) {
        console.error('Erreur chargement annotations:', err);
      } finally {
        if (mountedRef.current) setLoadingAnnotations(false);
      }
    })();
  }, [fileUrl, userId, canAnnotate]);

  const redrawPage = useCallback((pageNum) => {
    if (!mountedRef.current) return;
    const canvas = canvasRefs.current[pageNum]?.current;
    if (!canvas) return;
    const size = pageSizes[pageNum];
    if (!size) return;
    canvas.width = size.width;
    canvas.height = size.height;
    const strokes = allStrokes[pageNum] || [];
    drawStrokesOnCanvas(canvas, strokes, canvas.width, canvas.height);
  }, [allStrokes, pageSizes]);

  useEffect(() => {
    if (!mountedRef.current) return;
    const pages = Object.keys(canvasRefs.current);
    pages.forEach(p => redrawPage(Number(p)));
  }, [allStrokes, pageSizes, redrawPage]);

  const onPageLoadSuccess = (page, pageNum) => {
    if (!mountedRef.current) return;
    const viewport = page.getViewport({ scale });
    setPageSizes(prev => ({
      ...prev,
      [pageNum]: { width: viewport.width, height: viewport.height }
    }));
    const canvas = canvasRefs.current[pageNum]?.current;
    if (canvas) {
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      redrawPage(pageNum);
    }
  };

  const getRelativePoint = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  };

  const handlePointerDown = (e, pageNum) => {
    if (!canAnnotate || !mountedRef.current) return;
    const canvas = canvasRefs.current[pageNum]?.current;
    if (!canvas) return;
    setActivePage(pageNum);
    isDrawingRef.current = true;
    const pt = getRelativePoint(e, canvas);
    if (tool === 'eraser') {
      setAllStrokes(prev => {
        const strokes = (prev[pageNum] || []).filter(s => {
          return !s.points.some(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 0.02);
        });
        return { ...prev, [pageNum]: strokes };
      });
      setDirty(true);
      return;
    }
    currentStrokeRef.current = { points: [pt], color, mode: tool, baseWidth: canvas.width };
  };

  const handlePointerMove = (e, pageNum) => {
    if (!canAnnotate || !isDrawingRef.current || !mountedRef.current) return;
    const canvas = canvasRefs.current[pageNum]?.current;
    if (!canvas) return;
    const pt = getRelativePoint(e, canvas);
    if (tool === 'eraser') {
      setAllStrokes(prev => {
        const strokes = (prev[pageNum] || []).filter(s => {
          return !s.points.some(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 0.02);
        });
        return { ...prev, [pageNum]: strokes };
      });
      return;
    }
    if (!currentStrokeRef.current) return;
    currentStrokeRef.current.points.push(pt);
    const strokes = [...(allStrokes[pageNum] || []), currentStrokeRef.current];
    drawStrokesOnCanvas(canvas, strokes, canvas.width, canvas.height);
  };

  const handlePointerUp = () => {
    if (!canAnnotate || !mountedRef.current) return;
    if (isDrawingRef.current && currentStrokeRef.current && tool !== 'eraser') {
      setAllStrokes(prev => ({
        ...prev,
        [activePage]: [...(prev[activePage] || []), currentStrokeRef.current]
      }));
      setDirty(true);
    }
    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  };

  const clearPage = () => {
    if (!window.confirm('Effacer toutes les annotations de cette page ?')) return;
    setAllStrokes(prev => ({ ...prev, [pageNumber]: [] }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!canAnnotate || !userId || !mountedRef.current) return;
    let hasAnnotations = false;
    for (const page in allStrokes) {
      if (allStrokes[page] && allStrokes[page].length > 0) {
        hasAnnotations = true;
        break;
      }
    }
    if (!hasAnnotations) {
      alert("Aucune annotation à enregistrer.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('https://reussite-qcms.onrender.com/api/users/annotation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fileUrl,
          annotationData: allStrokes
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde.');
      }
      alert("✅ Vos modifications ont été enregistrées !");
      setDirty(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement : " + err.message);
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  // توليد PDF معدل باستخدام scale=1 للحصول على أبعاد أصلية
  const generateModifiedPDFInBrowser = async () => {
    let hasAnnotations = false;
    for (const page in allStrokes) {
      if (allStrokes[page] && allStrokes[page].length > 0) {
        hasAnnotations = true;
        break;
      }
    }
    if (!hasAnnotations) {
      alert("Aucune annotation à appliquer.");
      return null;
    }

    setSaving(true);
    try {
      const loadingTask = pdfjs.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      const newPdfDoc = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        // استخدام scale=1 للحصول على الأبعاد الأصلية
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // رسم الصفحة
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        await page.render(renderContext).promise;

        // رسم التعديلات
        const strokes = allStrokes[i] || [];
        if (strokes.length > 0) {
          drawStrokesOnCanvas(canvas, strokes, canvas.width, canvas.height, false);
        }

        // تحويل إلى صورة ودمج
        const imageData = canvas.toDataURL('image/png');
        const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());
        const image = await newPdfDoc.embedPng(imageBytes);
        const newPage = newPdfDoc.addPage([viewport.width, viewport.height]);
        newPage.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      }

      const pdfBytesModified = await newPdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      const file = new File([blob], `modified_${Date.now()}.pdf`, { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('https://reussite-qcms.onrender.com/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Erreur lors du téléversement.');
      }
      const uploadData = await uploadRes.json();
      return uploadData.url;
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la génération du PDF modifié : ' + err.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleCreateModified = async () => {
    const modifiedUrl = await generateModifiedPDFInBrowser();
    if (!modifiedUrl) return;

    try {
      const res = await fetch('https://reussite-qcms.onrender.com/api/users/custom-file', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fileUrl: modifiedUrl,
          lessonId: originalLessonId,
          year: year
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la sauvegarde.');
      }
      alert("✅ Version modifiée créée avec succès !");
      if (onModifiedSaved) {
        onModifiedSaved(modifiedUrl);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde de la version modifiée : ' + err.message);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = title || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Impossible de télécharger le fichier.');
    }
  };

  const handleClose = () => {
    if (dirty && canAnnotate) {
      if (!window.confirm('Vous avez des modifications non enregistrées. Fermer sans enregistrer ?')) return;
    }
    onClose();
  };

  const renderPages = () => {
    if (!numPages) return null;
    return Array.from({ length: numPages }, (_, i) => i + 1).map((p) => {
      const size = pageSizes[p] || { width: 700, height: 900 };
      return (
        <div key={p} id={`page-container-${p}`} className="relative mb-4 mx-auto shadow-lg" style={{ maxWidth: '100%' }}>
          <Page
            pageNumber={p}
            scale={scale}
            onLoadSuccess={(page) => onPageLoadSuccess(page, p)}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
          {canAnnotate && (
            <canvas
              ref={(el) => {
                if (el) {
                  if (!canvasRefs.current[p]) {
                    canvasRefs.current[p] = { current: el };
                  } else {
                    canvasRefs.current[p].current = el;
                  }
                  const sz = pageSizes[p];
                  if (sz) {
                    el.width = sz.width;
                    el.height = sz.height;
                    redrawPage(p);
                  }
                }
              }}
              width={size.width}
              height={size.height}
              className="absolute top-0 left-0 touch-none"
              style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', background: 'transparent' }}
              onMouseDown={(e) => handlePointerDown(e, p)}
              onMouseMove={(e) => handlePointerMove(e, p)}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={(e) => handlePointerDown(e, p)}
              onTouchMove={(e) => handlePointerMove(e, p)}
              onTouchEnd={handlePointerUp}
            />
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-1 sm:p-2 md:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[95vh] sm:h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 border-b border-slate-200 dark:border-slate-700 flex-wrap">
          <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white truncate flex-1 min-w-[100px]">{title}</h3>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {canAnnotate && (
              <>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-lg p-1">
                  <button onClick={() => setTool('pen')} className={`p-1.5 rounded ${tool === 'pen' ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Stylo"><Pen size={16} /></button>
                  <button onClick={() => setTool('highlighter')} className={`p-1.5 rounded ${tool === 'highlighter' ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Surligneur"><Highlighter size={16} /></button>
                  <button onClick={() => setTool('eraser')} className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-blue-600 text-white' : 'text-slate-500'}`} title="Gomme"><Eraser size={16} /></button>
                </div>
                <div className="flex items-center gap-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)} className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 ${color === c ? 'border-slate-800 dark:border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={clearPage} className="p-2 text-slate-500 hover:text-red-600 rounded-lg" title="Effacer la page"><Trash2 size={16} /></button>
                <button onClick={toggleFullscreen} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg" title="Plein écran">
                  {document.fullscreenElement ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={handleSave} disabled={saving || !dirty} className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs sm:text-sm rounded-lg transition">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} <span className="hidden xs:inline sm:inline">Enregistrer</span>
                </button>
                {originalLessonId && year && (
                  <button onClick={handleCreateModified} disabled={saving} className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs sm:text-sm rounded-lg transition">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} <span className="hidden xs:inline sm:inline">Créer version modifiée</span>
                  </button>
                )}
              </>
            )}
            {canDownload && (
              <button onClick={handleDownload} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg" title="Télécharger">
                <Download size={18} />
              </button>
            )}
            <button onClick={handleClose} className="p-2 text-slate-500 hover:text-red-600 rounded-lg"><X size={20} /></button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 flex items-start justify-center p-2 sm:p-4 relative">
          {(loadingPdf || loadingAnnotations) && !pdfError && (
            <div className="flex flex-col items-center gap-2 text-slate-500 mt-10">
              <Loader2 className="animate-spin" size={28} /> Chargement du document...
            </div>
          )}
          {pdfError && (
            <div className="flex flex-col items-center gap-4 text-red-500 mt-10">
              <p className="text-center">{pdfError}</p>
              <button onClick={() => { setPdfError(null); setLoadingPdf(true); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow">Réessayer</button>
            </div>
          )}
          <div className="relative max-w-full" style={{ display: (loadingPdf || pdfError) ? 'none' : 'block' }}>
            <Document
              key={fileUrl}
              file={fileUrl}
              onLoadSuccess={({ numPages }) => {
                if (mountedRef.current) {
                  setNumPages(numPages);
                  setLoadingPdf(false);
                  setPdfError(null);
                }
              }}
              onLoadError={(err) => {
                if (mountedRef.current) {
                  console.error('Erreur chargement PDF:', err);
                  setLoadingPdf(false);
                  setPdfError('Impossible de charger le PDF. Vérifiez le lien ou réessayez.');
                }
              }}
              loading={null}
            >
              {renderPages()}
            </Document>
          </div>
        </div>
        {!loadingPdf && numPages && numPages > 1 && !pdfError && (
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 p-2 sm:p-3 border-t border-slate-200 dark:border-slate-700">
            <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full disabled:opacity-30"><ChevronLeft size={18} /></button>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 min-w-[70px] sm:min-w-[80px] text-center">Page {pageNumber} / {numPages}</span>
            <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber >= numPages} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full disabled:opacity-30"><ChevronRight size={18} /></button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 sm:mx-2 hidden sm:block" />
            <button onClick={() => setScale(s => Math.max(0.6, s - 0.2))} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full"><ZoomOut size={16} /></button>
            <button onClick={() => setScale(s => Math.min(2.5, s + 0.2))} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full"><ZoomIn size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfAnnotatorModal;