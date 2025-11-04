-- Habilitar a extensão para gerar UUIDs (IDs únicos)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



----------------------------------------------------

-- 1. ENUMS (Tipos pré-definidos)

-- Usar Enums torna os dados mais consistentes

----------------------------------------------------



CREATE TYPE user_role AS ENUM (

  'admin',        -- G2: ADM (Controle total)

  'corretor',     -- G1: Portal Corretor
);



CREATE TYPE imovel_status AS ENUM (

  'disponivel',

  'reservado',

  'alugado',

  'vendido',

  'inativo'       -- Imóvel captado mas ainda não publicado

);



CREATE TYPE imovel_tipo AS ENUM (

  'apartamento',

  'casa',

  'terreno',

  'comercial',

  'rural'

);



CREATE TYPE lead_status AS ENUM (

  'novo',         -- B2: Pipeline

  'qualificado',

  'visita_agendada',

  'proposta_feita',

  'documentacao',

  'concluido',

  'perdido'

);



CREATE TYPE contrato_tipo AS ENUM (

  'locacao',

  'venda',

  'administracao' -- D1: Contrato entre imobiliária e proprietário

);



CREATE TYPE transacao_tipo AS ENUM (

  'receita_aluguel',

  'taxa_adm_imobiliaria',

  'repasse_proprietario',

  'comissao_corretor',

  'despesa_manutencao',

  'pagamento_iptu',

  'pagamento_condominio'

);



CREATE TYPE transacao_status AS ENUM (

  'pendente',

  'pago',

  'atrasado',

  'cancelado'

);



CREATE TYPE os_status AS ENUM (

  'aberta',

  'orcamento',

  'aprovada_pelo_inquilino',

  'aprovada_pelo_proprietario',

  'em_execucao',

  'concluida',

  'cancelada'

);





----------------------------------------------------

-- 2. TABELAS (Estrutura Principal)

----------------------------------------------------



-- Tabela de Perfis (Usuários)

-- Ligada diretamente ao auth.users do Supabase.

-- Cobre Módulos J2, G1, G2, G3.

CREATE TABLE public.profiles (

  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  nome_completo TEXT NOT NULL,

  email TEXT NOT NULL UNIQUE,

  cpf_cnpj TEXT UNIQUE,

  telefone TEXT,

  role user_role NOT NULL DEFAULT 'cliente',

  creci TEXT, -- Específico para 'corretor'

  dados_bancarios_json JSONB, -- Para repasses (Proprietário)

  updated_at TIMESTAMPTZ DEFAULT NOW()

);



-- Tabela de Imóveis

-- Cobre Módulos A1, A2, C1, C2, C3.

CREATE TABLE public.imoveis (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  proprietario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  codigo_ref TEXT NOT NULL UNIQUE,

  titulo TEXT NOT NULL,

  descricao TEXT,

 

  -- Endereço (A1)

  endereco_cep TEXT,

  endereco_logradouro TEXT,

  endereco_numero TEXT,

  endereco_bairro TEXT,

  endereco_cidade TEXT,

  endereco_estado CHAR(2),

 

  -- Características (A1, C1)

  tipo imovel_tipo NOT NULL,

  status imovel_status NOT NULL DEFAULT 'inativo',

  preco_venda DECIMAL(12, 2),

  preco_locacao DECIMAL(10, 2),

  valor_condominio DECIMAL(10, 2),

  valor_iptu DECIMAL(10, 2),

  area_total INT,

  quartos INT DEFAULT 0,

  banheiros INT DEFAULT 0,

  vagas_garagem INT DEFAULT 0,

  pet_friendly BOOLEAN DEFAULT FALSE,

  mobiliado BOOLEAN DEFAULT FALSE,



  -- Mídias (C3) - URLs das fotos/plantas virão dos Buckets

  -- Compliance (C4)

  documentos_compliance_json JSONB, -- { "matricula_url": "...", "habitese_url": "..." }

 

  -- Controle (C1)

  chaves_localizacao TEXT, -- Ex: "Portaria", "Escritório"

 

  created_at TIMESTAMPTZ DEFAULT NOW(),

  updated_at TIMESTAMPTZ DEFAULT NOW()

);



-- Tabela de Leads (CRM)

-- Cobre Módulo B1, B2.

