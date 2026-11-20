import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';

export function useBookHallNavigation() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  return useCallback(
    (hallId?: number) => {
      const target = hallId ? `/book?hallId=${hallId}` : '/book';
      if (!user) {
        showToast('Please login to book a hall', 'info');
        navigate('/login', {
          state: { from: target, bookingMessage: 'Please login to book a hall' },
        });
        return;
      }
      navigate(target);
    },
    [user, showToast, navigate]
  );
}
