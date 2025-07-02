# 🧠 Sistema de Neuropsicologia - Híbrido Supabase + LocalStorage

Sistema completo de gestão para clínicas de neuropsicologia com **sistema híbrido inteligente** que funciona online e offline.

## 🌐 Sistema Híbrido Inteligente

### 🟢 **Modo Online (Supabase)** - DADOS COMPARTILHADOS
- ✅ **Dados sincronizados** entre todos os usuários
- ✅ **PostgreSQL na nuvem** com backup automático
- ✅ **Acesso de qualquer lugar** com internet
- ✅ **Colaboração em tempo real**
- ✅ **Segurança enterprise** com RLS

### 🟡 **Modo Offline (LocalStorage)** - DADOS LOCAIS
- ✅ **Funciona sem internet** ou configuração
- ✅ **Rápido e confiável** no navegador
- ✅ **Dados privados** só no seu navegador
- ✅ **Ideal para testes** e desenvolvimento

## 🚀 Características Principais

- ✅ **Sistema híbrido inteligente** (Supabase + localStorage)
- ✅ **Auto-detecção** de disponibilidade
- ✅ **Fallback automático** para modo offline
- ✅ **Interface responsiva** moderna
- ✅ **LGPD compliance** completo
- ✅ **Logs de segurança** detalhados
- ✅ **Deploy fácil** na Vercel
- ✅ **Sem configuração** necessária para começar

---

## 📋 Pré-requisitos

- **Node.js** 14+ 
- **npm** 6+
- **Projeto Firebase** configurado
- **Service Account Key** do Firebase

---

## 🔧 Instalação e Configuração

### 1. **Instalar Dependências**
```bash
npm install
```

### 2. **Configurar Firebase Console**

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Vá para **Configurações do Projeto** → **Contas de Serviço**
3. Clique em **Gerar nova chave privada**
4. Baixe o arquivo JSON e renomeie para `serviceAccountKey.json`
5. Coloque em `public/js/serviceAccountKey.json`

### 3. **Obter Configurações Frontend**

No Firebase Console, vá em **Configurações do Projeto** → **Geral** → **Seus apps** e copie a configuração:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "neuro-897dc.firebaseapp.com",
  projectId: "neuro-897dc",
  storageBucket: "neuro-897dc.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

### 4. **Atualizar Configurações**

Edite `public/index.html` na seção Firebase SDK e substitua pelas suas credenciais reais:

```html
<!-- Substitua as credenciais demo pelas reais -->
const firebaseConfig = {
    apiKey: "SUA_API_KEY_REAL",
    authDomain: "neuro-897dc.firebaseapp.com",
    projectId: "neuro-897dc",
    storageBucket: "neuro-897dc.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID",
    databaseURL: "https://neuro-897dc-default-rtdb.firebaseio.com/"
};
```

---

## 🚀 Como Executar

### **Modo Desenvolvimento Frontend** (apenas cliente)
```bash
npm run dev
# Abre em http://localhost:8080
```

### **Modo Servidor Completo** (backend + frontend)
```bash
npm start
# ou
npm run server
# Abre em http://localhost:3001
```

### **Desenvolvimento com Auto-reload**
```bash
npm run server:dev
# Usa nodemon para reload automático
```

---

## 👥 Inicializar Usuários no Firebase

### 1. **Testar Conexão Firebase**
```bash
npm run test-firebase
```

### 2. **Criar Usuários Iniciais**
```bash
node init-users.js
```

Este comando criará os usuários no Firebase Auth:

| Email | Senha | Função | Nome |
|-------|-------|---------|------|
| `coord@clinica.com` | `coord123` | Coordenador | Dr. Ana Silva |
| `admin@neuropsico.com` | `admin2025` | Coordenador | Administrador Sistema |
| `func@clinica.com` | `func123` | Funcionário | Dra. Maria Santos |
| `staff@neuropsico.com` | `staff2025` | Funcionário | Equipe Clínica |
| `intern@clinica.com` | `intern123` | Estagiário | Estagiário Junior |
| `estagiario@neuropsico.com` | `est2025` | Estagiário | Estagiário Sistema |

---

## 🔐 Sistema de Autenticação

### **Local (Desenvolvimento)**
O sistema funciona com usuários locais para desenvolvimento:
- Login sem internet
- Dados no localStorage
- Compatível com migração

### **Firebase (Produção)**
Migração automática para Firebase Auth:
- Autenticação real
- Tokens JWT
- Controle de sessão
- Logs de segurança

---

## 🌐 API Endpoints

### **Autenticação**
- `POST /api/auth/create-user` - Criar usuário
- `POST /api/auth/verify-token` - Verificar token

### **Dados (Protegidas)**
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Criar cliente  
- `GET /api/schedules` - Listar agendamentos
- `POST /api/schedules` - Criar agendamento
- `GET /api/security-logs` - Logs (coordenadores)

### **Upload**
- `POST /api/upload` - Upload de arquivos

### **Utilitários**
- `GET /api/info` - Informações do servidor
- `POST /api/migrate-data` - Migrar localStorage → Firestore

---

## 📁 Estrutura do Projeto

