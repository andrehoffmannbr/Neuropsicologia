// Main application entry point
import { loadDb, saveDb, db } from './database.js';
import { login, logout, checkLogin, getCurrentUser } from './auth.js';
import { showLoginScreen, showMainApp, switchTab, updateCurrentDate } from './ui.js';
import { renderClientList, showClientDetails, addClientNote, addClientDocument, deleteClientDocument, renderMeusPacientes, renderClientReport } from './clients.js';
import { renderSchedule, updateScheduleStatus, initializeCalendar, renderCalendar, saveEditedSchedule, cancelScheduleWithReason, reassignSchedule, populateAssignableUsers, saveReassignedSchedule } from './schedule.js'; // Import saveReassignedSchedule
import { renderFinancialReport, renderDailyNotes, addDailyNote, generateMonthlyReport } from './financial.js';
import { setupFormHandlers } from './forms.js';
import { renderStockList, renderStockMovements, updateStockSummary, showDeleteStockItemConfirmation } from './stock.js';
import { renderInternList, showInternDetails, showEditInternModal, saveInternChanges, deleteIntern, addIntern } from './interns.js'; // Import new functions
import { showNotification } from './ui.js';

// Make necessary functions globally available
window.showClientDetails = showClientDetails;
window.updateScheduleStatus = updateScheduleStatus;
window.deleteClientDocument = deleteClientDocument;
window.cancelScheduleWithReason = cancelScheduleWithReason;
window.editSchedule = editSchedule;
window.reassignSchedule = reassignSchedule; // Made global for onclick
window.getCurrentUser = getCurrentUser;
window.showDeleteStockItemConfirmation = showDeleteStockItemConfirmation;
window.showInternDetails = showInternDetails; // Make intern details global
window.showEditInternModal = showEditInternModal; // Make edit intern modal global
window.deleteIntern = deleteIntern; // Make delete intern global
window.deleteGeneralDocument = deleteGeneralDocument; // Make delete general document global

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    loadDb();
    
    // Check if user is already logged in
    if (checkLogin()) {
        showMainApp();
        initializeApp();
    } else {
        showLoginScreen();
    }
    
    setupEventListeners();
    setupFormHandlers();
});

function initializeApp() {
    updateCurrentDate();
    initializeCalendar();
    renderClientList();
    
    const currentUser = getCurrentUser();
    if (currentUser.role === 'coordinator') {
        renderFinancialReport(); // Call without argument to default to current month
        renderDailyNotes(); // Render daily notes
        renderStockList();
        renderStockMovements();
        updateStockSummary();
        renderInternList(); // Render intern list on app load if coordinator
        renderClientReport(); // Render client report on app load if coordinator
    }
    if (currentUser.role === 'staff') {
        renderClientReport(); // Staff can also see client reports
    }
    if (currentUser.role === 'intern') {
        renderMeusPacientes();
    }
    
    switchTab('cadastro');
}

