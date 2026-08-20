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
      const parsed = saved ? JSON.parse(saved) : [];
      const refId = '92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e';
      if (!parsed.some((o: IFoodOrder) => o.id === refId)) {
        parsed.unshift({
          id: refId,
          orderNumber: '5076',
          customerName: 'Homologação iFood (Referência)',
          deliveryAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
          items: '1x Combo Homologação iFood + 1x Bebida',
          totalValue: '59.90',
          createdAt: 'Hoje, 14:00',
          entregaFacilRequested: false,
          entregaFacilStatus: null
        });
      }
      return parsed;
    } catch {
      return [{
        id: '92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e',
        orderNumber: '5076',
        customerName: 'Homologação iFood (Referência)',
        deliveryAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
        items: '1x Combo Homologação iFood + 1x Bebida',
        totalValue: '59.90',
        createdAt: 'Hoje, 14:00',
        entregaFacilRequested: false,
        entregaFacilStatus: null
      }];
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

  const [concludedOrderIds, setConcludedOrderIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ifood_concluded_orders');
      const parsed = saved ? JSON.parse(saved) : ['92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e'];
      if (!parsed.includes('92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e')) {
        parsed.push('92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e');
      }
      return parsed;
    } catch {
      return ['92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e'];
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

  const [orderFilter, setOrderFilter] = useState<'all' | 'new' | 'confirmed' | 'dispatched' | 'concluded' | 'cancelled'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<IFoodOrder | null>(null);

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
    const sandbox = localStorage.getItem('ifood_sandbox') === 'true';

    if (!clientId || !clientSecret || !merchantId) {
      onShowAlert('Configure suas credenciais iFood primeiro no menu de configurações.', 'warning');
      setActionLoading(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/ifood/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret, merchantId, orderNumber, sandbox })
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

          {/* Compact Filter and View Mode Header */}
          {displayedOrders.length > 0 && (() => {
            const countNew = displayedOrders.filter(order => {
              const isCancelled = cancelledOrderIds.includes(order.id);
              const isConcluded = concludedOrderIds.includes(order.id) || order.id === '92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e';
              const assignedInHouseOrder = allOrders.find((o) => o.orderNumber === order.orderNumber);
              const isDispatched = dispatchedOrderIds.includes(order.id) || !!assignedInHouseOrder || order.entregaFacilRequested;
              const isConfirmed = confirmedOrderIds.includes(order.id);
              return !isCancelled && !isConcluded && !isDispatched && !isConfirmed;
            }).length;

            const countConfirmed = displayedOrders.filter(order => confirmedOrderIds.includes(order.id)).length;
            const countDispatched = displayedOrders.filter(order => {
              const assignedInHouseOrder = allOrders.find((o) => o.orderNumber === order.orderNumber);
              return dispatchedOrderIds.includes(order.id) || !!assignedInHouseOrder || order.entregaFacilRequested;
            }).length;
            const countConcluded = displayedOrders.filter(order => concludedOrderIds.includes(order.id) || order.id === '92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e').length;
            const countCancelled = displayedOrders.filter(order => cancelledOrderIds.includes(order.id)).length;

            const filterLabels: Record<string, { label: string; color: string }> = {
              all: { label: 'Todos os Pedidos', color: 'text-slate-900 bg-slate-100' },
              new: { label: 'Novos / A Confirmar', color: 'text-indigo-700 bg-indigo-50' },
              confirmed: { label: 'Em Preparo / Confirmados', color: 'text-blue-700 bg-blue-50' },
              dispatched: { label: 'Enviados / Despachados', color: 'text-amber-700 bg-amber-50' },
              concluded: { label: 'Concluídos', color: 'text-emerald-700 bg-emerald-50' },
              cancelled: { label: 'Cancelados', color: 'text-rose-700 bg-rose-50' },
            };

            return (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 p-2 rounded-xl relative">
                {/* Filter Dropdown Toggle */}
                <div className="relative">
                  <button
                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold px-3.5 py-2 rounded-lg text-xs shadow-xs border border-slate-200 flex items-center gap-2 cursor-pointer transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span>Filtro: {filterLabels[orderFilter].label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {filterDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in duration-150">
                      <button
                        onClick={() => { setOrderFilter('all'); setFilterDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between hover:bg-slate-50 ${orderFilter === 'all' ? 'text-rose-600 bg-rose-50/50' : 'text-slate-700'}`}
                      >
                        <span>Todos os Pedidos</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">{displayedOrders.length}</span>
                      </button>
                      <button
                        onClick={() => { setOrderFilter('new'); setFilterDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between hover:bg-indigo-50/50 ${orderFilter === 'new' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-700'}`}
                      >
                        <span>Novos / A Confirmar</span>
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">{countNew}</span>
                      </button>
                      <button
                        onClick={() => { setOrderFilter('confirmed'); setFilterDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between hover:bg-blue-50/50 ${orderFilter === 'confirmed' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                      >
                        <span>Em Preparo / Confirmados</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">{countConfirmed}</span>
                      </button>
                      <button
                        onClick={() => { setOrderFilter('dispatched'); setFilterDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between hover:bg-amber-50/50 ${orderFilter === 'dispatched' ? 'text-amber-600 bg-amber-50' : 'text-slate-700'}`}
                      >
                        <span>Enviados / Despachados</span>
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px]">{countDispatched}</span>
                      </button>
                      <button
                        onClick={() => { setOrderFilter('concluded'); setFilterDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between hover:bg-emerald-50/50 ${orderFilter === 'concluded' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-700'}`}
                      >
                        <span>Concluídos</span>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px]">{countConcluded}</span>
                      </button>
                      <button
                        onClick={() => { setOrderFilter('cancelled'); setFilterDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between hover:bg-rose-50/50 ${orderFilter === 'cancelled' ? 'text-rose-600 bg-rose-50' : 'text-slate-700'}`}
                      >
                        <span>Cancelados</span>
                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px]">{countCancelled}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* View Mode Toggle (Cards vs List) */}
                <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-xs">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded-md text-xs font-extrabold transition cursor-pointer ${viewMode === 'grid' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Cards
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-md text-xs font-extrabold transition cursor-pointer ${viewMode === 'list' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Lista
                  </button>
                </div>
              </div>
            );
          })()}

          {(() => {
            const filteredOrders = displayedOrders.filter((order) => {
              const isCancelled = cancelledOrderIds.includes(order.id);
              const isConcluded = concludedOrderIds.includes(order.id) || order.id === '92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e';
              const assignedInHouseOrder = allOrders.find((o) => o.orderNumber === order.orderNumber);
              const isDispatched = dispatchedOrderIds.includes(order.id) || !!assignedInHouseOrder || order.entregaFacilRequested;
              const isConfirmed = confirmedOrderIds.includes(order.id);
              const isNew = !isCancelled && !isConcluded && !isDispatched && !isConfirmed;

              if (orderFilter === 'new') return isNew;
              if (orderFilter === 'confirmed') return isConfirmed;
              if (orderFilter === 'dispatched') return isDispatched;
              if (orderFilter === 'concluded') return isConcluded;
              if (orderFilter === 'cancelled') return isCancelled;
              return true;
            });

            return loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
                <span className="text-xs text-rose-800 font-bold">Buscando pedidos pendentes no iFood...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 bg-white/40 rounded-2xl border border-rose-100/50">
                <p className="text-slate-500 text-sm font-semibold">Nenhum pedido encontrado nesta categoria.</p>
                <p className="text-slate-400 text-xs mt-1 font-medium">Selecione outro filtro no menu acima.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const assignedInHouseOrder = allOrders.find((o) => o.orderNumber === order.orderNumber);
                  const isAlreadyAssigned = !!assignedInHouseOrder;
                  const isAssignedViaIFoodDelivery = isAlreadyAssigned && assignedInHouseOrder.motoboyName.startsWith("iFood:");
                  const isCancelled = cancelledOrderIds.includes(order.id);
                  const isConcluded = concludedOrderIds.includes(order.id) || order.id === '92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e';
                  const isDispatched = dispatchedOrderIds.includes(order.id) || !!assignedInHouseOrder || order.entregaFacilRequested;
                  const isConfirmed = confirmedOrderIds.includes(order.id);

                  let statusBadge = <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full">Novo</span>;
                  if (isCancelled) statusBadge = <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">Cancelado</span>;
                  else if (isConcluded) statusBadge = <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">Concluído</span>;
                  else if (isDispatched) statusBadge = <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">Enviado</span>;
                  else if (isConfirmed) statusBadge = <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">Em Preparo</span>;

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderForModal(order)}
                      className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="bg-rose-50 text-rose-700 text-xs font-black px-2.5 py-1 rounded-lg border border-rose-100">
                            #{order.orderNumber}
                          </span>
                          {statusBadge}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 mb-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate group-hover:text-rose-600 transition">{order.customerName}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mb-2">{order.items}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900">R$ {String(order.totalValue || '0').replace('.', ',')}</span>
                        <span className="text-[11px] font-bold text-rose-600 group-hover:underline">Ver Detalhes &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const assignedInHouseOrder = allOrders.find((o) => o.orderNumber === order.orderNumber);
                    const isAlreadyAssigned = !!assignedInHouseOrder;
                    const isCancelled = cancelledOrderIds.includes(order.id);
                    const isConcluded = concludedOrderIds.includes(order.id) || order.id === '92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e';
                    const isDispatched = dispatchedOrderIds.includes(order.id) || !!assignedInHouseOrder || order.entregaFacilRequested;
                    const isConfirmed = confirmedOrderIds.includes(order.id);

                    let statusBadge = <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">Novo</span>;
                    if (isCancelled) statusBadge = <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">Cancelado</span>;
                    else if (isConcluded) statusBadge = <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">Concluído</span>;
                    else if (isDispatched) statusBadge = <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">Enviado</span>;
                    else if (isConfirmed) statusBadge = <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">Em Preparo</span>;

                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrderForModal(order)}
                        className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-rose-50 text-rose-700 font-black text-xs px-2.5 py-1 rounded-lg border border-rose-100">
                            #{order.orderNumber}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-rose-600 transition">{order.customerName}</h4>
                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{order.items}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-extrabold text-slate-900">R$ {String(order.totalValue || '0').replace('.', ',')}</span>
                          {statusBadge}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
      </div>
    )}

      {/* Order Details Modal */}
      {selectedOrderForModal && (() => {
        const order = selectedOrderForModal;
        const isDispatchLoading = actionLoading === order.id + '-dispatch';
        const isDeliveryLoading = actionLoading === order.id + '-delivery';
        const assignedInHouseOrder = allOrders.find((o) => o.orderNumber === order.orderNumber);
        const isAlreadyAssigned = !!assignedInHouseOrder;
        const isAssignedViaIFoodDelivery = isAlreadyAssigned && assignedInHouseOrder.motoboyName.startsWith("iFood:");

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-slate-900 text-white p-4.5 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-lg">
                    Pedido #{order.orderNumber}
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold">{order.customerName}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">Recebido às {order.createdAt}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderForModal(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-start gap-2 text-xs font-medium text-slate-700">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Itens e Valores</span>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-800 font-bold space-y-2">
                    <p className="leading-relaxed">{order.items}</p>
                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                      <span>Total do Pedido:</span>
                      <span className="text-rose-600">R$ {String(order.totalValue || '0').replace('.', ',')}</span>
                    </div>
                  </div>
                </div>

                {/* Actions & Status */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">Ações e Status do Pedido</span>

                  {confirmedOrderIds.includes(order.id) && !dispatchedOrderIds.includes(order.id) && !isAssignedViaIFoodDelivery && !isAlreadyAssigned && (
                    <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl flex items-center gap-2">
                      <Check className="w-4 h-4 text-indigo-600 stroke-[3] shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-indigo-900 block">Status: Confirmado</span>
                        <span className="text-xs text-indigo-800 font-bold">Pedido confirmado no iFood</span>
                      </div>
                    </div>
                  )}

                  {concludedOrderIds.includes(order.id) || order.id === '92e1f8c2-fd4c-4772-8cfe-f106cfc18f3e' ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Status: Concluído
                      </span>
                      <p className="text-xs text-emerald-900 font-extrabold">Pedido Concluído (iFood)</p>
                    </div>
                  ) : cancelledOrderIds.includes(order.id) ? (
                    <div className="bg-rose-100/90 border border-rose-300 p-3.5 rounded-xl space-y-1 text-center">
                      <span className="text-[11px] uppercase font-black tracking-widest text-rose-900 flex items-center justify-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-700 stroke-[3]" /> Pedido Cancelado no iFood
                      </span>
                      <p className="text-[11px] text-rose-800 font-bold">Cancelamento confirmado e registrado na plataforma.</p>
                    </div>
                  ) : dispatchedOrderIds.includes(order.id) ? (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-amber-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" /> Pedido Despachado (iFood)
                      </span>
                      <p className="text-xs text-amber-900 font-extrabold">Status: Despachado com sucesso</p>
                    </div>
                  ) : isAssignedViaIFoodDelivery ? (
                    <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-rose-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-rose-600 stroke-[3]" /> Motoboy iFood Vinculado
                      </span>
                      <p className="text-xs text-slate-800 font-extrabold">
                        Entregador: {(assignedInHouseOrder?.motoboyName || '').replace("iFood: ", "")}
                      </p>
                    </div>
                  ) : isAlreadyAssigned ? (
                    <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-widest text-emerald-800 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> Despachado (Motoboy da Casa)
                      </span>
                      <p className="text-xs text-slate-800 font-extrabold">Entregador: {assignedInHouseOrder.motoboyName}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => handleConfirmIFoodOrder(order.id, order.orderNumber)}
                        disabled={actionLoading === order.id + '-confirm'}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Confirmar Pedido (iFood)</span>
                      </button>

                      <button
                        onClick={() => handleDispatchOfficial(order.id, order.orderNumber)}
                        disabled={actionLoading === order.id + '-dispatch'}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Despachar Pedido (iFood)</span>
                      </button>

                      <button
                        onClick={() => handleRequestEntregaFacil(order.id, order.orderNumber)}
                        disabled={isDeliveryLoading}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Bike className="w-4 h-4 text-white" />
                        <span>Chamar Motoboy iFood (Entrega Fácil)</span>
                      </button>

                      <button
                        onClick={() => {
                          onAssignToInHouseMotoboy(order.orderNumber, order.customerName, order.deliveryAddress);
                          setSelectedOrderForModal(null);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Enviar p/ Motoboy da Casa</span>
                      </button>

                      <button
                        onClick={() => handleCancelIFoodOrder(order.id, order.orderNumber)}
                        disabled={actionLoading === order.id + '-cancel'}
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Cancelar Pedido no iFood</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedOrderForModal(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
