// Financial reporting module
import { db } from './database.js';
import { getCurrentUser } from './auth.js';

export function renderFinancialReport(selectedMonthYear = null) {
    const currentUser = getCurrentUser();
    if (currentUser.role !== 'coordinator') return;
    
    let targetMonth, targetYear;
    if (selectedMonthYear) {
        [targetYear, targetMonth] = selectedMonthYear.split('-').map(Number);
        targetMonth -= 1; // Month is 0-indexed in Date object
    } else {
        const today = new Date();
        targetMonth = today.getMonth();
        targetYear = today.getFullYear();
        document.getElementById('financial-month-selector').value = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    }

    let monthlyRevenue = 0;
    let monthlyAppointments = 0;
    let totalStockPurchases = 0; // Renamed for clarity - money spent on purchasing stock
    let totalMaterialsCost = 0; // Renamed for clarity - cost of materials used
    let totalSchedules = 0;
    
    // Calculate appointments and revenue
    db.clients.forEach(client => {
        if (client.appointments) {
            client.appointments.forEach(appointment => {
                const appointmentDate = new Date(appointment.date);
                if (appointmentDate.getMonth() === targetMonth && appointmentDate.getFullYear() === targetYear) {
                    monthlyAppointments++;
                    monthlyRevenue += appointment.value || 0;
                }
            });
        }
    });

    // Calculate stock movements with better categorization
    db.stockMovements.forEach(movement => {
        const movementDate = new Date(movement.date);
        if (movementDate.getMonth() === targetMonth && movementDate.getFullYear() === targetYear) {
            const movementValue = (movement.quantity || 0) * (movement.itemUnitValue || 0);
            if (movement.type === 'entrada') {
                totalStockPurchases += movementValue; // Money spent purchasing materials
            } else if (movement.type === 'saida') {
                totalMaterialsCost += movementValue; // Cost of materials used in services
            }
        }
    });

    // Calculate schedules for the period
    db.schedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.date);
        if (scheduleDate.getMonth() === targetMonth && scheduleDate.getFullYear() === targetYear) {
            totalSchedules++;
        }
    });

    // Calculate total expenses and net result
    const totalExpenses = totalStockPurchases + totalMaterialsCost;
    const netResult = monthlyRevenue - totalExpenses;
    
    // Update summary cards with clearer terminology
    document.getElementById('monthly-revenue').textContent = `R$ ${monthlyRevenue.toFixed(2).replace('.', ',')}`;
    document.getElementById('monthly-appointments').textContent = monthlyAppointments;
    document.getElementById('stock-entries-value').textContent = `R$ ${totalStockPurchases.toFixed(2).replace('.', ',')}`;
    document.getElementById('stock-exits-value').textContent = `R$ ${totalMaterialsCost.toFixed(2).replace('.', ',')}`;
    document.getElementById('net-result').textContent = `R$ ${netResult.toFixed(2).replace('.', ',')}`;
    document.getElementById('active-clients').textContent = db.clients.length;
    document.getElementById('total-schedules').textContent = totalSchedules;
    
    // Update period display
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const periodDisplayElement = document.getElementById('financial-period-display');
    if (periodDisplayElement) {
        periodDisplayElement.textContent = `${monthNames[targetMonth]} ${targetYear}`;
    }

    // Color the net result based on positive/negative
    const netResultElement = document.getElementById('net-result');
    if (netResult >= 0) {
        netResultElement.style.color = '#10b981'; // Green for positive
    } else {
        netResultElement.style.color = '#ef4444'; // Red for negative
    }
    
    // Render financial details
    const financialList = document.getElementById('financial-list');
    financialList.innerHTML = '';
    
    if (db.clients.length === 0) {
        financialList.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
        return;
    }

    db.clients.forEach(client => {
        const totalValue = (client.appointments || []).reduce((sum, app) => sum + (app.value || 0), 0);
        const totalAppointments = (client.appointments || []).length;

        const card = document.createElement('div');
        card.className = 'financial-card';
        card.innerHTML = `
            <div class="card-header">
                <h4>${client.name} (ID: ${client.id})</h4>
            </div>
            <div class="financial-metrics">
                <div class="metric-item">
                    <i class="fa-solid fa-money-bill-wave"></i>
                    <span>Total Gasto</span>
                    <strong>R$ ${totalValue.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div class="metric-item">
                    <i class="fa-solid fa-calendar-check"></i>
                    <span>Atendimentos</span>
                    <strong>${totalAppointments}</strong>
                </div>
            </div>
        `;
        financialList.appendChild(card);
    });
}