function setupEventListeners() {
    // Login form
    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (login(username, password)) {
            document.getElementById('form-login').reset();
            showMainApp();
            initializeApp();
        } else {
            showNotification('Usuário ou senha inválidos!', 'error');
        }
    });

    // Logout button
    document.getElementById('btn-logout').addEventListener('click', () => {
        logout();
        showLoginScreen();
    });

    // Tab navigation
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            switchTab(tabId);
            
            // Refresh data when switching tabs
            if (tabId === 'historico') {
                renderClientList();
            } else if (tabId === 'agenda') {
                renderSchedule();
                renderCalendar();
            } else if (tabId === 'relatorio-clientes' && (getCurrentUser().role === 'coordinator' || getCurrentUser().role === 'staff')) {
                renderClientReport(document.getElementById('client-report-period').value); // Pass selected period
            } else if (tabId === 'financeiro' && getCurrentUser().role === 'coordinator') {
                renderFinancialReport(document.getElementById('financial-month-selector').value); // Pass selected month/year
            } else if (tabId === 'estoque' && getCurrentUser().role === 'coordinator') {
                renderStockList();
                renderStockMovements();
                updateStockSummary();
            } else if (tabId === 'meus-pacientes' && getCurrentUser().role === 'intern') {
                renderMeusPacientes();
            } else if (tabId === 'estagiarios' && getCurrentUser().role === 'coordinator') { // New tab for interns
                renderInternList();
            } else if (tabId === 'documentos' && (getCurrentUser().role === 'coordinator' || getCurrentUser().role === 'staff')) { // New tab for documents
                renderGeneralDocuments();
            }
        });
    });

    // Search functionality
    document.getElementById('search-cliente').addEventListener('input', (e) => {
        renderClientList(e.target.value);
    });

    const searchMeusPacientes = document.getElementById('search-meus-pacientes');
    if (searchMeusPacientes) {
        searchMeusPacientes.addEventListener('input', (e) => {
            renderMeusPacientes(e.target.value);
        });
    }

    // New: Search for interns
    const searchIntern = document.getElementById('search-intern');
    if (searchIntern) {
        searchIntern.addEventListener('input', (e) => {
            renderInternList(e.target.value);
        });
    }

    // Date selector
    document.getElementById('date-selector').addEventListener('change', (e) => {
        renderSchedule(e.target.value);
        renderCalendar();
    });

    // NEW: Financial Month Selector
    const financialMonthSelector = document.getElementById('financial-month-selector');
    if (financialMonthSelector) {
        financialMonthSelector.addEventListener('change', (e) => {
            renderFinancialReport(e.target.value);
        });
        // Set initial value for financial month selector to current month
        const today = new Date();
        const currentMonthFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        financialMonthSelector.value = currentMonthFormatted;
    }

    // NEW: Update Financial Report Button
    const btnUpdateFinancial = document.getElementById('btn-update-financial');
    if (btnUpdateFinancial) {
        btnUpdateFinancial.addEventListener('click', () => {
            const selectedMonth = document.getElementById('financial-month-selector').value;
            renderFinancialReport(selectedMonth);
            renderDailyNotes(selectedMonth); // Also update daily notes
            showNotification('Relatório financeiro atualizado!', 'success');
        });
    }

    // NEW: Stock Month Selector
    const stockMonthSelector = document.getElementById('stock-month-selector');
    if (stockMonthSelector) {
        // Set initial value for stock month selector to current month
        const today = new Date();
        const currentMonthFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        stockMonthSelector.value = currentMonthFormatted;
    }

    // NEW: Update Stock Movements Button
    const btnUpdateStockMovements = document.getElementById('btn-update-stock-movements');
    if (btnUpdateStockMovements) {
        btnUpdateStockMovements.addEventListener('click', () => {
            const selectedMonth = document.getElementById('stock-month-selector').value;
            renderStockMovements(selectedMonth);
            showNotification('Movimentações de estoque filtradas por período!', 'success');
        });
    }

    // NEW: Clear Stock Filter Button
    const btnClearStockFilter = document.getElementById('btn-clear-stock-filter');
    if (btnClearStockFilter) {
        btnClearStockFilter.addEventListener('click', () => {
            document.getElementById('stock-month-selector').value = '';
            renderStockMovements(); // Render without filter
            showNotification('Filtro removido - mostrando todas as movimentações!', 'info');
        });
    }

    // New appointment button (from Agenda tab)
    document.getElementById('btn-novo-agendamento').addEventListener('click', () => {
        populateClientSelect();
        populateServiceTypes();
        populateAssignableUsers(); // Populate the new professional select
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('data-agendamento').value = today;
        document.getElementById('modal-novo-agendamento').style.display = 'flex';
        // Ensure client select is not pre-filled if opened from general agenda
        document.getElementById('select-cliente-agenda').value = ''; 
    });

    // NEW: Schedule New Appointment button (from Client Details modal)
    document.getElementById('btn-schedule-new-appointment').addEventListener('click', () => {
        const currentClientId = window.currentClientId; // Get the ID of the client currently being viewed
        document.getElementById('modal-detalhes-cliente').style.display = 'none'; // Close client details modal

        populateClientSelect(); // Populate client dropdown (will contain all clients)
        populateServiceTypes();
        populateAssignableUsers();
        
        // Pre-select the current client
        document.getElementById('select-cliente-agenda').value = currentClientId;
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('data-agendamento').value = today;
        document.getElementById('modal-novo-agendamento').style.display = 'flex';
    });

    // New appointment form
    document.getElementById('form-novo-agendamento').addEventListener('submit', (e) => {
        e.preventDefault();
        saveNewSchedule();
    });

    // New attendance button
    document.getElementById('btn-novo-atendimento').addEventListener('click', () => {
        populateAnamnesisSelect();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('data-atendimento').value = today;
        document.getElementById('modal-novo-atendimento').style.display = 'flex';
    });

    // New attendance form
    document.getElementById('form-novo-atendimento').addEventListener('submit', (e) => {
        e.preventDefault();
        saveNewAttendance();
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').style.display = 'none';
        });
    });

    // Add note functionality
    document.getElementById('btn-add-note').addEventListener('click', () => {
        document.getElementById('form-add-note').reset();
        document.getElementById('modal-detalhes-cliente').style.display = 'none';
        document.getElementById('modal-add-note').style.display = 'flex';
    });

    document.getElementById('form-add-note').addEventListener('submit', (e) => {
        e.preventDefault();
        addClientNote();
    });

    // Add document functionality
    document.getElementById('btn-add-document').addEventListener('click', () => {
        document.getElementById('form-add-document').reset();
        document.getElementById('modal-detalhes-cliente').style.display = 'none';
        document.getElementById('modal-add-document').style.display = 'flex';
    });

    document.getElementById('form-add-document').addEventListener('submit', (e) => {
        e.preventDefault();
        addClientDocument();
    });

    // Edit appointment form
    document.getElementById('form-editar-agendamento').addEventListener('submit', (e) => {
        e.preventDefault();
        // These calls are not necessary here, they are inside schedule.js/editSchedule
        // populateEditClientSelect();
        // populateEditServiceTypes();
        saveEditedSchedule();
    });

    // Cancel appointment form
    document.getElementById('form-cancelar-agendamento').addEventListener('submit', (e) => {
        e.preventDefault();
        saveCancellation();
    });

    // Image preview for cancellation
    document.getElementById('imagem-cancelamento').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('img-preview-cancelamento').src = e.target.result;
                document.getElementById('preview-imagem-cancelamento').style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('preview-imagem-cancelamento').style.display = 'none';
        }
    });

    // Confirm attendance form
    document.getElementById('form-confirmar-atendimento').addEventListener('submit', (e) => {
        e.preventDefault();
        saveAttendanceConfirmation();
    });

    // Add stock item button
    document.getElementById('btn-add-stock-item').addEventListener('click', () => {
        document.getElementById('form-add-stock').reset();
        document.getElementById('modal-add-stock').style.display = 'flex';
    });

    // Add stock item form
    document.getElementById('form-add-stock').addEventListener('submit', (e) => {
        e.preventDefault();
        addStockItem();
    });

    // Adjust stock form
    document.getElementById('form-adjust-stock').addEventListener('submit', (e) => {
        e.preventDefault();
        processStockAdjustment();
    });

    // Add material button
    document.getElementById('btn-add-material').addEventListener('click', () => {
        addMaterialSelection();
    });

    // New: Confirmation modal for deleting stock item AND intern
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (window.currentDeleteItemType === 'stock') {
            const itemIdToDelete = window.currentDeleteItem;
            if (itemIdToDelete) {
                const itemIndex = db.stockItems.findIndex(item => item.id === itemIdToDelete);
                if (itemIndex !== -1) {
                    const itemToDelete = db.stockItems[itemIndex];
                     // Add a movement record for deletion
                    db.stockMovements.push({
                        id: db.nextMovementId++,
                        itemId: itemToDelete.id, // Keep ID for historical reference
                        itemName: itemToDelete.name, // Store name in case item is fully removed
                        type: 'exclusao',
                        quantity: itemToDelete.quantity, // Record the quantity at time of deletion
                        reason: 'Item excluído do estoque',
                        date: new Date().toISOString(),
                        user: getCurrentUser().name,
                        itemUnitValue: itemToDelete.unitValue // Record the unit value at time of deletion
                    });
                    // Remove the item from db.stockItems
                    db.stockItems.splice(itemIndex, 1);
                    saveDb();
                    renderStockList();
                    renderStockMovements();
                    updateStockSummary();
                    showNotification(`Item "${itemToDelete.name}" excluído do estoque com sucesso!`, 'success');
                }
            }
        } else if (window.currentDeleteItemType === 'intern') {
            const internIdToDelete = window.currentDeleteItem;
            if (internIdToDelete) {
                deleteIntern(internIdToDelete); // Call the new deleteIntern function
            }
        }
        document.getElementById('modal-confirm-delete').style.display = 'none';
        window.currentDeleteItem = null;
        window.currentDeleteItemType = null; // Clear type too
    });

    document.getElementById('btn-cancel-delete').addEventListener('click', () => {
        document.getElementById('modal-confirm-delete').style.display = 'none';
        window.currentDeleteItem = null;
        window.currentDeleteItemType = null; // Clear type too
    });

    // Reassign schedule form (new)
    document.getElementById('form-reassign-schedule').addEventListener('submit', (e) => {
        e.preventDefault();
        saveReassignedSchedule(); // Correctly call saveReassignedSchedule
    });

    // NEW: Edit Intern Button
    document.getElementById('btn-edit-intern').addEventListener('click', () => {
        // currentInternId is set in showInternDetails
        showEditInternModal(window.currentInternId);
    });

    // NEW: Edit Intern Form Submit
    document.getElementById('form-editar-estagiario').addEventListener('submit', (e) => {
        e.preventDefault();
        saveInternChanges(); // Call the save function from interns.js
    });

    // NEW: Delete Intern Button Handler
    const btnDeleteIntern = document.getElementById('btn-delete-intern');
    if (btnDeleteIntern) {
        btnDeleteIntern.addEventListener('click', () => {
            // Ensure window.currentInternId is an integer before finding the intern
            const internToDelete = db.users.find(u => u.id === parseInt(window.currentInternId) && u.role === 'intern');
            if (!internToDelete) {
                showNotification('Estagiário não encontrado.', 'error');
                return;
            }
            window.currentDeleteItem = internToDelete.id;
            window.currentDeleteItemType = 'intern';

            const modal = document.getElementById('modal-confirm-delete');
            const message = document.getElementById('delete-confirmation-message');
            message.textContent = `Tem certeza que deseja excluir o estagiário "${internToDelete.name}"? Todos os agendamentos atribuídos a ele serão desvinculados. Esta ação é irreversível.`;
            modal.style.display = 'flex';
        });
    }

    // NEW: Add Intern Button Handler
    document.getElementById('btn-add-intern').addEventListener('click', () => {
        document.getElementById('form-add-intern').reset();
        document.getElementById('modal-add-intern').style.display = 'flex';
    });

    // NEW: Add Intern Form Submission
    document.getElementById('form-add-intern').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewIntern();
    });

    // NEW: Client Report Period Selector
    const clientReportPeriodSelector = document.getElementById('client-report-period');
    if (clientReportPeriodSelector) {
        clientReportPeriodSelector.addEventListener('change', (e) => {
            renderClientReport(e.target.value);
        });
    }

    // NEW: Update Client Report Button
    const btnUpdateClientReport = document.getElementById('btn-update-client-report');
    if (btnUpdateClientReport) {
        btnUpdateClientReport.addEventListener('click', () => {
            const selectedPeriod = document.getElementById('client-report-period').value;
            renderClientReport(selectedPeriod);
            showNotification('Relatório de clientes atualizado!', 'success');
        });
    }

    // NEW: Add Daily Note Button
    document.getElementById('btn-add-daily-note').addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('daily-note-date').value = today;
        document.getElementById('form-add-daily-note').reset();
        document.getElementById('daily-note-date').value = today; // Set again after reset
        document.getElementById('modal-add-daily-note').style.display = 'flex';
    });

    // NEW: Add Daily Note Form Submit
    document.getElementById('form-add-daily-note').addEventListener('submit', (e) => {
        e.preventDefault();
        addDailyNote();
    });

    // NEW: Generate Monthly Report Button
    document.getElementById('btn-generate-monthly-report').addEventListener('click', () => {
        const selectedMonth = document.getElementById('financial-month-selector').value || 
                             new Date().toISOString().slice(0, 7); // Default to current month
        document.getElementById('report-month-selector').value = selectedMonth;
        generateMonthlyReport(selectedMonth);
        document.getElementById('modal-monthly-report').style.display = 'flex';
    });

    // NEW: Update Monthly Report Button
    document.getElementById('btn-update-monthly-report').addEventListener('click', () => {
        const selectedMonth = document.getElementById('report-month-selector').value;
        generateMonthlyReport(selectedMonth);
        showNotification('Relatório mensal atualizado!', 'success');
    });

    // NEW: Print Report Button
    document.getElementById('btn-print-report').addEventListener('click', () => {
        window.print();
    });

    // NEW: General Documents functionality
    document.getElementById('btn-add-general-document').addEventListener('click', () => {
        document.getElementById('form-add-general-document').reset();
        document.getElementById('modal-add-general-document').style.display = 'flex';
    });

    document.getElementById('form-add-general-document').addEventListener('submit', (e) => {
        e.preventDefault();
        addGeneralDocument();
    });

    document.getElementById('btn-add-general-note').addEventListener('click', () => {
        document.getElementById('form-add-general-note').reset();
        document.getElementById('modal-add-general-note').style.display = 'flex';
    });

    document.getElementById('form-add-general-note').addEventListener('submit', (e) => {
        e.preventDefault();
        addGeneralNote();
    });

    // Search and filter for general documents
    document.getElementById('search-documents').addEventListener('input', (e) => {
        renderGeneralDocuments(e.target.value, document.getElementById('documents-type-filter').value);
    });

    document.getElementById('documents-type-filter').addEventListener('change', (e) => {
        renderGeneralDocuments(document.getElementById('search-documents').value, e.target.value);
    });
}

