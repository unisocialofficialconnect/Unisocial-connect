import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Heart, MessageCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !isOpen) return;
    
    const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const notifsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const userNotifs = notifsData.filter((n: any) => n.userId === user.uid);
      
      const enrichedNotifs = await Promise.all(userNotifs.map(async (n: any) => {
        let senderData = { name: "Usuário", avatar: "https://i.pravatar.cc/150" };
        if (n.senderId) {
          try {
            const userDoc = await getDoc(doc(db, "users", n.senderId));
            if (userDoc.exists()) {
              senderData = userDoc.data() as any;
            }
          } catch(e) {}
        }
        return { ...n, sender: senderData };
      }));
      setNotifications(enrichedNotifs);
      
      // Mark as read after a short delay so the user can see what's new
      setTimeout(() => {
        enrichedNotifs.forEach(n => {
          if (!n.read) {
            try {
              updateDoc(doc(db, "notifications", n.id), { read: true });
            } catch (e) {}
          }
        });
      }, 2000);
      
    });

    return () => unsubscribe();
  }, [user, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-4 w-[350px] max-w-[calc(100vw-2rem)] max-h-[400px] bg-[#1a1b26] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-uni-blue" />
                <h3 className="font-semibold text-white">Notificações</h3>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full">
                <X size={16} />
              </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar p-2 flex-1 relative">
              {notifications.length === 0 ? (
                <div className="text-center text-slate-500 py-8 text-sm">
                  Nenhuma notificação por enquanto.
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n, idx) => (
                    <div
                      key={n.id}
                      className="p-3 flex items-start gap-3 rounded-xl hover:bg-white/5 transition-colors relative cursor-pointer group"
                      onClick={() => {
                        window.location.hash = `#post-${n.postId}`;
                        onClose();
                      }}
                    >
                      {!n.read && <div className="absolute top-1/2 -translate-y-1/2 left-1.5 w-1.5 h-1.5 rounded-full bg-uni-blue"></div>}
                      <img src={n.sender?.avatar} alt={n.sender?.name} className="w-10 h-10 rounded-full object-cover shrink-0 ml-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300 group-hover:text-white transition-colors leading-snug">
                          <span className="font-semibold text-white">{n.sender?.name}</span>{" "}
                          {n.type === 'like' ? 'curtiu sua publicação.' : 'comentou na sua publicação.'}
                        </p>
                        <div className="flex gap-1.5 items-center text-[10px] text-slate-500 mt-1">
                          {n.type === 'like' ? <Heart size={10} className="text-uni-purple" /> : <MessageCircle size={10} className="text-uni-blue" />}
                          <span>{n.timestamp ? formatDistanceToNow(n.timestamp?.toDate ? n.timestamp.toDate() : new Date(n.timestamp), { addSuffix: true, locale: ptBR }) : 'agora'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