export function renderDailyNotes(selectedMonthYear = null) {
    const dailyNotesList = document.getElementById('daily-notes-list');
    if (!dailyNotesList) return;
    
    dailyNotesList.innerHTML = '';
    
    if (!db.dailyNotes || db.dailyNotes.length === 0) {
        dailyNotesList.innerHTML = '<p>Nenhuma nota diária registrada.</p>';
        return;
    }
    
    let filteredNotes = db.dailyNotes;
    
    // Filter by month if selectedMonthYear is provided
    if (selectedMonthYear) {
        const [targetYear, targetMonth] = selectedMonthYear.split('-').map(Number);
        filteredNotes = db.dailyNotes.filter(note => {
            const noteDate = new Date(note.date);
            return noteDate.getMonth() === (targetMonth - 1) && noteDate.getFullYear() === targetYear;
        });
    } else {
        // Show only current month by default
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        filteredNotes = db.dailyNotes.filter(note => {
            const noteDate = new Date(note.date);
            return noteDate.getMonth() === currentMonth && noteDate.getFullYear() === currentYear;
        });
    }
    
    if (filteredNotes.length === 0) {
        dailyNotesList.innerHTML = '<p>Nenhuma nota para o período selecionado.</p>';
        return;
    }
    
    // Sort notes by date (newest first)
    const sortedNotes = [...filteredNotes].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = `daily-note-card ${note.type}`;
        
        const typeIcon = {
            'receita': '💰',
            'despesa': '💸',
            'observacao': '📝'
        };
        
        const typeLabel = {
            'receita': 'Receita',
            'despesa': 'Despesa',
            'observacao': 'Observação'
        };
        
        noteCard.innerHTML = `
            <div class="note-header">
                <div class="note-title">
                    <span class="note-icon">${typeIcon[note.type]}</span>
                    <h4>${note.title}</h4>
                </div>
                <div class="note-meta">
                    <span class="note-date">${new Date(note.date).toLocaleDateString('pt-BR')}</span>
                    <span class="note-type-badge ${note.type}">${typeLabel[note.type]}</span>
                    ${note.value ? `<span class="note-value">R$ ${note.value.toFixed(2).replace('.', ',')}</span>` : ''}
                </div>
            </div>
            <div class="note-content">
                ${note.content}
            </div>
            ${note.fileName ? `
                <div class="note-attachment">
                    <a href="${note.fileData}" download="${note.fileName}" class="btn-download">
                        <i class="fa-solid fa-download"></i> ${note.fileName}
                    </a>
                </div>
            ` : ''}
            <div class="note-footer">
                <small>Por ${note.createdBy} em ${new Date(note.createdAt).toLocaleDateString('pt-BR')} às ${new Date(note.createdAt).toLocaleTimeString('pt-BR')}</small>
                <button class="btn-delete-note" onclick="deleteDailyNote(${note.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        
        dailyNotesList.appendChild(noteCard);
    });
}

export function addDailyNote() {
    const date = document.getElementById('daily-note-date').value;
    const title = document.getElementById('daily-note-title').value.trim();
    const type = document.getElementById('daily-note-type').value;
    const value = parseFloat(document.getElementById('daily-note-value').value) || null;
    const content = document.getElementById('daily-note-content').value.trim();
    const fileInput = document.getElementById('daily-note-file');
    
    if (!date || !title || !type || !content) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }
    
    if (!db.dailyNotes) {
        db.dailyNotes = [];
    }
    
    const newNote = {
        id: db.nextDailyNoteId++,
        date: date,
        title: title,
        type: type,
        value: value,
        content: content,
        createdAt: new Date().toISOString(),
        createdBy: getCurrentUser().name
    };

    if (fileInput.files[0]) {
        const file = fileInput.files[0];
        
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('O arquivo deve ter no máximo 5MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            newNote.fileName = file.name;
            newNote.fileData = e.target.result;
            
            db.dailyNotes.push(newNote);
            saveDb();
            
            document.getElementById('form-add-daily-note').reset();
            document.getElementById('modal-add-daily-note').style.display = 'none';
            
            const selectedMonth = document.getElementById('financial-month-selector').value;
            renderDailyNotes(selectedMonth);
            renderFinancialReport(selectedMonth);
            
            showNotification('Nota diária adicionada com sucesso!', 'success');
        };

        reader.onerror = function() {
            showNotification('Erro ao processar o arquivo. Tente novamente.', 'error');
        };

        reader.readAsDataURL(file);
    } else {
        db.dailyNotes.push(newNote);
        saveDb();
        
        document.getElementById('form-add-daily-note').reset();
        document.getElementById('modal-add-daily-note').style.display = 'none';
        
        const selectedMonth = document.getElementById('financial-month-selector').value;
        renderDailyNotes(selectedMonth);
        renderFinancialReport(selectedMonth);
        
        showNotification('Nota diária adicionada com sucesso!', 'success');
    }
}

export function deleteDailyNote(noteId) {
    if (!confirm('Tem certeza que deseja excluir esta nota?')) return;
    
    db.dailyNotes = db.dailyNotes.filter(note => note.id !== noteId);
    saveDb();
    
    const selectedMonth = document.getElementById('financial-month-selector').value;
    renderDailyNotes(selectedMonth);
    renderFinancialReport(selectedMonth);
    
    showNotification('Nota excluída com sucesso!', 'success');
}

export function generateMonthlyReport(selectedMonthYear) {
    const reportContent = document.getElementById('monthly-report-content');
    if (!reportContent) return;
    
    const [targetYear, targetMonth] = selectedMonthYear.split('-').map(Number);
    const monthName = new Date(targetYear, targetMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    // Calculate financial data for the month
    let monthlyRevenue = 0;
    let monthlyAppointments = 0;
    let totalStockPurchases = 0;
    let totalMaterialsCost = 0;
    
    // Calculate appointments and revenue
    db.clients.forEach(client => {
        if (client.appointments) {
            client.appointments.forEach(appointment => {
                const appointmentDate = new Date(appointment.date);
                if (appointmentDate.getMonth() === (targetMonth - 1) && appointmentDate.getFullYear() === targetYear) {
                    monthlyAppointments++;
                    monthlyRevenue += appointment.value || 0;
                }
            });
        }
    });
    
    // Calculate stock movements
    db.stockMovements.forEach(movement => {
        const movementDate = new Date(movement.date);
        if (movementDate.getMonth() === (targetMonth - 1) && movementDate.getFullYear() === targetYear) {
            const movementValue = (movement.quantity || 0) * (movement.itemUnitValue || 0);
            if (movement.type === 'entrada') {
                totalStockPurchases += movementValue;
            } else if (movement.type === 'saida') {
                totalMaterialsCost += movementValue;
            }
        }
    });
    
    // Get daily notes for the month
    const monthlyNotes = db.dailyNotes ? db.dailyNotes.filter(note => {
        const noteDate = new Date(note.date);
        return noteDate.getMonth() === (targetMonth - 1) && noteDate.getFullYear() === targetYear;
    }).sort((a, b) => new Date(a.date) - new Date(b.date)) : [];
    
    // Calculate additional revenue/expenses from daily notes
    let additionalRevenue = 0;
    let additionalExpenses = 0;
    
    monthlyNotes.forEach(note => {
        if (note.value) {
            if (note.type === 'receita') {
                additionalRevenue += note.value;
            } else if (note.type === 'despesa') {
                additionalExpenses += note.value;
            }
        }
    });
    
    const totalRevenue = monthlyRevenue + additionalRevenue;
    const totalExpenses = totalStockPurchases + totalMaterialsCost + additionalExpenses;
    const netResult = totalRevenue - totalExpenses;
    
    reportContent.innerHTML = `
        <div class="report-summary">
            <h3>Resumo Financeiro - ${monthName}</h3>
            <div class="report-summary-grid">
                <div class="report-summary-item revenue">
                    <h4>💰 Receitas Totais</h4>
                    <div class="summary-value">R$ ${totalRevenue.toFixed(2).replace('.', ',')}</div>
                    <div class="summary-breakdown">
                        <p>Atendimentos: R$ ${monthlyRevenue.toFixed(2).replace('.', ',')}</p>
                        <p>Outras receitas: R$ ${additionalRevenue.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
                <div class="report-summary-item expenses">
                    <h4>💸 Despesas Totais</h4>
                    <div class="summary-value">R$ ${totalExpenses.toFixed(2).replace('.', ',')}</div>
                    <div class="summary-breakdown">
                        <p>Compra de materiais: R$ ${totalStockPurchases.toFixed(2).replace('.', ',')}</p>
                        <p>Materiais utilizados: R$ ${totalMaterialsCost.toFixed(2).replace('.', ',')}</p>
                        <p>Outras despesas: R$ ${additionalExpenses.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
                <div class="report-summary-item result ${netResult >= 0 ? 'positive' : 'negative'}">
                    <h4>📊 Resultado Líquido</h4>
                    <div class="summary-value">R$ ${netResult.toFixed(2).replace('.', ',')}</div>
                    <div class="summary-breakdown">
                        <p>${netResult >= 0 ? 'Lucro' : 'Prejuízo'} no período</p>
                        <p>${monthlyAppointments} atendimentos realizados</p>
                    </div>
                </div>
            </div>
        </div>
        
        ${monthlyNotes.length > 0 ? `
            <div class="report-notes-section">
                <h3>📝 Notas do Período</h3>
                <div class="report-notes-list">
                    ${monthlyNotes.map(note => {
                        const typeIcon = { 'receita': '💰', 'despesa': '💸', 'observacao': '📝' };
                        const typeLabel = { 'receita': 'Receita', 'despesa': 'Despesa', 'observacao': 'Observação' };
                        return `
                            <div class="report-note-item ${note.type}">
                                <div class="note-date-title">
                                    <span class="note-date">${new Date(note.date).toLocaleDateString('pt-BR')}</span>
                                    <span class="note-icon">${typeIcon[note.type]}</span>
                                    <span class="note-title">${note.title}</span>
                                </div>
                                ${note.value ? `<div class="note-value">R$ ${note.value.toFixed(2).replace('.', ',')}</div>` : ''}
                                <div class="note-content">${note.content}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="report-footer">
            <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} por ${getCurrentUser().name}</p>
        </div>
    `;
}

// Make functions globally available
window.deleteDailyNote = deleteDailyNote;