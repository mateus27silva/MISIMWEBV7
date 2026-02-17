
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Trash2, 
  Shield, 
  AlertTriangle,
  Fingerprint,
  Check,
  Camera,
  Briefcase
} from 'lucide-react';

interface ProfileViewProps {
  user: {
    name: string;
    email: string;
    isAdmin: boolean;
    credits: number;
    avatarUrl?: string;
    subtitle?: string;
  };
  onUpdateUser: (updates: any) => void;
  onDeleteAccount: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, onDeleteAccount }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    subtitle: user.subtitle || '',
    password: '',
    confirmPassword: ''
  });
  
  // Mock ID generation based on email to simulate a database ID
  const [accountId, setAccountId] = useState('000000');

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Generate a consistent pseudo-ID based on email for display purposes
    let hash = 0;
    for (let i = 0; i < user.email.length; i++) {
        hash = user.email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const id = Math.abs(hash).toString().padStart(8, '0').substring(0, 8);
    setAccountId(id);
  }, [user.email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!formData.name.trim() || !formData.email.trim()) {
      setMessage({ type: 'error', text: 'Nome e Email são obrigatórios.' });
      return;
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'As senhas não coincidem.' });
        return;
      }
      if (formData.password.length < 6) {
        setMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
        return;
      }
    }

    // Prepare updates
    const updates: any = {
      name: formData.name,
      email: formData.email,
      avatarUrl: formData.avatarUrl,
      subtitle: formData.subtitle
    };

    // In a real app, we would handle password hashing here
    if (formData.password) {
      updates.password = formData.password; 
    }

    onUpdateUser(updates);
    setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    
    // Clear password fields after save
    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center">
          <User className="w-8 h-8 mr-3 text-blue-600" />
          Configurações de Perfil
        </h1>
        <p className="text-slate-500 mt-2">Gerencie suas informações pessoais, credenciais de acesso e segurança da conta.</p>
      </header>

      {message && (
        <div className={`p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <Check className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-6">
              
              {/* Profile Image Section */}
              <div className="flex items-center space-x-6 border-b border-slate-100 pb-6">
                  <div className="relative group">
                      <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden border-2 border-slate-100 shadow-inner flex items-center justify-center text-slate-400">
                          {formData.avatarUrl ? (
                              <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              <User className="w-10 h-10" />
                          )}
                      </div>
                  </div>
                  <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">URL da Imagem de Perfil</label>
                      <div className="relative">
                          <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input 
                              type="text" 
                              name="avatarUrl"
                              value={formData.avatarUrl}
                              onChange={handleChange}
                              placeholder="https://exemplo.com/minha-foto.jpg"
                              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                          />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Cole um link direto para sua imagem.</p>
                  </div>
              </div>

              {/* Account ID (Read Only) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                  <Fingerprint className="w-4 h-4 mr-1.5" /> ID da Conta
                </label>
                <div className="flex items-center">
                  <input 
                    type="text" 
                    value={accountId} 
                    disabled 
                    className="w-full bg-slate-100 text-slate-500 font-mono font-bold px-4 py-2 border border-slate-200 rounded-lg cursor-not-allowed select-all"
                  />
                  <span className="ml-3 text-xs text-slate-400">Não editável</span>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text"
                      name="name" 
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email / Login</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                
                {/* Subtitle / Bio Field */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título Profissional (Bio)</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text"
                            name="subtitle" 
                            value={formData.subtitle}
                            onChange={handleChange}
                            placeholder="Ex: Engenheiro de Processos Sênior | Especialista em Flotação"
                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>
              </div>

              <div className="border-t border-slate-100 my-4 pt-4">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-slate-500" /> Alterar Senha
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input 
                        type="password" 
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">Deixe em branco se não quiser alterar a senha.</p>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" /> Salvar Alterações
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
            <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> Zona de Perigo
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              A exclusão da conta é uma ação irreversível. Todos os seus dados, projetos salvos e créditos serão perdidos permanentemente.
            </p>
            
            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-3 bg-red-50 text-red-600 font-bold rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir Minha Conta
              </button>
            ) : (
              <div className="space-y-3 animate-in fade-in zoom-in-95">
                <p className="text-sm font-bold text-red-700 text-center">Tem certeza absoluta?</p>
                <button 
                  onClick={onDeleteAccount}
                  className="w-full px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md"
                >
                  Sim, Excluir Definitivamente
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full px-4 py-2 bg-white text-slate-600 font-medium rounded-lg border border-slate-300 hover:bg-slate-50"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
             <h3 className="font-bold text-lg mb-2">Plano Atual</h3>
             <p className="text-slate-300 text-sm mb-4">Você está utilizando a versão padrão do MISIMWEB.</p>
             <div className="flex justify-between items-center text-sm font-mono bg-slate-800/50 p-3 rounded border border-slate-700">
                <span className="text-slate-400">Créditos:</span>
                <span className="text-orange-400 font-bold">{user.credits}</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