function populateClientSelect() {
    const select = document.getElementById('select-cliente-agenda');
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    
    db.clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.name} (ID: ${client.id})`;
        select.appendChild(option);
    });
}

function populateServiceTypes() {
    const select = document.getElementById('tipo-servico');
    select.innerHTML = '';
    
    const serviceTypes = [
        { value: 'avaliacao-neuropsicologica', text: 'Avaliação Neuropsicológica' },
        { value: 'reabilitacao-cognitiva', text: 'Reabilitação Cognitiva' },
        { value: 'terapia-cognitiva', text: 'Terapia Cognitiva' },
        { value: 'orientacao-familiar', text: 'Orientação Familiar' },
        { value: 'psicoterapia', text: 'Psicoterapia' }
    ];
    
    serviceTypes.forEach(service => {
        const option = document.createElement('option');
        option.value = service.value;
        option.textContent = service.text;
        select.appendChild(option);
    });
}

function populateAnamnesisSelect() {
    const select = document.getElementById('select-anamnese');
    select.innerHTML = '';
    
    db.anamnesisTypes.forEach(anamnesis => {
        const option = document.createElement('option');
        option.value = anamnesis.id;
        option.textContent = anamnesis.name;
        select.appendChild(option);
    });
}

// Function to call schedule.js's saveReassignedSchedule
function reassignScheduleSubmit() {
    // This function is no longer needed as the event listener now directly calls saveReassignedSchedule.
    // Keeping it here for reference in case it's called elsewhere, though it shouldn't be.
    saveReassignedSchedule();
}

function saveNewSchedule() {
    const clientId = parseInt(document.getElementById('select-cliente-agenda').value);
    const date = document.getElementById('data-agendamento').value;
    const time = document.getElementById('hora-agendamento').value;
    const serviceType = document.getElementById('tipo-servico').value;
    const selectedProfessionalId = document.getElementById('select-assigned-professional').value;
    const observations = document.getElementById('observacoes-agendamento').value;
    const currentUser = getCurrentUser();

    if (!clientId || !date || !time || !serviceType) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    let assignedToUserId = null;
    let assignedToUserName = null;

    if (selectedProfessionalId) {
        const selectedUser = db.users.find(u => u.id === parseInt(selectedProfessionalId));
        if (selectedUser) {
            assignedToUserId = selectedUser.id;
            assignedToUserName = selectedUser.name;
        }
    } else if (currentUser.role === 'staff' || currentUser.role === 'intern') {
        // If no professional is selected, but the current user is staff/intern, assign to them by default.
        assignedToUserId = currentUser.id;
        assignedToUserName = currentUser.name;
    }

    const newSchedule = {
        id: db.nextScheduleId++,
        clientId: clientId,
        date: date,
        time: time,
        serviceType: serviceType,
        observations: observations,
        status: 'agendado',
        assignedToUserId: assignedToUserId,
        assignedToUserName: assignedToUserName
    };

    db.schedules.push(newSchedule);
    saveDb();
    
    document.getElementById('form-novo-agendamento').reset();
    document.getElementById('modal-novo-agendamento').style.display = 'none';
    renderSchedule(document.getElementById('date-selector').value);
    renderCalendar();
    
    showNotification('Agendamento criado com sucesso!', 'success');
}

function saveNewAttendance() {
    const client = db.clients.find(c => c.id === window.currentClientId);
    if (!client) return;

    const date = document.getElementById('data-atendimento').value;
    const anamnesisTypeId = document.getElementById('select-anamnese').value;
    const notes = document.getElementById('notas-atendimento').value;
    const value = parseFloat(document.getElementById('valor-atendimento').value) || 0;

    if (!date || !anamnesisTypeId) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    if (!client.appointments) {
        client.appointments = [];
    }

    const newAppointment = {
        id: db.nextAppointmentId++,
        date: date,
        anamnesisTypeId: anamnesisTypeId,
        notes: notes,
        value: value,
        attendedBy: getCurrentUser().name, // Attended by the current user making the entry
        internId: getCurrentUser().role === 'intern' ? getCurrentUser().id : null // Only set if current user is an intern
    };

    client.appointments.push(newAppointment);
    saveDb();
    
    document.getElementById('form-novo-atendimento').reset();
    document.getElementById('modal-novo-atendimento').style.display = 'none';
    showClientDetails(window.currentClientId);
    
    showNotification('Atendimento salvo com sucesso!', 'success');
}

function saveCancellation() {
    const schedule = db.schedules.find(s => s.id === window.currentCancellingScheduleId);
    if (!schedule) return;

    const reason = document.getElementById('motivo-cancelamento').value.trim();
    const imageFile = document.getElementById('imagem-cancelamento').files[0];

    if (!reason) {
        showNotification('Por favor, digite o motivo do cancelamento.', 'warning');
        return;
    }

    schedule.status = 'cancelado';
    schedule.cancelReason = reason;
    schedule.cancelDate = new Date().toISOString();
    schedule.canceledBy = getCurrentUser().name;

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            schedule.cancelImage = e.target.result;
            schedule.cancelImageName = imageFile.name;
            
            saveDb();
            document.getElementById('form-cancelar-agendamento').reset();
            document.getElementById('preview-imagem-cancelamento').style.display = 'none';
            document.getElementById('modal-cancelar-agendamento').style.display = 'none';
            renderSchedule(document.getElementById('date-selector').value);
            renderCalendar();
            showNotification('Agendamento cancelado com sucesso!', 'success');
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveDb();
        document.getElementById('form-cancelar-agendamento').reset();
        document.getElementById('modal-cancelar-agendamento').style.display = 'none';
        renderSchedule(document.getElementById('date-selector').value);
        renderCalendar();
        showNotification('Agendamento cancelado com sucesso!', 'success');
    }
}

function saveAttendanceConfirmation() {
    const schedule = db.schedules.find(s => s.id === window.currentConfirmingScheduleId);
    if (!schedule) return;

    const client = db.clients.find(c => c.id === schedule.clientId);
    if (!client) return;

    const professional = document.getElementById('profissional-responsavel').value.trim();
    const observations = document.getElementById('observacoes-confirmacao').value.trim();
    const value = parseFloat(document.getElementById('valor-atendimento-confirmacao').value) || 0;
    const attachments = document.getElementById('anexos-confirmacao').files;

    if (!professional) {
        showNotification('Por favor, informe o profissional responsável.', 'warning');
        return;
    }

    // Process materials used
    const materialsUsed = [];
    const materialSelections = document.querySelectorAll('#materials-selection .material-selection');
    
    let hasInsufficientStock = false; // Flag to prevent saving if stock is an issue
    
    materialSelections.forEach(selection => {
        const itemId = parseInt(selection.querySelector('.material-item').value);
        const quantity = parseInt(selection.querySelector('.material-quantity').value) || 0;
        
        if (itemId && quantity > 0) {
            const stockItem = db.stockItems.find(item => item.id === itemId);
            if (stockItem) {
                // Check if we have enough stock (quantity is already in the correct unit)
                if (stockItem.quantity >= quantity) {
                    materialsUsed.push({
                        itemId: itemId,
                        itemName: stockItem.name,
                        quantityUsed: quantity,
                        unit: stockItem.unit
                    });
                    
                    // Update stock (subtract the quantity directly since it's in the same unit)
                    stockItem.quantity -= quantity;
                    
                    // Add stock movement
                    db.stockMovements.push({
                        id: db.nextMovementId++,
                        itemId: itemId,
                        type: 'saida',
                        quantity: quantity,
                        reason: `Atendimento - ${client.name}`,
                        date: new Date().toISOString(),
                        user: getCurrentUser().name,
                        scheduleId: schedule.id,
                        itemUnitValue: stockItem.unitValue // Record the unit value at time of movement
                    });
                } else {
                    showNotification(`Estoque insuficiente para ${stockItem.name}. Disponível: ${stockItem.quantity} ${stockItem.unit}.`, 'error');
                    hasInsufficientStock = true;
                    return; // Exit current forEach iteration
                }
            }
        }
    });

    if (hasInsufficientStock) {
        // If any stock was insufficient, do not proceed with saving the attendance
        return;
    }

    // Create attendance record
    if (!client.appointments) {
        client.appointments = [];
    }

    const newAppointment = {
        id: db.nextAppointmentId++,
        date: schedule.date,
        time: schedule.time,
        serviceType: schedule.serviceType,
        notes: observations,
        value: value,
        attendedBy: professional,
        materialsUsed: materialsUsed,
        status: 'concluido',
        confirmedAt: new Date().toISOString(),
        internId: getCurrentUser().role === 'intern' ? getCurrentUser().id : null // Store internId if the current user is an intern
    };

    // Process file attachments
    if (attachments.length > 0) {
        newAppointment.attachments = [];
        let filesProcessed = 0;
        
        Array.from(attachments).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                newAppointment.attachments.push({
                    fileName: file.name,
                    fileData: e.target.result,
                    uploadDate: new Date().toISOString()
                });
                
                filesProcessed++;
                if (filesProcessed === attachments.length) {
                    finalizeConfirmation();
                }
            };
            reader.readAsDataURL(file);
        });
    } else {
        finalizeConfirmation();
    }

    function finalizeConfirmation() {
        client.appointments.push(newAppointment);
        schedule.status = 'concluido';
        schedule.confirmedAt = new Date().toISOString();
        schedule.attendanceId = newAppointment.id;

        saveDb();
        
        document.getElementById('form-confirmar-atendimento').reset();
        document.getElementById('modal-confirmar-atendimento').style.display = 'none';
        renderSchedule(document.getElementById('date-selector').value);
        renderCalendar();
        
        if (getCurrentUser().role === 'coordinator') {
            renderStockList();
            renderStockMovements();
            updateStockSummary();
            renderFinancialReport(document.getElementById('financial-month-selector').value); // Refresh financial report
        }
        
        showNotification('Atendimento confirmado com sucesso!', 'success');
    }
}

function addMaterialSelection() {
    const container = document.getElementById('materials-selection');
    const selectionDiv = document.createElement('div');
    selectionDiv.className = 'material-selection';
    
    selectionDiv.innerHTML = `
        <div class="form-row">
            <div class="form-group form-group-large">
                <select class="material-item" required>
                    <option value="">Selecione um material</option>
                    ${db.stockItems.map(item => {
                        const unitConversions = {
                            'unidade': 1,
                            'pacote': 5,
                            'caixa': 10,
                            'resma': 15,
                            'kit': 20,
                            'lote': 25
                        };
                        
                        const unitEquivalent = unitConversions[item.unit] || 1;
                        const totalUnits = item.quantity * unitEquivalent;
                        const unitDisplay = (unitEquivalent > 1 ? 
                            `${item.unit} (${unitEquivalent} unidades/pacote) ` : 
                            `${item.unit} `) + 
                            `(${item.quantity} ${item.unit} disponíveis)`;
                        
                        return `<option value="${item.id}">${item.name} - R$ ${item.unitValue.toFixed(2).replace('.', ',')} / ${unitDisplay}</option>`;
                    }).join('')}
                </select>
            </div>
            <div class="form-group form-group-small">
                <input type="number" class="material-quantity" placeholder="Qtd" min="1" required>
            </div>
            <div class="form-group form-group-small">
                <button type="button" class="btn-delete btn-remove-material">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    selectionDiv.querySelector('.btn-remove-material').addEventListener('click', () => {
        selectionDiv.remove();
    });
    
    container.appendChild(selectionDiv);
}

