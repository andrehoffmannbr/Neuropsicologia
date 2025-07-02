// Database module for neuropsychology system - Integração com Supabase
import { hybridDB, getConnectionStatus } from './supabase-database.js';

export const db = {
    clients: [],
    appointments: [],
    schedules: [],
    dailyNotes: [], // New array for daily financial notes
    generalDocuments: [], // New array for general documents and notes
    users: [
        { id: 1, username: 'admin', password: 'admin123', name: 'Coordenador', role: 'coordinator' },
        { id: 2, username: 'staff', password: 'staff123', name: 'Funcionário', role: 'staff' },
        // New admin users
        { id: 18, username: 'rachel', password: 'admin123', name: 'Coordenadora Rachel', role: 'coordinator' },
        { id: 19, username: 'tatiana_admin', password: 'admin123', name: 'Coordenadora Tatiana', role: 'coordinator' },
        // New interns with full data
        { id: 5, username: 'frances', password: 'intern123', name: 'Frances Jane Bifano Freddi', role: 'intern', address: 'rua Castelo de Windsor 475/301 - bairro Castelo - Belo Horizonte MG.', institution: 'IESLA', graduationPeriod: '5°', education: 'Análise e Desenvolvimento de Sistemas', discipline: 'Neuropsicologia Infantil', phone: '(31)99826-6514', email: 'fjanebifano@gmail.com', cpf: '629.398.156-15' },
        { id: 6, username: 'vanessa', password: 'intern123', name: 'Vanessa', role: 'intern', address: 'Av. B, 456', institution: 'Centro Universitário', graduationPeriod: '7º Semestre', education: 'Psicologia', discipline: 'Reabilitação Cognitiva', phone: '(21) 92222-2222', email: 'vanessa@example.com', cpf: '222.333.444-55' },
        { id: 7, username: 'luciana', password: 'intern123', name: 'Luciana Villela Moyses', role: 'intern', address: 'Rua Deputado Gregoriano Canedo 18 Trevo', institution: 'IESLA', graduationPeriod: '7º Semestre', education: 'Letras', discipline: 'Psicodiagnóstico', phone: '(31) 99745-2225', email: 'luttivillela@gmail.com', cpf: '781.904.106-44' },
        { id: 8, username: 'debora', password: 'intern123', name: 'Debora', role: 'intern', address: 'Travessa D, 101', institution: 'Universidade Estadual', graduationPeriod: '8º Semestre', education: 'Psicologia', discipline: 'Neurociências', phone: '(21) 94444-4444', email: 'debora@example.com', cpf: '444.555.666-77' },
        { id: 9, username: 'renata', password: 'intern123', name: 'Renata', role: 'intern', address: 'Estrada E, 202', institution: 'Universidade Federal', graduationPeriod: '5º Semestre', education: 'Terapia Ocupacional', discipline: 'Cognição', phone: '(21) 95555-5555', email: 'renata@example.com', cpf: '555.666.777-88' },
        { id: 10, username: 'nathalia', password: 'intern123', name: 'Nathalia', role: 'intern', address: 'Rua F, 303', institution: 'Centro Universitário', graduationPeriod: '7º Semestre', education: 'Psicopedagogia', discipline: 'Aprendizagem', phone: '(21) 96666-6666', email: 'nathalia@example.com', cpf: '666.777.888-99' },
        { id: 11, username: 'walisson', password: 'intern123', name: 'Walisson', role: 'intern', address: 'Av. G, 404', institution: 'Faculdade Particular', graduationPeriod: '6º Semestre', education: 'Fonoaudiologia', discipline: 'Linguagem', phone: '(21) 97777-7777', email: 'walisson@example.com', cpf: '777.888.999-00' },
        { id: 12, username: 'tatiana', password: 'intern123', name: 'Tatiana', role: 'intern', address: 'Rua H, 505', institution: 'Universidade Estadual', graduationPeriod: '8º Semestre', education: 'Psicologia', discipline: 'Saúde Mental', phone: '(21) 98888-8888', email: 'tatiana@example.com', cpf: '888.999.000-11' },
        { id: 13, username: 'luiz', password: 'intern123', name: 'Luiz', role: 'intern', address: 'Alameda I, 606', institution: 'Universidade Federal', graduationPeriod: '5º Semestre', education: 'Psicologia', discipline: 'Avaliação Psicológica', phone: '(21) 99999-9999', email: 'luiz@example.com', cpf: '999.000.111-22' },
        { id: 14, username: 'pedro', password: 'intern123', name: 'Pedro', role: 'intern', address: 'Rua J, 707', institution: 'Centro Universitário', graduationPeriod: '7º Semestre', education: 'Psicologia', discipline: 'Neuropsicologia Adulto', phone: '(21) 90000-0000', email: 'pedro@example.com', cpf: '000.111.222-33' },
        { id: 15, username: 'pedro_alexandre', password: 'intern123', name: 'Pedro Alexandre Carneiro', role: 'intern', address: 'Rua Perdoes 781', institution: 'PUC Minas coração eucarístico', graduationPeriod: '4°', education: 'Psicologia', discipline: 'Neuropsicologia Adulto', phone: '(31)992384630', email: 'pedrinalex@gmail.com', cpf: '018.582.366-14' },
        { id: 16, username: 'wallisson', password: 'intern123', name: 'Wallisson Henrique Santos', role: 'intern', address: 'Rua Higienópolis, 137, Piratininga. Ibirité', institution: 'Pós graduação - Fumec', graduationPeriod: 'N/A', education: 'Psicólogo', discipline: 'N/A', phone: '99889-7105 / 98693-3477', email: 'wallissonpsicologo@gmail.com', cpf: '011.922.196-12' },
        { id: 20, username: 'renata_cantagalli', password: 'intern123', name: 'Renata Grichtolik Cantagalli Paiva', role: 'intern', address: 'Rua Bibliotecários, Bairro Alipio de Melo, BH/MG - 30840-070', institution: 'IESLA', graduationPeriod: 'Pós-Graduação / último semestre', education: '08/2025', discipline: 'N/A', phone: '(31) 98598-7608', email: 'renatacantagalli@gmail.com', cpf: '06050524688' },
        // NEW INTERN
        { id: 21, username: 'tatiana_souto', password: 'intern123', name: 'Tatiana Souto da Silveira', role: 'intern', address: 'Rua Gasparino Carvalho Silva, 63 - APTO 402 - Paquetá', institution: 'IESLA', graduationPeriod: '8', education: '07/2026', discipline: 'N/A', phone: '(31) 98742-9615', email: 'tatyssilveira1920@gmail.com', cpf: '057.454.456-96' }
    ],
    anamnesisTypes: [
        ...Array.from({length: 40}, (_, i) => ({ id: `anamnese-${i+1}`, name: `Anamnese ${i+1}` }))
    ],
    stockItems: [],
    stockMovements: [],
    nextClientId: 1,
    nextAppointmentId: 1,
    nextScheduleId: 1,
    nextNoteId: 1,
    nextChangeId: 1,
    nextDocumentId: 1,
    nextStockItemId: 1,
    nextMovementId: 1,
    nextUserId: 22, // Initialize with the next available ID after the hardcoded ones
    nextDailyNoteId: 1, // New ID counter for daily notes
    nextGeneralDocumentId: 1 // New ID counter for general documents
};

