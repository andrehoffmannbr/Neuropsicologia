// Firestore Database Module - Sistema de Banco de Dados
// Usa instâncias globais do Firebase configuradas no HTML
// Inclui fallback para localStorage durante desenvolvimento

import { db } from './firebase-config.js';
import { logDataAccess } from './security-logger.js';
import { getCurrentUser } from './auth.js';

// Funções Firebase usando simulação local
async function doc(db, path, id) {
    return { path: `${path}/${id}` };
}

async function collection(db, path) {
    return { path };
}

async function setDoc(docRef, data) {
    console.log('📝 Documento salvo:', docRef.path, data);
    localStorage.setItem(docRef.path, JSON.stringify(data));
    return true;
}

async function getDoc(docRef) {
    const data = localStorage.getItem(docRef.path);
    return {
        exists: () => !!data,
        data: () => data ? JSON.parse(data) : null
    };
}

async function updateDoc(docRef, data) {
    const existing = localStorage.getItem(docRef.path);
    const updated = { ...(existing ? JSON.parse(existing) : {}), ...data };
    localStorage.setItem(docRef.path, JSON.stringify(updated));
    return true;
}

async function deleteDoc(docRef) {
    localStorage.removeItem(docRef.path);
    return true;
}

async function addDoc(collection, data) {
    const logs = JSON.parse(localStorage.getItem(collection.path) || '[]');
    const entry = { id: Date.now() + Math.random(), ...data, timestamp: new Date().toISOString() };
    logs.push(entry);
    localStorage.setItem(collection.path, JSON.stringify(logs));
    return { id: entry.id };
}

function onSnapshot(docRef, callback) {
    // Simulação de listener em tempo real
    const checkForUpdates = () => {
        const data = localStorage.getItem(docRef.path);
        if (data) {
            callback({
                exists: () => true,
                data: () => JSON.parse(data)
            });
        }
    };
    
    // Verificar mudanças a cada 1 segundo
    const interval = setInterval(checkForUpdates, 1000);
    
    // Retornar função para unsubscribe
    return () => clearInterval(interval);
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

function serverTimestamp() {
    return new Date().toISOString();
}

// Cache local para performance
const cache = {
    clients: new Map(),
    schedules: new Map(),
    users: new Map(),
    stockItems: new Map()
};

// Listeners de sincronização em tempo real
const realtimeListeners = new Map();

// Estado de sincronização
let syncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingOperations: []
};

// Inicializar database
export async function initFirestoreDB() {
    try {
        // Carregar dados críticos
        await loadCriticalCollections();
        
        // Configurar listeners em tempo real
        setupRealtimeListeners();
        
        console.log('Firestore database inicializado');
        
    } catch (error) {
        console.error('Erro ao inicializar Firestore:', error);
    }
}

// Carregar coleções críticas
async function loadCriticalCollections() {
    const collections = ['clients', 'schedules', 'users', 'stockItems'];
    
    for (const collectionName of collections) {
        try {
            const snapshot = await getDocs(collection(db, collectionName));
            const data = new Map();
            
            snapshot.forEach(doc => {
                data.set(doc.id, { id: doc.id, ...doc.data() });
            });
            
            cache[collectionName] = data;
            
        } catch (error) {
            console.error(`Erro ao carregar ${collectionName}:`, error);
        }
    }
}

// Configurar listeners em tempo real
function setupRealtimeListeners() {
    const collections = ['clients', 'schedules', 'stockItems'];
    
    collections.forEach(collectionName => {
        try {
            const unsubscribe = onSnapshot(
                collection(db, collectionName),
                (snapshot) => {
                    handleRealtimeUpdate(collectionName, snapshot);
                }
            );
            
            realtimeListeners.set(collectionName, unsubscribe);
            
        } catch (error) {
            console.error(`Erro listener ${collectionName}:`, error);
        }
    });
}

// Manipular atualizações em tempo real
function handleRealtimeUpdate(collectionName, snapshot) {
    if (!cache[collectionName]) {
        cache[collectionName] = new Map();
    }
    
    snapshot.docChanges().forEach(change => {
        const docData = { id: change.doc.id, ...change.doc.data() };
        
        if (change.type === 'added' || change.type === 'modified') {
            cache[collectionName].set(change.doc.id, docData);
        } else if (change.type === 'removed') {
            cache[collectionName].delete(change.doc.id);
        }
    });
    
    // Notificar componentes sobre mudanças
    window.dispatchEvent(new CustomEvent('firestoreUpdate', {
        detail: { collection: collectionName }
    }));
}

// CLIENTES
export async function addClient(clientData) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const enrichedData = {
            ...clientData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.uid,
            active: true
        };
        
        const docRef = await addDoc(collection(db, 'clients'), enrichedData);
        
        await logDataAccess('client', docRef.id, 'create', {
            userRole: user.role
        });
        
        return { id: docRef.id, ...enrichedData };
        
    } catch (error) {
        console.error('Erro ao adicionar cliente:', error);
        throw error;
    }
}

