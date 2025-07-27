-- Script para remover as colunas tamanho e cor da tabela produtos
-- Execute este script no Supabase para completar a limpeza

-- Remover as colunas tamanho e cor
ALTER TABLE produtos 
DROP COLUMN IF EXISTS tamanho,
DROP COLUMN IF EXISTS cor;

-- Verificar a estrutura final da tabela
-- \d produtos;
