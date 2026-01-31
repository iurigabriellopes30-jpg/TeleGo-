# Configuração de Deploy - TeleGo Frontend

## Problema Resolvido: Mixed Content Error

O erro "Mixed Content" ocorria porque o frontend estava tentando fazer requisições HTTP para o backend HTTPS, o que é bloqueado pelos navegadores modernos.

## Solução Implementada

### 1. Variável de Ambiente VITE_API_URL

O código já estava preparado para usar `VITE_API_URL` (ver `services/api.ts`), mas a variável não estava definida.

**Arquivo criado:** `.env`
```
VITE_API_URL=https://telego-production.up.railway.app
```

### 2. Configuração na Vercel

Para que o deploy funcione corretamente, você precisa configurar a variável de ambiente na Vercel:

#### Passo a Passo:

1. Acesse o dashboard da Vercel: https://vercel.com/dashboard
2. Selecione o projeto **tele-go**
3. Vá em **Settings** → **Environment Variables**
4. Adicione a seguinte variável:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://telego-production.up.railway.app`
   - **Environment:** Production, Preview, Development (selecione todos)
5. Clique em **Save**
6. Faça um novo deploy (ou use **Deployments** → **Redeploy**)

### 3. Verificação

Após o deploy, verifique:

1. Abra o Console do navegador em https://tele-go.vercel.app
2. Execute: `console.log(import.meta.env.VITE_API_URL)`
3. Deve retornar: `https://telego-production.up.railway.app`
4. As requisições devem funcionar sem erro de Mixed Content

### 4. Desenvolvimento Local

Para rodar localmente:

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite .env com suas configurações
# VITE_API_URL=https://telego-production.up.railway.app

# Instale dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
```

## Arquitetura de URLs

- **Frontend (Vercel):** https://tele-go.vercel.app
- **Backend (Railway):** https://telego-production.up.railway.app
- **WebSocket:** wss://telego-production.up.railway.app/ws (futuro)

## Notas Importantes

- O arquivo `.env` está no `.gitignore` e **não deve** ser commitado
- Use `.env.example` como referência para configuração
- Sempre use HTTPS em produção para evitar Mixed Content
- O backend já tem CORS configurado para aceitar requisições do frontend

## Troubleshooting

### Erro persiste após deploy

1. Verifique se a variável foi salva na Vercel
2. Force um redeploy (não apenas rebuild)
3. Limpe o cache do navegador
4. Verifique o Console para ver qual URL está sendo usada

### Erro em desenvolvimento local

1. Certifique-se de que o arquivo `.env` existe na raiz do projeto
2. Reinicie o servidor Vite (`npm run dev`)
3. Verifique se não há typo no nome da variável (deve ser exatamente `VITE_API_URL`)