```
├── public/
│   ├── js/
│   │   ├── auth.js                    # Autenticação híbrida
│   │   ├── firebase-config.js         # Config Firebase cliente
│   │   ├── security-logger.js         # Logs de segurança
│   │   ├── lgpd-compliance.js         # LGPD compliance
│   │   ├── file-upload.js            # Upload seguro
│   │   ├── firestore-database.js     # Database Firestore
│   │   ├── validation.js             # Validações
│   │   ├── serviceAccountKey.json    # 🔑 Chave Firebase
│   │   └── ...outros módulos
│   ├── index.html                    # Interface principal
│   └── style.css                     # Estilos
├── firebase-admin-config.js          # Firebase Admin SDK
├── server.js                         # Servidor Express + API
├── init-users.js                     # Script criar usuários
├── package.json                      # Dependências
├── firebase.json                     # Config Firebase Hosting
├── firestore.rules                   # Regras Firestore
└── storage.rules                     # Regras Storage
```

---

## 🔒 Recursos de Segurança

### **Autenticação**
- ✅ Controle de tentativas (máx 5, bloqueio 15min)
- ✅ Timeout de sessão (24 horas)
- ✅ Tokens JWT com renovação
- ✅ Hierarquia de permissões

### **LGPD Compliance**
- ✅ Sistema de consentimentos
- ✅ Direito ao esquecimento
- ✅ Portabilidade de dados
- ✅ Logs de acesso detalhados
- ✅ Anonimização automática

### **Logs de Segurança**
- ✅ Eventos de login/logout
- ✅ Tentativas falhadas
- ✅ Acesso a dados sensíveis
- ✅ Modificações de dados
- ✅ Upload/download arquivos

---

## 🔄 Migração localStorage → Firebase

### **Automática**
O sistema detecta automaticamente dados locais e oferece migração.

### **Manual**
```bash
# Via API
POST /api/migrate-data
{
  "collection": "clients",
  "data": [/* dados do localStorage */]
}
```

---

## 🌐 Configuração Firebase

### **1. Authentication**
```bash
firebase init auth
```
- Habilitar Email/Password
- Configurar domínios autorizados

### **2. Firestore Database**
```bash
firebase init firestore
```
- Aplicar regras de `firestore.rules`
- Configurar índices

### **3. Storage**
```bash
firebase init storage
```
- Aplicar regras de `storage.rules`
- Configurar buckets

### **4. Hosting (opcional)**
```bash
firebase init hosting
firebase deploy
```

---

## 🚀 Deploy em Produção

### **1. Vercel (Recomendado)**
```bash
npm install -g vercel
vercel --prod
```

### **2. Firebase Hosting**
```bash
npm run firebase:deploy
```

### **3. Servidor Próprio**
```bash
npm run build
npm start
```

---

## 🧪 Testes

### **Testar Firebase Admin SDK**
```bash
npm run test-firebase
```

### **Testar Usuários**
```bash
node init-users.js
```

### **Testar API**
```bash
curl http://localhost:3001/api/info
```

---

## 📞 Usuários de Teste

### **Coordenadores (Acesso Total)**
- `coord@clinica.com` / `coord123`
- `admin@neuropsico.com` / `admin2025`

### **Funcionários (Clientes + Relatórios)**
- `func@clinica.com` / `func123`  
- `staff@neuropsico.com` / `staff2025`

### **Estagiários (Agenda + Seus Pacientes)**
- `intern@clinica.com` / `intern123`
- `estagiario@neuropsico.com` / `est2025`

---

## 🆘 Solução de Problemas

### **Erro: Firebase não inicializado**
1. Verificar `serviceAccountKey.json` existe
2. Verificar credenciais no `index.html`
3. Executar `npm run test-firebase`

### **Erro: Usuários não encontrados**
1. Executar `node init-users.js`
2. Verificar Firebase Console → Authentication

### **Erro: Permissão negada**
1. Verificar regras Firestore/Storage
2. Verificar função do usuário logado
3. Aplicar regras: `firebase deploy --only firestore:rules`

---

## 🔄 Atualizações

### **Adicionar Nova Funcionalidade**
1. Desenvolver localmente com localStorage
2. Criar endpoint na API (`server.js`)
3. Integrar com Firestore
4. Testar e deploy

### **Atualizar Regras de Segurança**
```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## 📊 Monitoramento

### **Firebase Console**
- Authentication → usuários ativos
- Firestore → uso de dados
- Storage → arquivos armazenados
- Functions → logs de execução

### **Logs do Sistema**
- Security logs → eventos de segurança
- User activity → atividades dos usuários
- Data access → acesso a dados LGPD

---

## 🎯 Próximos Passos

1. ✅ **Sistema funcionando localmente**
2. ⏳ **Configurar Firebase Console**
3. ⏳ **Executar init-users.js**
4. ⏳ **Testar autenticação Firebase**
5. ⏳ **Deploy em produção**

---

## 📝 Licença

MIT License - Sistema de Neuropsicologia

---

## 🤝 Suporte

Para suporte técnico:
1. Verificar logs do console
2. Consultar Firebase Console
3. Verificar documentação Firebase
4. Contatar desenvolvimento

**Sistema pronto para produção! 🚀** 