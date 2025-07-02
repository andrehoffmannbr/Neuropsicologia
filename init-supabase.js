// Script de Inicialização Supabase - Sistema de Neuropsicologia
// Cria usuários iniciais no Supabase Auth

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Verificar se as variáveis estão configuradas
if (supabaseUrl === 'https://your-project.supabase.co' || 
    supabaseServiceKey === 'your-service-role-key') {
    console.error('❌ ERRO: Configure as variáveis de ambiente primeiro:');
    console.error('SUPABASE_URL=sua-url-supabase');
    console.error('SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key');
    process.exit(1);
}

// Cliente Supabase com Service Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Usuários iniciais do sistema
const INITIAL_USERS = [
    {
        email: 'coord@clinica.com',
        password: 'coord123',
        name: 'Dr. Ana Silva',
        role: 'coordinator',
        permissions: ['all']
    },
    {
        email: 'admin@neuropsico.com',
        password: 'admin2025',
        name: 'Administrador Sistema',
        role: 'coordinator',
        permissions: ['all']
    },
    {
        email: 'func@clinica.com', 
        password: 'func123',
        name: 'Dra. Maria Santos',
        role: 'staff',
        permissions: ['clients', 'schedule', 'reports']
    },
    {
        email: 'staff@neuropsico.com',
        password: 'staff2025',
        name: 'Equipe Clínica',
        role: 'staff',
        permissions: ['clients', 'schedule', 'reports']
    },
    {
        email: 'estagiario@clinica.com',
        password: 'intern123',
        name: 'João Oliveira',
        role: 'intern',
        permissions: ['schedule', 'my_clients']
    },
    {
        email: 'intern@neuropsico.com',
        password: 'est2025',
        name: 'Estagiário Sistema',
        role: 'intern',
        permissions: ['schedule', 'my_clients']
    }
];

// Função principal
async function initializeSupabase() {
    console.log('🚀 ===== INICIALIZANDO SUPABASE =====\n');
    
    try {
        // 1. Testar conexão
        console.log('🔗 Testando conexão...');
        const { data: testData, error: testError } = await supabase.auth.admin.listUsers();
        
        if (testError) {
            console.error('❌ Erro na conexão:', testError.message);
            return;
        }
        
        console.log('✅ Conexão estabelecida com sucesso!');
        console.log(`📊 Usuários existentes: ${testData.users.length}\n`);
        
        // 2. Criar usuários iniciais
        console.log('👥 Criando usuários iniciais...\n');
        
        const results = [];
        
        for (const user of INITIAL_USERS) {
            try {
                console.log(`📝 Criando: ${user.email} (${user.role})`);
                
                const { data, error } = await supabase.auth.admin.createUser({
                    email: user.email,
                    password: user.password,
                    user_metadata: {
                        name: user.name,
                        role: user.role,
                        permissions: user.permissions
                    },
                    email_confirm: false // Confirmar automaticamente
                });
                
                if (error) {
                    if (error.message.includes('already registered')) {
                        console.log(`⚠️  Usuário ${user.email} já existe`);
                        results.push({ 
                            email: user.email, 
                            status: 'exists', 
                            message: 'Usuário já registrado' 
                        });
                    } else {
                        console.log(`❌ Erro: ${error.message}`);
                        results.push({ 
                            email: user.email, 
                            status: 'error', 
                            message: error.message 
                        });
                    }
                } else {
                    console.log(`✅ Criado: ${user.email} (ID: ${data.user.id})`);
                    results.push({ 
                        email: user.email, 
                        status: 'created', 
                        id: data.user.id,
                        name: user.name,
                        role: user.role
                    });
                }
            } catch (err) {
                console.log(`❌ Erro inesperado: ${err.message}`);
                results.push({ 
                    email: user.email, 
                    status: 'error', 
                    message: err.message 
                });
            }
            
            // Aguardar um pouco entre criações
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // 3. Verificar storage buckets
        console.log('\n📁 Verificando Storage Buckets...');
        
        const bucketsToCreate = [
            'client-documents',
            'medical-reports', 
            'financial-receipts',
            'general-documents',
            'user-profiles',
            'system-backups'
        ];
        
        for (const bucketName of bucketsToCreate) {
            try {
                const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucketName);
                
                if (bucketError && bucketError.message.includes('not found')) {
                    // Bucket não existe, tentar criar
                    const { error: createError } = await supabase.storage.createBucket(bucketName, {
                        public: false
                    });
                    
                    if (createError) {
                        console.log(`⚠️  Aviso: Não foi possível criar bucket ${bucketName}: ${createError.message}`);
                    } else {
                        console.log(`✅ Bucket criado: ${bucketName}`);
                    }
                } else if (!bucketError) {
                    console.log(`✅ Bucket existe: ${bucketName}`);
                }
            } catch (err) {
                console.log(`⚠️  Aviso: Erro ao verificar bucket ${bucketName}: ${err.message}`);
            }
        }
        
        // 4. Resumo final
        console.log('\n📊 ===== RESUMO =====');
        console.log(`✅ Sucessos: ${results.filter(r => r.status === 'created').length}`);
        console.log(`⚠️  Já existiam: ${results.filter(r => r.status === 'exists').length}`);
        console.log(`❌ Erros: ${results.filter(r => r.status === 'error').length}`);
        
        // Exibir usuários criados
        const created = results.filter(r => r.status === 'created');
        if (created.length > 0) {
            console.log('\n👥 USUÁRIOS CRIADOS:');
            created.forEach(user => {
                console.log(`   📧 ${user.email} - ${user.name} (${user.role})`);
            });
        }
        
        // Exibir credenciais de login
        console.log('\n🔑 ===== CREDENCIAIS DE LOGIN =====');
        console.log('📋 Use estas credenciais para fazer login no sistema:\n');
        
        console.log('👨‍💼 COORDENADORES:');
        console.log('   coord@clinica.com / coord123');
        console.log('   admin@neuropsico.com / admin2025\n');
        
        console.log('👩‍⚕️ FUNCIONÁRIOS:');
        console.log('   func@clinica.com / func123');
        console.log('   staff@neuropsico.com / staff2025\n');
        
        console.log('🎓 ESTAGIÁRIOS:');
        console.log('   estagiario@clinica.com / intern123');
        console.log('   intern@neuropsico.com / est2025\n');
        
        console.log('🟢 Inicialização concluída com sucesso!');
        console.log('🌐 Acesse: http://localhost:3000');
        
    } catch (error) {
        console.error('❌ Erro fatal durante inicialização:', error);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    initializeSupabase()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Erro:', error);
            process.exit(1);
        });
}

module.exports = { initializeSupabase, INITIAL_USERS }; 