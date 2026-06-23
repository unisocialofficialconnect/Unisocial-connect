-- Tabela de Produtos (Marketplace)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid REFERENCES public.users(id) NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  category text NOT NULL,
  image_url text,
  location text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Políticas para products:
-- Qualquer um pode ver produtos (LEITURA)
CREATE POLICY "Produtos são visíveis para todos" ON public.products
  FOR SELECT USING (true);

-- Apenas usuários logados podem inserir produtos
CREATE POLICY "Usuários logados podem criar produtos" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);


-- Tabela de Mensagens (Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid REFERENCES public.users(id) NOT NULL,
  receiver_id uuid REFERENCES public.users(id) NOT NULL,
  text text,
  image_url text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para messages:
-- Usuário só pode ler as próprias mensagens (enviadas ou recebidas)
CREATE POLICY "Usuários podem ver as próprias mensagens" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Usuário logado pode enviar (inserir) mensagem e deve ser o remetente
CREATE POLICY "Usuários podem enviar mensagens" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Opcional: Atualizar mensagem para lida
CREATE POLICY "Usuários podem atualizar leitura de mensagens recebidas" ON public.messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Ativar realtime para as novas tabelas
begin;
  -- Remove a publicação anterior para recriar (para evitar duplicatas caso já exista)
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- Adiciona as tabelas ao realtime
alter publication supabase_realtime add table public.posts, public.comments, public.notifications, public.users, public.messages, public.products;
