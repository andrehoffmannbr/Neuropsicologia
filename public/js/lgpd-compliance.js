// LGPD Compliance Module - Sistema de Conformidade LGPD
// Usa instâncias globais do Firebase configuradas no HTML

import { db, LGPD_CONFIG } from './firebase-config.js';
import { logGDPRConsent, logSecurityEvent } from './security-logger.js';
import { getCurrentUser } from './auth.js';
import { showNotification } from './ui.js';

// Funções Firebase usando instâncias globais (simulação local)
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

function doc(db, path, id) {
    return { path: `${path}/${id}` };
}

function collection(db, path) {
    return { path };
}

function serverTimestamp() {
    return new Date().toISOString();
}

// Gerenciador de consentimentos
export class LGPDConsentManager {
    constructor() {
        this.consentStatus = new Map();
        this.initialized = false;
    }

    // Inicializar sistema de consentimento
    async initialize() {
        try {
            await this.loadConsentStatus();
            await this.checkConsentRequirements();
            this.initialized = true;
        } catch (error) {
            console.error('Erro ao inicializar sistema LGPD:', error);
        }
    }

    // Verificar se tem consentimento específico
    hasConsent(consentType) {
        const user = getCurrentUser();
        if (!user) return false;

        const userConsents = this.consentStatus.get(user.uid);
        if (!userConsents) return false;

        const consent = userConsents.consents[consentType];
        return consent && consent.granted === true;
    }

    // Carregar status de consentimento
    async loadConsentStatus() {
        const user = getCurrentUser();
        if (!user) return;

        try {
            const consentDoc = doc(db, 'user_consents', user.uid);
            const docSnap = await getDoc(consentDoc);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.consentStatus.set(user.uid, data);
            } else {
                // Criar documento de consentimento inicial
                const initialConsent = {
                    userId: user.uid,
                    consents: {},
                    consentVersion: LGPD_CONFIG.CONSENT_VERSION,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                
                await setDoc(consentDoc, initialConsent);
                this.consentStatus.set(user.uid, initialConsent);
            }
        } catch (error) {
            console.error('Erro ao carregar status de consentimento:', error);
        }
    }

    // Verificar se todos os consentimentos obrigatórios foram dados
    async checkConsentRequirements() {
        const user = getCurrentUser();
        if (!user) return;

        const userConsents = this.consentStatus.get(user.uid);
        if (!userConsents) return;

        const missingConsents = [];
        
        for (const requiredConsent of LGPD_CONFIG.REQUIRED_CONSENTS) {
            if (!userConsents.consents[requiredConsent] || 
                !userConsents.consents[requiredConsent].granted) {
                missingConsents.push(requiredConsent);
            }
        }

        if (missingConsents.length > 0) {
            await this.showConsentModal(missingConsents);
        }
    }

    // Mostrar modal de consentimento
    async showConsentModal(missingConsents = LGPD_CONFIG.REQUIRED_CONSENTS) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay lgpd-consent-modal';
        modal.style.display = 'flex';
        modal.style.zIndex = '10000';
        
        const consentDescriptions = {
            data_processing: {
                title: 'Processamento de Dados Pessoais',
                description: 'Consentimento para processamento dos seus dados pessoais para fins de prestação de serviços neuropsicológicos.'
            },
            data_storage: {
                title: 'Armazenamento de Dados',
                description: 'Consentimento para armazenamento seguro dos seus dados pelo período necessário conforme legislação.'
            },
            clinical_data: {
                title: 'Dados Clínicos Sensíveis',
                description: 'Consentimento específico para tratamento de dados de saúde e informações clínicas.'
            },
            communication: {
                title: 'Comunicações',
                description: 'Consentimento para envio de comunicações relacionadas aos seus atendimentos e serviços.'
            }
        };

