import { Store, Motoboy, Rate, Order } from '../types';

export const INITIAL_STORES: Store[] = [
  { id: 'store-1', name: 'Chopparia Matriz' },
  { id: 'store-2', name: 'Express Centro' },
];

export const INITIAL_MOTOBOYS: Motoboy[] = [
  { id: 'boy-1', name: 'Carlos Silva', password: '1234', isActiveToday: true },
  { id: 'boy-2', name: 'Eduardo Santos', password: '1234', isActiveToday: true },
];

export const INITIAL_RATES: Rate[] = [
  { id: 'rate-1', description: 'Taxa Fixa', value: '7.50' },
  { id: 'rate-2', description: 'Taxa Fixa', value: '10.00' },
  { id: 'rate-3', description: 'Taxa Fixa', value: '12.50' },
];

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      return JSON.parse(item);
    }
  } catch (err) {
    console.error(`Error loading key "${key}" from localStorage:`, err);
  }
  return fallback;
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key "${key}" to localStorage:`, err);
  }
};
