import React from 'react';
import { AlertOctagon, X } from 'lucide-react';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClearAll: () => void;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="clearDataConfirmationModal"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative text-center border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition duration-200 cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
          <AlertOctagon className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-rose-600 mb-2 uppercase tracking-wide">
          CUIDADO! Limpeza Total
        </h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Você tem certeza que deseja <strong>limpar TODOS os dados</strong> (Lojas, Motoboys, Taxas e Pedidos) locais? Esta ação é <strong>irreversível</strong>.
        </p>

        <div className="flex justify-center space-x-3">
          <button
            id="cancelClearDataButton"
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold py-2.5 px-4 rounded-xl transition duration-200 text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="confirmClearDataButton"
            type="button"
            onClick={onConfirmClearAll}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-rose-600/20 transition duration-200 text-sm cursor-pointer"
          >
            Limpar Tudo
          </button>
        </div>
      </div>
    </div>
  );
};
