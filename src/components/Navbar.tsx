import React from 'react';
import {
  Bell,
  Download,
  Menu,
  PlusCircle,
  Search,
  Upload,
  User,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  pendingFollowupsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  activeTab,
  onNavigate,
  onOpenImportModal,
  onOpenExportModal,
  pendingFollowupsCount,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'search':
        return 'Encontrar Leads';
      case 'leads':
        return 'Meus Leads (CRM)';
      case 'followups':
        return 'Acompanhamento de Follow-ups';
      case 'dashboard':
        return 'Dashboard de Métricas & Funil';
      case 'history':
        return 'Pesquisas Salvas & Histórico';
      case 'settings':
        return 'Configurações do Sistema';
      default:
        return 'Vunweb Lead Finder';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {getTabTitle()}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            Prospecção com Google Places API (New) & CRM Supabase
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* CSV Tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenImportModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs"
            title="Importar Leads de planilha CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Importar CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-2xs"
            title="Exportar Leads para planilha CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>

        {/* Notificação de Followup */}
        <button
          type="button"
          onClick={() => onNavigate('followups')}
          className="relative p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          title="Ver follow-ups agendados"
        >
          <Bell className="w-4 h-4" />
          {pendingFollowupsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>

        {/* User Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-200 p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
            <img
              src="https://i.postimg.cc/02TwmPZ5/Favicon-Vunweb.png"
              alt="Vunweb"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden md:block text-left">
            <span className="text-xs font-semibold text-slate-800 block leading-tight">
              Vunweb Team
            </span>
            <span className="text-[10px] text-slate-400">Comercial & Prospecção</span>
          </div>
        </div>
      </div>
    </header>
  );
};
