import React from 'react';
import { Order, Motoboy } from '../types';
import { MotoboyCard } from './MotoboyCard';

interface MotoboyGridProps {
  motoboys: Motoboy[];
  orders: Order[];
  searchTerm: string;
  onConfirmDeleteOrder: (id: string, orderNumber: string) => void;
  onOpenEditOrder: (id: string) => void;
}

export const MotoboyGrid: React.FC<MotoboyGridProps> = ({
  motoboys,
  orders,
  searchTerm,
  onConfirmDeleteOrder,
  onOpenEditOrder,
}) => {
  const cleanSearchTerm = searchTerm.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredOrders = orders.filter((order) => {
    if (!cleanSearchTerm) return true;
    const orderNumNorm = (order.orderNumber || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const storeNorm = (order.storeName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const motoboyNorm = (order.motoboyName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return (
      orderNumNorm.includes(cleanSearchTerm) ||
      storeNorm.includes(cleanSearchTerm) ||
      motoboyNorm.includes(cleanSearchTerm)
    );
  });

  // Group by Motoboy
  const groupedByMotoboy = filteredOrders.reduce((acc, order) => {
    const name = order.motoboyName || 'Sem Motoboy';
    if (!acc[name]) acc[name] = [];
    acc[name].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const motoboyNames = Object.keys(groupedByMotoboy).sort();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200/80">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
        Planilha de Pedidos Agrupados por Motoboy
      </h2>

      {filteredOrders.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <p className="text-slate-500 text-base font-medium">
            {cleanSearchTerm
              ? `Nenhum pedido encontrado com o termo "${searchTerm}". Tente pesquisar por número, loja ou motoboy.`
              : 'Nenhum pedido registrado ainda.'}
          </p>
        </div>
      ) : (
        <div id="motoboyOrdersContainer" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {motoboyNames.map((motoboyName) => {
            const matchedBoy = motoboys.find(
              (m) => m.name.toLowerCase() === motoboyName.toLowerCase()
            );
            return (
              <MotoboyCard
                key={motoboyName}
                motoboyName={motoboyName}
                motoboyStatus={matchedBoy?.status}
                orders={groupedByMotoboy[motoboyName]}
                searchTerm={searchTerm}
                onConfirmDeleteOrder={onConfirmDeleteOrder}
                onOpenEditOrder={onOpenEditOrder}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