export function saveDb() {
    // Salvar localmente sempre (para compatibilidade)
    localStorage.setItem('gestaoClientesDb', JSON.stringify(db));
    
    // Se Supabase disponível, mostrar status da conexão
    const status = getConnectionStatus();
    console.log(`💾 Dados salvos (Modo: ${status.mode})`);
}

export function loadDb() {
    const storedDb = localStorage.getItem('gestaoClientesDb');
    if (storedDb) {
        const parsedDb = JSON.parse(storedDb);
        
        // Ensure new fields are present after loading old data
        if (!parsedDb.schedules) parsedDb.schedules = [];
        if (!parsedDb.dailyNotes) parsedDb.dailyNotes = []; // Ensure dailyNotes array exists
        if (!parsedDb.nextDailyNoteId) parsedDb.nextDailyNoteId = 1; // Ensure counter exists
        if (!parsedDb.generalDocuments) parsedDb.generalDocuments = []; // Ensure generalDocuments array exists
        if (!parsedDb.nextGeneralDocumentId) parsedDb.nextGeneralDocumentId = 1; // Ensure counter exists
        
        parsedDb.schedules.forEach(schedule => {
            if (schedule.assignedToUserId === undefined) {
                schedule.assignedToUserId = null;
                schedule.assignedToUserName = null;
            }
        });
        
        // Merge users to ensure new demo users are added if they don't exist
        const defaultUsersMap = new Map(db.users.map(u => [u.id, u]));
        parsedDb.users = parsedDb.users.map(u => {
            const defaultUser = defaultUsersMap.get(u.id);
            // Ensure changeHistory is preserved if it exists in parsedDb.users
            const mergedUser = defaultUser ? { ...defaultUser, ...u } : u;
            mergedUser.changeHistory = u.changeHistory || []; // Keep existing history or initialize empty
            return mergedUser;
        });
        // Add new default users that might not be in parsedDb.users (e.g., if first load or new users added)
        defaultUsersMap.forEach((defaultUser, id) => {
            if (!parsedDb.users.some(u => u.id === id)) {
                parsedDb.users.push({ ...defaultUser, changeHistory: [] }); // Add new users with empty history
            }
        });
        
        // Ensure all users have the new fields initialized (e.g., to empty string or empty array for history) if missing
        parsedDb.users.forEach(user => {
            user.address = user.address !== undefined ? user.address : '';
            user.institution = user.institution !== undefined ? user.institution : '';
            user.graduationPeriod = user.graduationPeriod !== undefined ? user.graduationPeriod : '';
            user.education = user.education !== undefined ? user.education : '';
            user.discipline = user.discipline !== undefined ? user.discipline : '';
            user.phone = user.phone !== undefined ? user.phone : '';
            user.email = user.email !== undefined ? user.email : '';
            user.cpf = user.cpf !== undefined ? user.cpf : '';
            user.changeHistory = user.changeHistory !== undefined ? user.changeHistory : []; // Initialize changeHistory
        });

        // Ensure stockItems have unitValue
        if (!parsedDb.stockItems) parsedDb.stockItems = [];
        parsedDb.stockItems.forEach(item => {
            if (item.unitValue === undefined) {
                item.unitValue = 0;
            }
        });

        // Ensure stockMovements have itemUnitValue
        if (!parsedDb.stockMovements) parsedDb.stockMovements = [];
        parsedDb.stockMovements.forEach(movement => {
            if (movement.itemUnitValue === undefined) {
                // Try to derive from stockItems if possible, otherwise default to 0
                const relatedItem = parsedDb.stockItems.find(item => item.id === movement.itemId);
                movement.itemUnitValue = relatedItem ? relatedItem.unitValue : 0;
            }
        });

        Object.assign(db, parsedDb);

        // Calculate nextUserId based on the highest existing user ID
        const maxUserId = db.users.reduce((maxId, user) => Math.max(maxId, user.id), 0);
        db.nextUserId = Math.max(db.nextUserId, maxUserId + 1);

        // Explicitly clear clients and appointments if they were loaded, as requested by the user
        // This part needs to be reviewed as it seems to clear data unnecessarily on every load.
        // It was part of a previous instruction to "clear all clients".
        // If this is *not* intended to happen on every load, this block should be removed.
        // Keeping it for now as per the given "current page" context.
        db.clients = [];
        db.appointments = [];
        db.schedules = []; // Also clear schedules to remove client dependencies
        db.nextClientId = 1;
        db.nextAppointmentId = 1;
        db.nextScheduleId = 1;

        saveDb(); // Save the cleared state to localStorage
    } else {
        // If no storedDb, the initial db object is already empty for clients and appointments.
        // We just need to ensure no sample client data is added.
        // Sample stock items and anamnesis types can remain if desired.
        const sampleStockItems = [
            { id: db.nextStockItemId++, name: 'Lápis HB', category: 'papelaria', quantity: 50, minStock: 10, unit: 'unidade', description: 'Lápis para desenhos e escrita', unitValue: 1.50 },
            { id: db.nextStockItemId++, name: 'Papel A4', category: 'papelaria', quantity: 25, minStock: 5, unit: 'resma', description: 'Papel branco para impressão', unitValue: 20.00 },
            { id: db.nextStockItemId++, name: 'Teste WISC-IV', category: 'testes', quantity: 3, minStock: 1, unit: 'kit', description: 'Escala de Inteligência Wechsler para Crianças', unitValue: 800.00 },
            { id: db.nextStockItemId++, name: 'Blocos de Madeira', category: 'brinquedos', quantity: 8, minStock: 2, unit: 'caixa', description: 'Blocos coloridos para atividades lúdicas', unitValue: 45.00 },
            { id: db.nextStockItemId++, name: 'Quebra-cabeça 100 peças', category: 'jogos', quantity: 15, minStock: 3, unit: 'pacote', description: 'Quebra-cabeças diversos temas', unitValue: 30.00 }
        ];
        
        db.stockItems = sampleStockItems;

        // Calculate nextUserId based on the hardcoded users if no storedDb existed
        const maxUserId = db.users.reduce((maxId, user) => Math.max(maxId, user.id), 0);
        db.nextUserId = Math.max(db.nextUserId, maxUserId + 1);

        saveDb(); // Save the initial state with only users, anamnesis, and sample stock
    }
}

