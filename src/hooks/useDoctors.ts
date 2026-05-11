import { useState, useEffect } from 'react';
import { DoctorSummary, getAllDoctors } from '../services/doctorService';

export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchDoctors = async () => {
      try {
        const data = await getAllDoctors();
        if (mounted) {
          setDoctors(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error fetching doctors');
          setLoading(false);
        }
      }
    };
    fetchDoctors();
    return () => { mounted = false; };
  }, []);

  return { doctors, loading, error };
}
