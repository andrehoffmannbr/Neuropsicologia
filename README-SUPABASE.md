# 🧠 Sistema de Neuropsicologia com Supabase

Sistema completo de gestão de clínica de neuropsicologia usando **Supabase** como backend (PostgreSQL + Auth + Storage).

## 🚀 **Stack Tecnológica**

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Servidor**: Node.js + Express
- **Deployment**: Vercel (recomendado)

---

## 📋 **Funcionalidades**

### ✅ **Implementado**
- 🔐 **Autenticação Robusta** (Supabase Auth + fallback local)
- 👥 **Gestão de Usuários** (Coordenador, Funcionário, Estagiário)
- 📊 **Dashboard** com estatísticas em tempo real
- 👤 **Cadastro de Clientes** com dados completos
- 📅 **Agendamentos** com controle por usuário
- 📦 **Controle de Estoque** com movimentações
- 💰 **Notas Financeiras** diárias
- 📄 **Upload de Documentos** seguro
- 🔒 **Sistema de Logs** completo (LGPD)
- 🛡️ **Validação e Segurança** avançada
- ⚖️ **Conformidade LGPD** completa

---

## ⚡ **Instalação Rápida**

### 1️⃣ **Clonar/Baixar Projeto**
```bash
# Se usando Git
git clone <seu-repositorio>
cd teste-2

# Ou extrair ZIP baixado
```

### 2️⃣ **Instalar Dependências**
```bash
npm install
```

### 3️⃣ **Configurar Supabase**

#### 📝 **Criar Projeto Supabase**
1. Acesse: https://app.supabase.com
2. Clique **"New Project"**
3. Preencha:
   - **Nome**: "Sistema Neuropsicologia"
   - **Database Password**: (gere senha forte)
   - **Region**: South America (São Paulo)
4. Aguarde criação (2-3 minutos)

#### 🔑 **Obter Credenciais**
1. Na dashboard do projeto
2. Vá em **Settings > API**
3. Copie:
   - **URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

#### ⚙️ **Configurar Variáveis**
```bash
# Copiar arquivo de configuração
cp supabase-config.example .env

# Editar .env com suas credenciais
# SUPABASE_URL=https://seu-projeto.supabase.co
# SUPABASE_ANON_KEY=sua-anon-key
# SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 4️⃣ **Criar Banco de Dados**
```bash
# 1. Copiar schema SQL para clipboard
cat supabase-schema.sql

# 2. No Supabase Dashboard:
#    - Ir em "SQL Editor"
#    - Colar o conteúdo completo
#    - Executar (botão RUN)
```

### 5️⃣ **Inicializar Usuários**
```bash
npm run init-db
```

### 6️⃣ **Iniciar Sistema**
```bash
# Modo desenvolvimento
npm run dev

# Ou com servidor Express
npm run dev-server
```

### 7️⃣ **Acessar Sistema**
- **URL**: http://localhost:3000
- **Credenciais**: (veja seção abaixo)

---

## 🔑 **Credenciais de Login**

### 👨‍💼 **COORDENADORES** (acesso total)
- `coord@clinica.com` / `coord123`
- `admin@neuropsico.com` / `admin2025`

### 👩‍⚕️ **FUNCIONÁRIOS** (clientes + agendas)
- `func@clinica.com` / `func123`
- `staff@neuropsico.com` / `staff2025`

### 🎓 **ESTAGIÁRIOS** (apenas agendas)
- `estagiario@clinica.com` / `intern123`
- `intern@neuropsico.com` / `est2025`

---

## 🛠️ **Scripts Disponíveis**

```bash
# Desenvolvimento
npm run dev              # Frontend com Python
npm run dev-server       # Servidor Express + nodemon

# Produção
npm start               # Servidor de produção

# Banco de dados
npm run init-db         # Criar usuários iniciais
npm run migrate         # Migrar dados locais

