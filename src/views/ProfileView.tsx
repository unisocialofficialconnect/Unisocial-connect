import React, { useState, useEffect } from "react";
import { User, Shield, Zap, Award, Star, History, Bell, Smartphone, Key, ArrowUpRight, Grid, Bookmark, Settings, Edit3, Image as ImageIcon, Trash2, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { cn } from "../utils";

export default function ProfileView() {
  const { profile, user } = useAuth();
  
  const [coverImage, setCoverImage] = React.useState<string>(() => {
    return localStorage.getItem("profile_cover_image") || "";
  });

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Por favor, selecione uma imagem menor que 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem("profile_cover_image", base64String);
        setCoverImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverRemove = () => {
    localStorage.removeItem("profile_cover_image");
    setCoverImage("");
  };
  
  const [activeTab, setActiveTab] = useState("Atividade");
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [postsRes, productsRes] = await Promise.all([
        supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('seller_id', user.id).order('created_at', { ascending: false })
      ]);
      if (postsRes.data) setMyPosts(postsRes.data);
      if (productsRes.data) setMyProducts(productsRes.data);
    };
    fetchData();
  }, [user]);

  const handleDeleteProduct = async (id: string) => {
     if (confirm("Tem certeza que deseja excluir este produto?")) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) {
           setMyProducts(prev => prev.filter(p => p.id !== id));
        } else {
           alert("Erro ao excluir: " + error.message);
        }
     }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
     e.preventDefault();
     setSubmitting(true);
     try {
        const { error } = await supabase.from('products').update({
            title: editingProduct.title,
            price: parseFloat(editingProduct.price),
            description: editingProduct.description
        }).eq('id', editingProduct.id);
        
        if (error) throw error;
        
        setMyProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
        setEditingProduct(null);
     } catch(err: any) {
        alert("Erro ao atualizar: " + err.message);
     } finally {
        setSubmitting(false);
     }
  };

  const stats = [
    { label: "Posts", value: myPosts.length },
    { label: "Seguidores", value: 0 },
    { label: "Seguindo", value: 0 },
  ];

  const levels = {
    current: 1,
    xp: 0,
    next: 1000,
  };

  const achievements = [
    { name: "Pioneiro Üni", icon: <Award size={16} />, color: "bg-uni-purple" },
    { name: "Mestre Social", icon: <Star size={16} />, color: "bg-uni-blue" },
    { name: "AI Explorer", icon: <Zap size={16} />, color: "bg-uni-green" },
  ];

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pt-6 pb-32 px-4 md:px-8">
       <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Cover & Profile Header */}
          <div className="relative group">
              {coverImage ? (
                <div className="h-48 md:h-64 rounded-[2.5rem] border border-white/10 overflow-hidden relative bg-uni-darker">
                  <img 
                    src={coverImage} 
                    alt="Capa do Perfil" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ) : (
                <div className="h-48 md:h-64 rounded-[2.5rem] bg-gradient-to-br from-uni-purple/40 via-uni-blue/20 to-uni-green/20 border border-white/10 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                </div>
              )}
              
              {/* Botão de Alterar Capa */}
              <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10 transition-all shadow-lg">
                  <ImageIcon size={14} />
                  <span>Alterar Capa</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleCoverChange} 
                    className="hidden" 
                  />
                </label>
                {coverImage && (
                  <button 
                    onClick={handleCoverRemove}
                    className="flex items-center justify-center p-2.5 rounded-2xl bg-red-500/60 hover:bg-red-500 text-white backdrop-blur-md border border-red-500/20 transition-all shadow-lg"
                    title="Remover foto de capa"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              
              <div className="px-8 -mt-16 relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                 <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
                    <div className="relative group/avatar">
                        <img 
                          src={profile?.avatar || user?.photoURL || "https://i.pravatar.cc/150"} 
                          alt="Avatar" 
                          className="w-32 h-32 md:w-44 md:h-44 rounded-[2.5rem] object-cover border-8 border-uni-darker shadow-2xl relative z-10" 
                        />
                        <button className="absolute bottom-2 right-2 p-3 bg-uni-blue text-white rounded-2xl border-4 border-uni-darker z-20 opacity-0 group-hover/avatar:opacity-100 transition-all shadow-xl">
                            <Edit3 size={16} />
                        </button>
                    </div>
                    
                    <div className="space-y-2 pb-2">
                       <h1 className="text-4xl font-display font-black text-white">{profile?.name || user?.displayName || "Usuário"}</h1>
                       <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                          <span className="text-slate-500 font-bold tracking-widest text-xs uppercase">{profile?.handle || "@user"}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:block"></span>
                          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                             <Shield size={12} className="text-uni-blue" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verificado</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-3 pb-2">
                     <button className="px-8 py-3.5 bg-gradient-to-r from-uni-purple to-uni-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-uni-purple/20">
                        Editar Perfil
                     </button>
                     <button className="p-3.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-colors">
                        <Settings size={20} />
                     </button>
                 </div>
              </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s, i) => (
                  <div key={i} className="glass-card p-6 border border-white/5 text-center flex flex-col items-center">
                      <span className="text-3xl font-display font-black text-white">{s.value}</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{s.label}</span>
                  </div>
              ))}
              <div className="glass-card p-6 border border-white/5 text-center flex flex-col items-center bg-gradient-to-br from-uni-purple/10 to-transparent">
                  <div className="flex items-center gap-2 mb-1">
                      <Zap size={16} className="text-uni-purple" />
                      <span className="text-3xl font-display font-black text-white">Nível {levels.current}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                     <div className="bg-gradient-to-r from-uni-purple to-uni-blue h-full rounded-full" style={{ width: `${(levels.xp / levels.next) * 100}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{levels.xp} / {levels.next} XP</span>
              </div>
          </div>

          {/* Main Grid Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Awards & Security */}
              <div className="lg:col-span-1 space-y-8">
                 {/* Achievements */}
                 <div className="glass-card p-8 border border-white/5 space-y-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Award size={18} className="text-uni-purple" />
                       Conquistas
                    </h3>
                    <div className="flex flex-wrap gap-3">
                       {achievements.map((ach, i) => (
                          <div key={i} className={cn("p-4 rounded-[1.5rem] text-white shadow-lg flex flex-col items-center justify-center gap-2 w-24 h-24", ach.color)}>
                             {ach.icon}
                             <span className="text-[8px] font-black text-center leading-tight uppercase">{ach.name}</span>
                          </div>
                       ))}
                    </div>
                    <button className="w-full text-center text-[10px] font-black text-uni-blue uppercase tracking-widest hover:underline pt-2">Ver Todas (12)</button>
                 </div>

                 {/* Security Status */}
                 <div className="glass-card p-8 border border-white/5 space-y-6 bg-uni-dark/30">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Shield size={18} className="text-uni-blue" />
                       Segurança
                    </h3>
                    <div className="space-y-4">
                       {[
                          { label: "Autenticação 2FA", active: true, icon: <Smartphone size={16} /> },
                          { label: "Alertas de Login", active: true, icon: <Bell size={16} /> },
                          { label: "Trocar Senha", active: false, icon: <Key size={16} /> },
                       ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all">
                             <div className="flex items-center gap-3">
                                <div className="text-slate-500 group-hover:text-uni-blue transition-colors">{item.icon}</div>
                                <span className={cn("text-xs font-bold", item.active ? "text-slate-300" : "text-slate-500")}>{item.label}</span>
                             </div>
                             {item.active ? (
                                <div className="w-2 h-2 rounded-full bg-uni-green"></div>
                             ) : (
                                <ArrowUpRight size={14} className="text-slate-600" />
                             )}
                          </div>
                       ))}
                    </div>
                 </div>


              </div>

              {/* Right Column: Content Feed */}
              <div className="lg:col-span-2 space-y-6">
                 <div className="flex items-center justify-between border-b border-white/5 pb-4 overflow-x-auto custom-scrollbar">
                     <div className="flex gap-6 md:gap-8">
                        {["Atividade", "Salvos", "Histórico", "Market"].map(tab => (
                           <button 
                             key={tab} 
                             onClick={() => setActiveTab(tab)}
                             className={cn(
                               "text-sm font-black uppercase tracking-widest flex items-center gap-2 pb-4 -mb-4 transition-all whitespace-nowrap",
                               activeTab === tab ? "text-white border-b-2 border-uni-blue" : "text-slate-500 hover:text-white"
                             )}>
                              {tab === "Atividade" && <Grid size={16} />}
                              {tab === "Salvos" && <Bookmark size={16} />}
                              {tab === "Histórico" && <History size={16} />}
                              {tab === "Market" && <ShoppingBag size={16} />}
                              {tab}
                           </button>
                        ))}
                     </div>
                 </div>

                 {activeTab === "Atividade" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                       {myPosts.length === 0 ? (
                           <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-500">
                               <Grid size={32} className="mb-2 opacity-50" />
                               <p className="text-sm font-bold uppercase tracking-widest">Nenhum post publicado ainda.</p>
                           </div>
                       ) : (
                           myPosts.map((p) => (
                              <div key={p.id} className="aspect-square glass-card border border-white/5 overflow-hidden group cursor-pointer relative bg-slate-800">
                                 {p.image_url ? (
                                   <img src={p.image_url} alt="Post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-white p-4 text-xs overflow-hidden text-center opacity-80 group-hover:scale-105 transition-transform">
                                      {p.content || p.text}
                                   </div>
                                 )}
                              </div>
                           ))
                       )}
                    </div>
                 )}

                 {activeTab === "Market" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                       {myProducts.length === 0 ? (
                           <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-500">
                               <ShoppingBag size={32} className="mb-2 opacity-50" />
                               <p className="text-sm font-bold uppercase tracking-widest">Nenhum produto à venda ainda.</p>
                           </div>
                       ) : (
                           myProducts.map((p) => (
                              <div key={p.id} className="glass-card border border-white/5 overflow-hidden flex flex-col group bg-white/5">
                                  <div className="aspect-video relative overflow-hidden bg-slate-800">
                                     <img src={p.image_url?.split(',')[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  </div>
                                  <div className="p-4 flex flex-col justify-between flex-1">
                                     <div>
                                        <h4 className="text-white font-bold truncate text-sm">{p.title}</h4>
                                        <p className="text-uni-blue font-black tabular-nums mt-1">R$ {p.price}</p>
                                     </div>
                                     <div className="flex gap-2 mt-4">
                                        <button onClick={() => setEditingProduct(p)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"><Edit3 size={14}/> Editar</button>
                                        <button onClick={() => handleDeleteProduct(p.id)} className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"><Trash2 size={14}/> Excluir</button>
                                     </div>
                                  </div>
                              </div>
                           ))
                       )}
                    </div>
                 )}

                 {(activeTab === "Salvos" || activeTab === "Histórico") && (
                     <div className="py-10 flex flex-col items-center justify-center text-slate-500">
                         {activeTab === "Salvos" ? <Bookmark size={32} className="mb-2 opacity-50" /> : <History size={32} className="mb-2 opacity-50" />}
                         <p className="text-sm font-bold uppercase tracking-widest">Nenhum item {activeTab.toLowerCase()} ainda.</p>
                     </div>
                 )}
              </div>
          </div>
       </div>

       {/* Modal Editar Produto */}
       {editingProduct && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
             <div className="bg-uni-dark w-full max-w-md rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                   <h2 className="text-xl font-bold text-white">Editar Produto</h2>
                   <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={20} /></button>
                </div>
                <form onSubmit={handleUpdateProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                   <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Título</label>
                      <input type="text" required value={editingProduct.title} onChange={e => setEditingProduct({...editingProduct, title: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-uni-purple" />
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Descrição</label>
                      <textarea required value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} rows={4} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white resize-none outline-none focus:ring-1 focus:ring-uni-purple"></textarea>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-400 mb-1">Preço (R$)</label>
                      <input type="number" required min="0" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-uni-purple" />
                   </div>
                   <button disabled={submitting} type="submit" className="w-full bg-uni-purple py-3.5 rounded-xl font-black uppercase tracking-widest text-xs text-white mt-4 hover:scale-[1.02] transition-transform">
                      {submitting ? "Processando..." : "Salvar Alterações"}
                   </button>
                </form>
             </div>
          </div>
       )}
    </div>
  );
}
