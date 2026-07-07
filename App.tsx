
import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ProjectTabBar } from './components/ProjectTabBar'; 
import { EquipmentType, NodeData, Connection, Component, LogEntry, LogType, PlanType, PlanPermissions, Notification, NotificationType, RecoveryModel, UnitConfig, DEFAULT_UNITS } from './types';
import { DashboardView } from './views/DashboardView';
import { CommunityView } from './views/CommunityView';
import { AuthView } from './views/AuthView';
import { AdminView } from './views/AdminView';
import { LandingPage } from './views/LandingPage';
import { ProjectView } from './views/ProjectView';
import { ResultsView } from './views/ResultsView';
import { HelpView } from './views/HelpView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView'; 
import { OptimizationView } from './views/OptimizationView'; 
import { KineticsView } from './views/KineticsView';
import { UnitsView } from './views/UnitsView';
import { ComponentsView } from './views/ComponentsView';
import { ParametersView } from './views/ParametersView';
import { EconomicsView } from './views/EconomicsView';
import { ChartsView } from './views/ChartsView';
import { TermsOfServiceView } from './views/TermsOfServiceView';
import { PrivacyPolicyView } from './views/PrivacyPolicyView';
import { Construction, Cloud, CloudOff } from 'lucide-react';
import { SimulationResult } from './services/flowsheetSolver';
import { COMPONENT_DB, STANDARD_MODELS } from './services/miningMath';
import { supabase } from './services/supabaseClient';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  credits: number;
  plan: PlanType; 
  avatarUrl?: string;
  subtitle?: string;
  registeredAt?: string;
  stats: {
      simulations: number;
  };
}

