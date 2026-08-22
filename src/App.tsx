import { useState, useEffect, useCallback } from 'react';
import { Store, Motoboy, Rate, Order, ToastMessage, DailyReport } from './types';
import {
  INITIAL_STORES,
  INITIAL_MOTOBOYS,
  INITIAL_RATES,
  generateId,
} from './utils/storage';

import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './lib/firebase';
import { Auth } from './components/Auth';

import { Header } from './components/Header';
import { StoreBar } from './components/StoreBar';
import { OrderForm } from './components/OrderForm';
import { IFoodPanel } from './components/IFoodPanel';
import { MotoboyGrid } from './components/MotoboyGrid';
import { ToastAlert } from './components/ToastAlert';

import { SetupModal } from './components/modals/SetupModal';
import { MotoboySelectModal } from './components/modals/MotoboySelectModal';
import { RateSelectModal } from './components/modals/RateSelectModal';
import { EditOrderModal } from './components/modals/EditOrderModal';
import { ConfirmDeleteModal } from './components/modals/ConfirmDeleteModal';
import { ClearDataModal } from './components/modals/ClearDataModal';
import { DataTransferModal } from './components/modals/DataTransferModal';
import { SearchModal } from './components/modals/SearchModal';
import { CloseDayModal } from './components/modals/CloseDayModal';
import { MotoboyPortal } from './components/MotoboyPortal';

