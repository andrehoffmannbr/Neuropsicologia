// Data Validation and Sanitization Module
import { SECURITY_CONFIG } from './firebase-config.js';

// Validação de CPF
export function validateCPF(cpf) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validar primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    // Validar segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// Formatar CPF
export function formatCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Validação de CNPJ
export function validateCNPJ(cnpj) {
    if (!cnpj) return false;
    
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Validar primeiro dígito verificador
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;
    
    // Validar segundo dígito verificador
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) return false;
    
    return true;
}

// Validação de email
export function validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
}

// Validação de telefone brasileiro
export function validatePhone(phone) {
    if (!phone) return false;
    const phoneRegex = /^(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[0-9]{4}[-\s]?[0-9]{4}$/;
    return phoneRegex.test(phone);
}

// Formatar telefone
export function formatPhone(phone) {
    if (!phone) return '';
    phone = phone.replace(/[^\d]/g, '');
    
    if (phone.length === 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return phone;
}

// Validação de CEP
export function validateCEP(cep) {
    if (!cep) return false;
    const cepRegex = /^[0-9]{5}-?[0-9]{3}$/;
    return cepRegex.test(cep);
}

// Formatar CEP
export function formatCEP(cep) {
    if (!cep) return '';
    cep = cep.replace(/[^\d]/g, '');
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Validação de data
export function validateDate(dateString) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Verificar se é uma data válida
    if (isNaN(date.getTime())) return false;
    
    // Verificar se não é uma data futura (para data de nascimento)
    if (date > now) return false;
    
    // Verificar se não é muito antiga (mais de 120 anos)
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 120);
    if (date < minDate) return false;
    
    return true;
}

// Validação de idade mínima/máxima
export function validateAge(dateString, minAge = 0, maxAge = 120) {
    if (!validateDate(dateString)) return false;
    
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age >= minAge && age <= maxAge;
}

// Validação de senha forte
export function validatePassword(password) {
    if (!password) return { valid: false, errors: ['Senha é obrigatória'] };
    
    const errors = [];
    
    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
        errors.push(`Senha deve ter pelo menos ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} caracteres`);
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Senha deve conter pelo menos um número');
    }
    
    if (!/[^a-zA-Z0-9]/.test(password)) {
        errors.push('Senha deve conter pelo menos um caractere especial');
    }
    
    // Verificar senhas comuns
    const commonPasswords = [
        '123456', 'password', '123456789', '12345678', '12345',
        '1234567', '1234567890', 'qwerty', 'abc123', 'password123'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Senha muito comum, escolha uma senha mais segura');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Sanitização de texto (prevenção XSS)
export function sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

// Sanitização de HTML (mais permissiva, mas segura)
export function sanitizeHTML(html) {
    if (!html || typeof html !== 'string') return '';
    
    // Lista de tags permitidas
    const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p'];
    const allowedAttributes = [];
    
    // Remove scripts e outros elementos perigosos
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    html = html.replace(/javascript:/gi, '');
    html = html.replace(/on\w+\s*=/gi, '');
    
    return html.trim();
}

// Validação de arquivo
export function validateFile(file) {
    const errors = [];
    
    if (!file) {
        errors.push('Nenhum arquivo selecionado');
        return { valid: false, errors };
    }
    
    // Verificar tamanho
    if (file.size > SECURITY_CONFIG.FILE_MAX_SIZE) {
        errors.push(`Arquivo muito grande. Tamanho máximo: ${SECURITY_CONFIG.FILE_MAX_SIZE / 1024 / 1024}MB`);
    }
    
    // Verificar tipo
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(fileExtension)) {
        errors.push(`Tipo de arquivo não permitido. Tipos permitidos: ${SECURITY_CONFIG.ALLOWED_FILE_TYPES.join(', ')}`);
    }
    
    // Verificar nome do arquivo
    const filename = file.name;
    if (filename.length > 100) {
        errors.push('Nome do arquivo muito longo (máximo 100 caracteres)');
    }
    
    if (!/^[a-zA-Z0-9._-]+$/.test(filename.replace(/\.[^.]+$/, ''))) {
        errors.push('Nome do arquivo contém caracteres inválidos');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Sanitização de nome de arquivo
export function sanitizeFilename(filename) {
    if (!filename) return '';
    
    // Remover caracteres perigosos
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Limitar tamanho
    if (filename.length > 100) {
        const extension = filename.split('.').pop();
        const name = filename.substring(0, filename.lastIndexOf('.'));
        filename = name.substring(0, 100 - extension.length - 1) + '.' + extension;
    }
    
    return filename;
}

// Validação de campos obrigatórios em formulário
export function validateRequiredFields(formData, requiredFields) {
    const errors = [];
    
    for (const field of requiredFields) {
        if (!formData[field] || formData[field].toString().trim() === '') {
            errors.push(`Campo obrigatório: ${field}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Validação de formulário de cliente
export function validateClientForm(formData, isMinor = false) {
    const errors = [];
    
    // Campos obrigatórios
    const requiredFields = isMinor 
        ? ['name', 'birthDate', 'nomePai', 'nomeMae', 'telefonePai']
        : ['name', 'birthDate', 'cpf', 'email', 'phone'];
    
    const requiredValidation = validateRequiredFields(formData, requiredFields);
    if (!requiredValidation.valid) {
        errors.push(...requiredValidation.errors);
    }
    
    // Validações específicas
    if (formData.cpf && !validateCPF(formData.cpf)) {
        errors.push('CPF inválido');
    }
    
    if (formData.email && !validateEmail(formData.email)) {
        errors.push('Email inválido');
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
        errors.push('Telefone inválido');
    }
    
    if (formData.birthDate && !validateDate(formData.birthDate)) {
        errors.push('Data de nascimento inválida');
    }
    
    if (formData.cep && !validateCEP(formData.cep)) {
        errors.push('CEP inválido');
    }
    
    // Validar se menor é realmente menor de idade
    if (isMinor && formData.birthDate) {
        if (!validateAge(formData.birthDate, 0, 17)) {
            errors.push('Pessoa cadastrada como menor deve ter menos de 18 anos');
        }
    }
    
    // Validar se adulto é realmente maior de idade
    if (!isMinor && formData.birthDate) {
        if (!validateAge(formData.birthDate, 18, 120)) {
            errors.push('Pessoa cadastrada como adulto deve ter 18 anos ou mais');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}

// Rate limiting simples (implementação básica)
const rateLimitMap = new Map();

export function checkRateLimit(identifier, maxRequests = SECURITY_CONFIG.RATE_LIMIT.requests, windowMs = SECURITY_CONFIG.RATE_LIMIT.window) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpar entradas antigas
    for (const [key, requests] of rateLimitMap.entries()) {
        const filteredRequests = requests.filter(timestamp => timestamp > windowStart);
        if (filteredRequests.length === 0) {
            rateLimitMap.delete(key);
        } else {
            rateLimitMap.set(key, filteredRequests);
        }
    }
    
    // Verificar limite atual
    const currentRequests = rateLimitMap.get(identifier) || [];
    const recentRequests = currentRequests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
        return {
            allowed: false,
            resetTime: Math.ceil((recentRequests[0] + windowMs - now) / 1000)
        };
    }
    
    // Adicionar nova requisição
    recentRequests.push(now);
    rateLimitMap.set(identifier, recentRequests);
    
    return {
        allowed: true,
        remaining: maxRequests - recentRequests.length
    };
}

// Normalizar texto para busca
export function normalizeSearchText(text) {
    if (!text) return '';
    
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, '') // Remove caracteres especiais
        .trim();
}

// Mascarar dados sensíveis para logs
export function maskSensitiveData(data, fields = ['cpf', 'email', 'phone', 'password']) {
    const masked = { ...data };
    
    for (const field of fields) {
        if (masked[field]) {
            if (field === 'cpf') {
                masked[field] = masked[field].replace(/(\d{3})\d{3}(\d{3})/, '$1***$2');
            } else if (field === 'email') {
                const [user, domain] = masked[field].split('@');
                masked[field] = user.charAt(0) + '***@' + domain;
            } else if (field === 'phone') {
                masked[field] = masked[field].replace(/(\d{2})\d{4}(\d{4})/, '$1****$2');
            } else {
                masked[field] = '***';
            }
        }
    }
    
    return masked;
} 