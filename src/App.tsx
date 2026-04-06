import React, { useState, useMemo, useEffect } from 'react';
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
  Users,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  QrCode,
  Bell,
  Info,
  ThumbsUp,
  ThumbsDown,
  Download,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp, 
  setDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Computer, Reservation, ComputerStatus, AdminUser } from './types';
import { initialComputers } from './mockData';
import { db, handleFirestoreError, OperationType } from './firebase';

// QR Scanner Component
const QrScanner = ({ onScan, onClose }: { onScan: (data: string) => void, onClose: () => void }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      },
      (error) => {
        // console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="text-blue-600" size={20} />
            Digitalizar QR Code
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div id="reader" className="overflow-hidden rounded-xl border-2 border-slate-100"></div>
        <p className="mt-4 text-xs text-slate-500 text-center">
          Aponte a câmara para o código QR do equipamento ou da requisição.
        </p>
      </motion.div>
    </div>
  );
};

const ADMIN_USERS: AdminUser[] = [
  { id: 'ADM-05', name: 'Paulo Barbosa', role: 'Admin Geral' },
];

const Dashboard = ({ computers, reservations }: { computers: Computer[], reservations: Reservation[] }) => {
  const stats = {
    total: computers.length,
    available: computers.filter(c => c.status === 'Disponível').length,
    borrowed: computers.filter(c => c.status === 'Requisitado').length,
    maintenance: computers.filter(c => c.status === 'Manutenção').length,
  };

  const pieData = [
    { name: 'Disponível', value: stats.available, color: '#10b981' },
    { name: 'Requisitado', value: stats.borrowed, color: '#3b82f6' },
    { name: 'Manutenção', value: stats.maintenance, color: '#f43f5e' },
  ];

  // Group reservations by team
  const teamUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    reservations.forEach(res => {
      if (res.status === 'Ativa' || res.status === 'Concluída') {
        counts[res.equipa] = (counts[res.equipa] || 0) + res.numComputadores;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [reservations]);

  // Last 7 days activity (mocked for visualization if no timestamps)
  const activityData = [
    { day: 'Seg', reqs: 12 },
    { day: 'Ter', reqs: 19 },
    { day: 'Qua', reqs: 15 },
    { day: 'Qui', reqs: 22 },
    { day: 'Sex', reqs: 30 },
    { day: 'Sáb', reqs: 8 },
    { day: 'Dom', reqs: 5 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard de Performance</h2>
          <p className="text-slate-500">Análise em tempo real da utilização de recursos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <PieChartIcon size={16} className="text-blue-600" />
            Distribuição de Inventário
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Usage */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" />
            Top 5 Equipas (Computadores Requisitados)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-600" />
            Atividade Semanal (Novas Requisições)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="reqs" stroke="#3b82f6" strokeWidth={3} dot={{r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'reservations' | 'dashboard' | 'settings'>('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, message: string, type: 'success' | 'info' | 'warning'}[]>([]);
  const [acceptingResId, setAcceptingResId] = useState<string | null>(null);
  const [rejectingResId, setRejectingResId] = useState<string | null>(null);
  const [pickupLocationInput, setPickupLocationInput] = useState('');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComputerStatus | 'Todos'>('Todos');
  const [teamFilter, setTeamFilter] = useState<string>('Todos');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<Reservation['status'] | 'Todos'>('Todos');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState(ADMIN_USERS[0].id);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminToggle, setShowAdminToggle] = useState(false);
  const [lastPendingCount, setLastPendingCount] = useState(0);
  const [expandedResId, setExpandedResId] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingComputerId, setEditingComputerId] = useState<string | null>(null);
  const ADMIN_PASSWORD = 'admin123'; // Password para o Easter Egg

  // Firebase Sync
  useEffect(() => {
    const qComputers = query(collection(db, 'computers'));
    const unsubComputers = onSnapshot(qComputers, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as Computer);
      setComputers(docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'computers'));

    const qReservations = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
    const unsubReservations = onSnapshot(qReservations, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as Reservation);
      setReservations(docs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reservations'));

    return () => {
      unsubComputers();
      unsubReservations();
    };
  }, []);

  const seedDatabase = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      initialComputers.forEach(pc => {
        const docRef = doc(db, 'computers', pc.id);
        batch.set(docRef, pc);
      });
      await batch.commit();
      addNotification('Base de dados inicializada com sucesso!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'computers');
    } finally {
      setIsSeeding(false);
    }
  };

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
      setIsAdmin(true);
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
    remetidaPor: '',
    email: '',
    dataNecessaria: '',
    espacoTrabalho: '',
    numComputadores: 1,
    equipa: '',
    horarioUtilizacao: ''
  });

  const filteredComputers = useMemo(() => {
    return computers.filter(pc => {
      const matchesSearch = pc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           pc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pc.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || pc.status === statusFilter;
      const matchesTeam = teamFilter === 'Todos' || pc.currentTeam === teamFilter;
      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [computers, searchTerm, statusFilter, teamFilter]);

  const activeTeams = useMemo(() => {
    const teams = new Set<string>();
    computers.forEach(pc => {
      if (pc.currentTeam) teams.add(pc.currentTeam);
    });
    return Array.from(teams).sort();
  }, [computers]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const matchesStatus = reservationStatusFilter === 'Todos' || res.status === reservationStatusFilter;
      return matchesStatus;
    }).sort((a, b) => b.id.localeCompare(a.id)); // Sort by ID (descending) as a proxy for time if no timestamp
  }, [reservations, reservationStatusFilter]);

  const stats = useMemo(() => {
    return {
      total: computers.length,
      available: computers.filter(c => c.status === 'Disponível').length,
      borrowed: computers.filter(c => c.status === 'Requisitado').length,
      maintenance: computers.filter(c => c.status === 'Manutenção').length,
    };
  }, [computers]);

  const addNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Low stock alert for admins
  useEffect(() => {
    if (isAdmin && stats.available < 20) {
      addNotification(`Stock Crítico: Apenas ${stats.available} computadores disponíveis no Pólo.`, 'warning');
    }
  }, [isAdmin, stats.available < 20]);

  // New pending reservation alert for admins
  useEffect(() => {
    const currentPendingCount = reservations.filter(r => r.status === 'Pendente').length;
    if (isAdmin && currentPendingCount > lastPendingCount) {
      addNotification(`Nova requisição pendente de aprovação!`, 'info');
    }
    setLastPendingCount(currentPendingCount);
  }, [isAdmin, reservations.length]);

  const handleExportCSV = () => {
    if (filteredReservations.length === 0) {
      addNotification('Não existem dados para exportar.', 'info');
      return;
    }

    const headers = [
      'ID Reserva',
      'Remetida por',
      'Email',
      'Data Necessária',
      'Espaço',
      'Nº PCs',
      'Equipa',
      'Horário',
      'Local Levantamento',
      'Estado',
      'Processado por',
      'Motivo Rejeição',
      'Devolvido a',
      'Data Devolução'
    ];

    const csvRows = filteredReservations.map(res => [
      res.id,
      res.remetidaPor,
      res.email,
      res.dataNecessaria,
      res.espacoTrabalho,
      res.numComputadores,
      res.equipa,
      res.horarioUtilizacao,
      res.pickupLocation || '',
      res.status,
      res.processedBy || '',
      res.rejectionReason || '',
      res.returnedBy || '',
      res.returnedAt || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `requisicoes_polo_sever_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification('Exportação concluída com sucesso!', 'success');
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(formData.numComputadores);
    
    if (qty > stats.available) {
      alert(`Apenas ${stats.available} computadores disponíveis.`);
      return;
    }

    const resId = `RES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newReservation: any = {
      id: resId,
      numComputadores: qty,
      remetidaPor: formData.remetidaPor,
      email: formData.email,
      dataNecessaria: formData.dataNecessaria,
      espacoTrabalho: formData.espacoTrabalho,
      equipa: formData.equipa,
      horarioUtilizacao: formData.horarioUtilizacao,
      status: 'Pendente',
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, 'reservations', resId), newReservation);
      setIsModalOpen(false);
      addNotification(`Requisição enviada! Aguarde aprovação do administrador.`, 'info');
      setFormData({ 
        remetidaPor: '', 
        email: '', 
        dataNecessaria: '', 
        espacoTrabalho: '', 
        numComputadores: 1, 
        equipa: '', 
        horarioUtilizacao: '' 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reservations');
    }
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingResId) return;

    const res = reservations.find(r => r.id === acceptingResId);
    if (!res) return;

    try {
      // Find available computers
      const availablePCs = computers.filter(c => c.status === 'Disponível').slice(0, res.numComputadores);
      
      if (availablePCs.length < res.numComputadores) {
        alert('Não há computadores suficientes disponíveis para aprovar esta requisição.');
        return;
      }

      const batch = writeBatch(db);
      
      // Update computers
      availablePCs.forEach(pc => {
        batch.update(doc(db, 'computers', pc.id), {
          status: 'Requisitado',
          currentTeam: res.equipa
        });
      });

      // Update reservation
      batch.update(doc(db, 'reservations', acceptingResId), {
        status: 'Ativa',
        processedBy: currentAdmin.name,
        pickupLocation: pickupLocationInput
      });

      await batch.commit();
      setAcceptingResId(null);
      setPickupLocationInput('');
      addNotification(`Requisição ${acceptingResId} aprovada com sucesso!`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reservations');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingResId) return;
    
    try {
      await updateDoc(doc(db, 'reservations', rejectingResId), {
        status: 'Rejeitada',
        processedBy: currentAdmin.name,
        rejectionReason: rejectionReasonInput
      });
      setRejectingResId(null);
      setRejectionReasonInput('');
      addNotification(`Requisição ${rejectingResId} rejeitada.`, 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reservations');
    }
  };

  const handleQrScan = (data: string) => {
    try {
      // Try to parse JSON if QR contains multiple fields
      const parsed = JSON.parse(data);
      setFormData({
        ...formData,
        ...parsed
      });
    } catch (e) {
      // If not JSON, check if it's a number (numComputadores)
      const num = parseInt(data);
      if (!isNaN(num)) {
        setFormData({
          ...formData,
          numComputadores: Math.min(num, stats.available)
        });
      } else {
        // Otherwise, maybe it's a team name or location
        setFormData({
          ...formData,
          equipa: data
        });
      }
    }
    setIsQrScannerOpen(false);
  };

  const handleReturn = async (reservationId: string) => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res) return;

    try {
      // Find computers associated with this team
      const teamPCs = computers.filter(c => c.currentTeam === res.equipa && c.status === 'Requisitado');
      
      const batch = writeBatch(db);
      
      teamPCs.forEach(pc => {
        batch.update(doc(db, 'computers', pc.id), {
          status: 'Disponível',
          currentTeam: null
        });
      });

      batch.update(doc(db, 'reservations', reservationId), {
        status: 'Concluída',
        returnedBy: currentAdmin.name,
        returnedAt: new Date().toLocaleString('pt-PT')
      });

      await batch.commit();
      addNotification(`Equipamentos da requisição ${reservationId} devolvidos.`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'reservations');
    }
  };

  const updateComputerStatus = async (pcId: string, newStatus: ComputerStatus) => {
    try {
      await updateDoc(doc(db, 'computers', pcId), { status: newStatus });
      addNotification(`Estado do PC ${pcId} atualizado para ${newStatus}.`, 'info');
      setEditingComputerId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'computers');
    }
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
          title="Pólo Sever"
        >
          <div className="bg-blue-600 p-2 rounded-lg">
            <Laptop className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">Pólo Sever</h1>
        </div>

        <div className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Laptop size={20} />
            Inventário
          </button>
          <button 
            onClick={() => setActiveTab('reservations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reservations' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <History size={20} />
            Requisições
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <BarChart3 size={20} />
            Dashboard
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
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
          >
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
              {activeTab === 'inventory' && 'Gestão de Inventário'}
              {activeTab === 'reservations' && 'Histórico de Requisições'}
              {activeTab === 'dashboard' && 'Dashboard de Estatísticas'}
              {activeTab === 'settings' && 'Definições do Sistema'}
            </h2>
            <p className="text-slate-500">
              {activeTab === 'inventory' && 'Bem-vindo ao sistema de gestão escolar.'}
              {activeTab === 'reservations' && 'Consulte o histórico de todas as requisições efetuadas.'}
              {activeTab === 'dashboard' && 'Visualize o desempenho e utilização dos recursos.'}
              {activeTab === 'settings' && 'Configure as preferências do sistema.'}
            </p>
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

        {activeTab === 'dashboard' && (
          <Dashboard computers={computers} reservations={reservations} />
        )}

        {activeTab === 'inventory' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div onClick={() => setStatusFilter('Todos')} className="cursor-pointer">
                <StatCard icon={<Laptop className="text-blue-600" />} label="Total" value={stats.total} color="blue" active={statusFilter === 'Todos'} />
              </div>
              <div onClick={() => setStatusFilter('Disponível')} className="cursor-pointer">
                <StatCard icon={<CheckCircle2 className="text-emerald-600" />} label="Disponíveis" value={stats.available} color="emerald" active={statusFilter === 'Disponível'} />
              </div>
              <div onClick={() => setStatusFilter('Requisitado')} className="cursor-pointer">
                <StatCard icon={<Clock className="text-amber-600" />} label="Requisitados" value={stats.borrowed} color="amber" active={statusFilter === 'Requisitado'} />
              </div>
              <div onClick={() => setStatusFilter('Manutenção')} className="cursor-pointer">
                <StatCard icon={<AlertCircle className="text-rose-600" />} label="Manutenção" value={stats.maintenance} color="rose" active={statusFilter === 'Manutenção'} />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-slate-800">Lista de Equipamentos</h3>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome ou sala..."
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-64 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Todos">Todos os Estados</option>
                  <option value="Disponível">Disponível</option>
                  <option value="Requisitado">Requisitado</option>
                  <option value="Manutenção">Manutenção</option>
                </select>
                <select 
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Todos">Todas as Equipas</option>
                  {activeTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
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
                      {isAdmin ? (
                        <select 
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(pc.status)}`}
                          value={pc.status}
                          onChange={(e) => updateComputerStatus(pc.id, e.target.value as ComputerStatus)}
                        >
                          <option value="Disponível">Disponível</option>
                          <option value="Requisitado">Requisitado</option>
                          <option value="Manutenção">Manutenção</option>
                        </select>
                      ) : (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(pc.status)}`}>
                          {pc.status}
                        </div>
                      )}
                      <span className="text-xs font-mono text-slate-400">{pc.id}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800 mb-1">{pc.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{pc.model}</p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <MapPin size={14} />
                        {pc.location}
                      </div>
                      {pc.currentTeam && (
                        <div className="flex items-center gap-2 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-lg w-fit">
                          <Users size={12} />
                          {pc.currentTeam}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Gestão de Requisições</h2>
                  <p className="text-xs text-slate-500">Visualize e processe todos os pedidos do Pólo.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase mr-2">Filtrar por:</span>
                <select 
                  value={reservationStatusFilter}
                  onChange={(e) => setReservationStatusFilter(e.target.value as any)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Todos">Todos os Estados</option>
                  <option value="Pendente">Pendente</option>
                  <option value="Ativa">Ativa</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Rejeitada">Rejeitada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>

                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-200"
                  title="Exportar para CSV"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-bottom border-slate-200">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">ID Reserva</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Remetida por</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Necessária para</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Espaço</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">PCs</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Equipa</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Horário / Levantamento</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600">Estado</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-10 text-center text-slate-400">
                          Nenhuma requisição encontrada com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((res) => (
                        <React.Fragment key={res.id}>
                          <tr 
                            onClick={() => setExpandedResId(expandedResId === res.id ? null : res.id)}
                            className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedResId === res.id ? 'bg-blue-50/30' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div className="font-mono text-xs text-slate-500">{res.id}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 text-slate-800 font-medium">
                                  <User size={14} />
                                  {res.remetidaPor}
                                </div>
                                <div className="text-[10px] text-slate-400 ml-5">{res.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-600 text-sm">
                                <Calendar size={14} />
                                {res.dataNecessaria}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-600">{res.espacoTrabalho}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 font-bold text-blue-600">
                                <Laptop size={14} />
                                {res.numComputadores}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-slate-600">{res.equipa}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="text-sm text-slate-600 font-medium">
                                  {res.horarioUtilizacao}
                                </div>
                                {res.pickupLocation && (
                                  <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                                    <MapPin size={10} />
                                    Levantamento: {res.pickupLocation}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                                  res.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                                  res.status === 'Ativa' ? 'bg-blue-100 text-blue-700' :
                                  res.status === 'Rejeitada' ? 'bg-rose-100 text-rose-700' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  {res.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                {isAdmin && res.status === 'Pendente' && (
                                  <>
                                    <button 
                                      onClick={() => setAcceptingResId(res.id)}
                                      className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                      title="Aceitar"
                                    >
                                      <ThumbsUp size={16} />
                                    </button>
                                    <button 
                                      onClick={() => setRejectingResId(res.id)}
                                      className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                                      title="Rejeitar"
                                    >
                                      <ThumbsDown size={16} />
                                    </button>
                                  </>
                                )}
                                {isAdmin && res.status === 'Ativa' && (
                                  <button 
                                    onClick={() => handleReturn(res.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-bold"
                                  >
                                    <RotateCcw size={14} />
                                    Devolver
                                  </button>
                                )}
                                <button 
                                  className={`p-2 rounded-lg transition-colors ${expandedResId === res.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                  onClick={() => setExpandedResId(expandedResId === res.id ? null : res.id)}
                                >
                                  <Info size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Details Row */}
                          <AnimatePresence>
                            {expandedResId === res.id && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-50/50"
                              >
                                <td colSpan={9} className="px-6 py-6">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informação do Requisitante</h4>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <User size={16} />
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-800">{res.remetidaPor}</p>
                                            <p className="text-xs text-slate-500">{res.email}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Users size={16} />
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-800">{res.equipa}</p>
                                            <p className="text-xs text-slate-500">Equipa / Projeto</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhes da Utilização</h4>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <MapPin size={16} />
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-800">{res.espacoTrabalho}</p>
                                            <p className="text-xs text-slate-500">Espaço de Trabalho</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Clock size={16} />
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-800">{res.horarioUtilizacao}</p>
                                            <p className="text-xs text-slate-500">Horário Previsto</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estado e Logística</h4>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-sm text-slate-600">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Laptop size={16} />
                                          </div>
                                          <div>
                                            <p className="font-bold text-slate-800">{res.numComputadores} Computadores</p>
                                            <p className="text-xs text-slate-500">Quantidade Solicitada</p>
                                          </div>
                                        </div>
                                        {res.pickupLocation && (
                                          <div className="flex items-center gap-3 text-sm text-slate-600">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                              <MapPin size={16} />
                                            </div>
                                            <div>
                                              <p className="font-bold text-emerald-700">{res.pickupLocation}</p>
                                              <p className="text-xs text-slate-500">Local de Levantamento</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Audit Trail */}
                                  {(res.processedBy || res.rejectionReason || res.returnedBy) && (
                                    <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {res.processedBy && (
                                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                          <ShieldCheck size={18} className="text-blue-500" />
                                          <div>
                                            <p className="text-xs font-bold text-slate-700">
                                              {res.status === 'Rejeitada' ? 'Rejeitado por:' : 'Aprovado por:'}
                                            </p>
                                            <p className="text-sm text-slate-600">{res.processedBy}</p>
                                          </div>
                                        </div>
                                      )}
                                      {res.rejectionReason && (
                                        <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                                          <AlertCircle size={18} className="text-rose-500" />
                                          <div>
                                            <p className="text-xs font-bold text-rose-700">Motivo da Rejeição:</p>
                                            <p className="text-sm text-rose-600">{res.rejectionReason}</p>
                                          </div>
                                        </div>
                                      )}
                                      {res.returnedBy && (
                                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                          <RotateCcw size={18} className="text-emerald-600" />
                                          <div>
                                            <p className="text-xs font-bold text-emerald-700">Devolução Processada por:</p>
                                            <p className="text-sm text-emerald-600">{res.returnedBy} em {res.returnedAt}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}
        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={20} />
                Segurança e Acesso
              </h3>
              <div className="space-y-4">
                {isAdmin && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                    <h4 className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2">
                      <Database size={16} />
                      Base de Dados (Firebase)
                    </h4>
                    <p className="text-xs text-amber-600 mb-3">
                      Se o inventário estiver vazio, pode inicializá-lo com os dados padrão.
                    </p>
                    <button 
                      onClick={seedDatabase}
                      disabled={isSeeding || computers.length > 0}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                        computers.length > 0 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-amber-600 text-white hover:bg-amber-700'
                      }`}
                    >
                      <Database size={14} />
                      {isSeeding ? 'A inicializar...' : computers.length > 0 ? 'Inventário já Inicializado' : 'Inicializar Inventário'}
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-700">Modo Administrador</p>
                    <p className="text-xs text-slate-500">Permite a devolução de equipamentos e gestão avançada.</p>
                  </div>
                  {showAdminToggle ? (
                    <button 
                      onClick={() => setIsAdmin(!isAdmin)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isAdmin ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {isAdmin ? 'Ativado' : 'Desativado'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                    >
                      Autenticar
                    </button>
                  )}
                </div>
                
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm font-bold text-blue-800 mb-1">Dica de Acesso</p>
                  <p className="text-xs text-blue-600">
                    Para ativar o menu de administrador, clique 5 vezes no logótipo "Pólo Sever" na barra lateral.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History className="text-blue-600" size={20} />
                Histórico de Devoluções
              </h3>
              <div className="space-y-4">
                {reservations.filter(r => r.status === 'Concluída').length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4 italic">Nenhuma devolução registada.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="pb-2">Equipa / PCs</th>
                          <th className="pb-2">Devolvido por</th>
                          <th className="pb-2 text-right">Data/Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {reservations
                          .filter(r => r.status === 'Concluída')
                          .sort((a, b) => new Date(b.returnedAt || '').getTime() - new Date(a.returnedAt || '').getTime())
                          .map(res => (
                            <tr key={res.id} className="group">
                              <td className="py-3">
                                <div className="font-bold text-slate-700">{res.equipa}</div>
                                <div className="text-[10px] text-slate-400">{res.numComputadores} computadores</div>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <ShieldCheck size={14} className="text-emerald-500" />
                                  {res.returnedBy}
                                </div>
                              </td>
                              <td className="py-3 text-right">
                                <div className="text-slate-500 text-xs">{res.returnedAt}</div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Laptop className="text-blue-600" size={20} />
                Sobre o Sistema
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span>Versão</span>
                  <span className="font-mono font-bold">v1.2.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span>Localização</span>
                  <span className="font-bold">Pólo Sever do Vouga</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-50">
                  <span>Total de Equipamentos</span>
                  <span className="font-bold">{stats.total}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border min-w-[300px] ${
                notification.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : notification.type === 'warning'
                  ? 'bg-rose-50 border-rose-100 text-rose-800'
                  : 'bg-blue-50 border-blue-100 text-blue-800'
              }`}
            >
              <div className={`p-2 rounded-xl ${
                notification.type === 'success' ? 'bg-emerald-500 text-white' : 
                notification.type === 'warning' ? 'bg-rose-500 text-white' : 
                'bg-blue-500 text-white'
              }`}>
                {notification.type === 'success' ? <CheckCircle2 size={18} /> : 
                 notification.type === 'warning' ? <AlertCircle size={18} /> : 
                 <Bell size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold">
                  {notification.type === 'success' ? 'Sucesso' : 
                   notification.type === 'warning' ? 'Aviso' : 
                   'Informação'}
                </p>
                <p className="text-xs opacity-90">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="ml-auto text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {isQrScannerOpen && (
          <QrScanner 
            onScan={handleQrScan} 
            onClose={() => setIsQrScannerOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Reject Reservation Modal */}
      <AnimatePresence>
        {rejectingResId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectingResId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-2">Rejeitar Requisição</h3>
              <p className="text-sm text-slate-500 mb-6">Indique o motivo da rejeição para informar o utilizador.</p>
              
              <form onSubmit={handleReject} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Motivo da Rejeição</label>
                  <textarea 
                    autoFocus
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px] resize-none"
                    placeholder="Ex: Equipamento indisponível, dados incompletos..."
                    value={rejectionReasonInput}
                    onChange={e => setRejectionReasonInput(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setRejectingResId(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
                  >
                    Confirmar Rejeição
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accept Reservation Modal */}
      <AnimatePresence>
        {acceptingResId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAcceptingResId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-bold text-slate-800 mb-2">Aprovar Requisição</h3>
              <p className="text-sm text-slate-500 mb-6">Indique onde os computadores deverão ser levantados.</p>
              
              <form onSubmit={handleAccept} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Local de Levantamento</label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ex: Secretaria, Sala de Professores..."
                    value={pickupLocationInput}
                    onChange={e => setPickupLocationInput(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setAcceptingResId(null)}
                    className="flex-1 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                  >
                    Aprovar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-800">Nova Requisição</h3>
                  <button 
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                    title="Digitalizar QR Code"
                  >
                    <QrCode size={20} />
                  </button>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleReserve} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="bg-blue-50 p-4 rounded-2xl mb-4">
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Disponibilidade Atual</p>
                  <p className="font-bold text-slate-800">{stats.available} computadores livres</p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Remetida por</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Seu nome completo"
                    value={formData.remetidaPor}
                    onChange={e => setFormData({...formData, remetidaPor: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input 
                    required
                    type="email" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Necessária para</label>
                    <input 
                      required
                      type="date" 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={formData.dataNecessaria}
                      onChange={e => setFormData({...formData, dataNecessaria: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Nº de Computadores</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:outline-none transition-all ${
                        formData.numComputadores > stats.available 
                        ? 'border-rose-300 bg-rose-50 focus:ring-rose-500 text-rose-900' 
                        : 'border-slate-200 focus:ring-blue-500'
                      }`}
                      value={formData.numComputadores}
                      onChange={e => setFormData({...formData, numComputadores: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {formData.numComputadores > stats.available && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm font-bold text-rose-800">Stock Insuficiente</p>
                          <p className="text-xs text-rose-600">
                            Solicitou {formData.numComputadores} computadores, mas apenas temos {stats.available} disponíveis.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Espaço de trabalho</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ex: Sala 12 ou Auditório"
                    value={formData.espacoTrabalho}
                    onChange={e => setFormData({...formData, espacoTrabalho: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Equipa</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Nome da equipa ou projeto"
                    value={formData.equipa}
                    onChange={e => setFormData({...formData, equipa: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Horário de utilização</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ex: das 09:00 as 15:00"
                    value={formData.horarioUtilizacao}
                    onChange={e => setFormData({...formData, horarioUtilizacao: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={formData.numComputadores > stats.available || formData.numComputadores <= 0}
                  className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg mt-4 ${
                    formData.numComputadores > stats.available || formData.numComputadores <= 0
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

function StatCard({ icon, label, value, color, active = false }: { icon: React.ReactNode, label: string, value: number, color: string, active?: boolean }) {
  const colors: Record<string, string> = {
    blue: active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-100 text-slate-800',
    emerald: active ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-emerald-50 border-emerald-100 text-slate-800',
    amber: active ? 'bg-amber-600 border-amber-600 text-white' : 'bg-amber-50 border-amber-100 text-slate-800',
    rose: active ? 'bg-rose-600 border-rose-600 text-white' : 'bg-rose-50 border-rose-100 text-slate-800',
  };

  return (
    <motion.div 
      layout
      className={`p-4 rounded-2xl border transition-all ${colors[color]} flex items-center gap-4 shadow-sm hover:shadow-md relative overflow-hidden`}
    >
      <div className={`p-3 rounded-xl shadow-sm z-10 ${active ? 'bg-white/20 text-white' : 'bg-white'}`}>
        {icon}
      </div>
      <div className="z-10">
        <p className={`text-xs font-medium uppercase tracking-wider ${active ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
        <AnimatePresence mode="wait">
          <motion.p 
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-2xl font-bold"
          >
            {value}
          </motion.p>
        </AnimatePresence>
      </div>
      
      {/* Pulse effect on value change */}
      <motion.div
        key={`pulse-${value}`}
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.6 }}
        className={`absolute inset-0 pointer-events-none rounded-full ${
          active ? 'bg-white/20' : 
          color === 'blue' ? 'bg-blue-400/20' : 
          color === 'emerald' ? 'bg-emerald-400/20' : 
          color === 'amber' ? 'bg-amber-400/20' : 
          'bg-rose-400/20'
        }`}
      />
    </motion.div>
  );
}
