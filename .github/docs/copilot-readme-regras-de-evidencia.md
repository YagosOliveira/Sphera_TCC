# Regras de Evidência para Construção de README

Este documento define como decidir o que pode ou não pode entrar no `README.md`.

---

## 1. Princípio central

O README deve refletir o projeto real, não o projeto imaginado.

Sempre priorizar:
1. evidência verificável no workspace
2. informação explícita fornecida pelo usuário
3. omissão honesta quando não houver base suficiente

---

## 2. Fontes de evidência fortes

Considere como evidência forte:

- `package.json`
- `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`
- `pom.xml`
- `build.gradle`
- `gradle.properties`
- `pyproject.toml`
- `requirements.txt`
- `Pipfile`
- `go.mod`
- `Cargo.toml`
- `Dockerfile`
- `docker-compose.yml`
- pipelines de CI/CD
- scripts de automação
- arquivos `.env.example`, `.env.sample`
- README atual
- documentação em `/docs`
- estrutura real de diretórios
- configuração de testes
- arquivos de configuração de framework

---

## 3. Fontes de evidência fracas

Considere como evidência fraca ou insuficiente:

- nome de pasta isolado
- comentário genérico
- placeholder
- exemplo de template
- arquivo vazio
- referência visual sem contexto
- convenções “prováveis” da stack
- suposição com base em nome do repositório

Essas fontes não bastam sozinhas para afirmar fatos no README.

---

## 4. O que nunca fazer

- Nunca inventar comandos de instalação, build, teste ou execução.
- Nunca listar tecnologia apenas porque “é comum”.
- Nunca copiar exemplos de templates como conteúdo factual.
- Nunca preencher seção de deploy sem prova.
- Nunca preencher variáveis de ambiente fictícias.
- Nunca criar diagrama arquitetural por imaginação.
- Nunca afirmar que algo foi validado em execução se apenas foi lido.

---

## 5. Como lidar com incerteza

Quando faltar evidência suficiente, escolher uma destas opções:

### Omitir
Quando a informação não for essencial.

### Marcar pendência
Usar:
`TODO: confirmar`

### Perguntar ao usuário
Somente se a resposta for necessária para:
- propósito do projeto
- quick start confiável
- contribuição
- licença
- deploy/operação

---

## 6. Regras por tipo de conteúdo

### Stack
Só listar o que aparecer de forma clara em manifestos, configs, dependências ou estrutura comprovável.

### Comandos
Só usar comandos encontrados em scripts, documentação existente, task runners ou arquivos equivalentes.

### Arquitetura
Só documentar quando houver evidência em código, docs, diagramas existentes ou convenções explícitas do projeto.

### Variáveis de ambiente
Só listar nomes reais identificáveis em arquivos apropriados.

### Testes
Só incluir se houver framework, pastas, scripts ou configuração de testes.

### Deploy
Só incluir com base em Docker, pipelines, scripts, manifests ou docs reais.

### Licença
Só incluir se houver arquivo de licença, cabeçalho explícito ou confirmação do usuário.

---

## 7. Regra editorial

O template é apenas uma referência estrutural.

Isso significa:
- a estrutura pode inspirar
- os exemplos não podem ser reutilizados como fatos
- seções podem ser removidas
- a adaptação ao projeto é obrigatória

---

## 8. Critério final

Um README de qualidade por evidências:
- ajuda alguém novo a começar
- não inventa
- não engana
- não superdocumenta o que não existe
- explicita lacunas com honestidade