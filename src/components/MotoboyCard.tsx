import React from 'react';
import { Order } from '../types';
import { Printer, Trash2, Edit2, Store as StoreIcon, Bike, ShoppingBag, Calendar } from 'lucide-react';
import { printDeliveryReport, printStoreTotalsReport } from '../utils/print';

interface MotoboyCardProps {
  motoboyName: string;
  motoboyStatus?: 'disponivel' | 'entrega' | 'retornando';
  orders: Order[];
  searchTerm: string;
  onConfirmDeleteOrder: (id: string, orderNumber: string) => void;
  onOpenEditOrder: (id: string) => void;
}

export const MotoboyCard: React.FC<MotoboyCardProps> = ({
  motoboyName,
  motoboyStatus,
  orders,
  searchTerm,
  onConfirmDeleteOrder,
  onOpenEditOrder,
}) => {
  const totalFee = orders.reduce((sum, o) => sum + parseFloat(o.feeValue || '0'), 0);
  const totalFeeFormatted = totalFee.toFixed(2).replace('.', ',');

  // Sort orders descending by timestamp
  const sortedOrders = [...orders].sort((a, b) => b.timestamp - a.timestamp);

  // Initial avatar letters
  const initials = motoboyName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Group by date string
  const groupedByDate = sortedOrders.reduce((acc, order) => {
    const dateKey = order.timestamp
      ? new Date(order.timestamp).toLocaleDateString('pt-BR')
      : 'Hoje';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const cleanSearchTerm = searchTerm.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/70 p-5 flex flex-col justify-between border-t-4 border-amber-500 border-x border-b border-slate-200/90 min-h-[440px] hover:border-amber-400 transition-all">
      {/* Header with Avatar & Full Name (Dedicated Row) */}
      <div className="pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-amber-400 font-extrabold text-sm flex items-center justify-center shadow-md flex-shrink-0 border border-slate-700">
            {initials || <Bike className="w-5 h-5" />}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 leading-snug break-words" title={motoboyName}>
              {motoboyName}
            </h3>
            {/* Real-time Status Badge */}
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2 py-0.5 mt-1 rounded-md border ${
              motoboyStatus === 'entrega'
                ? 'bg-rose-50 text-rose-600 border-rose-200/60 animate-pulse'
                : motoboyStatus === 'retornando'
                ? 'bg-amber-50 text-amber-600 border-amber-200/60'
                : 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                motoboyStatus === 'entrega'
                  ? 'bg-rose-500'
                  : motoboyStatus === 'retornando'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`} />
              {motoboyStatus === 'entrega'
                ? 'Em Entrega (Saiu)'
                : motoboyStatus === 'retornando'
                ? 'Retornando p/ Loja'
                : 'Na Loja (Disponível)'}
            </span>
          </div>
        </div>

        {/* Action Toolbar & Order Count (Second Row) */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200/60">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
            <span>{orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => printDeliveryReport(motoboyName, orders)}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-extrabold py-1.5 px-2.5 rounded-xl transition-all shadow-2xs whitespace-nowrap flex items-center gap-1 cursor-pointer"
              title="Imprimir Relatório de Entregas"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              type="button"
              onClick={() => printStoreTotalsReport(motoboyName, orders)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold py-1.5 px-2.5 rounded-xl transition-all shadow-2xs whitespace-nowrap flex items-center gap-1 cursor-pointer border border-slate-200"
              title="Imprimir Totais por Loja"
            >
              <StoreIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Lojas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="flex-grow overflow-y-auto -mx-1 px-1 pr-1.5 space-y-3 custom-scrollbar">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
            <Bike className="w-10 h-10 stroke-[1.2] mb-2 text-slate-300" />
            <p className="text-xs font-semibold">Nenhum pedido atribuído ainda</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Lance um pedido acima para atribuir</p>
          </div>
        ) : (
          Object.keys(groupedByDate).map((dateKey) => (
            <div key={dateKey} className="pt-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {dateKey}
                </span>
              </div>
              <ul className="space-y-2">
                {groupedByDate[dateKey].map((order) => {
                  const feeFormatted = parseFloat(order.feeValue || '0').toFixed(2).replace('.', ',');
                  const storeInfo = order.storeName ? order.storeName : '';

                  const orderNumNorm = (order.orderNumber || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const storeNorm = (order.storeName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                  const motoboyNorm = (order.motoboyName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                  const isMatched =
                    cleanSearchTerm.length > 0 &&
                    (orderNumNorm.includes(cleanSearchTerm) ||
                      storeNorm.includes(cleanSearchTerm) ||
                      motoboyNorm.includes(cleanSearchTerm));

                  const isEntregue = order.deliveryStatus === 'entregue';

                  return (
                    <li
                      key={order.id}
                      className={`flex flex-col py-2.5 px-3.5 rounded-2xl border shadow-2xs hover:bg-slate-100/80 transition-all ${
                        isEntregue
                          ? 'bg-emerald-50/30 border-emerald-200/60 opacity-80'
                          : isMatched
                          ? 'bg-amber-100/90 ring-2 ring-amber-400 font-semibold border-amber-300'
                          : 'bg-slate-50/90 border-slate-200/80'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div className="flex flex-col flex-grow min-w-0 mr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-slate-900 text-sm truncate">
                              #{order.orderNumber}
                            </span>
                            {isEntregue && (
                              <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-100/80 px-1.5 py-0.5 rounded-md shrink-0">
                                ✓ Entregue
                              </span>
                            )}
                          </div>
                          {storeInfo && (
                            <span className="text-[11px] font-bold text-slate-500 truncate">
                              {storeInfo}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg whitespace-nowrap">
                            R$ {feeFormatted}
                          </span>

                          <button
                            type="button"
                            onClick={() => onOpenEditOrder(order.id)}
                            className="text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition duration-200 cursor-pointer"
                            title="Editar Pedido"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onConfirmDeleteOrder(order.id, order.orderNumber)}
                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition duration-200 cursor-pointer"
                            title="Excluir Pedido"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Optional customer/address sub-row */}
                      {(order.customerName || order.deliveryAddress) && (
                        <div className="border-t border-slate-200/50 mt-1.5 pt-1.5 space-y-1 text-[10px]">
                          {order.customerName && (
                            <div className="flex items-center gap-1 text-slate-600">
                              <span className="font-semibold text-slate-400">Cliente:</span>
                              <span className="font-bold text-slate-700">{order.customerName}</span>
                            </div>
                          )}
                          {order.deliveryAddress && (
                            <div className="flex items-start gap-1 text-slate-600 leading-relaxed">
                              <span className="font-semibold text-slate-400 shrink-0">Endereço:</span>
                              <span className="font-medium text-slate-700">{order.deliveryAddress}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Footer Total Summary */}
      <div className="flex justify-between items-center pt-3 mt-2 border-t border-slate-100 bg-slate-900 text-white p-3.5 rounded-2xl shadow-md">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total a Pagar:</span>
        <span className="text-xl font-black text-amber-400">R$ {totalFeeFormatted}</span>
      </div>
    </div>
  );
};
