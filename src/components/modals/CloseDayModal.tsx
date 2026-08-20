import React, { useState } from 'react';
import { X, Calendar, ClipboardCheck, ArrowDownToLine, Printer, Trash2, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { Order, DailyReport } from '../../types';
import { printGeneralDailyReport } from '../../utils/print';

interface CloseDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrders: Order[];
  onConfirmCloseDay: (report: DailyReport) => void;
  dailyReports: DailyReport[];
  onDeleteReport: (id: string) => void;
  onShowAlert: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CloseDayModal: React.FC<CloseDayModalProps> = ({
  isOpen,
  onClose,
  currentOrders,
  onConfirmCloseDay,
  dailyReports,
  onDeleteReport,
  onShowAlert,
}) => {
  const [activeTab, setActiveTab] = useState<'close' | 'history'>('close');

  if (!isOpen) return null;

  const todayDateStr = new Date().toLocaleDateString('pt-BR');
  const todayOrdersCount = currentOrders.length;
  const todayTotalValue = currentOrders.reduce((sum, o) => sum + parseFloat(o.feeValue || '0'), 0);

  // Handle closing of today
  const handleExecuteCloseDay = () => {
    if (todayOrdersCount === 0) {
      onShowAlert('Não há pedidos lançados na planilha para fechar o dia.', 'warning');
      return;
    }

    const newReport: DailyReport = {
      id: `report-${Date.now()}`,
      date: todayDateStr,
      timestamp: Date.now(),
      totalOrders: todayOrdersCount,
      totalValue: todayTotalValue,
      orders: [...currentOrders],
    };

    // First print the report so user has the printed copy
    printGeneralDailyReport(todayDateStr, currentOrders);

    // Then execute the parent save/clear callback
    onConfirmCloseDay(newReport);
    onShowAlert(`Dia ${todayDateStr} fechado com sucesso! Backup salvo e planilha limpa.`, 'success');
    setActiveTab('history');
  };

  // Download a single day's report as CSV
  const downloadReportCsv = (report: DailyReport) => {
    try {
      const headers = ['ID Pedido', 'Numero Pedido', 'Loja', 'Motoboy', 'Valor Taxa (R$)', 'Tipo Taxa', 'Data/Hora'];
      const rows = report.orders.map(order => [
        order.id,
        order.orderNumber,
        order.storeName,
        order.motoboyName,
        order.feeValue,
        order.feeDescription,
        new Date(order.timestamp).toLocaleString('pt-BR'),
      ]);

      const csvContent = '\uFEFF' + [
        headers.join(';'),
        ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Fechamento_CiaDoChopp_${(report?.date || 'hoje').replace(/\//g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowAlert(`Relatório de ${report.date} baixado com sucesso!`, 'success');
    } catch (err) {
      onShowAlert('Erro ao gerar arquivo de download.', 'error');
    }
  };

  return (
    <div
      id="closeDayModalOverlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center relative border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Calendar className="w-5.5 h-5.5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">Fechamento do Dia & Relatórios</h3>
              <p className="text-slate-400 text-xs font-semibold">Faça backup, limpe a planilha e consulte histórico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('close')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'close'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-amber-400" />
            <span>Fechar o Dia Hoje</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Ver Relatórios Passados ({dailyReports.length})</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
          {activeTab === 'close' ? (
            <div className="space-y-6">
              {/* Today's Stats Card */}
              <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
                  <Award className="w-24 h-24 text-slate-900" />
                </div>
                <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm uppercase tracking-wider mb-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  Resumo de Hoje ({todayDateStr})
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Total de Pedidos</span>
                    <span className="text-2xl font-black text-slate-900">{todayOrdersCount}</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Total de Taxas</span>
                    <span className="text-2xl font-black text-emerald-700">
                      R$ {todayTotalValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warnings and Explanations */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 font-medium space-y-1">
                    <p className="font-extrabold text-slate-900">O que acontece ao clicar em fechar o dia?</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-500">
                      <li>Gera automaticamente a folha para <strong>Imprimir o Relatório Geral</strong> de taxas e motoboys.</li>
                      <li>Faz o <strong>Backup Completo</strong> salvando todos esses dados no seu histórico de relatórios.</li>
                      <li><strong>Limpa a planilha principal</strong> deixando-a zerada para começar o lançamento de novos pedidos.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => printGeneralDailyReport(todayDateStr, currentOrders)}
                  disabled={todayOrdersCount === 0}
                  className="flex-1 py-3.5 px-5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-black rounded-2xl text-sm transition flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
                >
                  <Printer className="w-4.5 h-4.5" />
                  <span>Imprimir Prévia Geral</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteCloseDay}
                  disabled={todayOrdersCount === 0}
                  className="flex-1 py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10"
                >
                  <ClipboardCheck className="w-4.5 h-4.5" />
                  <span>Confirmar e Limpar Planilha</span>
                </button>
              </div>

              {todayOrdersCount === 0 && (
                <p className="text-center text-xs font-bold text-amber-600 animate-pulse">
                  * Lance pedidos antes de realizar o fechamento diário.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {dailyReports.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                  <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold text-sm">Nenhum relatório fechado ainda</p>
                  <p className="text-slate-400 text-xs mt-1">Realize seu primeiro fechamento de dia para gerar histórico</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">
                    Histórico de Dias Salvos
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {dailyReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-100/50 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-base">Dia {report.date}</span>
                            <span className="text-[10px] bg-slate-800 text-white font-black px-2 py-0.5 rounded-md">
                              {report.totalOrders} {report.totalOrders === 1 ? 'pedido' : 'pedidos'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-emerald-700 mt-0.5">
                            Total de Taxas: R$ {report.totalValue.toFixed(2).replace('.', ',')}
                          </p>
                        </div>

                        {/* Interactive Buttons for History Action */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => printGeneralDailyReport(report.date, report.orders)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold py-2 px-3 rounded-xl transition flex items-center gap-1 cursor-pointer"
                            title="Reimprimir Relatório"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span>Imprimir</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadReportCsv(report)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-extrabold py-2 px-3 rounded-xl transition flex items-center gap-1 cursor-pointer"
                            title="Baixar Relatório como CSV"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Baixar CSV</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o relatório de ${report.date} permanentemente?`)) {
                                onDeleteReport(report.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Excluir Relatório"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
