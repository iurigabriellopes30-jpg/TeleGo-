# 🚀 Configuração Urgente na Vercel - TeleGo

## ⚠️ AÇÃO NECESSÁRIA IMEDIATA

O código foi corrigido e está no GitHub, mas você precisa configurar a variável de ambiente na Vercel para resolver o erro de Mixed Content.

## 📋 Passo a Passo (5 minutos)

### 1. Acesse o Dashboard da Vercel
- URL: https://vercel.com/dashboard
- Faça login se necessário

### 2. Selecione o Projeto
- Clique no projeto **tele-go** (ou o nome que você deu)
- Você verá a lista de deployments

### 3. Vá para Settings
- No menu superior, clique em **Settings**
- No menu lateral esquerdo, clique em **Environment Variables**

### 4. Adicione a Variável de Ambiente

Clique em **Add New** e preencha:

```
Name:  VITE_API_URL
Value: https://telego-production.up.railway.app
```

**Importante:** Marque os 3 ambientes:
- ✅ Production
- ✅ Preview  
- ✅ Development

Clique em **Save**

### 5. Force um Redeploy

Opção A - Via Dashboard:
1. Volte para a aba **Deployments**
2. Clique nos 3 pontinhos (...) do último deploy
3. Clique em **Redeploy**
4. Confirme

Opção B - Via Git (mais rápido):
```bash
# Faça qualquer alteração pequena e push
git commit --allow-empty -m "trigger: Force redeploy com variável de ambiente"
git push origin main
```

### 6. Aguarde o Deploy (1-2 minutos)

Você verá o status do deploy na aba **Deployments**. Aguarde até aparecer "Ready".

### 7. Teste o Site

1. Acesse: https://tele-go.vercel.app
2. Abra o Console do navegador (F12 → Console)
3. Execute: `console.log(import.meta.env.VITE_API_URL)`
4. Deve retornar: `https://telego-production.up.railway.app`

### 8. Verifique se o Erro Sumiu

1. Tente fazer login ou criar um pedido
2. Abra a aba **Network** no DevTools
3. Verifique se as requisições estão indo para `https://telego-production.up.railway.app`
4. **NÃO deve** mais aparecer o erro "Mixed Content"

## ✅ Checklist de Validação

- [ ] Variável `VITE_API_URL` configurada na Vercel
- [ ] Redeploy realizado com sucesso
- [ ] Console mostra a URL HTTPS correta
- [ ] Requisições funcionando sem erro de Mixed Content
- [ ] Sistema de pedidos funcionando normalmente
- [ ] Notificações em tempo real funcionando

## 🔧 Troubleshooting

### Erro persiste após configurar

**Causa:** Cache do navegador ou deploy antigo

**Solução:**
1. Force refresh: Ctrl + Shift + R (Windows) ou Cmd + Shift + R (Mac)
2. Limpe o cache do navegador
3. Tente em aba anônima
4. Verifique se o deploy mais recente está ativo (deve ter um ✅ verde)

### Variável não aparece no Console

**Causa:** Variável não foi salva corretamente ou deploy não foi feito

**Solução:**
1. Volte em Settings → Environment Variables
2. Verifique se `VITE_API_URL` está lá
3. Verifique se está marcada para "Production"
4. Force um novo redeploy

### Requisições ainda vão para HTTP

**Causa:** Código antigo em cache ou variável não carregada

**Solução:**
1. Verifique o último commit no GitHub (deve ser o de "fix: Adicionar configuração HTTPS")
2. Verifique se a Vercel fez deploy desse commit
3. Force um hard refresh no navegador

## 📞 Próximos Passos

Após configurar, teste:
1. ✅ Login de restaurante
2. ✅ Login de entregador
3. ✅ Criar novo pedido
4. ✅ Aceitar pedido
5. ✅ Atualizar status do pedido
6. ✅ Notificações em tempo real

## 🎯 Resultado Esperado

Antes:
```
❌ Mixed Content: The page at 'https://tele-go.vercel.app/' was loaded over HTTPS, 
   but requested an insecure resource 'http://telego-production.up.railway.app/couriers/'
```

Depois:
```
✅ Requisições funcionando normalmente para https://telego-production.up.railway.app
✅ Sistema de pedidos operacional
✅ Notificações em tempo real funcionando
```

---

**Tempo estimado total:** 5-10 minutos

Se tiver qualquer problema, verifique o arquivo `README_DEPLOY.md` para mais detalhes técnicos.