function addStockItem() {
    const name = document.getElementById('stock-item-name').value.trim();
    const category = document.getElementById('stock-item-category').value;
    const quantity = parseInt(document.getElementById('stock-item-quantity').value);
    const minStock = parseInt(document.getElementById('stock-item-min-stock').value);
    const unit = document.getElementById('stock-item-unit').value;
    const unitValue = parseFloat(document.getElementById('stock-item-unit-value').value);
    const description = document.getElementById('stock-item-description').value.trim();

    if (!name || !category || quantity < 0 || minStock < 0 || !unit || isNaN(unitValue) || unitValue < 0) {
        showNotification('Por favor, preencha todos os campos obrigatórios corretamente.', 'warning');
        return;
    }

    const newItem = {
        id: db.nextStockItemId++,
        name: name,
        category: category,
        quantity: quantity,
        minStock: minStock,
        unit: unit,
        unitValue: unitValue, // Store unit value
        description: description,
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser().name
    };

    db.stockItems.push(newItem);
    
    // Add stock movement
    db.stockMovements.push({
        id: db.nextMovementId++,
        itemId: newItem.id,
        type: 'entrada',
        quantity: quantity,
        reason: 'Adição inicial de estoque',
        date: new Date().toISOString(),
        user: getCurrentUser().name,
        itemUnitValue: newItem.unitValue // Record the unit value at time of movement
    });

    saveDb();
    
    document.getElementById('form-add-stock').reset();
    document.getElementById('modal-add-stock').style.display = 'none';
    
    renderStockList();
    renderStockMovements();
    updateStockSummary();
    renderFinancialReport(document.getElementById('financial-month-selector').value); // Refresh financial report
    
    showNotification('Item adicionado ao estoque com sucesso!', 'success');
}

