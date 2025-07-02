// Security Logger for LGPD Compliance and Audit Trail
// Usa instâncias globais do Firebase configuradas no HTML

import { db, LGPD_CONFIG } from './firebase-config.js';

// Funções Firebase usando instâncias globais
async function addDoc(collection, data) {
    if (!window.firebaseDb) {
        throw new Error('Firebase não inicializado');
    }
    
    // Simulação para desenvolvimento local
    console.log('📝 Log registrado:', collection.path, data);
    
    // Fallback para localStorage
    const logs = JSON.parse(localStorage.getItem(collection.path) || '[]');
    const entry = {
        id: Date.now() + Math.random(),
        ...data,
        timestamp: new Date().toISOString()
    };
    logs.push(entry);
    localStorage.setItem(collection.path, JSON.stringify(logs));
    
    return { id: entry.id };
}

function collection(db, path) {
    return { path };
}

function serverTimestamp() {
    return new Date().toISOString();
}

function query(collection, ...conditions) {
    return { collection, conditions };
}

function where(field, op, value) {
    return { type: 'where', field, op, value };
}

function orderBy(field, direction = 'asc') {
    return { type: 'orderBy', field, direction };
}

function limit(count) {
    return { type: 'limit', count };
}

async function getDocs(query) {
    // Simulação usando localStorage
    const logs = JSON.parse(localStorage.getItem(query.collection.path) || '[]');
    return {
        forEach: (callback) => {
            logs.forEach(log => callback({
                id: log.id,
                data: () => log
            }));
        }
    };
}

// Tipos de eventos de segurança
const SECURITY_EVENT_TYPES = {
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    PASSWORD_RESET_REQUESTED: 'password_reset_requested',
    PASSWORD_RESET_FAILED: 'password_reset_failed',
    PASSWORD_CHANGED: 'password_changed',
    PASSWORD_CHANGE_FAILED: 'password_change_failed',
    UNAUTHORIZED_ACCESS: 'unauthorized_access',
    DATA_ACCESS: 'data_access',
    DATA_MODIFICATION: 'data_modification',
    DATA_DELETION: 'data_deletion',
    FILE_UPLOAD: 'file_upload',
    FILE_DOWNLOAD: 'file_download',
    GDPR_CONSENT: 'gdpr_consent',
    GDPR_DATA_EXPORT: 'gdpr_data_export',
    GDPR_DATA_DELETION: 'gdpr_data_deletion'
};

// Log de evento de segurança
export async function logSecurityEvent(eventType, details = {}) {
    try {
        const logEntry = {
            eventType,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
            ip: await getClientIP(),
            sessionId: getSessionId(),
            ...details
        };

        await addDoc(collection(db, 'security_logs'), logEntry);
        
        // Log crítico também no console para desenvolvimento
        if (isCriticalEvent(eventType)) {
            console.warn('SECURITY EVENT:', eventType, details);
        }
        
    } catch (error) {
        console.error('Erro ao registrar evento de segurança:', error);
        // Fallback para localStorage em caso de falha do Firestore
        logToLocalStorage('security_event', { eventType, details, timestamp: new Date().toISOString() });
    }
}

// Log de atividade do usuário
export async function logUserActivity(action, details = {}) {
    try {
        const logEntry = {
            action,
            timestamp: serverTimestamp(),
            userId: details.userId || getCurrentUserId(),
            email: details.email,
            ...details
        };

        await addDoc(collection(db, 'user_activity_logs'), logEntry);
        
    } catch (error) {
        console.error('Erro ao registrar atividade do usuário:', error);
        logToLocalStorage('user_activity', { action, details, timestamp: new Date().toISOString() });
    }
}

// Log de acesso a dados sensíveis (LGPD)
export async function logDataAccess(dataType, recordId, action = 'read', details = {}) {
    try {
        const logEntry = {
            dataType, // 'client', 'schedule', 'document', etc.
            recordId,
            action, // 'read', 'create', 'update', 'delete'
            timestamp: serverTimestamp(),
            userId: getCurrentUserId(),
            userEmail: getCurrentUserEmail(),
            justification: details.justification || 'Acesso no curso normal das atividades',
            ...details
        };

        await addDoc(collection(db, 'data_access_logs'), logEntry);
        
    } catch (error) {
        console.error('Erro ao registrar acesso a dados:', error);
        logToLocalStorage('data_access', { dataType, recordId, action, details, timestamp: new Date().toISOString() });
    }
}

// Log de consentimento LGPD
export async function logGDPRConsent(userId, consentType, granted = true, details = {}) {
    try {
        const logEntry = {
            userId,
            consentType,
            granted,
            timestamp: serverTimestamp(),
            consentVersion: LGPD_CONFIG.CONSENT_VERSION,
            ipAddress: await getClientIP(),
            userAgent: navigator.userAgent,
            ...details
        };

        await addDoc(collection(db, 'gdpr_consent_logs'), logEntry);
        
    } catch (error) {
        console.error('Erro ao registrar consentimento LGPD:', error);
        logToLocalStorage('gdpr_consent', { userId, consentType, granted, details, timestamp: new Date().toISOString() });
    }
}

