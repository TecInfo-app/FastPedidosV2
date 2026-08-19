import React, { useState, useEffect } from 'react';
import { Order, Store, Motoboy } from '../../types';
import { X, Save } from 'lucide-react';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  stores: Store[];
  motoboys: Motoboy[];
  onSaveEdit: (orderId: string, orderNumber: string, storeName: string, motoboyName: string, feeValue: string) => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({
  isOpen,
  onClose,
  order,
  stores,
  motoboys,
  onSaveEdit,
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [storeName, setStoreName] = useState('');
  const [motoboyName, setMotoboyName] = useState('');
  const [feeValue, setFeeValue] = useState('');

  useEffect(() => {
    if (order) {
      setOrderNumber(order.orderNumber);
      setStoreName(order.storeName || (stores[0]?.name ?? ''));
      setMotoboyName(order.motoboyName || (motoboys[0]?.name ?? ''));
      setFeeValue(order.feeValue);
    }
  }, [order, stores, motoboys]);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFee = parseFloat(feeValue);
    if (!orderNumber.trim() || isNaN(parsedFee) || parsedFee < 0) {
      alert('Preencha todos os campos com valores válidos.');
      return;
    }

    onSaveEdit(order.id, orderNumber.trim(), storeName, motoboyName, parsedFee.toFixed(2));
  };

  return (
    <div
      id="editOrderModal"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Editar Pedido
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition duration-200 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form id="editOrderForm" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label id="editOrderNumberLabel" htmlFor="editOrderNumber" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Número do Pedido
            </label>
            <input
              id="editOrderNumber"
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-base bg-white"
            />
          </div>

          <div>
            <label htmlFor="editStoreSelect" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Loja
            </label>
            <select
              id="editStoreSelect"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-base bg-white"
            >
              {stores
                .filter((s) => s.isActiveToday !== false || s.name === order.storeName)
                .map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="editMotoboySelect" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Motoboy
            </label>
            <select
              id="editMotoboySelect"
              required
              value={motoboyName}
              onChange={(e) => setMotoboyName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-base bg-white"
            >
              {motoboys
                .filter((m) => m.isActiveToday !== false || m.name === order.motoboyName)
                .map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="editFeeValue" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Valor da Taxa (R$)
            </label>
            <input
              id="editFeeValue"
              type="number"
              step="0.01"
              required
              value={feeValue}
              onChange={(e) => setFeeValue(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-base bg-white"
            />
            <p className="text-xs text-slate-500 mt-1 font-medium">
              A descrição da taxa original (Fixa ou Avulsa) será mantida.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition duration-200 cursor-pointer flex items-center justify-center gap-2 mt-6"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};
