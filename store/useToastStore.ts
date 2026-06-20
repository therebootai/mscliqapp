import { create } from 'zustand';

interface ToastState {
  message: string | null;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  timeoutId: NodeJS.Timeout | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  message: null,
  type: 'success',
  visible: false,
  timeoutId: null,
  showToast: (message, type = 'success') => {
    const { timeoutId } = get();
    if (timeoutId) clearTimeout(timeoutId);
    
    const newTimeoutId = setTimeout(() => {
      set({ visible: false });
    }, 3000);

    set({ message, type, visible: true, timeoutId: newTimeoutId });
  },
  hideToast: () => set({ visible: false }),
}));
