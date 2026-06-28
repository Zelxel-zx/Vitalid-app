import { getJson, postJson, uploadFile } from './apiClient';
import { ChatMessage } from '../types';
import { getAuthItem } from './authStorage';

interface ChatMessageResponse {
  id: number;
  sender: string;
  /** Issue #7 fix: backend now returns senderId so we can identify sender by ID, not by name */
  senderId?: number | null;
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
   * Issue #7 fix: sender is now identified by comparing senderId (number) against
   * the current user's ID stored in localStorage. This is reliable even when the
   * name stored in localStorage differs slightly from the DB value.
   */
  getMessagesForDoctor: async (
    doctorId: number,
    patientUserId?: number | null,
  ): Promise<ChatMessage[]> => {
    const myUserId = Number(getAuthItem('authUserId'));
    const myType = getAuthItem('authUserType');

    // For patients: pass their own userId so the API returns only this patient's thread
    // For doctors:  pass the selected patient's userId (patientUserId param)
    const filterUserId = myType === 'doctor' ? patientUserId : myUserId;
    const url = filterUserId
      ? `/chat/doctor/${doctorId}?userId=${filterUserId}`
      : `/chat/doctor/${doctorId}`;

    const messages: ChatMessageResponse[] = await getJson(url);

    return (messages || []).map((msg) => {
      // Primary: compare by senderId (reliable, not affected by name typos or format)
      // Fallback: if senderId is not yet present (old data), keep old behavior
      const isMine =
        msg.senderId != null
          ? msg.senderId === myUserId
          : msg.sender === getAuthItem('authUserName');

      return {
        id: String(msg.id),
        sender: isMine
          ? (myType === 'doctor' ? 'doctor' : 'patient')
          : (myType === 'doctor' ? 'patient' : 'doctor'),
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
    const myUserId = Number(getAuthItem('authUserId'));
    const myType = getAuthItem('authUserType');
    const response: ChatMessageResponse = await postJson('/chat/send', {
      doctorId,
      senderId: myUserId,
      content,
      receiverUserId: receiverUserId ?? null,
    });
    // Use senderId for reliable sender detection
    const isMine =
      response.senderId != null
        ? response.senderId === myUserId
        : true; // we just sent it, so it's ours

    return {
      id: String(response.id),
      sender: isMine
        ? (myType === 'doctor' ? 'doctor' : 'patient')
        : (myType === 'doctor' ? 'patient' : 'doctor'),
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
