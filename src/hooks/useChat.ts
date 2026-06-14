import { useState, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatService } from '../services/chatService';

export function useChat(doctorId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doctorId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    chatService.getMessagesForDoctor(doctorId)
      .then((data) => {
        setMessages(data);
      })
      .catch((err) => {
        console.error('Error loading messages:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [doctorId]);

  return { messages, loading, setMessages };
}
