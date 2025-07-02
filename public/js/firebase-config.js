// Firebase Configuration - Using global instances from HTML
// As instâncias do Firebase são criadas no HTML e disponibilizadas globalmente

// Usar instâncias globais criadas no HTML
export const auth = window.firebaseAuth;
export const db = window.firebaseDb; 
export const storage = window.firebaseStorage;
export const app = window.firebaseApp;

// Mock functions para desenvolvimento (remover em produção)
export const functions = null; // Será configurado quando necessário

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

// Verificar se Firebase foi inicializado
if (!auth || !db || !storage) {
    console.warn('Firebase não foi inicializado corretamente. Verificar se as chaves estão configuradas.');
} else {
    console.log('✅ Firebase configurado com sucesso');
}

export default app; 