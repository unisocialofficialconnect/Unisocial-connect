-- 1. Deletar as políticas antigas com erro
DROP POLICY IF EXISTS "Posts são públicos" ON public.posts;
DROP POLICY IF EXISTS "Usuários autenticados podem criar posts" ON public.posts;
DROP POLICY IF EXISTS "Usuários podem curtir ou atualizar o post" ON public.posts;
DROP POLICY IF EXISTS "Usuários podem excluir os próprios posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can read posts" ON public.posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

-- 2. Permite que qualquer um veja os posts (SELECT)
CREATE POLICY "Anyone can read posts"
ON public.posts FOR SELECT
USING (true);

-- 3. Permite que o usuário crie seus próprios posts (INSERT)
CREATE POLICY "Users can insert own posts"
ON public.posts FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- 4. Permite que o usuário edite seus próprios posts (UPDATE)
CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- 5. Permite que o usuário delete seus próprios posts (DELETE)
CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE
USING (auth.uid()::text = user_id::text);
