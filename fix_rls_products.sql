-- Execute este SQL no Supabase Dashboard > SQL Editor
-- Ele adiciona as policies de UPDATE e DELETE que estão faltando na tabela products

-- Policy para UPDATE: o vendedor pode editar seus próprios produtos
CREATE POLICY "Users can update own products"
ON public.products
FOR UPDATE
USING (auth.uid()::text = seller_id)
WITH CHECK (auth.uid()::text = seller_id);

-- Policy para DELETE: o vendedor pode excluir seus próprios produtos
CREATE POLICY "Users can delete own products"
ON public.products
FOR DELETE
USING (auth.uid()::text = seller_id);
