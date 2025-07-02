// Client management module
import { db, saveDb } from './database.js';
import { getCurrentUser } from './auth.js';
import { showNotification } from './ui.js';

// Helper function to calculate age from birth date
function calculateAge(birthDateString) {
    if (!birthDateString) return 'N/A';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return `${age} anos`;
}

// Helper function to get initials from a name
function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ').filter(part => part.length > 0);
    if (parts.length === 0) return '??';
    
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Helper function to get a random status for display purposes
function getRandomStatus() {
    const statuses = ['estavel', 'observacao', 'critico'];
    return statuses[Math.floor(Math.random() * statuses.length)];
}

export function renderClientList(filter = '') {
    const clientListContainer = document.getElementById('client-list-container');
    clientListContainer.innerHTML = '';
    const lowerCaseFilter = filter.toLowerCase();

    const filteredClients = db.clients.filter(client => 
        client.name.toLowerCase().includes(lowerCaseFilter) ||
        (client.cpf && client.cpf.includes(filter)) ||
        client.id.toString().includes(filter)
    );

    if (filteredClients.length === 0) {
        clientListContainer.innerHTML = '<p>Nenhum cliente corresponde à busca.</p>';
        if (filter === '' && db.clients.length === 0) {
             clientListContainer.innerHTML = '<p>Nenhum cliente cadastrado ainda.</p>';
        }
        return;
    }

    filteredClients.forEach(client => {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.dataset.clientId = client.id;
        
        const clientAge = calculateAge(client.birthDate);
        const clientInitials = getInitials(client.name);
        const clientCondition = client.observations || (client.type === 'minor' ? `Escola: ${client.escola || 'Não informada'}` : 'Nenhuma condição registrada');
        const displayStatus = getRandomStatus(); // For visual demo

        card.innerHTML = `
            <div class="client-avatar-badge">${clientInitials}</div>
            <h3>${client.name}</h3>
            <p>${clientAge}</p>
            <p>${clientCondition}</p>
            <div class="client-status-badge ${displayStatus}">${displayStatus.toUpperCase()}</div>
        `;
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-delete')) return;
            showClientDetails(client.id);
        });

        clientListContainer.appendChild(card);
    });
}

export function showClientDetails(clientId) {
    const client = db.clients.find(c => c.id === clientId);
    if (!client) return;

    window.currentClientId = clientId;
    
    document.getElementById('modal-nome-cliente').innerHTML = `
        ${client.name} 
        <span style="background: var(--primary-color); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; margin-left: 10px;">ID: ${client.id}</span>
    `;
    
    if (client.type === 'adult') {
        document.getElementById('modal-email-cliente').textContent = client.email || 'N/A';
        document.getElementById('modal-telefone-cliente').textContent = client.phone || 'N/A';
        document.getElementById('modal-cpf-cliente').textContent = client.cpf || 'N/A';
        document.getElementById('modal-responsavel-cliente').textContent = client.contatoEmergencia || 'N/A';
    } else {
        document.getElementById('modal-email-cliente').textContent = 'N/A (Menor de idade)';
        document.getElementById('modal-telefone-cliente').textContent = `Pais: ${client.telefonePai || 'N/A'} / ${client.telefoneMae || 'N/A'}`;
        document.getElementById('modal-cpf-cliente').textContent = 'N/A (Menor de idade)';
        document.getElementById('modal-responsavel-cliente').textContent = `${client.nomePai || ''} / ${client.nomeMae || ''}`;
    }
    
    document.getElementById('modal-data-nascimento').textContent = client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A';
    document.getElementById('modal-cep-cliente').textContent = client.cep || 'N/A';
    document.getElementById('modal-logradouro-cliente').textContent = client.address || 'N/A';
    document.getElementById('modal-numero-cliente').textContent = client.number || 'S/N';
    document.getElementById('modal-bairro-cliente').textContent = client.neighborhood || '';
    document.getElementById('modal-cidade-estado-cliente').textContent = `${client.city || ''} / ${client.state || ''}`;
    document.getElementById('modal-observacoes-cliente').textContent = client.observations || 'Nenhuma observação.';
    
    renderAppointmentHistory(client.appointments);
    renderClientNotes(client.notes || []);
    renderClientDocuments(client.documents || []);

    document.getElementById('modal-detalhes-cliente').style.display = 'flex';
}