export async function updateClient(clientId, updates) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const enrichedUpdates = {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid
        };
        
        const clientRef = doc(db, 'clients', clientId);
        await updateDoc(clientRef, enrichedUpdates);
        
        await logDataAccess('client', clientId, 'update', {
            userRole: user.role
        });
        
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        throw error;
    }
}

export function getClients(filters = {}) {
    const clients = Array.from(cache.clients.values());
    
    // Aplicar filtros
    let filtered = clients.filter(client => client.active !== false);
    
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filtered = filtered.filter(client => 
            client.name?.toLowerCase().includes(searchTerm) ||
            client.cpf?.includes(searchTerm)
        );
    }
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClient(clientId) {
    try {
        let client = cache.clients.get(clientId);
        
        if (!client) {
            const docRef = doc(db, 'clients', clientId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                client = { id: docSnap.id, ...docSnap.data() };
                cache.clients.set(clientId, client);
            }
        }
        
        if (client) {
            await logDataAccess('client', clientId, 'read');
        }
        
        return client;
        
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        return null;
    }
}

// AGENDAMENTOS
export async function addSchedule(scheduleData) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const enrichedData = {
            ...scheduleData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.uid,
            status: scheduleData.status || 'agendado'
        };
        
        const docRef = await addDoc(collection(db, 'schedules'), enrichedData);
        
        await logDataAccess('schedule', docRef.id, 'create', {
            clientId: scheduleData.clientId,
            userRole: user.role
        });
        
        return { id: docRef.id, ...enrichedData };
        
    } catch (error) {
        console.error('Erro ao adicionar agendamento:', error);
        throw error;
    }
}

export async function updateSchedule(scheduleId, updates) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const enrichedUpdates = {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid
        };
        
        const scheduleRef = doc(db, 'schedules', scheduleId);
        await updateDoc(scheduleRef, enrichedUpdates);
        
        await logDataAccess('schedule', scheduleId, 'update', {
            userRole: user.role
        });
        
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        throw error;
    }
}

export function getSchedules(filters = {}) {
    const schedules = Array.from(cache.schedules.values());
    
    let filtered = schedules;
    
    // Filtrar por data
    if (filters.date) {
        filtered = filtered.filter(schedule => schedule.date === filters.date);
    }
    
    // Filtrar por usuário (para estagiários)
    const user = getCurrentUser();
    if (user?.role === 'intern' && filters.userOnly !== false) {
        filtered = filtered.filter(schedule => 
            schedule.assignedToUserId === user.uid || schedule.createdBy === user.uid
        );
    }
    
    // Filtrar por status
    if (filters.status) {
        filtered = filtered.filter(schedule => schedule.status === filters.status);
    }
    
    return filtered.sort((a, b) => {
        // Ordenar por data e hora
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
    });
}

// ESTOQUE
export async function addStockItem(itemData) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const enrichedData = {
            ...itemData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.uid
        };
        
        const docRef = await addDoc(collection(db, 'stockItems'), enrichedData);
        
        await logDataAccess('stockItem', docRef.id, 'create', {
            itemName: itemData.name,
            userRole: user.role
        });
        
        return { id: docRef.id, ...enrichedData };
        
    } catch (error) {
        console.error('Erro ao adicionar item de estoque:', error);
        throw error;
    }
}

export async function updateStockQuantity(itemId, newQuantity, reason = 'Ajuste manual') {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');
        
        const item = cache.stockItems.get(itemId);
        if (!item) throw new Error('Item não encontrado');
        
        const oldQuantity = item.quantity || 0;
        const difference = newQuantity - oldQuantity;
        
        // Atualizar item
        await updateDoc(doc(db, 'stockItems', itemId), {
            quantity: newQuantity,
            updatedAt: serverTimestamp(),
            updatedBy: user.uid
        });
        
        // Registrar movimento
        await addDoc(collection(db, 'stockMovements'), {
            itemId: itemId,
            itemName: item.name,
            type: difference > 0 ? 'entrada' : 'saida',
            quantity: Math.abs(difference),
            oldQuantity: oldQuantity,
            newQuantity: newQuantity,
            reason: reason,
            timestamp: serverTimestamp(),
            userId: user.uid,
            userRole: user.role
        });
        
        await logDataAccess('stockItem', itemId, 'update', {
            action: 'quantity_change',
            oldQuantity,
            newQuantity,
            userRole: user.role
        });
        
    } catch (error) {
        console.error('Erro ao atualizar quantidade do estoque:', error);
        throw error;
    }
}

// Export do cache para compatibilidade
export const firestoreCache = cache; 