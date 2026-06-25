import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, Send, X, Copy, Bell, Smile, TrendingUp, UserPlus, Sparkles, Search, Plus, Check, Bookmark } from "lucide-react";
import { Post } from "../types";
import { cn } from "../utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { NotificationsDropdown } from "../components/NotificationsDropdown";

export default function FeedView() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [postLikes, setPostLikes] = useState<Record<string, {count: number, likedByMe: boolean}>>({});
  const { user, profile } = useAuth();
  const avatarUrl = profile?.avatar || user?.user_metadata?.avatar_url || "https://i.pravatar.cc/150?u=" + (user?.id || "u1");
  const [submitting, setSubmitting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentImageFile, setCommentImageFile] = useState<File | null>(null);
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<Record<string, any[]>>({});
  const [postCommentCounts, setPostCommentCounts] = useState<Record<string, number>>({});
  const [showLikesModal, setShowLikesModal] = useState<string | null>(null);
  const [likesUsers, setLikesUsers] = useState<any[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar posts:', error.message);
      return;
    }
    if (!data) { setPosts([]); return; }

    // Busca usuários sem FK
    const userIds = [...new Set(data.map((p: any) => p.user_id || p.userId).filter(Boolean))];
    let usersMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: usersData } = await supabase.from('users').select('*').in('id', userIds);
      if (usersData) usersData.forEach((u: any) => { usersMap[u.id] = u; });
    }

    // Busca likes e comment counts
    if (data.length > 0) {
      const postIds = data.map((p: any) => p.id);
      
      const { data: likesData } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds);
      const likesMap: Record<string, {count: number, likedByMe: boolean}> = {};
      if (likesData) {
        likesData.forEach((l: any) => {
          if (!likesMap[l.post_id]) likesMap[l.post_id] = { count: 0, likedByMe: false };
          likesMap[l.post_id].count++;
          if (user && l.user_id === user.id) likesMap[l.post_id].likedByMe = true;
        });
      }
      setPostLikes(likesMap);

      const { data: commentsData } = await supabase.from('comments').select('post_id').in('post_id', postIds);
      const commentsMap: Record<string, number> = {};
      if (commentsData) {
        commentsData.forEach((c: any) => {
          commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
        });
      }
      setPostCommentCounts(commentsMap);
    }

    const enriched = data.map((p: any) => ({ ...p, user: usersMap[p.user_id || p.userId] || null }));
    setPosts(enriched);
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase.channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, payload => {
        fetchPosts(); // recarregar para simplificar e obter os joins
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('timestamp', { ascending: true });
      
    if (error) { console.error('Erro comentários:', error.message); return; }
    if (!data) return;

    // Busca usuários dos comentários sem FK
    const uids = [...new Set(data.map((c: any) => c.user_id).filter(Boolean))];
    let uMap: Record<string, any> = {};
    if (uids.length > 0) {
      const { data: ud } = await supabase.from('users').select('*').in('id', uids);
      if (ud) ud.forEach((u: any) => { uMap[u.id] = u; });
    }
    setPostComments(prev => ({ ...prev, [postId]: data.map((c: any) => ({ ...c, user: uMap[c.user_id] || null })) }));
  };

  useEffect(() => {
    if (!activeCommentPost) return;
    
    fetchComments(activeCommentPost);

    const channel = supabase.channel(`public:comments:postId=eq.${activeCommentPost}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `postId=eq.${activeCommentPost}` }, payload => {
        fetchComments(activeCommentPost);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCommentPost]);

  useEffect(() => {
    if (!user) return;
    
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('userId', user.id)
        .eq('read', false);
      setUnreadCount(count || 0);
    };
    
    fetchUnread();
    
    const channel = supabase.channel(`public:notifications:userId=eq.${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `userId=eq.${user.id}` }, payload => {
        fetchUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createNotification = async (receiverId: string | undefined, type: 'like' | 'comment', postId: string) => {
    if (!user || !receiverId || user.id === receiverId) return;
    try {
      await supabase.from('notifications').insert([{
        user_id: receiverId,
        senderId: user.id,
        type,
        postId,
        read: false,
        timestamp: new Date().toISOString()
      }]);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePost = async () => {
    if ((!newPost.trim() && !postImageFile) || !user) return;
    setSubmitting(true);
    try {
      let uploadedImageUrl = null;
      if (postImageFile) {
         const fileExt = postImageFile.name.split('.').pop();
         const fileName = `${Math.random()}.${fileExt}`;
         const filePath = `${user.id}/${fileName}`;
         
         const { error: uploadError, data } = await supabase.storage.from('media').upload(filePath, postImageFile);
         if (uploadError) throw uploadError;
         
         const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
         uploadedImageUrl = publicUrl;
      }

      const { error } = await supabase.from('posts').insert([{
        user_id: user.id,
        text: newPost,
        image: uploadedImageUrl,
        timestamp: new Date().toISOString()
      }]);
      
      if (error) {
         alert("Erro do banco de dados ao publicar: " + error.message);
         return;
      }
      
      setNewPost("");
      setPostImage(null);
      setPostImageFile(null);
    } catch(e: any) {
      alert("Erro de conexão ao publicar: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLike = async (postId: string, postAuthorId: string) => {
    if (!user) return;
    const already = postLikes[postId]?.likedByMe;
    // Atualização otimista
    setPostLikes(prev => ({
      ...prev,
      [postId]: {
        count: (prev[postId]?.count || 0) + (already ? -1 : 1),
        likedByMe: !already
      }
    }));
    try {
      if (already) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('post_likes').insert([{ post_id: postId, user_id: user.id }]);
        await createNotification(postAuthorId, 'like', postId);
      }
    } catch(e) {
      // Reverter otimismo em caso de erro
      setPostLikes(prev => ({ ...prev, [postId]: { count: (prev[postId]?.count || 0) + (already ? 1 : -1), likedByMe: !!already } }));
    }
  };

  const handleViewLikes = async (postId: string) => {
    setShowLikesModal(postId);
    setLoadingLikes(true);
    setLikesUsers([]);
    try {
      const { data: likesData } = await supabase.from('post_likes').select('user_id').eq('post_id', postId);
      if (!likesData || likesData.length === 0) { setLoadingLikes(false); return; }
      const uids = likesData.map((l: any) => l.user_id);
      const { data } = await supabase.from('users').select('*').in('id', uids);
      if (data) setLikesUsers(data);
    } catch(e) { console.error(e); } finally { setLoadingLikes(false); }
  };

  const handleCommentSubmit = async (postId: string, postAuthorId: string | undefined) => {
    if (!user || (!commentText.trim() && !commentImageFile)) return;
    try {
      let uploadedImageUrl: string | null = null;
      if (commentImageFile) {
        const ext = commentImageFile.name.split('.').pop();
        const path = `${user.id}/comments/${Math.random()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, commentImageFile);
        if (!upErr) {
          const { data: pubData } = supabase.storage.from('media').getPublicUrl(path);
          uploadedImageUrl = pubData.publicUrl;
        }
      }

      const payload: any = {
        post_id: postId,
        user_id: user.id,
        text: commentText,
        timestamp: new Date().toISOString()
      };
      if (uploadedImageUrl) payload.image = uploadedImageUrl;

      const { error } = await supabase.from('comments').insert([payload]);
      if (error) { alert('Erro ao comentar: ' + error.message); return; }
      
      await createNotification(postAuthorId, 'comment', postId);
      await fetchComments(postId);
      
      // Update comment count locally
      setPostCommentCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      
      setCommentText('');
      setCommentImageFile(null);
      setCommentImagePreview(null);
      setShowEmojiPicker(false);
    } catch(e: any) {
      alert("Erro ao enviar: " + (e.message || "Tente novamente."));
    }
  };

  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setCommentImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleShare = (postId: string) => {
    setSharePostId(postId);
  };

  const getShareLink = () => `${window.location.origin}/#post-${sharePostId}`;

  const displayPosts = posts
    .filter(post => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return post.text?.toLowerCase().includes(term) || post.user?.name?.toLowerCase().includes(term);
    })
    .map(post => {
      if (post.userId === user?.id && profile) {
        return { ...post, user: { ...post.user, ...profile } };
      }
      return post;
    });

  const getDisplayComments = (postId: string) => {
    return (postComments[postId] || []).map(comment => {
      if (comment.userId === user?.id && profile) {
        return { ...comment, user: { ...comment.user, ...profile } };
      }
      return comment;
    });
  };

  return (
    <div className="w-full h-full overflow-hidden flex flex-col md:flex-row">
      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto custom-scrollbar pb-32 pt-6 px-4 md:px-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Mobile */}
          <div className="md:hidden flex items-center justify-between mb-6 shrink-0 relative">
            <h1 className="text-2xl font-bold text-white">Feed</h1>
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full border border-white/10 hover:bg-white/10"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-0.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg z-10">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationsDropdown 
              isOpen={showNotifications} 
              onClose={() => setShowNotifications(false)} 
            />
          </div>

           {/* Stories (Somente seu story para produção) */}
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar no-scrollbar scroll-smooth">
             <div className="flex flex-col items-center gap-2 group cursor-pointer shrink-0">
                <div className="w-16 h-16 rounded-full p-1 border-2 border-dashed border-slate-700 group-hover:border-uni-purple transition-colors relative">
                   <img src={avatarUrl} alt="Me" className="w-full h-full rounded-full object-cover" />
                   <div className="absolute bottom-0 right-0 bg-uni-blue rounded-full p-1 border-2 border-uni-dark">
                      <Plus size={10} className="text-white" />
                   </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seu Story</span>
             </div>
          </div>

          {/* Create Post */}
          <div className="glass-card p-5 shrink-0 border border-white/5 bg-gradient-to-br from-white/5 to-transparent">
            <div className="flex gap-4">
              <img src={avatarUrl} alt="Me" className="w-12 h-12 rounded-full border-2 border-uni-purple/30 object-cover" />
              <div className="flex-1">
                <textarea 
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="O que está acontecendo no seu mundo?"
                  className="w-full bg-transparent border-none resize-none focus:ring-0 text-lg placeholder:text-slate-500 min-h-[80px] outline-none text-white font-medium"
                />
                {postImage && (
                    <div className="mt-2 relative inline-block rounded-xl overflow-hidden border border-white/10">
                        <img src={postImage} alt="Preview" className="max-h-40 object-cover" />
                        <button onClick={() => { setPostImage(null); setPostImageFile(null); }} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white hover:bg-red-500/80 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer p-2.5 text-slate-400 hover:text-uni-blue hover:bg-uni-blue/10 rounded-xl transition-colors border border-transparent hover:border-uni-blue/20">
                      <ImageIcon size={20} />
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={handlePostImageSelect} />
                    </label>
                    <label className="cursor-pointer p-2.5 text-slate-400 hover:text-uni-green hover:bg-uni-green/10 rounded-xl transition-colors border border-transparent hover:border-uni-green/20">
                      <div className="w-5 h-5 flex items-center justify-center border-2 border-current rounded text-xs font-bold">GIF</div>
                      <input type="file" accept=".gif,image/gif" className="hidden" onChange={handlePostImageSelect} />
                    </label>
                  </div>
                  <button 
                    onClick={handlePost}
                    disabled={(!newPost.trim() && !postImageFile) || submitting}
                    className="bg-gradient-to-r from-uni-purple to-uni-blue px-8 py-2.5 rounded-full font-bold text-white shadow-lg hover:shadow-uni-purple/40 transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                  >
                    {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Publicar"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-6 flex-1">
            {displayPosts.map((post, idx) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="glass-card p-6 border border-white/5 relative group"
                id={`post-${post.id}`}
              >
                {post.pinned && (
                   <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[10px] font-bold text-uni-blue uppercase tracking-widest bg-uni-blue/10 px-2 py-0.5 rounded-full border border-uni-blue/20">
                      <span className="w-1 h-1 rounded-full bg-uni-blue animate-pulse"></span>
                      Fixado
                   </div>
                )}

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <img src={post.user?.avatar} alt={post.user?.name} className="w-11 h-11 rounded-full object-cover border-2 border-white/5 group-hover:border-uni-purple/50 transition-colors" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white hover:text-uni-purple cursor-pointer transition-colors">{post.user?.name}</span>
                        {post.user?.verified && <div className="w-3.5 h-3.5 bg-uni-blue rounded-full flex items-center justify-center"><Check size={8} className="text-white" /></div>}
                      </div>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">
                        {post.user?.handle} • {post.timestamp ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: ptBR }) : 'agora mesmo'}
                      </span>
                    </div>
                  </div>
                  <button className="p-2 text-slate-500 hover:text-white transition-colors hover:bg-white/5 rounded-full">
                      <MoreHorizontal size={20} />
                  </button>
                </div>

                <p className="text-slate-200 mb-5 whitespace-pre-wrap leading-relaxed text-base md:text-lg">{post.text}</p>
                
                {post.image && (
                  <div className="rounded-2xl overflow-hidden mb-5 border border-white/5 bg-slate-900 aspect-video md:aspect-auto">
                    <img src={post.image} alt="Post content" className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                )}

                  <div className="flex items-center justify-between text-slate-400 border-t border-white/5 pt-5">
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 group/btn">
                      <button onClick={() => handleLike(post.id, post.user_id || post.userId)} className={cn("flex items-center p-2 rounded-full hover:bg-uni-purple/10 transition-colors", postLikes[post.id]?.likedByMe ? "text-uni-purple" : "text-slate-400 hover:text-uni-purple")}>
                        <Heart size={20} className={cn("transition-transform group-active/btn:scale-125", postLikes[post.id]?.likedByMe ? "fill-uni-purple" : "")} />
                      </button>
                      <button onClick={() => handleViewLikes(post.id)} className="text-sm font-bold hover:underline cursor-pointer tracking-wider">{postLikes[post.id]?.count || 0}</button>
                    </div>

                    <button onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)} className={cn("flex items-center gap-2 p-2 rounded-full hover:bg-uni-blue/10 transition-colors group/comment", activeCommentPost === post.id ? "text-uni-blue" : "text-slate-400 hover:text-uni-blue")}>
                      <MessageCircle size={20} className="group-hover/comment:fill-uni-blue/10" />
                      <span className="text-sm font-bold tracking-wider">{postCommentCounts[post.id] || 0}</span>
                    </button>

                    <button onClick={() => handleShare(post.id)} className="flex items-center gap-2 p-2 rounded-full hover:bg-uni-green/10 transition-colors hover:text-uni-green">
                      <Share2 size={20} />
                      <span className="text-sm font-bold tracking-wider">{post.shares || 0}</span>
                    </button>
                  </div>

                  <button className="p-2 text-slate-500 hover:text-uni-purple transition-colors hover:bg-white/5 rounded-full">
                    <Bookmark size={20} />
                  </button>
                </div>
                
                {activeCommentPost === post.id && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 pt-6 border-t border-white/5"
                    >
                        <div className="space-y-5 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {getDisplayComments(post.id).length === 0 && (
                                <div className="text-center py-8">
                                   <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-3">
                                      <MessageCircle size={20} className="text-slate-600" />
                                   </div>
                                   <p className="text-sm text-slate-500 font-medium">Sem comentários ainda. Comece a conversa!</p>
                                </div>
                            )}
                            {getDisplayComments(post.id).map((comment) => (
                                <div key={comment.id} className="flex gap-4">
                                    <img src={comment.user?.avatar} alt={comment.user?.name} className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/5" />
                                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-4 flex-1 text-sm overflow-hidden shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                           <span className="font-bold text-white">{comment.user?.name}</span>
                                           <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{comment.timestamp ? formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: ptBR }) : ''}</span>
                                        </div>
                                        {comment.text && <p className="text-slate-300 leading-relaxed">{comment.text}</p>}
                                        {comment.image && <img src={comment.image} alt="comentário" className="mt-3 max-w-full rounded-xl max-h-64 object-contain" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex gap-4 items-center">
                            <img src={avatarUrl} alt="Me" className="w-9 h-9 rounded-full object-cover border-2 border-uni-purple/20 shrink-0" />
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl pr-2 shadow-inner w-full">
                                    <input 
                                        type="text" 
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        placeholder="Escreva um comentário..."
                                        className="w-full bg-transparent pl-5 pr-2 py-3 text-sm text-white focus:outline-none placeholder:text-slate-600 font-medium"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleCommentSubmit(post.id, post.user_id || post.userId);
                                        }}
                                    />
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-500 hover:text-white transition-colors"><Smile size={18} /></button>
                                        <label className="p-2 text-slate-500 hover:text-white transition-colors cursor-pointer"><ImageIcon size={18} /><input type="file" accept="image/*" className="hidden" onChange={handleCommentImageUpload} /></label>
                                    </div>
                                    {showEmojiPicker && (
                                        <div className="absolute bottom-full right-0 mb-4 bg-uni-darker border border-white/10 rounded-2xl p-3 shadow-2xl z-50 flex gap-2">
                                            {['👍', '❤️', '😂', '🔥', '🤔', '🎉', '😢', '👏'].map(emoji => (
                                                <button key={emoji} onClick={() => { setCommentText(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-xl hover:bg-white/10 p-2 rounded-xl transition-colors">{emoji}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {commentImagePreview && (
                                    <div className="relative w-max">
                                        <img src={commentImagePreview} alt="Preview" className="h-20 rounded-xl object-cover border border-white/10" />
                                        <button onClick={() => { setCommentImagePreview(null); setCommentImageFile(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110"><X size={12} /></button>
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={() => handleCommentSubmit(post.id, post.user_id || post.userId)}
                                disabled={!commentText.trim() && !commentImageFile}
                                className="shrink-0 w-11 h-11 bg-uni-blue rounded-full flex items-center justify-center text-white shadow-lg shadow-uni-blue/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                            >
                                <Send size={18} className="ml-1" />
                            </button>
                        </div>
                    </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden xl:flex flex-col w-80 h-full overflow-y-auto custom-scrollbar border-l border-white/5 py-10 px-6 space-y-10 shrink-0">
        {/* Search */}
        <div className="relative">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
           <input 
              type="text" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Busca Inteligente Üni"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-uni-purple outline-none transition-all placeholder:text-slate-600 font-medium text-white"
           />
           {searchTerm && (
             <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
               <X size={16} />
             </button>
           )}
        </div>

        {/* Em Alta */}
        <section className="glass-card p-6 border border-white/5 bg-gradient-to-br from-uni-purple/5 to-transparent">
           <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-uni-purple" />
              🔥 Em Alta
           </h3>
           <div className="space-y-5">
              {[
                { label: "#UniSocial", posts: "245k posts" },
                { label: "Üni AI", posts: "128k posts" },
                { label: "#Marketplace", posts: "89k posts" },
                { label: "#Web3", posts: "54k posts" },
              ].map((trend, i) => (
                <div key={i} className="group cursor-pointer" onClick={() => setSearchTerm(trend.label)}>
                   <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{trend.posts}</p>
                   <p className="font-bold text-white group-hover:text-uni-purple transition-colors">{trend.label}</p>
                </div>
              ))}
           </div>
           <button className="w-full mt-8 py-2.5 text-xs font-black text-uni-blue uppercase tracking-tighter hover:underline">Ver mais tendências</button>
        </section>

        {/* AI Insight Sidebar Ocultado ou Reduzido para Produção - Como não há bots, recomendação está estática, mantemos por UI. */}

        {/* AI Insight Sidebar */}
        <section className="glass-card p-6 bg-gradient-to-tr from-uni-purple/10 via-uni-blue/10 to-transparent border border-uni-purple/20">
           <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-uni-purple" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Üni AI Insight</h3>
           </div>
           <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
             Analisei seu feed e vi que você gosta de tecnologia. A comunidade <b>"Dev Universe"</b> tem posts novos que podem te interessar!
           </p>
           <button className="w-full py-2.5 rounded-xl bg-uni-purple/20 text-uni-purple text-[10px] font-black uppercase tracking-widest hover:bg-uni-purple/30 border border-uni-purple/30 transition-all">Ver Recomendação</button>
        </section>
      </aside>

      {/* Share Modal */}
      {sharePostId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-uni-darker/80 backdrop-blur-xl" onClick={() => setSharePostId(null)}>
          <div 
            className="w-full max-w-sm glass-card p-6 relative animate-in zoom-in-95 duration-200 border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSharePostId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-display font-bold mb-6 text-white">Compartilhar Publicação</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <a 
                    href={`https://wa.me/?text=Confira este post na Uni Social! ${getShareLink()}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                >
                    <span className="font-semibold">WhatsApp</span>
                </a>
                <a 
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareLink())}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors"
                >
                    <span className="font-semibold">Facebook</span>
                </a>
                <a 
                    href={`https://t.me/share/url?url=${encodeURIComponent(getShareLink())}&text=Confira este post na Uni Social!`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-colors"
                >
                    <span className="font-semibold">Telegram</span>
                </a>
                <a 
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareLink())}&text=Confira este post na Uni Social!`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                    <span className="font-semibold">X (Twitter)</span>
                </a>
            </div>

            <div className="relative">
                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 truncate pr-12 select-all">
                    {getShareLink()}
                </div>
                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(getShareLink());
                        alert("Link copiado!");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <Copy size={16} />
                </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Likes Modal */}
      {showLikesModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-uni-darker/80 backdrop-blur-xl" onClick={() => setShowLikesModal(null)}>
          <div 
            className="w-full max-w-sm glass-card p-6 relative animate-in zoom-in-95 duration-200 border border-white/10 shadow-2xl flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowLikesModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-display font-bold mb-4 text-white flex items-center gap-2">
              <Heart size={20} className="fill-uni-purple text-uni-purple" />
              Curtidas
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
               {loadingLikes ? (
                 <div className="flex justify-center py-8">
                   <div className="w-6 h-6 border-2 border-uni-purple/30 border-t-uni-purple rounded-full animate-spin"></div>
                 </div>
               ) : likesUsers.length === 0 ? (
                 <div className="text-center text-slate-400 py-8">Nenhum resultado encontrado.</div>
               ) : (
                 likesUsers.map(u => (
                   <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors">
                     <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                     <div>
                       <p className="font-semibold text-sm text-white flex items-center gap-1">
                          {u.name}
                          {u.verified && <span className="w-3 h-3 bg-uni-blue rounded-full"></span>}
                       </p>
                       <p className="text-xs text-slate-400">{u.handle}</p>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
