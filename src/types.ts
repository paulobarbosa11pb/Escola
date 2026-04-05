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
  quantity: number;
  teacherName: string;
  startTime: string;
  endTime: string;
  room: string;
  status: 'Ativa' | 'Concluída' | 'Cancelada';
  returnedBy?: string;
}
