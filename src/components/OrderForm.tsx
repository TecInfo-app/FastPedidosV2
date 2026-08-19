import React, { useState } from 'react';
import { PlusCircle, ArrowRight, Package, MapPin, User, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface OrderFormProps {
  onStartOrder: (orderNumber: string, customerName?: string, deliveryAddress?: string) => void;
  statusMessage: string;
  onOpenSearch: () => void;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  onStartOrder,
  statusMessage,
  onOpenSearch,
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    onStartOrder(
      orderNumber.trim(),
      customerName.trim() || undefined,
      deliveryAddress.trim() || undefined
    );
    setOrderNumber('');
    setCustomerName('');
    setDeliveryAddress('');
  };

  return (
    <div className="bg-white p-5 md:p-6 rounded-3xl shadow-xl shadow-slate-200/60 mb-6 border border-slate-200/90 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Package className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Lançamento Rápido de Pedido
          </h2>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
          Pressione Enter para Confirmar
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              id="orderNumberInput"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Digite o número do pedido (Ex: 101, 402)..."
              className="w-full p-3.5 pl-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-slate-900 text-base font-medium transition-all placeholder:text-slate-400 bg-slate-50/70 focus:bg-white shadow-2xs"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            <button
              id="startOrderButton"
              type="submit"
              className="flex-grow sm:flex-none bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2 text-base cursor-pointer hover:scale-[1.01]"
            >
              <PlusCircle className="w-5 h-5 stroke-[2.5]" />
              <span>Confirmar Pedido</span>
              <ArrowRight className="w-4 h-4 ml-0.5 opacity-80" />
            </button>

            <button
              id="quickSearchButton"
              type="button"
              onClick={onOpenSearch}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 p-3.5 rounded-2xl border border-slate-800 transition-all duration-200 flex items-center justify-center cursor-pointer shadow-md hover:scale-[1.01] shrink-0 aspect-square"
              title="Pesquisar Pedido na Planilha"
            >
              <Search className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Toggle Details Button */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200"
          >
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showDetails ? 'Ocultar Detalhes do Cliente' : 'Adicionar Detalhes (Nome / Endereço)'}</span>
          </button>
        </div>

        {/* Optional Name/Address Fields */}
        {showDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5 animate-in slide-in-from-top-2 duration-150">
            <div className="relative">
              <label htmlFor="customerNameInput" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Nome do Cliente (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="customerNameInput"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do Cliente (Ex: Ana Maria)"
                  className="w-full p-2.5 pl-9 border border-slate-300 rounded-xl outline-none text-base text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="deliveryAddressInput" className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Endereço de Entrega (Opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  id="deliveryAddressInput"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Endereço Completo (Ex: Rua Augusta, 100)"
                  className="w-full p-2.5 pl-9 border border-slate-300 rounded-xl outline-none text-base text-slate-800 bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {statusMessage && (
        <p id="statusMessage" className="mt-3 text-sm text-rose-600 font-bold flex items-center gap-1.5 animate-in fade-in">
          ⚠️ {statusMessage}
        </p>
      )}
    </div>
  );
};
