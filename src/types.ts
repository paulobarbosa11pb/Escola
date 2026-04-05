export type ComputerStatus = 'Disponível' | 'Requisitado' | 'Manutenção';

export interface Computer {
  id: string;
  name: string;
  model: string;
  status: ComputerStatus;
  location: string;
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
  status: 'Ativa' | 'Concluída' | 'Cancelada';
  returnedBy?: string;
}
