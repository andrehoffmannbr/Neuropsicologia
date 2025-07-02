// Formulários do Sistema - APENAS SUPABASE
// Versão sem localStorage - usa apenas banco de dados

import { database } from './supabase-database.js';
import { db } from './database-supabase.js';
import { renderClientList } from './clients.js';
import { switchTab } from './ui.js';
import { showNotification } from './ui.js';

export function setupFormHandlers() {
    setupAgeSelection();
    setupCepHandlers();
    setupClientForms();
    setupEditClientModal();
}

function setupAgeSelection() {
    const ageRadios = document.querySelectorAll('input[name="age-type"]');
    const adultForm = document.getElementById('form-novo-cliente-adulto');
    const minorForm = document.getElementById('form-novo-cliente-menor');
    
    ageRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'adult') {
                adultForm.style.display = 'block';
                minorForm.style.display = 'none';
            } else {
                adultForm.style.display = 'none';
                minorForm.style.display = 'block';
            }
        });
    });
}

function setupCepHandlers() {
    document.getElementById('cep-cliente-adulto').addEventListener('blur', handleCepInputAdult);
    document.getElementById('cep-cliente-menor').addEventListener('blur', handleCepInputMinor);
}

async function handleCepInputAdult(e) {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (response.ok) {
                const data = await response.json();
                if (!data.erro) {
                    document.getElementById('logradouro-cliente-adulto').value = data.logradouro;
                    document.getElementById('bairro-cliente-adulto').value = data.bairro;
                    document.getElementById('cidade-cliente-adulto').value = data.localidade;
                    document.getElementById('estado-cliente-adulto').value = data.uf;
                }
            }
        } catch (error) {
            console.log('Erro ao buscar CEP:', error);
        }
    }
}

async function handleCepInputMinor(e) {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (response.ok) {
                const data = await response.json();
                if (!data.erro) {
                    document.getElementById('logradouro-cliente-menor').value = data.logradouro;
                    document.getElementById('bairro-cliente-menor').value = data.bairro;
                    document.getElementById('cidade-cliente-menor').value = data.localidade;
                    document.getElementById('estado-cliente-menor').value = data.uf;
                }
            }
        } catch (error) {
            console.log('Erro ao buscar CEP:', error);
        }
    }
}

function setupClientForms() {
    document.getElementById('form-novo-cliente-adulto').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const newClient = {
                type: 'adult',
                name: document.getElementById('nome-cliente-adulto').value,
                birthDate: document.getElementById('data-nascimento-adulto').value,
                gender: document.getElementById('genero-adulto').value,
                cpf: document.getElementById('cpf-cliente-adulto').value,
                rg: document.getElementById('rg-adulto').value,
                email: document.getElementById('email-cliente-adulto').value,
                phone: document.getElementById('telefone-cliente-adulto').value,
                emergencyContact: document.getElementById('contato-emergencia-adulto').value,
                address: document.getElementById('logradouro-cliente-adulto').value,
                number: document.getElementById('numero-cliente-adulto').value,
                complement: document.getElementById('complemento-cliente-adulto').value,
                neighborhood: document.getElementById('bairro-cliente-adulto').value,
                city: document.getElementById('cidade-cliente-adulto').value,
                state: document.getElementById('estado-cliente-adulto').value,
                observations: document.getElementById('observacoes-cliente-adulto').value
            };
            
            // Salvar no Supabase
            const result = await database.saveClient(newClient);
            
            e.target.reset();
            renderClientList();
            switchTab('historico');
            
            // Mostrar notificação de sucesso
            showNotification('✅ Cliente salvo com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            showNotification('❌ Erro ao salvar cliente: ' + error.message, 'error');
        }
    });

    document.getElementById('form-novo-cliente-menor').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const newClient = {
                type: 'minor',
                name: document.getElementById('nome-cliente-menor').value,
                birthDate: document.getElementById('data-nascimento-menor').value,
                gender: document.getElementById('genero-menor').value,
                escola: document.getElementById('escola-menor').value,
                tipoEscola: document.getElementById('tipo-escola-menor').value,
                anoEscolar: document.getElementById('ano-escolar-menor').value,
                responsibleName: document.getElementById('nome-pai').value,
                responsiblePhone: document.getElementById('telefone-pai').value,
                address: document.getElementById('logradouro-cliente-menor').value,
                number: document.getElementById('numero-cliente-menor').value,
                complement: document.getElementById('complemento-cliente-menor').value,
                neighborhood: document.getElementById('bairro-cliente-menor').value,
                city: document.getElementById('cidade-cliente-menor').value,
                state: document.getElementById('estado-cliente-menor').value,
                observations: document.getElementById('observacoes-cliente-menor').value
            };
            
            // Salvar no Supabase
            const result = await database.saveClient(newClient);
            
            e.target.reset();
            renderClientList();
            switchTab('historico');
            
            // Mostrar notificação de sucesso
            showNotification('✅ Cliente salvo com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            showNotification('❌ Erro ao salvar cliente: ' + error.message, 'error');
        }
    });
}

