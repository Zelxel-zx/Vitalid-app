import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image as ImageIcon, Phone, Video, MoreVertical, ArrowLeft, X, FileText, PhoneOff } from 'lucide-react';
import { chatService } from '../../services/chatService';
import { JitsiCallModal } from './JitsiCallModal';
import { postJson, putJson } from '../../services/apiClient';

interface Message {
  id: string;
  sender: 'doctor' | 'patient';
  content: string;
  timestamp: string;
  read?: boolean;
}

interface ChatInterfaceProps {
  doctorId: number;
  doctorName: string;
  doctorAvatar: string;
  messages: Message[];
  onBack: () => void;
  onMessagesUpdate?: (messages: Message[]) => void;
  /** When true, the logged-in user IS the doctor — their messages appear on the right */
  isDoctor?: boolean;
  /** When isDoctor=true, pass the patient's user ID so messages are routed correctly */
  chatPartnerUserId?: number | null;
  /** The other party's userId — used to send call notifications */
  recipientUserId?: number | null;
}

/** Detect if content is a base64 data URI */
function isDataUri(content: string) {
  return content.startsWith('data:');
}
function isImageUri(content: string) {
  return content.startsWith('data:image/');
}
function isPdfUri(content: string) {
  return content.startsWith('data:application/pdf');
}

export function ChatInterface({ doctorId, doctorName, doctorAvatar, messages: initialMessages, onBack, onMessagesUpdate, isDoctor = false, chatPartnerUserId, recipientUserId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCallRoom, setActiveCallRoom] = useState<string | null>(null);
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const myUserId = localStorage.getItem('authUserId');
  const myName = localStorage.getItem('authUserName') || 'Usuario';

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => {
      const updated = [...prev, msg];
      onMessagesUpdate?.(updated);
      return updated;
    });
  };

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || isSending) return;
    setNewMessage('');
    setIsSending(true);
    try {
      // When doctor sends, pass the patient's userId so the backend routes it correctly
      const sent = await chatService.sendMessage(doctorId, text, isDoctor ? chatPartnerUserId : null);
      addMessage(sent);
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    e.target.value = '';
    setIsUploading(true);
    try {
      const dataUri = await chatService.uploadFile(file);
      const sent = await chatService.sendMessage(doctorId, dataUri, isDoctor ? chatPartnerUserId : null);
      addMessage(sent);
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error al subir el archivo. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Initiates a call:
   * 1. Posts /calls/initiate so the recipient gets a ringing notification
   * 2. Opens the Jitsi call in-app (no new tab, no lobby issue)
   */
  const initiateCall = async () => {
    const roomName = `vitalid-room-${doctorId}-${Date.now()}`;
    setIsCalling(true);
    try {
      // Determine who to notify
      const targetUserId = isDoctor ? chatPartnerUserId : recipientUserId;
      if (targetUserId && myUserId) {
        const result = await postJson<{ callId: number; roomName: string }>('/calls/initiate', {
          callerUserId: Number(myUserId),
          recipientUserId: targetUserId,
          roomName,
        });
        setActiveCallId(result.callId);
        setActiveCallRoom(result.roomName);
      } else {
        // Fallback: open without notification
        setActiveCallRoom(roomName);
      }
    } catch (err) {
      console.error('Error initiating call:', err);
      setActiveCallRoom(roomName);
    } finally {
      setIsCalling(false);
    }
  };

  const endCall = async () => {
    if (activeCallId) {
      try { await putJson(`/calls/${activeCallId}/status`, { status: 'ENDED' }); } catch {/* ignore */}
    }
    setActiveCallRoom(null);
    setActiveCallId(null);
  };

  const renderMessageContent = (content: string) => {
    if (isImageUri(content)) {
      return (
        <img
          src={content}
          alt="Imagen adjunta"
          className="max-w-[220px] rounded-lg cursor-pointer"
          onClick={() => window.open(content, '_blank')}
        />
      );
    }
    if (isPdfUri(content)) {
      return (
        <a
          href={content}
          download="documento.pdf"
          className="flex items-center gap-2 underline"
        >
          <FileText size={18} />
          Descargar PDF
        </a>
      );
    }
    return <p>{content}</p>;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          {doctorAvatar ? (
            <img src={doctorAvatar} alt={doctorName} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {doctorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-medium text-gray-900">{doctorName}</h3>
            <p className="text-sm text-green-500">En línea</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={initiateCall}
            disabled={isCalling}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Videollamada"
          >
            {isCalling ? (
              <span className="text-xs text-gray-500 px-1">Llamando...</span>
            ) : (
              <Video size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            No hay mensajes aún. ¡Escribe el primero!
          </p>
        )}
        {messages.map((message) => {
          // For patients: their own messages have sender='patient'
          // For doctors: their own messages have sender='doctor'
          const isMine = isDoctor ? message.sender === 'doctor' : message.sender === 'patient';
          return (
          <div
            key={message.id}
            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] ${
                isMine
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-900'
              } rounded-2xl px-4 py-2`}
            >
              {renderMessageContent(message.content)}
              <p
                className={`text-xs mt-1 ${
                  isMine ? 'text-cyan-100' : 'text-gray-500'
                }`}
              >
                {message.timestamp}
              </p>
            </div>
          </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {isUploading && (
          <p className="text-xs text-gray-500 mb-2 text-center animate-pulse">Subiendo archivo...</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple={false}
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSending}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Adjuntar imagen o PDF"
          >
            <Paperclip size={20} className="text-gray-600" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isSending}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Enviar foto"
          >
            <ImageIcon size={20} className="text-gray-600" />
          </button>

          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu mensaje..."
              className="w-full bg-transparent outline-none"
              disabled={isSending}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
            className="p-2 bg-primary hover:opacity-90 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Puedes enviar fotos de exámenes o documentos PDF · 📹 Llama con el botón de arriba
        </p>
      </div>

      {/* In-app Jitsi call overlay */}
      {activeCallRoom && (
        <JitsiCallModal
          roomName={activeCallRoom}
          displayName={myName}
          onClose={endCall}
        />
      )}
    </div>
  );
}
