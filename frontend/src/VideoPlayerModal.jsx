// VideoPlayerModal.jsx
import React, { useRef, useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';

function VideoPlayerModal({ url, title, onClose }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isVimeo = url.includes('vimeo.com');
  const isDailymotion = url.includes('dailymotion.com');
  const isGoogleDrive = url.includes('drive.google.com');

  const getGoogleDriveEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const match = path.match(/\/file\/d\/([^\/]+)/);
      if (match) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch) {
        return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      let videoId = '';
      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes('youtube.com')) {
        const params = new URLSearchParams(urlObj.search);
        videoId = params.get('v') || '';
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getVimeoEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const match = urlObj.pathname.match(/^\/(\d+)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const getDailymotionEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const match = urlObj.pathname.match(/\/video\/([^\/]+)/);
      if (match) {
        return `https://www.dailymotion.com/embed/video/${match[1]}?autoplay=1`;
      }
      return null;
    } catch {
      return null;
    }
  };

  let embedUrl = null;
  if (isYouTube) {
    embedUrl = getYoutubeEmbedUrl(url);
  } else if (isVimeo) {
    embedUrl = getVimeoEmbedUrl(url);
  } else if (isDailymotion) {
    embedUrl = getDailymotionEmbedUrl(url);
  } else if (isGoogleDrive) {
    embedUrl = getGoogleDriveEmbedUrl(url);
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen?.().catch(err => console.warn(err));
      } else {
        document.exitFullscreen?.();
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Play error:', err);
          setError('Impossible de lire la vidéo. Vérifiez votre connexion.');
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration || 0;
      setProgress((current / dur) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setLoading(false);
      setError(null);
    }
  };

  const handleVideoError = (e) => {
    console.error('Video error:', e);
    setLoading(false);
    setError('Impossible de lire la vidéo. Le format n\'est pas supporté ou le fichier est inaccessible.');
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && duration) {
      videoRef.current.currentTime = x * duration;
    }
  };

  if (embedUrl) {
    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white truncate">{title}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => window.open(url, '_blank')} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg" title="Ouvrir dans un nouvel onglet">
                <ExternalLink size={18} />
              </button>
              <button onClick={toggleFullscreen} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg" title="Plein écran">
                {document.fullscreenElement ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-red-600 rounded-lg"><X size={20} /></button>
            </div>
          </div>
          <div className="flex-1 p-4 bg-black flex items-center justify-center">
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full min-h-[400px]"
              allowFullScreen
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-white truncate">{title}</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => window.open(url, '_blank')} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg" title="Ouvrir dans un nouvel onglet">
              <ExternalLink size={18} />
            </button>
            <button onClick={toggleFullscreen} className="p-2 text-slate-500 hover:text-blue-600 rounded-lg" title="Plein écran">
              {document.fullscreenElement ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-red-600 rounded-lg"><X size={20} /></button>
          </div>
        </div>
        <div className="flex-1 p-4 bg-black flex flex-col items-center justify-center relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}
          {error ? (
            <div className="text-center text-white p-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={() => window.open(url, '_blank')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Ouvrir dans un nouvel onglet
              </button>
            </div>
          ) : (
            <video
              key={url}
              ref={videoRef}
              className="w-full max-h-[60vh] rounded-lg"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={handleVideoError}
              onClick={togglePlay}
              controls={false}
            >
              <source src={url} type="video/mp4" />
              <source src={url} type="video/webm" />
              <source src={url} type="video/ogg" />
              Votre navigateur ne supporte pas la vidéo.
            </video>
          )}
          {!error && !loading && (
            <div className="w-full mt-3 flex items-center gap-3 text-white">
              <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-full transition">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <div className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer relative" onClick={handleSeek}>
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-xs text-white/70">
                {duration ? `${Math.floor(progress / 100 * duration)}s` : '0s'}
              </span>
              <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition">
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoPlayerModal;