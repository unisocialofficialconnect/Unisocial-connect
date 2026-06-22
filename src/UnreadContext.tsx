import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UnreadContextType = {
  unreadCounts: Record<string, number>;
  totalUnread: number;
  refreshUnread: () => void;
  markAsRead: (userId: string) => void;
};

export const UnreadContext = createContext<UnreadContextType>({
  unreadCounts: {},
  totalUnread: 0,
  refreshUnread: () => {},
  markAsRead: () => {}
});

export function UnreadProvider({ children }: { children: ReactNode }) {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const refreshUnread = () => {
    fetch("/api/messages/unread")
      .then(r => r.json())
      .then(setUnreadCounts)
      .catch(console.error);
  };

  useEffect(() => {
    refreshUnread();
    const interval = setInterval(refreshUnread, 2000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (userId: string) => {
    try {
      await fetch(`/api/messages/read/${userId}`, { method: 'POST' });
      setUnreadCounts(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => (a as number) + (b as number), 0) as number;

  return (
    <UnreadContext.Provider value={{ unreadCounts, totalUnread, refreshUnread, markAsRead }}>
      {children}
    </UnreadContext.Provider>
  );
}

export const useUnread = () => useContext(UnreadContext);
