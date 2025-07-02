// Intern management module
import { db, saveDb } from './database.js';
import { showNotification } from './ui.js';
import { getCurrentUser } from './auth.js';

export function renderInternList(filter = '') {
    const internListContainer = document.getElementById('intern-list-container');
    if (!internListContainer) return;

    internListContainer.innerHTML = '';
    const lowerCaseFilter = filter.toLowerCase();

    const filteredInterns = db.users.filter(user => 
        user.role === 'intern' && 
        user.name.toLowerCase().includes(lowerCaseFilter)
    );

    if (filteredInterns.length === 0) {
        internListContainer.innerHTML = '<p>Nenhum estagiário encontrado.</p>';
        if (filter === '' && db.users.filter(u => u.role === 'intern').length === 0) {
            internListContainer.innerHTML = '<p>Nenhum estagiário cadastrado ainda.</p>';
        }
        return;
    }

    filteredInterns.forEach(intern => {
        const card = document.createElement('div');
        card.className = 'client-card'; 
        card.dataset.internId = intern.id;
        
        const clientsAttendedCount = db.clients.filter(client => 
            client.appointments && client.appointments.some(app => app.internId === intern.id)
        ).length;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3>${intern.name}</h3>
            </div>
            <p><strong>Email:</strong> ${intern.email || 'N/A'}</p>
            <p><strong>Celular:</strong> ${intern.phone || 'N/A'}</p>
            <p><strong>Formação:</strong> ${intern.education || 'N/A'}</p>
            <p><strong>Pacientes Atendidos:</strong> ${clientsAttendedCount}</p>
        `;
        card.addEventListener('click', () => showInternDetails(intern.id));
        internListContainer.appendChild(card);
    });
}

export function showInternDetails(internId) {
    const intern = db.users.find(u => u.id === internId && u.role === 'intern');
    if (!intern) {
        showNotification('Estagiário não encontrado.', 'error');
        return;
    }

    window.currentInternId = internId; // Store current intern ID for editing and deletion
    
    document.getElementById('modal-nome-estagiario').textContent = intern.name;
    document.getElementById('intern-modal-nome-completo').textContent = intern.name;
    document.getElementById('intern-modal-cpf').textContent = intern.cpf || 'N/A';
    document.getElementById('intern-modal-celular').textContent = intern.phone || 'N/A';
    document.getElementById('intern-modal-email').textContent = intern.email || 'N/A';
    document.getElementById('intern-modal-endereco').textContent = intern.address || 'N/A';
    document.getElementById('intern-modal-instituicao').textContent = intern.institution || 'N/A';
    document.getElementById('intern-modal-periodo').textContent = intern.graduationPeriod || 'N/A';
    document.getElementById('intern-modal-formacao').textContent = intern.education || 'N/A';
    document.getElementById('intern-modal-disciplina').textContent = intern.discipline || 'N/A';

    const internClients = db.clients.filter(client => 
        client.appointments && client.appointments.some(app => app.internId === intern.id)
    );

    renderInternClientList(internClients);
    renderInternChangeHistory(intern.changeHistory || []);

    document.getElementById('modal-detalhes-estagiario').style.display = 'flex';
}

function renderInternClientList(clients) {
    const internPatientsList = document.getElementById('intern-patients-list');
    internPatientsList.innerHTML = '';

    if (clients.length === 0) {
        internPatientsList.innerHTML = '<p>Este estagiário ainda não atendeu nenhum paciente.</p>';
        return;
    }

    clients.forEach(client => {
        const card = document.createElement('div');
        card.className = 'client-card'; 
        card.dataset.clientId = client.id;
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3>${client.name} <span style="font-size: 0.8em; color: var(--secondary-color);">(${client.type === 'adult' ? 'Adulto' : 'Menor'})</span></h3>
                <span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">ID: ${client.id}</span>
            </div>
            <p>${client.email || client.phone || 'Sem contato'}</p>
            <p>${client.cpf || client.escola || 'Sem documento/escola'}</p>
        `;
        card.addEventListener('click', () => {
            document.getElementById('modal-detalhes-estagiario').style.display = 'none'; 
            window.showClientDetails(client.id); 
        });
        internPatientsList.appendChild(card);
    });
}

function renderInternChangeHistory(history) {
    const historyContainer = document.getElementById('intern-change-history-list');
    historyContainer.innerHTML = '';

    if (!history || history.length === 0) {
        historyContainer.innerHTML = '<p>Nenhuma alteração registrada.</p>';
        return;
    }

    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedHistory.forEach(entry => {
        const changeCard = document.createElement('div');
        changeCard.className = 'change-card';
        
        const changesList = entry.changes.map(change => 
            `<li><strong>${change.field}:</strong> De "${change.oldValue || 'Vazio'}" para "${change.newValue || 'Vazio'}"</li>`
        ).join('');

        changeCard.innerHTML = `
            <div class="change-meta">
                Alterado em ${new Date(entry.date).toLocaleDateString('pt-BR')} por ${entry.changedBy}
            </div>
            <ul class="change-details">${changesList}</ul>
        `;
        historyContainer.appendChild(changeCard);
    });
}