CREATE TABLE public.leads (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  corretor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Corretor responsável

  nome TEXT NOT NULL,

  email TEXT,

  telefone TEXT NOT NULL,

  status lead_status NOT NULL DEFAULT 'novo',

  origem TEXT, -- Ex: 'Site', 'WhatsApp', 'Indicacao' (B1)

  perfil_busca_json JSONB, -- B1: Orçamento, Bairro-alvo, Pet, etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),

  updated_at TIMESTAMPTZ DEFAULT NOW()

);



-- Tabela de Propostas

-- Cobre Módulo B4.

CREATE TABLE public.propostas (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  imovel_id UUID NOT NULL REFERENCES public.imoveis(id),

  lead_id UUID NOT NULL REFERENCES public.leads(id),

  cliente_id UUID REFERENCES public.profiles(id), -- O Lead pode virar um Profile

  corretor_id UUID NOT NULL REFERENCES public.profiles(id),

  valor_proposta DECIMAL(12, 2) NOT NULL,

  condicao_garantia TEXT, -- 'Fiador', 'Seguro Fiança', 'Caução' (B4)

  status TEXT NOT NULL DEFAULT 'enviada', -- 'enviada', 'aceita', 'recusada', 'negociando'

  created_at TIMESTAMPTZ DEFAULT NOW()

);



-- Tabela de Contratos

-- Cobre Módulos D, K.

CREATE TABLE public.contratos (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  imovel_id UUID NOT NULL REFERENCES public.imoveis(id),

  proprietario_id UUID NOT NULL REFERENCES public.profiles(id),

  inquilino_id UUID NOT NULL REFERENCES public.profiles(id),

 

  tipo contrato_tipo NOT NULL,

  data_inicio DATE NOT NULL,

  data_fim DATE NOT NULL,

  valor_acordado DECIMAL(10, 2) NOT NULL, -- Valor do aluguel/venda

  taxa_administracao_percent DECIMAL(5, 2), -- % da imobiliária (E1)

  dia_vencimento_aluguel INT, -- (D3)

  indice_reajuste TEXT, -- 'IGPM', 'IPCA' (D3)

 

  status TEXT NOT NULL DEFAULT 'ativo', -- 'ativo', 'encerrado', 'rescindido'

  documento_assinado_url TEXT, -- D2: Link para o Bucket 'documentos-contratos'

 

  created_at TIMESTAMPTZ DEFAULT NOW()

);



-- Tabela de Transações Financeiras (Simplificada)

-- Cobre Módulos E, K2, K3. (Junta Contas a Pagar e Receber)

CREATE TABLE public.transacoes (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  contrato_id UUID REFERENCES public.contratos(id), -- Linka a um contrato (se for aluguel)

  imovel_id UUID REFERENCES public.imoveis(id),

  profile_id UUID REFERENCES public.profiles(id), -- Quem paga ou quem recebe

 

  tipo transacao_tipo NOT NULL,

  status transacao_status NOT NULL DEFAULT 'pendente',

  descricao TEXT NOT NULL,

  valor DECIMAL(10, 2) NOT NULL,

  data_vencimento DATE NOT NULL,

  data_pagamento DATE,

 

  -- E1: PIX, Boleto

  dados_cobranca_json JSONB, -- { "pix_copia_cola": "...", "boleto_linha": "..." }

 

  created_at TIMESTAMPTZ DEFAULT NOW()

);



-- Tabela de Ordens de Serviço (Manutenção)

-- Cobre Módulo F, K7.

CREATE TABLE public.ordens_servico (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  imovel_id UUID NOT NULL REFERENCES public.imoveis(id),

  contrato_id UUID REFERENCES public.contratos(id), -- Qual contrato solicitou

  solicitante_id UUID NOT NULL REFERENCES public.profiles(id), -- Inquilino ou Proprietário

 

  descricao_problema TEXT NOT NULL,

  status os_status NOT NULL DEFAULT 'aberta',

 

  -- F1: Orçamentos

  orcamentos_json JSONB, -- [{ "prestador": "Zé", "valor": 100, "url": "..." }]

 

  custo_final DECIMAL(10, 2),

  prestador_aprovado TEXT,

 

  created_at TIMESTAMPTZ DEFAULT NOW(),

  updated_at TIMESTAMPTZ DEFAULT NOW()

);



-- Tabela de Vistorias

-- Cobre Módulo F2, K6.

