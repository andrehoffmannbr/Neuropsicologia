// Sistema de Banco de Dados - APENAS SUPABASE
// Versão sem fallback para localStorage - 100% online

// Log para debug
const log = (message, data = null) => {
    console.log(`🗄️ [DB] ${message}`, data ? data : '');
};

// Verificar se Supabase está disponível
const isSupabaseReady = () => {
    const ready = window.SUPABASE_READY && window.supabase;
    log(`Supabase disponível: ${ready}`);
    return ready;
};

// Aguardar o Supabase ficar pronto (máximo 5 segundos)
const waitForSupabase = async (maxWaitMs = 5000) => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
        if (isSupabaseReady()) {
            log('Supabase carregado com sucesso');
            return true;
        }
        
        // Aguardar 100ms antes de verificar novamente
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    log('Timeout: Supabase não carregou no tempo esperado');
    return false;
};

// Obter ID do usuário atual
const getCurrentUserId = () => {
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        return currentUser.id || null;
    } catch {
        return null;
    }
};

// Sistema de dados usando APENAS Supabase
export class SupabaseDatabase {
    constructor() {
        if (!isSupabaseReady()) {
            throw new Error('Supabase não está disponível. Sistema requer conexão online.');
        }
        
        this.supabase = window.supabase;
        log('Sistema Supabase inicializado - modo 100% online');
    }
    
    // Método estático para inicialização assíncrona
    static async create() {
        log('Aguardando Supabase ficar disponível...');
        
        const ready = await waitForSupabase();
        if (!ready) {
            throw new Error('Supabase não está disponível. Sistema requer conexão online.');
        }
        
        return new SupabaseDatabase();
    }

    // ============= CLIENTES =============
    