function renderAppointmentHistory(appointments) {
    const historicoContainer = document.getElementById('historico-atendimentos');
    historicoContainer.innerHTML = '';

    if (!appointments || appointments.length === 0) {
        historicoContainer.innerHTML = '<p>Nenhum atendimento registrado.</p>';
        return;
    }
    
    const sortedAppointments = [...appointments].sort((a,b) => new Date(b.date) - new Date(a.date));

    sortedAppointments.forEach(app => {
        const anamnesis = db.anamnesisTypes.find(a => a.id === app.anamnesisTypeId);
        const card = document.createElement('div');
        card.className = 'atendimento-card';
        card.innerHTML = `
            <strong>Data:</strong> ${new Date(app.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}<br>
            <strong>Anamnese:</strong> ${anamnesis ? anamnesis.name : 'Não especificada'}<br>
            <strong>Atendido por:</strong> ${app.attendedBy || 'Não informado'}<br>
            <strong>Notas:</strong> ${app.notes || 'Nenhuma'}<br>
            ${app.value ? `<strong>Valor:</strong> R$ ${app.value.toFixed(2).replace('.', ',')}` : ''}
        `;
        historicoContainer.appendChild(card);
    });
}

function renderClientNotes(notes) {
    const notesContainer = document.getElementById('client-notes-list');
    notesContainer.innerHTML = '';

    if (!notes || notes.length === 0) {
        notesContainer.innerHTML = '<p>Nenhuma nota registrada.</p>';
        return;
    }

    const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.innerHTML = `
            <h4>${note.title}</h4>
            <div class="note-meta">
                ${new Date(note.date).toLocaleDateString('pt-BR')} - ${note.author || getCurrentUser().name}
            </div>
            <div class="note-content">${note.content}</div>
        `;
        notesContainer.appendChild(noteCard);
    });
}

function renderClientDocuments(documents) {
    const documentsContainer = document.getElementById('client-documents-list');
    documentsContainer.innerHTML = '';

    if (!documents || documents.length === 0) {
        documentsContainer.innerHTML = '<p>Nenhum documento anexado.</p>';
        return;
    }

    const sortedDocuments = [...documents].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    sortedDocuments.forEach(doc => {
        const documentCard = document.createElement('div');
        documentCard.className = 'document-card';
        
        const typeLabels = {
            'pagamento': 'Pagamento',
            'laudo': 'Laudo Médico',
            'receita': 'Receita',
            'exame': 'Exame',
            'relatorio': 'Relatório',
            'outros': 'Outros'
        };

        documentCard.innerHTML = `
            <div class="document-info">
                <h4>${doc.title}</h4>
                <div class="document-meta">
                    <span class="document-type">${typeLabels[doc.type] || doc.type}</span>
                    ${new Date(doc.uploadDate).toLocaleDateString('pt-BR')} - ${doc.uploadedBy || getCurrentUser().name}
                </div>
                ${doc.description ? `<div class="document-description">${doc.description}</div>` : ''}
            </div>
            <div class="document-actions">
                <a href="${doc.fileData}" download="${doc.fileName}" class="btn-download">
                    <i class="fa-solid fa-download"></i> Baixar
                </a>
                <button class="btn-delete-doc" onclick="deleteClientDocument(${doc.id})">
                    <i class="fa-solid fa-trash"></i> Excluir
                </button>
            </div>
        `;
        documentsContainer.appendChild(documentCard);
    });
}

export function addClientNote() {
    const client = db.clients.find(c => c.id === window.currentClientId);
    if (!client) return;

    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();

    if (!title || !content) {
        showNotification('Por favor, preencha todos os campos da nota.', 'warning');
        return;
    }

    if (!client.notes) {
        client.notes = [];
    }

    client.notes.push({
        id: db.nextNoteId++,
        title: title,
        content: content,
        date: new Date().toISOString(),
        author: getCurrentUser().name
    });

    saveDb();
    document.getElementById('modal-add-note').style.display = 'none';
    showClientDetails(window.currentClientId);
    showNotification('Nota adicionada com sucesso!', 'success');
}

