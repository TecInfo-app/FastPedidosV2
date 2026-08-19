import React from 'react';
import { Motoboy } from '../../types';
import { X, Bike, ArrowRight } from 'lucide-react';

interface MotoboySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  motoboys: Motoboy[];
  onSelectMotoboy: (motoboy: Motoboy) => void;
}

export const MotoboySelectModal: React.FC<MotoboySelectModalProps> = ({
  isOpen,
  onClose,
  motoboys,
  onSelectMotoboy,
}) => {
  if (!isOpen) return null;

  const activeMotoboys = motoboys.filter((m) => m.isActiveToday !== false);

  return (
    <div
      id="motoboySelectModal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative border border-slate-200">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Bike className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Selecione o Motoboy
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition duration-200 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div id="motoboysSelection" className="space-y-2.5 max-h-80 overflow-y-auto p-1 custom-scrollbar">
          {activeMotoboys.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4 font-medium">
              Nenhum motoboy ativo para hoje. Ative-os nas configurações do Painel Admin.
            </p>
          ) : (
            activeMotoboys.map((motoboy) => (
              <button
                key={motoboy.id}
                type="button"
                onClick={() => onSelectMotoboy(motoboy)}
                className="w-full py-3.5 px-4 bg-slate-50 hover:bg-slate-900 text-slate-800 hover:text-white font-extrabold rounded-2xl shadow-2xs transition-all duration-200 flex items-center justify-between border border-slate-200 hover:border-slate-900 cursor-pointer text-base group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 group-hover:bg-amber-400 text-slate-700 group-hover:text-slate-950 flex items-center justify-center font-black text-sm transition-colors">
                    {motoboy.name[0]?.toUpperCase() || 'M'}
                  </div>
                  <span>{motoboy.name}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
