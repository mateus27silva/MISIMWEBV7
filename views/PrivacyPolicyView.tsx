
import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, Cloud, Database, Key, Server } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBack: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-600 rounded-full opacity-10 blur-3xl"></div>
          <button 
            onClick={onBack}
            className="flex items-center text-slate-400 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Política de Privacidade</h1>
              <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-wider">Segurança de Dados & Proteção Cloud</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 sm:p-12 space-y-12 text-slate-700 leading-relaxed text-sm sm:text-base">
          
          {/* 1. Compromisso com a Segurança */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">1. Compromisso com a Privacidade</h2>
            </div>
            <p>
              Na <strong>MISIMWEB</strong>, levamos a segurança dos seus dados de engenharia e informações pessoais a sério. Esta política descreve como coletamos, protegemos e gerenciamos suas informações ao utilizar nosso simulador cloud.
            </p>
          </section>

          {/* 2. O que é RLS e como protege seus dados? */}
          <section className="space-y-4 border-t border-slate-100 pt-8">
            <div className="flex items-center space-x-2 text-blue-600">
              <Database className="w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">2. Arquitetura de Isolamento (RLS)</h2>
            </div>
            <p>
              Diferente de sistemas convencionais, o <strong>MISIMWEB</strong> utiliza políticas de <strong>Row Level Security (RLS)</strong> nativas no banco de dados Supabase. Isso significa que a segurança não está apenas no código do aplicativo, mas diretamente nos dados.
            </p>
            <div className="bg-slate-900 rounded-2xl p-6 space-y-4 shadow-inner border border-slate-800">
                <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                        <Key className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm mb-1">Como Funciona o RLS?</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Cada linha em nosso banco de dados (seja um projeto, um componente ou um log) possui um identificador de proprietário (user_id). O banco de dados valida automaticamente se o usuário autenticado possui as chaves corretas para ler ou editar aquela linha específica.
                        </p>
                    </div>
                </div>
                <div className="flex items-start space-x-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                        <Server className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm mb-1">Proteção contra Vazamentos</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Mesmo em caso de falha no front-end, o banco de dados recusará qualquer tentativa de acesso a dados que não pertençam à sua conta. Seus fluxogramas são invisíveis para outros usuários e até mesmo para a maioria dos processos do sistema.
                        </p>
                    </div>
                </div>
            </div>
          </section>

          {/* 3. Coleta de Informações */}
          <section className="space-y-4 border-t border-slate-100 pt-8">
            <div className="flex items-center space-x-2 text-orange-600">
              <Eye className="w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">3. Dados Coletados</h2>
            </div>
            <p>Coletamos apenas as informações estritamente necessárias para o funcionamento da plataforma:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li><strong>Perfil:</strong> Nome, email e avatar (opcional) para identificação da conta.</li>
              <li><strong>Projetos:</strong> Dados técnicos de fluxogramas e parâmetros operacionais.</li>
              <li><strong>Logs:</strong> Histórico técnico de execuções para fins de suporte e faturamento de créditos.</li>
              <li><strong>Pagamentos:</strong> Não armazenamos dados de cartão de crédito. Todas as transações são processadas via <strong>Stripe</strong>.</li>
            </ul>
          </section>

          {/* 4. Uso de IA (Gemini API) */}
          <section className="space-y-4 border-t border-slate-100 pt-8">
            <div className="flex items-center space-x-2 text-purple-600">
              <Cloud className="w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">4. Processamento via IA</h2>
            </div>
            <p>
              Ao utilizar as funções de análise e otimização por IA, os dados técnicos do seu simulador são enviados de forma anônima para a <strong>Google Gemini API</strong>. O Google não utiliza esses dados de API empresarial para treinar seus modelos globais, garantindo a confidencialidade do seu segredo industrial.
            </p>
          </section>

          {/* Footer Notice */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Você tem o direito de solicitar a exclusão permanente de todos os seus dados a qualquer momento através do menu <strong>Perfil</strong>. Uma vez excluída, a conta e todos os dados associados (incluindo créditos) são removidos irreversivelmente do nosso cluster cloud.
            </p>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">MISIMWEB Cloud Engine v3.1 | Outubro 2024</p>
        </div>
      </div>
    </div>
  );
};
