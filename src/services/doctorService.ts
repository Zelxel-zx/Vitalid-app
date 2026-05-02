import { Doctor } from '../types';

export const doctorService = {
  getAllDoctors: (): Doctor[] => {
    return [
      {
        id: 1,
        name: 'Dra. Sarah Johnson',
        specialty: 'Cardióloga',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
        status: 'online',
        unreadMessages: 3
      },
      {
        id: 2,
        name: 'Dr. Michael Chen',
        specialty: 'Endocrinólogo',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
        status: 'offline',
        unreadMessages: 0
      },
      {
        id: 3,
        name: 'Dra. Emily Rodriguez',
        specialty: 'Medicina General',
        avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop',
        status: 'busy',
        unreadMessages: 1
      }
    ];
  },

  getDoctorById: (id: number): Doctor | undefined => {
    const doctors = doctorService.getAllDoctors();
    return doctors.find(d => d.id === id);
  },

  getDoctorsBySpecialty: (specialty: string): Doctor[] => {
    const doctors = doctorService.getAllDoctors();
    return doctors.filter(d => d.specialty.toLowerCase().includes(specialty.toLowerCase()));
  }
};