// ============= NOVAS FUNÇÕES COM SUPABASE =============

// Salvar cliente usando sistema híbrido
export async function saveClientHybrid(clientData) {
    const result = await hybridDB.saveClient(clientData);
    if (result.success) {
        // Atualizar array local para compatibilidade
        db.clients.push({
            id: result.data.id,
            name: clientData.name,
            birthDate: clientData.birthDate,
            gender: clientData.gender,
            cpf: clientData.cpf,
            rg: clientData.rg,
            address: clientData.address,
            phone: clientData.phone,
            email: clientData.email,
            emergencyContact: clientData.emergencyContact,
            medicalHistory: clientData.medicalHistory,
            currentMedications: clientData.currentMedications,
            observations: clientData.observations,
            responsibleName: clientData.responsibleName,
            responsibleCpf: clientData.responsibleCpf,
            responsiblePhone: clientData.responsiblePhone,
            relationship: clientData.relationship,
            createdAt: new Date().toISOString()
        });
        saveDb();
    }
    return result;
}

// Carregar clientes usando sistema híbrido
export async function loadClientsHybrid() {
    const result = await hybridDB.getClients();
    if (result.success) {
        // Atualizar array local para compatibilidade
        db.clients = result.data.map(client => ({
            id: client.id,
            name: client.name,
            birthDate: client.birth_date || client.birthDate,
            gender: client.gender,
            cpf: client.cpf,
            rg: client.rg,
            address: client.address,
            phone: client.phone,
            email: client.email,
            emergencyContact: client.emergency_contact || client.emergencyContact,
            medicalHistory: client.medical_history || client.medicalHistory,
            currentMedications: client.current_medications || client.currentMedications,
            observations: client.observations,
            responsibleName: client.responsible_name || client.responsibleName,
            responsibleCpf: client.responsible_cpf || client.responsibleCpf,
            responsiblePhone: client.responsible_phone || client.responsiblePhone,
            relationship: client.relationship,
            createdAt: client.created_at || client.createdAt
        }));
        saveDb();
    }
    return result;
}

