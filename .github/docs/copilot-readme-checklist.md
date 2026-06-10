# Checklist de Validação de README por Evidências

Use este checklist antes de finalizar, revisar ou aplicar um patch no `README.md`.

---

## 1. Fidelidade ao workspace

- [ ] O README foi baseado em evidências reais do workspace.
- [ ] Nenhuma stack foi incluída sem comprovação.
- [ ] Nenhum comando foi inventado.
- [ ] Nenhuma arquitetura foi presumida sem evidência.
- [ ] Nenhuma seção foi mantida apenas por existir em um template.

---

## 2. Clareza e onboarding

- [ ] O README explica claramente o que é o projeto.
- [ ] O README ajuda alguém novo a começar.
- [ ] A leitura está organizada e fácil de escanear.
- [ ] O texto evita excesso de marketing vazio.
- [ ] O conteúdo é útil para desenvolvedores(as), não apenas bonito.

---

## 3. Qualidade do conteúdo

- [ ] O README não contém placeholders genéricos.
- [ ] O README não contém exemplos fictícios tratados como reais.
- [ ] O conteúdo preserva informações úteis já existentes.
- [ ] Seções desnecessárias foram removidas ou omitidas.
- [ ] Lacunas foram sinalizadas com transparência.

---

## 4. Validação por seção

### Sobre
- [ ] Explica problema, propósito ou contexto do projeto.
- [ ] Está baseado em evidências ou informação explícita do usuário.

### Quick Start
- [ ] Só foi incluído se houver evidência suficiente.
- [ ] Os passos não dependem de comandos inventados.

### Tecnologias
- [ ] Só lista tecnologias comprovadas.

### Uso
- [ ] Contém exemplos reais ou foi omitida.

### Arquitetura
- [ ] Só foi incluída se houver base suficiente.
- [ ] Nenhum diagrama foi criado por suposição.

### Estrutura do projeto
- [ ] Reflete diretórios e arquivos reais.

### Variáveis de ambiente
- [ ] Só foi incluída se existirem variáveis ou exemplos reais.

### Testes
- [ ] Só foi incluída se houver testes detectáveis.

### Deploy
- [ ] Só foi incluída se houver evidência de deploy.

### Contribuição
- [ ] Reflete fluxo real ou orientação mínima honesta.

### Licença
- [ ] Só foi incluída se houver confirmação.

---

## 5. Tratamento de incertezas

- [ ] O README diferencia fato confirmado de pendência.
- [ ] Itens incertos foram omitidos ou marcados com `TODO: confirmar`.
- [ ] O agente evitou responder com excesso de confiança.

---

## 6. Segurança

- [ ] Nenhum dado sensível foi exposto.
- [ ] Nenhum segredo foi copiado de arquivos para o README.
- [ ] Nenhum comando destrutivo foi sugerido.

---

## 7. Saída final do agente

- [ ] O agente resumiu os fatos confirmados.
- [ ] O agente listou pendências relevantes.
- [ ] O agente entregou conteúdo do README ou patch sugerido.