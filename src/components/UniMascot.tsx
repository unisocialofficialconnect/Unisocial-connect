import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Bot, Mic, MicOff, X, Sparkles, Navigation } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function UniMascot() {
  const { user } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showBubble, setShowBubble] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false); 
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const mascotRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const controls = useAnimation();
  const dodgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isThinkingRef = useRef(false);
  const isAnsweringRef = useRef(false);
  const synth = window.speechSynthesis;
  const location = useLocation();

  // Load and persist position
  useEffect(() => {
    const storageKey = `uniMascotPos_${user?.uid || 'guest'}`;
    const savedPos = localStorage.getItem(storageKey);
    let initialX = window.innerWidth - 100;
    let initialY = window.innerHeight - 240;

    if (savedPos) {
      try {
        const { x, y } = JSON.parse(savedPos);
        initialX = x;
        initialY = y;
      } catch (e) {}
    }
    
    setPosition({ x: initialX, y: initialY });
    controls.set({ x: initialX, y: initialY });
  }, [controls, user?.uid]);

  // Logic to dodge interactive elements
  useEffect(() => {
    const checkObstacles = () => {
      if (isDraggingRef.current || !mascotRef.current) return;

      const rect = mascotRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Temporarily disable pointer events to see what's underneath
      mascotRef.current.style.pointerEvents = 'none';
      const elementBelow = document.elementFromPoint(centerX, centerY);
      mascotRef.current.style.pointerEvents = 'auto';

      if (!elementBelow) return;

      // Check if element is interactive
      const isInteractive = (el: Element | null): boolean => {
        if (!el || el === document.body || el === document.documentElement) return false;
        const style = window.getComputedStyle(el);
        const isClickable = 
          el.tagName === 'BUTTON' || 
          el.tagName === 'A' || 
          el.tagName === 'INPUT' || 
          el.hasAttribute('onClick') || 
          style.cursor === 'pointer';
        
        if (isClickable) return true;
        return isInteractive(el.parentElement);
      };

      if (isInteractive(elementBelow)) {
        // Dodge!
        const moveDistance = 120;
        const directions = [
          { x: moveDistance, y: 0 },
          { x: -moveDistance, y: 0 },
          { x: 0, y: moveDistance },
          { x: 0, y: -moveDistance },
          { x: moveDistance, y: moveDistance },
          { x: -moveDistance, y: -moveDistance },
        ];

        // Find a safe spot
        for (const dir of directions) {
          const nextX = Math.min(Math.max(20, rect.left + dir.x), window.innerWidth - 80);
          const nextY = Math.min(Math.max(20, rect.top + dir.y), window.innerHeight - 100);
          
          mascotRef.current.style.pointerEvents = 'none';
          const testEl = document.elementFromPoint(nextX + rect.width/2, nextY + rect.height/2);
          mascotRef.current.style.pointerEvents = 'auto';

          if (!isInteractive(testEl)) {
            controls.start({
              x: nextX,
              y: nextY,
              transition: { type: 'spring', damping: 20, stiffness: 100 }
            });
            setPosition({ x: nextX, y: nextY });
            break;
          }
        }
      }
    };

    const interval = setInterval(checkObstacles, 2000);
    return () => clearInterval(interval);
  }, [controls]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    isAnsweringRef.current = isAnswering;
  }, [isAnswering]);

  useEffect(() => {
    // Initial welcome
    setTimeout(() => {
       setResponse("Olá! Eu sou o Üni 🚀 Seu assistente oficial da Üni Social. Basta dizer: 'Ei Üni'.");
       setShowBubble(true);
       setIsAwake(true);
       
       setTimeout(() => {
         setShowBubble(false);
       }, 6000);
    }, 2000);

    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        if (isThinkingRef.current || isAnsweringRef.current) return; // Ignore if speaking or thinking
        
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        if (finalTranscript) {
           handleVoiceCommand(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
         // Auto restart if it was manually started
         // We use state callback for isListening to avoid closure issues
         setIsListening(currentIsListening => {
             if (currentIsListening) {
                 try { recognition.start(); } catch(e){}
             }
             return currentIsListening;
         });
      };

      recognitionRef.current = recognition;
    }
    
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, []);

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
      } else {
          try {
              // Prime Speech Synthesis on mobile
              const silent = new SpeechSynthesisUtterance('');
              silent.volume = 0;
              synth.speak(silent);
              
              recognitionRef.current?.start();
              setIsListening(true);
              setIsAwake(true);
          } catch (e) {
              console.log("Already started", e);
          }
      }
  };

  const handleVoiceCommand = async (command: string) => {
    const commandLower = command.toLowerCase();
    const isWakeWord = commandLower.includes('üni') || commandLower.includes('uni');
    
    // Auto respond to just the wake word
    if (isWakeWord && command.trim().length <= 15) {
       speak("Olá! Sou o Üni. Como posso ajudar você hoje?");
       return;
    }
    
    // Only process if wake word was mentioned
    setIsThinking(true);
    setShowBubble(true);
    setResponse(""); // clear previous
    
    try {
        const res = await fetch('/api/mascot/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: command,
                context: `Usuário está na tela: ${location.pathname}`
            })
        });
        const data = await res.json();
        const aiText = data.text || "Desculpe, não entendi.";
        
        setResponse(aiText);
        speak(aiText);
    } catch(e) {
        setResponse("Ocorreu um erro ao me conectar.");
        speak("Ocorreu um erro ao me conectar.");
    } finally {
        setIsThinking(false);
    }
  };

  const speak = (text: string) => {
      if (!synth) return;
      
      // Clean emojis out of the text before speaking
      const textToSpeak = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');

      try {
          if (synth.speaking) {
              synth.cancel();
          }
          setIsAnswering(true);
          setShowBubble(true);
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = 'pt-BR';
          
          // Attempt to find a good Portuguese voice
          const voices = synth.getVoices();
          let ptVoice = voices.find(v => v.name.includes('Google português do Brasil') || (v.name.includes('Google') && v.lang.includes('pt-BR')));
          if (!ptVoice) ptVoice = voices.find(v => v.lang === 'pt-BR' && v.name.includes('Premium'));
          if (!ptVoice) ptVoice = voices.find(v => v.lang === 'pt-BR' && v.name.includes('Natural'));
          if (!ptVoice) ptVoice = voices.find(v => v.lang === 'pt-BR');
          
          if (ptVoice) {
              utterance.voice = ptVoice;
          }
          utterance.rate = 1.05; // more natural speed
          utterance.pitch = 1.1; // less robotic pitch
          
          speechSynthesisRef.current = utterance;
          
          utterance.onend = () => {
              setIsAnswering(false);
              setTimeout(() => setShowBubble(false), 4000);
          };
          utterance.onerror = (event) => {
              console.error('Speech synthesis error', event);
              setIsAnswering(false);
          }
          
          synth.speak(utterance);
      } catch (e) {
          console.error("Speech synthesis failed", e);
          setIsAnswering(false);
      }
  };

  if (location.pathname === '/app/ai') {
    return null;
  }

  return (
    <motion.div 
      ref={mascotRef}
      animate={controls}
      drag 
      dragConstraints={{ left: 20, top: 20, right: window.innerWidth - 80, bottom: window.innerHeight - 100 }}
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={() => { 
        isDraggingRef.current = true;
      }}
      onDragEnd={(e, info) => {
        isDraggingRef.current = false;
        const storageKey = `uniMascotPos_${user?.uid || 'guest'}`;
        // Update local state with final position from info or ref
        const rect = mascotRef.current?.getBoundingClientRect();
        if (rect) {
          const finalPos = { x: rect.left, y: rect.top };
          localStorage.setItem(storageKey, JSON.stringify(finalPos));
          setPosition(finalPos);
        }
      }}
      className="fixed top-0 left-0 z-[200] flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
      style={{ touchAction: 'none' }}
    >
      <AnimatePresence>
        {isAwake && !isDraggingRef.current && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-10 whitespace-nowrap bg-white/5 backdrop-blur-3xl px-3 py-1 rounded-full border border-white/10 pointer-events-none"
          >
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arraste-me! 🚀</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBubble && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-full mb-4 right-0 w-64 bg-[#1a1b26] border border-uni-purple/30 rounded-2xl p-4 shadow-2xl"
          >
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#1a1b26] border-b border-r border-uni-purple/30 rotate-45 transform"></div>
            
            {isThinking ? (
                <div className="flex justify-center space-x-2 py-2">
                  <div className="w-2 h-2 bg-uni-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-uni-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-uni-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            ) : (
                <>
                  <button 
                    onClick={() => { setShowBubble(false); synth.cancel(); }}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                  >
                      <X size={14} />
                  </button>
                  <p className="text-sm text-slate-200 mt-1">{response}</p>
                </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ 
            y: isAwake ? [0, -10, 0] : 0,
        }}
        transition={{ 
            repeat: isAwake ? Infinity : 0, 
            duration: 3, 
            ease: "easeInOut" 
        }}
        className="relative group cursor-pointer"
        onClick={() => {
            setIsAwake(true);
            setShowBubble(prev => !prev);
            if (!showBubble && response) {
                speak(response);
            }
        }}
      >
        {/* Jetpack flames */}
        {isAwake && (
            <motion.div 
                animate={{ scaleY: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-t from-transparent via-cyan-400 to-uni-blue rounded-full blur-sm"
            />
        )}
        
        <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${isListening ? 'from-uni-purple to-pink-600' : 'from-uni-blue to-uni-purple'} p-0.5 shadow-[0_0_30px_rgba(139,92,246,0.3)]`}>
          <div className="w-full h-full bg-[#0a0b10] rounded-3xl overflow-hidden flex items-center justify-center relative">
               {isAwake ? (
                  <Sparkles size={24} className="text-uni-blue absolute top-2 right-2 opacity-50" />
               ) : null}
               
               <motion.div
                 animate={{
                    scaleY: [1, 1, 0.1, 1, 1, 1], // Blink
                    rotate: isAwake ? [0, 0, 5, -5, 0] : 0, // Random tilt
                 }}
                 transition={{
                    scaleY: { repeat: Infinity, duration: 4, times: [0, 0.8, 0.85, 0.9, 0.95, 1], ease: "easeInOut" },
                    rotate: { repeat: Infinity, duration: 10, ease: "easeInOut" }
                 }}
               >
                  <Bot size={32} className={isAwake ? 'text-white' : 'text-slate-500'} strokeWidth={1.5} />
               </motion.div>

               <div className="absolute bottom-2 flex gap-1">
                   <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-transparent'}`}></div>
               </div>
          </div>
        </div>

        {/* Microphone Toggle Button */}
        <button 
           onClick={(e) => { e.stopPropagation(); toggleListening(); }}
           className={`absolute -bottom-2 -left-2 p-1.5 rounded-full shadow-lg border ${isListening ? 'bg-red-500 border-red-400' : 'bg-[#1a1b26] border-slate-700/50 hover:bg-slate-800'}`}
        >
            {isListening ? <Mic size={14} className="text-white" /> : <MicOff size={14} className="text-slate-400" />}
        </button>
      </motion.div>
    </motion.div>
  );
}