CREATE TABLE public.vistorias (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  imovel_id UUID NOT NULL REFERENCES public.imoveis(id),

  contrato_id UUID NOT NULL REFERENCES public.contratos(id),

  tipo TEXT NOT NULL, -- 'entrada', 'saida'

  data_vistoria DATE NOT NULL,

  laudo_descricao TEXT,

  -- Fotos e laudo assinado vão para o Bucket 'documentos-vistorias'

  documento_laudo_url TEXT,

 

  created_at TIMESTAMPTZ DEFAULT NOW()

);



-- Tabela de Agenda (Corretores/Admin)

-- Cobre Módulo B3.

CREATE TABLE public.agenda_eventos (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  profile_id UUID NOT NULL REFERENCES public.profiles(id), -- Dono do evento

  lead_id UUID REFERENCES public.leads(id),

  imovel_id UUID REFERENCES public.imoveis(id),

 

  titulo TEXT NOT NULL,

  tipo TEXT NOT NULL, -- 'visita_presencial', 'visita_virtual', 'follow_up', 'documentacao'

  data_inicio TIMESTAMPTZ NOT NULL,

  data_fim TIMESTAMPTZ NOT NULL,

 

  created_at TIMESTAMPTZ DEFAULT NOW()

);


----------------------------------------------------

-- 4. TRIGGERS e FUNÇÕES (Automação)

----------------------------------------------------



-- Função para criar um 'profile' automaticamente

-- quando um novo usuário se registra no Supabase (auth.users).

CREATE OR REPLACE FUNCTION public.handle_new_user()

RETURNS TRIGGER AS $$

BEGIN

  INSERT INTO public.profiles (id, email, nome_completo)

  VALUES (new.id, new.email, new.raw_user_meta_data->>'nome_completo');

  RETURN new;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;



-- Aciona a função acima em cada novo registro de usuário

CREATE TRIGGER on_auth_user_created

  AFTER INSERT ON auth.users

  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();



-- Função auxiliar para RLS (pegar o 'role' do usuário logado)

CREATE OR REPLACE FUNCTION public.get_my_role()

RETURNS user_role AS $$

DECLARE

  user_role user_role;

BEGIN

  IF auth.uid() IS NULL THEN

    RETURN NULL;

  END IF;

  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();

  RETURN user_role;

END;

$$ LANGUAGE plpgsql SECURITY DEFINER;





----------------------------------------------------

-- 5. POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)

-- O "código simples" para segurança no Supabase.

-- Por padrão, NINGUÉM pode ver NADA.

----------------------------------------------------



-- Habilitar RLS em todas as tabelas

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.imoveis ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vistorias ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.agenda_eventos ENABLE ROW LEVEL SECURITY;



---

-- Regras para: profiles

---

-- Admins veem e gerenciam todos os perfis.

CREATE POLICY "RLS_Admin_all_profiles"

  ON public.profiles FOR ALL

  USING (get_my_role() = 'admin');



-- Corretores veem perfis de clientes, proprietários e inquilinos.

CREATE POLICY "RLS_Corretor_select_clientes"

  ON public.profiles FOR SELECT

  USING (get_my_role() = 'corretor');



-- Usuário pode ver e editar o SEU PRÓPRIO perfil.

CREATE POLICY "RLS_Usuario_self_access_profiles"

  ON public.profiles FOR ALL

  USING (auth.uid() = id);



---

-- Regras para: imoveis (Módulo A - Vitrine Pública)

---

-- REGRA PÚBLICA: Todos (anon) podem ver imóveis 'disponiveis'.

CREATE POLICY "RLS_Public_select_imoveis_disponiveis"

  ON public.imoveis FOR SELECT

  USING (status = 'disponivel');



-- Admins e Corretores podem gerenciar (CRUD) todos os imóveis.

CREATE POLICY "RLS_AdminCorretor_all_imoveis"

  ON public.imoveis FOR ALL

  USING (get_my_role() IN ('admin', 'corretor'));



-- Proprietário pode ver SEUS imóveis.

CREATE POLICY "RLS_Proprietario_select_own_imoveis"

  ON public.imoveis FOR SELECT

  USING (get_my_role() = 'proprietario' AND proprietario_id = auth.uid());



---

-- Regras para: leads, propostas, agenda (Módulos B, G1)

---

-- Admins e Corretores podem gerenciar (CRUD) leads, propostas e agenda.

CREATE POLICY "RLS_AdminCorretor_all_crm"

  ON public.leads FOR ALL

  USING (get_my_role() IN ('admin', 'corretor'));

 