export function showEditInternModal(internId) {
    const intern = db.users.find(u => u.id === internId && u.role === 'intern');
    if (!intern) return;

    // Set current intern ID in a global variable for use in saveInternChanges
    window.currentInternId = internId; 

    document.getElementById('edit-intern-name').value = intern.name || '';
    document.getElementById('edit-intern-cpf').value = intern.cpf || '';
    document.getElementById('edit-intern-phone').value = intern.phone || '';
    document.getElementById('edit-intern-email').value = intern.email || '';
    document.getElementById('edit-intern-address').value = intern.address || '';
    document.getElementById('edit-intern-institution').value = intern.institution || '';
    document.getElementById('edit-intern-graduation-period').value = intern.graduationPeriod || '';
    document.getElementById('edit-intern-education').value = intern.education || '';
    document.getElementById('edit-intern-discipline').value = intern.discipline || '';

    document.getElementById('modal-detalhes-estagiario').style.display = 'none';
    document.getElementById('modal-editar-estagiario').style.display = 'flex';
}

export function saveInternChanges() {
    const intern = db.users.find(u => u.id === window.currentInternId && u.role === 'intern');
    if (!intern) return;

    const changes = [];
    const originalIntern = { ...intern }; // Create a shallow copy for comparison

    const fieldsToUpdate = [
        { id: 'edit-intern-name', prop: 'name', label: 'Nome Completo' },
        { id: 'edit-intern-cpf', prop: 'cpf', label: 'CPF' },
        { id: 'edit-intern-phone', prop: 'phone', label: 'Celular' },
        { id: 'edit-intern-email', prop: 'email', label: 'Email' },
        { id: 'edit-intern-address', prop: 'address', label: 'Endereço' },
        { id: 'edit-intern-institution', prop: 'institution', label: 'Instituição de Ensino' },
        { id: 'edit-intern-graduation-period', prop: 'graduationPeriod', label: 'Período da Graduação' },
        { id: 'edit-intern-education', prop: 'education', label: 'Formação' },
        { id: 'edit-intern-discipline', prop: 'discipline', label: 'Disciplina' }
    ];

    fieldsToUpdate.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            const newValue = element.value.trim();
            const oldValue = originalIntern[field.prop] || ''; // Handle undefined or null gracefully

            if (newValue !== oldValue) {
                changes.push({
                    field: field.label,
                    oldValue: oldValue,
                    newValue: newValue
                });
                intern[field.prop] = newValue; // Update the actual intern object
            }
        }
    });

    if (changes.length > 0) {
        if (!intern.changeHistory) {
            intern.changeHistory = [];
        }
        
        intern.changeHistory.push({
            id: db.nextChangeId++, // Reuse nextChangeId for both clients and users
            date: new Date().toISOString(),
            changedBy: getCurrentUser().name,
            changes: changes
        });
        
        saveDb();
        document.getElementById('modal-editar-estagiario').style.display = 'none';
        showInternDetails(window.currentInternId); // Re-render details to show changes
        showNotification('Dados do estagiário atualizados com sucesso!', 'success');
    } else {
        showNotification('Nenhuma alteração foi feita.', 'info');
        document.getElementById('modal-editar-estagiario').style.display = 'none';
        showInternDetails(window.currentInternId); // Close modal and return to details
    }
}

export function deleteIntern(internId) {
    const internToDelete = db.users.find(u => u.id === internId && u.role === 'intern');
    if (!internToDelete) {
        showNotification('Estagiário não encontrado.', 'error');
        return;
    }

    const internName = internToDelete.name;

    // Remove intern from users
    db.users = db.users.filter(u => u.id !== internId);

    // Update schedules previously assigned to this intern
    db.schedules.forEach(schedule => {
        if (schedule.assignedToUserId === internId) {
            schedule.assignedToUserId = null;
            schedule.assignedToUserName = 'Profissional Removido'; 
        }
    });

    saveDb();
    document.getElementById('modal-detalhes-estagiario').style.display = 'none'; // Close details modal
    renderInternList(); // Re-render the intern list
    showNotification(`Estagiário "${internName}" excluído com sucesso!`, 'success');
}

export function addIntern(internData) {
    // Check if username already exists
    if (db.users.some(u => u.username === internData.username)) {
        showNotification('Nome de usuário já existe. Por favor, escolha outro.', 'error');
        return false;
    }

    const newIntern = {
        id: db.nextUserId++, // Use nextUserId for new users
        role: 'intern', // Always 'intern' for this function
        changeHistory: [], // Initialize change history
        ...internData
    };

    db.users.push(newIntern);
    saveDb();
    showNotification(`Estagiário "${newIntern.name}" cadastrado com sucesso!`, 'success');
    return true;
}