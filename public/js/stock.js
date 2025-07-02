// Stock management module
import { db, saveDb } from './database.js';
import { getCurrentUser } from './auth.js';
import { showNotification } from './ui.js';

// Add unit conversion system
const UNIT_CONVERSIONS = {
    'unidade': 1,
    'pacote': 5,
    'caixa': 10,
    'resma': 15,
    'kit': 20,
    'lote': 25
};

function getUnitEquivalent(unit) {
    return UNIT_CONVERSIONS[unit] || 1;
}

function getUnitDisplayName(unit) {
    const equivalents = {
        'unidade': 'unidade',
        'pacote': 'pacote (5 unidades)',
        'caixa': 'caixa (10 unidades)', 
        'resma': 'resma (15 unidades)',
        'kit': 'kit (20 unidades)',
        'lote': 'lote (25 unidades)'
    };
    return equivalents[unit] || unit;
}

export function renderStockList() {
    const stockList = document.getElementById('stock-list');
    if (!stockList) return;
    
    stockList.innerHTML = '';
    
    if (db.stockItems.length === 0) {
        stockList.innerHTML = '<p>Nenhum item no estoque.</p>';
        return;
    }
    
    // Group items by category
    const categories = {};
    db.stockItems.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });
    
    Object.keys(categories).forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'stock-category';
        
        const categoryName = {
            'papelaria': 'Papelaria',
            'testes': 'Testes Neuropsicológicos',
            'brinquedos': 'Brinquedos Terapêuticos',
            'jogos': 'Jogos e Quebra-cabeças',
            'tecnologia': 'Equipamentos Tecnológicos',
            'consumiveis': 'Materiais Consumíveis',
            'outros': 'Outros'
        };
        
        // Count normal and low stock items in category
        const lowStockInCategory = categories[category].filter(item => {
            return item.quantity <= item.minStock;
        }).length;
        const totalInCategory = categories[category].length;
        
        categorySection.innerHTML = `
            <h3>
                ${categoryName[category] || category}
                <span class="category-summary">
                    <span class="category-total">${totalInCategory} itens</span>
                    ${lowStockInCategory > 0 ? `<span class="category-low-stock">⚠️ ${lowStockInCategory} baixo estoque</span>` : ''}
                </span>
            </h3>
        `;
        
        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'stock-items-grid';
        
        categories[category].forEach(item => {
            const itemCard = document.createElement('div');
            
            // Display quantities correctly based on unit type
            let displayQuantity = item.quantity;
            let displayUnit = getUnitDisplayName(item.unit);
            let totalUnits = item.quantity * getUnitEquivalent(item.unit);
            
            const isLowStock = item.quantity <= item.minStock;
            const stockStatus = item.quantity === 0 ? 'out-of-stock' : isLowStock ? 'low-stock' : 'normal-stock';
            
            itemCard.className = `stock-item-card ${stockStatus}`;
            
            let stockBadge = '';
            if (item.quantity === 0) {
                stockBadge = '<span class="stock-status-badge out-of-stock">🚫 SEM ESTOQUE</span>';
            } else if (isLowStock) {
                stockBadge = '<span class="stock-status-badge low-stock">⚠️ ESTOQUE BAIXO</span>';
            } else {
                stockBadge = '<span class="stock-status-badge normal-stock">✅ ESTOQUE OK</span>';
            }
            
            itemCard.innerHTML = `
                <div class="stock-item-header">
                    <h4>${item.name}</h4>
                    <div class="stock-info">
                        <span class="stock-quantity ${item.quantity <= item.minStock ? 'low' : ''} ${item.quantity === 0 ? 'empty' : ''}">${displayQuantity} ${item.unit}</span>
                    </div>
                </div>
                <div class="stock-status-container">
                    ${stockBadge}
                </div>
                <div class="stock-item-details">
                    ${item.description ? `<p class="stock-description">${item.description}</p>` : ''}
                    <div class="stock-meta">
                        <small>Estoque mínimo: ${item.minStock} ${item.unit}</small>
                        <small>Total em unidades: ${totalUnits} unidades</small>
                        <small>Valor unitário: R$ ${item.unitValue.toFixed(2).replace('.', ',')}</small>
                        <small>Valor total: R$ ${(item.quantity * item.unitValue).toFixed(2).replace('.', ',')}</small>
                        ${isLowStock ? `<span class="stock-deficit">Faltam ${item.minStock - item.quantity} ${item.unit}</span>` : ''}
                    </div>
                </div>
                <div class="stock-item-actions">
                    <button class="btn-stock-add" onclick="adjustStock(${item.id}, 'add')">
                        <i class="fa-solid fa-plus"></i> Adicionar
                    </button>
                    <button class="btn-stock-remove" onclick="adjustStock(${item.id}, 'remove')" ${item.quantity === 0 ? 'disabled' : ''}>
                        <i class="fa-solid fa-minus"></i> Remover
                    </button>
                    <button class="btn-stock-delete" onclick="showDeleteStockItemConfirmation(${item.id})">
                        <i class="fa-solid fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            
            itemsGrid.appendChild(itemCard);
        });
        
        categorySection.appendChild(itemsGrid);
        stockList.appendChild(categorySection);
    });
}

export function renderStockMovements(selectedMonthYear = null) {
    const stockMovements = document.getElementById('stock-movements');
    if (!stockMovements) return;
    
    stockMovements.innerHTML = '';
    
    if (db.stockMovements.length === 0) {
        stockMovements.innerHTML = '<p>Nenhuma movimentação registrada.</p>';
        return;
    }
    
    let filteredMovements = db.stockMovements;
    
    // Filter by month if selectedMonthYear is provided
    if (selectedMonthYear) {
        const [targetYear, targetMonth] = selectedMonthYear.split('-').map(Number);
        filteredMovements = db.stockMovements.filter(movement => {
            const movementDate = new Date(movement.date);
            return movementDate.getMonth() === (targetMonth - 1) && movementDate.getFullYear() === targetYear;
        });
    }
    
    // Sort movements by date (newest first)
    const sortedMovements = [...filteredMovements].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate month summary
    let monthEntries = 0;
    let monthExits = 0;
    let monthEntriesValue = 0;
    let monthExitsValue = 0;
    
    filteredMovements.forEach(movement => {
        const movementValue = (movement.quantity || 0) * (movement.itemUnitValue || 0);
        if (movement.type === 'entrada') {
            monthEntries++;
            monthEntriesValue += movementValue;
        } else if (movement.type === 'saida') {
            monthExits++;
            monthExitsValue += movementValue;
        }
    });
    
    // Add month summary if filtering by month
    if (selectedMonthYear && filteredMovements.length > 0) {
        const summaryCard = document.createElement('div');
        summaryCard.className = 'stock-month-summary';
        summaryCard.innerHTML = `
            <h4>Resumo do Período</h4>
            <div class="summary-grid">
                <div class="summary-item entrada">
                    <span class="summary-label">📥 Entradas</span>
                    <span class="summary-count">${monthEntries} movimentações</span>
                    <span class="summary-value">R$ ${monthEntriesValue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="summary-item saida">
                    <span class="summary-label">📤 Saídas</span>
                    <span class="summary-count">${monthExits} movimentações</span>
                    <span class="summary-value">R$ ${monthExitsValue.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="summary-item total">
                    <span class="summary-label">💰 Saldo</span>
                    <span class="summary-count">${monthEntries + monthExits} total</span>
                    <span class="summary-value">R$ ${(monthEntriesValue - monthExitsValue).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        `;
        stockMovements.appendChild(summaryCard);
    }
    
    if (filteredMovements.length === 0) {
        if (selectedMonthYear) {
            stockMovements.innerHTML = '<p>Nenhuma movimentação registrada para o período selecionado.</p>';
        } else {
            stockMovements.innerHTML = '<p>Nenhuma movimentação registrada.</p>';
        }
        return;
    }
    
    const displayLimit = selectedMonthYear ? sortedMovements.length : 20;
    sortedMovements.slice(0, displayLimit).forEach(movement => { // Show all movements for selected month, last 20 for all
        const item = db.stockItems.find(item => item.id === movement.itemId); // Find the item to get unit info
        const movementCard = document.createElement('div');
        movementCard.className = `stock-movement-card ${movement.type}`;
        
        // Display quantity correctly based on unit type
        let displayQuantity = movement.quantity;
        let displayUnit = item ? item.unit : 'unid'; // Use item.unit if available
        let totalUnits = movement.quantity * (item ? getUnitEquivalent(item.unit) : 1);
        let movementValue = (movement.quantity * (movement.itemUnitValue || 0)).toFixed(2).replace('.', ',');
        
        let typeText = '';
        let typeClass = '';

        if (movement.type === 'entrada') {
            typeText = '📥 Entrada';
            typeClass = 'entrada';
        } else if (movement.type === 'saida') {
            typeText = '📤 Saída';
            typeClass = 'saida';
        } else if (movement.type === 'exclusao') {
            typeText = '🗑️ Exclusão';
            typeClass = 'exclusao'; // Add a new class for deletion movements
        }

        movementCard.innerHTML = `
            <div class="movement-info">
                <h5>${item ? item.name : movement.itemName || 'Item removido'}</h5>
                <div class="movement-details">
                    <span class="movement-type ${typeClass}">${typeText}</span>
                    ${movement.type !== 'exclusao' ? `<span class="movement-quantity">${displayQuantity} ${displayUnit} (${totalUnits} unidades) - R$ ${movementValue}</span>` : ''}
                </div>
                <p class="movement-reason">${movement.reason}</p>
            </div>
            <div class="movement-meta">
                <div class="movement-date">${new Date(movement.date).toLocaleDateString('pt-BR')}</div>
                <div class="movement-user">${movement.user}</div>
            </div>
        `;
        
        stockMovements.appendChild(movementCard);
    });
}

export function updateStockSummary() {
    const totalItems = db.stockItems.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = db.stockItems.filter(item => item.quantity <= item.minStock).length;
    const outOfStockItems = db.stockItems.filter(item => item.quantity === 0).length;
    
    const totalItemsElement = document.getElementById('total-items');
    const lowStockItemsElement = document.getElementById('low-stock-items');
    
    if (totalItemsElement) {
        totalItemsElement.textContent = totalItems;
    }
    
    if (lowStockItemsElement) {
        lowStockItemsElement.textContent = lowStockItems;
    }
    
    // Update summary card colors based on stock status
    const stockSummaryCards = document.querySelectorAll('.stock-summary .summary-card');
    if (stockSummaryCards.length >= 2) {
        // Update low stock card color if there are items with low stock
        if (lowStockItems > 0) {
            stockSummaryCards[1].classList.add('warning-card');
        } else {
            stockSummaryCards[1].classList.remove('warning-card');
        }
    }
}

export function adjustStock(itemId, action) {
    const item = db.stockItems.find(item => item.id === itemId);
    if (!item) return;
    
    // Store the current adjustment data globally
    window.currentStockAdjustment = { itemId, action };
    
    // Update modal content based on action and item
    const modal = document.getElementById('modal-adjust-stock');
    const title = document.getElementById('adjust-stock-title');
    const quantityLabel = document.getElementById('adjust-stock-quantity-label');
    const unitInfo = document.getElementById('adjust-stock-unit-info');
    const submitBtn = document.getElementById('adjust-stock-submit-btn');
    const quantityInput = document.getElementById('adjust-stock-quantity');
    
    if (action === 'add') {
        title.textContent = `Adicionar - ${item.name}`;
        submitBtn.textContent = 'Adicionar ao Estoque';
        submitBtn.className = 'btn-primary';
        quantityInput.min = '1';
    } else { // action === 'remove'
        title.textContent = `Remover - ${item.name}`;
        submitBtn.textContent = 'Remover do Estoque';
        submitBtn.className = 'btn-primary btn-stock-remove';
        quantityInput.min = '1';
    }
    
    const unitEquivalent = getUnitEquivalent(item.unit);
    const totalUnits = item.quantity * unitEquivalent;
    
    quantityLabel.textContent = `Quantidade de ${getUnitDisplayName(item.unit)} para ${action === 'add' ? 'adicionar' : 'remover'}`;
    unitInfo.textContent = `1 ${item.unit} = ${unitEquivalent} unidades`;
    if (action === 'remove') {
        unitInfo.textContent += ` | Disponível: ${item.quantity} ${item.unit} (${totalUnits} unidades)`;
    }
    
    // Reset form and show modal
    document.getElementById('form-adjust-stock').reset();
    modal.style.display = 'flex';
}

export function showDeleteStockItemConfirmation(itemId) {
    const itemToDelete = db.stockItems.find(item => item.id === itemId);
    if (!itemToDelete) {
        showNotification('Item não encontrado no estoque.', 'error');
        return;
    }

    // Store the item ID and type to be deleted globally for the confirmation handler
    window.currentDeleteItem = itemId;
    window.currentDeleteItemType = 'stock'; // <-- ADDED THIS LINE

    const modal = document.getElementById('modal-confirm-delete');
    const message = document.getElementById('delete-confirmation-message');
    message.textContent = `Tem certeza que deseja excluir o item "${itemToDelete.name}" do estoque? Esta ação é irreversível.`;
    
    modal.style.display = 'flex';
}

// Make functions globally available
window.adjustStock = adjustStock;
window.showDeleteStockItemConfirmation = showDeleteStockItemConfirmation;