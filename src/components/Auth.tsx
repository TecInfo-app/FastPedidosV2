import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { INITIAL_MOTOBOYS, INITIAL_RATES } from '../utils/storage';
import { LogIn, UserPlus, Shield, Store, Mail, Lock } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!restaurantName.trim()) {
          setError('Por favor, informe o nome do restaurante.');
          setLoading(false);
          return;
        }

        // Create Firebase User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Initialize user data structure in Firestore
        const batch = writeBatch(db);

        // User document
        const userRef = doc(db, 'users', user.uid);
        batch.set(userRef, {
          email: user.email,
          selectedStoreId: 'store-1',
          createdAt: new Date().toISOString()
        });

        // Default stores
        const store1Ref = doc(db, 'users', user.uid, 'stores', 'store-1');
        batch.set(store1Ref, { id: 'store-1', name: restaurantName.trim(), isActiveToday: true });

        const store2Ref = doc(db, 'users', user.uid, 'stores', 'store-2');
        batch.set(store2Ref, { id: 'store-2', name: 'Express Centro', isActiveToday: true });

        // Default motoboys
        INITIAL_MOTOBOYS.forEach(boy => {
          const boyRef = doc(db, 'users', user.uid, 'motoboys', boy.id);
          batch.set(boyRef, boy);
        });

        // Default rates
        INITIAL_RATES.forEach(rate => {
          const rateRef = doc(db, 'users', user.uid, 'rates', rate.id);
          batch.set(rateRef, rate);
        });

        await batch.commit();
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha precisa ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Endereço de e-mail inválido.');
      } else {
        setError('Ocorreu um erro. Verifique os dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
            <Store size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            {isRegister ? 'Criar sua conta' : 'Entrar no Fast Pedidos'}
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            {isRegister 
              ? 'Abra seu painel de entregas em poucos segundos' 
              : 'Painel unificado para gestão de motoboys e iFood'
            }
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Nome do Restaurante / Loja
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Store size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-stone-50"
                    placeholder="Ex: Chopparia Matriz"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-stone-50"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm bg-stone-50"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
              </span>
              {loading 
                ? 'Processando...' 
                : isRegister ? 'Criar minha conta' : 'Entrar'
              }
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-sm font-medium text-orange-600 hover:text-orange-500"
          >
            {isRegister 
              ? 'Já tem uma conta? Faça login' 
              : 'Não tem uma conta? Cadastre-se'
            }
          </button>
        </div>
      </div>
    </div>
  );
};
