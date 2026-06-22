import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Home, Sparkles, Store, Settings, LogOut, Camera, Mail, User as UserIcon, X, Edit2, LayoutGrid, Users, Compass } from "lucide-react";
import { cn } from "../utils";
import { UniLogo } from "./UniLogo";
import { useUnread } from "../UnreadContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useUnread();
  const { user, profile, logout } = useAuth();
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const defaultAvatar = profile?.avatar || user?.user_metadata?.avatar_url || "https://i.pravatar.cc/150?u=" + (user?.id || "u1");
  const defaultName = profile?.name || user?.user_metadata?.full_name || "Usuário";
  const userHandle = profile?.handle || `@user${user?.id?.substring(0, 5)}`;
  const userEmail = profile?.email || user?.email || "usuario@uni.social";

  const [profileName, setProfileName] = useState(defaultName);
  const [savedName, setSavedName] = useState(defaultName);
  const [profileImage, setProfileImage] = useState(defaultAvatar);
  const [savedImage, setSavedImage] = useState(defaultAvatar);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  
  // Sync state when profile loads
  useEffect(() => {
    if (profile || user) {
      const avatarToUse = profile?.avatar || user?.user_metadata?.avatar_url || "https://i.pravatar.cc/150?u=" + (user?.id || "u1");
      const nameToUse = profile?.name || user?.user_metadata?.full_name || "Usuário";
      
      setSavedName((prevSavedName) => {
        if (prevSavedName !== nameToUse) setProfileName(nameToUse);
        return nameToUse;
      });
      
      setSavedImage((prevSavedImage) => {
        if (prevSavedImage !== avatarToUse) setProfileImage(avatarToUse);
        return avatarToUse;
      });
    }
  }, [profile?.avatar, profile?.name, user?.user_metadata?.avatar_url, user?.user_metadata?.full_name]);

  const hasChanges = profileName !== savedName || profileImage !== savedImage;

  const handleLogout = async () => {
    setShowProfileModal(false);
    await logout();
    navigate("/");
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (user?.id) {
        await supabase.from('users').update({
          name: profileName,
          avatar: profileImage,
          updatedAt: new Date().toISOString()
        }).eq('id', user.id);
      }
      setSavedName(profileName);
      setSavedImage(profileImage);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar perfil: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const max_size = 500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setProfileImage(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const links = [
    { to: "/app", icon: Compass, label: "Universo" },
    { to: "/app/feed", icon: LayoutGrid, label: "Feed" },
    { to: "/app/chat", icon: MessageSquare, label: "Chat" },
    { to: "/app/communities", icon: Users, label: "Comunidades" },
    { to: "/app/ai", icon: Sparkles, label: "Üni AI" },
    { to: "/app/market", icon: Store, label: "Market" },
    { to: "/app/profile", icon: UserIcon, label: "Perfil" },
  ];

  return (
    <>
      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full glass z-50 px-6 py-4 flex justify-between items-center rounded-t-3xl text-slate-400">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={cn(
              "p-2 rounded-xl transition-all duration-300 relative",
              location.pathname === link.to
                ? "text-white bg-gradient-to-r from-uni-purple/20 to-uni-blue/20"
                : "hover:text-white"
            )}
          >
            <link.icon size={24} />
            {link.to === "/app/chat" && totalUnread > 0 && (
              <span className="absolute max-w-[24px] truncate -top-1 -right-1 flex h-4 min-w-[16px] px-0.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg z-10">
                {totalUnread}
              </span>
            )}
            {location.pathname === link.to && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-uni-blue text-glow" />
            )}
          </Link>
        ))}
        {/* Profile Avatar */}
        <button onClick={() => setShowProfileModal(true)} className="p-1 rounded-full border border-slate-700 overflow-hidden">
             <img src={savedImage} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
        </button>
      </div>

      {/* Desktop Sidebar Nav */}
      <div className="hidden md:flex flex-col w-20 lg:w-64 fixed h-screen glass border-r border-white/5 py-8 px-4 justify-between">
        <div>
           <Link to="/app" className="flex items-center gap-3 px-2 mb-12">
               <UniLogo className="w-10 h-10" />
               <span className="text-2xl font-display font-bold hidden lg:block tracking-tight bg-gradient-to-r from-uni-purple via-uni-blue to-uni-green bg-clip-text text-transparent">Üni</span>
           </Link>

           <nav className="flex flex-col gap-4">
               {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-xl transition-all duration-300 text-slate-400 font-medium group relative",
                      location.pathname === link.to
                        ? "text-white bg-gradient-to-r from-uni-purple/20 to-uni-blue/10 border border-white/5 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                        : "hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="relative">
                      <link.icon size={24} className={cn("transition-transform group-hover:scale-110", location.pathname === link.to && "text-uni-blue drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")} />
                      {link.to === "/app/chat" && totalUnread > 0 && (
                        <span className="lg:hidden absolute max-w-[24px] truncate -top-1.5 -right-1 flex h-4 min-w-[16px] px-0.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow z-10" style={{ transform: 'translateX(2px)' }}>
                          {totalUnread}
                        </span>
                      )}
                    </div>
                    {link.to === "/app/chat" && totalUnread > 0 ? (
                        <div className="hidden lg:flex flex-1 items-center justify-between">
                          <span>{link.label}</span>
                          <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg">
                            {totalUnread}
                          </span>
                        </div>
                    ) : (
                        <span className="hidden lg:block">{link.label}</span>
                    )}
                  </Link>
                ))}
           </nav>
        </div>

        <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors w-full text-left">
            <img src={savedImage} alt="Profile" className="w-10 h-10 rounded-full border border-white/10 object-cover" />
            <div className="hidden lg:block">
                <p className="font-semibold text-sm">{savedName}</p>
                <p className="text-xs text-slate-400">{userHandle}</p>
            </div>
        </button>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-uni-darker/80 backdrop-blur-xl" onClick={() => setShowProfileModal(false)}>
          <div 
            className="w-full max-w-sm glass-card p-6 relative animate-in zoom-in-95 duration-200 border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-display font-bold mb-6">Seu Perfil</h2>
            
            <div 
              className="flex flex-col items-center mb-6 relative group w-max mx-auto cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white/10" />
                <button className="absolute bottom-0 right-0 p-2 bg-uni-blue rounded-full text-white shadow-lg opacity-0 md:group-hover:opacity-100 transition-all translate-y-2 md:group-hover:translate-y-0 hover:bg-blue-600 focus:opacity-100 focus:translate-y-0">
                    <Camera size={16} />
                </button>
            </div>

            <div className="space-y-4 mb-6">
                <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-10 py-3 text-white focus:ring-2 focus:ring-uni-purple outline-none transition-all"
                    />
                    <Edit2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} pointerEvents="none" />
                </div>
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      value={userEmail} 
                      readOnly
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-slate-400 outline-none cursor-not-allowed"
                    />
                </div>
                
                {hasChanges && (
                  <button 
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-uni-purple to-uni-blue py-3 rounded-xl font-medium text-white shadow-lg disabled:opacity-50 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </button>
                )}
                {showSavedToast && (
                  <div className="text-center text-sm text-uni-green font-medium animate-in fade-in slide-in-from-bottom-2">
                    Alterações salvas com sucesso!
                  </div>
                )}
            </div>

            <div className="space-y-2">
                {userEmail === "unisocial.official.connect@gmail.com" && (
                    <Link 
                      to="/app/admin" 
                      onClick={() => setShowProfileModal(false)} 
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Settings size={18} className="text-slate-400" />
                            <span>Painel de Administração</span>
                        </div>
                    </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <LogOut size={18} />
                        <span className="font-medium">Sair da conta</span>
                    </div>
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
