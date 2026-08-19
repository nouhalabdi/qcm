import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, Heart, FileText, Loader2, Users, User as UserIcon, Trash2 } from 'lucide-react';
import io from 'socket.io-client';

let socket = null;

function ChatWindow({ conversationId, title, type, user, onClose, onRead }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const processedIds = useRef(new Set());

  const fetchMessages = async () => {
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/community/messages/${conversationId}`);
      if (!res.ok) throw new Error('Erreur chargement messages');
      const data = await res.json();
      data.forEach(msg => processedIds.current.add(msg._id));
      setMessages(data);
    } catch (err) {
      console.error(err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    socket = io('https://reussite-qcmss-1nc7.onrender.com');
    socket.emit('join-room', conversationId);

    socket.on('new-message', (msg) => {
      if (processedIds.current.has(msg._id)) return;
      processedIds.current.add(msg._id);
      setMessages((prev) => [...prev, msg]);
    });

    fetchMessages();

    // ✅ معالجة خطأ 500 دون كسر التطبيق
    fetch(`https://reussite-qcmss-1nc7.onrender.com/api/community/conversations/${conversationId}/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id })
    })
      .then(res => {
        if (!res.ok) console.warn(`⚠️ Erreur ${res.status} lors du marquage comme lu.`);
        else onRead && onRead();
      })
      .catch(err => console.warn('⚠️ Erreur réseau lors du marquage comme lu:', err));

    return () => {
      if (socket) {
        socket.emit('leave-room', conversationId);
        socket.disconnect();
      }
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ دالة حذف الرسالة مع قراءة آمنة للـ body (مرة واحدة)
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce message ?")) return;
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/community/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });

      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      } else {
        // قراءة الـ body كـ text مرة واحدة
        const text = await res.text();
        let errorMsg = `Erreur ${res.status}: Impossible de supprimer le message.`;
        try {
          // محاولة تحويل النص إلى JSON
          const errData = JSON.parse(text);
          if (errData && errData.message) errorMsg = errData.message;
        } catch (e) {
          // إذا لم يكن JSON، نستخدم النص إذا كان قصيراً
          if (text && text.length < 200) errorMsg = text;
        }
        alert(errorMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau lors de la suppression.");
    }
  };

  const handleSend = async (attachments = []) => {
    if (!text.trim() && attachments.length === 0) return;
    setSending(true);
    try {
      const res = await fetch('https://reussite-qcmss-1nc7.onrender.com/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, senderId: user._id, text: text.trim(), attachments })
      });
      const newMsg = await res.json();

      if (!processedIds.current.has(newMsg._id)) {
        processedIds.current.add(newMsg._id);
        setMessages(prev => [...prev, newMsg]);
      }
      setText('');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      alert('Seuls les images et les fichiers PDF sont autorisés.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('https://reussite-qcmss-1nc7.onrender.com/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'envoi.");
      await handleSend([{ url: data.url, type: isImage ? 'image' : 'pdf', name: file.name }]);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi du fichier.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleLike = async (messageId) => {
    try {
      const res = await fetch(`https://reussite-qcmss-1nc7.onrender.com/api/community/messages/${messageId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      const likes = await res.json();
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, likes } : m));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[88vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-blue-600 text-white">
          <div className="flex items-center gap-2 min-w-0">
            {type === 'group' ? <Users size={20} /> : <UserIcon size={20} />}
            <h3 className="font-bold truncate">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition"><X size={20} /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900">
          {loading ? (
            <div className="flex justify-center pt-10 text-slate-400"><Loader2 className="animate-spin" size={24} /></div>
          ) : messages.length === 0 ? (
            <p className="text-center text-slate-400 text-sm pt-10">Aucun message. Soyez le premier à écrire !</p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId?._id === user._id;
              const liked = (msg.likes || []).includes(user._id);
              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                    {type === 'group' && !isMine && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 px-1">
                        {msg.senderId?.pseudo || msg.senderId?.username || 'Étudiant'}
                      </span>
                    )}
                    <div className={`rounded-2xl px-4 py-2 shadow-sm ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-bl-sm border border-slate-200 dark:border-slate-700'}`}>
                      {msg.attachments?.map((att, i) => (
                        <div key={i} className="mb-1">
                          {att.type === 'image' ? (
                            <a href={att.url} target="_blank" rel="noreferrer">
                              <img src={att.url} alt={att.name} className="max-w-full rounded-lg max-h-60 object-cover" />
                            </a>
                          ) : (
                            <a href={att.url} target="_blank" rel="noreferrer" className={`flex items-center justify-between p-2 rounded-lg text-xs ${isMine ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText size={16} className="flex-shrink-0" />
                                <span className="truncate">{att.name || 'Document.pdf'}</span>
                              </div>
                              <span className="underline ml-2 flex-shrink-0">Voir</span>
                            </a>
                          )}
                        </div>
                      ))}
                      {msg.text && <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <button onClick={() => toggleLike(msg._id)} className={`flex items-center gap-1 text-xs transition ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}`}>
                        <Heart size={12} fill={liked ? 'currentColor' : 'none'} /> {msg.likes?.length > 0 && msg.likes.length}
                      </button>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {/* ✅ زر الحذف للكاتب فقط */}
                      {isMine && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          className="text-red-400 hover:text-red-600 transition ml-1"
                          title="Supprimer ce message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending}
            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition disabled:opacity-40"
            title="Joindre une image ou un PDF"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
          </button>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !sending) handleSend(); }}
            placeholder="Écrire un message..."
            className="flex-1 p-2.5 bg-slate-100 dark:bg-slate-900 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={sending || (!text.trim())}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full transition"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
