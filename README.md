# Dev English Gym

Inglês de trabalho para desenvolvedores brasileiros: aulas curtas, treino de frases, conversa com IA (texto ou voz) e revisão dos próprios erros.

- **Frontend:** React 19 + Vite (`src/`). O app em si é um motor em DOM puro (`src/gym/engine.ts`) montado por `src/App.tsx`.
- **Backend e banco:** Convex (`convex/`).
- **Login:** código de 6 dígitos por e-mail, com Convex Auth + Resend.
- **IA:** Google Gemini, chamado só pelo backend, com limite diário por usuário.
- **Voz:** reconhecimento e síntese de voz do próprio navegador (grátis). Funciona melhor no Chrome.

## Estrutura

```
convex/
  schema.ts       tabelas: users, progress, mistakes, aiUsage
  progress.ts     XP, sequência e estrelas por usuário
  mistakes.ts     erros corrigidos pela IA + revisão espaçada
  ai.ts           conversa e correção de texto (Gemini) com limite diário
  gymPrompts.ts   papéis da IA e tarefas de escrita (ficam no servidor)
  ResendOTP.ts    envio do código de login por e-mail
  auth.ts, auth.config.ts, http.ts   Convex Auth
src/
  App.tsx         login, sincronização de progresso e ligação com o backend
  gym/engine.ts   telas, exercícios, chat, modo voz e revisão
  gym/data.ts     conteúdo: aulas, treinos e frases
  gym/gym.css     visual (cartoon, mascote Bolha)
public/           ícones e manifest (PWA)
```

## Rodar localmente

```bash
npm install
npx convex dev        # na primeira vez: faz login e cria o projeto no Convex
```

O `convex dev` cria o arquivo `.env.local` com `VITE_CONVEX_URL`. Em outro terminal:

```bash
npm run dev:frontend
```

## Configurar o login (uma vez por deployment)

```bash
npx @convex-dev/auth
```

Esse comando gera as chaves `JWT_PRIVATE_KEY` e `JWKS` e configura `SITE_URL` no Convex.

## Variáveis de ambiente no Convex

No painel do Convex, em **Settings → Environment Variables**, ou pelo terminal com `npx convex env set NOME valor`:

| Variável | Para quê |
|---|---|
| `AUTH_RESEND_KEY` | Chave da API do Resend (resend.com → API Keys) |
| `AUTH_EMAIL_FROM` | Remetente, ex.: `Dev English <login@seudominio.com>` |
| `GEMINI_API_KEY` | Chave do Google AI Studio (aistudio.google.com) |
| `GEMINI_MODEL` | Opcional. Padrão: `gemini-flash-lite-latest` |
| `AI_DAILY_LIMIT` | Opcional. Mensagens de IA por usuário por dia. Padrão: 40 |
| `SITE_URL` | Endereço do site publicado, ex.: `https://devenglish.vercel.app` |

> **Resend:** sem domínio verificado, o Resend só envia para o e-mail da sua própria conta (remetente `onboarding@resend.dev`). Para enviar para qualquer usuário, verifique um domínio em resend.com → Domains e use-o em `AUTH_EMAIL_FROM`.

## Publicar

### 1. Backend (Convex de produção)

```bash
npx convex deploy
```

Rode `npx @convex-dev/auth --prod` e configure as variáveis acima também no deployment **Production**.

### 2. Frontend (Vercel)

1. Suba o projeto para o seu GitHub.
2. Na Vercel: **Add New → Project**, escolha o repositório. O framework é detectado como Vite.
3. Em **Settings → Environment Variables**, adicione `CONVEX_DEPLOY_KEY` (Convex → Settings → Deploy Key, de Production).
4. Troque o **Build Command** para:
   ```
   npx convex deploy --cmd 'npm run build'
   ```
   Assim, a cada push, o backend e o site são publicados juntos e a `VITE_CONVEX_URL` é preenchida automaticamente.
5. Depois do primeiro deploy, coloque o endereço da Vercel em `SITE_URL` no Convex.

## Custos

- **Convex, Vercel e Resend:** planos gratuitos atendem bem o começo.
- **Gemini:** o modelo Flash-Lite é o mais barato. O limite diário por usuário (`AI_DAILY_LIMIT`) segura o gasto.
- **Voz:** sem custo, roda no navegador.
