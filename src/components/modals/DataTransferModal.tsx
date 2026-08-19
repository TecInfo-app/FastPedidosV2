import React, { useState } from 'react';
import { Store, Motoboy, Rate, Order } from '../../types';
import { X, Download, Upload, AlertTriangle } from 'lucide-react';

interface DataTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  motoboys: Motoboy[];
  rates: Rate[];
  orders: Order[];
  onImportData: (data: { stores: Store[]; motoboys: Motoboy[]; rates: Rate[]; orders: Order[] }) => void;
  onShowAlert: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DataTransferModal: React.FC<DataTransferModalProps> = ({
  isOpen,
  onClose,
  stores,
  motoboys,
  rates,
  orders,
  onImportData,
  onShowAlert,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const exportData = {
      meta: {
        timestamp: new Date().toISOString(),
        appName: 'CIA DO CHOPP - FAST PEDIDOS',
      },
      stores,
      motoboys,
      rates,
      orders,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.download = `motoboy_backup_local_${date}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);

    onShowAlert('Exportação concluída! Arquivo JSON baixado.', 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      onShowAlert('Selecione um arquivo JSON para importar.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = JSON.parse(e.target?.result as string);

        if (!jsonContent || !Array.isArray(jsonContent.stores) || !Array.isArray(jsonContent.motoboys) || !Array.isArray(jsonContent.orders)) {
          onShowAlert('Erro: Arquivo JSON inválido. Faltando coleções principais (stores, motoboys, orders).', 'error');
          return;
        }

        onImportData({
          stores: jsonContent.stores || [],
          motoboys: jsonContent.motoboys || [],
          rates: jsonContent.rates || [],
          orders: jsonContent.orders || [],
        });

        setSelectedFile(null);
        onClose();
        onShowAlert('Importação concluída com sucesso! Os dados foram atualizados.', 'success');
      } catch (err) {
        console.error('Error importing file:', err);
        onShowAlert('Erro: O arquivo não é um JSON válido ou o conteúdo está corrompido.', 'error');
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div
      id="dataTransferModal"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Transferência de Dados (JSON)
          </h3>
          <button
            id="closeDataTransferModal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition duration-200 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-6 font-medium">
          Importe ou exporte todos os seus cadastros (Lojas, Motoboys, Taxas e Pedidos) como um único arquivo JSON.
        </p>

        <div className="space-y-6">
          {/* Exportar */}
          <div className="border border-slate-200/90 p-4 rounded-2xl bg-slate-50/80">
            <h4 className="font-bold text-base border-b border-slate-200 pb-1 mb-2 text-indigo-700 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-600" />
              1. Exportar Dados
            </h4>
            <p className="text-xs text-slate-600 mb-4 font-medium">
              Baixe o arquivo JSON contendo todos os dados do seu armazenamento local.
            </p>
            <button
              id="exportDataButton"
              type="button"
              onClick={handleExport}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold transition duration-200 cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Baixar Arquivo JSON de Backup
            </button>
          </div>

          {/* Importar */}
          <div className="border border-rose-200/90 p-4 rounded-2xl bg-rose-50/40">
            <h4 className="font-bold text-base border-b border-rose-200 pb-1 mb-2 text-rose-700 flex items-center gap-2">
              <Upload className="w-4 h-4 text-rose-600" />
              2. Importar Dados (Atenção!)
            </h4>
            <div className="flex items-start gap-2 mb-3 bg-rose-100/90 p-2.5 rounded-xl text-rose-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>AVISO: A importação irá apagar e substituir todos os seus dados atuais. Faça um backup antes de importar!</span>
            </div>

            <input
              id="importFileInput"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full p-2.5 border border-slate-300 rounded-xl bg-white mb-3 text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />

            <button
              id="importDataButton"
              type="button"
              disabled={!selectedFile}
              onClick={handleImport}
              className={`w-full p-3 rounded-xl font-bold transition duration-200 shadow-md flex items-center justify-center gap-2 text-sm ${
                selectedFile
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Upload className="w-4 h-4" />
              Importar e Sobrescrever Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