CREATE POLICY "RLS_AdminCorretor_all_propostas"

  ON public.propostas FOR ALL

  USING (get_my_role() IN ('admin', 'corretor'));



CREATE POLICY "RLS_AdminCorretor_all_agenda"

  ON public.agenda_eventos FOR ALL

  USING (get_my_role() IN ('admin', 'corretor'));



---

-- Regras para: contratos, transacoes (Módulos D, E, K)

---

-- Admins podem gerenciar (CRUD) tudo de financeiro e contratos.

CREATE POLICY "RLS_Admin_all_contratos_transacoes"

  ON public.contratos FOR ALL

  USING (get_my_role() = 'admin');

 

CREATE POLICY "RLS_Admin_all_transacoes"

  ON public.transacoes FOR ALL

  USING (get_my_role() = 'admin');



-- Proprietário pode ver SEUS contratos e transações.

CREATE POLICY "RLS_Proprietario_select_own_contratos"

  ON public.contratos FOR SELECT

  USING (get_my_role() = 'proprietario' AND proprietario_id = auth.uid());

 

CREATE POLICY "RLS_Proprietario_select_own_transacoes"

  ON public.transacoes FOR SELECT

  USING (get_my_role() = 'proprietario' AND profile_id = auth.uid());



-- Inquilino pode ver SEUS contratos e transações.

CREATE POLICY "RLS_Inquilino_select_own_contratos"

  ON public.contratos FOR SELECT

  USING (get_my_role() = 'inquilino' AND inquilino_id = auth.uid());

 

CREATE POLICY "RLS_Inquilino_select_own_transacoes"

  ON public.transacoes FOR SELECT

  USING (get_my_role() = 'inquilino' AND profile_id = auth.uid());



---

-- Regras para: ordens_servico, vistorias (Módulo F, K)

---

-- Admins podem gerenciar (CRUD) OS e Vistorias.

CREATE POLICY "RLS_Admin_all_manutencao"

  ON public.ordens_servico FOR ALL

  USING (get_my_role() = 'admin');



CREATE POLICY "RLS_Admin_all_vistorias"

  ON public.vistorias FOR ALL

  USING (get_my_role() = 'admin');



-- Inquilino pode ABRIR OS e ver as OS do seu contrato.

CREATE POLICY "RLS_Inquilino_access_os"

  ON public.ordens_servico FOR ALL

  USING (

    get_my_role() = 'inquilino' AND

    contrato_id IN (SELECT id FROM public.contratos WHERE inquilino_id = auth.uid())

  );

 

-- Proprietário pode ver as OS dos seus imóveis.

CREATE POLICY "RLS_Proprietario_select_os"

  ON public.ordens_servico FOR SELECT

  USING (

    get_my_role() = 'proprietario' AND

    imovel_id IN (SELECT id FROM public.imoveis WHERE proprietario_id = auth.uid())

  );

 

-- Inquilino/Proprietário podem ver as vistorias dos seus contratos.

CREATE POLICY "RLS_InquilinoProp_select_vistorias"

  ON public.vistorias FOR SELECT

  USING (

    (get_my_role() = 'inquilino' AND contrato_id IN (SELECT id FROM public.contratos WHERE inquilino_id = auth.uid())) OR

    (get_my_role() = 'proprietario' AND contrato_id IN (SELECT id FROM public.contratos WHERE proprietario_id = auth.uid()))

  );






----------------------------------------------------

-- Bucket: imoveis_media (Fotos/Plantas Públicas)

----------------------------------------------------



-- 1. Política de Leitura Pública (SELECT)

-- Permite que QUALQUER pessoa (mesmo deslogada) veja as fotos.

CREATE POLICY "Public Read Access"

ON storage.objects FOR SELECT

USING ( bucket_id = 'imoveis_media' );



-- 2. Política de Escrita (INSERT) para Admin/Corretor

-- Permite que 'admin' e 'corretor' façam upload de novas fotos.

CREATE POLICY "Admin/Corretor Insert Access"

ON storage.objects FOR INSERT

WITH CHECK (

  bucket_id = 'imoveis_media' AND

  (SELECT get_my_role()) IN ('admin', 'corretor')

);



-- 3. Política de Atualização (UPDATE) para Admin/Corretor

CREATE POLICY "Admin/Corretor Update Access"

ON storage.objects FOR UPDATE

