import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  console.warn("⚠️  GEMINI_API_KEY não configurada. Funcionalidades de IA estarão indisponíveis.");
}

const ai = geminiKey ? new GoogleGenAI({
  apiKey: geminiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;
const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// --- IN-MEMORY DATABASE (No placeholders, real API logic) ---
let users = [
  { id: "u1", name: "Gabriel", handle: "@gabriel", avatar: "https://i.pravatar.cc/150?u=u1", verified: true },
  { id: "u2", name: "Isabella", handle: "@isa.bella", avatar: "https://i.pravatar.cc/150?u=u2", verified: false },
  { id: "u3", name: "Tech Nexus", handle: "@technexus", avatar: "https://i.pravatar.cc/150?u=u3", verified: true },
];

let posts = [
  { id: "p1", userId: "u3", text: "Just launched our new quantum processor. The future is here! 🚀 #tech #innovation", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000", likes: 4500, comments: 234, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "p2", userId: "u2", text: "Vibing in the city tonight ✨", image: "https://images.unsplash.com/photo-1477959858617-6463d5b5aadb?auto=format&fit=crop&q=80&w=1000", likes: 120, comments: 12, timestamp: new Date(Date.now() - 86400000).toISOString() }
];

let messages = [
  { id: "m1", senderId: "u2", receiverId: "u1", text: "Hey! Are we still on for tomorrow?", timestamp: new Date(Date.now() - 50000).toISOString(), read: false },
  { id: "m2", senderId: "u1", receiverId: "u2", text: "Yes! Can't wait.", timestamp: new Date(Date.now() - 10000).toISOString(), read: true },
  { id: "m3", senderId: "u3", receiverId: "u1", text: "Oi!! Viu meu novo post?", timestamp: new Date(Date.now() - 5000).toISOString(), read: false }
];

// --- API ENDPOINTS ---

// Users API
app.get("/api/users", (req, res) => res.json(users));

app.post("/api/users", (req, res) => {
  const newContact = {
    id: `u${Date.now()}`,
    name: req.body.name,
    handle: `@${req.body.name.toLowerCase().replace(/\s+/g, '')}`,
    avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
    verified: false
  };
  users.push(newContact);
  res.json(newContact);
});

app.delete("/api/users/:id", (req, res) => {
  users = users.filter(u => u.id !== req.params.id || u.id === 'u1');
  messages = messages.filter(m => m.senderId !== req.params.id && m.receiverId !== req.params.id);
  res.json({ success: true });
});

// Feed API
app.get("/api/feed", (req, res) => {
  const enrichedPosts = posts.map(p => ({
    ...p,
    user: users.find(u => u.id === p.userId)
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(enrichedPosts);
});

app.post("/api/feed", (req, res) => {
  const newPost = {
    id: `p${Date.now()}`,
    userId: "u1", // Simulated logged in user
    text: req.body.text,
    image: req.body.image,
    likes: 0,
    comments: 0,
    timestamp: new Date().toISOString()
  };
  posts.push(newPost);
  res.json(newPost);
});

app.post("/api/feed/:id/like", (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    post.likes += 1;
    res.json(post);
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

app.post("/api/feed/:id/comment", (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  if (post) {
    post.comments += 1;
    res.json(post);
  } else {
    res.status(404).json({ error: "Post not found" });
  }
});

// Chat API
app.get("/api/messages/unread", (req, res) => {
  const counts: Record<string, number> = {};
  messages.forEach(m => {
    if (m.receiverId === "u1" && !m.read) {
      counts[m.senderId] = (counts[m.senderId] || 0) + 1;
    }
  });
  res.json(counts);
});

app.post("/api/messages/read/:senderId", (req, res) => {
  messages.forEach(m => {
    if (m.receiverId === "u1" && m.senderId === req.params.senderId) {
      m.read = true;
    }
  });
  res.json({ success: true });
});

app.get("/api/chat/:userId", (req, res) => {
  const chatMessages = messages.filter(m => 
    (m.senderId === "u1" && m.receiverId === req.params.userId) || 
    (m.senderId === req.params.userId && m.receiverId === "u1")
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  res.json(chatMessages);
});

app.post("/api/chat", (req, res) => {
  const newMsg = {
    id: `m${Date.now()}`,
    senderId: "u1",
    receiverId: req.body.receiverId,
    text: req.body.text,
    timestamp: new Date().toISOString(),
    read: true
  };
  messages.push(newMsg);

  // Auto-reply for testing unread badges
  setTimeout(() => {
    messages.push({
      id: `m${Date.now() + 1}`,
      senderId: req.body.receiverId,
      receiverId: "u1",
      text: "Legal! Recebi aqui ✅",
      timestamp: new Date().toISOString(),
      read: false
    });
  }, 2000);

  res.json(newMsg);
});

// Üni AI Chat Endpoint
app.post("/api/ai/chat", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "IA indisponível: GEMINI_API_KEY não configurada." });
  }
  try {
    const { message, history } = req.body;
    
    const contents = history.map((h: any) => ({
      role: h.role === 'ai' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));
    
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: contents,
    });
    
    if (!response || !response.text) {
      throw new Error("Resposta vazia da IA");
    }
    
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Error:", error);
    res.status(500).json({ error: error.message || "Erro ao se conectar com a Üni AI." });
  }
});


// Üni Mascot AI Endpoint
app.post("/api/mascot/chat", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "IA indisponível: GEMINI_API_KEY não configurada." });
  }
  try {
    const { message, context } = req.body;
    
    const prompt = `Você é o "Üni", o mascote oficial e assistente virtual da rede social "Üni Social". Seja amigável, divertido, prestativo e use linguagem simples em português (Brasil). Respostas curtas e fluídas com emojis 🚀.
    ${context ? `Contexto atual do usuário: ${context}` : ''}
    Usuário disse: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    if (!response || !response.text) {
      throw new Error("Resposta vazia da IA");
    }

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Mascot AI Error:", error);
    res.status(500).json({ error: error.message || "Erro ao se conectar com o Üni." });
  }
});

// Vite middleware setup (must be after API routes)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
