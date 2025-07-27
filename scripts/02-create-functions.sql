-- Função para atualizar estoque após movimentação
CREATE OR REPLACE FUNCTION atualizar_estoque_produto()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE produtos 
    SET quantidade_estoque = quantidade_estoque + NEW.quantidade
    WHERE id = NEW.produto_id;
  ELSIF NEW.tipo = 'saida' THEN
    UPDATE produtos 
    SET quantidade_estoque = quantidade_estoque - NEW.quantidade
    WHERE id = NEW.produto_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estoque automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_estoque ON movimentacoes_estoque;
CREATE TRIGGER trigger_atualizar_estoque
  AFTER INSERT ON movimentacoes_estoque
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_estoque_produto();

-- Função para criar movimentação de saída após venda
CREATE OR REPLACE FUNCTION criar_movimentacao_venda()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo)
  VALUES (NEW.produto_id, 'saida', NEW.quantidade, 'Venda');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar movimentação após item de venda
DROP TRIGGER IF EXISTS trigger_movimentacao_venda ON itens_venda;
CREATE TRIGGER trigger_movimentacao_venda
  AFTER INSERT ON itens_venda
  FOR EACH ROW
  EXECUTE FUNCTION criar_movimentacao_venda();
