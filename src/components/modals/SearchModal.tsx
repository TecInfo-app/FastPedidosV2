import React, { useEffect, useRef } from 'react';
import { Search, X, Filter, ShoppingBag, ArrowRight } from 'lucide-react';
import { Order } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClearSearch: () => void;
  orders: Order[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchTerm,
  onSearchChange,
  onClearSearch,
  orders,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate matching count
  const cleanTerm = searchTerm.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const matchedOrders = cleanTerm.length > 0
    ? orders.filter((o) => {
        const orderNumNorm = (o.orderNumber || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const storeNorm = (o.storeName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const motoboyNorm = (o.motoboyName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return orderNumNorm.includes(cleanTerm) || storeNorm.includes(cleanTerm) || motoboyNorm.includes(cleanTerm);
      })
    : [];

  return (
    <div
      id="searchModal"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-4 pt-16 sm:pt-24 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 relative border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Pesquisar na Planilha
              </h3>
              <p className="text-slate-500 text-xs font-medium">
                Localize por número de pedido, nome da loja ou motoboy
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition duration-200 cursor-pointer"
            aria-label="Fechar Pesquisa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input with Magnifying Glass & Auto Focus */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            id="modalSearchInput"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Digite o número do pedido ou nome..."
            className="w-full p-4 pl-12 pr-24 border-2 border-amber-400/80 rounded-2xl focus:ring-4 focus:ring-amber-400/20 focus:border-amber-500 outline-none text-slate-900 text-base font-bold bg-amber-50/20 shadow-inner"
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          {searchTerm && (
            <button
              onClick={onClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-extrabold px-3 py-1.5 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>

        {/* Search Results Feedback */}
        {cleanTerm.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto p-1 custom-scrollbar">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-500 uppercase tracking-wider px-1">
              <span>Resultados Encontrados</span>
              <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black">
                {matchedOrders.length} {matchedOrders.length === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>

            {matchedOrders.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200/80">
                <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-bold text-sm">Nenhum pedido encontrado</p>
                <p className="text-slate-400 text-xs mt-0.5">Tente buscar por outro número ou nome</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {matchedOrders.map((order) => {
                  const feeFormatted = parseFloat(order.feeValue || '0').toFixed(2).replace('.', ',');
                  return (
                    <li
                      key={order.id}
                      className="p-3 bg-amber-50/80 border border-amber-300/80 rounded-2xl flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">
                              Pedido #{order.orderNumber}
                            </span>
                            <span className="bg-slate-900 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                              {order.motoboyName}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-500">
                            Loja: {order.storeName}
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl">
                        R$ {feeFormatted}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">
            <p className="text-xs font-semibold">Os pedidos correspondentes também serão destacados em amarelo nos cartões dos motoboys na tela.</p>
          </div>
        )}

        {/* Action Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-2.5 rounded-2xl text-sm transition duration-150 flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Ver na Tela Principal</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
