// File Upload Module - Sistema de Upload Seguro
// Usa instâncias globais do Firebase configuradas no HTML

import { storage, SECURITY_CONFIG } from './firebase-config.js';
import { validateFile, sanitizeFilename } from './validation.js';
import { logSecurityEvent, logDataAccess } from './security-logger.js';
import { getCurrentUser } from './auth.js';
import { showNotification } from './ui.js';

// Funções Firebase Storage usando simulação local
async function uploadBytes(storageRef, file) {
    console.log('📁 Arquivo simulado para upload:', storageRef.path, file.name);
    
    // Simular upload bem-sucedido
    const fakeUrl = `https://storage.googleapis.com/fake-bucket/${storageRef.path}`;
    
    // Salvar metadados no localStorage
    const metadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        uploadedAt: new Date().toISOString(),
        uploadedBy: getCurrentUser()?.username || 'unknown',
        url: fakeUrl
    };
    
    localStorage.setItem(`upload_${storageRef.path}`, JSON.stringify(metadata));
    
    return { ref: storageRef, metadata };
}

async function getDownloadURL(storageRef) {
    const metadata = localStorage.getItem(`upload_${storageRef.path}`);
    if (metadata) {
        return JSON.parse(metadata).url;
    }
    return `https://storage.googleapis.com/fake-bucket/${storageRef.path}`;
}

async function deleteObject(storageRef) {
    localStorage.removeItem(`upload_${storageRef.path}`);
    console.log('🗑️ Arquivo simulado deletado:', storageRef.path);
    return true;
}

async function listAll(storageRef) {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(`upload_${storageRef.path}`)) {
            items.push({
                name: key.replace(`upload_${storageRef.path}/`, ''),
                fullPath: key.replace('upload_', '')
            });
        }
    }
    return { items };
}

function ref(storage, path) {
    return { path };
}

// Cache de URLs de download para evitar chamadas desnecessárias
const downloadURLCache = new Map();

// Contador de uploads ativos
let activeUploads = 0;
const MAX_CONCURRENT_UPLOADS = 3;

// Fila de uploads
const uploadQueue = [];

// Upload de arquivo com validação e segurança
export async function uploadFile(file, path, metadata = {}) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        // Validar arquivo
        const validation = validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.errors.join('\n'));
        }

        // Sanitizar nome do arquivo
        const originalName = file.name;
        const sanitizedName = sanitizeFilename(originalName);
        
        // Verificar fila de uploads
        if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
            return new Promise((resolve, reject) => {
                uploadQueue.push({ file, path, metadata, resolve, reject });
                showNotification('Upload adicionado à fila...', 'info');
            });
        }

        activeUploads++;
        updateUploadProgress(0, `Iniciando upload de ${sanitizedName}...`);

        // Criar referência com timestamp para evitar conflitos
        const timestamp = Date.now();
        const fileExtension = sanitizedName.split('.').pop();
        const baseName = sanitizedName.replace(/\.[^/.]+$/, '');
        const finalPath = `${path}/${baseName}_${timestamp}.${fileExtension}`;
        
        const storageRef = ref(storage, finalPath);

        // Metadados enriquecidos
        const enrichedMetadata = {
            contentType: file.type,
            customMetadata: {
                originalName: originalName,
                sanitizedName: sanitizedName,
                uploadedBy: user.uid,
                uploadedByEmail: user.email,
                uploadedByRole: user.role,
                uploadTimestamp: new Date().toISOString(),
                fileSize: file.size.toString(),
                ...metadata
            }
        };

        // Upload do arquivo
        const snapshot = await uploadBytes(storageRef, file, enrichedMetadata);
        
        updateUploadProgress(100, `Upload de ${sanitizedName} concluído!`);

        // Obter URL de download
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        // Cache da URL
        downloadURLCache.set(finalPath, {
            url: downloadURL,
            timestamp: Date.now()
        });

        // Log de segurança
        await logSecurityEvent('file_upload', {
            fileName: sanitizedName,
            filePath: finalPath,
            fileSize: file.size,
            fileType: file.type,
            uploadedBy: user.uid,
            userRole: user.role
        });

        // Log de acesso a dados
        await logDataAccess('file', finalPath, 'create', {
            fileName: sanitizedName,
            fileSize: file.size
        });

        activeUploads--;
        processUploadQueue();

        showNotification(`Arquivo ${sanitizedName} enviado com sucesso!`, 'success');

        return {
            path: finalPath,
            downloadURL: downloadURL,
            metadata: snapshot.metadata,
            sanitizedName: sanitizedName
        };

    } catch (error) {
        activeUploads--;
        processUploadQueue();
        
        await logSecurityEvent('file_upload_failed', {
            fileName: file?.name || 'unknown',
            error: error.message,
            uploadedBy: getCurrentUser()?.uid
        });

        console.error('Erro no upload:', error);
        showNotification(`Erro no upload: ${error.message}`, 'error');
        throw error;
    }
}

