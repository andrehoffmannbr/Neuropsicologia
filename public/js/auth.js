// Hybrid Authentication System - Supabase + Local Fallback
// Compatible with existing local users and Supabase ready

// Importar configuração Supabase
import { auth, logger, isConfigured } from '../../supabase-config.js';

// Usuários locais do sistema (fallback quando Supabase não configurado)
const LOCAL_USERS = {
    // COORDENADORES
    'coord@clinica.com': { 
        password: 'coord123', 
        role: 'coordinator', 
        name: 'Dr. Ana Silva', 
        permissions: ['all'],
        active: true 
    },
    'coordenador': { 
        password: '123456', 
        role: 'coordinator', 
        name: 'Coordenador Principal', 
        permissions: ['all'],
        active: true 
    },
    'admin@neuropsico.com': { 
        password: 'admin2025', 
        role: 'coordinator', 
        name: 'Administrador Sistema', 
        permissions: ['all'],
        active: true 
    },

    // FUNCIONÁRIOS
    'func@clinica.com': { 
        password: 'func123', 
        role: 'staff', 
        name: 'Dra. Maria Santos', 
        permissions: ['clients', 'schedule', 'reports'],
        active: true 
    },
    'funcionario': { 
        password: '123456', 
        role: 'staff', 
        name: 'Funcionário 1', 
        permissions: ['clients', 'schedule', 'reports'],
        active: true 
    },
    'staff@neuropsico.com': { 
        password: 'staff2025', 
        role: 'staff', 
        name: 'Equipe Clínica', 
        permissions: ['clients', 'schedule', 'reports'],
        active: true 
    },

    // ESTAGIÁRIOS
    'estagiario': { 
        password: '123456', 
        role: 'intern', 
        name: 'João Oliveira', 
        permissions: ['schedule', 'my_clients'],
        active: true 
    },
    'intern@clinica.com': { 
        password: 'intern123', 
        role: 'intern', 
        name: 'Estagiário Junior', 
        permissions: ['schedule', 'my_clients'],
        active: true 
    },
    'estagiario@neuropsico.com': { 
        password: 'est2025', 
        role: 'intern', 
        name: 'Estagiário Sistema', 
        permissions: ['schedule', 'my_clients'],
        active: true 
    }
};

// Controle de tentativas de login
let loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
export let currentUser = null;

// Função de login híbrida (Supabase + Local)
export async function login(username, password) {
    try {
        const now = Date.now();
        const userKey = username.toLowerCase().trim();
        
        // Verificar bloqueio por tentativas excessivas
        if (loginAttempts[userKey]) {
            const attempts = loginAttempts[userKey];
            if (attempts.count >= 5 && (now - attempts.lastAttempt) < 15 * 60 * 1000) {
                showNotification('Usuário bloqueado por 15 minutos devido a tentativas excessivas', 'error');
                return false;
            }
            
            // Reset se passou o tempo de bloqueio
            if ((now - attempts.lastAttempt) >= 15 * 60 * 1000) {
                delete loginAttempts[userKey];
                localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
            }
        }
        
        // PRIMEIRA TENTATIVA: Supabase (se configurado)
        if (isConfigured()) {
            try {
                const { data, error } = await auth.signIn(userKey, password);
                
                if (error) {
                    console.log('❌ Erro Supabase:', error.message);
                    throw error;
                }
                
                if (data.user) {
                    // Login Supabase bem-sucedido
                    currentUser = {
                        uid: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.name || data.user.email,
                        role: data.user.user_metadata?.role || 'intern',
                        permissions: data.user.user_metadata?.permissions || ['schedule'],
                        loginTime: now,
                        lastActivity: now,
                        provider: 'supabase'
                    };
                    
                    // Limpar tentativas de login
                    if (loginAttempts[userKey]) {
                        delete loginAttempts[userKey];
                        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
                    }
                    
                    // Salvar sessão
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    // Log de segurança
                    await logger.security('login_success', {
                        email: userKey,
                        provider: 'supabase',
                        timestamp: now
                    });
                    
                    showNotification(`Bem-vindo(a), ${currentUser.name}!`, 'success');
                    return true;
                }
            } catch (supabaseError) {
                console.log('🔄 Supabase falhou, tentando login local...');
                // Continua para tentativa local
            }
        }
        
        // SEGUNDA TENTATIVA: Usuários locais (fallback)
        const user = LOCAL_USERS[userKey];
        if (user && user.password === password && user.active) {
            // Login local bem-sucedido
            if (loginAttempts[userKey]) {
                delete loginAttempts[userKey];
                localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
            }
            
            // Salvar sessão
            const sessionData = {
                username: userKey,
                name: user.name,
                role: user.role,
                permissions: user.permissions,
                loginTime: now,
                lastActivity: now,
                provider: 'local'
            };
            
            currentUser = sessionData;
            localStorage.setItem('currentUser', JSON.stringify(sessionData));
            localStorage.setItem('isLoggedIn', 'true');
            
            // Log de segurança
            logSecurityEvent('login_success', {
                username: userKey,
                role: user.role,
                provider: 'local',
                timestamp: now
            });
            
            showNotification(`Bem-vindo(a), ${user.name}!`, 'success');
            return true;
        }
        
        // AMBOS FALHARAM - registrar tentativa
        if (!loginAttempts[userKey]) {
            loginAttempts[userKey] = { count: 0, lastAttempt: 0 };
        }
        
        loginAttempts[userKey].count++;
        loginAttempts[userKey].lastAttempt = now;
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
        
        // Log de tentativa falhada
        logSecurityEvent('login_failed', {
            username: userKey,
            attempts: loginAttempts[userKey].count,
            timestamp: now
        });
        
        const remainingAttempts = 5 - loginAttempts[userKey].count;
        if (remainingAttempts > 0) {
            showNotification(`Login inválido. Restam ${remainingAttempts} tentativas`, 'error');
        } else {
            showNotification('Usuário bloqueado por 15 minutos', 'error');
        }
        
        return false;
        
    } catch (error) {
        console.error('Erro no login:', error);
        showNotification('Erro interno no sistema de login', 'error');
        return false;
    }
}