        modal.innerHTML = `
            <div class="modal-content lgpd-consent-content">
                <div class="lgpd-header">
                    <h2>📋 Consentimento LGPD</h2>
                    <p>Para continuar usando o sistema, precisamos do seu consentimento para:</p>
                </div>
                
                <div class="consent-items">
                    ${missingConsents.map(consent => `
                        <div class="consent-item">
                            <label class="consent-checkbox">
                                <input type="checkbox" name="consent" value="${consent}" required>
                                <span class="checkmark"></span>
                                <div class="consent-text">
                                    <strong>${consentDescriptions[consent]?.title || consent}</strong>
                                    <p>${consentDescriptions[consent]?.description || 'Consentimento necessário para funcionamento do sistema.'}</p>
                                </div>
                            </label>
                        </div>
                    `).join('')}
                </div>
                
                <div class="lgpd-actions">
                    <button type="button" class="btn-secondary" id="btn-view-privacy-policy">
                        📄 Ver Política de Privacidade
                    </button>
                    <button type="button" class="btn-primary" id="btn-consent-confirm" disabled>
                        ✅ Confirmar Consentimentos
                    </button>
                </div>
                
                <div class="lgpd-footer">
                    <small>
                        Seus dados são protegidos conforme a Lei Geral de Proteção de Dados (LGPD).
                        Você pode revogar seus consentimentos a qualquer momento nas configurações.
                    </small>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        const confirmBtn = modal.querySelector('#btn-consent-confirm');
        const privacyBtn = modal.querySelector('#btn-view-privacy-policy');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                confirmBtn.disabled = !allChecked;
            });
        });

        confirmBtn.addEventListener('click', async () => {
            const selectedConsents = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            
            await this.recordConsents(selectedConsents, true);
            document.body.removeChild(modal);
            showNotification('Consentimentos registrados com sucesso!', 'success');
        });

        privacyBtn.addEventListener('click', () => {
            this.showPrivacyPolicy();
        });
    }

    // Registrar consentimentos
    async recordConsents(consentTypes, granted = true) {
        const user = getCurrentUser();
        if (!user) return;

        try {
            const consentDoc = doc(db, 'user_consents', user.uid);
            const now = new Date();
            
            const updates = {
                updatedAt: serverTimestamp(),
                consentVersion: LGPD_CONFIG.CONSENT_VERSION
            };

            // Atualizar cada consentimento
            for (const consentType of consentTypes) {
                updates[`consents.${consentType}`] = {
                    granted: granted,
                    timestamp: serverTimestamp(),
                    version: LGPD_CONFIG.CONSENT_VERSION,
                    ipAddress: await this.getClientIP(),
                    userAgent: navigator.userAgent
                };

                // Log do consentimento
                await logGDPRConsent(user.uid, consentType, granted, {
                    method: 'user_interface',
                    timestamp: now.toISOString()
                });
            }

            await updateDoc(consentDoc, updates);
            
            // Atualizar cache local
            const currentConsents = this.consentStatus.get(user.uid) || { consents: {} };
            for (const consentType of consentTypes) {
                currentConsents.consents[consentType] = updates[`consents.${consentType}`];
            }
            this.consentStatus.set(user.uid, currentConsents);

        } catch (error) {
            console.error('Erro ao registrar consentimentos:', error);
            throw error;
        }
    }

    // Revogar consentimento
    async revokeConsent(consentType, reason = 'Revogado pelo usuário') {
        const user = getCurrentUser();
        if (!user) return;

        try {
            await this.recordConsents([consentType], false);
            
            await logGDPRConsent(user.uid, consentType, false, {
                reason: reason,
                method: 'user_revocation'
            });

            showNotification(`Consentimento para ${consentType} foi revogado.`, 'info');
            
            // Se for consentimento obrigatório, mostrar aviso
            if (LGPD_CONFIG.REQUIRED_CONSENTS.includes(consentType)) {
                showNotification('Atenção: Este é um consentimento obrigatório. O sistema pode ter funcionalidade limitada.', 'warning');
            }

        } catch (error) {
            console.error('Erro ao revogar consentimento:', error);
            throw error;
        }
    }

    // Mostrar central de privacidade
    showPrivacyCenter() {
        const user = getCurrentUser();
        if (!user) return;

        const userConsents = this.consentStatus.get(user.uid) || { consents: {} };
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay privacy-center-modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content privacy-center-content">
                <button class="modal-close-btn">&times;</button>
                <div class="privacy-header">
                    <h2>🔒 Central de Privacidade</h2>
                    <p>Gerencie seus consentimentos e dados pessoais</p>
                </div>
                
                <div class="privacy-tabs">
                    <button class="privacy-tab active" data-tab="consents">Consentimentos</button>
                    <button class="privacy-tab" data-tab="data">Meus Dados</button>
                    <button class="privacy-tab" data-tab="rights">Meus Direitos</button>
                </div>
                
                <div class="privacy-tab-content" id="consents-tab">
                    <h3>Gerenciar Consentimentos</h3>
                    <div class="consent-list">
                        ${Object.entries(userConsents.consents || {}).map(([type, consent]) => `
                            <div class="consent-management-item">
                                <div class="consent-info">
                                    <h4>${this.getConsentTitle(type)}</h4>
                                    <p>${this.getConsentDescription(type)}</p>
                                    <small>Status: ${consent.granted ? '✅ Concedido' : '❌ Revogado'}</small>
                                </div>
                                <div class="consent-actions">
                                    ${consent.granted ? 
                                        `<button class="btn-danger btn-revoke" data-consent="${type}">Revogar</button>` :
                                        `<button class="btn-primary btn-grant" data-consent="${type}">Conceder</button>`
                                    }
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="privacy-tab-content" id="data-tab" style="display: none;">
                    <h3>Meus Dados Pessoais</h3>
                    <p>Você tem direito de saber quais dados pessoais são processados.</p>
                    <div class="data-actions">
                        <button class="btn-secondary" id="btn-export-data">
                            📤 Exportar Meus Dados
                        </button>
                        <button class="btn-secondary" id="btn-view-activity">
                            📊 Ver Atividade de Dados
                        </button>
                    </div>
                </div>
                
