-- Adicionar coluna categoria como texto e remover referência à tabela categorias
ALTER TABLE produtos 
ADD COLUMN categoria VARCHAR(100);

-- Migrar dados existentes (opcional - se houver dados)
UPDATE produtos 
SET categoria = (
  SELECT nome 
  FROM categorias 
  WHERE categorias.id = produtos.categoria_id
);

-- Remover a coluna categoria_id e imagem_url
ALTER TABLE produtos 
DROP COLUMN IF EXISTS categoria_id,
DROP COLUMN IF EXISTS imagem_url;

-- Tornar categoria obrigatória
ALTER TABLE produtos 
ALTER COLUMN categoria SET NOT NULL;
