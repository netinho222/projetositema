-- Verificar e ajustar as foreign keys para RESTRICT (bloquear exclusão)
-- Isso garante que produtos com histórico não sejam excluídos acidentalmente

-- Remover constraints existentes se houver
ALTER TABLE itens_venda 
DROP CONSTRAINT IF EXISTS itens_venda_produto_id_fkey;

ALTER TABLE movimentacoes_estoque 
DROP CONSTRAINT IF EXISTS movimentacoes_estoque_produto_id_fkey;

-- Recriar com RESTRICT (comportamento padrão mais seguro)
ALTER TABLE itens_venda 
ADD CONSTRAINT itens_venda_produto_id_fkey 
FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT;

ALTER TABLE movimentacoes_estoque 
ADD CONSTRAINT movimentacoes_estoque_produto_id_fkey 
FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT;

-- Opcional: Adicionar índices para melhor performance nas consultas de verificação
CREATE INDEX IF NOT EXISTS idx_itens_venda_produto_id ON itens_venda(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_produto_id ON movimentacoes_estoque(produto_id);
