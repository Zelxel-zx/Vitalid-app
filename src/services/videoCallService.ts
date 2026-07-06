const DEFAULT_JITSI_DOMAIN = 'meet.ffmuc.net';

export const JITSI_DOMAIN =
  import.meta.env.VITE_JITSI_DOMAIN || DEFAULT_JITSI_DOMAIN;

export const JITSI_EMBED_ENABLED =
  import.meta.env.VITE_JITSI_EMBED === 'true';

export function buildJitsiUrl(roomName: string): string {
  return `https://${JITSI_DOMAIN}/${encodeURIComponent(roomName)}`;
}
