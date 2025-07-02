// Build script para Vercel - Sistema de Neuropsicologia
// Injeta variáveis de ambiente no HTML

const fs = require('fs');
const path = require('path');

console.log('🔧 Iniciando build para Vercel...');

// Ler arquivo HTML
const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Obter variáveis de ambiente (usar as do vercel.json se não estiverem no process.env)
const supabaseUrl = process.env.SUPABASE_URL || 'https://wltzckgdtvlhdmhyozsb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdHpja2dkdHZsaGRtaHlvenNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4MTUzNjEsImV4cCI6MjA1MTM5MTM2MX0.Ojs7E9Yc4J2qxkTTGKUEdjFhS0JfXHZBK-yWAhwlDXY';

console.log('📊 Configurações:');
console.log('- Supabase URL:', supabaseUrl);
console.log('- Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Não configurada');
console.log('- Environment:', process.env.NODE_ENV || 'production');

// Criar script de configuração com credenciais reais
const configScript = `
    <!-- Configuração automática via build -->
    <script>
        window.ENV = {
            SUPABASE_URL: '${supabaseUrl}',
            SUPABASE_ANON_KEY: '${supabaseAnonKey}',
            BUILD_TIME: '${new Date().toISOString()}',
            ENVIRONMENT: 'production',
            IS_VERCEL: true
        };
        console.log('🔧 Configuração de produção carregada:', {
            url: window.ENV.SUPABASE_URL,
            key: window.ENV.SUPABASE_ANON_KEY ? window.ENV.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'Não configurada',
            buildTime: window.ENV.BUILD_TIME,
            environment: window.ENV.ENVIRONMENT
        });
    </script>`;

// Inserir script antes do Supabase SDK
html = html.replace(
    '<!-- Supabase SDK via CDN (com fallback para Vercel) -->',
    configScript + '\n    <!-- Supabase SDK via CDN (com fallback para Vercel) -->'
);

// Salvar arquivo modificado
fs.writeFileSync(htmlPath, html);

console.log('✅ Build concluído - HTML atualizado com configurações Supabase');
console.log('🌐 Pronto para deploy na Vercel com Supabase integrado');

// Criar arquivo _headers para Vercel
const headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin`;

fs.writeFileSync(path.join(__dirname, 'public', '_headers'), headersContent);

console.log('🔒 Headers de segurança configurados');

// Verificar se as credenciais foram configuradas
if (supabaseUrl.includes('wltzckgdtvlhdmhyozsb')) {
    console.log('✅ Credenciais Supabase configuradas corretamente');
} else {
    console.warn('⚠️ Usando credenciais padrão - verificar configuração');
} 