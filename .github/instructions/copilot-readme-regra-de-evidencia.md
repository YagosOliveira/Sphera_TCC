# Regras de Evidência para README

## Princípio central

O README deve refletir o projeto real, não um projeto imaginado.

Sempre priorize:
1. evidência verificável no workspace
2. informação explícita do usuário
3. omissão honesta quando faltar base suficiente

## Fontes fortes de evidência

Considere como evidência forte:
- `package.json`
- `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`
- `pom.xml`
- `build.gradle`
- `pyproject.toml`
- `requirements.txt`
- `go.mod`
- `Cargo.toml`
- `Dockerfile`
- `docker-compose.yml`
- pipelines de CI/CD
- scripts reais
- `.env.example`, `.env.sample`
- documentação existente
- estrutura real de diretórios
- configuração de testes

## Fontes fracas ou insuficientes

Não trate como prova suficiente:
- nomes vagos de pastas
- comentários genéricos
- placeholders
- exemplos de template
- arquivos vazios
- convenções “prováveis”
- suposições com base no nome do repositório

## O que nunca fazer

- Nunca inventar comandos de instalação, build, teste ou execução.
- Nunca listar tecnologia só porque “é comum”.
- Nunca copiar conteúdo de template como fato do projeto.
- Nunca preencher deploy sem evidência.
- Nunca preencher variáveis fictícias.
- Nunca inventar diagrama arquitetural.
- Nunca afirmar validação em execução se apenas leu arquivos.

## Como lidar com incerteza

Quando faltar evidência suficiente:
- omita, se não for essencial
- use `TODO: confirmar`, se a informação for útil mas incerta
- pergunte ao usuário, se a lacuna bloquear uma parte importante

## Regras por tipo de conteúdo

### Stack
Só listar tecnologias comprovadas.

### Comandos
Só usar comandos encontrados em scripts, docs, task runners ou arquivos equivalentes.

### Arquitetura
Só incluir se houver base real em docs, código ou estrutura consistente.

### Variáveis de ambiente
Só listar nomes reais ou exemplos existentes.

### Testes
Só incluir se houver framework, scripts, pasta ou configuração detectável.

### Deploy
Só incluir com base em Docker, pipeline, scripts, cloud config ou docs reais.

### Licença
Só incluir se houver arquivo de licença, menção explícita ou confirmação do usuário.

## Regra editorial

O template é apenas referência estrutural.

Isso significa:
- a estrutura pode inspirar
- os exemplos não podem virar conteúdo factual
- seções podem ser removidas
- adaptação ao projeto é obrigatória