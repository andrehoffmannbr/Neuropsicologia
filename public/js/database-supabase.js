// Database module - APENAS SUPABASE
// Versão sem localStorage - 100% online

import { database } from './supabase-database.js';

// Aguardar o Supabase ficar pronto (máximo 5 segundos)
const waitForSupabase = async (maxWaitMs = 5000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
        if (window.SUPABASE_READY && window.supabase) {
            console.log('🗄️ [DB] Supabase carregado com sucesso');
            return true;
        }
        
        // Aguardar 100ms antes de verificar novamente
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🗄️ [DB] Timeout: Supabase não carregou no tempo esperado');
    return false;
};

// Verificar status da conexão
const getConnectionStatus = async () => {
    const ready = await waitForSupabase();
    return {
        isOnline: true,
        mode: 'Supabase',
        ready: ready,
        url: window.ENV?.SUPABASE_URL || 'N/A'
    };
};

// Dados em memória para cache e compatibilidade
export const db = {
    clients: [],
    appointments: [],
    schedules: [],
    dailyNotes: [],
    generalDocuments: [],
    stockItems: [],
    stockMovements: [],
    users: [],
    // Contadores não são mais necessários com UUID do Supabase
    nextClientId: 1, // Mantido para compatibilidade
    nextAppointmentId: 1,
    nextScheduleId: 1,
    nextNoteId: 1,
    nextChangeId: 1,
    nextDocumentId: 1,
    nextStockItemId: 1,
    nextMovementId: 1,
    nextUserId: 22,
    nextDailyNoteId: 1,
    nextGeneralDocumentId: 1
};

// ============= FUNÇÕES DE CARREGAMENTO =============

// Carregar clientes do Supabase
export async function loadClients() {
    try {
        const result = await database.getClients();
        db.clients = result.data;
        console.log(`📊 ${db.clients.length} clientes carregados do Supabase`);
        return result;
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        throw error;
    }
}

// Carregar agendamentos do Supabase
export async function loadSchedules() {
    try {
        const result = await database.getSchedules();
        db.schedules = result.data;
        console.log(`📊 ${db.schedules.length} agendamentos carregados do Supabase`);
        return result;
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        throw error;
    }
}

// Carregar itens de estoque do Supabase
export async function loadStockItems() {
    try {
        const result = await database.getStockItems();
        db.stockItems = result.data;
        console.log(`📊 ${db.stockItems.length} itens de estoque carregados do Supabase`);
        return result;
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
        throw error;
    }
}

// Carregar notas financeiras do Supabase
export async function loadDailyNotes() {
    try {
        const result = await database.getDailyNotes();
        db.dailyNotes = result.data;
        console.log(`📊 ${db.dailyNotes.length} notas financeiras carregadas do Supabase`);
        return result;
    } catch (error) {
        console.error('Erro ao carregar notas financeiras:', error);
        throw error;
    }
}

// Carregar usuários do Supabase
export async function loadUsers() {
    try {
        const result = await database.getUsers();
        db.users = result.data;
        console.log(`📊 ${db.users.length} usuários carregados do Supabase`);
        return result;
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        throw error;
    }
}

// ============= FUNÇÕES DE SALVAMENTO =============

// Salvar cliente no Supabase
export async function saveClient(clientData) {
    try {
        const result = await database.saveClient(clientData);
        
        // Atualizar cache local
        db.clients.push(result.data);
        
        console.log('✅ Cliente salvo no Supabase');
        return result;
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        throw error;
    }
}

// Salvar agendamento no Supabase
export async function saveSchedule(scheduleData) {
    try {
        const result = await database.saveSchedule(scheduleData);
        
        // Atualizar cache local
        db.schedules.push(result.data);
        
        console.log('✅ Agendamento salvo no Supabase');
        return result;
    } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        throw error;
    }
}

// Salvar item de estoque no Supabase
export async function saveStockItem(stockData) {
    try {
        const result = await database.saveStockItem(stockData);
        
        // Atualizar cache local
        db.stockItems.push(result.data);
        
        console.log('✅ Item de estoque salvo no Supabase');
        return result;
    } catch (error) {
        console.error('Erro ao salvar item de estoque:', error);
        throw error;
    }
}

// Salvar nota financeira no Supabase
export async function saveDailyNote(noteData) {
    try {
        const result = await database.saveDailyNote(noteData);
        
        // Atualizar cache local
        db.dailyNotes.push(result.data);
        
        console.log('✅ Nota financeira salva no Supabase');
        return result;
    } catch (error) {
        console.error('Erro ao salvar nota financeira:', error);
        throw error;
    }
}

// ============= FUNÇÕES DE INICIALIZAÇÃO =============

// Inicializar sistema de banco de dados
export async function initializeDatabase() {
    try {
        console.log('🚀 Inicializando sistema de banco de dados...');
        console.log('🔍 Verificando se Supabase está disponível...');
        
        // Verificar conexão (aguarda Supabase estar pronto)
        const status = await getConnectionStatus();
        console.log('📊 Status da conexão:', status);
        
        if (!status.ready) {
            console.error('❌ Supabase não está pronto:', {
                supabaseReady: window.SUPABASE_READY,
                supabaseObject: !!window.supabase,
                environment: window.ENV
            });
            throw new Error('Supabase não está disponível. Sistema requer conexão online.');
        }
        
        console.log('✅ Supabase está pronto! Carregando dados...');
        
        // Carregar todos os dados iniciais
        await Promise.all([
            loadUsers(),
            loadClients(),
            loadSchedules(),
            loadStockItems(),
            loadDailyNotes()
        ]);
        
        console.log('✅ Sistema de banco de dados inicializado com sucesso');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error);
        console.error('🔍 Debug info:', {
            supabaseReady: window.SUPABASE_READY,
            supabaseObject: !!window.supabase,
            env: window.ENV,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

// ============= COMPATIBILIDADE =============

// Função saveDb para compatibilidade (agora não faz nada)
export function saveDb() {
    // Não faz nada - dados são salvos automaticamente no Supabase
    console.log('💾 saveDb() chamado - dados já estão no Supabase');
}

// Função loadDb para compatibilidade (carrega do Supabase)
export async function loadDb() {
    try {
        await initializeDatabase();
    } catch (error) {
        console.error('Erro ao carregar banco de dados:', error);
        throw error;
    }
}

// Funções híbridas antigas (mantidas para compatibilidade)
export async function saveClientHybrid(clientData) {
    return await saveClient(clientData);
}

export async function loadClientsHybrid() {
    return await loadClients();
}

export async function saveScheduleHybrid(scheduleData) {
    return await saveSchedule(scheduleData);
}

export async function loadSchedulesHybrid() {
    return await loadSchedules();
}

// Status do banco de dados
export async function getDBStatus() {
    const status = await getConnectionStatus();
    return {
        ...status,
        totalClients: db.clients.length,
        totalSchedules: db.schedules.length,
        totalStockItems: db.stockItems.length,
        totalDailyNotes: db.dailyNotes.length,
        totalUsers: db.users.length
    };
} 