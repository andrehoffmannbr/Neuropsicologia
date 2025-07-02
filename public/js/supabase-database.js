// Sistema Híbrido de Banco de Dados - Supabase + LocalStorage
// Detecta automaticamente se Supabase está disponível na Vercel

// Verificar se estamos na Vercel com Supabase configurado
const isSupabaseAvailable = () => {
    return window.SUPABASE_READY && window.supabase && 
           window.ENV?.SUPABASE_URL && window.ENV.SUPABASE_URL !== 'https://your-project.supabase.co';
};

// Log para debug
const log = (message, data = null) => {
    console.log(`🗄️ [DB] ${message}`, data ? data : '');
};

// Sistema de dados híbrido
export class HybridDatabase {
    constructor() {
        this.isOnline = isSupabaseAvailable();
        this.tablePrefixes = {
            clients: 'clients',
            schedules: 'schedules', 
            appointments: 'appointments',
            users: 'users',
            stockItems: 'stock_items',
            stockMovements: 'stock_movements',
            dailyNotes: 'daily_notes',
            generalDocuments: 'general_documents'
        };
        
        log(this.isOnline ? 'Modo Supabase ativo' : 'Modo localStorage ativo');
    }

    // ============= CLIENTES =============
    
    async saveClient(clientData) {
        try {
            if (this.isOnline) {
                const { data, error } = await window.supabase
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
                        created_at: new Date().toISOString(),
                        user_id: this.getCurrentUserId()
                    }])
                    .select();
                
                if (error) throw error;
                log('Cliente salvo no Supabase', data[0]);
                return { success: true, data: data[0] };
            }
        } catch (error) {
            log('Erro Supabase, usando localStorage', error.message);
        }
        
        // Fallback localStorage
        return this.saveClientLocal(clientData);
    }

    async getClients() {
        try {
            if (this.isOnline) {
                const { data, error } = await window.supabase
                    .from('clients')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                log(`${data.length} clientes carregados do Supabase`);
                return { success: true, data: data };
            }
        } catch (error) {
            log('Erro Supabase, usando localStorage', error.message);
        }
        
        // Fallback localStorage
        return this.getClientsLocal();
    }

    async updateClient(clientId, updates) {
        try {
            if (this.isOnline) {
                const { data, error } = await window.supabase
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
                    .select();
                
                if (error) throw error;
                log('Cliente atualizado no Supabase', data[0]);
                return { success: true, data: data[0] };
            }
        } catch (error) {
            log('Erro Supabase, usando localStorage', error.message);
        }
        
        // Fallback localStorage
        return this.updateClientLocal(clientId, updates);
    }

    // ============= AGENDAMENTOS =============
    
    async saveSchedule(scheduleData) {
        try {
            if (this.isOnline) {
                const { data, error } = await window.supabase
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
                        created_at: new Date().toISOString(),
                        user_id: this.getCurrentUserId()
                    }])
                    .select();
                
                if (error) throw error;
                log('Agendamento salvo no Supabase', data[0]);
                return { success: true, data: data[0] };
            }
        } catch (error) {
            log('Erro Supabase, usando localStorage', error.message);
        }
        
        // Fallback localStorage
        return this.saveScheduleLocal(scheduleData);
    }

    async getSchedules() {
        try {
            if (this.isOnline) {
                const { data, error } = await window.supabase
                    .from('schedules')
                    .select('*')
                    .order('date', { ascending: false });
                
                if (error) throw error;
                log(`${data.length} agendamentos carregados do Supabase`);
                return { success: true, data: data };
            }
        } catch (error) {
            log('Erro Supabase, usando localStorage', error.message);
        }
        
        // Fallback localStorage
        return this.getSchedulesLocal();
    }

    async updateSchedule(scheduleId, updates) {
        try {
            if (this.isOnline) {
                const { data, error } = await window.supabase
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
                    .select();
                
                if (error) throw error;
                log('Agendamento atualizado no Supabase', data[0]);
                return { success: true, data: data[0] };
            }
        } catch (error) {
            log('Erro Supabase, usando localStorage', error.message);
        }
        
        // Fallback localStorage
        return this.updateScheduleLocal(scheduleId, updates);
    }

    // ============= MÉTODOS LOCALSTORAGE (FALLBACK) =============
    
    saveClientLocal(clientData) {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const newClient = {
            id: Date.now(),
            ...clientData,
            createdAt: new Date().toISOString()
        };
        clients.push(newClient);
        localStorage.setItem('clients', JSON.stringify(clients));
        log('Cliente salvo no localStorage', newClient);
        return { success: true, data: newClient };
    }

    getClientsLocal() {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        log(`${clients.length} clientes carregados do localStorage`);
        return { success: true, data: clients };
    }

    updateClientLocal(clientId, updates) {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const index = clients.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clients[index] = { ...clients[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('clients', JSON.stringify(clients));
            log('Cliente atualizado no localStorage', clients[index]);
            return { success: true, data: clients[index] };
        }
        return { success: false, error: 'Cliente não encontrado' };
    }

    saveScheduleLocal(scheduleData) {
        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        const newSchedule = {
            id: Date.now(),
            ...scheduleData,
            createdAt: new Date().toISOString()
        };
        schedules.push(newSchedule);
        localStorage.setItem('schedules', JSON.stringify(schedules));
        log('Agendamento salvo no localStorage', newSchedule);
        return { success: true, data: newSchedule };
    }

    getSchedulesLocal() {
        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        log(`${schedules.length} agendamentos carregados do localStorage`);
        return { success: true, data: schedules };
    }

    updateScheduleLocal(scheduleId, updates) {
        const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
        const index = schedules.findIndex(s => s.id === scheduleId);
        if (index !== -1) {
            schedules[index] = { ...schedules[index], ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem('schedules', JSON.stringify(schedules));
            log('Agendamento atualizado no localStorage', schedules[index]);
            return { success: true, data: schedules[index] };
        }
        return { success: false, error: 'Agendamento não encontrado' };
    }

    // ============= UTILITÁRIOS =============
    
    getCurrentUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            return user.uid || user.id || 'anonymous';
        } catch {
            return 'anonymous';
        }
    }

    // Migrar dados localStorage para Supabase (para primeira sincronização)
    async migrateToSupabase() {
        if (!this.isOnline) {
            log('Supabase não disponível para migração');
            return { success: false, error: 'Supabase não disponível' };
        }

        try {
            log('Iniciando migração para Supabase...');
            
            // Migrar clientes
            const localClients = JSON.parse(localStorage.getItem('clients') || '[]');
            if (localClients.length > 0) {
                for (const client of localClients) {
                    await this.saveClient(client);
                }
                log(`${localClients.length} clientes migrados`);
            }

            // Migrar agendamentos
            const localSchedules = JSON.parse(localStorage.getItem('schedules') || '[]');
            if (localSchedules.length > 0) {
                for (const schedule of localSchedules) {
                    await this.saveSchedule(schedule);
                }
                log(`${localSchedules.length} agendamentos migrados`);
            }

            log('Migração concluída com sucesso');
            return { success: true };
            
        } catch (error) {
            log('Erro na migração', error.message);
            return { success: false, error: error.message };
        }
    }
}

// Instância global
export const hybridDB = new HybridDatabase();

// Verificar status da conexão
export const getConnectionStatus = () => {
    return {
        isOnline: hybridDB.isOnline,
        supabaseReady: isSupabaseAvailable(),
        mode: hybridDB.isOnline ? 'Supabase' : 'LocalStorage'
    };
}; 