# 🚀 Guia Completo - Criar Projeto Supabase Real

## Passo 1: Criar Conta Supabase
1. Acesse: https://app.supabase.com
2. Clique em "Sign in with GitHub" ou "Sign up"
3. Complete o cadastro

## Passo 2: Criar Novo Projeto
1. Clique em "New Project"
2. Escolha sua organização
3. Preencha:
   - **Project name**: `neuropsicologia-sistema`
   - **Database Password**: `sua_senha_segura_123`
   - **Region**: `South America (São Paulo)` ou mais próximo
4. Clique em "Create new project"
5. **Aguarde 2-3 minutos** para o projeto ser criado

## Passo 3: Obter Credenciais
1. No dashboard do projeto, vá para:
   - **Settings** → **API**
2. Copie:
   - **Project URL**: `https://abc123.supabase.co`
   - **anon/public key**: `eyJhbGciO...`

## Passo 4: Executar Schema SQL
1. Vá para **SQL Editor** no painel lateral
2. Clique em "New query"
3. Cole TODO o conteúdo do arquivo `supabase-schema.sql`
4. Clique em "Run" para criar todas as tabelas

## Passo 5: Configurar no Sistema
Edite o arquivo `build.js` e substitua:

```javascript
// ANTES (credenciais fictícias):
const supabaseUrl = process.env.SUPABASE_URL || 'https://wltzckgdtvlhdmhyozsb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI...';

// DEPOIS (suas credenciais reais):
const supabaseUrl = process.env.SUPABASE_URL || 'https://SEU_PROJETO.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'SUA_ANON_KEY_REAL';
```

## Passo 6: Testar
1. Execute: `node build.js`
2. Acesse: `http://localhost:3000/test-supabase.html`
3. Execute todos os testes - devem aparecer ✅

## Passo 7: Deploy na Vercel
1. Commit e push para GitHub
2. Redeploy na Vercel
3. Dados serão compartilhados entre todos os usuários!

---

## 💰 Planos Supabase
- **Free Tier**: Até 50,000 execuções/mês (suficiente para teste)
- **Pro**: $25/mês (para produção)
- **Sem cartão necessário** para começar

---

## 🔒 Segurança
- ✅ RLS (Row Level Security) já configurado no schema
- ✅ Anon key é segura para frontend
- ✅ Dados protegidos por políticas PostgreSQL 