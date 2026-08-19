import React from 'react';
import { Store } from '../types';
import { Store as StoreIcon, Check, Plus } from 'lucide-react';

interface StoreBarProps {
  stores: Store[];
  selectedStoreId: string | null;
  onSelectStore: (id: string) => void;
  onOpenSetup?: () => void;
}

export const StoreBar: React.FC<StoreBarProps> = ({
  stores,
  selectedStoreId,
  onSelectStore,
  onOpenSetup,
}) => {
  const activeStores = stores.filter((s) => s.isActiveToday !== false);
  const displayedStores = activeStores.length > 0 ? activeStores : stores;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <StoreIcon className="w-3.5 h-3.5 text-amber-500" /> Selecione a Loja Ativa
        </span>
        {onOpenSetup && (
          <button
            onClick={onOpenSetup}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Gerenciar Lojas
          </button>
        )}
      </div>

      <div
        id="storeSelectionContainer"
        className={`${
          stores.length === 0
            ? 'flex items-center justify-center'
            : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
        } gap-2.5 p-2 bg-slate-200/60 rounded-2xl border border-slate-300/70 shadow-inner min-h-[58px]`}
      >
        {stores.length === 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-slate-600 my-1 font-medium w-full justify-center p-2">
            <div className="flex items-center gap-2">
              <StoreIcon className="w-4 h-4 text-slate-400" />
              <span>Nenhuma loja cadastrada ainda.</span>
            </div>
            {onOpenSetup && (
              <button
                onClick={onOpenSetup}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-1.5 px-4 rounded-xl text-xs shadow-md transition duration-200 cursor-pointer"
              >
                + Cadastrar Loja
              </button>
            )}
          </div>
        ) : (
          displayedStores.map((store) => {
            const isSelected = store.id === selectedStoreId;
            return (
              <button
                key={store.id}
                data-store-id={store.id}
                onClick={() => onSelectStore(store.id)}
                className={`h-12 px-3 rounded-xl font-bold transition-all duration-200 text-xs md:text-sm flex items-center justify-center gap-1.5 cursor-pointer w-full text-center truncate ${
                  isSelected
                    ? 'bg-slate-900 text-amber-400 shadow-lg shadow-slate-900/30 ring-2 ring-amber-400/50 scale-[1.01]'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 shadow-2xs hover:border-slate-300'
                }`}
              >
                <StoreIcon className={`w-4.5 h-4.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="truncate">{store.name}</span>
                {isSelected && (
                  <span className="bg-amber-400 text-slate-950 p-0.5 rounded-full shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