interface ProjectSession {
    id: string;
    supabase_id?: string;
    name: string;
    nodes: NodeData[];
    connections: Connection[];
    minerals: Component[]; 
    customModels: RecoveryModel[];
    logs: LogEntry[];
    simulationResult: SimulationResult | null;
    lastModified: number;
    optimizationReady: boolean;
    units: UnitConfig;
    openTabs: string[];
    activeTabId: string;
    executionFlags: {
        economics: boolean;
        charts: boolean;
        optimization: boolean;
    };
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<EquipmentType>(EquipmentType.DASHBOARD);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [targetInstanceId, setTargetInstanceId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectSession[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [history, setHistory] = useState<{past: ProjectSession[], future: ProjectSession[]}>({ past: [], future: [] });
  const [permissions, setPermissions] = useState<PlanPermissions>(() => {
    const saved = localStorage.getItem('misim_permissions');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return {
        Starter: [EquipmentType.DASHBOARD, EquipmentType.PROJECT, EquipmentType.FLOWSHEET, EquipmentType.RESULTS, EquipmentType.RESULTS_SUMMARY, EquipmentType.HELP, EquipmentType.PROFILE, EquipmentType.TERMS_OF_SERVICE, EquipmentType.PRIVACY_POLICY],
        Pro: [EquipmentType.DASHBOARD, EquipmentType.PROJECT, EquipmentType.FLOWSHEET, EquipmentType.RESULTS, EquipmentType.RESULTS_SUMMARY, EquipmentType.RESULTS_STREAMS, EquipmentType.HELP, EquipmentType.PROFILE, EquipmentType.CHARTS, EquipmentType.COMPONENTS, EquipmentType.UNITS, EquipmentType.PARAMETERS, EquipmentType.TERMS_OF_SERVICE, EquipmentType.PRIVACY_POLICY],
        Enterprise: Object.values(EquipmentType)
    };
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
      localStorage.setItem('misim_permissions', JSON.stringify(permissions));
  }, [permissions]);

  const fetchUserData = useCallback(async (userId: string, email: string) => {
    setIsSyncing(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
          console.warn("Profile fetch error:", profileError.message || profileError);
      }

      const { data: dbProjects, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId);

      if (projError) {
          console.warn("Projects fetch error:", projError.message || projError);
      }

      const isAdmin = profile && typeof profile.is_admin === 'boolean' ? profile.is_admin : (email === "eng.mateusgsilva@gmail.com");
      
      const newUser: User = {
        id: userId,
        name: profile?.full_name || email.split('@')[0],
        email,
        isAdmin,
        credits: profile?.credits ?? 100,
        plan: (profile?.plan as PlanType) ?? 'Starter',
        subtitle: profile?.bio ?? 'Engenheiro de Processos',
        registeredAt: profile?.created_at,
        stats: { simulations: profile?.simulations_count || 0 }
      };

      setUser(newUser);

      if (dbProjects && dbProjects.length > 0) {
        const loadedProjects: ProjectSession[] = dbProjects.map(p => ({
          ...p.flowsheet_data,
          id: p.id,
          supabase_id: p.id,
          name: p.name,
          lastModified: new Date(p.updated_at).getTime(),
          executionFlags: p.flowsheet_data.executionFlags || { economics: false, charts: false, optimization: false }
        }));
        setProjects(loadedProjects);
        setActiveProjectId(loadedProjects[0].id);
      } else {
        const defaultProj = createNewProject('Simulação 1');
        setProjects([defaultProj]);
        setActiveProjectId(defaultProj.id);
      }

    } catch (err: any) {
      console.error("Erro ao sincronizar com Supabase:", err.message || err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserData(session.user.id, session.user.email!);
      } else {
        setUser(null);
        const guestProject = createNewProject('Simulação Convidado');
        setProjects([guestProject]);
        setActiveProjectId(guestProject.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const syncProjectToCloud = async (project: ProjectSession) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const isTemporaryId = project.id.startsWith('proj_');
      
      const { data, error } = await supabase
        .from('projects')
        .upsert({
          id: isTemporaryId ? undefined : project.id,
          user_id: user.id,
          name: project.name,
          flowsheet_data: { ...project, supabase_id: undefined },
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      if (isTemporaryId && data && data[0]) {
          const newRealId = data[0].id;
          setProjects(prev => prev.map(p => p.id === project.id ? { ...p, id: newRealId, supabase_id: newRealId } : p));
          if (activeProjectId === project.id) setActiveProjectId(newRealId);
      }
    } catch (err: any) {
      console.error("Cloud Save Error:", err.message || err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (activeProject && user) {
        const timeout = setTimeout(() => syncProjectToCloud(activeProject), 3000);
        return () => clearTimeout(timeout);
    }
  }, [projects, activeProjectId, user]);

  const addNotification = (title: string, message: string, type: NotificationType, linkTo?: EquipmentType) => {
      const newNotif: Notification = {
          id: Date.now().toString(),
          title,
          message,
          type,
          timestamp: new Date(),
          read: false,
          linkTo
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const createNewProject = (name: string): ProjectSession => ({
      id: `proj_${Date.now()}`,
      name: name,
      nodes: [],
      connections: [],
      minerals: JSON.parse(JSON.stringify(COMPONENT_DB)),
      customModels: [], 
      logs: [],
      simulationResult: null,
      lastModified: Date.now(),
      optimizationReady: false,
      units: { ...DEFAULT_UNITS },
      openTabs: [],
      activeTabId: 'flowsheet',
      executionFlags: { economics: false, charts: false, optimization: false }
  });

  const activeProject = projects.find(p => p && p.id === activeProjectId) || projects[0] || createNewProject('Iniciando...');

  const updateActiveProject = (updater: (p: ProjectSession) => ProjectSession) => {
      setProjects(prev => {
          const exists = prev.some(p => p.id === activeProjectId);
          if (!exists && activeProjectId) {
              console.warn(`Project not found in state: ${activeProjectId}. Active project might be in fallback mode.`);
          }
          return prev.map(p => p.id === activeProjectId ? { ...updater(p), lastModified: Date.now() } : p);
      });
  };

  const handleTakeSnapshot = () => {
      setHistory(prev => ({ past: [...prev.past, JSON.parse(JSON.stringify(activeProject))], future: [] }));
  };

  const handleUndo = () => {
      if (history.past.length === 0) return;
      const previous = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, -1);
      setHistory({ past: newPast, future: [activeProject, ...history.future] });
      updateActiveProject(() => previous);
  };

  const handleRedo = () => {
      if (history.future.length === 0) return;
      const next = history.future[0];
      const newFuture = history.future.slice(1);
      setHistory({ past: [...history.past, activeProject], future: newFuture });
      updateActiveProject(() => next);
  };

  const handleResetSimulation = () => {
      handleTakeSnapshot();
      updateActiveProject(p => ({
          ...p,
          simulationResult: null,
          connections: p.connections.map(c => ({...c, streamState: undefined}))
      }));
      addNotification("Simulação Reiniciada", "Os resultados foram limpos.", "info");
  };

  const handleOpenTab = (id: string) => {
      updateActiveProject(p => ({
          ...p,
          openTabs: p.openTabs.includes(id) ? p.openTabs : [...p.openTabs, id],
          activeTabId: id
      }));
  };

  const handleCloseTab = (id: string) => {
      updateActiveProject(p => {
          const newTabs = p.openTabs.filter(tid => tid !== id);
          let newActive = p.activeTabId;
          if (p.activeTabId === id) newActive = 'flowsheet';
          return { ...p, openTabs: newTabs, activeTabId: newActive };
      });
  };

  const handleSwitchTab = (id: string) => {
      updateActiveProject(p => ({ ...p, activeTabId: id }));
  };

  const handleSetNodes = (action: React.SetStateAction<NodeData[]>) => {
      updateActiveProject(p => ({
          ...p,
          nodes: typeof action === 'function' ? action(p.nodes) : action
      }));
  };

  const handleUpdateNode = (id: string, updates: Partial<NodeData>) => {
      handleSetNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleSetConnections = (action: React.SetStateAction<Connection[]>) => {
      updateActiveProject(p => ({
          ...p,
          connections: typeof action === 'function' ? action(p.connections) : action
      }));
  };

  const handleUpdateConnection = (id: string, updates: Partial<Connection>) => {
      handleSetConnections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSetComponents = (action: React.SetStateAction<Component[]>) => {
      updateActiveProject(p => ({
          ...p,
          minerals: typeof action === 'function' ? action(p.minerals) : action
      }));
  };

  const handleSetCustomModels = (action: React.SetStateAction<RecoveryModel[]>) => {
      updateActiveProject(p => ({
          ...p,
          customModels: typeof action === 'function' ? action(p.customModels) : action
      }));
  };

  const handleSetLogs = (action: React.SetStateAction<LogEntry[]>) => {
      updateActiveProject(p => ({
          ...p,
          logs: typeof action === 'function' ? action(p.logs) : action
      }));
  };

  const handleSetUnits = (action: React.SetStateAction<UnitConfig>) => {
    updateActiveProject(p => ({
        ...p,
        units: typeof action === 'function' ? action(p.units) : action
    }));
  };

  const handleNewProject = () => {
      const newName = `Nova Simulação ${projects.length + 1}`;
      const newProj = createNewProject(newName);
      setProjects(prev => [...prev, newProj]);
      setActiveProjectId(newProj.id);
  };

  const handleCloseProject = async (id: string) => {
      if (!id.startsWith('proj_') && user) {
          await supabase.from('projects').delete().eq('id', id);
      }
      const newProjects = projects.filter(p => p.id !== id);
      setProjects(newProjects);
      if (activeProjectId === id && newProjects.length > 0) setActiveProjectId(newProjects[newProjects.length - 1].id);
      else if (newProjects.length === 0) {
        const fresh = createNewProject('Simulação 1');
        setProjects([fresh]);
        setActiveProjectId(fresh.id);
      }
  };

  const handleRenameProject = (id: string, newName: string) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProjects([]);
    setCurrentView(EquipmentType.DASHBOARD);
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.name,
          bio: updates.subtitle,
          avatar_url: updates.avatarUrl,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      setUser(prev => prev ? ({ ...prev, ...updates }) : null);
    } catch (err: any) {
      console.error("Erro ao atualizar usuário:", err.message || err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateUserPlan = async (newPlan: PlanType) => {
      if (user) {
          await supabase.from('profiles').update({ plan: newPlan }).eq('id', user.id);
          setUser(prev => prev ? ({ ...prev, plan: newPlan }) : null);
      }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const { error } = await supabase.rpc('delete_user');
    if (error) {
        console.error("Erro ao deletar conta:", error.message || error);
        alert("Erro ao excluir conta. Verifique sua conexão.");
    } else {
        handleLogout();
    }
  };

  const navigateToAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const handleLogin = (email: string, isAdmin: boolean) => {
    setShowAuth(false);
  };

  const handleSimulationComplete = async (results: SimulationResult) => {
      console.log("Simulation complete received in App.tsx. Converged:", results.converged);
      updateActiveProject(p => ({ ...p, simulationResult: results }));
      
      if (user) {
          try {
              const { data, error } = await supabase.rpc('process_simulation_billing', { 
                p_cost_amount: 10 
              });
              
              if (error) {
                  console.warn("Billing RPC failed, but displaying results anyway:", error.message);
                  addNotification(
                    "Billing Warning", 
                    "Não foi possível processar os créditos, mas o resultado foi gerado.", 
                    "info"
                  );
              } else {
                  const resultRow = Array.isArray(data) ? data[0] : data;
                  if (resultRow) {
                      const { new_credits, new_sim_count } = resultRow;
                      setUser(prev => prev ? ({ 
                          ...prev, 
                          credits: new_credits, 
                          stats: { ...prev.stats, simulations: new_sim_count } 
                      }) : null);
                  }
              }
          } catch (e) {
              console.error("Billing error:", e);
          }
      }

      if (results.converged) {
          addNotification("Simulação Concluída", `Sucesso: ${activeProject.name}`, "simulation", EquipmentType.RESULTS_SUMMARY);
      } else {
          addNotification("Simulação Finalizada", "Sem convergência total.", "info", EquipmentType.FLOWSHEET);
      }
  };

  const handleUpdateCredits = async (newCredits: number) => {
    if (user) {
        setUser(prev => prev ? ({ ...prev, credits: newCredits }) : null);
        try {
            const { error } = await supabase.from('profiles').update({ credits: newCredits }).eq('id', user.id);
            if (error) throw error;
        } catch (err: any) {
            console.error("Erro ao sincronizar créditos no banco:", err.message || err);
        }
    }
  };

  const handleToggleExecutionFlag = (flag: 'economics' | 'charts' | 'optimization') => {
    updateActiveProject(p => ({
        ...p,
        executionFlags: {
            ...p.executionFlags,
            [flag]: !p.executionFlags[flag]
        }
    }));
  };

  const handleNavigate = (view: EquipmentType, instanceId?: string) => {
    // SECURITY GUARD: Only admins can navigate to the Admin View
    if (view === EquipmentType.ADMIN && !user?.isAdmin) {
        setCurrentView(EquipmentType.DASHBOARD);
        return;
    }

    const viewToTabMap: Record<string, string> = {
        [EquipmentType.ECONOMICS]: 'economics',
        [EquipmentType.UNITS]: 'units',
        [EquipmentType.COMPONENTS]: 'components',
        [EquipmentType.KINETICS]: 'kinetics',
        [EquipmentType.CHARTS]: 'charts',
        [EquipmentType.OPTIMIZATION]: 'optimization',
        [EquipmentType.REPORTS]: 'reports',
        [EquipmentType.RESULTS_SUMMARY]: 'results_summary',
        [EquipmentType.RESULTS_STREAMS]: 'results_streams',
        [EquipmentType.RESULTS_PERFORMANCE]: 'results_performance',
        [EquipmentType.RESULTS_CONSOLE]: 'results_console'
    };

    if (viewToTabMap[view]) {
        const tabId = viewToTabMap[view];
        updateActiveProject(p => ({
                ...p,
                openTabs: p.openTabs.includes(tabId) ? p.openTabs : [...p.openTabs, tabId],
                activeTabId: tabId
        }));
        setCurrentView(EquipmentType.FLOWSHEET);
        setTargetInstanceId(null);
        return;
    }

    if (instanceId) {
        updateActiveProject(p => ({
            ...p,
            openTabs: p.openTabs.includes(instanceId) ? p.openTabs : [...p.openTabs, instanceId],
            activeTabId: instanceId
        }));
        setCurrentView(EquipmentType.FLOWSHEET);
        setTargetInstanceId(null);
        return;
    }
    setCurrentView(view);
  };

  const renderView = () => {
    let equipmentFilter: string | undefined = undefined;
    if (currentView === EquipmentType.SET_MILL_GROUP) equipmentFilter = 'COMINUIÇÃO';
    else if (currentView === EquipmentType.SET_CLASSIFICATION_GROUP) equipmentFilter = 'CLASSIFICAÇÃO';
    else if (currentView === EquipmentType.SET_CONCENTRATION_GROUP) equipmentFilter = 'CONCENTRAÇÃO';
    else if (currentView === EquipmentType.SET_SOLID_LIQUID_GROUP) equipmentFilter = 'SÓLIDOS-LÍQUIDO';
    else if (currentView === EquipmentType.SET_AUXILIARY_GROUP) equipmentFilter = 'AUXILIARES';
    else if (currentView === EquipmentType.SET_STREAMS_GROUP) equipmentFilter = 'CORRENTES';

    switch (currentView) {
      case EquipmentType.TERMS_OF_SERVICE:
        return <TermsOfServiceView onBack={() => setCurrentView(user ? EquipmentType.DASHBOARD : EquipmentType.PROJECT)} />;
      case EquipmentType.PRIVACY_POLICY:
        return <PrivacyPolicyView onBack={() => setCurrentView(user ? EquipmentType.DASHBOARD : EquipmentType.PROJECT)} />;
      case EquipmentType.FLOWSHEET:
      case EquipmentType.PROJECT:
        return (
          <ProjectView 
            nodes={activeProject.nodes} setNodes={handleSetNodes}
            connections={activeProject.connections} setConnections={handleSetConnections}
            minerals={activeProject.minerals} setMinerals={handleSetComponents}
            customModels={activeProject.customModels} setCustomModels={handleSetCustomModels}
            units={activeProject.units} setUnits={handleSetUnits}
            logs={activeProject.logs} setLogs={handleSetLogs}
            simulationResult={activeProject.simulationResult} 
            onSimulationComplete={handleSimulationComplete}
            onNavigateToResults={() => handleNavigate(EquipmentType.RESULTS_SUMMARY)}
            onNavigate={handleNavigate}
            user={user} onUpdateCredits={handleUpdateCredits}
            onTriggerOptimization={() => {
                updateActiveProject(p => ({ ...p, optimizationReady: true }));
                handleNavigate(EquipmentType.OPTIMIZATION);
            }}
            onSnapshot={handleTakeSnapshot} onUndo={handleUndo} onRedo={handleRedo}
            onResetSimulation={handleResetSimulation} canUndo={history.past.length > 0} canRedo={history.future.length > 0}
            openTabs={activeProject.openTabs} activeTabId={activeProject.activeTabId}
            onOpenTab={handleOpenTab} onCloseTab={handleCloseTab} onSwitchTab={handleSwitchTab}
            projectName={activeProject.name}
            executionFlags={activeProject.executionFlags}
            onToggleExecutionFlag={handleToggleExecutionFlag}
          />
        );
      case EquipmentType.PARAMETERS:
      case EquipmentType.SET_MILL_GROUP:
      case EquipmentType.SET_CLASSIFICATION_GROUP:
      case EquipmentType.SET_CONCENTRATION_GROUP:
      case EquipmentType.SET_SOLID_LIQUID_GROUP:
      case EquipmentType.SET_AUXILIARY_GROUP:
      case EquipmentType.SET_STREAMS_GROUP:
        return (
          <ParametersView 
            nodes={activeProject.nodes} connections={activeProject.connections}
            minerals={activeProject.minerals} customModels={activeProject.customModels}
            units={activeProject.units} onUpdateNode={handleUpdateNode}
            onUpdateConnection={handleUpdateConnection} onNavigateToProject={() => handleNavigate(EquipmentType.FLOWSHEET)}
            filterType={equipmentFilter} initialTargetId={targetInstanceId} onClearTargetId={() => setTargetInstanceId(null)}
          />
        );
      case EquipmentType.PROFILE:
        return user ? <ProfileView user={user} onUpdateUser={handleUpdateUser} onDeleteAccount={handleDeleteAccount} /> : null;
      case EquipmentType.SETTINGS:
        return user ? <SettingsView user={user} onNavigate={handleNavigate} /> : null;
      case EquipmentType.ADMIN:
        if (!user?.isAdmin) return <DashboardView onNavigate={handleNavigate} user={user} activeProjectCount={projects.length} />;
        return <AdminView 
                  currentUser={user} 
                  onUpdateCurrentCredits={handleUpdateCredits} 
                  onUpdateUserPlan={handleUpdateUserPlan} 
                  onUpdateUserAdmin={(isAdmin) => setUser(prev => prev ? ({ ...prev, isAdmin }) : null)}
                  permissions={permissions} 
                  onUpdatePermissions={setPermissions} 
               />;
      case EquipmentType.COMMUNITY: return <CommunityView user={user} onNavigate={handleNavigate} />;
      case EquipmentType.HELP: return <HelpView />;
      case EquipmentType.DASHBOARD:
      default: return <DashboardView onNavigate={handleNavigate} user={user} activeProjectCount={projects.length} />;
    }
  };

  const isProjectRelatedView = [
      EquipmentType.PROJECT, EquipmentType.FLOWSHEET, EquipmentType.RESULTS_SUMMARY, EquipmentType.RESULTS_STREAMS, EquipmentType.RESULTS_PERFORMANCE, EquipmentType.RESULTS_CONSOLE, EquipmentType.ECONOMICS,
      EquipmentType.UNITS, EquipmentType.COMPONENTS, EquipmentType.KINETICS, EquipmentType.CHARTS,
      EquipmentType.OPTIMIZATION, EquipmentType.REPORTS, EquipmentType.PARAMETERS,
      EquipmentType.SET_MILL_GROUP, EquipmentType.SET_CLASSIFICATION_GROUP, EquipmentType.SET_CONCENTRATION_GROUP,
      EquipmentType.SET_SOLID_LIQUID_GROUP, EquipmentType.SET_AUXILIARY_GROUP, EquipmentType.SET_STREAMS_GROUP
  ].includes(currentView);

  const activeProjectTabsData = activeProject.openTabs.map(id => {
      if (id === 'results_summary') return { id, label: 'Resumo Operacional', type: 'results' as const };
      if (id === 'results_streams') return { id, label: 'Detalhamento das Correntes', type: 'results' as const };
      if (id === 'results_performance') return { id, label: 'Performance por Equipamento', type: 'results' as const };
      if (id === 'results_console') return { id, label: 'Console & Logs', type: 'results' as const };
      if (id === 'economics') return { id, label: 'Economia', type: 'economics' as const };
      if (id === 'units') return { id, label: 'Unidades', type: 'category' as const };
      if (id === 'components') return { id, label: 'Componentes', type: 'category' as const };
      if (id === 'kinetics') return { id, label: 'Cinética', type: 'category' as const };
      if (id === 'charts') return { id, label: 'Gráficos', type: 'charts' as const };
      if (id === 'optimization') return { id, label: 'Otimização', type: 'optimization' as const };
      if (id === 'reports') return { id, label: 'Relatórios', type: 'results' as const };

      const node = activeProject.nodes.find(n => n && n.id === id);
      if (node) return { id: node.id, label: node.label, type: 'node' as const };
      const conn = activeProject.connections.find(c => c && c.id === id);
      if (conn) return { id: conn.id, label: conn.label || 'Stream', type: 'connection' as const };
      return { id, label: id, type: 'node' as const }; 
  });

  const isFullLayoutView = [
      EquipmentType.PROJECT, EquipmentType.FLOWSHEET, EquipmentType.RESULTS_SUMMARY, EquipmentType.RESULTS_STREAMS, EquipmentType.RESULTS_PERFORMANCE, EquipmentType.RESULTS_CONSOLE, EquipmentType.OPTIMIZATION,
      EquipmentType.SET_MILL_GROUP, EquipmentType.SET_CLASSIFICATION_GROUP, EquipmentType.SET_CONCENTRATION_GROUP,
      EquipmentType.SET_SOLID_LIQUID_GROUP, EquipmentType.SET_AUXILIARY_GROUP, EquipmentType.SET_STREAMS_GROUP, EquipmentType.PARAMETERS,
      EquipmentType.ECONOMICS, EquipmentType.UNITS, EquipmentType.COMPONENTS, EquipmentType.KINETICS, EquipmentType.CHARTS, EquipmentType.REPORTS,
      EquipmentType.ADMIN
  ].includes(currentView);

  if (user) {
    if (currentView === EquipmentType.TERMS_OF_SERVICE) {
        return <TermsOfServiceView onBack={() => setCurrentView(EquipmentType.DASHBOARD)} />;
    }
    if (currentView === EquipmentType.PRIVACY_POLICY) {
        return <PrivacyPolicyView onBack={() => setCurrentView(EquipmentType.DASHBOARD)} />;
    }
    return (
      <Layout 
        currentView={currentView} 
        activeSubTabId={activeProject.activeTabId}
        targetInstanceId={targetInstanceId}
        onNavigate={handleNavigate} onLogout={handleLogout}
        onAddCredits={() => setCurrentView(EquipmentType.SETTINGS)}
        user={user} permissions={permissions} notifications={notifications}
        onMarkNotificationsRead={() => setNotifications(prev => prev.map(n => ({...n, read: true})))} 
        onClearNotifications={() => setNotifications([])}
        nodes={activeProject.nodes}
        connections={activeProject.connections}
      >
        <div className="flex flex-col h-full overflow-hidden">
            <div className="h-1 bg-slate-200 w-full relative overflow-hidden">
                {isSyncing && <div className="absolute inset-0 bg-blue-500 animate-pulse w-1/2"></div>}
            </div>
            
            <div className="flex items-center justify-end px-4 py-1 bg-white border-b text-[10px] text-slate-400">
                {isSyncing ? (
                    <span className="flex items-center"><Cloud className="w-3 h-3 mr-1 animate-bounce" /> Syncing with Cloud...</span>
                ) : (
                    <span className="flex items-center"><Cloud className="w-3 h-3 mr-1 text-green-500" /> Cloud Balanced</span>
                )}
            </div>

            {isProjectRelatedView && (
                <ProjectTabBar 
                    projects={projects} activeProjectId={activeProjectId} onNewProject={handleNewProject}
                    onSelectProject={setActiveProjectId} onCloseProject={handleCloseProject} onRenameProject={handleRenameProject}
                    activeProjectTabs={activeProjectTabsData} activeTabId={activeProject.activeTabId}
                    onSubTabSelect={handleSwitchTab} onSubTabClose={handleCloseTab}
                />
            )}
            <div className={`flex-1 relative ${isFullLayoutView ? 'overflow-hidden' : 'overflow-y-auto p-4 md:p-8 bg-slate-50'}`}>
                <div className={isFullLayoutView ? "h-full w-full" : "max-w-7xl mx-auto min-h-full"}>
                    {renderView()}
                </div>
            </div>
        </div>
      </Layout>
    );
  }

  if (showAuth) return <AuthView onLogin={handleLogin} initialMode={authMode} onBack={() => setShowAuth(false)} />;
  if (currentView === EquipmentType.TERMS_OF_SERVICE) {
    return <TermsOfServiceView onBack={() => setCurrentView(EquipmentType.PROJECT)} />;
  }
  if (currentView === EquipmentType.PRIVACY_POLICY) {
    return <PrivacyPolicyView onBack={() => setCurrentView(EquipmentType.PROJECT)} />;
  }
  return <LandingPage 
    onNavigateToAuth={navigateToAuth} 
    onAdminShortcut={() => handleLogin('eng.mateusgsilva@gmail.com', true)} 
    onNavigateToTerms={() => setCurrentView(EquipmentType.TERMS_OF_SERVICE)} 
    onNavigateToPrivacy={() => setCurrentView(EquipmentType.PRIVACY_POLICY)}
  />;
};

export default App;
