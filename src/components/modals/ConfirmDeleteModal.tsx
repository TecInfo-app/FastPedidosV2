import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string | null;
  onConfirmDelete: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirmDeleteModal"
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
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Confirmar Exclusão</h3>
        <p id="deleteConfirmationMessage" className="text-sm text-slate-600 mb-6 leading-relaxed">
          Você tem certeza que deseja excluir o <strong>Pedido Nº {orderNumber}</strong>? Esta ação não pode ser desfeita.
        </p>

        <div className="flex justify-center space-x-3">
          <button
            id="cancelDeleteButton"
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-bold py-2.5 px-4 rounded-xl transition duration-200 text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button
            id="confirmDeleteButton"
            type="button"
            onClick={onConfirmDelete}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-rose-600/20 transition duration-200 text-sm cursor-pointer"
          >
            Excluir Permanentemente
          </button>
        </div>
      </div>
    </div>
  );
};
