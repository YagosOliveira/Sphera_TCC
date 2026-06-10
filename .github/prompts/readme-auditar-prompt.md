---
agent: ask
model: GPT-4.1
description: Audita o README atual com base nas evidências do workspace.


# Prompt: Auditar README.md por Evidências

## Tarefa
Audite o `README.md` atual do projeto com base nas evidências verificáveis do workspace.

## O que fazer
1. Leia o README atual.
2. Identifique arquivos do workspace que confirmem ou contrariem o conteúdo do README.
3. Aplique as regras de evidência.
4. Valide o conteúdo com o checklist de README.
5. Entregue um diagnóstico e proponha melhorias.

## Entrega esperada
Forneça:
- resumo do estado atual do README
- pontos corretos
- inconsistências
- lacunas importantes
- trechos genéricos ou não comprovados
- sugestão de patch ou reestruturação

## Referências
- `../instructions/copilot-readme-regras-de-evidencia.md`
- `../instructions/copilot-readme-checklist.md`
- `../templates/readme.template.md`
 