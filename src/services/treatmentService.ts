import { Treatment } from '../types';

export const treatmentService = {
  getAllTreatments: (): Treatment[] => {
    return [
      {
        title: 'Control de Hipertensión',
        doctor: 'Sarah Johnson',
        status: 'active',
        progress: 75,
        nextAppointment: '15 de mayo de 2026 a las 14:00',
        medications: ['Lisinopril 10mg', 'Amlodipino 5mg']
      },
      {
        title: 'Plan de Cuidado de Diabetes',
        doctor: 'Michael Chen',
        status: 'active',
        progress: 60,
        nextAppointment: '25 de abril de 2026 a las 10:00',
        medications: ['Metformina 500mg']
      },
      {
        title: 'Chequeo Anual',
        doctor: 'Emily Rodriguez',
        status: 'completed',
        progress: 100
      }
    ];
  },

  getActiveTreatments: (): Treatment[] => {
    return treatmentService.getAllTreatments().filter(t => t.status === 'active');
  },

  getCompletedTreatments: (): Treatment[] => {
    return treatmentService.getAllTreatments().filter(t => t.status === 'completed');
  }
};
