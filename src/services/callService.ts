import { postJson, request } from './apiClient';

export interface CallSessionResponse {
  callId: number;
  roomName: string;
  status: string;
}

export async function initiateCall(input: {
  callerUserId: number;
  recipientUserId: number;
  roomName: string;
}): Promise<CallSessionResponse> {
  return postJson<CallSessionResponse>('/calls/initiate', input);
}

export async function endCall(callId: number): Promise<void> {
  await request(`/calls/${callId}`, {
    method: 'DELETE',
  });
}
