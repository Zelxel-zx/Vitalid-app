import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { AiAppointmentAction, askAi, confirmAiAppointment } from '../../services/aiChatService';

type AiMessage = {
  id: number;
  role: 'assistant' | 'user';
  content: string;
};

const initialMessages: AiMessage[] = [
  {
    id: 1,
    role: 'assistant',
    content:
      'Hola, soy el asistente medico informativo de Vitalid. Puedo orientarte con informacion general y ayudarte a agendar una cita.',
  },
];

export function AiChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState<AiAppointmentAction | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const addAssistantMessage = (content: string) => {
    setMessages((current) => [
      ...current,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        role: 'assistant',
        content,
      },
    ]);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        role: 'user',
        content: trimmed,
      },
    ]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      if (pendingAction && isConfirmationIntent(trimmed) && pendingAction.missing.length === 0) {
        const appointment = await confirmAiAppointment(pendingAction);
        setPendingAction(null);
        addAssistantMessage(
          `Cita confirmada con ${appointment.doctorName} el ${appointment.date} a las ${appointment.time}.`,
        );
        return;
      }

      if (pendingAction && isCancelIntent(trimmed)) {
        setPendingAction(null);
        addAssistantMessage('Listo, cancele el agendamiento.');
        return;
      }

      const response = await askAi(trimmed, pendingAction);
      setPendingAction(response.pendingAction ?? null);
      addAssistantMessage(response.reply);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo contactar al asistente.';
      setError(message);
      addAssistantMessage(
        'No pude responder en este momento. Revisa la conexion o intenta nuevamente en unos segundos.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-2xl border border-primary/30 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Bot size={20} />
              </div>
              <div>
                <p className="font-semibold leading-tight">Asistente Vitalid</p>
                <p className="text-xs text-white/80">Orientacion medica y citas</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 transition hover:bg-white/15"
              aria-label="Cerrar asistente"
            >
              <X size={18} />
            </button>
          </div>

          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            Esta IA no diagnostica ni reemplaza una consulta medica. Ante senales de alarma, busca atencion de emergencia.
          </div>

          <div className="max-h-[min(460px,60vh)] space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  Pensando...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-200 bg-white p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={pendingAction ? 'Confirma, cancela o completa tu cita...' : 'Consulta medica o agenda una cita...'}
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Enviar pregunta"
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40"
        aria-label="Abrir asistente Vitalid"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={26} />}
      </button>
    </div>
  );
}

function isConfirmationIntent(message: string) {
  return /\b(si|sí|confirmo|confirmar|ok|dale|acepto|agenda|agendala|agéndala)\b/i.test(message);
}

function isCancelIntent(message: string) {
  return /\b(cancelar|cancela|olvida|salir|no)\b/i.test(message);
}
