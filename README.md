# Vunweb Lead Finder 🎯

**Vunweb Lead Finder** é uma ferramenta completa de prospecção ativa de clientes e CRM inteligente desenvolvida especialmente para a Vunweb.

O sistema realiza buscas reais por empresas e prestadores de serviços utilizando a **Google Places API (New)** através de uma camada server-side segura, aplica filtros avançados (com foco especial na identificação de empresas **sem site informado**), calcula um **Lead Score** de oportunidade de venda e permite salvar e gerenciar os contatos diretamente em um CRM integrado com **Supabase**.

---

## 🚀 Principais Funcionalidades

1. **Busca Real via Google Places API (New)**:
   - Utiliza o endpoint oficial `https://places.googleapis.com/v1/places:searchText` (Text Search).
   - Consulta dinâmica de Nicho + Localização (Cidade/UF ou seleção multi-estadual para busca em todo o Brasil).
   - Uso restrito de FieldMask (`places.id`, `places.displayName`, `places.formattedAddress`, `places.nationalPhoneNumber`, `places.websiteUri`, `places.googleMapsUri`, `places.rating`, `places.userRatingCount`, etc.) garantindo alta performance e otimização de custos.
   - Chave de API protegida em camada server-side (nunca exposta no código cliente do navegador).

2. **Filtro Estratégico "Sem Site"**:
   - Identifica empresas cuja fonte consultada não informou um website próprio.
   - Ponto de partida ideal para a Vunweb oferecer serviços de criação de websites, landing pages e presença digital.

3. **Lead Score Automático**:
   - Pontuação transparente de 0 a 100 para priorizar abordagem comercial:
     - 🔥 **Alto Potencial** (Score ≥ 70): Possui telefone direto + sem site + boa avaliação.
     - 🟡 **Potencial Médio** (Score 40-69)
     - ⚪ **Baixo Potencial** (Score < 40)

4. **CRM Completo Integrado**:
   - Visão em Tabela e Visão em Funil Kanban.
   - Status de prospecção: *Novo*, *Contatado*, *Respondeu*, *Interessado*, *Proposta enviada*, *Negociação*, *Fechado*, *Perdido*, *Sem resposta*.
   - Botão direto para WhatsApp com normalização internacional para o Brasil (`https://wa.me/55...`).
   - Links diretos para Google Maps e Website oficial (quando existente).
   - Histórico cronológico de contatos (ligações, mensagens, reuniões, propostas, etc.).
   - Agendamento de follow-ups com alertas para compromissos do dia e em atraso.

5. **Importação e Exportação**:
   - Importação de arquivos CSV com pré-visualização, validação de cabeçalhos e prevenção de duplicidades.
   - Exportação em CSV com codificação UTF-8 BOM para perfeita leitura no Microsoft Excel e Google Sheets.

6. **Dual-Store Resiliente**:
   - Integração nativa com Supabase (PostgreSQL + RLS).
   - Modo de contingência em armazenamento local (`localStorage`) permitindo testes e uso imediato mesmo antes de configurar credenciais do banco.

---

## 🛠️ Guia Passo a Passo de Configuração

### 1. Criar projeto no Google Cloud
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto ou selecione um existente.

### 2. Ativar Google Places API (New)
1. No menu lateral, acesse **APIs e Serviços** > **Biblioteca**.
2. Pesquise por **Places API (New)**.
3. Clique em **Ativar** (Enable).

### 3. Configurar Billing
1. Certifique-se de que sua conta de faturamento (Billing Account) esteja associada ao projeto no Google Cloud.
2. A Google oferece créditos gratuitos mensais para uso de APIs do Maps.

### 4. Criar API Key
1. Acesse **APIs e Serviços** > **Credenciais**.
2. Clique em **Criar Credenciais** > **Chave de API**.
3. Copie a chave gerada.

### 5. Restringir a API Key Adequadamente
Por segurança, configure restrições para a chave:
- **Restrições de API**: Selecione apenas **Places API (New)**.
- **Restrições de aplicativo**: Caso utilize chamadas via IP de servidor ou Cloud Run, restrinja por endereços IP autorizados.
- Consulte a documentação: [Restringir chaves de API](https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys).

### 6. Criar projeto no Supabase
1. Acesse [Supabase.com](https://supabase.com/) e crie uma organização/projeto.
2. Anote a URL do projeto (`https://xxxx.supabase.co`) e a chave pública `anon key`.

### 7. Executar o Script SQL
1. No painel do Supabase, acesse o **SQL Editor**.
2. Abra o arquivo `supabase/schema.sql` deste projeto.
3. Cole o conteúdo e clique em **Run**.
4. As tabelas `profiles`, `leads`, `interactions`, `followups`, `searches`, `tags` e políticas de RLS serão criadas automaticamente.

### 8. Configurar Authentication
1. No Supabase, acesse **Authentication** > **Providers**.
2. Ative o método **Email / Password**.

### 9. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado em `.env.example`:

```bash
# Google Maps Platform (Places API New)
GOOGLE_MAPS_API_KEY="sua_chave_aqui"

# Supabase
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_ANON_KEY="sua_chave_anon_aqui"
```

> **Nota:** As configurações também podem ser atualizadas diretamente na tela de **Configurações** da própria aplicação.

### 10. Executar o Projeto Localmente
```bash
npm install
npm run dev
```
Acesse a aplicação no seu navegador em `http://localhost:3000`.

### 11. Compilar para Produção (Build)
```bash
npm run build
```

### 12. Publicar (Deploy)
Execute com o servidor Express full-stack:
```bash
npm start
```
Ou publique em plataformas como Google Cloud Run, Vercel, Render ou Railway.

---

## 🏛️ Arquitetura das Chamadas

```
Frontend (React/Vite)
       │
       ▼ POST /api/places/search (sem expor credenciais)
Backend Server (server/placesApi.ts)
       │
       ▼ POST https://places.googleapis.com/v1/places:searchText
Google Places API (New)
       │
       ▼ Resposta com FieldMask estrito
Normalização + Remoção de Duplicatas + Cálculo de Score
       │
       ▼
Resultados para o usuário ──► Seleção ──► Supabase CRM
```

---

## 📄 Licença e Termos

- Os trechos de código do Google Maps Platform seguem a licença Apache-2.0.
- O uso da Google Places API está sujeito aos [Termos de Serviço da Google Maps Platform](https://cloud.google.com/maps-platform/terms).
- Desenvolvido para a equipe de vendas e prospecção da **Vunweb**.
