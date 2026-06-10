# Copilot Workspace Instructions

## Objetivo

Padronizar, revisar e automatizar a criação e atualização de arquivos README.md em projetos diversos, seguindo as melhores práticas de documentação open source e enterprise, com apoio de questionários inteligentes e checklists contextuais.

---

## Princípios

- **Link, não duplique**: Sempre referencie documentação existente (ex: templates, exemplos, taxonomias) ao invés de copiar trechos.
- **Checklist inteligente**: Use checklists para validar seções essenciais e opcionais do README conforme o contexto do projeto.
- **Questionário adaptativo**: Realize perguntas ao usuário para preencher lacunas de informação relevantes ao tipo de projeto.
- **Evolução contínua**: Sugira melhorias e integrações futuras (ex: linter, automação de checklist, questionário interativo).
- **Segurança e contexto**: Nunca invente informações não comprovadas no workspace. Solicite confirmação para dados sensíveis ou estratégicos.
- Sempre usar Goal / Context / Constraints / Done when
- Preferir clareza sobre completude desnecessária
- Perguntar antes de assumir quando faltar contexto crítico
- Usar checklist antes de finalizar

---

## Workflow

1. **Descoberta de convenções**
   - Busque arquivos: `README.md`, templates, exemplos, taxonomias, notas e documentação relevante.
   - Identifique padrões, seções obrigatórias e opcionais.

2. **Exploração do workspace**
   - Levante comandos de build/test, decisões arquiteturais, padrões de branch, dependências e diferenciais do projeto.
   - Relacione arquivos de apoio (ex: `PROJECT_TYPES_TAXONOMY.md`, `notas.md`, templates).

3. **Geração e atualização**
   - Crie ou atualize o README.md usando o template mais adequado.
   - Preencha apenas o que for comprovado no workspace.
   - Liste pontos a confirmar com o time.
   - Siga o princípio "link, não duplique" para tópicos já documentados.

4. **Iteração e feedback**
   - Solicite feedback sobre seções incompletas ou dúvidas contextuais.
   - Sugira customizações futuras (ex: linter, checklist automatizado, questionário interativo).

---

## Anti-padrões

- Não inventar informações não presentes no workspace.
- Não duplicar conteúdo já existente em templates ou exemplos.
- Não gerar README genérico sem contexto do projeto.
- Não omitir seções essenciais do checklist.

---


## Regras
- Nunca inventar comandos
- Sempre validar com checklist
- Adaptar README ao tipo de projeto
- Priorizar onboarding rápido


## Exemplos de uso

- "Padronize o README.md deste repositório conforme as instruções do copilot-readme-instructions.md."
- "Revise o README.md e aponte o que falta segundo o checklist do projeto."
- "Crie um README.md baseado apenas no que for comprovado no workspace."
- "Liste pontos a confirmar com o time antes de finalizar o README."

---

## Quando perguntar
- linguagem não detectada
- comandos não claros
- público indefinido

## Quando NÃO perguntar
- padrões claros no workspace

---


## Estrutura padrão de README
- Title
- Description
- Installation
- Usage
- Project Structure
- Scripts
- Contributing
- License

---

## Critério de sucesso
README permite onboarding sem ajuda externa
Qualquer dev consegue rodar o projeto sem ajuda externa

---


## Referências

- [modelo-readme.md](templates/modelo-readme.md)
- [readme.template.md](templates/readme.template.md)
- [PROJECT_TYPES_TAXONOMY.md](PROJECT_TYPES_TAXONOMY.md)
- [notas.md](notas.md)
- [awesome-readme](https://github.com/matiassingers/awesome-readme)

---

## Sugestões de customização futura

- Integrar linter de markdown.
- Automatizar checklist de arquivos essenciais.
- Incluir questionário interativo para preencher lacunas.
- Adaptar para stacks específicas (Java, Node, Azure, etc.).
- Evoluir para versão enterprise (compliance, docs, arquitetura detalhada).
 