import React from "react";
import { User, Shield, Zap, Award, Star, History, Bell, Smartphone, Key, ArrowUpRight, Grid, Bookmark, Settings, Edit3, Image as ImageIcon, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
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
  
  const stats = [
    { label: "Posts", value: 124 },
    { label: "Seguidores", value: "2.4k" },
    { label: "Seguindo", value: 890 },
  ];

  const levels = {
    current: 14,
    xp: 2450,
    next: 3000,
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
                 <div className="flex items-center justify-between border-b border-white/5 pb-4">
                     <div className="flex gap-8">
                        <button className="text-sm font-black text-white uppercase tracking-widest border-b-2 border-uni-blue pb-4 -mb-4 flex items-center gap-2">
                           <Grid size={16} />
                           Atividade
                        </button>
                        <button className="text-sm font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 pb-4 -mb-4">
                           <Bookmark size={16} />
                           Salvos
                        </button>
                        <button className="text-sm font-black text-slate-500 uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 pb-4 -mb-4">
                           <History size={16} />
                           Histórico
                        </button>
                     </div>
                 </div>

                 {/* Simulated User Posts */}
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
                    {[1, 2, 3, 4, 5, 6].map((p) => (
                       <div key={p} className="aspect-square glass-card border border-white/5 overflow-hidden group cursor-pointer">
                          <img 
                            src={`https://images.unsplash.com/photo-${1500000000000 + (p * 1000000)}?auto=format&fit=crop&q=80&w=400`} 
                            alt="Post" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                             <div className="flex items-center gap-1.5 text-white">
                                <Star size={16} className="fill-white" />
                                <span className="font-black text-sm">24</span>
                             </div>
                             <div className="flex items-center gap-1.5 text-white">
                                <History size={16} />
                                <span className="font-black text-sm">12</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
          </div>
       </div>
    </div>
  );
}
