---
agent: ask
model: GPT-4.1
description: Cria um README.md do zero com base apenas em evidências do workspace.

---

# Tarefa

Crie um `README.md` do zero usando apenas informações comprováveis no workspace ou fornecidas explicitamente pelo usuário.

# Regras

- Não invente stack, comandos, variáveis, arquitetura ou deploy.
- Não copie exemplos literais de templates como fatos do projeto.
- Só inclua seções que façam sentido para este repositório.
- Se uma informação crítica estiver ausente, faça perguntas objetivas.
- Se a informação não for crítica, omita ou marque como `TODO: confirmar`.

# Fluxo

1. Inspecione o workspace.
2. Extraia fatos confirmados.
3. Consulte as regras de evidência.
4. Use o template apenas como referência estrutural.
5. Aplique o questionário somente se necessário.
6. Valide o resultado com o checklist.
7. Entregue o README final ou patch sugerido.

# Referências

- `../instructions/copilot-readme-regras-de-evidencia.md`
- `../instructions/copilot-readme-checklist.md`
- `./readme-pendencias.prompt.md`
- `../templates/readme.template.md`