// Processar fila de uploads
async function processUploadQueue() {
    if (uploadQueue.length === 0 || activeUploads >= MAX_CONCURRENT_UPLOADS) {
        return;
    }

    const nextUpload = uploadQueue.shift();
    try {
        const result = await uploadFile(
            nextUpload.file, 
            nextUpload.path, 
            nextUpload.metadata
        );
        nextUpload.resolve(result);
    } catch (error) {
        nextUpload.reject(error);
    }
}

// Atualizar progresso do upload
function updateUploadProgress(percentage, message) {
    // Dispatchar evento personalizado para componentes UI
    window.dispatchEvent(new CustomEvent('uploadProgress', {
        detail: { percentage, message }
    }));
}

// Download seguro de arquivo
export async function downloadFile(filePath, fileName = null) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        // Verificar cache primeiro
        const cached = downloadURLCache.get(filePath);
        if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hora
            return cached.url;
        }

        // Obter URL do Firebase Storage
        const storageRef = ref(storage, filePath);
        const downloadURL = await getDownloadURL(storageRef);

        // Atualizar cache
        downloadURLCache.set(filePath, {
            url: downloadURL,
            timestamp: Date.now()
        });

        // Log de acesso
        await logDataAccess('file', filePath, 'read', {
            fileName: fileName || filePath.split('/').pop()
        });

        return downloadURL;

    } catch (error) {
        await logSecurityEvent('file_download_failed', {
            filePath: filePath,
            error: error.message,
            requestedBy: getCurrentUser()?.uid
        });

        console.error('Erro no download:', error);
        throw error;
    }
}

// Deletar arquivo
export async function deleteFile(filePath, reason = 'Usuário solicitou exclusão') {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);

        // Remover do cache
        downloadURLCache.delete(filePath);

        // Log de segurança
        await logSecurityEvent('file_deletion', {
            filePath: filePath,
            reason: reason,
            deletedBy: user.uid,
            userRole: user.role
        });

        // Log de acesso a dados
        await logDataAccess('file', filePath, 'delete', {
            reason: reason
        });

        showNotification('Arquivo deletado com sucesso!', 'success');

    } catch (error) {
        await logSecurityEvent('file_deletion_failed', {
            filePath: filePath,
            error: error.message,
            requestedBy: getCurrentUser()?.uid
        });

        console.error('Erro ao deletar arquivo:', error);
        showNotification(`Erro ao deletar arquivo: ${error.message}`, 'error');
        throw error;
    }
}

// Listar arquivos em diretório
export async function listFiles(directoryPath, maxResults = 100) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        const storageRef = ref(storage, directoryPath);
        const listResult = await listAll(storageRef);

        const files = [];

        // Processar até o limite máximo
        const itemsToProcess = listResult.items.slice(0, maxResults);

        for (const itemRef of itemsToProcess) {
            try {
                const metadata = await itemRef.getMetadata();
                const downloadURL = await getDownloadURL(itemRef);

                files.push({
                    name: itemRef.name,
                    fullPath: itemRef.fullPath,
                    downloadURL: downloadURL,
                    size: metadata.size,
                    contentType: metadata.contentType,
                    timeCreated: metadata.timeCreated,
                    customMetadata: metadata.customMetadata || {}
                });

                // Cache da URL
                downloadURLCache.set(itemRef.fullPath, {
                    url: downloadURL,
                    timestamp: Date.now()
                });

            } catch (itemError) {
                console.warn(`Erro ao processar item ${itemRef.name}:`, itemError);
            }
        }

        // Log de acesso
        await logDataAccess('file_list', directoryPath, 'read', {
            resultCount: files.length,
            directoryPath: directoryPath
        });

        return {
            files: files,
            hasMore: listResult.items.length > maxResults,
            totalItems: listResult.items.length
        };

    } catch (error) {
        await logSecurityEvent('file_list_failed', {
            directoryPath: directoryPath,
            error: error.message,
            requestedBy: getCurrentUser()?.uid
        });

        console.error('Erro ao listar arquivos:', error);
        throw error;
    }
}

