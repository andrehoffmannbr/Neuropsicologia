-- Schema PostgreSQL para Sistema de Neuropsicologia
-- Substitui Firestore Collections por Tabelas SQL

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- AUTENTICAÇÃO E USUÁRIOS
-- =====================

-- Tabela de perfis de usuário (conecta com auth.users do Supabase)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('coordinator', 'staff', 'intern')),
    permissions TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- =====================
-- DADOS PRINCIPAIS
-- =====================

-- Clientes
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    cpf VARCHAR(14),
    birth_date DATE,
    address TEXT,
    responsible_name VARCHAR(255),
    responsible_phone VARCHAR(20),
    medical_history TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agendamentos
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled')),
    service_type VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estoque
CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 5,
    unit_price DECIMAL(10,2),
    supplier VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movimentações de estoque
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    reason VARCHAR(255),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Estagiários
CREATE TABLE interns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    cpf VARCHAR(14),
    address TEXT,
    institution VARCHAR(255),
    course VARCHAR(255),
    semester VARCHAR(50),
    supervisor VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- FINANCEIRO
-- =====================

-- Notas financeiras diárias
CREATE TABLE financial_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'note')),
    amount DECIMAL(10,2),
    date DATE NOT NULL,
    category VARCHAR(100),
    payment_method VARCHAR(100),
    status VARCHAR(50) DEFAULT 'confirmed',
    file_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- DOCUMENTOS E ARQUIVOS
-- =====================

-- Documentos gerais
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    client_id UUID REFERENCES clients(id), -- NULL se documento geral
    folder VARCHAR(255) DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- LOGS E AUDITORIA (LGPD)
-- =====================

-- Logs de segurança
CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs de atividade do usuário
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Logs de acesso a dados (LGPD)
CREATE TABLE data_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(50) NOT NULL CHECK (action IN ('read', 'create', 'update', 'delete')),
    user_id UUID REFERENCES auth.users(id),
    justification TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consentimentos LGPD
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    consent_type VARCHAR(100) NOT NULL,
    granted BOOLEAN NOT NULL,
    consent_version VARCHAR(10),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solicitações de exclusão de dados
CREATE TABLE data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'denied')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES auth.users(id)
);

-- =====================
-- ÍNDICES PARA PERFORMANCE
-- =====================

-- Índices para busca rápida
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_cpf ON clients(cpf);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_schedules_date ON schedules(appointment_date);
CREATE INDEX idx_schedules_client ON schedules(client_id);
CREATE INDEX idx_schedules_user ON schedules(user_id);
CREATE INDEX idx_financial_notes_date ON financial_notes(date);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX idx_data_access_logs_timestamp ON data_access_logs(timestamp);

-- =====================
-- ROW LEVEL SECURITY (RLS) - LGPD Compliance
-- =====================

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE interns ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso

-- Usuários podem ver/editar próprio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Coordenadores podem ver tudo
CREATE POLICY "Coordinators can view all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'coordinator'
        )
    );

-- Staff e Coordinators podem ver clientes
CREATE POLICY "Staff can view clients" ON clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('coordinator', 'staff')
        )
    );

-- Coordenadores podem inserir/editar
CREATE POLICY "Coordinators can manage data" ON clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'coordinator'
        )
    );

-- Estagiários só podem ver próprios agendamentos
CREATE POLICY "Interns can view own schedules" ON schedules
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('coordinator', 'staff')
        )
    );

-- Logs de segurança - apenas coordenadores
CREATE POLICY "Only coordinators can view security logs" ON security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'coordinator'
        )
    );

-- =====================
-- TRIGGERS PARA UPDATED_AT
-- =====================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em tabelas relevantes
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interns_updated_at BEFORE UPDATE ON interns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_notes_updated_at BEFORE UPDATE ON financial_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- FUNÇÕES STORED PROCEDURES
-- =====================

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, email, name, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'name', new.email),
        COALESCE(new.raw_user_meta_data->>'role', 'intern')
    );
    RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para buscar estatísticas do dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_clients', (SELECT COUNT(*) FROM clients WHERE status = 'active'),
        'total_schedules_today', (SELECT COUNT(*) FROM schedules WHERE DATE(appointment_date) = CURRENT_DATE),
        'total_interns', (SELECT COUNT(*) FROM interns WHERE status = 'active'),
        'low_stock_items', (SELECT COUNT(*) FROM stock_items WHERE quantity <= min_quantity),
        'recent_activities', (
            SELECT json_agg(json_build_object(
                'action', action,
                'timestamp', timestamp,
                'user_name', up.name
            ))
            FROM user_activity_logs ual
            JOIN user_profiles up ON ual.user_id = up.user_id
            WHERE ual.timestamp >= NOW() - INTERVAL '24 hours'
            ORDER BY ual.timestamp DESC
            LIMIT 10
        )
    ) INTO result;
    
    RETURN result;
END;
$$ language plpgsql security definer;

-- =====================
-- DADOS INICIAIS
-- =====================

-- Inserir usuários iniciais (será feito via script separado)

COMMENT ON DATABASE postgres IS 'Sistema de Neuropsicologia - Supabase PostgreSQL';
COMMENT ON TABLE user_profiles IS 'Perfis de usuário do sistema';
COMMENT ON TABLE clients IS 'Cadastro de clientes/pacientes';
COMMENT ON TABLE schedules IS 'Agendamentos e consultas';
COMMENT ON TABLE stock_items IS 'Itens do estoque';
COMMENT ON TABLE financial_notes IS 'Notas financeiras diárias';
COMMENT ON TABLE security_logs IS 'Logs de segurança para auditoria';
COMMENT ON TABLE data_access_logs IS 'Logs de acesso a dados (LGPD)';

-- Schema criado com sucesso!
-- Execute este arquivo no SQL Editor do Supabase Dashboard 