import { useState, useEffect } from 'react';
import { Treatment } from '../types';
import { treatmentService } from '../services/treatmentService';

export function useTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = treatmentService.getAllTreatments();
      setTreatments(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading treatments:', err);
      setLoading(false);
    }
  }, []);

  return { treatments, loading };
}
