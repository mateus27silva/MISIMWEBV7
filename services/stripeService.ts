import { supabase } from './supabaseClient';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SPY6iR9jvo0kTyDi1pmNAamC9ny4FyQBlIuZQFxBcP0ufXBLKwzhkRSdiqKQMydmaZ71IjW6pof8jyVzS43zokA004O0rUMa2';

/**
 * Inicializa o Stripe.
 */
export const getStripe = () => {
    if (typeof window !== 'undefined' && (window as any).Stripe) {
        return (window as any).Stripe(STRIPE_PUBLISHABLE_KEY);
    }
    return null;
};

/**
 * Cria uma sessão de checkout no Stripe.
 * @param userId ID do usuário no Supabase
 * @param packageId Identificador do pacote (ex: 'pack_100', 'pack_500')
 */
export const createCheckoutSession = async (userId: string, packageId: string) => {
    try {
        console.log(`Iniciando Checkout: Usuário ${userId}, Pacote ${packageId}`);
        
        // Chamada para a Edge Function de Checkout do Supabase
        const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
            body: { 
                userId, 
                packageId,
                successUrl: `${window.location.origin}/settings?payment=success`,
                cancelUrl: `${window.location.origin}/settings`
            }
        });

        // Se a Edge Function não estiver implantada, usamos o Link de Pagamento Direto como Fallback
        if (error || !data?.url) {
            console.warn("Edge Function 'create-stripe-checkout' não encontrada ou erro na execução. Usando Fallback...");
            
            // Mapeamento de links de fallback para os pacotes definidos no SettingsView
            const fallbackLinks: Record<string, string> = {
                'pack_100': 'https://buy.stripe.com/test_bJe7sNcovekq6Kxe8jeQM04',
                'pack_100_extra': 'https://buy.stripe.com/test_eVq9AV74b906fh39S3eQM08', 
                'pack_500': 'https://buy.stripe.com/test_cNi14p4W31xEfh35BNeQM07', 
                'pack_1000': 'https://buy.stripe.com/test_88C36repx2vC4wk286'
            };

            const baseUrl = fallbackLinks[packageId] || fallbackLinks['pack_100'];
            // O client_reference_id é o que permite ao Webhook saber QUEM pagou para adicionar os créditos
            const finalUrl = `${baseUrl}?client_reference_id=${userId}`;
            
            window.location.href = finalUrl;
            return;
        }

        // Redireciona para a URL gerada pela Edge Function (Checkout dinâmico)
        window.location.href = data.url;
    } catch (err) {
        console.error("Erro crítico ao processar checkout:", err);
        alert("Erro ao conectar com o gateway de pagamento. Verifique o console para detalhes.");
    }
};

/**
 * Verifica e sincroniza os créditos após o retorno do Stripe
 */
export const syncCreditsAfterPayment = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error("Erro na sincronização pós-pagamento:", error);
        return null;
    }
    return data.credits;
};

export const createStripeCustomerAndTrial = async (userId: string, email: string, fullName: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('manage-stripe-registration', {
            body: { userId, email, fullName, plan: 'Starter', trialDays: 30 }
        });

        if (error) {
            // Simulação local se a função de registro não existir
            const trialEnd = new Date();
            trialEnd.setDate(trialEnd.getDate() + 30);
            await supabase.from('profiles').update({
                stripe_customer_id: `cus_sim_${Math.random().toString(36).substring(7)}`,
                trial_end_date: trialEnd.toISOString(),
                is_trial_active: true,
                days_free: 30,
                credits: 100 
            }).eq('id', userId);
            return { success: true, simulated: true };
        }
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err };
    }
};

/**
 * Cria uma sessão de checkout para o Fã-clube (Doação)
 */
export const createFanClubSession = async (userId: string, amount: number, email: string) => {
    try {
        const response = await fetch('/api/create-fan-club-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount, email })
        });
        
        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Erro ao gerar sessão de checkout');
        }
    } catch (err: any) {
        console.error("Erro no Fan Club checkout:", err);
        alert(`Erro: ${err.message}`);
    }
};

/**
 * Cria uma sessão de checkout para Assinatura (Fã-clube VIP)
 */
export const createSubscriptionSession = async (userId: string, priceId: string, email: string) => {
    try {
        const response = await fetch('/api/create-subscription-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, priceId, email })
        });
        
        const data = await response.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error(data.error || 'Erro ao gerar sessão de assinatura');
        }
    } catch (err: any) {
        console.error("Erro no Subscription checkout:", err);
        alert(`Erro: ${err.message}`);
    }
};

export const openStripePortal = async (customerId: string) => {
    window.open(`https://billing.stripe.com/p/login/test_customer_${customerId}`, '_blank');
};