    async saveClient(clientData) {
        try {
            const { data, error } = await this.supabase
                .from('clients')
                .insert([{
                    name: clientData.name,
                    birth_date: clientData.birthDate,
                    gender: clientData.gender,
                    cpf: clientData.cpf,
                    rg: clientData.rg,
                    address: clientData.address,
                    phone: clientData.phone,
                    email: clientData.email,
                    emergency_contact: clientData.emergencyContact,
                    medical_history: clientData.medicalHistory,
                    current_medications: clientData.currentMedications,
                    observations: clientData.observations,
                    responsible_name: clientData.responsibleName,
                    responsible_cpf: clientData.responsibleCpf,
                    responsible_phone: clientData.responsiblePhone,
                    relationship: clientData.relationship,
                    user_id: getCurrentUserId(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            log('Cliente salvo no Supabase', data);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao salvar cliente', error.message);
            throw new Error(`Erro ao salvar cliente: ${error.message}`);
        }
    }

    async getClients() {
        try {
            const { data, error } = await this.supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            log(`${data.length} clientes carregados do Supabase`);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao carregar clientes', error.message);
            throw new Error(`Erro ao carregar clientes: ${error.message}`);
        }
    }

    async updateClient(clientId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('clients')
                .update({
                    name: updates.name,
                    birth_date: updates.birthDate,
                    gender: updates.gender,
                    cpf: updates.cpf,
                    rg: updates.rg,
                    address: updates.address,
                    phone: updates.phone,
                    email: updates.email,
                    emergency_contact: updates.emergencyContact,
                    medical_history: updates.medicalHistory,
                    current_medications: updates.currentMedications,
                    observations: updates.observations,
                    responsible_name: updates.responsibleName,
                    responsible_cpf: updates.responsibleCpf,
                    responsible_phone: updates.responsiblePhone,
                    relationship: updates.relationship,
                    updated_at: new Date().toISOString()
                })
                .eq('id', clientId)
                .select()
                .single();
            
            if (error) throw error;
            
            log('Cliente atualizado no Supabase', data);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao atualizar cliente', error.message);
            throw new Error(`Erro ao atualizar cliente: ${error.message}`);
        }
    }

    async deleteClient(clientId) {
        try {
            const { error } = await this.supabase
                .from('clients')
                .delete()
                .eq('id', clientId);
            
            if (error) throw error;
            
            log('Cliente deletado do Supabase', clientId);
            return { success: true };
            
        } catch (error) {
            log('Erro ao deletar cliente', error.message);
            throw new Error(`Erro ao deletar cliente: ${error.message}`);
        }
    }

    // ============= AGENDAMENTOS =============
    
    async saveSchedule(scheduleData) {
        try {
            const { data, error } = await this.supabase
                .from('schedules')
                .insert([{
                    client_id: scheduleData.clientId,
                    date: scheduleData.date,
                    time: scheduleData.time,
                    service_type: scheduleData.serviceType,
                    status: scheduleData.status || 'agendado',
                    assigned_to_user_id: scheduleData.assignedToUserId,
                    assigned_to_user_name: scheduleData.assignedToUserName,
                    observations: scheduleData.observations,
                    user_id: getCurrentUserId(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            log('Agendamento salvo no Supabase', data);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao salvar agendamento', error.message);
            throw new Error(`Erro ao salvar agendamento: ${error.message}`);
        }
    }

    async getSchedules() {
        try {
            const { data, error } = await this.supabase
                .from('schedules')
                .select(`
                    *,
                    clients (
                        id,
                        name,
                        phone,
                        email
                    )
                `)
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            log(`${data.length} agendamentos carregados do Supabase`);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao carregar agendamentos', error.message);
            throw new Error(`Erro ao carregar agendamentos: ${error.message}`);
        }
    }

    async updateSchedule(scheduleId, updates) {
        try {
            const { data, error } = await this.supabase
                .from('schedules')
                .update({
                    client_id: updates.clientId,
                    date: updates.date,
                    time: updates.time,
                    service_type: updates.serviceType,
                    status: updates.status,
                    assigned_to_user_id: updates.assignedToUserId,
                    assigned_to_user_name: updates.assignedToUserName,
                    observations: updates.observations,
                    updated_at: new Date().toISOString()
                })
                .eq('id', scheduleId)
                .select()
                .single();
            
            if (error) throw error;
            
            log('Agendamento atualizado no Supabase', data);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao atualizar agendamento', error.message);
            throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
        }
    }

    // ============= ESTOQUE =============
    
    async saveStockItem(stockData) {
        try {
            const { data, error } = await this.supabase
                .from('stock_items')
                .insert([{
                    name: stockData.name,
                    description: stockData.description,
                    category: stockData.category,
                    quantity: stockData.quantity || 0,
                    unit: stockData.unit || 'unidade',
                    min_quantity: stockData.minQuantity || 5,
                    location: stockData.location,
                    status: stockData.status || 'ativo',
                    user_id: getCurrentUserId(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            log('Item de estoque salvo no Supabase', data);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao salvar item de estoque', error.message);
            throw new Error(`Erro ao salvar item de estoque: ${error.message}`);
        }
    }

    async getStockItems() {
        try {
            const { data, error } = await this.supabase
                .from('stock_items')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            log(`${data.length} itens de estoque carregados do Supabase`);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao carregar itens de estoque', error.message);
            throw new Error(`Erro ao carregar itens de estoque: ${error.message}`);
        }
    }

    // ============= NOTAS FINANCEIRAS =============
    
    async saveDailyNote(noteData) {
        try {
            const { data, error } = await this.supabase
                .from('daily_notes')
                .insert([{
                    title: noteData.title,
                    type: noteData.type,
                    value: noteData.value,
                    content: noteData.content,
                    date: noteData.date,
                    file_url: noteData.fileUrl,
                    user_id: getCurrentUserId(),
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            log('Nota financeira salva no Supabase', data);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao salvar nota financeira', error.message);
            throw new Error(`Erro ao salvar nota financeira: ${error.message}`);
        }
    }

    async getDailyNotes() {
        try {
            const { data, error } = await this.supabase
                .from('daily_notes')
                .select('*')
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            log(`${data.length} notas financeiras carregadas do Supabase`);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao carregar notas financeiras', error.message);
            throw new Error(`Erro ao carregar notas financeiras: ${error.message}`);
        }
    }

    // ============= USUÁRIOS =============
    
    async getUsers() {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            log(`${data.length} usuários carregados do Supabase`);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao carregar usuários', error.message);
            throw new Error(`Erro ao carregar usuários: ${error.message}`);
        }
    }

    async authenticateUser(username, password) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password_hash', password)
                .eq('active', true)
                .single();
            
            if (error || !data) {
                throw new Error('Credenciais inválidas');
            }
            
            log('Usuário autenticado via Supabase', data.username);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro na autenticação', error.message);
            throw new Error(`Erro na autenticação: ${error.message}`);
        }
    }

    // ============= LOGS DE SEGURANÇA =============
    
    async saveSecurityLog(logData) {
        try {
            const { data, error } = await this.supabase
                .from('security_logs')
                .insert([{
                    event_type: logData.eventType,
                    details: logData.details,
                    user_id: getCurrentUserId(),
                    ip_address: logData.ipAddress,
                    user_agent: logData.userAgent,
                    timestamp: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            log('Log de segurança salvo no Supabase', data);
            return { success: true, data: data };
            
        } catch (error) {
            log('Erro ao salvar log de segurança', error.message);
            // Não falhar por erro de log
            return { success: false, error: error.message };
        }
    }
}

// Instância global do banco de dados (lazy loading)
let databaseInstance = null;
let databasePromise = null;

// Obter instância do banco de dados (criar apenas quando necessário)
export const getDatabase = async () => {
    if (!databaseInstance && !databasePromise) {
        log('Criando instância do banco de dados...');
        databasePromise = SupabaseDatabase.create();
        
        try {
            databaseInstance = await databasePromise;
            databasePromise = null;
        } catch (error) {
            databasePromise = null;
            throw error;
        }
    } else if (databasePromise) {
        // Se já está sendo criado, aguardar
        databaseInstance = await databasePromise;
    }
    
    return databaseInstance;
};

// Para compatibilidade, criar objeto database com métodos assíncronos
export const database = {
    // Métodos proxy para compatibilidade (todos assíncronos)
    async saveClient(clientData) {
        const instance = await getDatabase();
        return await instance.saveClient(clientData);
    },
    
    async getClients() {
        const instance = await getDatabase();
        return await instance.getClients();
    },
    
    async updateClient(clientId, updates) {
        const instance = await getDatabase();
        return await instance.updateClient(clientId, updates);
    },
    
    async deleteClient(clientId) {
        const instance = await getDatabase();
        return await instance.deleteClient(clientId);
    },
    
    async saveSchedule(scheduleData) {
        const instance = await getDatabase();
        return await instance.saveSchedule(scheduleData);
    },
    
    async getSchedules() {
        const instance = await getDatabase();
        return await instance.getSchedules();
    },
    
    async updateSchedule(scheduleId, updates) {
        const instance = await getDatabase();
        return await instance.updateSchedule(scheduleId, updates);
    },
    
    async saveStockItem(stockData) {
        const instance = await getDatabase();
        return await instance.saveStockItem(stockData);
    },
    
    async getStockItems() {
        const instance = await getDatabase();
        return await instance.getStockItems();
    },
    
    async saveDailyNote(noteData) {
        const instance = await getDatabase();
        return await instance.saveDailyNote(noteData);
    },
    
    async getDailyNotes() {
        const instance = await getDatabase();
        return await instance.getDailyNotes();
    },
    
    async getUsers() {
        const instance = await getDatabase();
        return await instance.getUsers();
    },
    
    async authenticateUser(username, password) {
        const instance = await getDatabase();
        return await instance.authenticateUser(username, password);
    },
    
    async saveSecurityLog(logData) {
        const instance = await getDatabase();
        return await instance.saveSecurityLog(logData);
    }
};

// Status da conexão (aguardar Supabase se necessário)
export const getConnectionStatus = async () => {
    const ready = await waitForSupabase();
    return {
        isOnline: true,
        mode: 'Supabase',
        ready: ready,
        url: window.ENV?.SUPABASE_URL || 'N/A'
    };
};

// Compatibilidade com código antigo
export const hybridDB = database; 