function setupEditClientModal() {
    document.getElementById('btn-edit-client').addEventListener('click', showEditClientModal);
    document.getElementById('form-editar-cliente').addEventListener('submit', (e) => {
        e.preventDefault();
        saveClientChanges();
    });
}

function showEditClientModal() {
    const client = db.clients.find(c => c.id === window.currentClientId);
    if (!client) return;

    const container = document.getElementById('edit-form-container');
    container.innerHTML = '';

    if (client.type === 'adult') {
        container.innerHTML = `
            <div class="edit-form-section">
                <h4>Dados Pessoais</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-nome">Nome Completo</label>
                        <input type="text" id="edit-nome" value="${client.name || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-email">Email</label>
                        <input type="email" id="edit-email" value="${client.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-telefone">Telefone</label>
                        <input type="tel" id="edit-telefone" value="${client.phone || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-cpf">CPF</label>
                        <input type="text" id="edit-cpf" value="${client.cpf || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-rg">RG</label>
                        <input type="text" id="edit-rg" value="${client.rg || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-contato-emergencia">Contato de Emergência</label>
                        <input type="text" id="edit-contato-emergencia" value="${client.emergency_contact || ''}">
                    </div>
                </div>
            </div>
            <div class="edit-form-section">
                <h4>Endereço</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-address">Endereço</label>
                        <input type="text" id="edit-address" value="${client.address || ''}">
                    </div>
                </div>
            </div>
            <div class="edit-form-section">
                <h4>Observações</h4>
                <div class="form-group">
                    <label for="edit-observacoes">Observações Gerais</label>
                    <textarea id="edit-observacoes" rows="4">${client.observations || ''}</textarea>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="edit-form-section">
                <h4>Dados do Menor</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-nome">Nome Completo</label>
                        <input type="text" id="edit-nome" value="${client.name || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-responsible">Responsável</label>
                        <input type="text" id="edit-responsible" value="${client.responsible_name || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-responsible-phone">Telefone do Responsável</label>
                        <input type="text" id="edit-responsible-phone" value="${client.responsible_phone || ''}">
                    </div>
                </div>
            </div>
            <div class="edit-form-section">
                <h4>Observações</h4>
                <div class="form-group">
                    <label for="edit-observacoes">Observações Gerais</label>
                    <textarea id="edit-observacoes" rows="4">${client.observations || ''}</textarea>
                </div>
            </div>
        `;
    }

    document.getElementById('modal-editar-cliente').style.display = 'flex';
}

async function saveClientChanges() {
    try {
        const clientId = window.currentClientId;
        const updates = {
            name: document.getElementById('edit-nome').value,
            email: document.getElementById('edit-email')?.value,
            phone: document.getElementById('edit-telefone')?.value,
            cpf: document.getElementById('edit-cpf')?.value,
            rg: document.getElementById('edit-rg')?.value,
            emergencyContact: document.getElementById('edit-contato-emergencia')?.value,
            address: document.getElementById('edit-address')?.value,
            responsibleName: document.getElementById('edit-responsible')?.value,
            responsiblePhone: document.getElementById('edit-responsible-phone')?.value,
            observations: document.getElementById('edit-observacoes').value
        };

        // Atualizar no Supabase
        await database.updateClient(clientId, updates);
        
        // Atualizar dados locais para exibição
        const clientIndex = db.clients.findIndex(c => c.id === clientId);
        if (clientIndex !== -1) {
            db.clients[clientIndex] = { ...db.clients[clientIndex], ...updates };
        }

        document.getElementById('modal-editar-cliente').style.display = 'none';
        renderClientList();
        showClientDetails(clientId);
        
        showNotification('✅ Cliente atualizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        showNotification('❌ Erro ao atualizar cliente: ' + error.message, 'error');
    }
}