USING (

  bucket_id = 'imoveis_media' AND

  (SELECT get_my_role()) IN ('admin', 'corretor')

);



-- 4. Política de Remoção (DELETE) para Admin/Corretor

CREATE POLICY "Admin/Corretor Delete Access"

ON storage.objects FOR DELETE

USING (

  bucket_id = 'imoveis_media' AND

  (SELECT get_my_role()) IN ('admin', 'corretor')

);





----------------------------------------------------

-- Bucket: documentos_kyc (RG/CPF de Clientes)

-- CONVENÇÃO: Os arquivos devem ser salvos em pastas

-- com o ID do usuário. Ex: 'user_id_xyz/rg_frente.pdf'

----------------------------------------------------



-- 1. Acesso total para Admins

CREATE POLICY "Admin Full Access KYC"

ON storage.objects FOR ALL

USING (

  bucket_id = 'documentos_kyc' AND

  (SELECT get_my_role()) = 'admin'

);



-- 2. Usuário pode LER e ESCREVER (CRUD) seus próprios documentos

-- (storage.foldername(name))[1] pega o nome da primeira pasta (que deve ser o user_id)

CREATE POLICY "User Full Access Own KYC Docs"

ON storage.objects FOR ALL

USING (

  bucket_id = 'documentos_kyc' AND

  auth.uid() = (storage.foldername(name))[1]::uuid

);





----------------------------------------------------

-- Bucket: documentos_contratos (Contratos Assinados)

-- CONVENÇÃO: Os arquivos devem ser salvos em pastas

-- com o ID do contrato. Ex: 'contrato_id_abc/contrato_locacao.pdf'

----------------------------------------------------



-- 1. Acesso total para Admins

CREATE POLICY "Admin Full Access Contratos"

ON storage.objects FOR ALL

USING (

  bucket_id = 'documentos_contratos' AND

  (SELECT get_my_role()) = 'admin'

);



-- 2. Inquilino e Proprietário podem LER seus próprios contratos

CREATE POLICY "User Read Own Contratos"

ON storage.objects FOR SELECT

USING (

  bucket_id = 'documentos_contratos' AND

  (

    -- Verifica se o ID da pasta do arquivo existe na tabela 'contratos'

    -- onde o usuário logado é o inquilino.

    (

      (SELECT get_my_role()) = 'inquilino' AND

      (storage.foldername(name))[1]::uuid IN (

        SELECT id FROM public.contratos WHERE inquilino_id = auth.uid()

      )

    ) OR

    -- Ou verifica se ele é o proprietário

    (

      (SELECT get_my_role()) = 'proprietario' AND

      (storage.foldername(name))[1]::uuid IN (

        SELECT id FROM public.contratos WHERE proprietario_id = auth.uid()

      )

    )

  )

);





----------------------------------------------------

-- Bucket: documentos_vistorias (Laudos de Entrada/Saída)

-- CONVENÇÃO: Os arquivos devem ser salvos em pastas

-- com o ID do contrato. Ex: 'contrato_id_abc/vistoria_entrada.pdf'

----------------------------------------------------



-- 1. Acesso total para Admins

CREATE POLICY "Admin Full Access Vistorias"

ON storage.objects FOR ALL

USING (

  bucket_id = 'documentos_vistorias' AND

  (SELECT get_my_role()) = 'admin'

);



-- 2. Inquilino e Proprietário podem LER suas próprias vistorias

-- A lógica é idêntica à dos contratos.

CREATE POLICY "User Read Own Vistorias"

ON storage.objects FOR SELECT

USING (

  bucket_id = 'documentos_vistorias' AND

  (

    (

      (SELECT get_my_role()) = 'inquilino' AND

      (storage.foldername(name))[1]::uuid IN (

        SELECT id FROM public.contratos WHERE inquilino_id = auth.uid()

      )

    ) OR

    (

      (SELECT get_my_role()) = 'proprietario' AND

      (storage.foldername(name))[1]::uuid IN (

        SELECT id FROM public.contratos WHERE proprietario_id = auth.uid()

      )

    )

  )

);





-- 1. Acesso total para Admins e Corretores

CREATE POLICY "Admin/Corretor Full Access Compliance"

ON storage.objects FOR ALL

USING (

  bucket_id = 'documentos_compliance' AND

  (SELECT get_my_role()) IN ('admin', 'corretor')

);



-- 2. Proprietário pode LER os documentos dos seus próprios imóveis

