// Auth Types
export type UserType = 'patient' | 'doctor' | null;

export interface User {
  id: string;
  type: UserType;
  name: string;
  avatar?: string;
}

// Navigation Types
export type PatientView = 'home' | 'messages' | 'treatments' | 'appointments' | 'history' | 'profile';
export type DoctorView = 'home' | 'messages' | 'patients' | 'profile';
export type View = PatientView | DoctorView;

// Doctor Types
export type DoctorStatus = 'online' | 'offline' | 'busy';

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  avatar: string;
  status: DoctorStatus;
  unreadMessages: number;
}

// Chat Types
export interface ChatMessage {
  id: string;
  sender: 'doctor' | 'patient';
  content: string;
  timestamp: string;
}

// Treatment Types
export type TreatmentStatus = 'active' | 'completed' | 'pending' | 'paused' | 'cancelled';

export interface Treatment {
  title: string;
  doctor: string;
  status: TreatmentStatus;
  progress: number;
  nextAppointment?: string;
  medications?: string[];
}

// Health Data Types
export interface HealthDataPoint {
  date: string;
  value: number;
}

// Appointment Types
export interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

// Medication Types
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
}
