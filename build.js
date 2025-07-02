// Build script para Vercel - Sistema de Neuropsicologia
// Injeta variáveis de ambiente no HTML

const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando build para Vercel...');

// Ler arquivo HTML
const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Obter variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

console.log('📊 Configurações:');
console.log('- Supabase URL:', supabaseUrl);
console.log('- Anon Key:', supabaseAnonKey ? 'Configurada' : 'Não configurada');

// Criar script de configuração
const configScript = `
    <!-- Configuração automática via build -->
    <script>
        window.ENV = {
            SUPABASE_URL: '${supabaseUrl}',
            SUPABASE_ANON_KEY: '${supabaseAnonKey}',
            BUILD_TIME: '${new Date().toISOString()}',
            ENVIRONMENT: 'production'
        };
        console.log('🔧 Configuração de produção carregada:', window.ENV);
    </script>`;

// Inserir script antes do Supabase SDK
html = html.replace(
    '<!-- Supabase SDK via CDN (com fallback para Vercel) -->',
    configScript + '\n    <!-- Supabase SDK via CDN (com fallback para Vercel) -->'
);

// Salvar arquivo modificado
fs.writeFileSync(htmlPath, html);

console.log('✅ Build concluído - HTML atualizado com configurações');
console.log('🌐 Pronto para deploy na Vercel');

// Criar arquivo _headers para Vercel
const headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin`;

fs.writeFileSync(path.join(__dirname, 'public', '_headers'), headersContent);

console.log('🔒 Headers de segurança configurados'); 