// Obter logs de segurança (apenas para coordenadores)
export async function getSecurityLogs(filters = {}, limitCount = 100) {
    try {
        let q = collection(db, 'security_logs');
        
        // Aplicar filtros
        if (filters.eventType) {
            q = query(q, where('eventType', '==', filters.eventType));
        }
        
        if (filters.startDate) {
            q = query(q, where('timestamp', '>=', filters.startDate));
        }
        
        if (filters.endDate) {
            q = query(q, where('timestamp', '<=', filters.endDate));
        }
        
        // Ordenar por timestamp (mais recente primeiro)
        q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));
        
        const querySnapshot = await getDocs(q);
        const logs = [];
        
        querySnapshot.forEach((doc) => {
            logs.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return logs;
        
    } catch (error) {
        console.error('Erro ao obter logs de segurança:', error);
        return [];
    }
}

// Obter logs de acesso a dados (LGPD)
export async function getDataAccessLogs(filters = {}, limitCount = 100) {
    try {
        let q = collection(db, 'data_access_logs');
        
        if (filters.userId) {
            q = query(q, where('userId', '==', filters.userId));
        }
        
        if (filters.dataType) {
            q = query(q, where('dataType', '==', filters.dataType));
        }
        
        if (filters.recordId) {
            q = query(q, where('recordId', '==', filters.recordId));
        }
        
        q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));
        
        const querySnapshot = await getDocs(q);
        const logs = [];
        
        querySnapshot.forEach((doc) => {
            logs.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return logs;
        
    } catch (error) {
        console.error('Erro ao obter logs de acesso a dados:', error);
        return [];
    }
}

// Exportar dados de um usuário (LGPD - Direito de Portabilidade)
export async function exportUserData(userId) {
    try {
        // Log da solicitação de exportação
        await logSecurityEvent(SECURITY_EVENT_TYPES.GDPR_DATA_EXPORT, {
            targetUserId: userId,
            requestedBy: getCurrentUserId()
        });
        
        // Implementar coleta de dados do usuário de todas as coleções relevantes
        const userData = {
            exportDate: new Date().toISOString(),
            userId: userId,
            personalData: {},
            activityLogs: [],
            consentHistory: []
        };
        
        // Aqui você implementaria a coleta real dos dados
        // Por ora, retornamos estrutura básica
        
        return userData;
        
    } catch (error) {
        console.error('Erro ao exportar dados do usuário:', error);
        throw error;
    }
}

// Anonizar dados de um usuário (LGPD - Direito ao Esquecimento)
export async function anonymizeUserData(userId, reason) {
    try {
        // Log da solicitação de anonização
        await logSecurityEvent(SECURITY_EVENT_TYPES.GDPR_DATA_DELETION, {
            targetUserId: userId,
            reason: reason,
            requestedBy: getCurrentUserId()
        });
        
        // Implementar anonização real dos dados
        // Por ora, apenas registramos a intenção
        
        return true;
        
    } catch (error) {
        console.error('Erro ao anonizar dados do usuário:', error);
        throw error;
    }
}

// Verificar se evento é crítico
function isCriticalEvent(eventType) {
    const criticalEvents = [
        SECURITY_EVENT_TYPES.LOGIN_FAILED,
        SECURITY_EVENT_TYPES.UNAUTHORIZED_ACCESS,
        SECURITY_EVENT_TYPES.PASSWORD_RESET_REQUESTED,
        SECURITY_EVENT_TYPES.DATA_DELETION
    ];
    
    return criticalEvents.includes(eventType);
}

// Obter ID do usuário atual
function getCurrentUserId() {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        return user?.uid || user?.id || null;
    } catch {
        return null;
    }
}

// Obter email do usuário atual
function getCurrentUserEmail() {
    try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        return user?.email || null;
    } catch {
        return null;
    }
}

// Obter ID da sessão
function getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

// Obter IP do cliente (placeholder - implementar serviço real em produção)
async function getClientIP() {
    try {
        // Em produção, implementar chamada para serviço de IP
        return 'localhost';
    } catch {
        return 'unknown';
    }
}

// Fallback para localStorage
function logToLocalStorage(type, data) {
    try {
        const logs = JSON.parse(localStorage.getItem(`fallback_logs_${type}`) || '[]');
        logs.push(data);
        
        // Manter apenas os últimos 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem(`fallback_logs_${type}`, JSON.stringify(logs));
    } catch (error) {
        console.error('Erro ao salvar log no localStorage:', error);
    }
}

// Migrar logs do localStorage para Firestore (executar na inicialização)
export async function migrateFallbackLogs() {
    try {
        const logTypes = ['security_event', 'user_activity', 'data_access', 'gdpr_consent'];
        
        for (const type of logTypes) {
            const logs = JSON.parse(localStorage.getItem(`fallback_logs_${type}`) || '[]');
            
            for (const log of logs) {
                // Determinar coleção de destino
                let collectionName = 'security_logs';
                if (type === 'user_activity') collectionName = 'user_activity_logs';
                else if (type === 'data_access') collectionName = 'data_access_logs';
                else if (type === 'gdpr_consent') collectionName = 'gdpr_consent_logs';
                
                await addDoc(collection(db, collectionName), {
                    ...log,
                    timestamp: new Date(log.timestamp),
                    migratedFromFallback: true
                });
            }
            
            // Limpar logs migrados
            localStorage.removeItem(`fallback_logs_${type}`);
        }
        
    } catch (error) {
        console.error('Erro ao migrar logs de fallback:', error);
    }
}

export { SECURITY_EVENT_TYPES }; 