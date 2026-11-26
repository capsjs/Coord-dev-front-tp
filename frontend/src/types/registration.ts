// Calqué sur le schéma Registration de backend/openapi.yaml
export interface Registration {
  eventId: number;
  userId: number;
  createdAt: string;
}

export interface EventRegistration extends Registration {
  user: {
    id: number;
    name: string;
    email: string;
  };
}
