import { useState, useEffect } from 'react';
import { HealthDataPoint } from '../types';
import { healthService } from '../services/healthService';

export function useHealthData() {
  const [bloodPressure, setBloodPressure] = useState<HealthDataPoint[]>([]);
  const [bloodSugar, setBloodSugar] = useState<HealthDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const bpData = healthService.getBloodPressureData();
      const bsData = healthService.getBloodSugarData();
      setBloodPressure(bpData);
      setBloodSugar(bsData);
      setLoading(false);
    } catch (err) {
      console.error('Error loading health data:', err);
      setLoading(false);
    }
  }, []);

  return { bloodPressure, bloodSugar, loading };
}
