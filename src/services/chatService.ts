import { ChatMessage } from '../types';

export const chatService = {
  getMessagesForDoctor: (doctorId: number): ChatMessage[] => {
    // Mock data - en producción vendría de una API
    return [
      {
        id: '1',
        sender: 'doctor',
        content: '¡Hola! ¿Cómo te sientes hoy? ¿Has estado tomando tu medicación según lo prescrito?',
        timestamp: '10:30 AM'
      },
      {
        id: '2',
        sender: 'patient',
        content: '¡Hola Dra. Johnson! Sí, la he estado tomando cada mañana. Me siento mucho mejor.',
        timestamp: '10:32 AM'
      },
      {
        id: '3',
        sender: 'doctor',
        content: '¡Qué bueno escuchar eso! Sigue monitoreando tu presión arterial y avísame si notas algún cambio.',
        timestamp: '10:35 AM'
      },
      {
        id: '4',
        sender: 'patient',
        content: 'Lo haré. ¿Debería programar una cita de seguimiento?',
        timestamp: '10:37 AM'
      },
      {
        id: '5',
        sender: 'doctor',
        content: 'Sí, programemos una para el próximo mes para revisar tu progreso.',
        timestamp: '10:40 AM'
      }
    ];
  },

  sendMessage: async (doctorId: number, content: string): Promise<ChatMessage> => {
    // Mock API call
    return {
      id: Date.now().toString(),
      sender: 'patient',
      content,
      timestamp: new Date().toLocaleTimeString()
    };
  }
};
