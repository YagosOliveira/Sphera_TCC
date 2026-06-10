# Sphera – Sistema de Recomendação de Locais

<p align="center">
  <b>🗺️ Aplicação web para descobrir e recomendar estabelecimentos baseado em localização geográfica</b>
</p>

---

## 📚 Sumário

* [🧠 Sobre](#-sobre)
* [⚡ Quick Start](#-quick-start)
* [🧩 Funcionalidades](#-funcionalidades)
* [🛠️ Tecnologias](#️-tecnologias)
* [📂 Estrutura do Projeto](#-estrutura-do-projeto)
* [🚀 Como Rodar](#-como-rodar)
* [🏗️ Arquitetura](#️-arquitetura)
* [🔐 Variáveis de Ambiente](#-variáveis-de-ambiente)
* [📦 Deploy](#-deploy)
* [🤝 Contribuição](#-como-contribuir)

---

## 🧠 Sobre

**Sphera** é uma aplicação full-stack desenvolvida como **TCC (Trabalho de Conclusão de Curso)** que permite usuários descobrir e explorar estabelecimentos (cafés, bares, restaurantes, museus, parques) com base em sua localização geográfica.

O sistema oferece:
- **Mapa interativo** com pins de estabelecimentos filtráveis por categoria e preço
- **Sistema de recomendação personalizado** que considera preferências do usuário (categorias favoritas, orçamento, distância máxima)
- **Painel de gestão para proprietários** para cadastrar e gerenciar seus estabelecimentos
- **Feed social** onde estabelecimentos podem compartilhar posts

**Público-alvo:** Desenvolvedores (documentação técnica para desenvolvimento, manutenção e deploy)

---

## ⚡ Quick Start

### Pré-requisitos
- Node.js 16+ (apenas para rodar o servidor backend)
- Um projeto Supabase já criado com schema aplicado
- Navegador moderno

### Setup Local

1. **Clone o repositório:**
   ```bash
   git clone <repo-url>
   cd Sphera_TCC
   ```

2. **Configure o Supabase:**
   - Copie as credenciais do seu projeto Supabase
   - Abra `index.html` e atualize as variáveis `SUPABASE_URL` e `SUPABASE_ANON_KEY` (veja seção [Variáveis de Ambiente](#-variáveis-de-ambiente))

3. **Instale dependências do servidor:**
   ```bash
   cd server
   npm install
   ```

4. **Rode o servidor:**
   ```bash
   npm run dev    # desenvolvimento com reload automático
   # ou
   npm start      # produção
   ```

5. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

---

## 🧩 Funcionalidades

* ✅ Mapa interativo com pins customizados por categoria (café ☕, parque 🌳, museu 🏛️, etc)
* ✅ Filtragem de estabelecimentos por categoria e faixa de preço
* ✅ Sistema de recomendação personalizado baseado em:
  - Categorias favoritas do usuário
  - Orçamento disponível
  - Distância máxima
* ✅ Autenticação com Supabase (signup, signin, recuperação de senha)
* ✅ Roles de usuário (USER, OWNER, ADMIN)
* ✅ Painel de proprietário para gerenciar estabelecimentos
* ✅ Feed social com posts de estabelecimentos
* ✅ Cálculo de distância em tempo real (algoritmo Haversine)
* 🚧 Testes automatizados (não implementado)

---

## 🛠️ Tecnologias

### Frontend
- **HTML5, CSS3, JavaScript vanilla** – sem build process, arquivos estáticos servidos pelo Express
- **Leaflet.js v1.9.4** – biblioteca de mapas interativos
- **Supabase JS Client v2** – autenticação e acesso ao banco de dados

### Backend
- **Node.js** – runtime JavaScript
- **Express.js 4.19.2** – framework web
- **CORS 2.8.5** – suporte a requisições cross-origin
- **Morgan 1.10.0** – logging de requisições HTTP
- **dotenv 16.4.5** – carregamento de variáveis de ambiente
- **nodemon 3.1.3** *(dev)* – reload automático durante desenvolvimento

### Database
- **Supabase (PostgreSQL)** – banco de dados relacional com autenticação integrada

---

## 📂 Estrutura do Projeto

```
Sphera_TCC/
├── index.html                  # Página principal (mapa)
├── login.html                  # Autenticação
├── profile.html                # Perfil de usuário / painel do proprietário
├── owner.html                  # Cadastro/edição de estabelecimento
├── user.html                   # Perfil do usuário
├── feed.html                   # Feed social
├── reset-password.html         # Recuperação de senha
│
├── app.js                      # Lógica do mapa, filtros e cálculos (Haversine)
├── nav.js                      # Navegação entre páginas
├── profile.js                  # Lógica do perfil
├── recommend.js                # Sistema de recomendação
│
├── style.css                   # Estilos principais
├── stylelogin.css              # Estilos da página de login
├── styleowner.css              # Estilos do painel do proprietário
├── profile.css                 # Estilos do perfil
│
├── assets/
│   ├── icons/                  # Ícones do projeto
│   └── images/                 # Imagens
│
├── server/                     # Backend Node.js/Express
│   ├── server.js               # Aplicação principal
│   ├── package.json
│   ├── .env.example
│   ├── .gitignore
│   ├── data/
│   │   └── feedback.json       # Dados de feedback (gerado em runtime)
│   └── README.md               # Documentação específica do servidor
│
├── supabase/                   # Configuração do banco
│   ├── schema.sql              # Schema do PostgreSQL
│   └── config.toml             # Configuração do Supabase
│
└── README.md                   # Este arquivo
```

---

## 🚀 Como Rodar

### Modo Desenvolvimento

**Frontend + Backend juntos:**

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Em outro terminal, acesse:
# http://localhost:3000
```

O servidor Express serve automaticamente os arquivos estáticos da raiz do projeto (frontend).

### Modo Produção

```bash
cd server
npm install
npm start
```

### Verificar saúde do servidor

```bash
curl http://localhost:3000/api/health
```

Resposta esperada:
```json
{"status":"ok","message":"Servidor rodando"}
```

### Testar API de Feedback (exemplo)

```bash
# GET todos os feedbacks
curl http://localhost:3000/api/feedback

# POST novo feedback
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"name": "João", "message": "Adorei o projeto!"}'
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│         Frontend (HTML/CSS/JS)              │
│  index.html → Leaflet.js → Supabase Client │
│  (mapa, filtros, recomendações)            │
└────────────┬────────────────────────────────┘
             │ HTTP requests
             ▼
┌─────────────────────────────────────────────┐
│    Backend (Node.js/Express) :3000          │
│  ├─ GET /api/health                        │
│  ├─ GET/POST /api/feedback                 │
│  └─ Serve arquivos estáticos (/)           │
└────────────┬────────────────────────────────┘
             │ SQL queries
             ▼
┌─────────────────────────────────────────────┐
│   Supabase (PostgreSQL + Auth)              │
│  ├─ profiles (usuários)                     │
│  ├─ venues (estabelecimentos)               │
│  ├─ posts (feed social)                     │
│  ├─ features (amenidades)                   │
│  ├─ user_feature_prefs (preferências)       │
│  └─ venue_features (features de venues)     │
└─────────────────────────────────────────────┘
```

---

## 🔐 Variáveis de Ambiente

### Backend (`.env` na pasta `server/`)

```env
PORT=3000                    # Porta do servidor (padrão: 3000)
STATIC_DIR=../               # Diretório de arquivos estáticos (padrão: ../TCC)
```

Veja `server/.env.example` para referência.

### Frontend (hardcoded em HTML)

⚠️ **Credenciais do Supabase** estão hardcoded nos arquivos HTML:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
```

**Encontre em:**
- `index.html` (linhas 9-12)
- `login.html` (linhas 13-15)
- `owner.html` (linhas 12-14)

**TODO (Segurança em Produção):**
- Mover credenciais para `.env` e injetar via servidor backend
- Usar variáveis de ambiente seguindo boas práticas de segurança

---

## 📦 Deploy

### Status Atual
🚧 **Deploy não implementado**. O projeto é ideal para **hosting em servidor próprio** (ex: HostGator).

### Planejamento para Deploy

#### Opção 1: VPS com PM2
```bash
# No servidor
git clone <repo-url>
cd Sphera_TCC/server
npm install
npm install -g pm2

pm2 start server.js --name "sphera"
pm2 save
pm2 startup
```

#### Opção 2: cPanel/Shared Hosting
- Configure a aplicação Node.js apontando para `server/`
- Configure a porta (padrão: 3000)
- Mapear domínio/subdomínio

#### Opção 3: Plataformas Cloud
- Railway, Render, Fly.io, etc
- Criar `Procfile` e configurar buildpack Node.js
- Definir variáveis de ambiente

#### TODO para Deploy:
- [ ] Documentar passos exatos para HostGator/VPS
- [ ] Criar `Procfile` para plataformas cloud
- [ ] Documentar configuração de SSL/HTTPS
- [ ] Mover credenciais Supabase para variáveis seguras
- [ ] Criar CI/CD pipeline (GitHub Actions)
- [ ] Documentar processo de migrations do banco

---

## 🔧 Configuração do Supabase

### Schema Inicial

O arquivo `supabase/schema.sql` contém a definição completa do banco de dados, incluindo:
- Tabelas: `profiles`, `venues`, `posts`, `features`, `user_feature_prefs`, `venue_features`
- Políticas de segurança (RLS - Row Level Security)
- Roles: USER, OWNER, ADMIN

**Para aplicar o schema:**

1. Acesse o Supabase Dashboard do seu projeto
2. Vá para **SQL Editor**
3. Cole o conteúdo de `supabase/schema.sql`
4. Execute

### Variáveis de Ambiente Supabase

TODO: Documentar quando houver migrations automáticas

---

## 🤝 Como Contribuir

1. **Entender o código:**
   - Leia a seção [Arquitetura](#️-arquitetura)
   - Explore a [Estrutura do Projeto](#-estrutura-do-projeto)

2. **Setup para desenvolvimento:**
   - Siga [Quick Start](#-quick-start)
   - Rode `npm run dev` no `server/`

3. **Workflow de contribuição:**
   - Crie uma branch: `git checkout -b feature/minha-funcionalidade`
   - Commit: `git commit -m "feat: descrição clara"`
   - Push: `git push origin feature/minha-funcionalidade`
   - Abra um Pull Request

4. **Boas práticas:**
   - Código limpo e comentado
   - Respeite a estrutura existente
   - Teste mudanças localmente

---

## 📄 Licença

**TODO: Confirmar licença do projeto**

---

## ❓ Dúvidas Frequentes

**P: Como adicionar um novo tipo de estabelecimento?**  
R: Adicione a categoria em `supabase/schema.sql` (tabela `venues.category`) e customize o emoji/cor em `app.js`.

**P: Como o sistema de recomendação funciona?**  
R: Veja `recommend.js`. Pontuação baseada em: categoria (peso 0.4), preço (peso 0.3), distância (peso 0.3).

**P: Posso usar sem banco de dados Supabase?**  
R: Não. O projeto depende de Supabase para autenticação e dados. Seria necessário reescrever a integração.

**P: Há testes?**  
R: Ainda não. [TODO: implementar testes unitários e e2e]

---

## 📞 Contato / Suporte

Abra uma issue no repositório com dúvidas ou sugestões.

---

**Última atualização:** Abril 2026  
**Versão:** 1.0.0 (TCC)
