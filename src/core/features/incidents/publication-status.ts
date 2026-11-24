export const publicationPending = {
  state: "pending",
  message: "Publishing: readers will see this within a minute",
} as const;

export interface PublicationTarget {
  path: string;
  afterGeneration: number | null;
}

export interface PublicationReceipt {
  expiresAt: number;
  pages: Array<PublicationTarget & { proof: string }>;
  updateId: string;
}

export type IncidentPublication = typeof publicationPending & { receipt: PublicationReceipt };

export interface IncidentPublicationResponse {
  publication: IncidentPublication;
}
