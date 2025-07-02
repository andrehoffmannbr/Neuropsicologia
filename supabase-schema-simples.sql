-- Schema PostgreSQL Simplificado para Sistema de Neuropsicologia
-- Compatível com o sistema atual (nomes de tabelas simples)

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USUÁRIOS (Sistema Local)
-- =====================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('coordenador', 'funcionario', 'estagiario')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- CLIENTES
-- =====================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    birth_date DATE,
    gender VARCHAR(20) CHECK (gender IN ('masculino', 'feminino', 'outro')),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    emergency_contact TEXT,
    medical_history TEXT,
    current_medications TEXT,
    observations TEXT,
    responsible_name VARCHAR(255),
    responsible_cpf VARCHAR(14),
    responsible_phone VARCHAR(20),
    relationship VARCHAR(100),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- AGENDAMENTOS
-- =====================

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    service_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'realizado', 'cancelado')),
    assigned_to_user_id UUID REFERENCES users(id),
    assigned_to_user_name VARCHAR(255),
    observations TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- ESTOQUE
-- =====================

CREATE TABLE stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'unidade',
    min_quantity INTEGER DEFAULT 5,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ativo',
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movimentações de estoque
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID REFERENCES stock_items(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('entrada', 'saida', 'ajuste')),
    quantity INTEGER NOT NULL,
    reason VARCHAR(255),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- FINANCEIRO
-- =====================

CREATE TABLE daily_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('receita', 'despesa', 'observacao')),
    value DECIMAL(10,2),
    content TEXT NOT NULL,
    date DATE NOT NULL,
    file_url TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- DOCUMENTOS
-- =====================

CREATE TABLE general_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    description TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- LOGS (LGPD)
-- =====================

CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES users(id),
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- ÍNDICES PARA PERFORMANCE
-- =====================

CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_cpf ON clients(cpf);
CREATE INDEX idx_schedules_date ON schedules(date);
CREATE INDEX idx_schedules_client ON schedules(client_id);
CREATE INDEX idx_daily_notes_date ON daily_notes(date);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp);

-- =====================
-- TRIGGERS PARA UPDATE_AT
-- =====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_notes_updated_at BEFORE UPDATE ON daily_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_general_documents_updated_at BEFORE UPDATE ON general_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- DADOS INICIAIS
-- =====================

-- Inserir usuários padrão
INSERT INTO users (username, email, password_hash, name, role) VALUES
('coordenador', 'coord@clinica.com', 'coord123', 'Dr. João Silva', 'coordenador'),
('funcionario', 'func@clinica.com', 'func123', 'Maria Santos', 'funcionario'),
('estagiario', 'intern@clinica.com', 'intern123', 'Pedro Costa', 'estagiario');

-- Inserir itens de estoque exemplo
INSERT INTO stock_items (name, description, quantity, unit, min_quantity, category, location) VALUES
('Canetas', 'Canetas esferográficas azuis', 50, 'unidade', 10, 'material-escritorio', 'Armário A1'),
('Papel A4', 'Folhas de papel A4 branco', 20, 'pacote', 5, 'material-escritorio', 'Armário A2'),
('Testes Psicológicos', 'Livros de testes padronizados', 15, 'unidade', 3, 'material-avaliacao', 'Estante B1');

-- Mensagem de sucesso
SELECT 'Schema criado com sucesso! Sistema pronto para uso.' AS resultado; 