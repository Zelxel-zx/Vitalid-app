import { useState, useEffect } from 'react';
import { Doctor } from '../types';
import { doctorService } from '../services/doctorService';

export function useDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = doctorService.getAllDoctors();
      setDoctors(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching doctors');
      setLoading(false);
    }
  }, []);

  return { doctors, loading, error };
}
