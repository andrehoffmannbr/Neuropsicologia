// Sistema de Autenticação - APENAS SUPABASE
// Versão sem localStorage - usa sessionStorage para sessão

import { database } from './supabase-database.js';

// Log para debug
const log = (message, data = null) => {
    console.log(`🔐 [AUTH] ${message}`, data ? data : '');
};

// Verificar se Supabase está disponível
const isSupabaseReady = () => {
    return window.SUPABASE_READY && window.supabase;
};

// ============= GESTÃO DE SESSÃO =============

// Salvar sessão do usuário (sessionStorage - apagado ao fechar aba)
const saveUserSession = (userData) => {
    try {
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('loginTime', new Date().toISOString());
        log('Sessão salva', userData.username);
    } catch (error) {
        log('Erro ao salvar sessão', error.message);
    }
};

// Obter sessão atual do usuário
const getCurrentUserSession = () => {
    try {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const userDataStr = sessionStorage.getItem('currentUser');
        
        if (!isLoggedIn || !userDataStr) {
            return null;
        }
        
        const userData = JSON.parse(userDataStr);
        return userData;
    } catch (error) {
        log('Erro ao recuperar sessão', error.message);
        return null;
    }
};

// Limpar sessão do usuário
const clearUserSession = () => {
    try {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('loginTime');
        log('Sessão limpa');
    } catch (error) {
        log('Erro ao limpar sessão', error.message);
    }
};

// ============= AUTENTICAÇÃO =============

// Sistema de tentativas de login (em memória)
let loginAttempts = {};

// Verificar bloqueio por tentativas
const isBlocked = (username) => {
    const attempts = loginAttempts[username] || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    const timeDiff = now - attempts.lastAttempt;
    
    // Resetar contagem após 15 minutos
    if (timeDiff > 15 * 60 * 1000) {
        attempts.count = 0;
    }
    
    // Bloquear após 5 tentativas por 15 minutos
    if (attempts.count >= 5 && timeDiff < 15 * 60 * 1000) {
        const remainingTime = Math.ceil((15 * 60 * 1000 - timeDiff) / (60 * 1000));
        throw new Error(`Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`);
    }
    
    return false;
};

// Registrar tentativa de login
const recordLoginAttempt = (username, success = false) => {
    if (!loginAttempts[username]) {
        loginAttempts[username] = { count: 0, lastAttempt: 0 };
    }
    
    if (success) {
        loginAttempts[username].count = 0;
    } else {
        loginAttempts[username].count++;
        loginAttempts[username].lastAttempt = Date.now();
    }
};

// Função principal de login
export async function login(username, password) {
    try {
        if (!isSupabaseReady()) {
            throw new Error('Sistema offline. Verifique sua conexão.');
        }
        
        log('Iniciando processo de login', username);
        
        // Verificar bloqueio
        isBlocked(username);
        
        // Autenticar via Supabase
        const result = await database.authenticateUser(username, password);
        
        if (!result.success) {
            recordLoginAttempt(username, false);
            throw new Error('Credenciais inválidas');
        }
        
        const userData = result.data;
        
        // Salvar sessão
        saveUserSession({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            loginTime: new Date().toISOString()
        });
        
        // Registrar tentativa bem-sucedida
        recordLoginAttempt(username, true);
        
        // Log de segurança
        await database.saveSecurityLog({
            eventType: 'user_login_success',
            details: {
                username: userData.username,
                role: userData.role,
                loginMethod: 'supabase'
            },
            ipAddress: await getClientIP(),
            userAgent: navigator.userAgent
        });
        
        log('Login realizado com sucesso', userData.username);
        return {
            success: true,
            user: userData
        };
        
    } catch (error) {
        log('Erro no login', error.message);
        
        // Log de segurança para tentativa falhada
        if (isSupabaseReady()) {
            await database.saveSecurityLog({
                eventType: 'user_login_failed',
                details: {
                    username: username,
                    error: error.message,
                    loginMethod: 'supabase'
                },
                ipAddress: await getClientIP(),
                userAgent: navigator.userAgent
            });
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Verificar se usuário está logado
export function isLoggedIn() {
    const session = getCurrentUserSession();
    if (!session) {
        return false;
    }
    
    // Verificar se a sessão não expirou (8 horas)
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const diffHours = (now - loginTime) / (1000 * 60 * 60);
    
    if (diffHours > 8) {
        log('Sessão expirada');
        clearUserSession();
        return false;
    }
    
    return true;
}

// Obter usuário atual
export function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return getCurrentUserSession();
}

// Atualizar dados do usuário na sessão
export function updateUserSession(updates) {
    const currentUser = getCurrentUserSession();
    if (!currentUser) {
        return false;
    }
    
    const updatedUser = { ...currentUser, ...updates };
    saveUserSession(updatedUser);
    return true;
}

// Logout
export async function logout() {
    try {
        const currentUser = getCurrentUserSession();
        
        if (currentUser && isSupabaseReady()) {
            // Log de segurança
            await database.saveSecurityLog({
                eventType: 'user_logout',
                details: {
                    username: currentUser.username,
                    role: currentUser.role,
                    sessionDuration: calculateSessionDuration(currentUser.loginTime)
                },
                ipAddress: await getClientIP(),
                userAgent: navigator.userAgent
            });
        }
        
        // Limpar sessão
        clearUserSession();
        
        log('Logout realizado');
        return { success: true };
        
    } catch (error) {
        log('Erro no logout', error.message);
        // Limpar sessão mesmo com erro
        clearUserSession();
        return { success: false, error: error.message };
    }
}

// ============= AUTORIZAÇÃO =============

// Verificar se usuário tem permissão para uma função
export function hasPermission(requiredRole) {
    const user = getCurrentUser();
    if (!user) {
        return false;
    }
    
    const roleHierarchy = {
        'coordenador': 3,
        'funcionario': 2,
        'estagiario': 1
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
}

// Verificar se é coordenador
export function isCoordinator() {
    return hasPermission('coordenador');
}

// Verificar se é funcionário ou superior
export function isStaff() {
    return hasPermission('funcionario');
}

// ============= UTILITÁRIOS =============

// Obter IP do cliente (simplificado)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'unknown';
    }
}

// Calcular duração da sessão
function calculateSessionDuration(loginTime) {
    const start = new Date(loginTime);
    const end = new Date();
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / (1000 * 60));
    return `${diffMins} minutos`;
}

// ============= INICIALIZAÇÃO =============

// Inicializar sistema de autenticação
export function initializeAuth() {
    log('Sistema de autenticação inicializado');
    
    // Verificar se há sessão válida
    if (isLoggedIn()) {
        const user = getCurrentUser();
        log('Sessão válida encontrada', user.username);
        return user;
    }
    
    return null;
}

// Renovar sessão (estender tempo)
export function renewSession() {
    const user = getCurrentUserSession();
    if (!user) {
        return false;
    }
    
    // Atualizar tempo de login
    user.loginTime = new Date().toISOString();
    saveUserSession(user);
    
    log('Sessão renovada');
    return true;
}

// ============= EXPORTAÇÕES LEGADAS (COMPATIBILIDADE) =============

// Para compatibilidade com código antigo
window.getCurrentUser = getCurrentUser;
window.isLoggedIn = isLoggedIn;
window.hasPermission = hasPermission;

// Estado de autenticação global
window.AUTH_STATE = {
    isInitialized: true,
    usesSupabase: true,
    usesLocalStorage: false
};

