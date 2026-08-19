import React, { useState } from 'react';
import { Store, Motoboy, Rate } from '../../types';
import { X, Plus, Trash2, Check, AlertCircle, ShoppingBag, Edit2 } from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: Store[];
  motoboys: Motoboy[];
  rates: Rate[];
  selectedStoreId: string | null;
  onAddStore: (name: string) => void;
  onDeleteStore: (id: string, name: string) => void;
  onAddMotoboy: (name: string, password?: string) => void;
  onDeleteMotoboy: (id: string, name: string) => void;
  onToggleMotoboyActive?: (id: string) => void;
  onToggleStoreActive?: (id: string) => void;
  onToggleRateActive?: (id: string) => void;
  onAddRate: (value: string) => void;
  onDeleteRate: (id: string, value: string) => void;
  onEditStore?: (id: string, name: string) => void;
  onEditMotoboy?: (id: string, name: string, password?: string) => void;
  onEditRate?: (id: string, value: string) => void;
  setupStatus: string;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  stores,
  motoboys,
  rates,
  onAddStore,
  onDeleteStore,
  onAddMotoboy,
  onDeleteMotoboy,
  onToggleMotoboyActive,
  onToggleStoreActive,
  onToggleRateActive,
  onAddRate,
  onDeleteRate,
  onEditStore,
  onEditMotoboy,
  onEditRate,
  setupStatus,
}) => {
  const [storeInput, setStoreInput] = useState('');
  const [motoboyInput, setMotoboyInput] = useState('');
  const [motoboyPassword, setMotoboyPassword] = useState('1234');
  const [rateInput, setRateInput] = useState('');

  // Inline editing states
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreName, setEditingStoreName] = useState('');

  const [editingMotoboyId, setEditingMotoboyId] = useState<string | null>(null);
  const [editingMotoboyName, setEditingMotoboyName] = useState('');
  const [editingMotoboyPassword, setEditingMotoboyPassword] = useState('');

  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editingRateValue, setEditingRateValue] = useState('');

  // iFood Integration Local States
  const [ifoodEnabled, setIfoodEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ifood_enabled') === 'true';
  });
  const [ifoodClientId, setIfoodClientId] = useState<string>(() => {
    return localStorage.getItem('ifood_client_id') || '';
  });
  const [ifoodClientSecret, setIfoodClientSecret] = useState<string>(() => {
    return localStorage.getItem('ifood_client_secret') || '';
  });
  const [ifoodMerchantId, setIfoodMerchantId] = useState<string>(() => {
    return localStorage.getItem('ifood_merchant_id') || '';
  });
  const [ifoodSandbox, setIfoodSandbox] = useState<boolean>(() => {
    return localStorage.getItem('ifood_sandbox') === 'true';
  });
  const [ifoodSaveSuccess, setIfoodSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeInput.trim()) return;
    onAddStore(storeInput.trim());
    setStoreInput('');
  };

  const handleMotoboySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motoboyInput.trim()) return;
    onAddMotoboy(motoboyInput.trim(), motoboyPassword.trim() || '1234');
    setMotoboyInput('');
    setMotoboyPassword('1234');
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateInput.trim()) return;
    onAddRate(rateInput.trim());
    setRateInput('');
  };

  const handleIFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('ifood_enabled', String(ifoodEnabled));
    localStorage.setItem('ifood_client_id', ifoodClientId.trim());
    localStorage.setItem('ifood_client_secret', ifoodClientSecret.trim());
    localStorage.setItem('ifood_merchant_id', ifoodMerchantId.trim());
    localStorage.setItem('ifood_sandbox', String(ifoodSandbox));
    setIfoodSaveSuccess(true);
    setTimeout(() => {
      setIfoodSaveSuccess(false);
    }, 3000);
  };

  return (
    <div
      id="setupModal"
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto border border-slate-100">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Configuração do Sistema
          </h3>
          <button
            id="closeSetupModal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-1.5 rounded-xl hover:bg-slate-100 transition duration-200 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-6 font-medium">
          Os dados cadastrados aqui são salvos localmente no navegador.
        </p>

        <div className="space-y-6">
          {/* Cadastrar Loja */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-base text-slate-900 pb-1 mb-3 border-b border-slate-200">
              Cadastrar Loja
            </h4>
            <form onSubmit={handleStoreSubmit} className="space-y-2">
              <input
                id="storeNameInput"
                type="text"
                value={storeInput}
                onChange={(e) => setStoreInput(e.target.value)}
                placeholder="Nome da Loja"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-base bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
              />
              <button
                id="saveStore"
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl text-sm w-full transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Salvar Loja
              </button>
            </form>

            <ul id="storesList" className="text-sm mt-3 space-y-1.5 max-h-28 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-white">
              {stores.length === 0 ? (
                <li className="text-slate-400 text-xs py-1 text-center font-medium">Nenhuma loja cadastrada.</li>
              ) : (
                stores.map((s) => (
                  s.id === editingStoreId ? (
                    <li key={s.id} className="px-2 py-1 flex items-center bg-slate-50 border border-indigo-200 rounded-lg gap-1.5 w-full">
                      <input
                        type="text"
                        value={editingStoreName}
                        onChange={(e) => setEditingStoreName(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Nome da Loja"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (onEditStore && editingStoreName.trim()) {
                            onEditStore(s.id, editingStoreName);
                          }
                          setEditingStoreId(null);
                        }}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-full transition cursor-pointer shrink-0"
                        title="Salvar"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStoreId(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer shrink-0"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ) : (
                    <li key={s.id} className="px-2.5 py-1.5 flex justify-between items-center bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold transition gap-2">
                      <span className="truncate flex-1 min-w-0 pr-1">{s.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={s.isActiveToday !== false}
                            onChange={() => onToggleStoreActive && onToggleStoreActive(s.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5 border-slate-300"
                          />
                          <span className="text-[10px] text-slate-500 uppercase font-black">Ativa</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStoreId(s.id);
                            setEditingStoreName(s.name);
                          }}
                          className="text-indigo-500 hover:text-indigo-700 font-bold p-1 rounded-full cursor-pointer hover:bg-indigo-50 transition"
                          title={`Editar ${s.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteStore(s.id, s.name)}
                          className="text-rose-500 hover:text-rose-700 font-bold p-1 rounded-full cursor-pointer hover:bg-rose-50 transition"
                          title={`Excluir ${s.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                ))
              )}
            </ul>
          </div>

          {/* Cadastrar Motoboy */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-base text-slate-900 pb-1 mb-3 border-b border-slate-200">
              Cadastrar Motoboy
            </h4>
            <form onSubmit={handleMotoboySubmit} className="space-y-2.5">
              <input
                id="motoboyNameInput"
                type="text"
                value={motoboyInput}
                onChange={(e) => setMotoboyInput(e.target.value)}
                placeholder="Nome do Motoboy"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-base bg-white focus:ring-2 focus:ring-rose-500 outline-none"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    id="motoboyPasswordInput"
                    type="text"
                    maxLength={4}
                    value={motoboyPassword}
                    onChange={(e) => setMotoboyPassword(e.target.value.replace(/\D/g, ''))}
                    placeholder="Senha/PIN (4 dígitos)"
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-base bg-white focus:ring-2 focus:ring-rose-500 outline-none text-center font-mono font-bold"
                  />
                </div>
                <button
                  id="saveMotoboy"
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 rounded-xl text-sm transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </div>
            </form>

            <ul id="motoboysList" className="text-sm mt-3 space-y-1.5 max-h-40 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-white">
              {motoboys.length === 0 ? (
                <li className="text-slate-400 text-xs py-1 text-center font-medium">Nenhum motoboy cadastrado.</li>
              ) : (
                motoboys.map((m) => (
                  m.id === editingMotoboyId ? (
                    <li key={m.id} className="px-2 py-1.5 flex flex-col sm:flex-row items-center bg-slate-50 border border-rose-200 rounded-lg gap-2 w-full">
                      <div className="flex-1 w-full flex gap-1.5">
                        <input
                          type="text"
                          value={editingMotoboyName}
                          onChange={(e) => setEditingMotoboyName(e.target.value)}
                          className="flex-grow min-w-0 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-rose-500"
                          placeholder="Nome do Motoboy"
                          autoFocus
                        />
                        <input
                          type="text"
                          maxLength={4}
                          value={editingMotoboyPassword}
                          onChange={(e) => setEditingMotoboyPassword(e.target.value.replace(/\D/g, ''))}
                          className="w-16 px-1.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-center font-mono font-bold text-slate-800 outline-none focus:ring-1 focus:ring-rose-500"
                          placeholder="PIN"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (onEditMotoboy && editingMotoboyName.trim()) {
                              onEditMotoboy(m.id, editingMotoboyName, editingMotoboyPassword);
                            }
                            setEditingMotoboyId(null);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-full transition cursor-pointer"
                          title="Salvar"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMotoboyId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li key={m.id} className="px-2.5 py-1.5 flex justify-between items-center bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold transition gap-2">
                      <div className="flex flex-col min-w-0 flex-grow">
                        <span className="truncate text-slate-900">{m.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">PIN: {m.password || '1234'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={m.isActiveToday !== false}
                            onChange={() => onToggleMotoboyActive && onToggleMotoboyActive(m.id)}
                            className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer h-3.5 w-3.5 border-slate-300"
                          />
                          <span className="text-[10px] text-slate-500 uppercase font-black">Ativo</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingMotoboyId(m.id);
                            setEditingMotoboyName(m.name);
                            setEditingMotoboyPassword(m.password || '1234');
                          }}
                          className="text-indigo-500 hover:text-indigo-700 font-bold p-1 rounded-full cursor-pointer hover:bg-indigo-50 transition"
                          title={`Editar ${m.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteMotoboy(m.id, m.name)}
                          className="text-rose-500 hover:text-rose-700 font-bold p-1 rounded-full cursor-pointer hover:bg-rose-50 transition"
                          title={`Excluir ${m.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  )
                ))
              )}
            </ul>
          </div>

          {/* Cadastrar Taxa (Valor Fixo) */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
            <h4 className="font-bold text-base text-slate-900 pb-1 mb-3 border-b border-slate-200">
              Cadastrar Taxa (Valor Fixo)
            </h4>
            <form onSubmit={handleRateSubmit} className="space-y-2">
              <input
                id="rateValueInput"
                type="number"
                step="0.01"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                placeholder="Valor (ex: 7.50)"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-base bg-white focus:ring-2 focus:ring-teal-600 outline-none"
              />
              <button
                id="saveRate"
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold p-2.5 rounded-xl text-sm w-full transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Salvar Taxa Fixa
              </button>
            </form>

            <ul id="ratesList" className="text-sm mt-3 space-y-1.5 max-h-28 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-white">
              {rates.length === 0 ? (
                <li className="text-slate-400 text-xs py-1 text-center font-medium">Nenhuma taxa cadastrada.</li>
              ) : (
                rates.map((r) => {
                  const formatted = parseFloat(r.value).toFixed(2).replace('.', ',');
                  const isEditing = r.id === editingRateId;

                  return isEditing ? (
                    <li key={r.id} className="px-2 py-1 flex items-center bg-slate-50 border border-teal-200 rounded-lg gap-1.5 w-full">
                      <div className="flex items-center gap-1.5 flex-grow min-w-0">
                        <span className="text-xs text-slate-500 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editingRateValue}
                          onChange={(e) => setEditingRateValue(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="0,00"
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (onEditRate && editingRateValue.trim()) {
                            onEditRate(r.id, editingRateValue);
                          }
                          setEditingRateId(null);
                        }}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-full transition cursor-pointer shrink-0"
                        title="Salvar"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingRateId(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer shrink-0"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ) : (
                    <li key={r.id} className="px-2.5 py-1.5 flex justify-between items-center bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-xs font-semibold transition gap-2">
                      <span className="truncate flex-1 min-w-0 pr-1">R$ {formatted} ({r.description})</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <label className="flex items-center gap-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={r.isActiveToday !== false}
                            onChange={() => onToggleRateActive && onToggleRateActive(r.id)}
                            className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer h-3.5 w-3.5 border-slate-300"
                          />
                          <span className="text-[10px] text-slate-500 uppercase font-black">Ativa</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRateId(r.id);
                            setEditingRateValue(r.value);
                          }}
                          className="text-indigo-500 hover:text-indigo-700 font-bold p-1 rounded-full cursor-pointer hover:bg-indigo-50 transition"
                          title={`Editar R$ ${formatted}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRate(r.id, `R$ ${formatted}`)}
                          className="text-rose-500 hover:text-rose-700 font-bold p-1 rounded-full cursor-pointer hover:bg-rose-50 transition"
                          title={`Excluir R$ ${formatted}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {/* Integração iFood */}
          <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 relative overflow-hidden">
            <div className="absolute right-2 top-2 text-rose-200 pointer-events-none">
              <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
            </div>

            <h4 className="font-bold text-base text-rose-900 pb-1 mb-2 border-b border-rose-200 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-600" />
              Integração iFood
            </h4>

            <p className="text-xs text-rose-700/80 mb-4 font-semibold leading-relaxed">
              Despache os pedidos automaticamente no portal do iFood assim que forem adicionados no Fast Pedidos!
            </p>

            <form onSubmit={handleIFoodSubmit} className="space-y-3.5">
              <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-rose-100">
                <input
                  id="ifoodEnabledCheckbox"
                  type="checkbox"
                  checked={ifoodEnabled}
                  onChange={(e) => setIfoodEnabled(e.target.checked)}
                  className="w-4.5 h-4.5 text-rose-600 focus:ring-rose-500 border-rose-300 rounded cursor-pointer"
                />
                <label htmlFor="ifoodEnabledCheckbox" className="text-xs font-extrabold text-rose-950 cursor-pointer select-none">
                  Habilitar Sincronização & Despacho
                </label>
              </div>

              {ifoodEnabled && (
                <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 bg-rose-100/40 p-2.5 rounded-xl border border-rose-200">
                    <input
                      id="ifoodSandboxCheckbox"
                      type="checkbox"
                      checked={ifoodSandbox}
                      onChange={(e) => setIfoodSandbox(e.target.checked)}
                      className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-rose-300 rounded cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="ifoodSandboxCheckbox" className="text-xs font-black text-rose-950 cursor-pointer select-none">
                        Ativar Modo Simulação / Sandbox
                      </label>
                      <span className="text-[10px] text-rose-700 font-semibold">
                        Ideal para contas de teste do portal do desenvolvedor!
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ifoodClientId" className="block text-[10px] font-bold text-rose-800 uppercase mb-0.5">
                      Client ID
                    </label>
                    <input
                      id="ifoodClientId"
                      type="text"
                      required
                      value={ifoodClientId}
                      onChange={(e) => setIfoodClientId(e.target.value)}
                      placeholder="Ex: d18b95cd-8ef9-..."
                      className="w-full p-2.5 border border-rose-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-rose-500 outline-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="ifoodClientSecret" className="block text-[10px] font-bold text-rose-800 uppercase mb-0.5">
                      Client Secret
                    </label>
                    <input
                      id="ifoodClientSecret"
                      type="password"
                      required
                      value={ifoodClientSecret}
                      onChange={(e) => setIfoodClientSecret(e.target.value)}
                      placeholder="••••••••••••••••••••••••••••"
                      className="w-full p-2.5 border border-rose-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-rose-500 outline-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="ifoodMerchantId" className="block text-[10px] font-bold text-rose-800 uppercase mb-0.5">
                      Merchant ID (ID do Restaurante)
                    </label>
                    <input
                      id="ifoodMerchantId"
                      type="text"
                      required
                      value={ifoodMerchantId}
                      onChange={(e) => setIfoodMerchantId(e.target.value)}
                      placeholder="Ex: 57d8961d-72fb-..."
                      className="w-full p-2.5 border border-rose-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-rose-500 outline-none text-slate-800"
                    />
                  </div>
                </div>
              )}

              <button
                id="saveIFood"
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold p-2.5 rounded-xl text-sm w-full transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {ifoodSaveSuccess ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4" />}
                {ifoodSaveSuccess ? 'Credenciais Salvas!' : 'Salvar Conexão iFood'}
              </button>
            </form>

            {ifoodSaveSuccess && (
              <p className="mt-2 text-center text-xs text-rose-600 font-extrabold flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> Configuração salva localmente com sucesso!
              </p>
            )}
          </div>
        </div>

        {setupStatus && (
          <p id="setupStatus" className="mt-4 text-center text-xs text-emerald-600 font-bold">
            {setupStatus}
          </p>
        )}
      </div>
    </div>
  );
};
