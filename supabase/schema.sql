-- ========================================================
-- Vunweb Lead Finder - Supabase Database Schema
-- Execute este script no SQL Editor do seu projeto Supabase
-- ========================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA LEADS
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL,
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Brasil',
    website_url TEXT,
    google_maps_url TEXT,
    instagram_url TEXT,
    has_website BOOLEAN DEFAULT false NOT NULL,
    rating NUMERIC(2,1),
    rating_count INTEGER DEFAULT 0,
    business_status TEXT DEFAULT 'OPERATIONAL',
    primary_type TEXT,
    status TEXT DEFAULT 'NOVO' NOT NULL,
    source TEXT DEFAULT 'Google Places API (New)' NOT NULL,
    first_contact_at TIMESTAMP WITH TIME ZONE,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    next_followup_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_lead_place UNIQUE (user_id, place_id)
);

-- 3. TABELA INTERACTIONS (Histórico de Contatos)
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA FOLLOWUPS
CREATE TABLE IF NOT EXISTS public.followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA SEARCHES (Histórico e pesquisas salvas)
CREATE TABLE IF NOT EXISTS public.searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    niche TEXT NOT NULL,
    location TEXT NOT NULL,
    quantity_requested INTEGER NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    results_found INTEGER NOT NULL DEFAULT 0,
    is_saved_favorite BOOLEAN DEFAULT false,
    saved_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA TAGS
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_tag UNIQUE (user_id, name)
);

-- 7. TABELA LEAD_TAGS (Muitos para Muitos)
CREATE TABLE IF NOT EXISTS public.lead_tags (
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (lead_id, tag_id)
);

-- ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON public.leads(place_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_niche ON public.leads(niche);
CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_has_website ON public.leads(has_website);
CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON public.interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_lead_id ON public.followups(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled_at ON public.followups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_searches_user_id ON public.searches(user_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

-- POLICIES: Cada usuário tem acesso apenas aos seus próprios dados
-- 1. Profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Leads
CREATE POLICY "Users can view their own leads"
    ON public.leads FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own leads"
    ON public.leads FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own leads"
    ON public.leads FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own leads"
    ON public.leads FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Interactions
CREATE POLICY "Users can view their interactions"
    ON public.interactions FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert interactions"
    ON public.interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete interactions"
    ON public.interactions FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- 4. Followups
CREATE POLICY "Users can view their followups"
    ON public.followups FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert followups"
    ON public.followups FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update followups"
    ON public.followups FOR UPDATE
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete followups"
    ON public.followups FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- 5. Searches
CREATE POLICY "Users can view their searches"
    ON public.searches FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert searches"
    ON public.searches FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete searches"
    ON public.searches FOR DELETE
    USING (auth.uid() = user_id OR user_id IS NULL);

-- 6. Tags
CREATE POLICY "Users can manage tags"
    ON public.tags FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL);

-- 7. Lead Tags
CREATE POLICY "Users can manage lead tags"
    ON public.lead_tags FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.leads
        WHERE leads.id = lead_tags.lead_id
        AND (leads.user_id = auth.uid() OR leads.user_id IS NULL)
    ));

-- TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_leads_modtime
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_followups_modtime
    BEFORE UPDATE ON public.followups
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
