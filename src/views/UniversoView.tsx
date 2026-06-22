import React from "react";
import { motion } from "motion/react";
import { Sparkles, MessageSquare, TrendingUp, Calendar, ShoppingCart, UserCheck, LayoutGrid, Zap, Star } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function UniversoView() {
  const { user, profile } = useAuth();
  
  const stats = [
    { label: "Experiência (XP)", value: profile?.xp || 0, icon: Zap, color: "text-uni-purple" },
    { label: "Selo", value: profile?.level || 1, icon: Star, color: "text-uni-blue" },
    { label: "Reputação", value: `${profile?.reputation || 100}%`, icon: UserCheck, color: "text-uni-green" },
  ];

  const recentActivities = [
    { type: "feed", title: "Novo post de @patrick", time: "2 min atrás", icon: LayoutGrid },
    { type: "chat", title: "Mensagem de Comunidade Gamer", time: "5 min atrás", icon: MessageSquare },
    { type: "market", title: "Item em oferta: MacBook Pro", time: "15 min atrás", icon: ShoppingCart },
  ];

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-6 md:p-10 pb-32">
      <header className="mb-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter mb-2">
              Universo Üni
            </h1>
            <p className="text-slate-400 font-medium">Bem-vindo de volta, {profile?.name || user?.displayName || "Explorador"}.</p>
          </div>
          
          <div className="flex gap-4">
             {stats.map((s, i) => (
                <div key={i} className="glass px-4 py-3 rounded-2xl flex items-center gap-3 border border-white/5">
                   <s.icon size={18} className={s.color} />
                   <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{s.label}</p>
                      <p className="text-lg font-bold text-white leading-none mt-1">{s.value}</p>
                   </div>
                </div>
             ))}
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Dashboard Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Quick Insight */}
          <section className="relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-uni-purple/20 via-uni-blue/20 to-uni-green/20 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
            <div className="glass-card p-8 relative z-10 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-uni-purple to-uni-blue flex items-center justify-center">
                    <Sparkles className="text-white" size={20} />
                 </div>
                 <h3 className="text-xl font-bold text-white font-display">Üni AI Insight</h3>
              </div>
              <p className="text-slate-200 text-lg leading-relaxed mb-6">
                "Você tem 3 novas mensagens em Comunidades e 2 itens favoritados no Marketplace baixaram de preço. Que tal criar um post sobre seu dia hoje?"
              </p>
              <div className="flex flex-wrap gap-3">
                 <Link to="/app/ai" className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-full text-sm font-bold transition-all border border-white/10">Resumir Feed</Link>
                 <button className="bg-uni-blue hover:bg-uni-blue-dark px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-uni-blue/20">Criar Post com IA</button>
              </div>
            </div>
          </section>

          {/* Quick Shortcuts Grid */}
          <section>
            <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
               <TrendingUp size={20} className="text-uni-blue" />
               Acesso Rápido
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: "Feed", to: "/app", icon: LayoutGrid, color: "bg-uni-purple" },
                 { label: "Chat", to: "/app/chat", icon: MessageSquare, color: "bg-uni-blue" },
                 { label: "Market", to: "/app/market", icon: ShoppingCart, color: "bg-uni-green" },
                 { label: "Agenda", to: "#", icon: Calendar, color: "bg-slate-700" },
               ].map((item, i) => (
                 <Link key={i} to={item.to} className="glass-card p-6 flex flex-col items-center text-center hover:scale-105 transition-transform border border-white/5 active:scale-95">
                    <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-4 text-white shadow-xl`}>
                       <item.icon size={24} />
                    </div>
                    <span className="font-bold text-sm text-slate-200">{item.label}</span>
                 </Link>
               ))}
            </div>
          </section>

          {/* Recent Feed Highlights */}
          <section>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-100">Destaques do Feed</h3>
                <Link to="/app" className="text-sm text-uni-blue font-bold hover:underline">Ver tudo</Link>
            </div>
            <div className="space-y-4">
              {[1, 2].map((_, i) => (
                <div key={i} className="glass-card p-5 border border-white/5 flex gap-4">
                   <div className="w-12 h-12 rounded-full bg-slate-800 shrink-0"></div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                         <div className="h-4 w-24 bg-white/10 rounded"></div>
                         <div className="h-3 w-12 bg-white/5 rounded"></div>
                      </div>
                      <div className="h-3 w-full bg-white/5 rounded mb-2"></div>
                      <div className="h-3 w-2/3 bg-white/5 rounded"></div>
                   </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
           {/* Agenda / Events */}
           <div className="glass-card p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                 <Calendar size={20} className="text-uni-purple" />
                 Sua Agenda
              </h3>
              <div className="space-y-4">
                 <div className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-uni-purple/20 flex flex-col items-center justify-center text-uni-purple shrink-0 group-hover:scale-110 transition-transform">
                       <span className="text-[10px] font-bold leading-none">JUN</span>
                       <span className="text-lg font-black leading-none">05</span>
                    </div>
                    <div>
                       <p className="font-bold text-sm text-white">Lançamento de Produto</p>
                       <p className="text-xs text-slate-500">14:00 • No Marketplace</p>
                    </div>
                 </div>
                 <div className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-uni-blue/20 flex flex-col items-center justify-center text-uni-blue shrink-0 group-hover:scale-110 transition-transform">
                       <span className="text-[10px] font-bold leading-none">JUN</span>
                       <span className="text-lg font-black leading-none">12</span>
                    </div>
                    <div>
                       <p className="font-bold text-sm text-white">Meetup Dev Üni</p>
                       <p className="text-xs text-slate-500">19:00 • Call de Vídeo</p>
                    </div>
                 </div>
              </div>
              <button className="w-full mt-6 py-3 rounded-xl border border-white/10 text-sm font-bold text-slate-400 hover:bg-white/5 transition-all">Ver calendário completo</button>
           </div>

           {/* Recent Activities */}
           <div className="glass-card p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-5">Atividades Recentes</h3>
              <div className="space-y-6">
                {recentActivities.map((act, i) => (
                  <div key={i} className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                        <act.icon size={14} />
                     </div>
                     <div>
                        <p className="text-sm text-slate-200 font-medium">{act.title}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-wider">{act.time}</p>
                     </div>
                  </div>
                ))}
              </div>
           </div>

           {/* Community Suggestions */}
           <div className="glass-card p-6 border border-white/5 bg-gradient-to-br from-uni-green/10 to-transparent">
              <h3 className="text-lg font-bold mb-4">Comunidades Üni</h3>
              <div className="space-y-4">
                 {[1, 2].map((_, i) => (
                   <div key={i} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10"></div>
                         <div>
                            <p className="text-xs font-bold text-white">Exploradores IA</p>
                            <p className="text-[10px] text-slate-500">2.4k membros</p>
                         </div>
                      </div>
                      <button className="p-2 text-uni-blue opacity-0 group-hover:opacity-100 transition-opacity">+</button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
