import React, { useState, useEffect, useRef } from 'react';
import { Motoboy, Order } from '../types';
import { Bike, ShieldAlert, LogIn, LogOut, Search, ClipboardList, Printer, ShoppingBag, ArrowLeft, Check } from 'lucide-react';
import { printDeliveryReport } from '../utils/print';

const playNotificationSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15); // A6
    
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.error('Falha ao reproduzir som de notificação', e);
  }
};

interface MotoboyPortalProps {
  motoboys: Motoboy[];
  orders: Order[];
  onExitPortal: () => void;
  onShowAlert: (msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  onUpdateStatus: (motoboyId: string, status: 'disponivel' | 'entrega' | 'retornando') => void;
  onUpdateOrderDeliveryStatus: (orderId: string, deliveryStatus: 'pendente' | 'entregue') => void;
}

export const MotoboyPortal: React.FC<MotoboyPortalProps> = ({
  motoboys,
  orders,
  onExitPortal,
  onShowAlert,
  onUpdateStatus,
  onUpdateOrderDeliveryStatus,
}) => {
  const [selectedBoyId, setSelectedBoyId] = useState('');
  const [pin, setPin] = useState('');
  const [loggedInBoy, setLoggedInBoy] = useState<Motoboy | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deselectedOrderIds, setDeselectedOrderIds] = useState<Record<string, boolean>>({});
  const [deliveryCodes, setDeliveryCodes] = useState<Record<string, string>>({});
  const prevOrdersCount = useRef(0);

  // Filter orders for logged-in motoboy
  const currentBoy = loggedInBoy ? motoboys.find(m => m.id === loggedInBoy.id) || loggedInBoy : null;

  const myOrders = currentBoy
    ? orders.filter(o => o.motoboyName.toLowerCase() === currentBoy.name.toLowerCase())
    : [];

  useEffect(() => {
    if (loggedInBoy) {
      if (myOrders.length > prevOrdersCount.current && prevOrdersCount.current !== 0) {
        onShowAlert('🔔 Novo pedido atribuído a você!', 'info');
        playNotificationSound();
      }
      prevOrdersCount.current = myOrders.length;
    } else {
      prevOrdersCount.current = 0;
    }
  }, [myOrders.length, loggedInBoy, onShowAlert]);

  const toggleSelectOrder = (id: string) => {
    setDeselectedOrderIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleConfirmOrder = (orderId: string, inputCode?: string, codeRequired?: boolean) => {
    const order = myOrders.find(o => o.id === orderId);
    if (!order) return;

    if (codeRequired) {
      if (!inputCode || inputCode.trim() !== order.confirmationCode) {
        onShowAlert('❌ Código de entrega incorreto. Digite o código de 4 dígitos correto.', 'error');
        return;
      }
    }

    onUpdateOrderDeliveryStatus(orderId, 'entregue');
    onShowAlert(`🎉 Pedido #${order.orderNumber} entregue com sucesso!`, 'success');

    // Filter remaining orders that are pending (not delivered)
    const pendingRemaining = myOrders.filter(
      o => o.id !== orderId && (!o.deliveryStatus || o.deliveryStatus === 'pendente')
    );

    if (pendingRemaining.length === 0 && currentBoy) {
      onUpdateStatus(currentBoy.id, 'retornando');
      onShowAlert('🏡 Todas as suas entregas foram concluídas! Seu status mudou automaticamente para: Retornando.', 'success');
    }
  };

  // Only motoboys flagged as active today can log in
  const activeMotoboys = motoboys.filter(m => m.isActiveToday !== false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoyId) {
      onShowAlert('Por favor, selecione seu nome na lista.', 'warning');
      return;
    }
    if (!pin.trim()) {
      onShowAlert('Por favor, digite sua senha PIN de 4 dígitos.', 'warning');
      return;
    }

    const boy = activeMotoboys.find(m => m.id === selectedBoyId);
    if (!boy) {
      onShowAlert('Motoboy não encontrado ou inativo hoje.', 'error');
      return;
    }

    const correctPin = boy.password || '1234';
    if (pin === correctPin) {
      setLoggedInBoy(boy);
      setPin('');
      onShowAlert(`Acesso liberado! Bem-vindo, ${boy.name}.`, 'success');
    } else {
      onShowAlert('Senha PIN incorreta. Tente novamente ou consulte o gerente.', 'error');
    }
  };

