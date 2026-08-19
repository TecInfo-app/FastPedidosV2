import React, { useState } from 'react';
import { Rate } from '../../types';
import { X, DollarSign, Send, BadgePercent } from 'lucide-react';

interface RateSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: Rate[];
  onSelectRate: (rate: Rate) => void;
}

export const RateSelectModal: React.FC<RateSelectModalProps> = ({
  isOpen,
  onClose,
  rates,
  onSelectRate,
}) => {
  const [manualRateInput, setManualRateInput] = useState('');

  if (!isOpen) return null;

  const handleApplyManualRate = (e: React.FormEvent) => {
    e.preventDefault();
    const manualValue = parseFloat(manualRateInput);
    if (isNaN(manualValue) || manualValue < 0) {
      alert('Por favor, insira um valor de taxa avulsa válido (pode ser zero).');
      return;
    }

    const manualRate: Rate = {
      id: 'manual-' + Date.now(),
      description: 'Taxa Avulsa',
      value: manualValue.toFixed(2),
    };

    onSelectRate(manualRate);
    setManualRateInput('');
  };

  const activeRates = rates.filter((r) => r.isActiveToday !== false);
  const displayedRates = activeRates.length > 0 ? activeRates : rates;

  return (
    <div
      id="rateSelectModal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 relative border border-slate-200">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BadgePercent className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Valor da Taxa de Entrega
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

        {/* Fixed Rates Selection */}
        <div id="ratesSelection" className="space-y-2.5 max-h-60 overflow-y-auto p-1 border-b border-slate-200 pb-4 mb-4 custom-scrollbar">
          {rates.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-2 font-medium">
              Nenhuma taxa fixa cadastrada. Use a opção de Taxa Avulsa abaixo.
            </p>
          ) : (
            displayedRates.map((rate) => {
              const formatted = parseFloat(rate.value).toFixed(2).replace('.', ',');
              return (
                <button
                  key={rate.id}
                  type="button"
                  onClick={() => onSelectRate(rate)}
                  className="w-full py-5 px-5 bg-emerald-50 hover:bg-emerald-600 text-slate-900 hover:text-white font-black rounded-2xl shadow-sm transition-all duration-200 flex items-center justify-between border border-emerald-200/80 hover:border-emerald-600 cursor-pointer group hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-5.5 h-5.5 text-emerald-700 group-hover:text-amber-300 transition-colors shrink-0" />
                    <span className="text-2xl tracking-tight">R$ {formatted}</span>
                  </div>
                  <span className="text-sm font-black text-emerald-800 group-hover:text-emerald-950 bg-emerald-200/80 group-hover:bg-amber-300 px-4 py-1.5 rounded-full transition-colors shrink-0">
                    {rate.description}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Taxa Avulsa Input */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            Outro Valor (Taxa Avulsa)
          </h4>
          <form onSubmit={handleApplyManualRate} className="flex gap-2">
            <div className="relative flex-grow">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">R$</span>
              <input
                id="manualRateInput"
                type="number"
                step="0.01"
                value={manualRateInput}
                onChange={(e) => setManualRateInput(e.target.value)}
                placeholder="0,00"
                className="w-full p-2.5 pl-8 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-base font-bold bg-white text-slate-900"
              />
            </div>
            <button
              id="applyManualRate"
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs transition duration-200 whitespace-nowrap cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Lançar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
