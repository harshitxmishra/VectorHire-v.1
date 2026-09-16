'use client';

import { useCallback } from 'react';
import {
  useToastController,
  Toast,
  ToastTitle,
} from '@fluentui/react-components';

export const APP_TOASTER_ID = 'vectorhire-toaster';

export function useAppToast() {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);

  return useCallback(
    (title: string, intent: 'success' | 'error' | 'info' = 'info') => {
      dispatchToast(<Toast><ToastTitle>{title}</ToastTitle></Toast>, { intent, timeout: 4000 });
    },
    [dispatchToast]
  );
}
