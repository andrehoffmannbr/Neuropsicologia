// Servidor Express com Supabase - Sistema de Neuropsicologia
// Substitui server.js com Firebase por integração Supabase

const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração Supabase (será obtida das variáveis de ambiente)
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Cliente Supabase (Server-side com Service Role Key)
const supabase = createClient(supabaseUrl, supabaseKey);

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://your-domain.vercel.app'],
    credentials: true
}));

// Servir arquivos estáticos
app.use(express.static('public'));

// =====================
// MIDDLEWARE DE AUTENTICAÇÃO
// =====================

// Middleware para verificar autenticação Supabase
async function authenticateUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token de autorização necessário' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(500).json({ error: 'Erro interno de autenticação' });
    }
}

// =====================
// ROTAS DE AUTENTICAÇÃO
// =====================

// Criar usuário
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, metadata } = req.body;

        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            user_metadata: metadata,
            email_confirm: false // Confirmar email automaticamente
        });

        if (error) throw error;

        res.json({ 
            success: true, 
            user: data.user,
            message: 'Usuário criado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Listar usuários (apenas coordenadores)
app.get('/api/auth/users', authenticateUser, async (req, res) => {
    try {
        // Verificar se é coordenador
        const userProfile = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', req.user.id)
            .single();

        if (userProfile.data?.role !== 'coordinator') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { data, error } = await supabase.auth.admin.listUsers();
        if (error) throw error;

        res.json({ success: true, users: data.users });

    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================
// ROTAS DE DADOS
// =====================

// Dashboard - Estatísticas gerais
app.get('/api/dashboard/stats', authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('get_dashboard_stats');
        if (error) throw error;

        res.json({ success: true, stats: data });

    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clientes
app.get('/api/clients', authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        res.json({ success: true, clients: data });

    } catch (error) {
        console.error('Erro ao obter clientes:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clients', authenticateUser, async (req, res) => {
    try {
        const clientData = {
            ...req.body,
            created_by: req.user.id
        };

        const { data, error } = await supabase
            .from('clients')
            .insert(clientData)
            .select()
            .single();

        if (error) throw error;

        // Log de auditoria
        await supabase.from('data_access_logs').insert({
            table_name: 'clients',
            record_id: data.id,
            action: 'create',
            user_id: req.user.id,
            justification: 'Cadastro de novo cliente'
        });

        res.json({ success: true, client: data });

    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({ error: error.message });
    }
});

// Agendamentos
app.get('/api/schedules', authenticateUser, async (req, res) => {
    try {
        const { date } = req.query;
        let query = supabase
            .from('schedules')
            .select(`
                *,
                clients (
                    id,
                    name,
                    phone,
                    email
                ),
                user_profiles (
                    name
                )
            `)
            .order('appointment_date');

        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            query = query
                .gte('appointment_date', startDate.toISOString())
                .lt('appointment_date', endDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, schedules: data });

    } catch (error) {
        console.error('Erro ao obter agendamentos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Estoque
app.get('/api/stock', authenticateUser, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('stock_items')
            .select('*')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        res.json({ success: true, stock: data });

    } catch (error) {
        console.error('Erro ao obter estoque:', error);
        res.status(500).json({ error: error.message });
    }
});

// Movimento de estoque
app.post('/api/stock/:id/movement', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { movement_type, quantity, reason, notes } = req.body;

        // Inserir movimento
        const { error: movementError } = await supabase
            .from('stock_movements')
            .insert({
                stock_item_id: id,
                movement_type,
                quantity: parseInt(quantity),
                reason,
                notes,
                user_id: req.user.id
            });

        if (movementError) throw movementError;

        // Atualizar quantidade do item
        const quantityChange = movement_type === 'in' ? quantity : -quantity;
        const { error: updateError } = await supabase.rpc('update_stock_quantity', {
            item_id: id,
            quantity_change: quantityChange
        });

        if (updateError) throw updateError;

        res.json({ success: true, message: 'Movimento registrado com sucesso' });

    } catch (error) {
        console.error('Erro no movimento de estoque:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================
// ROTAS DE UPLOAD
// =====================

// Upload de arquivo
app.post('/api/upload', authenticateUser, async (req, res) => {
    try {
        const { file, fileName, bucket, folder } = req.body;
        
        if (!file || !fileName || !bucket) {
            return res.status(400).json({ error: 'Dados do arquivo incompletos' });
        }

        // Converter base64 para buffer
        const fileBuffer = Buffer.from(file.split(',')[1], 'base64');
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
                contentType: req.body.contentType || 'application/octet-stream',
                upsert: false
            });

        if (error) throw error;

        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        res.json({ 
            success: true, 
            path: data.path,
            url: publicUrlData.publicUrl
        });

    } catch (error) {
        console.error('Erro no upload:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================
// ROTAS DE LOGS E AUDITORIA
// =====================

// Logs de segurança (apenas coordenadores)
app.get('/api/logs/security', authenticateUser, async (req, res) => {
    try {
        // Verificar se é coordenador
        const userProfile = await supabase
            .from('user_profiles')
            .select('role')
            .eq('user_id', req.user.id)
            .single();

        if (userProfile.data?.role !== 'coordinator') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { data, error } = await supabase
            .from('security_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;

        res.json({ success: true, logs: data });

    } catch (error) {
        console.error('Erro ao obter logs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Criar log de atividade
app.post('/api/logs/activity', authenticateUser, async (req, res) => {
    try {
        const { action, details } = req.body;

        const { error } = await supabase
            .from('user_activity_logs')
            .insert({
                action,
                details,
                user_id: req.user.id
            });

        if (error) throw error;

        res.json({ success: true, message: 'Log registrado' });

    } catch (error) {
        console.error('Erro ao criar log:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================
// ROTAS DE INICIALIZAÇÃO
// =====================

// Criar usuários iniciais
app.post('/api/admin/init-users', async (req, res) => {
    try {
        const { adminKey } = req.body;
        
        // Verificação simples de segurança
        if (adminKey !== 'neuro2025init') {
            return res.status(403).json({ error: 'Chave de admin inválida' });
        }

        const initialUsers = [
            {
                email: 'coord@clinica.com',
                password: 'coord123',
                name: 'Dr. Ana Silva',
                role: 'coordinator'
            },
            {
                email: 'func@clinica.com',
                password: 'func123',
                name: 'Dra. Maria Santos',
                role: 'staff'
            },
            {
                email: 'estagiario@clinica.com',
                password: 'intern123',
                name: 'João Oliveira',
                role: 'intern'
            }
        ];

        const results = [];
        for (const user of initialUsers) {
            try {
                const { data, error } = await supabase.auth.admin.createUser({
                    email: user.email,
                    password: user.password,
                    user_metadata: {
                        name: user.name,
                        role: user.role
                    },
                    email_confirm: false
                });

                if (error) {
                    results.push({ email: user.email, error: error.message });
                } else {
                    results.push({ email: user.email, success: true, id: data.user.id });
                }
            } catch (err) {
                results.push({ email: user.email, error: err.message });
            }
        }

        res.json({ success: true, results });

    } catch (error) {
        console.error('Erro ao criar usuários iniciais:', error);
        res.status(500).json({ error: error.message });
    }
});

// =====================
// ROTA PRINCIPAL
// =====================

// Servir aplicação
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para verificar status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        service: 'Neuropsicologia System',
        database: 'Supabase',
        timestamp: new Date().toISOString(),
        configured: supabaseUrl !== 'https://your-project.supabase.co'
    });
});

// =====================
// MIDDLEWARE DE ERRO
// =====================

app.use((error, req, res, next) => {
    console.error('Erro no servidor:', error);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
    });
});

// 404 para APIs
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// =====================
// INICIALIZAÇÃO
// =====================

// Verificar configuração Supabase
const isConfigured = supabaseUrl !== 'https://your-project.supabase.co' && 
                    supabaseKey !== 'your-service-role-key';

// Iniciar servidor
app.listen(PORT, () => {
    console.log('\n🚀 ===== SERVIDOR SUPABASE INICIADO =====');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🗄️  Database: Supabase PostgreSQL`);
    console.log(`🟢 Status: ${isConfigured ? 'Configurado' : 'Aguardando configuração'}`);
    console.log(`📊 Supabase URL: ${supabaseUrl}`);
    console.log(`🔑 Service Key: ${isConfigured ? 'Configurada' : 'Aguardando'}`);
    console.log('=======================================\n');
    
    if (!isConfigured) {
        console.log('⚠️  AVISO: Configure as variáveis de ambiente:');
        console.log('   SUPABASE_URL=https://your-project.supabase.co');
        console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n');
    }
});

module.exports = app; 