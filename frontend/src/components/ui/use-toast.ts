import * as React from 'react';
import type { ToastItem, ToastType } from './toast-types';

export interface ToastOptions {
  description?: string;
  type?: ToastType;
}

export type ToastFn = (title: string, options?: ToastOptions) => void;

export interface ToastDispatchContextType {
  toast: ToastFn;
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToastDispatchContext = React.createContext<ToastDispatchContextType>({
  toast: () => {},
  addToast: () => {},
  removeToast: () => {},
});

export const ToastStateContext = React.createContext<{ toasts: ToastItem[] }>({
  toasts: [],
});

// Backward-compatibility export
export const ToastContext = ToastDispatchContext;

export function useToast() {
  const dispatch = React.useContext(ToastDispatchContext);
  return {
    toast: dispatch.toast,
    addToast: dispatch.addToast,
    removeToast: dispatch.removeToast,
  };
}

export function useToastState() {
  return React.useContext(ToastStateContext);
}