// Verificar se usuário está logado
export function checkLogin() {
    try {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userDataStr = localStorage.getItem('currentUser');
        
        if (!isLoggedIn || !userDataStr) {
            return false;
        }
        
        const userData = JSON.parse(userDataStr);
        const now = Date.now();
        
        // Verificar timeout de sessão (24 horas)
        if (now - userData.lastActivity > 24 * 60 * 60 * 1000) {
            logout();
            showNotification('Sessão expirada por inatividade', 'warning');
            return false;
        }
        
        // Atualizar última atividade
        userData.lastActivity = now;
        currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        return true;
        
    } catch (error) {
        console.error('Erro ao verificar login:', error);
        logout();
        return false;
    }
}

// Obter usuário atual
export function getCurrentUser() {
    try {
        if (currentUser) return currentUser;
        
        const userDataStr = localStorage.getItem('currentUser');
        if (!userDataStr) return null;
        
        currentUser = JSON.parse(userDataStr);
        return currentUser;
    } catch (error) {
        console.error('Erro ao obter usuário atual:', error);
        return null;
    }
}

// Logout híbrido
export async function logout() {
    try {
        const user = getCurrentUser();
        
        // Logout do Supabase se estava usando
        if (user?.provider === 'supabase' && isConfigured()) {
            try {
                await auth.signOut();
            } catch (error) {
                console.warn('Erro no logout Supabase:', error);
            }
        }
        
        // Log de logout
        if (user) {
            if (user.provider === 'supabase' && isConfigured()) {
                await logger.security('logout', {
                    email: user.email,
                    provider: 'supabase',
                    sessionDuration: Date.now() - user.loginTime,
                    timestamp: Date.now()
                });
            } else {
                logSecurityEvent('logout', {
                    username: user.username || user.email,
                    role: user.role,
                    provider: 'local',
                    sessionDuration: Date.now() - user.loginTime,
                    timestamp: Date.now()
                });
            }
        }
        
        // Limpar dados de sessão
        currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        
        showNotification('Logout realizado com sucesso', 'info');
        
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

// Verificar permissão
export function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    
    // Coordenador tem todas as permissões
    if (user.role === 'coordinator') return true;
    
    return user.permissions && user.permissions.includes(permission);
}

// Verificar se pode acessar recurso
export function canAccessResource(resource, action = 'read') {
    const user = getCurrentUser();
    if (!user) return false;
    
    // Coordenador pode tudo
    if (user.role === 'coordinator') return true;
    
    // Funcionário pode ver clientes e relatórios
    if (user.role === 'staff') {
        return ['clients', 'schedule', 'reports'].includes(resource);
    }
    
    // Estagiário só pode ver agenda e seus pacientes
    if (user.role === 'intern') {
        return ['schedule', 'my_clients'].includes(resource);
    }
    
    return false;
}

// Reset de senha (Supabase + fallback)
export async function resetPassword(email) {
    try {
        if (isConfigured()) {
            const { error } = await auth.resetPassword(email);
            if (error) throw error;
            
            showNotification('Email de reset enviado! Verifique sua caixa de entrada.', 'success');
            return true;
        } else {
            showNotification('Reset de senha disponível apenas com Supabase configurado', 'warning');
            return false;
        }
    } catch (error) {
        console.error('Erro no reset de senha:', error);
        showNotification('Erro ao enviar email de reset: ' + error.message, 'error');
        return false;
    }
}

// Criar usuário (apenas Supabase)
export async function createUser(email, password, userData) {
    try {
        if (!isConfigured()) {
            throw new Error('Supabase não configurado');
        }
        
        const { data, error } = await auth.signUp(email, password, {
            name: userData.name,
            role: userData.role,
            permissions: userData.permissions
        });
        
        if (error) throw error;
        
        showNotification('Usuário criado com sucesso!', 'success');
        return data.user;
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        showNotification('Erro ao criar usuário: ' + error.message, 'error');
        return null;
    }
}

// Função auxiliar para logs de segurança (local)
function logSecurityEvent(event, data) {
    try {
        const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        logs.push({
            id: Date.now() + Math.random(),
            event,
            data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        
        // Manter apenas os últimos 1000 logs
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        
        localStorage.setItem('security_logs', JSON.stringify(logs));
    } catch (error) {
        console.error('Erro ao salvar log de segurança:', error);
    }
}

// Função auxiliar para notificações
function showNotification(message, type = 'info') {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Exportar lista de usuários para compatibilidade
export const getUsers = () => LOCAL_USERS;

// Configurar listener de mudanças de auth (Supabase)
if (isConfigured()) {
    auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            currentUser = null;
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
        }
    });
}

// Inicialização
console.log('🔐 Sistema de autenticação híbrido inicializado');
console.log('🟢 Supabase:', isConfigured() ? 'Configurado' : 'Aguardando configuração');
console.log('📋 Usuários locais disponíveis:', Object.keys(LOCAL_USERS));