  const handleLogout = () => {
    setLoggedInBoy(null);
    setSelectedBoyId('');
    onShowAlert('Você saiu do portal do motoboy.', 'info');
  };

  // Filter deliveries based on query search
  const cleanSearchTerm = searchTerm.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filteredMyOrders = myOrders.filter(o => {
    if (!cleanSearchTerm) return true;
    const orderNumNorm = (o.orderNumber || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const storeNorm = (o.storeName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return orderNumNorm.includes(cleanSearchTerm) || storeNorm.includes(cleanSearchTerm);
  });

  const myTotalValue = myOrders.reduce((sum, o) => sum + parseFloat(o.feeValue || '0'), 0);

  // LOGIN SCREEN
  if (!loggedInBoy) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Brand header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-2xl flex items-center justify-center font-black text-3xl mx-auto shadow-lg shadow-amber-500/20 mb-3">
              <Bike className="w-9 h-9 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">PORTAL DO MOTOBOY</h1>
            <p className="text-slate-400 text-xs font-semibold mt-1">Consulte suas entregas e taxas em tempo real</p>
          </div>

          {activeMotoboys.length === 0 ? (
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-semibold text-amber-200">Nenhum Motoboy ativo hoje</p>
              <p className="text-xs text-slate-400 font-medium">
                Peça para o gerente ativar seu cadastro no painel de configurações para você conseguir fazer login.
              </p>
              <button
                onClick={onExitPortal}
                className="w-full mt-2 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Voltar ao Painel Admin
              </button>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Select Boy */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Selecione seu Nome:</label>
                <select
                  value={selectedBoyId}
                  onChange={(e) => setSelectedBoyId(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none cursor-pointer"
                >
                  <option value="">-- Escolha seu nome --</option>
                  {activeMotoboys.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Enter PIN */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Senha PIN de Acesso:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 1234"
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-mono font-black tracking-widest text-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none"
                />
              </div>

              {/* Actions */}
              <button
                type="submit"
                className="w-full py-3 px-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar no Portal</span>
              </button>

              <button
                type="button"
                onClick={onExitPortal}
                className="w-full py-3 px-5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/80"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Painel Geral</span>
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  // ACTIVE LOGGED IN MOTOBOY PORTAL VIEW
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl flex-grow flex flex-col space-y-5 animate-in fade-in duration-200">
        
        {/* Header Block */}
        <div className="bg-slate-900 rounded-3xl p-5 md:p-6 shadow-xl border border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
              <Bike className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                Portal Ativo
              </span>
              <h2 className="text-lg md:text-xl font-black text-white mt-1 leading-tight">
                {currentBoy.name}
              </h2>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/80 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Sair do Portal"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {/* Status Tracker Control Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Meu Status Atual
            </span>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
              currentBoy.status === 'entrega'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                : currentBoy.status === 'retornando'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {currentBoy.status === 'entrega'
                ? '🚀 Em Entrega'
                : currentBoy.status === 'retornando'
                ? '🏡 Retornando'
                : '🟢 Na Loja (Disponível)'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                onUpdateStatus(currentBoy.id, 'disponivel');
                onShowAlert('Seu status agora é: Na Loja (Disponível)', 'success');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                (!currentBoy.status || currentBoy.status === 'disponivel')
                  ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-lg">🟢</span>
              <span>Na Loja</span>
            </button>

            <button
              onClick={() => {
                onUpdateStatus(currentBoy.id, 'entrega');
                onShowAlert('Seu status agora é: Em Entrega (Saiu)', 'info');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                currentBoy.status === 'entrega'
                  ? 'bg-rose-600/25 border-rose-500 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-lg">🚀</span>
              <span>Saiu p/ Entrega</span>
            </button>

            <button
              onClick={() => {
                onUpdateStatus(currentBoy.id, 'retornando');
                onShowAlert('Seu status agora é: Retornando para a Loja', 'warning');
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer border ${
                currentBoy.status === 'retornando'
                  ? 'bg-amber-600/25 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="text-lg">🏡</span>
              <span>Retornando</span>
            </button>
          </div>
        </div>

        {/* Total stats card summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Minhas Entregas
            </span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="text-3xl font-black text-white">{myOrders.length}</span>
              <span className="text-slate-400 text-xs font-bold">{myOrders.length === 1 ? 'corrida' : 'corridas'}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 flex flex-col justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
              Valor a Receber
            </span>
            <span className="text-3xl font-black text-emerald-400 mt-2 block">
              R$ {myTotalValue.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Route Optimizer (Google Maps Directions Link Generator) */}
        {myOrders.length > 0 && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
                Gerador de Rotas Inteligente
              </span>
              <h4 className="text-sm font-black text-white">Traçar Rota no Google Maps</h4>
              <p className="text-xs text-slate-400">
                Toque nos pedidos desejados na lista abaixo para marcar/desmarcar e clique em "Criar Rota Selecionada".
              </p>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg mt-1.5">
                <span>📍 {myOrders.filter(o => !deselectedOrderIds[o.id] && !!o.deliveryAddress).length} selecionado(s) de {myOrders.filter(o => !!o.deliveryAddress).length} com endereço</span>
              </div>
            </div>

            <button
              onClick={() => {
                const selectedAddresses = myOrders
                  .filter(o => !deselectedOrderIds[o.id])
                  .map(o => o.deliveryAddress)
                  .filter((addr): addr is string => !!addr && addr.trim().length > 0);

                if (selectedAddresses.length === 0) {
                  onShowAlert('Selecione pelo menos um pedido com endereço para traçar a rota.', 'warning');
                  return;
                }

                const encodedWaypoints = selectedAddresses.slice(0, -1).map(addr => encodeURIComponent(addr.trim())).join('|');
                const lastAddress = selectedAddresses[selectedAddresses.length - 1];
                const mapsUrl = encodedWaypoints.length > 0
                  ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lastAddress.trim())}&waypoints=${encodedWaypoints}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lastAddress.trim())}`;
                
                window.open(mapsUrl, '_blank');
                onShowAlert(`Rota gerada no Google Maps com ${selectedAddresses.length} paradas!`, 'success');
              }}
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-extrabold py-3 px-5 rounded-xl shadow-lg shadow-indigo-600/10 transition cursor-pointer flex items-center gap-2 border-0 w-full sm:w-auto justify-center shrink-0"
            >
              <span>🗺️ Criar Rota Selecionada</span>
            </button>
          </div>
        )}

        {/* Read-Only Deliveries Worksheet */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 flex-grow flex flex-col space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-white">Minha Planilha de Corridas</h3>
            </div>
            
            <button
              onClick={() => printDeliveryReport(currentBoy.name, myOrders)}
              disabled={myOrders.length === 0}
              className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-black py-1.5 px-3 rounded-xl transition flex items-center gap-1 cursor-pointer border-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relatório</span>
            </button>
          </div>

          {/* Search filter for motoboys */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por número ou loja..."
              className="w-full bg-slate-950 border border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          {/* Worksheet scroll */}
          <div className="flex-grow overflow-y-auto max-h-96 pr-1 space-y-2.5 custom-scrollbar">
            {myOrders.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-2xl">
                <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">Nenhuma entrega lançada ainda</p>
                <p className="text-xs text-slate-600 mt-0.5">As entregas atribuídas ao seu nome aparecerão aqui.</p>
              </div>
            ) : filteredMyOrders.length === 0 ? (
              <p className="text-center py-6 text-xs font-semibold text-slate-500">
                Nenhuma corrida correspondente ao filtro "{searchTerm}".
              </p>
            ) : (
              filteredMyOrders.map(order => {
                const feeFormatted = parseFloat(order.feeValue || '0').toFixed(2).replace('.', ',');
                const isEntregue = order.deliveryStatus === 'entregue';
                const hasAddress = !!order.deliveryAddress && !isEntregue;
                const isSelected = hasAddress && !deselectedOrderIds[order.id];

                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      if (hasAddress) {
                        toggleSelectOrder(order.id);
                      }
                    }}
                    className={`p-4 border rounded-2xl space-y-3 transition flex flex-col ${
                      hasAddress ? 'cursor-pointer' : ''
                    } ${
                      isEntregue
                        ? 'bg-emerald-950/10 border-emerald-500/30 opacity-90'
                        : isSelected
                        ? 'bg-indigo-950/20 border-indigo-500/50 hover:bg-indigo-950/35'
                        : 'bg-slate-950/80 border-slate-800/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Interactive Checkbox for routing */}
                        {hasAddress && (
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        {isEntregue && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-white text-base block">#{order.orderNumber}</span>
                            {isEntregue && (
                              <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                                Concluído
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-extrabold text-amber-400 mt-0.5 block uppercase tracking-wide">
                            {order.storeName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-extrabold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg whitespace-nowrap">
                          {order.feeDescription}
                        </span>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-1 rounded-lg">
                          R$ {feeFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    {(order.customerName || order.deliveryAddress) && (
                      <div className="border-t border-slate-800/80 pt-2.5 space-y-1.5">
                        {order.customerName && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 font-bold">Cliente:</span>
                            <span className="text-slate-200 font-black">{order.customerName}</span>
                          </div>
                        )}
                        {order.deliveryAddress && (
                          <div className="flex items-start gap-1.5 text-xs leading-relaxed">
                            <span className="text-slate-500 font-bold shrink-0 mt-0.5">Endereço:</span>
                            <span className="text-slate-300 font-medium">{order.deliveryAddress}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delivery confirmation controls */}
                    {!isEntregue && (
                      <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3">
                          
                          {/* Code Validation Field */}
                          <div className="flex-grow max-w-sm">
                            <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                              Código de Confirmação iFood:
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                maxLength={4}
                                value={deliveryCodes[order.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setDeliveryCodes(prev => ({ ...prev, [order.id]: val }));
                                }}
                                placeholder="4 dígitos"
                                className="w-24 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs font-mono font-black text-center text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none"
                              />
                              <button
                                onClick={() => handleConfirmOrder(order.id, deliveryCodes[order.id], true)}
                                className="bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-black text-[11px] py-1.5 px-3.5 rounded-xl transition cursor-pointer border-0 shadow-sm shadow-amber-500/10"
                              >
                                Validar Código
                              </button>
                            </div>
                            <span className="text-[9px] font-semibold text-slate-600 block mt-1">
                              Simulação de teste: <span className="font-mono text-slate-400 font-extrabold">{order.confirmationCode || '1234'}</span>
                            </span>
                          </div>

                          {/* Manual Confirmation Button */}
                          <div className="shrink-0">
                            <button
                              onClick={() => handleConfirmOrder(order.id, undefined, false)}
                              className="w-full sm:w-auto bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-extrabold text-[11px] py-2 px-3 rounded-xl transition cursor-pointer border border-slate-700/60"
                            >
                              Confirmar Sem Código
                            </button>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info banner */}
        <p className="text-center text-[11px] font-semibold text-slate-600">
          * Acesso apenas para leitura das corridas. Modificações ou exclusões devem ser solicitadas ao gerente.
        </p>

      </div>
    </div>
  );
};
