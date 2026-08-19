import React, { useState } from 'react';
import { Settings, BookmarkPlus, ArrowUpDown, Trash2, RotateCcw, Beer, ShieldCheck, Zap, ClipboardCheck, Bike, Copy, Check, X, LogOut } from 'lucide-react';

interface HeaderProps {
  onOpenSetup: () => void;
  onOpenExportImport: () => void;
  onOpenClearData: () => void;
  onRestoreDefaults?: () => void;
  onOpenCloseDay: () => void;
  onEnterMotoboyPortal: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
  currentUserId?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSetup,
  onOpenExportImport,
  onOpenClearData,
  onRestoreDefaults,
  onOpenCloseDay,
  onEnterMotoboyPortal,
  onLogout,
  userEmail,
  currentUserId,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const ownerQuery = currentUserId ? `&owner=${currentUserId}` : '';
    const portalUrl = `${window.location.origin}${window.location.pathname}?mode=motoboy${ownerQuery}`;
    navigator.clipboard.writeText(portalUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch((err) => {
        console.error('Error copying link:', err);
      });
  };

  return (
    <header className="mb-8 relative z-30">
      <div className="bg-slate-900 text-white rounded-3xl p-5 md:p-6 shadow-2xl border border-slate-800 relative">
        {/* Decorative Background Accent */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-4 text-left w-full sm:w-auto">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/25 ring-2 ring-amber-300/30 flex-shrink-0">
              <Beer className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  CIA DO CHOPP
                </h1>
                <span className="bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-400/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-amber-300" /> FAST PEDIDOS
                </span>
              </div>
              <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5">
                Gestão Inteligente de Motoboys, Entregas e Taxas por Loja
              </p>
            </div>
          </div>

          {/* Single Menu Button to Trigger Sidebar (Cleans up the screen!) */}
          <div className="w-full sm:w-auto flex justify-end">
            <button
              onClick={() => setSidebarOpen(true)}
              className="bg-slate-850 hover:bg-slate-800 active:bg-slate-950 text-amber-400 py-3.5 px-6 rounded-2xl border border-slate-700/80 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 font-black text-sm shadow-md hover:scale-[1.01] w-full sm:w-auto"
              title="Abrir Menu do Painel Administrativo"
            >
              <svg className="w-5.5 h-5.5 text-amber-400 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Menu Painel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Drawer Panel */}
      {sidebarOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity duration-300 animate-in fade-in"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Element */}
          <div
            className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-slate-900 border-l border-slate-800 text-white shadow-2xl z-55 p-6 overflow-y-auto transform transition-transform duration-300 ease-out flex flex-col justify-between animate-in slide-in-from-right duration-300"
          >
            {/* Drawer Content */}
            <div className="space-y-6">
              {/* Drawer Title and Close button */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-black text-white tracking-tight">Painel Administrativo</h3>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Fechar Menu"
                >
                  <X className="w-5.5 h-5.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Brand logo inside drawer */}
              <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 font-black text-lg">
                  <Beer className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Cia do Chopp</h4>
                  <span className="text-[10px] text-slate-400 font-bold block">Fast Pedidos v2.0</span>
                </div>
                {/* Active Indicator inside drawer */}
                <div className="ml-auto text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold shadow-inner shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Ativo</span>
                </div>
              </div>

              {/* Navigation Options list */}
              <div className="space-y-3.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Operações do Dia</span>

                {/* Fechar o Dia */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    onOpenCloseDay();
                  }}
                  className="w-full flex items-center gap-3 p-3.5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600 hover:to-teal-600 border border-emerald-500/20 hover:border-emerald-500/10 hover:text-white rounded-2xl transition duration-200 text-left cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 group-hover:bg-white/10 text-emerald-400 group-hover:text-white flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-emerald-400 group-hover:text-white">Fechar o Dia</p>
                    <p className="text-[10px] text-slate-400 group-hover:text-slate-100 font-medium">Imprimir relatórios e zerar faturamento</p>
                  </div>
                </button>

                {/* Portal Motoboy */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    onEnterMotoboyPortal();
                  }}
                  className="w-full flex items-center gap-3 p-3.5 bg-slate-950/30 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 text-white rounded-2xl transition duration-200 text-left cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-200">Portal Motoboy</p>
                    <p className="text-[10px] text-slate-400 font-medium">Link de visualização para os entregadores</p>
                  </div>
                </button>

                {/* Copiar Link */}
                <button
                  onClick={handleCopyLink}
                  className={`w-full flex items-center gap-3 p-3.5 border rounded-2xl transition duration-200 text-left cursor-pointer group ${
                    copied
                      ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-950/30 hover:bg-slate-800 border-slate-800 hover:border-slate-700/80 text-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-200">{copied ? 'Link Copiado!' : 'Copiar Link'}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Enviar link de acesso para o WhatsApp dos motoboys</p>
                  </div>
                </button>

                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block pt-3 mb-1">Configurações & Dados</span>

                {/* Gerenciar Lojas & Taxas (Setup) */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    onOpenSetup();
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 border border-transparent hover:border-slate-800 text-slate-300 hover:text-white rounded-xl transition duration-150 text-left cursor-pointer text-xs font-bold"
                >
                  <BookmarkPlus className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Gerenciar Lojas & Taxas</span>
                </button>

                {/* Backup & Exportação */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    onOpenExportImport();
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 border border-transparent hover:border-slate-800 text-slate-300 hover:text-white rounded-xl transition duration-150 text-left cursor-pointer text-xs font-bold"
                >
                  <ArrowUpDown className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Backup & Exportação</span>
                </button>

                {/* Restaurar Padrões */}
                {onRestoreDefaults && (
                  <button
                    onClick={() => {
                      setSidebarOpen(false);
                      onRestoreDefaults();
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 border border-transparent hover:border-slate-800 text-slate-300 hover:text-white rounded-xl transition duration-150 text-left cursor-pointer text-xs font-bold"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Restaurar Padrões de Fábrica</span>
                  </button>
                )}

                {/* Limpar Registros */}
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    onOpenClearData();
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-rose-950/20 border border-transparent text-rose-400 hover:text-rose-300 rounded-xl transition duration-150 text-left cursor-pointer text-xs font-bold"
                >
                  <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Limpar Todos os Registros</span>
                </button>

                {onLogout && (
                  <>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block pt-3 mb-1">Sessão</span>
                    {userEmail && (
                      <div className="px-3 py-1 text-slate-400 text-[11px] font-medium truncate">
                        Conectado como: <span className="font-extrabold text-slate-200">{userEmail}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSidebarOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-red-950/20 border border-transparent text-red-400 hover:text-red-300 rounded-xl transition duration-150 text-left cursor-pointer text-xs font-bold"
                    >
                      <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Sair da Conta</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Footer inside drawer */}
            <div className="pt-6 border-t border-slate-800 text-center text-[10px] text-slate-500 font-bold">
              Desenvolvido para Cia do Chopp
            </div>
          </div>
        </>
      )}
    </header>
  );
};