function processStockAdjustment() {
    const { itemId, action } = window.currentStockAdjustment;
    const item = db.stockItems.find(item => item.id === itemId);
    if (!item) return;
    
    const quantity = parseInt(document.getElementById('adjust-stock-quantity').value);
    const reason = document.getElementById('adjust-stock-reason').value.trim();
    
    if (!quantity || quantity <= 0 || !reason) {
        showNotification('Por favor, preencha todos os campos corretamente.', 'warning');
        return;
    }
    
    // Check stock availability for removal (quantity is already in the correct unit)
    if (action === 'remove' && item.quantity < quantity) {
        showNotification(`Quantidade insuficiente em estoque. Disponível: ${item.quantity} ${item.unit}.`, 'error');
        return;
    }
    
    if (action === 'add') {
        item.quantity += quantity;
    } else {
        item.quantity -= quantity;
    }
    
    // Add stock movement
    db.stockMovements.push({
        id: db.nextMovementId++,
        itemId: itemId,
        type: action === 'add' ? 'entrada' : 'saida',
        quantity: quantity,
        reason: reason,
        date: new Date().toISOString(),
        user: getCurrentUser().name,
        itemUnitValue: item.unitValue // Record the unit value at time of movement
    });
    
    saveDb();
    
    // Close modal and refresh views
    document.getElementById('modal-adjust-stock').style.display = 'none';
    renderStockList();
    renderStockMovements();
    updateStockSummary();
    renderFinancialReport(document.getElementById('financial-month-selector').value); // Refresh financial report
    
    const actionText = action === 'add' ? 'adicionado ao' : 'removido do';
    showNotification(`${quantity} ${item.unit} ${actionText} estoque com sucesso!`, 'success');
}

