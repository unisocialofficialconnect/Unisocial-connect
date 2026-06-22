import React, { useState } from "react";
import { Users, Hash, Shield, Globe, Lock, Plus, Search, ChevronRight, MessageSquare, Video, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils";

const COMMUNITIES = [
  { id: 1, name: "Üni Creators", members: 12400, description: "A maior comunidade de criadores do ecossistema Üni.", type: "Public" },
  { id: 2, name: "Developers Hub", members: 8200, description: "Discussões técnicas e suporte para a Üni API.", type: "Public" },
  { id: 3, name: "Marketplace Insights", members: 3500, description: "Dicas e tendências para vendedores do Marketplace.", type: "Private" },
  { id: 4, name: "Üni Gaming", members: 25000, description: "Torneios e gameplay integrados.", type: "Public" },
];

export default function CommunitiesView() {
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);

  if (selectedCommunity) {
    return (
      <div className="w-full h-full flex flex-col md:flex-row bg-uni-darker/20">
         {/* Community Sidebar */}
         <aside className="w-full md:w-64 bg-uni-dark/30 border-r border-white/5 flex flex-col pt-6">
            <div className="px-5 mb-8 flex items-center justify-between">
                <button onClick={() => setSelectedCommunity(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                    <ChevronRight className="rotate-180" size={20} />
                </button>
                <button className="p-2 bg-uni-purple/20 text-uni-purple rounded-xl">
                    <Plus size={20} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar">
                <div>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-3">Canais</h3>
                   <div className="space-y-1">
                      {["geral", "anúncios", "regras", "suporte"].map((channel) => (
                          <button key={channel} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group">
                              <Hash size={18} className="text-slate-600 group-hover:text-uni-blue" />
                              <span className="text-sm font-bold capitalize">{channel}</span>
                          </button>
                      ))}
                   </div>
                </div>

                <div>
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 mb-3">Tópicos</h3>
                   <div className="space-y-1">
                      {["Feedback", "Ideias", "Showcase"].map((topic) => (
                          <button key={topic} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group">
                              <MessageSquare size={16} className="text-slate-600 group-hover:text-uni-purple" />
                              <span className="text-sm font-bold">{topic}</span>
                          </button>
                      ))}
                   </div>
                </div>
            </div>
         </aside>

         {/* Community Main Area */}
         <div className="flex-1 flex flex-col relative overflow-hidden">
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-uni-darker/40 backdrop-blur-3xl relative z-20">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                       <Hash size={20} className="text-uni-blue" />
                   </div>
                   <div>
                       <h2 className="font-display font-black text-lg text-white">#geral</h2>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedCommunity.name}</p>
                   </div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2.5 text-slate-400 hover:text-white transition-all"><Video size={20} /></button>
                    <button className="p-2.5 text-slate-400 hover:text-white transition-all"><Users size={20} /></button>
                    <button className="p-2.5 text-slate-400 hover:text-white transition-all"><Info size={20} /></button>
                </div>
            </header>

            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col-reverse">
                {/* Simulated Chat in Community */}
                <div className="space-y-8">
                   {[1, 2, 3].map((m) => (
                       <div key={m} className="flex gap-4 group">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 shrink-0"></div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <span className="text-sm font-black text-white">User {m}</span>
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">12:30 PM</span>
                             </div>
                             <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
                                Com certeza! A nova integração com a Üni AI facilitou muito o fluxo de trabalho aqui na comunidade. Alguém já testou os comandos de voz?
                             </p>
                             <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-400 hover:text-white">Reagir</button>
                                <button className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-slate-400 hover:text-white">Responder</button>
                             </div>
                          </div>
                       </div>
                   ))}
                </div>
            </div>

            <div className="p-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-4">
                    <button className="p-3 text-slate-500 hover:text-white transition-colors">
                        <Plus size={20} />
                    </button>
                    <input 
                      type="text" 
                      placeholder={`Conversar em #${selectedCommunity.name.toLowerCase().replace(' ', '-')}`}
                      className="flex-1 bg-transparent border-none text-white focus:ring-0 text-sm font-medium"
                    />
                </div>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar pt-6 px-4 md:px-8 pb-32">
       <div className="max-w-7xl mx-auto w-full space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-uni-purple to-uni-blue rounded-3xl flex items-center justify-center shadow-lg shadow-uni-purple/20">
                      <Users size={28} className="text-white" />
                  </div>
                  <div>
                      <h1 className="text-4xl font-display font-black tracking-tight text-white">Comunidades</h1>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Explore, Converse, Colabore</p>
                  </div>
              </div>

              <div className="flex gap-3">
                 <div className="relative group flex-1 md:w-80">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-uni-purple transition-colors" />
                    <input 
                       type="text" 
                       placeholder="Buscar comunidades..."
                       className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-uni-purple transition-all placeholder:text-slate-600 font-medium"
                    />
                 </div>
                 <button className="px-6 bg-uni-purple text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all items-center gap-2 hidden md:flex">
                    <Plus size={18} />
                    Criar
                 </button>
              </div>
          </div>

          {/* Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {COMMUNITIES.map((com) => (
                  <motion.div 
                    key={com.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedCommunity(com)}
                    className="glass-card group p-8 border border-white/5 cursor-pointer hover:border-uni-purple/30 relative overflow-hidden bg-uni-dark/40"
                  >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-uni-purple/5 blur-[40px] rounded-full pointer-events-none transition-all group-hover:bg-uni-purple/10"></div>
                     
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-slate-800 rounded-[1.5rem] border border-white/10 flex items-center justify-center">
                           <Users size={24} className="text-uni-purple" />
                        </div>
                        <div className={cn(
                           "px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                           com.type === "Public" ? "bg-uni-green/20 text-uni-green" : "bg-uni-blue/20 text-uni-blue"
                        )}>
                           <div className="flex items-center gap-1.5">
                              {com.type === "Public" ? <Globe size={10} /> : <Lock size={10} />}
                              {com.type}
                           </div>
                        </div>
                     </div>

                     <h3 className="text-2xl font-display font-black text-white mb-2">{com.name}</h3>
                     <p className="text-slate-400 font-medium text-sm leading-relaxed mb-6">{com.description}</p>

                     <div className="flex items-center justify-between border-t border-white/5 pt-6">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Membros</span>
                           <span className="text-lg font-black text-white tracking-tight">{com.members.toLocaleString()}</span>
                        </div>
                        <button className="p-3 bg-white/5 rounded-2xl group-hover:bg-uni-purple transition-all text-white">
                           <ChevronRight size={20} />
                        </button>
                     </div>
                  </motion.div>
              ))}
          </div>

          {/* Create Button Mobile */}
          <button className="md:hidden w-full py-5 bg-uni-purple text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-uni-purple/20 flex items-center justify-center gap-3">
             <Plus size={20} />
             Criar Comunidade
          </button>
       </div>
    </div>
  );
}