# Utilitários
npm run serve           # Servidor estático
npm test               # Executar testes
```

---

## 📁 **Estrutura do Projeto**

```
sistema-neuropsicologia/
├── 📂 public/                    # Frontend
│   ├── 📂 js/                   # Módulos JavaScript
│   │   ├── auth.js              # Autenticação híbrida
│   │   ├── clients.js           # Gestão de clientes
│   │   ├── schedule.js          # Agendamentos
│   │   ├── stock.js             # Controle estoque
│   │   ├── financial.js         # Notas financeiras
│   │   ├── validation.js        # Validações
│   │   └── main.js              # Aplicação principal
│   ├── index.html               # Interface principal
│   └── style.css                # Estilos
├── 📄 supabase-config.js         # Config Supabase
├── 📄 supabase-schema.sql        # Schema PostgreSQL
├── 📄 server-supabase.js         # Servidor Express
├── 📄 init-supabase.js           # Inicialização
├── 📄 package.json               # Dependências
└── 📄 README-SUPABASE.md         # Este arquivo
```

---

## 🗄️ **Banco de Dados**

### 📊 **Tabelas Principais**
- `user_profiles` - Perfis de usuário
- `clients` - Cadastro de clientes
- `schedules` - Agendamentos
- `stock_items` - Itens do estoque
- `financial_notes` - Notas financeiras
- `documents` - Documentos/arquivos

### 🔐 **Logs LGPD**
- `security_logs` - Logs de segurança
- `user_activity_logs` - Atividades
- `data_access_logs` - Acesso a dados
- `user_consents` - Consentimentos

### 🛡️ **Segurança**
- **Row Level Security (RLS)** habilitado
- **Políticas de acesso** por função
- **Logs de auditoria** completos
- **Triggers** automáticos

---

## 🌐 **Deploy na Vercel**

### 1️⃣ **Preparar Projeto**
```bash
npm run build
```

### 2️⃣ **Deploy**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3️⃣ **Configurar Variáveis**
1. No painel Vercel
2. Ir em **Settings > Environment Variables**
3. Adicionar:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 4️⃣ **Configurar Domínio no Supabase**
1. Supabase Dashboard
2. **Settings > Auth**
3. **Site URL**: `https://seu-dominio.vercel.app`
4. **Redirect URLs**: adicionar domínio

---

## 🔧 **Personalização**

### 🎨 **Visual**
- Editar `public/style.css`
- Cores, fontes, layout

### ⚙️ **Funcionalidades**
- Adicionar campos em `supabase-schema.sql`
- Criar novos módulos em `public/js/`
- Expandir API em `server-supabase.js`

### 🔐 **Segurança**
- Ajustar políticas RLS
- Configurar storage buckets
- Personalizar validações

---

## 🚨 **Solução de Problemas**

### ❌ **"Supabase não configurado"**
```bash
# Verificar arquivo .env
cat .env

# Verificar se as keys estão corretas
npm run init-db
```

### ❌ **"Erro de conexão com banco"**
1. Verificar se projeto Supabase está ativo
2. Conferir URL e keys
3. Verificar se schema foi executado

### ❌ **"Permissão negada"**
1. Executar schema SQL novamente
2. Verificar RLS policies
3. Conferir role do usuário

### ❌ **"Falha no upload"**
1. Criar storage buckets manualmente
2. Configurar políticas de storage
3. Verificar tamanho do arquivo

---

## 📞 **Suporte**

### 🐛 **Bugs/Problemas**
1. Verificar logs no console (F12)
2. Checar logs do servidor
3. Consultar documentação Supabase

### 🆘 **Ajuda**
- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **JavaScript MDN**: https://developer.mozilla.org/

---

## 🔄 **Migração do Firebase**

Se você tem dados no Firebase e quer migrar:

```bash
# Backup dados Firebase
npm run backup-firebase

# Migrar para Supabase
npm run migrate

# Verificar migração
npm run verify-migration
```

---

## 📈 **Próximos Passos**

### 🎯 **Funcionalidades Planejadas**
- [ ] App mobile (React Native)
- [ ] Relatórios avançados
- [ ] Integração WhatsApp
- [ ] Backup automático
- [ ] Multi-tenancy

### 🚀 **Melhorias**
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Sincronização offline
- [ ] Dashboard analytics

---

## ⚖️ **Licença**

MIT License - Uso livre para fins educacionais e comerciais.

---

## 📝 **Changelog**

### v2.0.0 (Atual)
- ✅ Migração completa para Supabase
- ✅ PostgreSQL como banco principal
- ✅ Sistema híbrido (online/offline)
- ✅ Melhor performance e escalabilidade

### v1.0.0 (Firebase)
- ✅ Sistema base com Firebase
- ✅ Funcionalidades principais
- ✅ Interface responsiva

---

**🟢 Sistema pronto para produção!**
**🌐 Acesse: http://localhost:3000** 