function addNewIntern() {
    const username = document.getElementById('new-intern-username').value.trim();
    const password = document.getElementById('new-intern-password').value.trim();
    const name = document.getElementById('new-intern-name').value.trim();
    const cpf = document.getElementById('new-intern-cpf').value.trim();
    const phone = document.getElementById('new-intern-phone').value.trim();
    const email = document.getElementById('new-intern-email').value.trim();
    const address = document.getElementById('new-intern-address').value.trim();
    const institution = document.getElementById('new-intern-institution').value.trim();
    const graduationPeriod = document.getElementById('new-intern-graduation-period').value.trim();
    const education = document.getElementById('new-intern-education').value.trim();
    const discipline = document.getElementById('new-intern-discipline').value.trim();

    if (!username || !password || !name) {
        showNotification('Usuário, senha e nome completo são campos obrigatórios.', 'warning');
        return;
    }

    const internData = {
        username,
        password,
        name,
        cpf,
        phone,
        email,
        address,
        institution,
        graduationPeriod,
        education,
        discipline
    };

    if (addIntern(internData)) { // Call addIntern from interns.js
        document.getElementById('form-add-intern').reset();
        document.getElementById('modal-add-intern').style.display = 'none';
        renderInternList(); // Refresh the intern list
    }
    // Notification handled by addIntern function
}

