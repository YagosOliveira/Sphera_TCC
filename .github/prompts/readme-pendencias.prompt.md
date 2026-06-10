---
agent: ask
model: GPT-4.1
description: Gera apenas as perguntas mínimas necessárias para preencher lacunas críticas do README.

---

# Tarefa

Identifique apenas as lacunas críticas que impedem a construção segura do `README.md` e gere o menor conjunto possível de perguntas objetivas para o usuário.

# Regras

- Não aplique um questionário completo por padrão.
- Pergunte apenas o que for necessário para destravar:
  - propósito do projeto
  - quick start confiável
  - contribuição
  - licença
  - deploy ou operação
- Se o workspace já responder, não pergunte.
- Priorize perguntas curtas, diretas e práticas.

# Formato de saída

Entregue:
1. lacunas críticas detectadas
2. perguntas objetivas recomendadas
3. itens que podem ser omitidos ou marcados com `TODO: confirmar`

# Referências

- `../instructions/copilot-readme-regras-de-evidencia.md`
- `../instructions/copilot-readme-checklist.md`
- `../templates/readme.template.md`
 