import React from 'react';
import {
  BarChart3,
  Calendar,
  Compass,
  Database,
  History,
  Layers,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

export type ActiveTab = 'search' | 'leads' | 'followups' | 'dashboard' | 'history' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalLeadsCount: number;
  pendingFollowupsCount: number;
  supabaseConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  totalLeadsCount,
  pendingFollowupsCount,
  supabaseConnected,
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'search',
      label: 'Encontrar Leads',
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: 'leads',
      label: 'Meus Leads',
      icon: <Users className="w-4 h-4" />,
      badge: totalLeadsCount > 0 ? totalLeadsCount : undefined,
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      id: 'followups',
      label: 'Follow-ups',
      icon: <Calendar className="w-4 h-4" />,
      badge: pendingFollowupsCount > 0 ? pendingFollowupsCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      id: 'dashboard',
      label: 'Dashboard & Funil',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: 'Pesquisas Salvas',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 p-1 flex items-center justify-center shadow-md shadow-indigo-500/10 border border-slate-700/60 overflow-hidden shrink-0">
            <img
              src="https://i.postimg.cc/02TwmPZ5/Favicon-Vunweb.png"
              alt="Vunweb"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">Vunweb</span>
              <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-sm">
                LEADS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">Prospecção B2B Real</p>
          </div>
        </div>

        {isOpenMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold text-slate-400 px-3 pb-2 tracking-wider">
          Menu Principal
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Database & API Status Pill */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1.5 bg-slate-800/50">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Places API (New)
            </span>
            <span className="text-emerald-400 font-semibold">Ativo</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-slate-400" />
              Supabase CRM
            </span>
            <span
              className={`font-semibold ${
                supabaseConnected ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {supabaseConnected ? 'Conectado' : 'Modo Local'}
            </span>
          </div>
        </div>

        <div className="px-2 py-1 text-[10px] text-slate-300 flex items-center justify-between">
          <span>Vunweb Lead Finder v1.2</span>
          <span className="text-indigo-400 font-semibold">Ready</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
