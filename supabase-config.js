// Supabase Configuration - Sistema de Neuropsicologia
// Substitui Firebase por Supabase + PostgreSQL

import { createClient } from '@supabase/supabase-js';

// Configurações Supabase (substitua pelas suas após criar projeto)
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

// Cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configurações de segurança
export const SECURITY_CONFIG = {
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
    MAX_LOGIN_ATTEMPTS: 5,
    PASSWORD_MIN_LENGTH: 8,
    FILE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
    RATE_LIMIT: {
        requests: 100,
        window: 60 * 1000 // 1 minuto
    }
};

// Configurações LGPD
export const LGPD_CONFIG = {
    DATA_RETENTION_DAYS: 365 * 5, // 5 anos
    CONSENT_VERSION: '1.0',
    REQUIRED_CONSENTS: [
        'data_processing',
        'data_storage',
        'clinical_data',
        'communication'
    ]
};

// Funções utilitárias para compatibilidade
export const auth = {
    // Fazer login
    signIn: async (email, password) => {
        return await supabase.auth.signInWithPassword({ email, password });
    },
    
    // Fazer logout
    signOut: async () => {
        return await supabase.auth.signOut();
    },
    
    // Criar usuário
    signUp: async (email, password, metadata = {}) => {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
    },
    
    // Reset senha
    resetPassword: async (email) => {
        return await supabase.auth.resetPasswordForEmail(email);
    },
    
    // Obter usuário atual
    getUser: async () => {
        return await supabase.auth.getUser();
    },
    
    // Listener de mudanças de auth
    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Funções de banco de dados
export const db = {
    // Buscar dados
    from: (table) => supabase.from(table),
    
    // Inserir dados
    insert: async (table, data) => {
        return await supabase.from(table).insert(data);
    },
    
    // Atualizar dados
    update: async (table, data, id) => {
        return await supabase.from(table).update(data).eq('id', id);
    },
    
    // Deletar dados
    delete: async (table, id) => {
        return await supabase.from(table).delete().eq('id', id);
    },
    
    // Buscar por ID
    findById: async (table, id) => {
        return await supabase.from(table).select('*').eq('id', id).single();
    },
    
    // Buscar todos
    findAll: async (table, filters = {}) => {
        let query = supabase.from(table).select('*');
        
        Object.keys(filters).forEach(key => {
            query = query.eq(key, filters[key]);
        });
        
        return await query;
    },
    
    // Real-time subscription
    subscribe: (table, callback) => {
        return supabase
            .channel(`${table}-changes`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: table }, 
                callback
            )
            .subscribe();
    }
};

// Funções de storage/upload
export const storage = {
    // Upload arquivo
    upload: async (bucket, path, file) => {
        return await supabase.storage.from(bucket).upload(path, file);
    },
    
    // Download arquivo
    download: async (bucket, path) => {
        return await supabase.storage.from(bucket).download(path);
    },
    
    // Obter URL pública
    getPublicUrl: (bucket, path) => {
        return supabase.storage.from(bucket).getPublicUrl(path);
    },
    
    // Deletar arquivo
    remove: async (bucket, paths) => {
        return await supabase.storage.from(bucket).remove(paths);
    },
    
    // Listar arquivos
    list: async (bucket, path = '') => {
        return await supabase.storage.from(bucket).list(path);
    }
};

// RPC (funções do banco)
export const rpc = {
    call: async (functionName, params = {}) => {
        return await supabase.rpc(functionName, params);
    }
};

// Logs e auditoria
export const logger = {
    // Log de segurança
    security: async (event, details = {}) => {
        return await db.insert('security_logs', {
            event_type: event,
            details,
            user_id: (await auth.getUser()).data.user?.id,
            timestamp: new Date().toISOString(),
            ip_address: 'localhost', // Será obtido pelo servidor
            user_agent: navigator.userAgent
        });
    },
    
    // Log de atividade
    activity: async (action, details = {}) => {
        return await db.insert('user_activity_logs', {
            action,
            details,
            user_id: (await auth.getUser()).data.user?.id,
            timestamp: new Date().toISOString()
        });
    },
    
    // Log de acesso a dados (LGPD)
    dataAccess: async (table, recordId, action = 'read') => {
        return await db.insert('data_access_logs', {
            table_name: table,
            record_id: recordId,
            action,
            user_id: (await auth.getUser()).data.user?.id,
            timestamp: new Date().toISOString(),
            justification: 'Acesso durante operação normal'
        });
    }
};

// Helper para verificar se Supabase está configurado
export const isConfigured = () => {
    return supabaseUrl !== 'https://your-project.supabase.co' && 
           supabaseAnonKey !== 'your-anon-key';
};

// Log de inicialização
if (isConfigured()) {
    console.log('🟢 Supabase configurado:', supabaseUrl);
} else {
    console.log('🟡 Supabase aguardando configuração');
}

export default supabase; 