export function addClientDocument() {
    const client = db.clients.find(c => c.id === window.currentClientId);
    if (!client) return;

    const title = document.getElementById('document-title').value.trim();
    const type = document.getElementById('document-type').value;
    const description = document.getElementById('document-description').value.trim();
    const fileInput = document.getElementById('document-file');

    if (!title || !type || !fileInput.files[0]) {
        showNotification('Por favor, preencha todos os campos obrigatórios e selecione um arquivo.', 'warning');
        return;
    }

    const file = fileInput.files[0];
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('O arquivo deve ter no máximo 5MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (!client.documents) {
            client.documents = [];
        }

        client.documents.push({
            id: db.nextDocumentId++,
            title: title,
            type: type,
            description: description,
            fileName: file.name,
            fileData: e.target.result,
            uploadDate: new Date().toISOString(),
            uploadedBy: getCurrentUser().name
        });

        saveDb();
        document.getElementById('modal-add-document').style.display = 'none';
        document.getElementById('form-add-document').reset();
        showClientDetails(window.currentClientId);
        showNotification('Documento anexado com sucesso!', 'success');
    };

    reader.onerror = function() {
        showNotification('Erro ao processar o arquivo. Tente novamente.', 'error');
    };

    reader.readAsDataURL(file);
}

export function deleteClientDocument(documentId) {
    const client = db.clients.find(c => c.id === window.currentClientId);
    if (!client || !client.documents) return;

    client.documents = client.documents.filter(doc => doc.id !== documentId);
    saveDb();
    showClientDetails(window.currentClientId);
    showNotification('Documento excluído com sucesso!', 'success');
}

export function renderMeusPacientes(filter = '') {
    const currentUser = getCurrentUser();
    if (currentUser.role !== 'intern') return; // Ensure only interns can access this function
    
    const meusPacientesList = document.getElementById('meus-pacientes-list');
    if (!meusPacientesList) return;
    
    meusPacientesList.innerHTML = '';
    
    const lowerCaseFilter = filter.toLowerCase();

    // Get unique client IDs from schedules assigned to the current intern
    const assignedClientIds = new Set();
    db.schedules.forEach(schedule => {
        if (schedule.assignedToUserId === currentUser.id) {
            assignedClientIds.add(schedule.clientId);
        }
    });

    // Filter clients based on assignedClientIds and the search filter
    const filteredClients = db.clients.filter(client => {
        const isAssigned = assignedClientIds.has(client.id);
        const matchesFilter = lowerCaseFilter === '' || 
                            client.name.toLowerCase().includes(lowerCaseFilter) ||
                            (client.cpf && client.cpf.includes(filter)) ||
                            client.id.toString().includes(filter);
        return isAssigned && matchesFilter;
    });
    
    if (filteredClients.length === 0) {
        meusPacientesList.innerHTML = '<p>Nenhum paciente vinculado a você foi encontrado.</p>';
        return;
    }
    
    filteredClients.forEach(client => {
        const card = document.createElement('div');
        card.className = 'client-card';
        card.dataset.clientId = client.id;

        const clientAge = calculateAge(client.birthDate);
        const clientInitials = getInitials(client.name);
        const clientCondition = client.observations || (client.type === 'minor' ? `Escola: ${client.escola || 'Não informada'}` : 'Nenhuma condição registrada');
        const displayStatus = getRandomStatus(); // For visual demo

        card.innerHTML = `
            <div class="client-avatar-badge">${clientInitials}</div>
            <h3>${client.name}</h3>
            <p>${clientAge}</p>
            <p>${clientCondition}</p>
            <div class="client-status-badge ${displayStatus}">${displayStatus.toUpperCase()}</div>
        `;
        card.addEventListener('click', () => showClientDetails(client.id));
        meusPacientesList.appendChild(card);
    });
}

