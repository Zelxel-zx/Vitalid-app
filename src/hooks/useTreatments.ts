import { useCallback, useState, useEffect } from 'react';
import { getMyTreatments, TreatmentResponse } from '../services/treatmentService';

export function useTreatments() {
  const [treatments, setTreatments] = useState<TreatmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTreatments = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyTreatments();
      setTreatments(data);
    } catch (err) {
      console.error('Error loading treatments:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar tratamientos');
      setTreatments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTreatments();
  }, [loadTreatments]);

  return { treatments, loading, error, refresh: loadTreatments };
}