                <div class="privacy-tab-content" id="rights-tab" style="display: none;">
                    <h3>Seus Direitos LGPD</h3>
                    <div class="rights-list">
                        <div class="right-item">
                            <h4>🔍 Direito de Acesso</h4>
                            <p>Obter confirmação sobre o tratamento dos seus dados</p>
                        </div>
                        <div class="right-item">
                            <h4>✏️ Direito de Correção</h4>
                            <p>Solicitar correção de dados incompletos ou incorretos</p>
                        </div>
                        <div class="right-item">
                            <h4>🗑️ Direito de Exclusão</h4>
                            <p>Solicitar eliminação dos dados pessoais</p>
                            <button class="btn-danger" id="btn-request-deletion">
                                Solicitar Exclusão de Dados
                            </button>
                        </div>
                        <div class="right-item">
                            <h4>📦 Direito de Portabilidade</h4>
                            <p>Receber seus dados em formato estruturado</p>
                        </div>
                    </div>
                </div>
                
                <div class="privacy-footer">
                    <button class="btn-secondary" id="btn-view-privacy-policy-center">
                        📋 Ver Política de Privacidade Completa
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupPrivacyCenterEvents(modal);
    }

    // Configurar eventos da central de privacidade
    setupPrivacyCenterEvents(modal) {
        // Fechar modal
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Tabs
        modal.querySelectorAll('.privacy-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                
                modal.querySelectorAll('.privacy-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.privacy-tab-content').forEach(c => c.style.display = 'none');
                
                e.target.classList.add('active');
                modal.querySelector(`#${targetTab}-tab`).style.display = 'block';
            });
        });

        // Revogar/Conceder consentimentos
        modal.querySelectorAll('.btn-revoke').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const consentType = e.target.dataset.consent;
                if (confirm('Tem certeza que deseja revogar este consentimento?')) {
                    await this.revokeConsent(consentType);
                    document.body.removeChild(modal);
                    this.showPrivacyCenter(); // Reabrir para atualizar
                }
            });
        });

        modal.querySelectorAll('.btn-grant').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const consentType = e.target.dataset.consent;
                await this.recordConsents([consentType], true);
                document.body.removeChild(modal);
                this.showPrivacyCenter(); // Reabrir para atualizar
            });
        });

        // Exportar dados
        modal.querySelector('#btn-export-data')?.addEventListener('click', async () => {
            await this.exportUserData();
        });

        // Solicitar exclusão
        modal.querySelector('#btn-request-deletion')?.addEventListener('click', async () => {
            await this.requestDataDeletion();
        });

        // Ver política
        modal.querySelector('#btn-view-privacy-policy-center')?.addEventListener('click', () => {
            this.showPrivacyPolicy();
        });
    }

    // Mostrar política de privacidade
    showPrivacyPolicy() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay privacy-policy-modal';
        modal.style.display = 'flex';
        
        modal.innerHTML = `
            <div class="modal-content privacy-policy-content">
                <button class="modal-close-btn">&times;</button>
                <div class="policy-header">
                    <h2>📋 Política de Privacidade</h2>
                    <p>Sistema de Neuropsicologia - Versão ${LGPD_CONFIG.CONSENT_VERSION}</p>
                </div>
                
                <div class="policy-content">
                    <div class="policy-section">
                        <h3>1. Coleta de Dados</h3>
                        <p>Coletamos dados pessoais necessários para prestação de serviços neuropsicológicos.</p>
                    </div>
                    <div class="policy-section">
                        <h3>2. Finalidade</h3>
                        <p>Utilizamos seus dados apenas para prestação de serviços neuropsicológicos.</p>
                    </div>
                    <div class="policy-section">
                        <h3>3. Seus Direitos</h3>
                        <p>Você tem direito ao acesso, correção e exclusão de seus dados conforme a LGPD.</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    // Obter título do consentimento
    getConsentTitle(consentType) {
        const titles = {
            data_processing: 'Processamento de Dados',
            data_storage: 'Armazenamento de Dados',
            clinical_data: 'Dados Clínicos',
            communication: 'Comunicações'
        };
        return titles[consentType] || consentType;
    }

    // Obter descrição do consentimento
    getConsentDescription(consentType) {
        const descriptions = {
            data_processing: 'Processamento dos seus dados pessoais para prestação de serviços',
            data_storage: 'Armazenamento seguro dos seus dados pelo período necessário',
            clinical_data: 'Tratamento de dados de saúde e informações clínicas',
            communication: 'Envio de comunicações relacionadas aos seus atendimentos'
        };
        return descriptions[consentType] || 'Consentimento para funcionalidade do sistema';
    }

    // Exportar dados do usuário
    async exportUserData() {
        try {
            const user = getCurrentUser();
            if (!user) return;

            showNotification('Preparando exportação de dados...', 'info');
            
            // Aqui você implementaria a coleta completa dos dados
            const userData = {
                exportDate: new Date().toISOString(),
                userId: user.uid,
                email: user.email,
                consentHistory: this.consentStatus.get(user.uid),
                // Adicionar outros dados conforme necessário
            };

            // Criar e baixar arquivo JSON
            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `meus_dados_${user.uid}_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            showNotification('Dados exportados com sucesso!', 'success');
            
            await logSecurityEvent('data_export_requested', {
                userId: user.uid,
                exportType: 'user_request'
            });
            
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            showNotification('Erro ao exportar dados. Tente novamente.', 'error');
        }
    }

    // Solicitar exclusão de dados
    async requestDataDeletion() {
        const user = getCurrentUser();
        if (!user) return;

        const confirmed = confirm(
            'ATENÇÃO: A exclusão de dados é irreversível e resultará na perda de todo seu histórico clínico. ' +
            'Esta ação só pode ser realizada se não houver obrigações legais de retenção. ' +
            'Deseja continuar?'
        );

        if (!confirmed) return;

        const reason = prompt('Por favor, informe o motivo da solicitação de exclusão:');
        if (!reason) return;

        try {
            // Registrar solicitação
            await addDoc(collection(db, 'data_deletion_requests'), {
                userId: user.uid,
                userEmail: user.email,
                reason: reason,
                requestDate: serverTimestamp(),
                status: 'pending',
                reviewRequired: true
            });

            await logSecurityEvent('data_deletion_requested', {
                userId: user.uid,
                reason: reason,
                requestMethod: 'user_interface'
            });

            showNotification(
                'Solicitação de exclusão de dados registrada. ' +
                'Nossa equipe analisará sua solicitação e entrará em contato em até 5 dias úteis.',
                'info'
            );

        } catch (error) {
            console.error('Erro ao solicitar exclusão de dados:', error);
            showNotification('Erro ao processar solicitação. Tente novamente.', 'error');
        }
    }

    // Obter IP do cliente
    async getClientIP() {
        try {
            // Em produção, implementar serviço real de IP
            return 'localhost';
        } catch {
            return 'unknown';
        }
    }
}

// Instância global do gerenciador LGPD
export const lgpdManager = new LGPDConsentManager();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    lgpdManager.initialize();
}); 