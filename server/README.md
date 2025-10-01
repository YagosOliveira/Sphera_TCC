# TCC – Servidor Node.js/Express

Este servidor adiciona uma camada backend simples ao seu projeto **TCC**.
Ele serve os arquivos estáticos (`index.html`, `style.css`, `app.js`) e expõe
duas rotas de API de exemplo: `GET /api/health` e `POST/GET /api/feedback`.

## Estrutura
```
TCC_project/
├── TCC/                 # seu front-end (index.html, app.js, style.css)
└── server/              # novo backend Node.js
    ├── data/
    │   └── feedback.json (gerado automaticamente ao usar a API)
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── server.js
    └── README.md
```

## Como rodar

1. Abra um terminal e navegue até a pasta `server`:
   ```bash
   cd server
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` (opcional) copiando do exemplo e ajuste a pasta estática/porta se quiser:
   ```bash
   cp .env.example .env
   # PORT=3000
   # STATIC_DIR=../TCC
   ```

4. Rode em modo desenvolvimento (com reload automático) ou produção:
   ```bash
   npm run dev
   # ou
   npm start
   ```

5. Acesse no navegador:
   - Frontend: `http://localhost:3000/`
   - Health check: `http://localhost:3000/api/health`
   - Feedbacks: `GET http://localhost:3000/api/feedback`
   - Criar feedback: `POST http://localhost:3000/api/feedback`
     Body JSON:
     ```json
     {"name": "Matheus", "message": "Projeto top!"}
     ```

## Integração rápida no front-end

No seu `app.js`, você pode chamar a API de exemplo assim:
```js
async function ping() {
  const res = await fetch('/api/health');
  const data = await res.json();
  console.log('health:', data);
}

async function enviarFeedback(name, message) {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, message })
  });
  const data = await res.json();
  console.log('criado:', data);
  return data;
}
```

## Deploy (opções)

- **cPanel/Shared hosting com Node**: use `npm start` e configure a aplicação Node apontando para `server/`.
- **Railway/Render/Fly.io**: crie um serviço Node apontando para `server/`.
- **PM2 (VPS)**:
  ```bash
  npm i -g pm2
  pm2 start server.js --name tcc
  pm2 save
  pm2 startup
  ```