CREATE POLICY "Proprietario Read Own Compliance"

ON storage.objects FOR SELECT

USING (

  bucket_id = 'documentos_compliance' AND

  (SELECT get_my_role()) = 'proprietario' AND

  (storage.foldername(name))[1]::uuid IN (

    SELECT id FROM public.imoveis WHERE proprietario_id = auth.uid()

  )

);

CREATE TABLE imoveis_precos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id uuid REFERENCES imoveis(id),
  tipo text CHECK (tipo IN ('venda','locacao')),
  valor numeric(12,2),
  created_at timestamptz DEFAULT now()
);

create table public.imoveis_chaves_historico (
  id uuid primary key default gen_random_uuid(),
  imovel_id uuid references public.imoveis(id) on delete cascade,
  usuario_id uuid references public.profiles(id),
  acao text check (acao in ('retirada', 'devolucao', 'transferencia', 'outro')),
  localizacao text,
  observacao text,
  created_at timestamptz default now()
);

-- 1. Enum de tipos de pessoa (sem login)
CREATE TYPE persona_tipo AS ENUM ('proprietario', 'inquilino', 'cliente');

-- 2. Tabela de personas
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf_cnpj TEXT,
  tipo persona_tipo NOT NULL,
  endereco_json JSONB,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index básico
CREATE INDEX idx_personas_tipo ON public.personas(tipo);

-- ============================================================
-- 🏗️ MIGRAÇÃO: Ajustes na tabela de IMÓVEIS
-- Objetivos:
-- 1. Adicionar corretor_id (referência para profiles.id)
-- 2. Adicionar disponibilidade ('venda', 'locacao', 'ambos')
-- 3. Alterar proprietario_id para referenciar personas.id
-- ============================================================

-- 1️⃣ Criar o ENUM de disponibilidade
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disponibilidade_tipo') THEN
    CREATE TYPE disponibilidade_tipo AS ENUM ('venda', 'locacao', 'ambos');
  END IF;
END $$;

-- 2️⃣ Adicionar campo corretor_id
ALTER TABLE public.imoveis
ADD COLUMN IF NOT EXISTS corretor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3️⃣ Adicionar campo disponibilidade
ALTER TABLE public.imoveis
ADD COLUMN IF NOT EXISTS disponibilidade disponibilidade_tipo DEFAULT 'venda';

-- 4️⃣ Remover antiga constraint do proprietario_id (se existir)
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.imoveis'::regclass
  AND conname LIKE '%proprietario_id%';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.imoveis DROP CONSTRAINT %I;', constraint_name);
  END IF;
END $$;

-- 5️⃣ Criar nova referência para personas
ALTER TABLE public.imoveis
ADD CONSTRAINT imoveis_proprietario_id_fkey FOREIGN KEY (proprietario_id)
  REFERENCES public.personas(id) ON DELETE SET NULL;

-- 6️⃣ Atualizar colunas de auditoria
ALTER TABLE public.imoveis
ALTER COLUMN updated_at SET DEFAULT now();

-- ============================================================
-- ✅ Fim da migração
-- ============================================================

-- ============================================================
-- 🪪 BUCKET: perfil_fotos
-- Políticas para upload e leitura de fotos de perfil
-- ============================================================

-- 1️⃣ Leitura pública (todos podem ver as fotos)
CREATE POLICY "Public Read Access Perfil Fotos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'perfil_fotos'
);

-- 2️⃣ Escrita (upload) permitida apenas para usuários logados
CREATE POLICY "Authenticated Users Insert Perfil Fotos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'perfil_fotos'
  AND auth.role() = 'authenticated'
);

-- 3️⃣ Atualização e deleção (permitida apenas ao próprio dono)
-- ⚙️ Convenção: cada arquivo fica em uma pasta com o ID do usuário.
-- Exemplo: perfil_fotos/<user_id>/foto.jpg

CREATE POLICY "User Update Own Perfil Foto"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'perfil_fotos'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);

CREATE POLICY "User Delete Own Perfil Foto"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'perfil_fotos'
  AND auth.uid() = (storage.foldername(name))[1]::uuid
);

-- 4️⃣ (Opcional) Acesso total para admins e corretores
CREATE POLICY "AdminCorretor Full Access Perfil Fotos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'perfil_fotos'
  AND (SELECT get_my_role()) IN ('admin', 'corretor')
);
