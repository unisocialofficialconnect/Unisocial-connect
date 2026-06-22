import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import Navigation from "./components/Navigation";
import LandingView from "./views/LandingView";
import FeedView from "./views/FeedView";
import ChatView from "./views/ChatView";
import AIAssistantView from "./views/AIAssistantView";
import MarketplaceView from "./views/MarketplaceView";
import UniversoView from "./views/UniversoView";
import CommunitiesView from "./views/CommunitiesView";
import ProfileView from "./views/ProfileView";

import { UnreadProvider } from "./UnreadContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import UniMascot from "./components/UniMascot";

function AppLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-uni-darker text-slate-100 overflow-hidden relative">
      <Navigation />
      <main className="flex-1 w-full md:ml-20 lg:ml-64 relative h-full overflow-hidden pb-[80px] md:pb-0">
        <Outlet />
      </main>
      <UniMascot />
    </div>
  );
}

function AdminRoute() {
  const { user, profile } = useAuth();
  if (user?.email !== "unisocial.official.connect@gmail.com") {
    return <Navigate to="/app" />;
  }

  // Using the saved profile avatar if set, otherwise a nice default for the admin
  const adminAvatar = profile?.avatar || "https://i.ibb.co/v3ZpX0V/admin-badge.png";

  return (
    <div className="p-4 md:p-8 mt-10 max-w-6xl mx-auto flex flex-col items-center pb-24">
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4 group cursor-pointer animate-in zoom-in-95 duration-500">
           <div className="absolute inset-0 bg-gradient-to-r from-uni-purple via-uni-blue to-uni-green blur-xl opacity-30 group-hover:opacity-60 transition-opacity rounded-full"></div>
           <img 
             src={adminAvatar} 
             alt="Administrador Üni" 
             className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white/10 relative z-10 shadow-2xl"
             onError={(e) => {
                 (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Admin+Üni&background=8B5CF6&color=fff&size=150";
             }}
           />
           <div className="absolute -bottom-2 -right-2 bg-uni-green text-white p-2 rounded-full border-4 border-uni-darker z-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
           </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text">Administrador Üni</h1>
        <p className="text-uni-blue mt-1 font-medium">@admin_oficial</p>
      </div>

      <div className="w-full flex-col gap-6 flex">
          <div className="glass-card p-6 border border-white/5 relative bg-gradient-to-br from-white/5 to-transparent">
            <h2 className="text-xl md:text-2xl font-display font-bold mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-uni-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Control Room
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Métricas e configurações do servidor. Os dados de performance e saúde da plataforma são agregados anonimamente.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
               <div className="bg-uni-darker/50 p-4 rounded-xl border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Status do Servidor</p>
                  <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-uni-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-uni-green"></span>
                      </span>
                      <p className="text-xl font-bold text-white">Online</p>
                  </div>
               </div>
               <div className="bg-uni-darker/50 p-4 rounded-xl border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Uso de IA (Tokens Diários)</p>
                  <p className="text-xl font-bold text-white block">245.8K <span className="text-xs text-uni-blue">/ 1M</span></p>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                     <div className="bg-uni-blue h-1.5 rounded-full" style={{ width: '25%' }}></div>
                  </div>
               </div>
               <div className="bg-uni-darker/50 p-4 rounded-xl border border-white/5">
                  <p className="text-sm text-slate-400 mb-1">Requisições por minuto</p>
                  <p className="text-xl font-bold text-white flex items-center gap-2">
                     142 
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-uni-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                     </svg>
                  </p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              <div className="glass-card p-6 border border-white/5">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-uni-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ajustes de IA e Modelos
                 </h3>
                 <div className="space-y-4">
                     <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                           <p className="font-medium text-white">Filtro de Conteúdo Restrito</p>
                           <p className="text-xs text-slate-400">Bloqueia termos sensíveis no Chat AI</p>
                        </div>
                        <div className="w-10 h-5 bg-uni-green rounded-full relative cursor-pointer">
                           <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-0.5 shadow-sm"></div>
                        </div>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                           <p className="font-medium text-white">Modelo Gemini Pro</p>
                           <p className="text-xs text-slate-400">Ativo como modelo principal de resposta</p>
                        </div>
                        <div className="w-10 h-5 bg-uni-green rounded-full relative cursor-pointer">
                           <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-0.5 shadow-sm"></div>
                        </div>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                           <p className="font-medium text-slate-400">Gerador de Imagens (Desativado)</p>
                           <p className="text-xs text-slate-400">Bateria de testes em andamento</p>
                        </div>
                        <div className="w-10 h-5 bg-slate-600 rounded-full relative cursor-pointer">
                           <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-0.5 shadow-sm"></div>
                        </div>
                     </div>
                 </div>
              </div>

              <div className="glass-card p-6 border border-white/5">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-uni-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Ações de Manutenção
                 </h3>
                 <div className="space-y-3">
                     <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-uni-blue/20 transition-all border border-transparent hover:border-uni-blue/50 group">
                        <span className="font-medium text-slate-200 group-hover:text-white">Limpar Cache Global</span>
                        <span className="text-xs text-slate-500">Última há 2d</span>
                     </button>
                     <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-uni-purple/20 transition-all border border-transparent hover:border-uni-purple/50 group">
                        <span className="font-medium text-slate-200 group-hover:text-white">Recalcular Unread Badges</span>
                        <span className="text-xs text-slate-500">Otimizar DB</span>
                     </button>
                     <button className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-transparent">
                        <span className="font-medium text-red-400">Bloquear Novos Cadastros</span>
                        <div className="w-10 h-5 bg-slate-600 rounded-full relative cursor-pointer">
                           <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-0.5 shadow-sm"></div>
                        </div>
                     </button>
                 </div>
              </div>
          </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UnreadProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingView />} />
            
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<UniversoView />} />
              <Route path="feed" element={<FeedView />} />
              <Route path="chat" element={<ChatView />} />
              <Route path="communities" element={<CommunitiesView />} />
              <Route path="ai" element={<AIAssistantView />} />
              <Route path="market" element={<MarketplaceView />} />
              <Route path="profile" element={<ProfileView />} />
              <Route path="admin" element={<AdminRoute />} />
            </Route>
          </Routes>
        </Router>
      </UnreadProvider>
    </AuthProvider>
  );
}
