-- Script de Inicialização de Banco de Dados Supabase (PostgreSQL) para UniSocial Connect

-- Habilitar a extensão UUID, se necessário (já vem habilitado por padrão em projetos Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABELA DE USUÁRIOS
-- ==========================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  avatar TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS (Row Level Security) para users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para users
CREATE POLICY "Usuários podem ver o perfil uns dos outros" 
ON public.users FOR SELECT USING (true);

CREATE POLICY "Usuários podem atualizar o próprio perfil" 
ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir o próprio perfil" 
ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- TABELA DE POSTS
-- ==========================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT,
  image TEXT,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pinned BOOLEAN DEFAULT FALSE
);

-- Ativar RLS para posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para posts
CREATE POLICY "Posts são públicos" 
ON public.posts FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem criar posts" 
ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem curtir ou atualizar o post" 
ON public.posts FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem excluir os próprios posts" 
ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA DE COMENTÁRIOS
-- ==========================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT,
  image TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS para comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para comments
CREATE POLICY "Comentários são públicos" 
ON public.comments FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem comentar" 
ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem deletar os próprios comentários" 
ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA DE NOTIFICAÇÕES
-- ==========================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para notifications
CREATE POLICY "Usuário só pode ver as próprias notificações" 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários autenticados podem criar notificações (curtidas/comentarios)" 
ON public.notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuário pode marcar como lida" 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);


-- ==========================================
-- HABILITAR REALTIME (WebSockets) NAS TABELAS
-- ==========================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
