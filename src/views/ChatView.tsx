import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { User, Message } from "../types";
import { Search, Phone, Video, Info, MoreVertical, Send, MessageCircle, ArrowLeft, UserPlus, Trash2, X, Plus, Image as ImageIcon, File, Smile, Check, CheckCheck, Pin, Reply, Forward, SmilePlus, Mic } from "lucide-react";
import { cn } from "../utils";
import { useUnread } from "../UnreadContext";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function ChatView() {
  const { user, profile } = useAuth();
  const avatarUrl = profile?.avatar || user?.user_metadata?.avatar_url || "https://i.pravatar.cc/150?u=" + (user?.id || "u1");
  const [users, setUsers] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get("userId");
  
  const activeUser = users.find(u => u.id === userIdParam) || null;
  const { unreadCounts, markAsRead, refreshUnread } = useUnread();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [callState, setCallState] = useState<'audio'|'video'|null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [contextMenuUser, setContextMenuUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showInfoSidebar, setShowInfoSidebar] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [recordStartX, setRecordStartX] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const micBtnRef = useRef<HTMLButtonElement>(null);
  const isRecordingRef = useRef(false); // ref para evitar stale closure
  const isDraggingToTrashRef = useRef(false); // ref para saber se vai cancelar
  const isPressingRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const touchStartRef = useRef<{x: number, y: number} | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const fetchUsers = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('users').select('*').neq('id', user.id);
    if (!error && data) {
       setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (activeUser && user) {
      markAsRead(activeUser.id);
      
      const fetchMessages = async () => {
          const { data, error } = await supabase
              .from('messages')
              .select('*')
              .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeUser.id}),and(sender_id.eq.${activeUser.id},receiver_id.eq.${user.id})`)
              .order('created_at', { ascending: true });
              
          if (!error && data) {
              setMessages(data);
              scrollToBottom();
          }
      };

      fetchMessages();

      const channel = supabase.channel('chat_messages')
         .on('postgres_changes', { 
             event: 'INSERT', 
             schema: 'public', 
             table: 'messages' 
         }, (payload) => {
             const newMsg = payload.new as Message;
             if (
                 (newMsg.sender_id === user.id && newMsg.receiver_id === activeUser.id) ||
                 (newMsg.sender_id === activeUser.id && newMsg.receiver_id === user.id)
             ) {
                 setMessages(prev => [...prev, newMsg]);
                 if (newMsg.sender_id === activeUser.id) {
                     markAsRead(activeUser.id);
                 }
             }
         })
         .subscribe();
         
      return () => {
         supabase.removeChannel(channel);
      };
    } else {
      setMessages([]);
    }
  }, [activeUser, user]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || !activeUser || !user || submitting) return;
    setSubmitting(true);
    
    try {
        let finalImageUrl = null;
        let fileUrl = null;

        if (selectedFile) {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage.from('media').upload(filePath, selectedFile);
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
            
            if (selectedFile.type.startsWith('image/')) {
               finalImageUrl = publicUrl;
            } else {
               fileUrl = publicUrl;
            }
        }

        const finalMsgText = fileUrl 
            ? `${input.trim()}\n\n[Arquivo Anexado]: ${fileUrl}`
            : input.trim();

        const newMsg = { 
            sender_id: user.id,
            receiver_id: activeUser.id, 
            text: finalMsgText,
            image_url: finalImageUrl,
            created_at: new Date().toISOString()
        };
        
        setInput("");
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowEmojiPicker(false);
        setReplyingTo(null);

        await supabase.from('messages').insert([newMsg]);
        setTimeout(refreshUnread, 1500);
    } catch (e: any) {
        alert("Erro ao enviar: " + e.message);
        setSubmitting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isPressingRef.current) {
         // Se o usuário já soltou o botão antes de aceitar permissões
         stream.getTracks().forEach(track => track.stop());
         return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isDraggingToTrashRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (!isDraggingToTrashRef.current && audioChunksRef.current.length > 0) {
           const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
           await uploadAndSendAudio(file);
        }
        audioChunksRef.current = [];
      };

      mediaRecorder.start(200); // Garante que gere chunks rápidos
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      isDraggingToTrashRef.current = false;
      mr.stop();
      mr.stream.getTracks().forEach(track => track.stop());
    }
    isRecordingRef.current = false;
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);
  };

  const cancelRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') {
      isDraggingToTrashRef.current = true; // Flag: do NOT send
      mr.stop();
      mr.stream.getTracks().forEach(track => track.stop());
    }
    isRecordingRef.current = false;
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const uploadAndSendAudio = async (file: File) => {
    if (!activeUser || !user) return;
    setSubmitting(true);
    try {
        const filePath = `${user.id}/${file.name}`;
        const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
        
        const newMsg = { 
            sender_id: user.id,
            receiver_id: activeUser.id, 
            text: "",
            image_url: publicUrl,
            created_at: new Date().toISOString()
        };
        await supabase.from('messages').insert([newMsg]);
        setTimeout(refreshUnread, 1500);
    } catch (e: any) {
        alert("Erro ao enviar áudio: " + e.message);
    } finally {
        setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const renderText = (text: string) => {
      if (!text) return null;
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text.split(urlRegex).map((part, i) => {
          if (part.match(urlRegex)) {
              return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-uni-blue hover:underline font-bold break-all">{part}</a>;
          }
          return <span key={i}>{part}</span>;
      });
  };

  const handleUserSelect = (u: User) => {
    setSearchParams({ userId: u.id });
  };

  const clearActiveUser = () => {
    setSearchParams({});
  };

  const handleAddContact = async () => {
    if (!newContactName.trim()) return;
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newContactName })
    });
    setNewContactName("");
    setIsAddingContact(false);
    fetchUsers();
  };

  const handleDeleteContact = async (id: string) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id));
    if (activeUser?.id === id) clearActiveUser();
  };

  const handlePointerDown = (u: User) => {
    isLongPressTriggeredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setContextMenuUser(u);
    }, 800); 
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const handlePointerLeave = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const handleClickUser = (u: User) => {
    if (isLongPressTriggeredRef.current) return;
    handleUserSelect(u);
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-full flex h-full max-h-full md:py-6 md:px-6 max-w-7xl mx-auto relative overflow-hidden">
      
      {/* Sidebar - Chat List */}
      <div className={cn(
        "w-full md:w-80 flex flex-col glass md:rounded-l-3xl border-r border-white/5 bg-uni-dark/30",
        activeUser ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-bold text-2xl tracking-tight text-white">Chat</h1>
                <button 
                  onClick={() => setIsAddingContact(true)}
                  className="p-2.5 text-uni-blue bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
                >
                  <UserPlus size={20} />
                </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-3 relative">
                <Search size={18} className="text-slate-500 mr-3 shrink-0" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar mensagens ou pessoas..." 
                  className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none placeholder:text-slate-600 font-medium" 
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-1.5 pb-20">
            {filteredUsers.map(u => {
                const unreadCount = unreadCounts[u.id] || 0;
                const isActive = activeUser?.id === u.id;
                return (
                <button 
                  key={u.id}
                  onClick={() => handleClickUser(u)}
                  onPointerDown={() => handlePointerDown(u)}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                  onPointerCancel={handlePointerLeave}
                  onContextMenu={(e) => { e.preventDefault(); }}
                  className={cn(
                    "w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all text-left relative group select-none hover:bg-white/5",
                    isActive ? "bg-white/10 shadow-lg border border-white/10" : ""
                  )}
                >
                    <div className="relative pointer-events-none">
                       <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-transparent group-hover:ring-uni-purple/50 transition-all" />
                       <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-uni-green rounded-full border-2 border-uni-dark scale-90"></span>
                    </div>
                    <div className="flex-1 overflow-hidden pointer-events-none">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className={cn("truncate pr-2 text-sm", unreadCount > 0 || isActive ? "font-bold text-white" : "font-semibold text-slate-300")}>{u.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className={cn("text-xs truncate", unreadCount > 0 ? "text-slate-100 font-bold" : "text-slate-500 font-medium")}>
                               {unreadCount > 0 ? "Nova mensagem recebida" : "Histórico de conversa..."}
                            </p>
                            {unreadCount > 0 && (
                                <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-uni-purple text-[10px] font-black text-white shadow-lg animate-pulse">
                                  {unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                </button>
            )})}
        </div>
      </div>

      {/* Active Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col glass md:rounded-r-3xl relative z-10 w-full h-full overflow-hidden bg-uni-dark/20",
        !activeUser && "hidden md:flex items-center justify-center"
      )}>
        {activeUser ? (
            <>
            {/* Header */}
            <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 flex-shrink-0 bg-uni-darker/40 backdrop-blur-3xl md:rounded-tr-3xl z-20">
                <div className="flex items-center gap-4">
                    <button className="md:hidden text-slate-400 hover:text-white transition-colors" onClick={clearActiveUser}>
                      <ArrowLeft size={24} />
                    </button>
                    <div className="relative cursor-pointer group" onClick={() => setShowInfoSidebar(!showInfoSidebar)}>
                        <img src={activeUser.avatar} className="w-11 h-11 rounded-2xl object-cover border border-white/10 group-hover:scale-105 transition-transform" alt="avatar" />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-uni-green rounded-full border-2 border-uni-dark"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white flex items-center gap-1.5 leading-none mb-1 cursor-pointer hover:text-uni-purple transition-colors" onClick={() => setShowInfoSidebar(!showInfoSidebar)}>
                            {activeUser.name}
                            <Check size={12} className="text-uni-blue" />
                        </h3>
                        <span className="text-[10px] uppercase font-black tracking-widest text-uni-green animate-pulse">Online</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCallState('audio')} className="p-2.5 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"><Phone size={18} /></button>
                    <button onClick={() => setCallState('video')} className="p-2.5 text-slate-400 hover:text-white transition-all hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"><Video size={18} /></button>
                    <div className="w-[1px] h-6 bg-white/10 mx-2 hidden sm:block"></div>
                    <button onClick={() => setShowInfoSidebar(!showInfoSidebar)} className={cn("p-2.5 transition-all rounded-xl border border-transparent", showInfoSidebar ? "text-uni-purple bg-uni-purple/10 border-uni-purple/20" : "text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/10")}><Info size={18} /></button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col pt-8 relative z-10">
                {activeReactionMsgId && (
                    <div className="fixed inset-0 z-40" onPointerDown={() => setActiveReactionMsgId(null)} onContextMenu={(e) => { e.preventDefault(); setActiveReactionMsgId(null); }} />
                )}
                <AnimatePresence initial={false}>
                    {messages.map((m, idx) => {
                        const isMine = m.sender_id === user?.id;
                        const showAvatar = idx === 0 || messages[idx-1].sender_id !== m.sender_id;
                        return (
                            <motion.div 
                                key={m.id}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={cn(
                                    "flex gap-3 max-w-[85%] group relative transition-all",
                                    isMine ? "ml-auto flex-row-reverse" : "mr-auto",
                                    activeReactionMsgId === m.id ? "z-50" : "z-10"
                                )}
                            >
                                <div className={cn("w-8 h-8 rounded-xl bg-slate-800 shrink-0 self-end mb-1 overflow-hidden transition-opacity", !showAvatar && "opacity-0")}>
                                   <img src={isMine ? avatarUrl : activeUser.avatar} className="w-full h-full object-cover" />
                                </div>
                                
                                <div className={cn("flex flex-col space-y-1.5", isMine ? "items-end" : "items-start")}>
                                    {m.replyTo && (
                                        <div className="bg-white/5 px-4 py-2 rounded-2xl border-l-4 border-uni-purple text-xs text-slate-400 mb-1 max-w-full truncate blur-[0.2px]">
                                            Replying to...
                                        </div>
                                    )}

                                    <div 
                                        className={cn("relative group/msg transition-all", activeReactionMsgId === m.id ? "scale-105" : "")} 
                                        onContextMenu={(e) => { e.preventDefault(); setActiveReactionMsgId(m.id); }}
                                        onTouchStart={(e) => {
                                            isLongPressTriggeredRef.current = false;
                                            const touch = e.touches[0];
                                            touchStartRef.current = { x: touch.clientX, y: touch.clientY };
                                            pressTimerRef.current = setTimeout(() => {
                                                isLongPressTriggeredRef.current = true;
                                                setActiveReactionMsgId(m.id);
                                                if (navigator.vibrate) navigator.vibrate(50);
                                            }, 500);
                                        }}
                                        onTouchMove={(e) => {
                                            if (!touchStartRef.current) return;
                                            const touch = e.touches[0];
                                            const dx = Math.abs(touch.clientX - touchStartRef.current.x);
                                            const dy = Math.abs(touch.clientY - touchStartRef.current.y);
                                            if (dx > 10 || dy > 10) {
                                                if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
                                                touchStartRef.current = null;
                                            }
                                        }}
                                        onTouchEnd={() => {
                                            if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
                                        }}
                                        onMouseDown={() => {
                                            // Desktop fallback
                                            pressTimerRef.current = setTimeout(() => {
                                                setActiveReactionMsgId(m.id);
                                            }, 500);
                                        }}
                                        onMouseUp={() => {
                                            if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
                                        }}
                                        onMouseLeave={() => {
                                            if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
                                        }}
                                        style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
                                    >
                                        <div className={cn(
                                            "px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md relative",
                                            isMine 
                                              ? "bg-gradient-to-br from-uni-purple to-uni-blue text-white rounded-tr-none" 
                                              : "bg-white/10 text-slate-200 rounded-tl-none border border-white/5"
                                        )}>
                                            {m.image_url && m.image_url.match(/\.(webm|mp3|wav|ogg|m4a)(\?.*)?$/i) ? (
                                                <audio src={m.image_url} controls className="mb-2 max-w-full max-h-12 rounded-xl" />
                                            ) : m.image_url && (
                                                <img src={m.image_url} alt="anexo" className="rounded-xl max-w-full md:max-w-xs mb-2 cursor-pointer hover:opacity-90 transition-opacity" />
                                            )}
                                            {m.text && <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{renderText(m.text)}</p>}
                                            
                                            <div className={cn(
                                                "flex items-center gap-1.5 mt-2 transition-opacity",
                                                isMine ? "justify-end opacity-70" : "opacity-50"
                                            )}>
                                                <span className="text-[10px] font-bold tabular-nums">{format(new Date(m.created_at), 'HH:mm')}</span>
                                                {isMine && <CheckCheck size={12} className="text-white" />}
                                            </div>
                                        </div>

                                        {/* Reactions Popup (Desktop Hover & Mobile Long Press) - Movid to outside backdrop-blur div to fix iOS Safari clipping */}
                                        <div className={cn(
                                            "absolute -top-24 transition-all bg-uni-darker/95 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 flex items-center justify-start shadow-2xl z-50 flex-wrap w-[280px] max-h-32 overflow-y-auto custom-scrollbar",
                                            activeReactionMsgId === m.id ? "opacity-100 pointer-events-auto scale-100" : "opacity-0 pointer-events-none scale-95 md:group-hover/msg:opacity-100 md:group-hover/msg:pointer-events-auto md:group-hover/msg:scale-100",
                                            isMine ? "right-0 origin-bottom-right" : "left-0 origin-bottom-left"
                                        )}>
                                            {['💜','🔥','😉','😆','😁','😂','🤣','😮','🥱','🥰','😍','🤩','😢','😡','🎉','😳','😵','😫','😩','🫩','🥶','🤢','🤮','😴','😪','🤡','👍🏻','➕'].map(emoji => (
                                                <button key={emoji} onClick={() => { setActiveReactionMsgId(null); /* Aqui você deve ligar à função de adicionar reação do Supabase */ }} className="text-[22px] hover:scale-125 transition-transform p-1.5 hover:bg-white/10 rounded-xl leading-none">
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Reply/Forward Actions */}
                                        <div className={cn(
                                            "absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/msg:opacity-100 transition-all",
                                            isMine ? "right-full mr-3" : "left-full ml-3"
                                        )}>
                                            <button onClick={() => setReplyingTo(m)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors" title="Responder"><Reply size={14} /></button>
                                            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors" title="Encaminhar"><Forward size={14} /></button>
                                        </div>
                                    </div>
                                    
                                    {m.reactions && m.reactions.length > 0 && (
                                        <div className="flex gap-1 mt-1">
                                            {m.reactions.map((r, i) => (
                                                <span key={i} className="bg-white/10 border border-white/5 rounded-full px-1.5 py-0.5 text-[10px] filter drop-shadow-md">{r.emoji} {r.count}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                    
                    {isTyping && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%] items-end pr-8">
                             <div className="w-8 h-8 rounded-xl bg-slate-800 shrink-0 mb-1 overflow-hidden">
                               <img src={activeUser.avatar} className="w-full h-full object-cover" />
                             </div>
                             <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-0"></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-300"></span>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Wrapper */}
            <div className="p-5 pb-8 md:pb-6 relative z-20">
                {replyingTo && (
                    <div className="absolute bottom-full left-5 right-5 mb-0 bg-uni-dark/95 backdrop-blur-xl border border-white/10 rounded-t-2xl p-3 flex items-center justify-between border-b-uni-purple/50">
                        <div className="flex items-center gap-3">
                            <Reply size={16} className="text-uni-purple ml-2" />
                            <div className="border-l-2 border-uni-purple pl-3">
                                <p className="text-[10px] font-black text-uni-purple uppercase tracking-widest">{activeUser.name}</p>
                                <p className="text-xs text-slate-400 line-clamp-1">{replyingTo.text}</p>
                            </div>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-500 transition-colors"><X size={16} /></button>
                    </div>
                )}

                <div className={cn(
                    "flex flex-col bg-uni-darker/60 backdrop-blur-2xl border border-white/10 transition-all",
                    replyingTo ? "rounded-b-3xl" : "rounded-3xl"
                )}>
                    {/* Anexo Preview */}
                    {selectedFile && (
                        <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center gap-3">
                            {previewUrl ? (
                                <img src={previewUrl} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                                    <File size={20} className="text-uni-blue" />
                                </div>
                            )}
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm text-white font-bold truncate">{selectedFile.name}</p>
                                <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={() => {setSelectedFile(null); setPreviewUrl(null);}} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex items-center gap-1 border-b border-white/5 px-2 py-1.5 relative">
                        <label className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer" title="Anexar Arquivo">
                            <Plus size={18} />
                            <input type="file" className="hidden" onChange={handleFileSelect} />
                        </label>
                        <label className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer" title="Imagens">
                            <ImageIcon size={18} />
                            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                        </label>
                        <label className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer" title="Documentos">
                            <File size={18} />
                            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" className="hidden" onChange={handleFileSelect} />
                        </label>
                        <div className="w-[1px] h-4 bg-white/10 mx-2"></div>
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-500 hover:text-white transition-colors" title="Emojis">
                            <Smile size={18} />
                        </button>
                        
                        {showEmojiPicker && (
                           <div className="absolute bottom-10 left-32 bg-uni-darker border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-wrap max-w-[200px] gap-2 z-50">
                               {['😀','😂','❤️','👍','🔥','🙌','👏','🎉','🤔','😢','😎','😍','🚀','✨','👀'].map(emoji => (
                                   <button key={emoji} onClick={() => setInput(prev => prev + emoji)} className="text-xl hover:scale-125 transition-transform p-1">
                                       {emoji}
                                   </button>
                               ))}
                           </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 p-2.5 relative">
                        {/* Slide-to-cancel hint and trash zone */}
                        {isRecording && (
                            <div className="absolute inset-x-3 top-0 bottom-0 flex items-center pointer-events-none z-10">
                                {/* Recording waveform + hint */}
                                <div
                                    className="flex-1 rounded-2xl flex items-center justify-between px-4 min-h-[44px] overflow-hidden"
                                    style={{ background: 'rgba(255,255,255,0.05)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                                        <div className="flex items-end gap-0.5">
                                            {[12,20,8,24,16,10,22,14,18].map((h, i) => (
                                                <span
                                                    key={i}
                                                    className="bg-uni-purple/70 rounded-full"
                                                    style={{ width: 3, height: h, animation: `pulse ${0.4 + i * 0.07}s ease-in-out infinite alternate` }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-white font-mono text-sm">{formatTime(recordingTime)}</span>
                                    </div>
                                    <div
                                        className="flex items-center gap-1 text-slate-400 transition-all"
                                        style={{ transform: `translateX(${Math.min(0, dragX * 0.4)}px)`, opacity: Math.max(0.2, 1 + dragX * 0.01) }}
                                    >
                                        <span className="text-xs font-medium">◀ Deslize para cancelar</span>
                                    </div>
                                </div>

                                {/* Trash zone - appears when dragged left */}
                                <div
                                    className={cn(
                                        "ml-2 w-12 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shrink-0",
                                        isOverTrash
                                            ? "bg-red-500 scale-110 shadow-lg shadow-red-500/40"
                                            : dragX < -60
                                                ? "bg-red-500/30 border border-red-500/50"
                                                : "bg-white/5 border border-white/10 opacity-50"
                                    )}
                                >
                                    <Trash2 size={18} className={isOverTrash ? "text-white" : "text-slate-400"} />
                                </div>
                            </div>
                        )}

                        {/* Input or invisible spacer during recording */}
                        {!isRecording && (
                            <textarea
                              rows={1}
                              value={input}
                              onChange={e => {
                                setInput(e.target.value);
                                if (!isTyping) {
                                    setIsTyping(true);
                                    setTimeout(() => setIsTyping(false), 2000);
                                }
                              }}
                              onKeyDown={e => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSend();
                                  }
                              }}
                              placeholder="Mensagem..."
                              className="flex-1 bg-transparent border-none focus:ring-0 text-sm md:text-base px-4 min-h-[44px] py-2.5 max-h-32 resize-none outline-none text-white font-medium"
                            />
                        )}
                        {isRecording && <div className="flex-1" />}

                        <button
                          ref={micBtnRef}
                          onPointerDown={(e) => {
                              if (!input.trim() && !selectedFile) {
                                  e.preventDefault();
                                  isPressingRef.current = true;
                                  (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                  setRecordStartX(e.clientX);
                                  setDragX(0);
                                  setIsOverTrash(false);
                                  startRecording();
                              }
                          }}
                          onPointerMove={(e) => {
                              if (isRecordingRef.current) {
                                  const dx = e.clientX - recordStartX;
                                  setDragX(dx);
                                  setIsOverTrash(dx < -100);
                              }
                          }}
                          onPointerUp={(e) => {
                              isPressingRef.current = false;
                              if (isRecordingRef.current) {
                                  e.preventDefault();
                                  const shouldCancel = isDraggingToTrashRef.current || dragX < -100;
                                  if (shouldCancel) {
                                      cancelRecording();
                                  } else {
                                      stopRecording();
                                  }
                                  setDragX(0);
                                  setIsOverTrash(false);
                              } else if (input.trim() || selectedFile) {
                                  handleSend();
                              }
                          }}
                          onPointerCancel={() => {
                              isPressingRef.current = false;
                              if (isRecordingRef.current) cancelRecording();
                              setDragX(0);
                              setIsOverTrash(false);
                          }}
                          style={{ touchAction: 'none', zIndex: 20 }}
                          disabled={submitting}
                          className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-uni-purple/20 shrink-0 select-none",
                            isRecording && isOverTrash
                                ? "bg-red-500 scale-110"
                                : isRecording
                                    ? "bg-red-500 animate-pulse"
                                    : "bg-gradient-to-r from-uni-purple to-uni-blue hover:scale-105 active:scale-95",
                            submitting && "grayscale opacity-50 pointer-events-none"
                          )}
                        >
                            {submitting ? (
                               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                               (!input.trim() && !selectedFile) ? (
                                   <Mic size={18} className="text-white" />
                               ) : (
                                   <Send size={18} className="text-white ml-0.5" />
                               )
                            )}
                        </button>
                    </div>
                </div>
            </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center text-slate-600 animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                    <MessageCircle size={40} className="opacity-20" />
                </div>
                <h2 className="text-xl font-bold text-slate-400 mb-2">Conectando ao Ecossistema</h2>
                <p className="text-sm font-medium opacity-50">Selecione uma conversa para iniciar a jornada.</p>
            </div>
        )}

        {/* Info Sidebar Overlay */}
        <AnimatePresence>
            {showInfoSidebar && activeUser && (
                <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute top-0 right-0 h-full w-80 bg-uni-darker/95 backdrop-blur-3xl border-l border-white/10 z-[25] p-8 overflow-y-auto custom-scrollbar shadow-[-20px_0_40px_rgba(0,0,0,0.4)]"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Perfil Premium</h2>
                        <button onClick={() => setShowInfoSidebar(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X size={20} /></button>
                    </div>

                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="relative mb-4 group cursor-pointer">
                            <img src={activeUser.avatar} className="w-28 h-28 rounded-3xl object-cover ring-4 ring-uni-purple/20 group-hover:ring-uni-purple transition-all" />
                            <div className="absolute inset-0 bg-uni-purple/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <Search size={20} className="text-white" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-white mb-1">{activeUser.name}</h3>
                        <p className="text-sm font-bold text-uni-blue tracking-tight mb-4 flex items-center gap-1">
                            {activeUser.handle}
                            <div className="w-1.5 h-1.5 rounded-full bg-uni-green"></div>
                        </p>
                        
                        <div className="flex gap-2 w-full">
                            <button className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/10 transition-colors">Perfil</button>
                            <button className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/10 transition-colors">Seguir</button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mídias Compartilhadas</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="aspect-square bg-white/5 rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer border border-white/10">
                                        <img src={`https://picsum.photos/seed/${activeUser.id}${i}/200`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <button className="text-[10px] font-black text-uni-blue uppercase tracking-widest hover:underline w-full pt-2">Ver tudo</button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Configurações</h4>
                            <div className="space-y-2">
                                <button className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-sm font-bold text-slate-300">
                                    Silenciar Notificações
                                    <div className="w-10 h-5 bg-uni-purple/20 rounded-full relative"><div className="absolute top-1 left-1 w-3 h-3 bg-uni-purple rounded-full"></div></div>
                                </button>
                                <button className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-sm font-bold text-slate-300">
                                    Mensagens Temporárias
                                    <span className="text-[10px] text-slate-500">OFF</span>
                                </button>
                            </div>
                        </div>

                        <button className="w-full p-4 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 rounded-xl transition-all">Denunciar / Bloquear</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Call Overlay, Modals... same as before but styled */}

      {/* Call Overlay */}
      {callState && activeUser && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-uni-darker/90 backdrop-blur-2xl text-white">
            <div className="relative mb-8">
                <img src={activeUser.avatar} alt={activeUser.name} className="w-32 h-32 rounded-full border-4 border-uni-blue object-cover" />
                <div className="absolute inset-0 rounded-full border-4 border-uni-purple animate-ping opacity-50"></div>
            </div>
            <h2 className="text-4xl font-display font-bold mb-2">{activeUser.name}</h2>
            <p className="text-uni-green mb-12 text-lg">
                {callState === 'video' ? 'Chamada de Vídeo...' : 'Chamada de Áudio...'}
            </p>
            <div className="flex gap-6">
                <button onClick={() => setCallState(null)} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    <Phone className="text-white transform rotate-[135deg]" size={28} />
                </button>
            </div>
        </div>
      )}

      {/* Context Menu Modal */}
      {contextMenuUser && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-uni-darker/60 backdrop-blur-sm" onClick={() => setContextMenuUser(null)}>
          <div className="glass-card w-full max-w-sm p-4 animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <div className="flex items-center gap-4 border-b border-white/10 pb-4 mb-4">
                 <img src={contextMenuUser.avatar} className="w-12 h-12 rounded-full pointer-events-none" />
                 <div>
                     <h3 className="font-semibold text-lg">{contextMenuUser.name}</h3>
                     <p className="text-sm text-slate-400">{contextMenuUser.handle}</p>
                 </div>
             </div>
             
             <div className="flex flex-col gap-2">
                 <button 
                    onClick={() => { alert(`Enviando contato: ${contextMenuUser.name}`); setContextMenuUser(null); }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-xl transition-colors text-left"
                 >
                     <Send size={20} className="text-uni-blue" />
                     <span>Enviar Contato</span>
                 </button>
                 <button 
                    onClick={() => { setUserToDelete(contextMenuUser); setContextMenuUser(null); }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-xl transition-colors text-left text-red-500"
                 >
                     <Trash2 size={20} />
                     <span>Excluir Contato</span>
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-uni-darker/80 backdrop-blur-xl" onClick={() => setUserToDelete(null)}>
          <div className="glass-card w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center mb-4">
               <Trash2 size={24} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Excluir {userToDelete.name}?</h2>
            <p className="text-sm text-slate-400 mb-6">Esta ação é irreversível. O contato e o histórico de mensagens serão removidos do seu ecossistema.</p>
            
            <div className="flex gap-3">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl font-medium text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => { handleDeleteContact(userToDelete.id); setUserToDelete(null); }}
                  className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-xl font-medium text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-colors"
                >
                  Excluir
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-uni-darker/80 backdrop-blur-xl">
          <div className="glass-card w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsAddingContact(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 bg-uni-purple/20 text-uni-purple rounded-xl flex items-center justify-center mb-4">
               <UserPlus size={24} />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">Novo Contato</h2>
            <p className="text-sm text-slate-400 mb-6">Encontre e adicione novas pessoas ao seu ecossistema Üni.</p>
            
            <input 
              type="text" 
              value={newContactName}
              onChange={e => setNewContactName(e.target.value)}
              placeholder="Nome ou @handle"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white mb-6 focus:ring-2 focus:ring-uni-purple outline-none transition-all"
              autoFocus
            />
            
            <button 
              onClick={handleAddContact}
              disabled={!newContactName.trim()}
              className="w-full bg-gradient-to-r from-uni-purple to-uni-blue py-3 rounded-xl font-medium text-white shadow-lg disabled:opacity-50 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
            >
              Adicionar ao Ecossistema
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
