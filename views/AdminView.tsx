import React, { useState, useEffect, useMemo } from 'react';
import { 
    Shield, Users, Trash2, Edit, Search, CheckCircle, Database, X, 
    Plus, Minus, Save, LayoutTemplate, Briefcase, ChevronDown, Check, 
    Loader2, TrendingUp, Zap, BarChart3, PieChart as PieChartIcon, 
    Activity, Clock, AlertCircle, ArrowUpRight, MessageSquare, Lock,
    CheckSquare, Square, Clipboard, Terminal, Mail
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, PieChart, Pie, Legend 
} from 'recharts';
import { PlanType, PlanPermissions, EquipmentType } from '../types';
import { supabase } from '../services/supabaseClient';

interface AdminViewProps {
  currentUser: { email: string, id: string, isAdmin: boolean } | null;
  onUpdateCurrentCredits: (amount: number) => void;
  onUpdateUserPlan: (plan: PlanType) => void;
  permissions: PlanPermissions;
  onUpdatePermissions: (perms: PlanPermissions) => void;
}

interface Profile {
    id: string;
    full_name: string | null;
    email: string | null; // Adicionado
    bio: string | null;
    credits: number;
    plan: PlanType;
    updated_at: string;
    created_at?: string;
    is_admin: boolean;
    simulations_count?: number;
    project_count?: number;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
    currentUser, 
    onUpdateCurrentCredits, 
    onUpdateUserPlan,
    permissions,
    onUpdatePermissions
}) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'insights' | 'users' | 'plans'>('insights');
  
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const SQL_FIX = `-- CORREÇÃO DE RECURSÃO INFINITA (RLS)
-- Execute este comando no SQL Editor do Supabase:

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
  SELECT is_admin FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (is_admin());`;

  const parseError = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    if (err.error_description) return err.error_description;
    try {
        return JSON.stringify(err);
    } catch (e) {
        return "Erro desconhecido na comunicação com o banco.";
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setAccessError(null);
    try {
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (profError) {
          if (profError.code === '42501') {
              throw new Error("Acesso negado (DB level). Sua conta não possui permissão de administrador na tabela 'profiles' do banco de dados.");
          }
          if (profError.message && profError.message.includes('recursion')) {
              throw new Error("Erro Crítico de RLS: Recursão infinita detectada nas políticas do banco de dados.");
          }
          throw profError;
      }

      const { data: projects } = await supabase.from('projects').select('user_id');
      const projectMap: Record<string, number> = {};
      projects?.forEach(p => {
          projectMap[p.user_id] = (projectMap[p.user_id] || 0) + 1;
      });

      const enrichedUsers = (profiles as Profile[])?.map(u => ({
          ...u,
          project_count: projectMap[u.id] || 0
      })) || [];

      setUsers(enrichedUsers);
    } catch (err: any) {
      console.error("Admin Access Error Detail:", err);
      setAccessError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateUserProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      setIsSaving(true);
      try {
          const { error } = await supabase
              .from('profiles')
              .update({
                  full_name: editingUser.full_name,
                  email: editingUser.email,
                  bio: editingUser.bio,
                  credits: editingUser.credits,
                  plan: editingUser.plan,
                  is_admin: editingUser.is_admin
              })
              .eq('id', editingUser.id);

          if (error) throw error;
          
          if (editingUser.id === currentUser?.id) {
              onUpdateCurrentCredits(editingUser.credits);
              onUpdateUserPlan(editingUser.plan);
          }

          setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
          setEditingUser(null);
      } catch (err) {
          console.error("Update error detail:", err);
          alert(`Erro ao atualizar usuário: ${parseError(err)}`);
      } finally {
          setIsSaving(false);
      }
  };

  const togglePermission = (plan: PlanType, type: EquipmentType) => {
      const current = permissions[plan] || [];
      const updated = current.includes(type)
          ? current.filter(t => t !== type)
          : [...current, type];
      
      onUpdatePermissions({
          ...permissions,
          [plan]: updated
      });
  };

  const systemMetrics = useMemo(() => {
    if (users.length === 0) return { totalCredits: 0, avgProjects: 0, totalSims: 0, chartData: [], activityData: [] };
    
    const planDist = {
        Starter: users.filter(u => u.plan === 'Starter').length,
        Pro: users.filter(u => u.plan === 'Pro').length,
        Enterprise: users.filter(u => u.plan === 'Enterprise').length,
    };

    const chartData = [
        { name: 'Starter', value: planDist.Starter, color: '#3b82f6' },
        { name: 'Pro', value: planDist.Pro, color: '#a855f7' },
        { name: 'Enterprise', value: planDist.Enterprise, color: '#f97316' },
    ];

    const activityData = users.slice(0, 10).map(u => ({
        name: u.full_name?.split(' ')[0] || 'User',
        sims: u.simulations_count || 0,
        projects: u.project_count || 0
    }));

    return { 
        totalCredits: users.reduce((acc, u) => acc + (u.credits || 0), 0),
        avgProjects: users.reduce((acc, u) => acc + (u.project_count || 0), 0) / Math.max(1, users.length),
        totalSims: users.reduce((acc, u) => acc + (u.simulations_count || 0), 0),
        chartData, 
        activityData 
    };
  }, [users]);

  const copySqlFix = () => {
    navigator.clipboard.writeText(SQL_FIX);
    alert("Código SQL copiado!");
  };

  if (accessError) {
      return (
          <div className="h-full overflow-y-auto p-8 bg-slate-50 animate-in zoom-in-95 duration-300">
              <div className="max-w-4xl mx-auto space-y-8">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 border border-red-100 shadow-sm">
                          <Lock className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Falha Crítica no Banco de Dados</h2>
                      <p className="text-slate-500 max-w-lg">O front-end reconhece sua conta como Administradora, mas as políticas do Supabase (RLS) estão impedindo a leitura global.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm flex flex-col">
                          <div className="flex items-center space-x-2 text-red-600 mb-4">
                              <AlertCircle className="w-5 h-5" />
                              <h3 className="font-bold text-sm uppercase tracking-widest">Erro Detectado</h3>
                          </div>
                          <p className="text-sm text-slate-600 font-mono leading-relaxed bg-red-50 p-4 rounded-lg border border-red-100 flex-1">{accessError}</p>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col">
                          <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2 text-emerald-400">
                                  <Terminal className="w-5 h-5" />
                                  <h3 className="font-bold text-sm uppercase tracking-widest">Solução (SQL Fix)</h3>
                              </div>
                              <button onClick={copySqlFix} className="p-2 text-slate-400 hover:text-emerald-400 transition-colors bg-white/5 rounded-lg"><Clipboard className="w-4 h-4" /></button>
                          </div>
                          <pre className="text-[10px] text-emerald-300/80 font-mono leading-relaxed bg-black/40 p-4 rounded-lg border border-white/5 overflow-x-auto flex-1 select-all">{SQL_FIX}</pre>
                      </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                      <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">Atualizar Página</button>
                  </div>
              </div>
          </div>
      );
  }

  const filteredUsers = users.filter(user => 
    (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 pb-12 animate-in fade-in duration-500 bg-slate-50">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-red-600 mb-1">
             <Shield className="w-5 h-5" />
             <span className="text-xs font-black uppercase tracking-widest">Acesso Administrativo</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence Panel</h1>
          <p className="text-slate-500 mt-1">Monitoramento de tráfego e gestão de usuários cloud.</p>
        </div>
        <div className="flex items-center space-x-3">
             <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center shadow-sm">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                 <span className="text-xs font-bold text-emerald-700 uppercase">Live DB Connected</span>
             </div>
        </div>
      </header>

      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200 w-fit">
        {[
            { id: 'insights', label: 'Insights', icon: BarChart3 },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'plans', label: 'Permission Matrix', icon: LayoutTemplate }
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
            </button>
        ))}
      </div>

      {activeTab === 'insights' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Simulações</p>
                    <p className="text-4xl font-black text-slate-900 leading-none">{systemMetrics.totalSims.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Usuários</p>
                    <p className="text-4xl font-black text-slate-900 leading-none">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Créditos em Circulação</p>
                    <p className="text-4xl font-black text-blue-600 leading-none">{systemMetrics.totalCredits.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Média Projetos/User</p>
                    <p className="text-4xl font-black text-purple-600 leading-none">{systemMetrics.avgProjects.toFixed(1)}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center"><PieChartIcon className="w-4 h-4 mr-2 text-orange-500" /> Distribuição de Planos</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={systemMetrics.chartData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                    {systemMetrics.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[400px]">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center"><TrendingUp className="w-4 h-4 mr-2 text-blue-500" /> Atividade por Top Usuários</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={systemMetrics.activityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                <Tooltip cursor={{fill: '#f8fafc'}} />
                                <Bar dataKey="sims" name="Simulações" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="projects" name="Projetos" fill="#a855f7" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-900 text-white rounded-lg"><Users className="w-5 h-5" /></div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Gerenciamento de Usuários</h2>
                        <p className="text-xs text-slate-500">Edite perfis, créditos e níveis de acesso.</p>
                    </div>
                </div>
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                        type="text" 
                        placeholder="Pesquisar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 bg-white shadow-inner"
                    />
                </div>
            </div>
            <div className="overflow-x-auto min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                        <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
                        <p className="font-bold uppercase tracking-widest text-xs">Sincronizando...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário / Email</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Plano</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Créditos</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Acesso</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">{(user.full_name || 'U').charAt(0)}</div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 flex items-center">
                                                    {user.full_name || 'Sem Nome'}
                                                    {user.is_admin && <Shield className="w-3 h-3 ml-1 text-red-500" />}
                                                </div>
                                                <div className="text-[10px] text-slate-500 flex items-center font-medium"><Mail className="w-2.5 h-2.5 mr-1" /> {user.email || 'Não informado'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                                            user.plan === 'Enterprise' ? 'bg-orange-600 text-white' : 
                                            user.plan === 'Pro' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {user.plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                            <Database className="w-3 h-3 text-blue-600" />
                                            <span className="text-xs font-black text-blue-700">{user.credits}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-[10px] font-bold uppercase text-slate-500">{user.is_admin ? 'Admin' : 'Usuário'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      )}

      {activeTab === 'plans' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30">
                  <h2 className="text-lg font-bold text-slate-800">Permission Matrix</h2>
                  <p className="text-xs text-slate-500">Defina o que cada plano pode acessar no sistema.</p>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <tr>
                              <th className="px-6 py-4">Módulo / Equipamento</th>
                              <th className="px-6 py-4 text-center">Starter</th>
                              <th className="px-6 py-4 text-center">Pro</th>
                              <th className="px-6 py-4 text-center">Enterprise</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {Object.values(EquipmentType)
                            .filter(type => !type.toString().startsWith('SET_'))
                            .map(type => (
                              <tr key={type} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{type}</td>
                                  {(['Starter', 'Pro', 'Enterprise'] as PlanType[]).map(plan => {
                                      const isAllowed = permissions[plan]?.includes(type);
                                      return (
                                          <td key={plan} className="px-6 py-4 text-center">
                                              <button 
                                                onClick={() => togglePermission(plan, type)}
                                                className={`p-2 rounded-lg transition-colors ${isAllowed ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:bg-slate-50'}`}
                                              >
                                                  {isAllowed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                              </button>
                                          </td>
                                      );
                                  })}
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <form onSubmit={handleUpdateUserProfile}>
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-slate-900 text-white rounded-lg"><Edit className="w-5 h-5" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Editar Perfil de Usuário</h3>
                                <p className="text-xs text-slate-500 font-mono">{editingUser.id}</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nome Completo</label>
                                <input type="text" value={editingUser.full_name || ''} onChange={e => setEditingUser({...editingUser, full_name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Email Principal</label>
                                <input type="email" value={editingUser.email || ''} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Créditos</label>
                                <div className="relative">
                                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="number" value={editingUser.credits} onChange={e => setEditingUser({...editingUser, credits: parseInt(e.target.value) || 0})} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Plano Ativo</label>
                                <select value={editingUser.plan} onChange={e => setEditingUser({...editingUser, plan: e.target.value as PlanType})} className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                    <option value="Starter">Starter</option>
                                    <option value="Pro">Pro</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <div onClick={() => setEditingUser({...editingUser, is_admin: !editingUser.is_admin})} className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${editingUser.is_admin ? 'bg-red-500 border-red-600 text-white' : 'border-slate-300 text-transparent'}`}>
                                    <Check className="w-4 h-4 stroke-[4px]" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Privilégios de Administrador</span>
                            </label>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                        <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-8 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center shadow-md">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Alterações
                        </button>
                    </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};