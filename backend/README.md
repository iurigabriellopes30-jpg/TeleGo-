# TeleGo Backend

Backend do TeleGo usando FastAPI, JWT, SQLite e arquitetura pronta para produção.

## Como rodar

1. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
2. Inicie o servidor:
   ```bash
   uvicorn main:app --reload
   ```

Acesse a documentação automática em http://localhost:8000/docs

---

- Autenticação JWT
- Endpoints para usuários, pedidos, restaurantes, entregadores
- Banco SQLite
- Estrutura para pagamentos futuros
- Código limpo e seguro
