import React, { useState, useEffect } from 'react';
import { ShoppingBag, Bike, Check, Loader2, ChevronDown, ChevronUp, RefreshCw, MapPin, User, AlertCircle, Sparkles, XCircle } from 'lucide-react';
import { Order } from '../types';

interface IFoodOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  items: string;
  totalValue: string;
  createdAt: string;
  entregaFacilRequested: boolean;
  entregaFacilStatus: {
    courierName: string;
    courierPhone: string;
    status: string;
  } | null;
}

interface IFoodPanelProps {
  allOrders: Order[];
  onShowAlert: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onAssignToInHouseMotoboy: (orderNumber: string, customerName: string, deliveryAddress: string) => void;
  onAddEntregaFacilOrder: (orderNumber: string, customerName: string, deliveryAddress: string, courierName: string) => void;
}

export const IFoodPanel: React.FC<IFoodPanelProps> = ({
  allOrders,
  onShowAlert,
  onAssignToInHouseMotoboy,
  onAddEntregaFacilOrder,
}) => {
  const DEFAULT_WORKER_URL = 'https://ifood-integracao.iranildo-jobs.workers.dev';
  const API_BASE = (import.meta.env.VITE_API_URL || DEFAULT_WORKER_URL).replace(/\/$/, '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [iFoodOrders, setIFoodOrders] = useState<IFoodOrder[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // orderId being dispatched or requesting rider
  const [manualOrderId, setManualOrderId] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  const [isSandbox, setIsSandbox] = useState(() => localStorage.getItem('ifood_sandbox') === 'true');

  useEffect(() => {
    const checkSandbox = () => {
      setIsSandbox(localStorage.getItem('ifood_sandbox') === 'true');
    };
    checkSandbox();
    window.addEventListener('storage', checkSandbox);
    return () => window.removeEventListener('storage', checkSandbox);
  }, [isExpanded]);
  const [importedOrders, setImportedOrders] = useState<IFoodOrder[]>(() => {
    try {
      const saved = localStorage.getItem('ifood_imported_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dismissedOrderIds, setDismissedOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ifood_dismissed_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cancelledOrderIds, setCancelledOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ifood_cancelled_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [confirmedOrderIds, setConfirmedOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ifood_confirmed_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dispatchedOrderIds, setDispatchedOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ifood_dispatched_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    localStorage.setItem('ifood_imported_orders', JSON.stringify(importedOrders));
  }, [importedOrders]);

  useEffect(() => {
    localStorage.setItem('ifood_confirmed_orders', JSON.stringify(confirmedOrderIds));
  }, [confirmedOrderIds]);

  useEffect(() => {
    localStorage.setItem('ifood_dispatched_orders', JSON.stringify(dispatchedOrderIds));
  }, [dispatchedOrderIds]);

  // Merge synchronized and imported lists, prioritizing imported ones and ensuring strict uniqueness of ID
  const displayedOrders: IFoodOrder[] = [];
  const seenIds = new Set<string>();

  for (const o of importedOrders) {
    if (!seenIds.has(o.id)) {
      seenIds.add(o.id);
      displayedOrders.push(o);
    }
  }

  for (const o of iFoodOrders) {
    if (!seenIds.has(o.id)) {
      seenIds.add(o.id);
      displayedOrders.push(o);
    }
  }

  const handleImportOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderId.trim()) return;

    const clientId = localStorage.getItem('ifood_client_id') || '';
    const clientSecret = localStorage.getItem('ifood_client_secret') || '';
    const merchantId = localStorage.getItem('ifood_merchant_id') || '';
    const sandbox = localStorage.getItem('ifood_sandbox') === 'true';

    if (!clientId || !clientSecret || !merchantId) {
      onShowAlert('Por favor, configure suas credenciais do iFood primeiro no painel de configurações.', 'warning');
      return;
    }

    setImportLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/ifood/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          clientSecret,
          merchantId,
          orderNumber: manualOrderId.trim(),
          sandbox: sandbox
        })
      });

      const data = await response.json();
      if (data.success) {
        onShowAlert(data.message || 'Pedido localizado e integrado com sucesso!', 'success');
        
        // Add the real mock or fetched sandbox order to the list so they can play with it
        const newOrder: IFoodOrder = {
          id: manualOrderId.trim(),
          orderNumber: manualOrderId.trim().substring(0, 4).toUpperCase(),
          customerName: data.customerName || 'Cliente Simulado iFood',
          deliveryAddress: data.deliveryAddress || 'Rua Heitor Penteado, 1420 - Sumarezinho, São Paulo',
          items: '1x Combo Hambúrguer de Teste + Refrigerante',
          totalValue: '45.00',
          createdAt: 'Agora mesmo',
          entregaFacilRequested: false,
          entregaFacilStatus: null
        };
        
        setImportedOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
        setManualOrderId('');
      } else {
        onShowAlert(data.message || 'Falha ao buscar o pedido no iFood. Verifique o ID do pedido e as credenciais.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowAlert('Erro ao conectar com o servidor para processar pedido.', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const fetchIFoodOrders = async (silent = false) => {
    const clientId = localStorage.getItem('ifood_client_id') || '';
    const clientSecret = localStorage.getItem('ifood_client_secret') || '';
    const merchantId = localStorage.getItem('ifood_merchant_id') || '';
    const sandbox = localStorage.getItem('ifood_sandbox') === 'true';

    if (!clientId || !clientSecret || !merchantId) {
      if (!silent) {
        onShowAlert('Por favor, insira o Client ID, Client Secret e o ID da Loja (Merchant ID) no painel de configurações (ícone de engrenagem) para sincronizar!', 'warning');
      }
      setIFoodOrders([]);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ifood/orders?clientId=${encodeURIComponent(clientId)}&clientSecret=${encodeURIComponent(clientSecret)}&merchantId=${encodeURIComponent(merchantId)}&sandbox=${sandbox}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = Array.isArray(data) ? data.filter((o: IFoodOrder) => !dismissedOrderIds.includes(o.id)) : [];
        setIFoodOrders(filtered);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (!silent) {
          onShowAlert(errData.message || 'Erro ao conectar com o iFood. Verifique suas credenciais.', 'error');
        }
        setIFoodOrders([]);
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        onShowAlert('Falha na comunicação com o servidor iFood.', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchIFoodOrders(!isExpanded);

    // Set up background polling interval
    const interval = setInterval(() => {
      const isEnabled = localStorage.getItem('ifood_enabled') === 'true';
      if (isEnabled) {
        fetchIFoodOrders(true);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isExpanded]);

  const handleRequestEntregaFacil = async (orderId: string, orderNumber: string) => {
    setActionLoading(orderId + '-delivery');
    try {
      const res = await fetch(`${API_BASE}/api/ifood/entrega-facil`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderNumber })
      });
      const data = await res.json();
      if (data.success && data.deliveryStatus) {
        const updateFn = (prev: IFoodOrder[]) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  entregaFacilRequested: true,
                  entregaFacilStatus: data.deliveryStatus
                }
              : o
          );

        setIFoodOrders(updateFn);
        setImportedOrders(updateFn);

        // Auto-register order in the main active dashboard under "iFood: [Entregador]"
        const targetOrderObj = displayedOrders.find((o) => o.id === orderId);
        const customerName = targetOrderObj?.customerName || "Cliente iFood";
        const deliveryAddress = targetOrderObj?.deliveryAddress || "Entrega Fácil";
        onAddEntregaFacilOrder(orderNumber, customerName, deliveryAddress, data.deliveryStatus.courierName);

        onShowAlert(`Motoboy do iFood solicitado com sucesso para o pedido Nº ${orderNumber}!`, 'success');
      } else {
        onShowAlert(data.message || 'Erro ao solicitar Entrega Fácil.', 'error');
      }
    } catch (err) {
      console.error(err);
      onShowAlert('Erro de rede ao solicitar Entrega Fácil.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmIFoodOrder = async (orderId: string, orderNumber: string) => {
    setActionLoading(orderId + '-confirm');
    const clientId = localStorage.getItem('ifood_client_id') || '';
    const clientSecret = localStorage.getItem('ifood_client_secret') || '';
    const merchantId = localStorage.getItem('ifood_merchant_id') || '';

    if (!clientId || !clientSecret || !merchantId) {
      onShowAlert('Configure suas credenciais iFood primeiro no menu de configurações.', 'warning');
      setActionLoading(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/ifood/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, merchantId, orderNumber })
      });
      const data = await res.json();
      if (data.success) {
        onShowAlert(`Pedido Nº ${orderNumber} confirmado com sucesso no iFood!`, 'success');
        const updatedConfirmed = [...confirmedOrderIds, orderId];
        setConfirmedOrderIds(updatedConfirmed);
        localStorage.setItem('ifood_confirmed_orders', JSON.stringify(updatedConfirmed));
      } else {
        onShowAlert(`[iFood] ${data.message}`, 'info');
      }
    } catch (err) {
      console.error(err);
      onShowAlert('Erro ao confirmar pedido no iFood.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDispatchOfficial = async (orderId: string, orderNumber: string) => {
    setActionLoading(orderId + '-dispatch');
    const clientId = localStorage.getItem('ifood_client_id') || '';
    const clientSecret = localStorage.getItem('ifood_client_secret') || '';
    const merchantId = localStorage.getItem('ifood_merchant_id') || '';
    const sandbox = localStorage.getItem('ifood_sandbox') === 'true';

    if (!clientId || !clientSecret || !merchantId) {
      onShowAlert('Configure suas credenciais iFood primeiro clicando no botão "Configurações" (ícone de engrenagem) no topo.', 'warning');
      setActionLoading(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/ifood/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, merchantId, orderId, orderNumber, sandbox })
      });
      const data = await res.json();
      if (data.success) {
        onShowAlert(`Pedido Nº ${orderNumber} despachado com sucesso no painel oficial do iFood!`, 'success');
        const updatedDispatched = [...dispatchedOrderIds, orderId];
        setDispatchedOrderIds(updatedDispatched);
        localStorage.setItem('ifood_dispatched_orders', JSON.stringify(updatedDispatched));
      } else {
        onShowAlert(`[iFood] ${data.message}`, 'error');
      }
    } catch (err) {
      console.error(err);
      onShowAlert('Erro ao enviar sinal de despacho ao iFood.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelIFoodOrder = async (orderId: string, orderNumber: string) => {
    setActionLoading(orderId + '-cancel');
    const clientId = localStorage.getItem('ifood_client_id') || '';
    const clientSecret = localStorage.getItem('ifood_client_secret') || '';
    const merchantId = localStorage.getItem('ifood_merchant_id') || '';

    if (!clientId || !clientSecret || !merchantId) {
      onShowAlert('Configure suas credenciais iFood primeiro clicando no botão "Configurações" (ícone de engrenagem) no topo.', 'warning');
      setActionLoading(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/ifood/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, merchantId })
      });
      const data = await res.json();
      if (data.success) {
        onShowAlert(`Pedido Nº ${orderNumber} cancelado com sucesso no iFood!`, 'success');
        const updatedCancelled = [...cancelledOrderIds, orderId];
        setCancelledOrderIds(updatedCancelled);
        localStorage.setItem('ifood_cancelled_orders', JSON.stringify(updatedCancelled));
      } else {
        onShowAlert(`[iFood] ${data.message}`, 'error');
      }
    } catch (err) {
      console.error(err);
      onShowAlert('Erro ao enviar sinal de cancelamento ao iFood.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mb-6">
      {/* Compact iFood Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold py-3.5 px-5 rounded-2xl transition duration-200 cursor-pointer flex items-center justify-between shadow-md"
      >
        <span className="flex items-center gap-2.5 text-sm md:text-base">
          <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
          <span>Pedidos iFood</span>
        </span>
        <div className="flex items-center gap-1.5 bg-rose-800 px-3 py-1 rounded-xl text-xs font-black">
          <span>{isExpanded ? 'Recolher Pedidos' : 'Abrir Lista'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
        </div>
      </button>

      {/* Expanded iFood Orders List Container */}
      {isExpanded && (
        <div className="mt-3 bg-white border border-rose-200/80 rounded-3xl p-5 shadow-lg shadow-rose-100 animate-in slide-in-from-top-3 duration-200 space-y-4">
          <div className={`flex justify-between items-center p-3 rounded-2xl border ${!isSandbox ? 'bg-emerald-50/80 border-emerald-200' : 'bg-rose-50/70 border-rose-100'}`}>
            <span className={`text-xs font-black flex items-center gap-1.5 ${!isSandbox ? 'text-emerald-950' : 'text-rose-950'}`}>
              {!isSandbox ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                  <span>Conexão Oficial iFood (Homologação & Produção)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Modo Simulação / Sandbox Ativo</span>
                </>
              )}
            </span>
            <button
              onClick={() => fetchIFoodOrders(false)}
              disabled={loading}
              className={`p-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold ${!isSandbox ? 'text-emerald-800 hover:bg-emerald-100/60' : 'text-rose-700 hover:bg-rose-100/50'}`}
              title="Atualizar Lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>
          </div>

          {/* Form to paste the Simulator Order ID and see it instantly! */}
          <form onSubmit={handleImportOrder} className="flex gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Importar Pedido Gerado no Portal do iFood (Colar ID do pedido)
              </label>
              <input
                type="text"
                value={manualOrderId}
                onChange={(e) => setManualOrderId(e.target.value)}
                placeholder="Ex: 901d268e-0247-4b27-a6e3-838768266df7"
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-medium focus:outline-none focus:border-rose-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={importLoading || !manualOrderId.trim()}
              className="bg-slate-900 hover:bg-rose-600 disabled:bg-slate-200 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              {importLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Importar Pedido</span>
            </button>
          </form>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
              <span className="text-xs text-rose-800 font-bold">Buscando pedidos pendentes no iFood...</span>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="text-center py-8 bg-white/40 rounded-2xl border border-rose-100/50">
              <p className="text-slate-500 text-sm font-semibold">Nenhum pedido pendente encontrado no momento.</p>
              <p className="text-slate-400 text-xs mt-1 font-medium">Os pedidos aparecerão assim que forem feitos no iFood.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedOrders.map((order) => {
                const isDispatchLoading = actionLoading === order.id + '-dispatch';
                const isDeliveryLoading = actionLoading === order.id + '-delivery';
                const assignedInHouseOrder = allOrders.find((o) => o.orderNumber === order.orderNumber);
                const isAlreadyAssigned = !!assignedInHouseOrder;
                const isAssignedViaIFoodDelivery = isAlreadyAssigned && assignedInHouseOrder.motoboyName.startsWith("iFood:");

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Order Row */}
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-1 rounded-lg">
                          Pedido #{order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{order.createdAt}</span>
                      </div>

                      {/* Customer Info */}
                      <div className="space-y-1.5 mb-3.5">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{order.customerName}</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs font-medium text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-tight">{order.deliveryAddress}</span>
                        </div>
                      </div>

                      {/* Items details */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 font-bold mb-4">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Itens do Pedido</span>
                        <p className="line-clamp-2 leading-relaxed">{order.items}</p>
                        <span className="block mt-1 text-slate-900 text-xs font-black">Total: R$ {String(order.totalValue || '0').replace('.', ',')}</span>
                      </div>
                    </div>

                    {/* Delivery Status or Action buttons */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      {confirmedOrderIds.includes(order.id) && !dispatchedOrderIds.includes(order.id) && !isAssignedViaIFoodDelivery && !isAlreadyAssigned && (
                        <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-md flex items-center gap-2">
                          <Check className="w-4 h-4 text-indigo-600 stroke-[3] shrink-0" />
                          <div>
                            <span className="text-[10px] uppercase font-black tracking-wider text-indigo-900 block">Status: Confirmado</span>
                            <span className="text-xs text-indigo-800 font-bold">Pedido confirmado no iFood</span>
                          </div>
                        </div>
                      )}

                      {cancelledOrderIds.includes(order.id) ? (
                        <div className="bg-rose-100/90 border border-rose-300 p-3.5 rounded-md space-y-1 text-center">
                          <span className="text-[11px] uppercase font-black tracking-widest text-rose-900 flex items-center justify-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-700 stroke-[3]" /> Pedido Cancelado no iFood
                          </span>
                          <p className="text-[11px] text-rose-800 font-bold">Cancelamento confirmado e registrado na plataforma.</p>
                        </div>
                      ) : dispatchedOrderIds.includes(order.id) ? (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-md space-y-1">
                          <span className="text-[10px] uppercase font-black tracking-widest text-amber-800 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" /> Pedido Despachado (iFood)
                          </span>
                          <p className="text-xs text-amber-900 font-extrabold">Status: Despachado com sucesso</p>
                        </div>
                      ) : isAssignedViaIFoodDelivery ? (
                        <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-md space-y-1">
                          <span className="text-[10px] uppercase font-black tracking-widest text-rose-800 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-rose-600 stroke-[3]" /> Motoboy iFood Vinculado
                          </span>
                          <p className="text-xs text-slate-800 font-extrabold">
                            Entregador: {(assignedInHouseOrder?.motoboyName || '').replace("iFood: ", "")}
                          </p>
                          <span className="inline-block mt-1 bg-rose-200/50 text-rose-900 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                            Entrega Fácil Ativa
                          </span>
                        </div>
                      ) : isAlreadyAssigned ? (
                        <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-md space-y-1">
                          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-800 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Despachado (Motoboy da Casa)
                          </span>
                          <p className="text-xs text-slate-800 font-extrabold">Entregador: {assignedInHouseOrder.motoboyName}</p>
                          <span className="inline-block mt-1 bg-emerald-200/50 text-emerald-900 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                            Ativo na Planilha
                          </span>
                        </div>
                      ) : order.entregaFacilRequested && order.entregaFacilStatus ? (
                        <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-md space-y-1">
                          <span className="text-[10px] uppercase font-black tracking-widest text-rose-800 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-rose-600 stroke-[3]" /> Motoboy iFood Vinculado
                          </span>
                          <p className="text-xs text-slate-800 font-extrabold">Entregador: {order.entregaFacilStatus.courierName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Contato: {order.entregaFacilStatus.courierPhone}</p>
                          <span className="inline-block mt-1 bg-rose-200/50 text-rose-900 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                            {order.entregaFacilStatus.status}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => setModalConfig({
                              isOpen: true,
                              title: 'Confirmar Pedido no iFood',
                              message: `Deseja confirmar o recebimento do pedido Nº ${order.orderNumber} no iFood?`,
                              onConfirm: () => handleConfirmIFoodOrder(order.id, order.orderNumber)
                            })}
                            disabled={actionLoading === order.id + '-confirm'}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold py-3 px-4 rounded-md text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            title="Confirmar recebimento do pedido no iFood"
                          >
                            {actionLoading === order.id + '-confirm' ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 stroke-[3]" />
                            )}
                            <span>Confirmar (iFood)</span>
                          </button>

                          <button
                            onClick={() => setModalConfig({
                              isOpen: true,
                              title: 'Despachar Pedido no iFood',
                              message: `Deseja despachar o pedido Nº ${order.orderNumber} para entrega no iFood?`,
                              onConfirm: () => handleDispatchOfficial(order.id, order.orderNumber)
                            })}
                            disabled={actionLoading === order.id + '-dispatch'}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-amber-400 font-extrabold py-3 px-4 rounded-md text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            title="Despachar pedido para entrega no iFood"
                          >
                            {actionLoading === order.id + '-dispatch' ? (
                              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                            ) : (
                              <Bike className="w-4 h-4" />
                            )}
                            <span>Despachar (iFood)</span>
                          </button>

                          <button
                            onClick={() => setModalConfig({
                              isOpen: true,
                              title: 'Chamar Motoboy iFood (Entrega Fácil)',
                              message: `Deseja solicitar o motoboy do iFood (Entrega Fácil) para o pedido Nº ${order.orderNumber}?`,
                              onConfirm: () => handleRequestEntregaFacil(order.id, order.orderNumber)
                            })}
                            disabled={isDeliveryLoading}
                            className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-black py-3 px-4 rounded-md text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                          >
                            {isDeliveryLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                              <Bike className="w-4 h-4 text-white" />
                            )}
                            <span>Chamar Motoboy iFood (Entrega Fácil)</span>
                          </button>

                          <button
                            onClick={() => setModalConfig({
                              isOpen: true,
                              title: 'Enviar para Motoboy da Casa',
                              message: `Deseja enviar o pedido Nº ${order.orderNumber} (${order.customerName}) para o Motoboy da Casa?`,
                              onConfirm: () => onAssignToInHouseMotoboy(order.orderNumber, order.customerName, order.deliveryAddress)
                            })}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-md text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            <Bike className="w-4 h-4" />
                            <span>Enviar p/ Motoboy da Casa</span>
                          </button>

                          <button
                            onClick={() => setModalConfig({
                              isOpen: true,
                              title: 'Cancelar Pedido no iFood',
                              message: `Tem certeza que deseja cancelar o pedido Nº ${order.orderNumber} no iFood?`,
                              onConfirm: () => handleCancelIFoodOrder(order.id, order.orderNumber)
                            })}
                            disabled={actionLoading === order.id + '-cancel'}
                            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-3 px-4 rounded-md text-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                          >
                            {actionLoading === order.id + '-cancel' ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-600" />
                            )}
                            <span>Cancelar Pedido no iFood</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">{modalConfig.title}</h3>
            <p className="text-sm text-slate-600 font-medium">{modalConfig.message}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-md text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  modalConfig.onConfirm();
                  setModalConfig(prev => ({ ...prev, isOpen: false }));
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-5 py-2 rounded-md text-xs transition cursor-pointer shadow-sm"
              >
                Confirmar / OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
