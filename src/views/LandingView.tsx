import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Shield, Zap, X, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { UniLogo } from "../components/UniLogo";
import { useAuth } from "../contexts/AuthContext";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 mr-3" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LandingView() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { signInWithGoogle, user } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // If already logged in, redirect to app directly
  React.useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  if (user) {
    return (
      <div className="min-h-screen bg-uni-darker flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-uni-blue/20 border-t-uni-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate("/app");
    } catch (e: any) {
      setErrorMsg("Erro de autenticação: " + (e.message || "Senha ou email incorretos"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg("");
    try {
      await signInWithGoogle();
      navigate("/app");
    } catch(e: any) {
      if (e.code === 'auth/popup-closed-by-user') {
        setErrorMsg("O login foi cancelado porque a janela foi fechada. Tente novamente.");
      } else if (e.code === 'auth/popup-blocked') {
        setErrorMsg("O login foi bloqueado pelo navegador. Verifique os bloqueadores de pop-ups.");
      } else {
        setErrorMsg("Erro com Google: " + (e.message || "Tente novamente mais tarde."));
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-uni-darker overflow-hidden font-sans">

      {/* Background gradients for depth */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-uni-purple/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-uni-blue/5 rounded-full blur-[100px]" />
      </div>

      {/* Left Section: Branding & Slogan (Facebook-inspired but modern) */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-32 py-12 md:py-20 relative z-10">
        <motion.div
           initial={{ opacity: 0, x: -40 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="max-w-2xl"
        >
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-uni-purple to-uni-blue flex items-center justify-center shadow-2xl shadow-uni-purple/20">
              <UniLogo className="w-10 h-10 text-white" />
            </div>
            <span className="text-4xl font-display font-extrabold text-white tracking-tight">Üni Social</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-black mb-8 leading-[1.05] tracking-tighter text-white">
            Üni Social <br />
            O seu <br />
            novo <br />
            <span className="text-uni-blue bg-gradient-to-r from-uni-blue to-uni-purple bg-clip-text text-transparent">Universo.</span>
          </h1>
          
          <div className="flex flex-wrap gap-4 mt-12">
            {["Conectividade", "Privacidade", "Inovação"].map((item, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 text-sm font-medium">
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Decorative Floating Elements (Collage simulation) */}
        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[500px] pointer-events-none">
          <motion.div 
            animate={{ y: [-15, 15, -15], rotate: [0, 3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-10 w-48 h-64 bg-slate-800 rounded-3xl border border-white/10 shadow-2xl overflow-hidden opacity-40 mix-blend-lighten"
          >
             <div className="w-full h-full bg-gradient-to-br from-uni-purple/20 to-transparent p-4 flex flex-col justify-end">
                <div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
                <div className="h-2 w-16 bg-white/5 rounded"></div>
             </div>
          </motion.div>
          <motion.div 
            animate={{ y: [20, -20, 20], rotate: [0, -2, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-10 right-0 w-56 h-40 bg-slate-800 rounded-3xl border border-white/10 shadow-2xl overflow-hidden opacity-30 mix-blend-lighten"
          >
             <div className="w-full h-full bg-gradient-to-tr from-uni-blue/20 to-transparent p-4 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-white/5"></div>
             </div>
          </motion.div>
        </div>
      </div>

      {/* Right Section: Auth Card (Image 1 Style) */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6, delay: 0.3 }}
           className="w-full max-w-[440px] glass p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
           style={{ backgroundColor: 'rgba(15,16,25,0.7)' }}
        >
          {/* Logo in form (from Image 1) */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-uni-purple to-uni-blue flex items-center justify-center shadow-lg mb-6">
              <UniLogo className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-2">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-slate-400 font-medium">
              {isLogin ? "Entre no seu ecossistema digital." : "Comece sua conta no Üni Social."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {errorMsg && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{errorMsg}</div>}
            
            {!isLogin && (
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Seu nome" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#1e202e]/60 border border-white/5 rounded-2xl px-6 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-uni-blue outline-none transition-all group-hover:border-white/10"
                  required
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-[#1e202e]/60 border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-uni-blue outline-none transition-all group-hover:border-white/10"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Sua senha" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-[#1e202e]/60 border border-white/5 rounded-2xl pl-14 pr-14 py-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-uni-blue outline-none transition-all group-hover:border-white/10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-uni-purple/80 to-uni-blue rounded-2xl font-bold text-white shadow-xl shadow-uni-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? "Entrando..." : (isLogin ? "Entrar" : "Criar nova conta")}
            </button>
          </form>

          <div className="relative flex items-center py-10">
            <div className="flex-grow border-t border-white/5"></div>
            <span className="flex-shrink-0 mx-4 text-slate-600 text-sm font-medium">ou</span>
            <div className="flex-grow border-t border-white/5"></div>
          </div>

          <button 
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-14 flex items-center justify-center bg-white rounded-2xl font-bold text-slate-900 hover:bg-gray-100 transition-all shadow-lg active:scale-[0.98]"
          >
            <GoogleIcon />
            Entrar com o Google
          </button>

          <div className="mt-10 text-center">
            <p className="text-slate-400 font-medium">
              {isLogin ? "Ainda não tem uma conta? " : "Já tem uma conta? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-uni-blue hover:underline underline-offset-4"
              >
                {isLogin ? "Criar agora" : "Fazer login"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Mobile Footer Branding */}
      <footer className="md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 text-slate-600 text-[10px] uppercase tracking-widest text-center pb-8 md:pb-0 z-20">
        Üni Social &copy; 2026 &bull; Ecossistema Digital da Evolução
      </footer>
    </div>
  );


}
