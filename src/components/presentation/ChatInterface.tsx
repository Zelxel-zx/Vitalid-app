import { useState, useRef } from 'react';
import { Send, Paperclip, Image as ImageIcon, Phone, Video, MoreVertical, ArrowLeft, FileText } from 'lucide-react';

interface Message {
  id: string;
  sender: 'doctor' | 'patient';
  content: string;
  timestamp: string;
  read?: boolean;
}

interface ChatInterfaceProps {
  doctorName: string;
  doctorAvatar: string;
  messages: Message[];
  onBack: () => void;
}

export function ChatInterface({ doctorName, doctorAvatar, messages, onBack }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('Uploading files:', Array.from(files).map(f => f.name));
      alert(`Archivos seleccionados: ${Array.from(files).map(f => f.name).join(', ')}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <img src={doctorAvatar} alt={doctorName} className="w-10 h-10 rounded-full" />
          <div>
            <h3 className="font-medium text-gray-900">{doctorName}</h3>
            <p className="text-sm text-green-500">En línea</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Phone size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Video size={20} className="text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] ${message.sender === 'patient' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2`}>
              <p>{message.content}</p>
              <p className={`text-xs mt-1 ${message.sender === 'patient' ? 'text-cyan-100' : 'text-gray-500'}`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Adjuntar archivo (imágenes, PDFs)"
          >
            <Paperclip size={20} className="text-gray-600" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
            />
          </div>

          <button
            onClick={handleSend}
            className="p-2 bg-primary hover:opacity-90 rounded-lg transition-colors"
          >
            <Send size={20} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Puedes enviar fotos de exámenes o documentos PDF
        </p>
      </div>
    </div>
  );
}
