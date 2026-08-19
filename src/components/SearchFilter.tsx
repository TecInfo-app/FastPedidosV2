import React from 'react';
import { Search, X, Filter } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onOpenSearchModal: () => void;
  onClearSearch: () => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onOpenSearchModal,
  onClearSearch,
}) => {
  return (
    <div className="mb-6 bg-white p-3.5 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3">
      <button
        id="openSearchModalButton"
        type="button"
        onClick={onOpenSearchModal}
        className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-extrabold py-3.5 px-5 rounded-2xl transition-all duration-200 flex items-center justify-between text-left cursor-pointer shadow-md group"
      >
        <span className="flex items-center gap-3 text-sm md:text-base">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
            <Search className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
          <span>Localizar Pedido / Filtrar Planilha</span>
        </span>

        <span className="bg-slate-800 text-amber-400 border border-slate-700 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
          <Filter className="w-3.5 h-3.5" />
          <span>Pesquisar (Lupa)</span>
        </span>
      </button>

      {searchTerm && (
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 bg-amber-50 border border-amber-300 px-3.5 py-2 rounded-2xl">
          <span className="text-xs font-bold text-amber-900 truncate max-w-[200px]">
            Filtro Ativo: <span className="font-black text-amber-700">"{searchTerm}"</span>
          </span>
          <button
            type="button"
            onClick={onClearSearch}
            className="text-slate-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
            title="Limpar Filtro"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