// Upload múltiplo de arquivos
export async function uploadMultipleFiles(files, basePath, onProgress = null) {
    try {
        if (!files || files.length === 0) {
            throw new Error('Nenhum arquivo selecionado');
        }

        if (files.length > 10) {
            throw new Error('Máximo de 10 arquivos por vez');
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < files.length; i++) {
            try {
                if (onProgress) {
                    onProgress(i, files.length, files[i].name);
                }

                const result = await uploadFile(files[i], basePath);
                results.push(result);

            } catch (error) {
                errors.push({
                    file: files[i].name,
                    error: error.message
                });
            }
        }

        if (onProgress) {
            onProgress(files.length, files.length, 'Concluído');
        }

        // Log do upload múltiplo
        await logSecurityEvent('multiple_file_upload', {
            totalFiles: files.length,
            successCount: results.length,
            errorCount: errors.length,
            uploadedBy: getCurrentUser()?.uid
        });

        if (errors.length > 0) {
            const errorMessage = `${errors.length} arquivo(s) falharam no upload:\n${errors.map(e => `${e.file}: ${e.error}`).join('\n')}`;
            showNotification(errorMessage, 'warning');
        }

        if (results.length > 0) {
            showNotification(`${results.length} arquivo(s) enviado(s) com sucesso!`, 'success');
        }

        return {
            successful: results,
            failed: errors,
            totalProcessed: files.length
        };

    } catch (error) {
        console.error('Erro no upload múltiplo:', error);
        showNotification(`Erro no upload múltiplo: ${error.message}`, 'error');
        throw error;
    }
}

// Verificar se arquivo existe
export async function fileExists(filePath) {
    try {
        const storageRef = ref(storage, filePath);
        await storageRef.getMetadata();
        return true;
    } catch (error) {
        if (error.code === 'storage/object-not-found') {
            return false;
        }
        throw error;
    }
}

// Obter metadados do arquivo
export async function getFileMetadata(filePath) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('Usuário não autenticado');
        }

        const storageRef = ref(storage, filePath);
        const metadata = await storageRef.getMetadata();

        // Log de acesso
        await logDataAccess('file_metadata', filePath, 'read');

        return metadata;

    } catch (error) {
        console.error('Erro ao obter metadados:', error);
        throw error;
    }
}

// Limpar cache de URLs
export function clearDownloadURLCache() {
    downloadURLCache.clear();
}

// Limpar cache antigo (executar periodicamente)
export function cleanupOldCache(maxAge = 3600000) { // 1 hora
    const now = Date.now();
    for (const [path, data] of downloadURLCache.entries()) {
        if (now - data.timestamp > maxAge) {
            downloadURLCache.delete(path);
        }
    }
}

// Obter estatísticas de upload
export function getUploadStats() {
    return {
        activeUploads: activeUploads,
        queueLength: uploadQueue.length,
        cacheSize: downloadURLCache.size,
        maxConcurrentUploads: MAX_CONCURRENT_UPLOADS
    };
}

// Configurar limpeza automática do cache
setInterval(() => {
    cleanupOldCache();
}, 30 * 60 * 1000); // A cada 30 minutos

// Utilitário para criar preview de imagem
export function createImagePreview(file, maxWidth = 300, maxHeight = 300) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('Arquivo não é uma imagem'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calcular dimensões mantendo proporção
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // Desenhar imagem redimensionada
                ctx.drawImage(img, 0, 0, width, height);

                // Converter para data URL
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
} 