export function renderClientReport(selectedPeriod = 'all') {
    const currentUser = getCurrentUser();
    if (currentUser.role !== 'coordinator' && currentUser.role !== 'staff') return;
    
    let startDate = null;
    let endDate = new Date();
    
    // Calculate date range based on selected period
    switch (selectedPeriod) {
        case 'current-month':
            startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
            break;
        case 'last-3-months':
            startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 3, 1);
            break;
        case 'last-6-months':
            startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 6, 1);
            break;
        case 'current-year':
            startDate = new Date(endDate.getFullYear(), 0, 1);
            break;
        case 'all':
        default:
            startDate = null;
            break;
    }
    
    // Calculate statistics
    const totalClients = db.clients.length;
    const adultClients = db.clients.filter(client => client.type === 'adult').length;
    const minorClients = db.clients.filter(client => client.type === 'minor').length;
    
    let clientsWithAppointments = 0;
    let clientsWithoutRecentAppointments = 0;
    
    db.clients.forEach(client => {
        const hasAppointments = client.appointments && client.appointments.length > 0;
        
        if (hasAppointments) {
            if (startDate) {
                const hasRecentAppointments = client.appointments.some(app => {
                    const appointmentDate = new Date(app.date);
                    return appointmentDate >= startDate && appointmentDate <= endDate;
                });
                
                if (hasRecentAppointments) {
                    clientsWithAppointments++;
                } else {
                    clientsWithoutRecentAppointments++;
                }
            } else {
                clientsWithAppointments++;
            }
        } else {
            clientsWithoutRecentAppointments++;
        }
    });
    
    // Calculate clients with future schedules
    const today = new Date().toISOString().split('T')[0];
    const clientsWithSchedulesSet = new Set();
    db.schedules.forEach(schedule => {
        if (schedule.date >= today && schedule.status !== 'cancelado') {
            clientsWithSchedulesSet.add(schedule.clientId);
        }
    });
    const clientsWithSchedules = clientsWithSchedulesSet.size;
    
    // Update summary cards
    document.getElementById('total-clients-count').textContent = totalClients;
    document.getElementById('adult-clients-count').textContent = adultClients;
    document.getElementById('minor-clients-count').textContent = minorClients;
    document.getElementById('clients-with-appointments').textContent = clientsWithAppointments;
    document.getElementById('clients-without-recent-appointments').textContent = clientsWithoutRecentAppointments;
    document.getElementById('clients-with-schedules').textContent = clientsWithSchedules;
    
    // Update period display
    const periodNames = {
        'all': 'Todos os períodos',
        'current-month': 'Mês atual',
        'last-3-months': 'Últimos 3 meses',
        'last-6-months': 'Últimos 6 meses',
        'current-year': 'Ano atual'
    };
    
    const periodDisplayElement = document.getElementById('client-report-period-display');
    if (periodDisplayElement) {
        periodDisplayElement.textContent = periodNames[selectedPeriod] || 'Todos os períodos';
    }
    
    // Render intern statistics
    renderInternStatistics();
    
    // Render client details
    renderClientReportDetails(startDate, endDate);
}

