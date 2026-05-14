import { useState, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatService } from '../services/chatService';

export function useChat(doctorId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) {
      setMessages([]);
      return;
    }

    try {
      const data = chatService.getMessagesForDoctor(doctorId);
      setMessages(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading messages:', err);
      setLoading(false);
    }
  }, [doctorId]);

  const sendMessage = async (content: string) => {
    if (!doctorId) return;
    try {
      const message = await chatService.sendMessage(doctorId, content);
      setMessages(prev => [...prev, message]);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return { messages, loading, sendMessage };
}
