import { getJson, postJson, uploadFile } from './apiClient';
import { ChatMessage } from '../types';
import { getAuthItem } from './authStorage';

interface ChatMessageResponse {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
}

function toTimestamp(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export const chatService = {
  /**
   * Fetch messages for a conversation between the current user and a specific doctor.
   *
   * - Called by PATIENTS: doctorId = doctor entity ID, userId = patient's user ID
   * - Called by DOCTORS: doctorId = their own doctor entity ID, patientUserId = the other user's ID
   *   In this case pass patientUserId explicitly so the API filters the conversation correctly.
   */
  getMessagesForDoctor: async (
    doctorId: number,
    patientUserId?: number | null,
  ): Promise<ChatMessage[]> => {
    const myUserId = getAuthItem('authUserId');
    const myName = getAuthItem('authUserName');
    const myType = getAuthItem('authUserType');

    // For patients: pass their own userId so the API returns only this patient's thread
    // For doctors:  pass the selected patient's userId (patientUserId param)
    //               without it the API returns ALL messages which is also fine for now
    const filterUserId = myType === 'doctor' ? patientUserId : myUserId;
    const url = filterUserId
      ? `/chat/doctor/${doctorId}?userId=${filterUserId}`
      : `/chat/doctor/${doctorId}`;

    const messages: ChatMessageResponse[] = await getJson(url);

    return (messages || []).map((msg) => {
      // For patients: "patient" = my name, "doctor" = anyone else
      // For doctors: "doctor" = doctor's own name, "patient" = anyone else
      const isMine =
        myType === 'doctor'
          ? msg.sender === myName
          : msg.sender === myName;

      return {
        id: String(msg.id),
        sender: isMine ? (myType === 'doctor' ? 'doctor' : 'patient') : (myType === 'doctor' ? 'patient' : 'doctor'),
        content: msg.content,
        timestamp: toTimestamp(msg.timestamp),
      };
    });
  },

  /**
   * Send a text message.
   * - Patient → Doctor: doctorId = doctor entity ID, receiverUserId = undefined
   * - Doctor → Patient: doctorId = doctor's own entity ID, receiverUserId = patient's user ID
   */
  sendMessage: async (doctorId: number, content: string, receiverUserId?: number | null): Promise<ChatMessage> => {
    const senderId = Number(getAuthItem('authUserId'));
    const myType = getAuthItem('authUserType');
    const myName = getAuthItem('authUserName') || '';
    const response: ChatMessageResponse = await postJson('/chat/send', {
      doctorId,
      senderId,
      content,
      receiverUserId: receiverUserId ?? null,
    });
    const isMine = response.sender === myName || response.sender == null;
    return {
      id: String(response.id),
      sender: isMine ? (myType === 'doctor' ? 'doctor' : 'patient') : (myType === 'doctor' ? 'patient' : 'doctor'),
      content: response.content,
      timestamp: toTimestamp(response.timestamp),
    };
  },

  /**
   * Upload a file (image/PDF) and return a data URI to embed in a message.
   * POST /profile/chat-upload
   */
  uploadFile: async (file: File): Promise<string> => {
    const response = await uploadFile<{ url: string }>('/profile/chat-upload', file);
    return response.url;
  },
};
