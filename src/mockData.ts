import { Computer } from './types';

const generateComputers = (): Computer[] => {
  const computers: Computer[] = [];
  
  // 80 Disponíveis
  for (let i = 1; i <= 80; i++) {
    computers.push({
      id: `PC-${i.toString().padStart(3, '0')}`,
      name: `Portátil HP ${i.toString().padStart(2, '0')}`,
      model: 'ProBook 450',
      status: 'Disponível',
      location: 'Pólo Sever'
    });
  }
  
  // 10 Manutenção
  for (let i = 81; i <= 90; i++) {
    computers.push({
      id: `PC-${i.toString().padStart(3, '0')}`,
      name: `Portátil HP ${i.toString().padStart(2, '0')}`,
      model: 'ProBook 450',
      status: 'Manutenção',
      location: 'Oficina TI'
    });
  }
  
  return computers;
};

export const initialComputers: Computer[] = generateComputers();
