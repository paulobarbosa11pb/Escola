import React, { useState, useMemo } from 'react';
import { 
  Laptop, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  Search, 
  LayoutDashboard,
  History,
  Settings,
  X,
  MapPin,
  User,
  RotateCcw,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Computer, Reservation, ComputerStatus, AdminUser } from './types';
import { initialComputers } from './mockData';

const ADMIN_USERS: AdminUser[] = [
  { id: 'ADM-01', name: 'Prof. Ricardo', role: 'Coordenador TIC' },
  { id: 'ADM-02', name: 'Prof. Ana', role: 'Direção' },
  { id: 'ADM-03', name: 'Sr. Manuel', role: 'Assistente Técnico' },
  { id: 'ADM-04', name: 'Prof. Sofia', role: 'Biblioteca' },
  { id: 'ADM-05', name: 'Admin Geral', role: 'EscolaTech' },
];

export default function App() {
  const [computers, setComputers] = useState<Computer[]>(initialComputers);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'reservations'>('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(ADMIN_USERS[0].id);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminToggle, setShowAdminToggle] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const ADMIN_PASSWORD = 'admin123'; // Password para o Easter Egg

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      setIsPasswordModalOpen(true);
      setLogoClicks(0);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setShowAdminToggle(true);
      setIsPasswordModalOpen(false);
      setPasswordInput('');
    } else {
      alert('Password incorreta!');
      setPasswordInput('');
      setIsPasswordModalOpen(false);
    }
  };

  const currentAdmin = useMemo(() => 
    ADMIN_USERS.find(a => a.id === selectedAdminId) || ADMIN_USERS[0]
  , [selectedAdminId]);

  // Form state
  const [formData, setFormData] = useState({
    teacherName: '',
    startTime: '',
    endTime: '',
    room: '',
    quantity: 1
  });

  const filteredComputers = useMemo(() => {
    return computers.filter(pc => 
      pc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pc.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [computers, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: computers.length,
      available: computers.filter(c => c.status === 'Disponível').length,
      borrowed: computers.filter(c => c.status === 'Requisitado').length,
      maintenance: computers.filter(c => c.status === 'Manutenção').length,
    };
  }, [computers]);

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(formData.quantity);
    
    if (qty > stats.available) {
      alert(`Apenas ${stats.available} computadores disponíveis.`);
      return;
    }

    const newReservation: Reservation = {
      id: `RES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      quantity: qty,
      teacherName: formData.teacherName,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: formData.room,
      status: 'Ativa'
    };

    // Mark 'n' computers as borrowed
    let count = 0;
    const updatedComputers = computers.map(pc => {
      if (pc.status === 'Disponível' && count < qty) {
        count++;
        return { ...pc, status: 'Requisitado' as ComputerStatus };
      }
      return pc;
    });

    setReservations([newReservation, ...reservations]);
    setComputers(updatedComputers);
    
    setIsModalOpen(false);
    setFormData({ teacherName: '', startTime: '', endTime: '', room: '', quantity: 1 });
  };

  const handleReturn = (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation || reservation.status !== 'Ativa') return;

    const qty = reservation.quantity;

    // Update reservation status and track who returned it
    setReservations(prev => prev.map(r => 
      r.id === reservationId ? { 
        ...r, 
        status: 'Concluída' as const,
        returnedBy: currentAdmin.name 
      } : r
    ));

    // Mark 'n' computers as available
    let count = 0;
    setComputers(prev => prev.map(pc => {
      if (pc.status === 'Requisitado' && count < qty) {
        count++;
        return { ...pc, status: 'Disponível' as ComputerStatus };
      }
      return pc;
    }));
  };

  const getStatusColor = (status: ComputerStatus) => {
    switch (status) {
      case 'Disponível': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Requisitado': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Manutenção': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col p-6 z-10">
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-3 mb-10 cursor-pointer select-none active:scale-95 transition-transform"
          title="EscolaTech"
        >
          <div className="bg-blue-600 p-2 rounded-lg">
            <Laptop className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">EscolaTech</h1>
        </div>

        <div className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutDashboard size={20} />
            Inventário
          </button>
          <button 
            onClick={() => setActiveTab('reservations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reservations' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={20} />
            Requisições
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100 space-y-4">
          {showAdminToggle && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-slate-50 rounded-xl border border-blue-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modo Admin</span>
                {isAdmin ? <ShieldCheck size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-slate-300" />}
              </div>
              
              {isAdmin && (
                <div className="mb-3 space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Selecionar Admin</label>
                  <select 
                    className="w-full px-2 py-1.5 text-[10px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                  >
                    {ADMIN_USERS.map(admin => (
                      <option key={admin.id} value={admin.id}>
                        {admin.name} ({admin.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={() => setIsAdmin(!isAdmin)}
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${isAdmin ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}
              >
                {isAdmin ? 'Ativado' : 'Desativado'}
              </button>
            </motion.div>
          )}
          
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
            <Settings size={20} />
            Definições
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 md:p-8 lg:p-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'inventory' ? 'Gestão de Inventário' : 'Histórico de Requisições'}
            </h2>
            <p className="text-slate-500">Bem-vindo ao sistema de gestão escolar.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
            >
              <Plus size={20} />
              Nova Requisição
            </button>
          </div>
        </header>

        {activeTab === 'inventory' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Laptop className="text-blue-600" />} label="Total" value={stats.total} color="blue" />
              <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Disponíveis" value={stats.available} color="emerald" />
              <StatCard icon={<Clock className="text-amber-600" />} label="Requisitados" value={stats.borrowed} color="amber" />
              <StatCard icon={<AlertCircle className="text-rose-600" />} label="Manutenção" value={stats.maintenance} color="rose" />
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Lista de Equipamentos</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Filtrar por nome ou sala..."
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-64 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredComputers.map((pc) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={pc.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(pc.status)}`}>
                        {pc.status}
                      </div>
                      <span className="text-xs font-mono text-slate-400">{pc.id}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-1">{pc.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{pc.model}</p>

                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <MapPin size={14} />
                      {pc.location}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {activeTab === 'reservations' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-bottom border-slate-200">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">ID Reserva</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Quantidade</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Professor</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Horário</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Sala</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                      Nenhuma requisição registada.
                    </td>
                  </tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-500">{res.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold text-blue-600">
                          <Laptop size={14} />
                          {res.quantity} PCs
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <User size={14} />
                          {res.teacherName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {res.startTime} - {res.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{res.room}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                            res.status === 'Ativa' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {res.status}
                          </span>
                          {res.returnedBy && (
                            <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-1">
                              <ShieldCheck size={10} />
                              Por: {res.returnedBy}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isAdmin && res.status === 'Ativa' && (
                          <button 
                            onClick={() => handleReturn(res.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-bold"
                          >
                            <RotateCcw size={14} />
                            Devolver
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Reservation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Nova Requisição</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleReserve} className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl mb-4">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Disponibilidade Atual</p>
                  <p className="font-bold text-slate-800">{stats.available} computadores livres</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Quantidade de Computadores</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    max={stats.available}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Nome do Professor</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ex: Prof. João Silva"
                    value={formData.teacherName}
                    onChange={e => setFormData({...formData, teacherName: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Hora Início</label>
                    <input 
                      required
                      type="time" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.startTime}
                      onChange={e => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Hora Fim</label>
                    <input 
                      required
                      type="time" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.endTime}
                      onChange={e => setFormData({...formData, endTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Sala / Local</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ex: Sala 12 ou Auditório"
                    value={formData.room}
                    onChange={e => setFormData({...formData, room: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={formData.quantity > stats.available || formData.quantity <= 0}
                  className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg mt-4 ${
                    formData.quantity > stats.available || formData.quantity <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                  }`}
                >
                  Confirmar Reserva
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-xs rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="bg-amber-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="text-amber-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Acesso Restrito</h3>
              <p className="text-sm text-slate-500 mb-6">Introduza a password de administrador para continuar.</p>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <input 
                  autoFocus
                  type="password" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-center tracking-widest"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Entrar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    amber: 'bg-amber-50 border-amber-100',
    rose: 'bg-rose-50 border-rose-100',
  };

  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} flex items-center gap-4`}>
      <div className="p-3 bg-white rounded-xl shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