function renderInternStatistics() {
    // Check if intern statistics section already exists, if not create it
    let internStatsSection = document.getElementById('intern-statistics-section');
    if (!internStatsSection) {
        internStatsSection = document.createElement('div');
        internStatsSection.id = 'intern-statistics-section';
        internStatsSection.className = 'intern-statistics-section';
        
        // Insert after client summary grid but before client details
        const clientDetailsSection = document.querySelector('.client-details-section');
        clientDetailsSection.parentNode.insertBefore(internStatsSection, clientDetailsSection);
    }
    
    // Get all interns
    const interns = db.users.filter(user => user.role === 'intern');
    
    if (interns.length === 0) {
        internStatsSection.innerHTML = '';
        return;
    }
    
    // Calculate statistics for each intern
    const internStats = interns.map(intern => {
        // Get unique clients assigned to this intern through schedules
        const assignedClientIds = new Set();
        db.schedules.forEach(schedule => {
            if (schedule.assignedToUserId === intern.id) {
                assignedClientIds.add(schedule.clientId);
            }
        });
        
        const assignedClients = Array.from(assignedClientIds).map(clientId => 
            db.clients.find(client => client.id === clientId)
        ).filter(Boolean);
        
        // Count appointments attended by this intern
        let appointmentsCount = 0;
        db.clients.forEach(client => {
            if (client.appointments) {
                appointmentsCount += client.appointments.filter(app => app.internId === intern.id).length;
            }
        });
        
        // Count active schedules (future dates, not cancelled)
        const today = new Date().toISOString().split('T')[0];
        const activeSchedules = db.schedules.filter(schedule => 
            schedule.assignedToUserId === intern.id &&
            schedule.date >= today &&
            schedule.status !== 'cancelado'
        ).length;
        
        return {
            intern,
            assignedClients,
            clientsCount: assignedClients.length,
            appointmentsCount,
            activeSchedules
        };
    });
    
    internStatsSection.innerHTML = `
        <h3>Estatísticas dos Estagiários</h3>
        <div class="intern-stats-grid">
            ${internStats.map(stat => `
                <div class="intern-stat-card">
                    <div class="intern-header">
                        <h4>${stat.intern.name}</h4>
                        <div class="intern-badges">
                            <span class="badge clients-badge">${stat.clientsCount} pacientes</span>
                            <span class="badge schedules-badge">${stat.activeSchedules} agendados</span>
                        </div>
                    </div>
                    <div class="intern-metrics">
                        <div class="metric">
                            <i class="fa-solid fa-users"></i>
                            <span>Pacientes Atribuídos</span>
                            <strong>${stat.clientsCount}</strong>
                        </div>
                        <div class="metric">
                            <i class="fa-solid fa-calendar-check"></i>
                            <span>Atendimentos Realizados</span>
                            <strong>${stat.appointmentsCount}</strong>
                        </div>
                        <div class="metric">
                            <i class="fa-solid fa-clock"></i>
                            <span>Agendamentos Ativos</span>
                            <strong>${stat.activeSchedules}</strong>
                        </div>
                    </div>
                    ${stat.assignedClients.length > 0 ? `
                        <div class="intern-clients">
                            <h5>Pacientes Atribuídos:</h5>
                            <div class="client-list">
                                ${stat.assignedClients.map(client => `
                                    <div class="client-item" onclick="showClientDetails(${client.id})">
                                        <span class="client-name">${client.name}</span>
                                        <span class="client-id">ID: ${client.id}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="intern-clients">
                            <p class="no-clients">Nenhum paciente atribuído</p>
                        </div>
                    `}
                </div>
            `).join('')}
        </div>
    `;
}

function renderClientReportDetails(startDate, endDate) {
    const clientReportList = document.getElementById('client-report-list');
    clientReportList.innerHTML = '';
    
    if (db.clients.length === 0) {
        clientReportList.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
        return;
    }
    
    db.clients.forEach(client => {
        let totalAppointments = 0;
        let totalValue = 0;
        let periodAppointments = 0;
        let periodValue = 0;
        
        if (client.appointments) {
            client.appointments.forEach(appointment => {
                const appointmentDate = new Date(appointment.date);
                totalAppointments++;
                totalValue += appointment.value || 0;
                
                if (!startDate || (appointmentDate >= startDate && appointmentDate <= endDate)) {
                    periodAppointments++;
                    periodValue += appointment.value || 0;
                }
            });
        }
        
        // Count future schedules for this client
        const today = new Date().toISOString().split('T')[0];
        const futureSchedules = db.schedules.filter(schedule => 
            schedule.clientId === client.id && 
            schedule.date >= today && 
            schedule.status !== 'cancelado'
        ).length;
        
        // Get assigned intern information
        const assignedInterns = new Set();
        db.schedules.forEach(schedule => {
            if (schedule.clientId === client.id && schedule.assignedToUserId) {
                const intern = db.users.find(u => u.id === schedule.assignedToUserId && u.role === 'intern');
                if (intern) {
                    assignedInterns.add(intern.name);
                }
            }
        });
        
        // Get last appointment date
        let lastAppointmentDate = 'Nunca';
        if (client.appointments && client.appointments.length > 0) {
            const sortedAppointments = [...client.appointments].sort((a, b) => new Date(b.date) - new Date(a.date));
            lastAppointmentDate = new Date(sortedAppointments[0].date).toLocaleDateString('pt-BR');
        }
        
        const card = document.createElement('div');
        card.className = 'client-report-card';
        card.innerHTML = `
            <div class="card-header">
                <h4>
                    ${client.name}
                    <span class="client-type-badge ${client.type === 'minor' ? 'minor' : ''}">${client.type === 'adult' ? 'Adulto' : 'Menor'}</span>
                </h4>
                ${assignedInterns.size > 0 ? `
                    <div class="assigned-interns">
                        <i class="fa-solid fa-user-graduate"></i>
                        <span>Estagiários: ${Array.from(assignedInterns).join(', ')}</span>
                    </div>
                ` : ''}
            </div>
            <div class="client-report-metrics">
                <div class="metric-item">
                    <i class="fa-solid fa-calendar-check"></i>
                    <span>Atendimentos (Período)</span>
                    <strong>${periodAppointments}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-calendar-alt"></i>
                    <span>Atendimentos (Total)</span>
                    <strong>${totalAppointments}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-money-bill-wave"></i>
                    <span>Valor (Período)</span>
                    <strong>R$ ${periodValue.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-dollar-sign"></i>
                    <span>Valor (Total)</span>
                    <strong>R$ ${totalValue.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-clock"></i>
                    <span>Último Atendimento</span>
                    <strong>${lastAppointmentDate}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-calendar-plus"></i>
                    <span>Agendamentos Futuros</span>
                    <strong>${futureSchedules}</strong>
                </div>
            </div>
        `;
        
        // Add click handler to show client details
        card.addEventListener('click', () => showClientDetails(client.id));
        card.style.cursor = 'pointer';
        
        clientReportList.appendChild(card);
    });
}