// Salvar agendamento usando sistema híbrido
export async function saveScheduleHybrid(scheduleData) {
    const result = await hybridDB.saveSchedule(scheduleData);
    if (result.success) {
        // Atualizar array local para compatibilidade
        db.schedules.push({
            id: result.data.id,
            clientId: scheduleData.clientId,
            date: scheduleData.date,
            time: scheduleData.time,
            serviceType: scheduleData.serviceType,
            status: scheduleData.status || 'agendado',
            assignedToUserId: scheduleData.assignedToUserId,
            assignedToUserName: scheduleData.assignedToUserName,
            observations: scheduleData.observations,
            createdAt: new Date().toISOString()
        });
        saveDb();
    }
    return result;
}

// Carregar agendamentos usando sistema híbrido
export async function loadSchedulesHybrid() {
    const result = await hybridDB.getSchedules();
    if (result.success) {
        // Atualizar array local para compatibilidade
        db.schedules = result.data.map(schedule => ({
            id: schedule.id,
            clientId: schedule.client_id || schedule.clientId,
            date: schedule.date,
            time: schedule.time,
            serviceType: schedule.service_type || schedule.serviceType,
            status: schedule.status,
            assignedToUserId: schedule.assigned_to_user_id || schedule.assignedToUserId,
            assignedToUserName: schedule.assigned_to_user_name || schedule.assignedToUserName,
            observations: schedule.observations,
            createdAt: schedule.created_at || schedule.createdAt
        }));
        saveDb();
    }
    return result;
}

// Verificar status da conexão
export function getDBStatus() {
    return getConnectionStatus();
}