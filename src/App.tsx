import React, { useEffect, useState } from 'react';
import { CsvExportModal } from './components/CsvExportModal';
import { CsvImportModal } from './components/CsvImportModal';
import { Navbar } from './components/Navbar';
import { ActiveTab, Sidebar } from './components/Sidebar';
import { fetchFollowups, fetchLeads, fetchSearches, saveLeads } from './lib/db';
import { isSupabaseConfigured } from './lib/supabase';
import { DashboardPage } from './pages/DashboardPage';
import { FollowupsPage } from './pages/FollowupsPage';
import { LeadsCrmPage } from './pages/LeadsCrmPage';
import { SearchHistoryPage } from './pages/SearchHistoryPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { Followup, Lead, SearchHistory } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // App data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [totalSearchesCount, setTotalSearchesCount] = useState<number>(0);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);
  const [quotaWarning, setQuotaWarning] = useState<boolean>(false);

  // Modais
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Histórico para reexecução
  const [searchPrefill, setSearchPrefill] = useState<SearchHistory | null>(null);

  useEffect(() => {
    loadInitialData();

    // Listener para eventos de cota do Google Maps Platform
    const handleQuotaExceeded = () => {
      setQuotaWarning(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);

    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const loadInitialData = async () => {
    setSupabaseConnected(isSupabaseConfigured());
    const [loadedLeads, loadedFollowups, loadedSearches] = await Promise.all([
      fetchLeads(),
      fetchFollowups(),
      fetchSearches(),
    ]);
    setLeads(loadedLeads);
    setFollowups(loadedFollowups);
    setTotalSearchesCount(loadedSearches.length);
  };

  const handleLeadsAdded = async (addedCount: number) => {
    const updated = await fetchLeads();
    setLeads(updated);
  };

  const pendingFollowups = followups.filter((f) => f.status === 'PENDING');
  const crmLeadPlaceIds = new Set(leads.map((l) => l.place_id).filter(Boolean));

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        totalLeadsCount={leads.length}
        pendingFollowupsCount={pendingFollowups.length}
        supabaseConnected={supabaseConnected}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Banner de Cota Oficial do Google Maps Platform */}
        {quotaWarning && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-xs">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        {/* Top Navbar */}
        <Navbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          activeTab={activeTab}
          onNavigate={setActiveTab}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          pendingFollowupsCount={pendingFollowups.length}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'search' && (
            <SearchPage
              onLeadsAddedToCrm={handleLeadsAdded}
              crmLeadPlaceIds={crmLeadPlaceIds}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsCrmPage
              leads={leads}
              onRefreshLeads={loadInitialData}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          )}

          {activeTab === 'followups' && (
            <FollowupsPage onRefreshStats={loadInitialData} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              leads={leads}
              totalSearchedCount={totalSearchesCount}
              pendingFollowupsToday={
                followups.filter((f) => {
                  if (f.status !== 'PENDING') return false;
                  const date = new Date(f.scheduled_at);
                  const today = new Date();
                  return date.toDateString() === today.toDateString();
                }).length
              }
            />
          )}

          {activeTab === 'history' && (
            <SearchHistoryPage
              onReExecuteSearch={(historyItem) => {
                setSearchPrefill(historyItem);
                setActiveTab('search');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage onRefreshAppState={loadInitialData} />
          )}
        </main>
      </div>

      {/* CSV Modals */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportCompleted={(added, existing) => {
          loadInitialData();
          alert(`${added} leads importados com sucesso! ${existing > 0 ? `(${existing} duplicados ignorados)` : ''}`);
        }}
        onSaveLeads={saveLeads}
      />

      <CsvExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        leads={leads}
      />
    </div>
  );
}
