import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, Mic, Paperclip, Zap, MessageSquare, Image, Search, ChevronRight, X, Command, Wand2, RefreshCcw, Info } from "lucide-react";
import { AIChatMessage } from "../types";
import { cn } from "../utils";

export default function AIAssistantView() {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { id: "1", role: "ai", text: "Olá! Sou a **Üni AI**, seu centro de comando inteligente. Posso analisar conversas, gerar imagens, traduzir conteúdos ou automatizar suas tarefas diárias. Qual a missão de hoje?", timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const commands = [
    { icon: <RefreshCcw size={16} />, label: "Resumir esta conversa", action: "Resuma as últimas mensagens desta conversa para mim." },
    { icon: <Command size={16} />, label: "Extrair Tarefas", action: "Analise nosso histórico e liste todas as tarefas pendentes." },
    { icon: <Wand2 size={16} />, label: "Criar Post", action: "Crie um post criativo sobre Üni Social para o meu feed." },
    { icon: <Image size={16} />, label: "Gerar Imagem", action: "Gere uma imagem futurista em 4k de uma metrópole digital." },
    { icon: <Zap size={16} />, label: "Otimizar Agenda", action: "Verifique meus compromissos e sugira o melhor horário para foco hoje." },
  ];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;
    
    const userMsg: AIChatMessage = { id: Date.now().toString(), role: "user", text: textToSend, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setShowCommands(false);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, history: messages })
      });
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const aiResponseText = data.text || "Desculpe, a Üni AI não conseguiu gerar uma resposta no momento.";
      const aiMsg: AIChatMessage = { 
        id: (Date.now()+1).toString(), 
        role: "ai", 
        text: aiResponseText, 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg: AIChatMessage = { 
        id: (Date.now()+1).toString(), 
        role: "ai", 
        text: "🚨 **Erro de Conexão:** Não foi possível contatar a Üni AI. Por favor, verifique sua conexão ou tente novamente mais tarde.", 
        timestamp: new Date().toISOString() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 p-4 md:p-10 max-w-6xl mx-auto w-full">
      
      {/* Search/Commands Sidebar - Desktop Only */}
      <aside className="hidden lg:flex flex-col w-72 glass-card p-6 border border-white/5 mr-6 space-y-8 bg-uni-dark/30">
          <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Comandos Rápidos</h3>
              <div className="space-y-2">
                  {commands.map((cmd, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSend(cmd.action)}
                        className="w-full flex items-center justify-between p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group hover:border-uni-purple/30"
                      >
                          <div className="flex items-center gap-3">
                              <div className="text-uni-purple group-hover:scale-110 transition-transform">{cmd.icon}</div>
                              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{cmd.label}</span>
                          </div>
                      </button>
                  ))}
              </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-uni-purple/10 to-uni-blue/10 border border-uni-purple/20">
              <div className="w-8 h-8 rounded-xl bg-uni-purple/20 flex items-center justify-center mb-4">
                  <Wand2 size={16} className="text-uni-purple" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Prompt Mágico</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase tracking-tighter">
                  A Üni AI aprende com seus dados para oferecer sugestões cada vez mais precisas e integradas ao ecossistema.
              </p>
          </div>
      </aside>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col glass-card md:rounded-[2.5rem] overflow-hidden border border-white/5 relative bg-uni-darker/20 min-h-0">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-uni-purple/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-uni-blue/10 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="h-16 md:h-24 border-b border-white/10 flex items-center justify-between px-6 md:px-10 bg-uni-darker/40 backdrop-blur-3xl relative z-20 shrink-0">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-uni-purple to-uni-blue rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-uni-purple/30 animate-pulse">
                   <Sparkles className="text-white" size={20} />
               </div>
               <div>
                  <h2 className="font-display font-black text-lg md:text-2xl text-white tracking-tight">Üni AI Assistant</h2>
                  <div className="flex items-center gap-2">
                      <span className="flex w-1.5 h-1.5 rounded-full bg-uni-green shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                      <span className="text-[10px] text-slate-500 font-black tracking-[0.1em] uppercase">Ecosystem Core</span>
                  </div>
               </div>
            </div>
            <div className="flex gap-2">
                <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"><RefreshCcw size={18} /></button>
                <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"><Info size={18} /></button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 custom-scrollbar relative min-h-0">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col",
                msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div 
                className={cn(
                  "p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] backdrop-blur-2xl transition-all max-w-[90%] md:max-w-2xl",
                  msg.role === "user" 
                    ? "bg-uni-blue/10 text-white rounded-tr-none border border-uni-blue/20 shadow-2xl shadow-uni-blue/5" 
                    : "bg-white/5 text-slate-200 rounded-tl-none border border-white/5 shadow-xl"
                )}
              >
                <div className="flex items-center gap-2 mb-3 opacity-40">
                   {msg.role === "ai" ? <Sparkles size={14} className="text-uni-purple" /> : <div className="w-3 h-3 bg-slate-700 rounded-full" />}
                   <span className="text-[10px] font-black uppercase tracking-widest">{msg.role === "user" ? "Eu" : "Üni AI"}</span>
                </div>
                <div className="text-sm md:text-lg leading-[1.6] font-medium whitespace-pre-wrap break-words">
                  {(msg.text || "").split("**").map((part, i) => 
                    i % 2 === 1 ? <b key={i} className="text-uni-purple font-black">{part}</b> : part
                  )}
                </div>
              </div>
              <span className="text-[10px] text-slate-600 mt-2 px-2 font-black uppercase tracking-widest tabular-nums">
                 {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          ))}
          {isLoading && (
              <motion.div className="mr-auto glass-card px-8 py-5 rounded-[2rem] rounded-tl-none flex items-center gap-3">
                  <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-uni-purple rounded-full animate-bounce [animation-duration:1s]"></div>
                      <div className="w-2 h-2 bg-uni-blue rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-uni-green rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Processando...</span>
              </motion.div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Controls */}
        <div className="p-4 md:p-8 relative z-20 shrink-0">
            <AnimatePresence>
                {showCommands && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-full left-10 right-10 mb-4 bg-uni-dark/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-4 shadow-2xl z-50 lg:hidden"
                    >
                        <div className="grid grid-cols-2 gap-2">
                            {commands.map((cmd, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleSend(cmd.action)}
                                    className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl text-xs font-bold text-white hover:bg-white/10 transition-colors"
                                >
                                    <div className="text-uni-purple">{cmd.icon}</div>
                                    <span className="line-clamp-1">{cmd.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-uni-darker/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 flex flex-col gap-2 shadow-2xl">
                <div className="flex items-center gap-1.5 px-3 pt-2">
                    <button onClick={() => setShowCommands(!showCommands)} className="p-2.5 text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 lg:hidden"><Zap size={20} /></button>
                    <button className="p-2.5 text-slate-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"><Paperclip size={20} /></button>
                    <button className="p-2.5 text-slate-400 hover:text-uni-blue transition-all bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"><Mic size={20} /></button>
                </div>
                
                <div className="flex items-center gap-4 px-4 pb-2">
                    <textarea 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Em que posso ajudar seu negócio ou timeline hoje?"
                        className="flex-1 bg-transparent border-none text-white focus:ring-0 resize-none max-h-32 py-3 custom-scrollbar placeholder:text-slate-600 font-medium text-lg"
                        rows={1}
                    />
                    <button 
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="w-16 h-16 flex items-center justify-center rounded-[1.5rem] bg-gradient-to-tr from-uni-purple to-uni-blue text-white shadow-xl shadow-uni-purple/20 disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shrink-0"
                    >
                        <Send size={24} className="ml-1" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
