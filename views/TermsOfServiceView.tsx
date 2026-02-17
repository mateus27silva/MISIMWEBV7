
import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Zap, Users, AlertTriangle, Scale, Lock } from 'lucide-react';

interface TermsOfServiceViewProps {
  onBack: () => void;
  onNavigateToPrivacy?: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onBack, onNavigateToPrivacy }) => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600 rounded-full opacity-10 blur-3xl"></div>
          <button 
            onClick={onBack}
            className="flex items-center text-slate-400 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Voltar
          </button>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Termos de Serviço</h1>
              <p className="text-slate-400 text-sm mt-1 uppercase font-bold tracking-wider">Acordo de Utilização MISIMWEB v3.1</p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 sm:p-12 space-y-12 text-slate-700 leading-relaxed text-sm sm:text-base">
          
          {/* 1. Aceitação dos Termos */}
          <section className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <Scale className="w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">1. Aceitação dos Termos</h2>
            </div>
            <p>
              Ao acessar ou utilizar a plataforma <strong>MISIMWEB</strong>, você concorda em cumprir e estar vinculado a estes Termos de Serviço. Este é um contrato legal entre você (usuário individual ou entidade corporativa) e a plataforma. Se você não concordar com qualquer parte destes termos, não deverá acessar ou utilizar nossos serviços de simulação.
            </p>
          </section>

          {/* 2. Condições de Utilização */}
          <section className="space-y-4 border-t border-slate-100 pt-8">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Users className="w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">2. Condições de Utilização</h2>
            </div>
            <p>
              Para utilizar as funcionalidades avançadas de simulação e armazenamento em nuvem, você deve:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600">
              <li>Fornecer informações precisas, completas e atualizadas em seu perfil de usuário.</li>
              <li>Manter a segurança de sua conta e senha, sendo integralmente responsável por qualquer atividade realizada nela.</li>
              <li>Utilizar a plataforma apenas para fins lícitos de engenharia, educação ou pesquisa mineral.</li>
              <li>Não tentar realizar engenharia reversa, descompilação ou ataques de negação de serviço contra os motores de cálculo da plataforma.</li>
            </ul>
          </section>

          {/* 3. Modos de Uso e Sistema de Créditos */}
          <section className="space-y-4 border-t border-slate-100 pt-8">
            <div className="flex items-center space-x-2 text-orange-600">
              <Zap className="w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">3. Modos de Uso e Créditos</h2>
            </div>
            <p>
              O <strong>MISIMWEB</strong> opera sob um modelo de consumo de créditos (Pay-per-Run). Cada simulação executada com sucesso debita uma quantidade específica de créditos de sua conta.
            </p>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-bold text-slate-800 mb-2">Uso Profissional</h4>
                    <p className="text-xs text-slate-500">Destinado a engenheiros e consultores para estimativa de balanço de massa e otimização de circuitos reais. Requer o plano <strong>Pro</strong> ou <strong>Enterprise</strong> para exportação de relatórios.</p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 mb-2">Uso Educacional</h4>
                    <p className="text-xs text-slate-500">Destinado a estudantes e pesquisadores para compreensão fenomenológica. Sujeito às limitações do plano <strong>Starter</strong>.</p>
                </div>
            </div>
          </section>

          {/* 4. Processamento de Pagamentos (Stripe) */}
          <section className="space-y-4 border-t border-slate-100 pt-8">
            <div className="flex items-center space-x-2 text-emerald-600">
              <Lock className="w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">4. Serviços de Pagamento</h2>
            </div>
            <p>
              Os serviços de processamento de pagamento para usuários em <strong>MISIMWEB</strong> são fornecidos pela <strong>Stripe</strong> e estão sujeitos ao <strong>Stripe Connected Account Agreement</strong> (Contrato de Conta Vinculada da Stripe), que inclui os Termos de Serviço da Stripe.
            </p>
            <p>
              Ao concordar com estes termos ou continuar a operar como usuário em <strong>MISIMWEB</strong>, você aceita o Contrato de Serviços da Stripe, que pode ser alterado pela Stripe periodicamente. Como condição de utilização de serviços de processamento de pagamento pela <strong>MISIMWEB</strong> por meio da Stripe, você concorda em fornecer informações precisas sobre você e autoriza a <strong>MISIMWEB</strong> a compartilhá-las, além das informações de transações relacionadas ao seu uso.
            </p>
          </section>

          {/* 5. Isenção de Responsabilidade Técnica */}
          <section className="space-y-4 border-t border-slate-100 pt-8">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-lg font-black uppercase tracking-wide">5. Isenção de Responsabilidade Técnica</h2>
            </div>
            <p className="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-900 font-medium">
              As simulações fornecidas pelo <strong>MISIMWEB</strong> são aproximações matemáticas baseadas em modelos fenomenológicos (Bond, Plitt, Austin, etc.). Os resultados devem ser utilizados apenas como ferramentas de apoio à decisão e não substituem a validação por engenheiros qualificados em campo ou testes de bancada. A plataforma não se responsabiliza por perdas operacionais, danos a equipamentos ou decisões financeiras baseadas exclusivamente nos dados gerados pelo software.
            </p>
          </section>

          {/* Footer Notice */}
          <div className="bg-slate-900 p-6 rounded-2xl flex items-start space-x-4">
            <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Respeitamos sua privacidade. Seus dados de simulação e fluxogramas são protegidos por criptografia em repouso no nosso banco de dados. Para mais informações, consulte nossa <button onClick={onNavigateToPrivacy} className="text-blue-400 font-bold hover:underline">Política de Privacidade</button>.
            </p>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Última atualização: 24 de Outubro de 2024</p>
        </div>
      </div>
    </div>
  );
};
