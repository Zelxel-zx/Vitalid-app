import { postJson } from './apiClient';

export interface AiChatResponse {
  reply: string;
  answeredFromDocs: boolean;
  sources: string[];
}

export async function askAi(message: string) {
  return postJson<AiChatResponse>('/ai/chat/ask', { message });
}
