import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDuplicateOrder() {
  const [isDuplicating, setIsDuplicating] = useState(false);

  const duplicateOrder = async (orderId: number): Promise<number | null> => {
    setIsDuplicating(true);
    try {
      const { data, error } = await supabase
        .rpc('duplicate_orden_pedido', { p_id_orden_pedido: orderId });

      if (error) throw error;

      toast.success('Orden duplicada exitosamente');
      return data as number;
    } catch (error) {
      console.error('Error duplicando orden:', error);
      toast.error('Error al duplicar la orden');
      return null;
    } finally {
      setIsDuplicating(false);
    }
  };

  return { duplicateOrder, isDuplicating };
}
