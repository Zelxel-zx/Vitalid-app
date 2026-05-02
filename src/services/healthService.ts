import { HealthDataPoint } from '../types';

export const healthService = {
  getBloodPressureData: (): HealthDataPoint[] => {
    return [
      { date: '1 Mar', value: 145 },
      { date: '8 Mar', value: 138 },
      { date: '15 Mar', value: 135 },
      { date: '22 Mar', value: 130 },
      { date: '29 Mar', value: 128 },
      { date: '5 Abr', value: 125 },
      { date: '12 Abr', value: 122 }
    ];
  },

  getBloodSugarData: (): HealthDataPoint[] => {
    return [
      { date: '1 Mar', value: 145 },
      { date: '8 Mar', value: 142 },
      { date: '15 Mar', value: 138 },
      { date: '22 Mar', value: 135 },
      { date: '29 Mar', value: 130 },
      { date: '5 Abr', value: 128 },
      { date: '12 Abr', value: 125 }
    ];
  },

  recordHealthMetric: async (metric: string, value: number): Promise<void> => {
    // Mock API call
    return Promise.resolve();
  }
};
