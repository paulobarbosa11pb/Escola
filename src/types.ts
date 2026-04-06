export type ComputerStatus = 'Disponível' | 'Requisitado' | 'Manutenção';

export interface Computer {
  id: string;
  name: string;
  model: string;
  status: ComputerStatus;
  location: string;
  currentTeam?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  role: string;
}

export interface Reservation {
  id: string;
  remetidaPor: string;
  email: string;
  dataNecessaria: string;
  espacoTrabalho: string;
  numComputadores: number;
  equipa: string;
  horarioUtilizacao: string;
  status: 'Pendente' | 'Ativa' | 'Concluída' | 'Cancelada' | 'Rejeitada';
  returnedBy?: string;
  returnedAt?: string;
  processedBy?: string;
  pickupLocation?: string;
  rejectionReason?: string;
}
