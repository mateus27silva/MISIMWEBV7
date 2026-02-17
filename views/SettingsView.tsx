import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  CreditCard, 
  Settings, 
  CheckCircle, 
  QrCode, 
  FileText, 
  ShieldCheck, 
  Landmark, 
  Smartphone,
  Copy,
  Download,
  ExternalLink,
  Zap,
  ShoppingBag,
  ChevronDown,
  AlertCircle,
  Clock,
  Gift,
  CheckCircle2,
  X,
  Coins,
  Database,
  PlusSquare
} from 'lucide-react';
import { EquipmentType, UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';
import { createCheckoutSession, syncCreditsAfterPayment } from '../services/stripeService';

interface SettingsViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    credits: number;
    plan: string;
  };
  onNavigate?: (view: EquipmentType) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onNavigate }) => {
  const [language, setLanguage] = useState('pt-BR');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pix' | 'boleto'>('stripe');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancel' | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const creditPackages = [
    { id: 'pack_100', label: 'Starter Pack', credits: 100, price: 'R$ 49,90', icon: Zap, color: 'text-blue-500' },
    { id: 'pack_500', label: 'Pro Pack', credits: 500, price: 'R$ 199,00', icon: Coins, color: 'text-orange-500', popular: true },
    { id: 'pack_1000', label: 'Enterprise Pack', credits: 1000, price: 'R$ 349,00', icon: ShieldCheck, color: 'text-emerald-500' },
    { id: 'pack_100_extra', label: 'Créditos Avulsos', credits: 100, price: 'R$ 49,90', icon: PlusSquare, color: 'text-rose-500', isExtra: true },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    };
    fetchProfile();

    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentStatus('success');
      // Força um refresh dos créditos no app
      syncCreditsAfterPayment(user.id);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user.id]);

  const handlePurchase = async (packageId: string) => {
    if (!agreedToTerms) {
      alert("Aceite os termos para prosseguir.");
      return;
    }
    setLoadingPayment(true);
    await createCheckoutSession(user.id, packageId);
    setLoadingPayment(false);
  };

  const trialDays = profile?.trial_end_date 
    ? Math.max(0, Math.ceil((new Date(profile.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {paymentStatus === 'success' && (
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-100/50 animate-bounce-short">
              <div className="p-3 bg-emerald-500 rounded-full text-white">
                  <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-900 uppercase">Pagamento Confirmado!</h3>
                  <p className="text-emerald-700 font-medium">O Stripe validou sua transação e seus créditos foram injetados no Supabase.</p>
              </div>
              <button onClick={() => setPaymentStatus(null)} className="p-2 text-emerald-400 hover:text-emerald-600"><X size={20} /></button>
          </div>
      )}

      <header className="border-b border-slate-200 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight uppercase">
            <Settings className="w-8 h-8 mr-3 text-slate-700" />
            Faturamento
          </h1>
          <p className="text-slate-500 mt-1">Gestão de créditos e gateway de pagamento cloud.</p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 flex items-center">
            <Database className="w-4 h-4 text-orange-600 mr-2" />
            <span className="text-sm font-black text-slate-700">{user.credits.toLocaleString()} CRÉDITOS</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-20"></div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Plano Atual</h3>
            <div className="text-2xl font-black mb-1">{user.plan}</div>
            <p className="text-slate-400 text-xs mb-6">Usuário validado via Supabase Auth</p>
            
            {profile?.is_trial_active && trialDays > 0 && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 mb-6">
                    <Gift className="w-5 h-5 text-orange-400" />
                    <div>
                        <p className="text-[10px] font-black uppercase text-orange-400">Trial Ativo</p>
                        <p className="text-xs font-bold">{trialDays} dias restantes</p>
                    </div>
                </div>
            )}

            <div className="space-y-3">
               <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase"><CheckCircle className="w-3 h-3 mr-2 text-emerald-500" /> Cloud Sync Ativo</div>
               <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase"><CheckCircle className="w-3 h-3 mr-2 text-emerald-500" /> Webhook Validado</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4 flex items-center">
                <Globe className="w-4 h-4 mr-2" /> Regional
             </h3>
             <select 
               value={language}
               onChange={(e) => setLanguage(e.target.value)}
               className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
             >
               <option value="pt-BR">Português (BR)</option>
               <option value="en-US">English (US)</option>
             </select>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Seleção de Pacote</h3>
                 <p className="text-sm text-slate-500 mt-1">Os créditos são atômicos e nunca expiram.</p>
              </div>

              <div className="p-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                 {creditPackages.map((pkg) => (
                    <button 
                       key={pkg.id}
                       onClick={() => handlePurchase(pkg.id)}
                       disabled={loadingPayment}
                       className={`relative p-5 rounded-2xl border-2 transition-all text-left flex flex-col group ${pkg.popular ? 'border-blue-600 bg-blue-50/30' : (pkg.isExtra ? 'border-rose-100 bg-rose-50/20 hover:border-rose-300' : 'border-slate-100 hover:border-slate-300 bg-white')}`}
                    >
                       {pkg.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Mais Popular</span>}
                       {pkg.isExtra && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Add-on</span>}
                       <pkg.icon className={`w-8 h-8 mb-4 ${pkg.color}`} />
                       <div className="font-black text-slate-900 text-[11px] uppercase mb-1">{pkg.label}</div>
                       <div className="text-xl font-black text-slate-900 mb-4">{pkg.credits} <span className="text-xs text-slate-400 font-normal">pts</span></div>
                       <div className={`mt-auto text-xs font-bold ${pkg.isExtra ? 'text-rose-600' : 'text-blue-600'} group-hover:translate-x-1 transition-transform flex items-center`}>
                          {pkg.price} <ArrowRight className="w-3 h-3 ml-2" />
                       </div>
                    </button>
                 ))}
              </div>

              <div className="px-8 pb-8 flex flex-col items-center">
                  <div className="w-full max-w-md bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex items-start gap-3">
                      <input 
                         type="checkbox" 
                         checked={agreedToTerms} 
                         onChange={(e) => setAgreedToTerms(e.target.checked)}
                         className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600"
                      />
                      <p className="text-[11px] text-slate-500 leading-tight">
                         Concordo que o faturamento é processado pela Stripe. Ao clicar em comprar, você será redirecionado para o ambiente seguro de pagamento.
                      </p>
                  </div>
                  
                  <div className="flex gap-8 opacity-40 grayscale">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
                      <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                          <ShieldCheck className="w-4 h-4" /> PCI COMPLIANT
                      </div>
                  </div>
              </div>
           </div>

           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Histórico de Recargas</h3>
                 <button className="text-[10px] font-black text-blue-600 uppercase border border-blue-100 px-3 py-1 rounded-lg">Ver Detalhes</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                         <th className="px-6 py-4">Data</th>
                         <th className="px-6 py-4">ID Transação</th>
                         <th className="px-6 py-4 text-right">Valor</th>
                         <th className="px-6 py-4 text-center">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      <tr className="hover:bg-slate-50/30 transition-colors">
                         <td className="px-6 py-4 text-slate-500 font-medium">20 Out, 2024</td>
                         <td className="px-6 py-4 font-mono text-[10px] text-slate-400">ch_3Q1...8w2</td>
                         <td className="px-6 py-4 text-right font-black text-slate-700">R$ 49,90</td>
                         <td className="px-6 py-4 text-center">
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">Succeeded</span>
                         </td>
                      </tr>
                   </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <line x1="5" y1="12" x2="19" y2="12" />
       <polyline points="12 5 19 12 12 19" />
    </svg>
);