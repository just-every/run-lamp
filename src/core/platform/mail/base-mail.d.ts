declare module '*modules/mail/index.mjs' {
  interface RelayConfiguration { apiKey: string; relayUrl: string }
  interface RelaySender {
    send(message: { deliveryId: string; messageKey: string; from: string; to: string[]; subject: string; text: string; html?: string; headers: Record<string, string> }): Promise<{
      status: 'accepted' | 'rejected' | 'rate_limited' | 'uncertain';
      providerMessageId: string | null;
      code?: string;
    }>;
  }
  export function createMailSender(config: RelayConfiguration & { provider: 'rer'; mode: 'production' }): RelaySender;
  export function createOwnerRelaySender(config: RelayConfiguration & { ownerEmail: string }): RelaySender;
}
