# Recomendação de arquitetura do prompt

Para VS Code, eu recomendo esta divisão:

## 1. Frontmatter mínimo e válido

Apenas configuração real do agente.

## 2. Corpo do agente

Instruções principais:

* papel
* objetivo
* regras
* fluxo
* critérios de decisão
* formato de saída

## 3. Arquivos auxiliares

* `copilot-readme-checklist.md`
* `copilot-readme-questionnaire.md`
* `copilot-readme-evidence-rules.md`
* `readme.template.md`

Assim o agente fica limpo, e o restante vira material reutilizável.


# Versão revisada da estrutura

---

# Minha recomendação final

O melhor caminho para o seu projeto é este:

* usar o `.agent.md` com **frontmatter enxuto**
* mover checklist/questionário para arquivos separados
* tratar seu template como **estrutura editorial**, não como fonte factual
* escrever regras de decisão mais explícitas para GPT-4.1

Se você quiser, no próximo passo eu posso transformar isso em um **kit real pronto para copiar**, com:

* `readme-evidence.agent.md`
* `copilot-readme-checklist.md`
* `copilot-readme-questionnaire.md`
* `copilot-readme-evidence-rules.md`

[1]: https://developers.openai.com/cookbook/examples/gpt4-1_prompting_guide "GPT-4.1 Prompting Guide"
[2]: https://code.visualstudio.com/docs/copilot/customization/custom-agents "Custom agents in VS Code"
[3]: https://code.visualstudio.com/docs/copilot/customization/agent-skills "Use Agent Skills in VS Code"
 