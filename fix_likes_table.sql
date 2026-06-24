-- Criar tabela de likes de posts (substitui o campo likedBy inexistente)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver os likes
CREATE POLICY "Anyone can read likes" ON public.post_likes
  FOR SELECT USING (true);

-- Usuário logado pode curtir
CREATE POLICY "Users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuário pode descurtir (deletar o próprio like)
CREATE POLICY "Users can unlike posts" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Adicionar ao realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