function renderGeneralDocuments(filter = '', typeFilter = '') {
    const documentsList = document.getElementById('general-documents-list');
    if (!documentsList) return;

    documentsList.innerHTML = '';
    
    if (!db.generalDocuments || db.generalDocuments.length === 0) {
        documentsList.innerHTML = '<p>Nenhum documento cadastrado ainda.</p>';
        return;
    }

    const lowerCaseFilter = filter.toLowerCase();
    
    let filteredDocuments = db.generalDocuments.filter(doc => {
        const matchesSearch = lowerCaseFilter === '' || 
                            doc.title.toLowerCase().includes(lowerCaseFilter) ||
                            (doc.description && doc.description.toLowerCase().includes(lowerCaseFilter));
        const matchesType = typeFilter === '' || doc.type === typeFilter;
        return matchesSearch && matchesType;
    });

    if (filteredDocuments.length === 0) {
        documentsList.innerHTML = '<p>Nenhum documento corresponde aos filtros selecionados.</p>';
        return;
    }

    // Sort by date (newest first)
    filteredDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    filteredDocuments.forEach(doc => {
        const docCard = document.createElement('div');
        docCard.className = 'general-document-card';
        
        const typeLabels = {
            'documento': '📄 Documento',
            'nota': '📝 Nota',
            'relatorio': '📊 Relatório',
            'comprovante': '💰 Comprovante',
            'contrato': '📋 Contrato',
            'lembrete': '🔔 Lembrete',
            'procedimento': '📋 Procedimento',
            'observacao': '👁️ Observação',
            'outros': '📦 Outros'
        };

        docCard.innerHTML = `
            <div class="document-header">
                <h4>${doc.title}</h4>
                <div class="document-meta">
                    <span class="document-type-badge">${typeLabels[doc.type] || doc.type}</span>
                    <span class="document-date">${new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
            ${doc.description ? `<div class="document-description">${doc.description}</div>` : ''}
            ${doc.content ? `<div class="document-content">${doc.content}</div>` : ''}
            <div class="document-footer">
                <div class="document-author">Por ${doc.createdBy}</div>
                <div class="document-actions">
                    ${doc.fileData ? `
                        <a href="${doc.fileData}" download="${doc.fileName}" class="btn-download">
                            <i class="fa-solid fa-download"></i> Baixar
                        </a>
                    ` : ''}
                    <button class="btn-delete-doc" onclick="deleteGeneralDocument(${doc.id})">
                        <i class="fa-solid fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        
        documentsList.appendChild(docCard);
    });
}

function addGeneralDocument() {
    const title = document.getElementById('general-document-title').value.trim();
    const type = document.getElementById('general-document-type').value;
    const description = document.getElementById('general-document-description').value.trim();
    const fileInput = document.getElementById('general-document-file');

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
        if (!db.generalDocuments) {
            db.generalDocuments = [];
        }

        const newDocument = {
            id: db.nextGeneralDocumentId++,
            title: title,
            type: type,
            description: description,
            fileName: file.name,
            fileData: e.target.result,
            createdAt: new Date().toISOString(),
            createdBy: getCurrentUser().name,
            documentType: 'file'
        };

        db.generalDocuments.push(newDocument);
        saveDb();
        
        document.getElementById('modal-add-general-document').style.display = 'none';
        document.getElementById('form-add-general-document').reset();
        renderGeneralDocuments();
        showNotification('Documento adicionado com sucesso!', 'success');
    };

    reader.onerror = function() {
        showNotification('Erro ao processar o arquivo. Tente novamente.', 'error');
    };

    reader.readAsDataURL(file);
}

function addGeneralNote() {
    const title = document.getElementById('general-note-title').value.trim();
    const type = document.getElementById('general-note-type').value;
    const content = document.getElementById('general-note-content').value.trim();

    if (!title || !type || !content) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    if (!db.generalDocuments) {
        db.generalDocuments = [];
    }

    const newNote = {
        id: db.nextGeneralDocumentId++,
        title: title,
        type: type,
        content: content,
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser().name,
        documentType: 'note'
    };

    db.generalDocuments.push(newNote);
    saveDb();
    
    document.getElementById('modal-add-general-note').style.display = 'none';
    document.getElementById('form-add-general-note').reset();
    renderGeneralDocuments();
    showNotification('Nota adicionada com sucesso!', 'success');
}

function deleteGeneralDocument(documentId) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    if (!db.generalDocuments) return;
    
    const docIndex = db.generalDocuments.findIndex(doc => doc.id === documentId);
    if (docIndex !== -1) {
        const deletedDoc = db.generalDocuments[docIndex];
        db.generalDocuments.splice(docIndex, 1);
        saveDb();
        renderGeneralDocuments();
        showNotification(`${deletedDoc.documentType === 'note' ? 'Nota' : 'Documento'} excluído com sucesso!`, 'success');
    }
}