const SIMULATED_TEST_PEOPLE = [
  { name: "Carlos Eduardo da Silva", address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP" },
  { name: "Juliana Santos Moura", address: "Rua Augusta, 1200 - Consolação, São Paulo - SP" },
  { name: "Rodrigo Alencar Pereira", address: "Alameda Lorena, 800 - Jardim Paulista, São Paulo - SP" },
  { name: "Aline de Souza Mendes", address: "Rua Pamplona, 1400 - Jardim Paulista, São Paulo - SP" },
  { name: "Marcos Vinícius Costa", address: "Av. Brigadeiro Luís Antônio, 2300 - Bela Vista, São Paulo - SP" },
  { name: "Beatriz Helena Rezende", address: "Rua Bela Cintra, 900 - Consolação, São Paulo - SP" },
  { name: "Felipe Gabriel de Castro", address: "Rua Haddock Lobo, 1100 - Cerqueira César, São Paulo - SP" },
  { name: "Letícia Ramos Lima", address: "Rua Oscar Freire, 600 - Pinheiros, São Paulo - SP" }
];

export default function App() {
  // Firebase Auth States
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);

  // Application Data States
  const [stores, setStores] = useState<Store[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [setupStatus, setSetupStatus] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Modals visibility
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [motoboySelectModalOpen, setMotoboySelectModalOpen] = useState(false);
  const [rateSelectModalOpen, setRateSelectModalOpen] = useState(false);
  const [editOrderModalOpen, setEditOrderModalOpen] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [clearDataModalOpen, setClearDataModalOpen] = useState(false);
  const [dataTransferModalOpen, setDataTransferModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [closeDayModalOpen, setCloseDayModalOpen] = useState(false);

  // Application Mode (Admin vs Motoboy read-only portal)
  const [appMode, setAppMode] = useState<'admin' | 'motoboy'>(() => {
    const params = new URLSearchParams(window.location.search);
    return (params.get('mode') === 'motoboy' || params.get('role') === 'motoboy') ? 'motoboy' : 'admin';
  });

  // Flow & Action States
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null);
  const [pendingCustomerName, setPendingCustomerName] = useState<string | null>(null);
  const [pendingDeliveryAddress, setPendingDeliveryAddress] = useState<string | null>(null);
  const [pendingMotoboy, setPendingMotoboy] = useState<Motoboy | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingOrderNum, setDeletingOrderNum] = useState<string | null>(null);

  // Toast Helper
  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
    const id = generateId();
    setToast({ id, message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);

      const params = new URLSearchParams(window.location.search);
      const urlOwnerId = params.get('owner');

      if (firebaseUser) {
        setActiveOwnerId(firebaseUser.uid);
      } else if (urlOwnerId) {
        setActiveOwnerId(urlOwnerId);
      } else {
        setActiveOwnerId(null);
      }
    });
    return unsubscribe;
  }, []);

  // Sync state changes with Firestore snapshot listener
  useEffect(() => {
    if (!activeOwnerId) return;

    // Load User Settings / Selected Store
    const unsubscribeUserProfile = onSnapshot(doc(db, 'users', activeOwnerId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.selectedStoreId) {
          setSelectedStoreId(data.selectedStoreId);
        }
        if (data.ifoodClientId !== undefined) {
          localStorage.setItem('ifood_client_id', data.ifoodClientId || '');
        }
        if (data.ifoodClientSecret !== undefined) {
          localStorage.setItem('ifood_client_secret', data.ifoodClientSecret || '');
        }
        if (data.ifoodMerchantId !== undefined) {
          localStorage.setItem('ifood_merchant_id', data.ifoodMerchantId || '');
        }
        if (data.ifoodEnabled !== undefined) {
          localStorage.setItem('ifood_enabled', String(data.ifoodEnabled));
        }
        if (data.ifoodSandbox !== undefined) {
          localStorage.setItem('ifood_sandbox', String(data.ifoodSandbox));
        }
      }
    }, (err) => {
      console.warn('UserProfile snapshot listener warning:', err.message);
    });

    // Load Stores
    const unsubscribeStores = onSnapshot(collection(db, 'users', activeOwnerId, 'stores'), (snapshot) => {
      const list: Store[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Store);
      });
      setStores(list);
    }, (err) => {
      console.warn('Stores snapshot listener warning:', err.message);
    });

    // Load Motoboys
    const unsubscribeMotoboys = onSnapshot(collection(db, 'users', activeOwnerId, 'motoboys'), (snapshot) => {
      const list: Motoboy[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Motoboy);
      });
      setMotoboys(list);
    }, (err) => {
      console.warn('Motoboys snapshot listener warning:', err.message);
    });

    // Load Rates
    const unsubscribeRates = onSnapshot(collection(db, 'users', activeOwnerId, 'rates'), (snapshot) => {
      const list: Rate[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Rate);
      });
      setRates(list);
    }, (err) => {
      console.warn('Rates snapshot listener warning:', err.message);
    });

    // Load Orders
    const unsubscribeOrders = onSnapshot(collection(db, 'users', activeOwnerId, 'orders'), (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Order);
      });
      list.sort((a, b) => b.timestamp - a.timestamp);
      setAllOrders(list);
    }, (err) => {
      console.warn('Orders snapshot listener warning:', err.message);
    });

    // Load Daily Reports (Only for logged-in store owner)
    let unsubscribeReports = () => {};
    if (user && user.uid === activeOwnerId) {
      unsubscribeReports = onSnapshot(collection(db, 'users', activeOwnerId, 'dailyReports'), (snapshot) => {
        const list: DailyReport[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as DailyReport);
        });
        list.sort((a, b) => b.timestamp - a.timestamp);
        setDailyReports(list);
      }, (err) => {
        console.warn('DailyReports snapshot listener warning:', err.message);
      });
    }

    return () => {
      unsubscribeUserProfile();
      unsubscribeStores();
      unsubscribeMotoboys();
      unsubscribeRates();
      unsubscribeOrders();
      unsubscribeReports();
    };
  }, [activeOwnerId, user]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Sessão encerrada com sucesso.', 'info');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  // Store Management
  const handleSelectStore = async (id: string) => {
    setSelectedStoreId(id);
    if (activeOwnerId && auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId), { selectedStoreId: id }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}`);
      }
    }
    const store = stores.find((s) => s.id === id);
    if (store) {
      showToast(`Loja principal alterada para: ${store.name}`, 'info');
    }
  };

  const handleAddStore = async (name: string) => {
    const newStore: Store = { id: generateId(), name, isActiveToday: true };
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'stores', newStore.id), newStore);
        if (!selectedStoreId) {
          setSelectedStoreId(newStore.id);
          await setDoc(doc(db, 'users', activeOwnerId), { selectedStoreId: newStore.id }, { merge: true });
        }
        setSetupStatus(`Loja "${name}" salva com sucesso!`);
        showToast(`Loja "${name}" salva com sucesso!`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${activeOwnerId}/stores/${newStore.id}`);
      }
    }
  };

  const handleDeleteStore = async (id: string, name: string) => {
    if (selectedStoreId === id) {
      showToast(
        `Não é possível excluir a loja "${name}" pois ela está definida como a loja principal. Selecione outra loja primeiro.`,
        'error'
      );
      return;
    }
    if (activeOwnerId) {
      try {
        await deleteDoc(doc(db, 'users', activeOwnerId, 'stores', id));
        showToast(`Loja "${name}" excluída com sucesso.`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${activeOwnerId}/stores/${id}`);
      }
    }
  };

  // Motoboy Management
  const handleAddMotoboy = async (name: string, password?: string) => {
    const id = generateId();
    const newBoy: Motoboy = {
      id,
      name,
      password: password || '1234',
      isActiveToday: true,
      status: 'disponivel',
      statusUpdatedAt: Date.now()
    };
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'motoboys', id), newBoy);
        setSetupStatus(`Motoboy "${name}" salvo com sucesso!`);
        showToast(`Motoboy "${name}" salvo com sucesso!`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${activeOwnerId}/motoboys/${id}`);
      }
    }
  };

  const handleToggleMotoboyActive = async (id: string) => {
    const boy = motoboys.find(m => m.id === id);
    if (!boy) return;
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'motoboys', id), {
          ...boy,
          isActiveToday: boy.isActiveToday === false ? true : false
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/motoboys/${id}`);
      }
    }
  };

  const handleToggleStoreActive = async (id: string) => {
    const store = stores.find(s => s.id === id);
    if (!store) return;
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'stores', id), {
          ...store,
          isActiveToday: store.isActiveToday === false ? true : false
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/stores/${id}`);
      }
    }
  };

  const handleToggleRateActive = async (id: string) => {
    const rate = rates.find(r => r.id === id);
    if (!rate) return;
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'rates', id), {
          ...rate,
          isActiveToday: rate.isActiveToday === false ? true : false
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/rates/${id}`);
      }
    }
  };

  const handleDeleteMotoboy = async (id: string, name: string) => {
    if (activeOwnerId) {
      try {
        await deleteDoc(doc(db, 'users', activeOwnerId, 'motoboys', id));
        showToast(`Motoboy "${name}" excluído com sucesso.`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${activeOwnerId}/motoboys/${id}`);
      }
    }
  };

  // Rates Management
  const handleAddRate = async (valueStr: string) => {
    let val = parseFloat(valueStr);
    if (isNaN(val) || val <= 0) {
      showToast('Valor válido (maior que zero) é obrigatório para a Taxa Fixa!', 'error');
      return;
    }
    const formatted = val.toFixed(2);
    const id = generateId();
    const newRate: Rate = {
      id,
      description: 'Taxa Fixa',
      value: formatted,
      isActiveToday: true
    };
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'rates', id), newRate);
        setSetupStatus(`Taxa Fixa de R$ ${formatted.replace('.', ',')} salva!`);
        showToast(`Taxa Fixa de R$ ${formatted.replace('.', ',')} salva!`);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${activeOwnerId}/rates/${id}`);
      }
    }
  };

  const handleDeleteRate = async (id: string, valueDisplay: string) => {
    if (activeOwnerId) {
      try {
        await deleteDoc(doc(db, 'users', activeOwnerId, 'rates', id));
        showToast(`Taxa de ${valueDisplay} excluída com sucesso.`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${activeOwnerId}/rates/${id}`);
      }
    }
  };

  const handleEditStore = async (id: string, newName: string) => {
    if (!newName.trim()) {
      showToast('Nome da loja não pode ser vazio!', 'error');
      return;
    }
    const store = stores.find(s => s.id === id);
    if (!store) return;
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'stores', id), {
          ...store,
          name: newName.trim()
        });
        showToast(`Loja editada para "${newName.trim()}"`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/stores/${id}`);
      }
    }
  };

  const handleEditMotoboy = async (id: string, newName: string, newPassword?: string) => {
    if (!newName.trim()) {
      showToast('Nome do motoboy não pode ser vazio!', 'error');
      return;
    }
    const boy = motoboys.find(m => m.id === id);
    if (!boy) return;
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'motoboys', id), {
          ...boy,
          name: newName.trim(),
          password: newPassword?.trim() || '1234'
        });
        showToast(`Motoboy editado para "${newName.trim()}"`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/motoboys/${id}`);
      }
    }
  };

  const handleEditRate = async (id: string, newValue: string) => {
    const val = parseFloat(newValue);
    if (isNaN(val) || val <= 0) {
      showToast('Valor de taxa inválido!', 'error');
      return;
    }
    const formatted = val.toFixed(2);
    const rate = rates.find(r => r.id === id);
    if (!rate) return;
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'rates', id), {
          ...rate,
          value: formatted
        });
        showToast(`Taxa fixa editada para R$ ${formatted.replace('.', ',')}`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/rates/${id}`);
      }
    }
  };

  // Ensure selectedStoreId is always valid and prefers active stores
  useEffect(() => {
    if (stores.length > 0) {
      const activeStores = stores.filter((s) => s.isActiveToday !== false);
      const isSelectedValid = selectedStoreId && stores.some((s) => s.id === selectedStoreId);
      const isSelectedActive = selectedStoreId && activeStores.some((s) => s.id === selectedStoreId);

      if (!isSelectedValid) {
        setSelectedStoreId(activeStores.length > 0 ? activeStores[0].id : stores[0].id);
      } else if (!isSelectedActive && activeStores.length > 0) {
        setSelectedStoreId(activeStores[0].id);
      }
    } else {
      if (selectedStoreId !== null) {
        setSelectedStoreId(null);
      }
    }
  }, [stores, selectedStoreId]);

  // Restore Default Initial Data
  const handleRestoreDefaults = async () => {
    if (!activeOwnerId) return;
    try {
      showToast('Restaurando cadastros padrão...', 'info');
      const batch = writeBatch(db);

      INITIAL_STORES.forEach((store) => {
        const storeRef = doc(db, 'users', activeOwnerId, 'stores', store.id);
        batch.set(storeRef, store);
      });

      INITIAL_MOTOBOYS.forEach((boy) => {
        const boyRef = doc(db, 'users', activeOwnerId, 'motoboys', boy.id);
        batch.set(boyRef, boy);
      });

      INITIAL_RATES.forEach((rate) => {
        const rateRef = doc(db, 'users', activeOwnerId, 'rates', rate.id);
        batch.set(rateRef, rate);
      });

      if (INITIAL_STORES.length > 0) {
        const userRef = doc(db, 'users', activeOwnerId);
        batch.set(userRef, { selectedStoreId: INITIAL_STORES[0].id }, { merge: true });
        setSelectedStoreId(INITIAL_STORES[0].id);
      }

      await batch.commit();
      showToast('Cadastros padrão de Lojas, Motoboys e Taxas restaurados!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${activeOwnerId}`);
    }
  };

  // Order Registration Flow
  const handleStartOrder = (orderNumber: string, customerName?: string, deliveryAddress?: string) => {
    if (!stores.length || !motoboys.length || !selectedStoreId) {
      const msg = 'Cadastre pelo menos uma Loja e um Motoboy para registrar pedidos.';
      setStatusMessage(msg);
      showToast(msg, 'error');
      setSetupModalOpen(true);
      return;
    }

    let finalCustomerName = customerName || null;
    let finalDeliveryAddress = deliveryAddress || null;

    // If both details are blank, auto-populate with random simulated São Paulo address!
    if (!finalCustomerName && !finalDeliveryAddress) {
      const randomIndex = Math.floor(Math.random() * SIMULATED_TEST_PEOPLE.length);
      const mockPerson = SIMULATED_TEST_PEOPLE[randomIndex];
      finalCustomerName = mockPerson.name;
      finalDeliveryAddress = mockPerson.address;
    }

    setPendingOrderNumber(orderNumber);
    setPendingCustomerName(finalCustomerName);
    setPendingDeliveryAddress(finalDeliveryAddress);
    setStatusMessage('');
    setMotoboySelectModalOpen(true);
  };

  const handleSelectMotoboy = (motoboy: Motoboy) => {
    setPendingMotoboy(motoboy);
    setMotoboySelectModalOpen(false);
    setRateSelectModalOpen(true);
  };

  const handleSelectRate = async (rate: Rate) => {
    if (!pendingOrderNumber || !pendingMotoboy || !selectedStoreId) {
      showToast('Erro interno: Dados do pedido incompletos.', 'error');
      return;
    }

    const storeObj = stores.find((s) => s.id === selectedStoreId);
    if (!storeObj) {
      showToast('Erro: Loja selecionada não encontrada.', 'error');
      return;
    }

    const newOrder: Order = {
      id: generateId(),
      orderNumber: pendingOrderNumber,
      storeName: storeObj.name,
      motoboyName: pendingMotoboy.name,
      feeValue: rate.value,
      feeDescription: rate.description,
      timestamp: Date.now(),
      customerName: pendingCustomerName || undefined,
      deliveryAddress: pendingDeliveryAddress || undefined,
      deliveryStatus: 'pendente',
      confirmationCode: Math.floor(1000 + Math.random() * 9000).toString(),
    };

    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'orders', newOrder.id), newOrder);
        setRateSelectModalOpen(false);
        showToast(
          `Pedido Nº ${newOrder.orderNumber} registrado para ${newOrder.motoboyName} (${newOrder.feeDescription}) com sucesso!`,
          'success'
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${activeOwnerId}/orders/${newOrder.id}`);
      }
    }

    // iFood Auto-Dispatch Integration
    const ifoodEnabled = localStorage.getItem('ifood_enabled') === 'true';
    if (ifoodEnabled && activeOwnerId) {
      const clientId = localStorage.getItem('ifood_client_id') || '';
      const clientSecret = localStorage.getItem('ifood_client_secret') || '';
      const merchantId = localStorage.getItem('ifood_merchant_id') || '';
      const sandbox = localStorage.getItem('ifood_sandbox') === 'true';
      const orderNumber = newOrder.orderNumber;

      if (clientId && clientSecret && merchantId && orderNumber) {
        showToast(
          sandbox
            ? `[iFood Sandbox] Simulando despacho do pedido Nº ${orderNumber}...`
            : `[iFood] Conectando para despachar o pedido Nº ${orderNumber}...`,
          'info'
        );
        
        let targetOrderId = '';
        try {
          const savedPolled = localStorage.getItem('ifood_polled_orders');
          if (savedPolled) {
            const list = JSON.parse(savedPolled);
            const found = list.find((o: any) => o.orderNumber === orderNumber || o.id === orderNumber);
            if (found) targetOrderId = found.id;
          }
        } catch (e) {}

        const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        fetch(`${apiBase}/api/ifood/dispatch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId,
            clientSecret,
            merchantId,
            orderId: targetOrderId || undefined,
            orderNumber,
            sandbox
          })
        })
          .then((res) => res.json())
          .then(async (data) => {
            if (data.success) {
              showToast(data.message, 'success');
              if (data.customerName || data.deliveryAddress) {
                try {
                  await setDoc(doc(db, 'users', activeOwnerId, 'orders', newOrder.id), {
                    customerName: data.customerName || newOrder.customerName,
                    deliveryAddress: data.deliveryAddress || newOrder.deliveryAddress,
                  }, { merge: true });
                } catch (error) {
                  handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/orders/${newOrder.id}`);
                }
              }
            } else {
              showToast(`[iFood Erro] ${data.message}`, 'error');
            }
          })
          .catch((err) => {
            console.error('Error dispatching to iFood:', err);
            showToast('Erro ao despachar no iFood. Verifique os logs do servidor.', 'error');
          });
      }
    }

    // Reset pending states
    setPendingOrderNumber(null);
    setPendingCustomerName(null);
    setPendingDeliveryAddress(null);
    setPendingMotoboy(null);
  };

  const handleAddEntregaFacilOrder = async (
    orderNumber: string,
    customerName: string,
    deliveryAddress: string,
    courierName: string
  ) => {
    const storeObj = stores.find((s) => s.id === selectedStoreId) || stores[0];
    const storeName = storeObj ? storeObj.name : 'iFood';

    const newOrder: Order = {
      id: generateId(),
      orderNumber,
      storeName,
      motoboyName: `iFood: ${courierName}`,
      feeValue: '0.00',
      feeDescription: 'Taxa Entrega Fácil',
      timestamp: Date.now(),
      customerName,
      deliveryAddress,
      deliveryStatus: 'pendente',
      confirmationCode: Math.floor(1000 + Math.random() * 9000).toString(),
    };

    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'orders', newOrder.id), newOrder);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${activeOwnerId}/orders/${newOrder.id}`);
      }
    }
  };

  // Order Deletion Flow
  const handleOpenConfirmDelete = (id: string, orderNumber: string) => {
    setDeletingOrderId(id);
    setDeletingOrderNum(orderNumber);
    setConfirmDeleteModalOpen(true);
  };

  const handleExecuteDeleteOrder = async () => {
    if (!deletingOrderId) return;
    if (activeOwnerId) {
      try {
        await deleteDoc(doc(db, 'users', activeOwnerId, 'orders', deletingOrderId));
        showToast('Pedido excluído com sucesso!', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${activeOwnerId}/orders/${deletingOrderId}`);
      }
    }
    setDeletingOrderId(null);
    setDeletingOrderNum(null);
    setConfirmDeleteModalOpen(false);
  };

  // Order Editing Flow
  const handleOpenEditOrder = (id: string) => {
    const orderToEdit = allOrders.find((o) => o.id === id);
    if (!orderToEdit) {
      showToast('Pedido não encontrado para edição.', 'error');
      return;
    }
    if (stores.length === 0 || motoboys.length === 0) {
      showToast('Você precisa ter pelo menos uma Loja e um Motoboy cadastrado para editar este pedido.', 'error');
      return;
    }
    setEditingOrder(orderToEdit);
    setEditOrderModalOpen(true);
  };

  const handleSaveEdit = async (
    orderId: string,
    orderNumber: string,
    storeName: string,
    motoboyName: string,
    feeValue: string
  ) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'orders', orderId), {
          ...order,
          orderNumber,
          storeName,
          motoboyName,
          feeValue,
        });
        showToast(`Pedido Nº ${orderNumber} atualizado com sucesso!`, 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/orders/${orderId}`);
      }
    }
    setEditOrderModalOpen(false);
    setEditingOrder(null);
  };

  // Data Wiping Flow
  const handleConfirmClearAll = async () => {
    if (!activeOwnerId) return;
    try {
      showToast('Iniciando limpeza de todos os dados...', 'info');
      const batch = writeBatch(db);

      const storesSnapshot = await getDocs(collection(db, 'users', activeOwnerId, 'stores'));
      storesSnapshot.forEach((docSnap) => batch.delete(docSnap.ref));

      const motoboysSnapshot = await getDocs(collection(db, 'users', activeOwnerId, 'motoboys'));
      motoboysSnapshot.forEach((docSnap) => batch.delete(docSnap.ref));

      const ratesSnapshot = await getDocs(collection(db, 'users', activeOwnerId, 'rates'));
      ratesSnapshot.forEach((docSnap) => batch.delete(docSnap.ref));

      const ordersSnapshot = await getDocs(collection(db, 'users', activeOwnerId, 'orders'));
      ordersSnapshot.forEach((docSnap) => batch.delete(docSnap.ref));

      const reportsSnapshot = await getDocs(collection(db, 'users', activeOwnerId, 'dailyReports'));
      reportsSnapshot.forEach((docSnap) => batch.delete(docSnap.ref));

      batch.set(doc(db, 'users', activeOwnerId), { selectedStoreId: null }, { merge: true });
      setSelectedStoreId(null);

      await batch.commit();
      setClearDataModalOpen(false);
      showToast('Todos os dados foram removidos com sucesso.', 'error');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${activeOwnerId}`);
    }
  };

  // Data Transfer / Import Flow
  const handleImportData = async (data: {
    stores: Store[];
    motoboys: Motoboy[];
    rates: Rate[];
    orders: Order[];
  }) => {
    if (!activeOwnerId) return;
    try {
      showToast('Importando dados...', 'info');
      const batch = writeBatch(db);

      data.stores.forEach((store) => {
        batch.set(doc(db, 'users', activeOwnerId, 'stores', store.id), store);
      });
      data.motoboys.forEach((boy) => {
        batch.set(doc(db, 'users', activeOwnerId, 'motoboys', boy.id), boy);
      });
      data.rates.forEach((rate) => {
        batch.set(doc(db, 'users', activeOwnerId, 'rates', rate.id), rate);
      });
      data.orders.forEach((order) => {
        batch.set(doc(db, 'users', activeOwnerId, 'orders', order.id), order);
      });

      if (data.stores.length > 0) {
        batch.set(doc(db, 'users', activeOwnerId), { selectedStoreId: data.stores[0].id }, { merge: true });
        setSelectedStoreId(data.stores[0].id);
      }

      await batch.commit();
      showToast('Dados importados com sucesso!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${activeOwnerId}`);
    }
  };

  // Close Day Flow Handlers
  const handleConfirmCloseDay = async (newReport: DailyReport) => {
    if (!activeOwnerId) return;
    try {
      showToast('Finalizando o dia...', 'info');
      const batch = writeBatch(db);

      batch.set(doc(db, 'users', activeOwnerId, 'dailyReports', newReport.id), newReport);

      const ordersSnapshot = await getDocs(collection(db, 'users', activeOwnerId, 'orders'));
      ordersSnapshot.forEach((docSnap) => batch.delete(docSnap.ref));

      await batch.commit();
      setCloseDayModalOpen(false);
      showToast('Dia finalizado com sucesso!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${activeOwnerId}/dailyReports/${newReport.id}`);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (activeOwnerId) {
      try {
        await deleteDoc(doc(db, 'users', activeOwnerId, 'dailyReports', id));
        showToast('Relatório diário excluído com sucesso.', 'success');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${activeOwnerId}/dailyReports/${id}`);
      }
    }
  };

  const handleUpdateMotoboyStatus = async (
    motoboyId: string,
    status: 'disponivel' | 'entrega' | 'retornando'
  ) => {
    const boy = motoboys.find(m => m.id === motoboyId);
    if (!boy) return;
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'motoboys', motoboyId), {
          ...boy,
          status,
          statusUpdatedAt: Date.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/motoboys/${motoboyId}`);
      }
    }
  };

  const handleUpdateOrderDeliveryStatus = async (
    orderId: string,
    deliveryStatus: 'pendente' | 'entregue'
  ) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    if (activeOwnerId) {
      try {
        await setDoc(doc(db, 'users', activeOwnerId, 'orders', orderId), {
          ...order,
          deliveryStatus
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${activeOwnerId}/orders/${orderId}`);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-extrabold text-[11px] tracking-widest uppercase">Carregando painel...</p>
      </div>
    );
  }

  if (!user && !activeOwnerId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <Auth onSuccess={() => showToast('Acesso autorizado!', 'success')} />
      </div>
    );
  }

  if (appMode === 'motoboy') {
    return (
      <div className="relative">
        <MotoboyPortal
          motoboys={motoboys}
          orders={allOrders}
          onExitPortal={() => setAppMode('admin')}
          onShowAlert={(msg, type) => showToast(msg, type)}
          onUpdateStatus={handleUpdateMotoboyStatus}
          onUpdateOrderDeliveryStatus={handleUpdateOrderDeliveryStatus}
        />
        <ToastAlert toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 p-4 sm:p-6 md:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto relative">
        {/* Top Header */}
        <Header
          onOpenSetup={() => setSetupModalOpen(true)}
          onOpenExportImport={() => setDataTransferModalOpen(true)}
          onOpenClearData={() => setClearDataModalOpen(true)}
          onRestoreDefaults={handleRestoreDefaults}
          onOpenCloseDay={() => setCloseDayModalOpen(true)}
          onEnterMotoboyPortal={() => setAppMode('motoboy')}
          onLogout={handleLogout}
          userEmail={user?.email}
          currentUserId={user?.uid}
        />

        {/* Store Selection Buttons Bar */}
        <StoreBar
          stores={stores}
          selectedStoreId={selectedStoreId}
          onSelectStore={handleSelectStore}
          onOpenSetup={() => setSetupModalOpen(true)}
        />

        {/* New Order Entry Form */}
        <OrderForm
          onStartOrder={handleStartOrder}
          statusMessage={statusMessage}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        {/* iFood Delivery & Panel Integration */}
        <IFoodPanel
          allOrders={allOrders}
          onShowAlert={showToast}
          onAssignToInHouseMotoboy={handleStartOrder}
          onAddEntregaFacilOrder={handleAddEntregaFacilOrder}
          onConcludeOrder={(orderNumber) => {
            const matching = allOrders.find(o => o.orderNumber === orderNumber);
            if (matching) {
              handleUpdateOrderDeliveryStatus(matching.id, 'entregue');
            }
          }}
        />

        {/* Dynamic active search filter pill indicator */}
        {searchTerm && (
          <div className="mb-5 bg-amber-50/80 border border-amber-200/80 p-3 px-4 rounded-2xl flex items-center justify-between shadow-2xs max-w-md animate-in fade-in">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Filtrando por: <span className="font-black text-amber-800">"{searchTerm}"</span>
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                showToast('Filtro de busca limpo.', 'info');
              }}
              className="text-amber-800 hover:text-rose-600 hover:bg-amber-100/50 p-1.5 px-2 rounded-xl transition cursor-pointer font-extrabold text-[11px] flex items-center gap-1"
            >
              <span>Limpar busca</span>
            </button>
          </div>
        )}

        {/* Motoboy Cards Grid */}
        <MotoboyGrid
          motoboys={motoboys}
          orders={allOrders}
          searchTerm={searchTerm}
          onConfirmDeleteOrder={handleOpenConfirmDelete}
          onOpenEditOrder={handleOpenEditOrder}
        />

        {/* Toast Alert Banner */}
        <ToastAlert toast={toast} onClose={() => setToast(null)} />

        {/* Search Modal with Auto-Focus */}
        <SearchModal
          isOpen={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onClearSearch={() => setSearchTerm('')}
          orders={allOrders}
        />

        {/* Modals */}
        <SetupModal
          isOpen={setupModalOpen}
          onClose={() => setSetupModalOpen(false)}
          stores={stores}
          motoboys={motoboys}
          rates={rates}
          selectedStoreId={selectedStoreId}
          onAddStore={handleAddStore}
          onDeleteStore={handleDeleteStore}
          onAddMotoboy={handleAddMotoboy}
          onDeleteMotoboy={handleDeleteMotoboy}
          onToggleMotoboyActive={handleToggleMotoboyActive}
          onToggleStoreActive={handleToggleStoreActive}
          onToggleRateActive={handleToggleRateActive}
          onAddRate={handleAddRate}
          onDeleteRate={handleDeleteRate}
          onEditStore={handleEditStore}
          onEditMotoboy={handleEditMotoboy}
          onEditRate={handleEditRate}
          setupStatus={setupStatus}
        />

        <MotoboySelectModal
          isOpen={motoboySelectModalOpen}
          onClose={() => setMotoboySelectModalOpen(false)}
          motoboys={motoboys}
          onSelectMotoboy={handleSelectMotoboy}
        />

        <RateSelectModal
          isOpen={rateSelectModalOpen}
          onClose={() => setRateSelectModalOpen(false)}
          rates={rates}
          onSelectRate={handleSelectRate}
        />

        <EditOrderModal
          isOpen={editOrderModalOpen}
          onClose={() => setEditOrderModalOpen(false)}
          order={editingOrder}
          stores={stores}
          motoboys={motoboys}
          onSaveEdit={handleSaveEdit}
        />

        <ConfirmDeleteModal
          isOpen={confirmDeleteModalOpen}
          onClose={() => setConfirmDeleteModalOpen(false)}
          orderNumber={deletingOrderNum}
          onConfirmDelete={handleExecuteDeleteOrder}
        />

        <ClearDataModal
          isOpen={clearDataModalOpen}
          onClose={() => setClearDataModalOpen(false)}
          onConfirmClearAll={handleConfirmClearAll}
        />

        <DataTransferModal
          isOpen={dataTransferModalOpen}
          onClose={() => setDataTransferModalOpen(false)}
          stores={stores}
          motoboys={motoboys}
          rates={rates}
          orders={allOrders}
          onImportData={handleImportData}
          onShowAlert={(msg, type) => showToast(msg, type)}
        />

        <CloseDayModal
          isOpen={closeDayModalOpen}
          onClose={() => setCloseDayModalOpen(false)}
          currentOrders={allOrders}
          onConfirmCloseDay={handleConfirmCloseDay}
          dailyReports={dailyReports}
          onDeleteReport={handleDeleteReport}
          onShowAlert={(msg, type) => showToast(msg, type)}
        />
      </div>
    </div>
  );
}
