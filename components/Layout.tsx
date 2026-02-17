import React, { useState, useRef, useEffect } from 'react';
import { EquipmentType, PlanType, PlanPermissions, Notification, NodeData, NodeType, Connection } from '../types';
import { 
  LayoutDashboard, 
  Menu,
  X,
  LogOut,
  Shield,
  FolderKanban,
  Sliders,
  ClipboardList,
  DollarSign,
  BarChart3,
  Zap,
  FileText,
  HelpCircle,
  Database,
  User as UserIcon,
  Settings,
  Bell,
  Search,
  ChevronDown,
  ChevronRight,
  Users,
  CheckCircle,
  Info,
  MessageSquare,
  Trash2,
  CheckSquare,
  FunctionSquare,
  Ruler,
  MousePointer2,
  Settings2,
  Hammer,
  Layers,
  Filter,
  Activity,
  Droplets,
  Shuffle,
  Split,
  Boxes,
  Waves,
  Terminal,
  Target,
  Table,
  Crown
} from 'lucide-react';

interface LayoutProps {
  currentView: EquipmentType;
  activeSubTabId?: string;
  targetInstanceId?: string | null;
  onNavigate: (view: EquipmentType, instanceId?: string) => void;
  onLogout: () => void;
  onAddCredits: () => void;
  user: { 
    name: string; 
    email: string; 
    isAdmin: boolean; 
    credits: number; 
    avatarUrl?: string;
    plan: PlanType;
  } | null;
  permissions?: PlanPermissions;
  notifications?: Notification[];
  onMarkNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  nodes?: NodeData[];
  connections?: Connection[];
  children: React.ReactNode;
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isChild?: boolean;
  isGrandChild?: boolean;
  isGreatGrandChild?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onClick: () => void;
  onToggleExpand?: (e: React.MouseEvent) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  isActive, 
  isChild = false,
  isGrandChild = false,
  isGreatGrandChild = false,
  hasChildren = false,
  isExpanded = false,
  onClick,
  onToggleExpand
}) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-2.5 mb-1 transition-all rounded-lg group ${
      isActive
        ? 'bg-blue-600/10 text-blue-400 font-bold'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    } ${isChild ? 'pl-10' : ''} ${isGrandChild ? 'pl-14' : ''} ${isGreatGrandChild ? 'pl-20' : ''}`}
  >
    <Icon className={`shrink-0 ${isChild || isGrandChild || isGreatGrandChild ? 'w-4 h-4 mr-2.5' : 'w-5 h-5 mr-3'} ${isActive ? 'text-blue-400' : 'text-slate-50 group-hover:text-slate-300'}`} />
    <span className={`truncate flex-1 text-left ${isChild || isGrandChild || isGreatGrandChild ? 'text-xs' : 'text-sm'}`}>{label}</span>
    {hasChildren && (
      <div 
        onClick={onToggleExpand}
        className="p-1 hover:bg-white/10 rounded transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
    )}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ 
    currentView, 
    activeSubTabId,
    targetInstanceId,
    onNavigate, 
    onLogout, 
    onAddCredits, 
    user, 
    permissions, 
    notifications = [],
    onMarkNotificationsRead,
    onClearNotifications,
    nodes = [],
    connections = [],
    children 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['PROJECT', EquipmentType.SET_EQUIPMENT_GROUP]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
              setIsNotifMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const isItemActive = (itemId: EquipmentType | string, instanceId?: string) => {
    // Mapeamento de sub-abas para EquipmentType correspondente no sidebar
    const subToEquipMap: Record<string, EquipmentType> = {
      'economics': EquipmentType.ECONOMICS,
      'units': EquipmentType.UNITS,
      'components': EquipmentType.COMPONENTS,
      'kinetics': EquipmentType.KINETICS,
      'charts': EquipmentType.CHARTS,
      'optimization': EquipmentType.OPTIMIZATION,
      'results_summary': EquipmentType.RESULTS_SUMMARY,
      'results_streams': EquipmentType.RESULTS_STREAMS,
      'results_performance': EquipmentType.RESULTS_PERFORMANCE,
      'results_console': EquipmentType.RESULTS_CONSOLE,
      'reports': EquipmentType.REPORTS
    };

    // Caso básico: visualização atual coincide
    if (currentView === itemId && !instanceId) {
      // No fluxo de projeto, "Desenho do Fluxograma" (FLOWSHEET) só deve ser ativo se a aba 'flowsheet' for a ativa
      if (itemId === EquipmentType.FLOWSHEET) {
        return activeSubTabId === 'flowsheet' || !activeSubTabId;
      }
      return true;
    }

    // Caso de projeto ativo (FLOWSHEET ou PROJECT)
    if (currentView === EquipmentType.FLOWSHEET || currentView === EquipmentType.PROJECT) {
      // Checar se o itemId mapeia para a aba ativa
      if (subToEquipMap[activeSubTabId || ''] === itemId) return true;
      
      // Checar se é uma instância específica (parâmetros de equipamento/corrente)
      if (instanceId && instanceId === activeSubTabId) return true;
    }

    return false;
  };

  interface NavItem {
    id: string | EquipmentType;
    label: string;
    icon: React.ElementType;
    instanceId?: string;
    children?: NavItem[];
  }

  // Define Category Mapping for Nodes
  const CATEGORY_MAP: Record<string, { types: NodeType[], icon: React.ElementType }> = {
    [EquipmentType.SET_MILL_GROUP]: { icon: Hammer, types: ['Moinho', 'MoinhoSAG', 'MoinhoRolos', 'Britador', 'BritadorGiratorio', 'BritadorMandibula'] },
    [EquipmentType.SET_CLASSIFICATION_GROUP]: { icon: Filter, types: ['Hydrocyclone'] },
    [EquipmentType.SET_CONCENTRATION_GROUP]: { icon: Layers, types: ['FlotationCell', 'Conditioner'] },
    [EquipmentType.SET_SOLID_LIQUID_GROUP]: { icon: Droplets, types: ['Thickener'] },
    [EquipmentType.SET_AUXILIARY_GROUP]: { icon: Shuffle, types: ['Mixer', 'Splitter'] }
  };

  const getEquipmentIcon = (type: NodeType) => {
      switch(type) {
          case 'Moinho': case 'MoinhoSAG': case 'MoinhoRolos': return Settings2;
          case 'Britador': case 'BritadorGiratorio': case 'BritadorMandibula': return Hammer;
          case 'Hydrocyclone': return Filter;
          case 'FlotationCell': return Layers;
          case 'Thickener': return Boxes;
          case 'Mixer': return Shuffle;
          case 'Splitter': return Split;
          default: return Sliders;
      }
  };

  const getInstancesForCategory = (viewType: string): NavItem[] => {
      const cat = CATEGORY_MAP[viewType];
      if (!cat) return [];
      return nodes
          .filter(n => cat.types.includes(n.type))
          .map(n => ({
              id: viewType, // Use category view type
              instanceId: n.id, // Target specific instance
              label: n.label,
              icon: getEquipmentIcon(n.type)
          }));
  };

  const getStreamsForGroup = (): NavItem[] => {
      return connections.map(c => ({
          id: EquipmentType.SET_STREAMS_GROUP,
          instanceId: c.id,
          label: c.label || 'Stream',
          icon: Waves
      }));
  };

  const allNavItems: NavItem[] = [
    { 
      id: EquipmentType.PROJECT, 
      label: 'Project Flowsheet', 
      icon: FolderKanban,
      children: [
        { id: EquipmentType.FLOWSHEET, label: 'Desenho do Fluxograma', icon: MousePointer2 },
        { 
          id: EquipmentType.RESULTS, 
          label: 'Resultados', 
          icon: ClipboardList,
          children: [
            { id: EquipmentType.RESULTS_SUMMARY, label: 'Resumo Operacional', icon: ClipboardList },
            { id: EquipmentType.RESULTS_STREAMS, label: 'Detalhamento das Correntes', icon: Table },
            { id: EquipmentType.RESULTS_PERFORMANCE, label: 'Performance por Equipamento', icon: Target },
            { id: EquipmentType.RESULTS_CONSOLE, label: 'Console & Logs', icon: Terminal },
          ]
        },
        { 
          id: EquipmentType.SET_EQUIPMENT_GROUP, 
          label: 'Setting equipment', 
          icon: Settings2,
          children: [
             { 
               id: EquipmentType.SET_MILL_GROUP, 
               label: 'COMINUIÇÃO', 
               icon: Hammer,
               children: getInstancesForCategory(EquipmentType.SET_MILL_GROUP)
             },
             { 
               id: EquipmentType.SET_CLASSIFICATION_GROUP, 
               label: 'CLASSIFICAÇÃO', 
               icon: Filter,
               children: getInstancesForCategory(EquipmentType.SET_CLASSIFICATION_GROUP)
             },
             { 
               id: EquipmentType.SET_CONCENTRATION_GROUP, 
               label: 'CONCENTRAÇÃO', 
               icon: Layers,
               children: getInstancesForCategory(EquipmentType.SET_CONCENTRATION_GROUP)
             },
             { 
               id: EquipmentType.SET_SOLID_LIQUID_GROUP, 
               label: 'SÓLIDOS-LÍQUIDO', 
               icon: Droplets,
               children: getInstancesForCategory(EquipmentType.SET_SOLID_LIQUID_GROUP)
             },
             { 
               id: EquipmentType.SET_AUXILIARY_GROUP, 
               label: 'AUXILIARES', 
               icon: Shuffle,
               children: getInstancesForCategory(EquipmentType.SET_AUXILIARY_GROUP)
             },
             {
               id: EquipmentType.SET_STREAMS_GROUP,
               label: 'CORRENTES',
               icon: Waves,
               children: getStreamsForGroup()
             }
          ]
        },
        { id: EquipmentType.ECONOMICS, label: 'Economia', icon: DollarSign },
        { id: EquipmentType.UNITS, label: 'Unidades', icon: Ruler },
        { id: EquipmentType.COMPONENTS, label: 'Componentes', icon: Database },
        { id: EquipmentType.KINETICS, label: 'Cinética', icon: FunctionSquare },
        { id: EquipmentType.CHARTS, label: 'Gráficos', icon: BarChart3 },
        { id: EquipmentType.OPTIMIZATION, label: 'Otimização', icon: Zap },
      ]
    },
    { id: EquipmentType.REPORTS, label: 'Relatórios', icon: FileText },
  ];

  // Filter items based on user plan and permissions
  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.filter(item => {
      if (!permissions || !user?.plan) return true;
      const allowedViews = permissions[user.plan];
      
      // If it's a structural group, allow it
      if (item.id === EquipmentType.SET_EQUIPMENT_GROUP) return true;
      if (item.id === EquipmentType.SET_MILL_GROUP) return true;
      if (item.id === EquipmentType.RESULTS) return true; // Results is now a parent
      if (item.id.toString().startsWith('SET_')) return true; 

      const isAllowed = allowedViews ? allowedViews.includes(item.id as EquipmentType) : false;
      
      if (item.children) {
        item.children = filterNavItems(item.children);
      }
      
      return isAllowed;
    });
  };

  const navItems = filterNavItems(allNavItems);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifIcon = (type: string) => {
      switch (type) {
          case 'system': return <Zap className="w-4 h-4 text-orange-600" />;
          case 'community': return <MessageSquare className="w-4 h-4 text-blue-600" />;
          case 'simulation': return <CheckCircle className="w-4 h-4 text-green-600" />;
          case 'credit': return <DollarSign className="w-4 h-4 text-yellow-600" />;
          default: return <Info className="w-4 h-4 text-slate-500" />;
      }
  };

  const handleNotifClick = (notif: Notification) => {
      if (notif.linkTo) {
          onNavigate(notif.linkTo);
          setIsNotifMenuOpen(false);
      }
  };

  const isMenuExpanded = (id: string) => expandedMenus.includes(id);

  // Helper to determine if a group item should be navigable even with children
  const isNavigableGroup = (id: string | EquipmentType) => {
      const groups: EquipmentType[] = [];
      return groups.includes(id as EquipmentType);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col shadow-xl
      `}>
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <span className="font-bold text-white">M</span>
          </div>
          <span className="font-bold text-xl tracking-wider text-white">MISIMWEB</span>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          
          {/* Mobile Only Navigation for Dashboard/Community/Admin/Help */}
          <div className="lg:hidden space-y-1 mb-6 pb-4 border-b border-slate-800/50">
              <SidebarItem
                icon={LayoutDashboard}
                label="Dashboard"
                isActive={isItemActive(EquipmentType.DASHBOARD)}
                onClick={() => {
                  onNavigate(EquipmentType.DASHBOARD);
                  setIsMobileMenuOpen(false);
                }}
              />
              <SidebarItem
                icon={Users}
                label="Community Hub"
                isActive={isItemActive(EquipmentType.COMMUNITY)}
                onClick={() => {
                  onNavigate(EquipmentType.COMMUNITY);
                  setIsMobileMenuOpen(false);
                }}
              />
              {user?.isAdmin && (
                <SidebarItem
                  icon={Shield}
                  label="Admin Panel"
                  isActive={isItemActive(EquipmentType.ADMIN)}
                  onClick={() => {
                    onNavigate(EquipmentType.ADMIN);
                    setIsMobileMenuOpen(false);
                  }}
                />
              )}
              <SidebarItem
                icon={HelpCircle}
                label="Help"
                isActive={isItemActive(EquipmentType.HELP)}
                onClick={() => {
                  onNavigate(EquipmentType.HELP);
                  setIsMobileMenuOpen(false);
                }}
              />
          </div>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-3">
            Main Menu
          </div>
          {navItems.map((item) => (
            <React.Fragment key={item.id + (item.instanceId || '')}>
              <SidebarItem
                icon={item.icon}
                label={item.label}
                isActive={isItemActive(item.id as EquipmentType)}
                hasChildren={!!item.children && item.children.length > 0}
                isExpanded={isMenuExpanded(item.id.toString() + (item.instanceId || ''))}
                onClick={() => {
                  if (item.children && item.children.length > 0) {
                    toggleMenu(item.id.toString() + (item.instanceId || ''));
                  } else {
                    onNavigate(item.id as EquipmentType, item.instanceId);
                    setIsMobileMenuOpen(false);
                  }
                }}
                onToggleExpand={(e) => {
                  e.stopPropagation();
                  toggleMenu(item.id.toString() + (item.instanceId || ''));
                }}
              />
              {item.children && isMenuExpanded(item.id.toString() + (item.instanceId || '')) && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  {item.children.map(child => (
                    <React.Fragment key={child.id + (child.instanceId || '')}>
                      <SidebarItem
                        icon={child.icon}
                        label={child.label}
                        isActive={isItemActive(child.id as EquipmentType, child.instanceId)}
                        isChild={true}
                        hasChildren={!!child.children && child.children.length > 0}
                        isExpanded={isMenuExpanded(child.id.toString() + (child.instanceId || ''))}
                        onClick={() => {
                           if (child.children && child.children.length > 0) {
                               toggleMenu(child.id.toString() + (child.instanceId || ''));
                           } else {
                               onNavigate(child.id as EquipmentType, child.instanceId);
                               setIsMobileMenuOpen(false);
                           }
                        }}
                        onToggleExpand={(e) => {
                            e.stopPropagation();
                            toggleMenu(child.id.toString() + (child.instanceId || ''));
                        }}
                      />
                      {child.children && isMenuExpanded(child.id.toString() + (child.instanceId || '')) && (
                        <div className="animate-in slide-in-from-top-1 duration-200">
                           {child.children.map(grandChild => (
                               <React.Fragment key={grandChild.id + (grandChild.instanceId || '')}>
                               <SidebarItem
                                  icon={grandChild.icon}
                                  label={grandChild.label}
                                  isActive={isItemActive(grandChild.id as EquipmentType, grandChild.instanceId)}
                                  isGrandChild={true}
                                  hasChildren={!!grandChild.children && grandChild.children.length > 0}
                                  isExpanded={isMenuExpanded(grandChild.id.toString() + (grandChild.instanceId || ''))}
                                  onClick={() => {
                                      if (grandChild.children && grandChild.children.length > 0) {
                                          if (isNavigableGroup(grandChild.id)) {
                                              onNavigate(grandChild.id as EquipmentType, grandChild.instanceId);
                                              if (!isMenuExpanded(grandChild.id.toString() + (grandChild.instanceId || ''))) {
                                                  toggleMenu(grandChild.id.toString() + (grandChild.instanceId || ''));
                                              }
                                          } else {
                                              toggleMenu(grandChild.id.toString() + (grandChild.instanceId || ''));
                                          }
                                      } else {
                                          onNavigate(grandChild.id as EquipmentType, grandChild.instanceId);
                                          setIsMobileMenuOpen(false);
                                      }
                                  }}
                                  onToggleExpand={(e) => {
                                      e.stopPropagation();
                                      toggleMenu(grandChild.id.toString() + (grandChild.instanceId || ''));
                                  }}
                               />
                               {grandChild.children && isMenuExpanded(grandChild.id.toString() + (grandChild.instanceId || '')) && (
                                   <div className="animate-in slide-in-from-top-1 duration-200">
                                       {grandChild.children.map(greatGrandChild => (
                                           <SidebarItem
                                              key={greatGrandChild.id + (greatGrandChild.instanceId || '')}
                                              icon={greatGrandChild.icon}
                                              label={greatGrandChild.label}
                                              isActive={isItemActive(greatGrandChild.id as EquipmentType, greatGrandChild.instanceId)}
                                              isGreatGrandChild={true}
                                              onClick={() => {
                                                  onNavigate(greatGrandChild.id as EquipmentType, greatGrandChild.instanceId);
                                                  setIsMobileMenuOpen(false);
                                              }}
                                           />
                                       ))}
                                   </div>
                               )}
                               </React.Fragment>
                           ))}
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Sidebar Footer (Version info) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-400 border border-slate-700">
            <p className="font-semibold text-slate-300 mb-1">MISIMWEB v3.1</p>
            <p className="opacity-70">Server Status: <span className="text-green-400">Online</span></p>
            {user && (
                <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between">
                    <span>Plan:</span>
                    <span className="font-bold text-orange-400">{user.plan}</span>
                </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
        
        {/* Top Header / Toolbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-40 shadow-sm shrink-0">
          
          {/* Left: Mobile Toggle & Page Title/Breadcrumb */}
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 rounded-md"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center ml-4 relative">
              <Search className="w-4 h-4 absolute left-3 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search project or mineral..." 
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
              />
            </div>

            {/* Quick Navigation Buttons (Dashboard, Community, Admin, Help) */}
            <div className="hidden lg:flex items-center ml-6 space-x-2">
               <button 
                 onClick={() => onNavigate(EquipmentType.DASHBOARD)}
                 className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                   currentView === EquipmentType.DASHBOARD 
                     ? 'bg-blue-50 text-blue-700' 
                     : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                 }`}
               >
                 <LayoutDashboard className="w-4 h-4 mr-2" />
                 Dashboard
               </button>
               <button 
                 onClick={() => onNavigate(EquipmentType.COMMUNITY)}
                 className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                   currentView === EquipmentType.COMMUNITY 
                     ? 'bg-blue-50 text-blue-700' 
                     : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                 }`}
               >
                 <Users className="w-4 h-4 mr-2" />
                 Community Hub
               </button>
               {user?.isAdmin && (
                 <button 
                   onClick={() => onNavigate(EquipmentType.ADMIN)}
                   className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                     currentView === EquipmentType.ADMIN 
                       ? 'bg-red-50 text-red-700' 
                       : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                 }`}
               >
                 <Shield className="w-4 h-4 mr-2" />
                 Admin Panel
               </button>
               )}
               <button 
                 onClick={() => onNavigate(EquipmentType.HELP)}
                 className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                   currentView === EquipmentType.HELP 
                     ? 'bg-indigo-50 text-indigo-700' 
                     : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                 }`}
               >
                 <HelpCircle className="w-4 h-4 mr-2" />
                 Help
               </button>
            </div>
          </div>

          {/* Right: User Actions */}
          <div className="flex items-center space-x-4">
            
            {/* Current Plan Display */}
            <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-1.5 shadow-inner">
              <Crown className={`w-4 h-4 mr-2 ${user?.plan === 'Enterprise' ? 'text-orange-500' : user?.plan === 'Pro' ? 'text-purple-500' : 'text-slate-400'}`} />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Plan</span>
                <span className="text-sm font-black text-slate-800">{user?.plan || 'Starter'}</span>
              </div>
            </div>

            {/* Credits Display */}
            <div className="hidden sm:flex items-center bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5">
              <Database className="w-4 h-4 text-orange-600 mr-2" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-orange-400 font-bold uppercase">Credits</span>
                <span className="text-sm font-bold text-slate-800">{user?.credits?.toLocaleString() || 0}</span>
              </div>
              <button 
                onClick={onAddCredits}
                className="ml-3 text-xs font-bold px-2 py-0.5 rounded border transition-colors bg-white text-orange-600 border-orange-200 hover:bg-orange-600 hover:text-white cursor-pointer"
                title="Purchase credits"
              >
                + Add
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
                    className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                </button>

                {isNotifMenuOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 py-0 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <span className="text-sm font-bold text-slate-800">Notificações</span>
                            <div className="flex space-x-1">
                                <button 
                                    onClick={onMarkNotificationsRead}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-500" 
                                    title="Marcar todas como lidas"
                                >
                                    <CheckSquare className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={onClearNotifications}
                                    className="p-1 hover:bg-red-50 hover:text-red-500 rounded text-slate-500"
                                    title="Limpar tudo"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    Nenhuma notificação recente.
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif.id} 
                                        onClick={() => handleNotifClick(notif)}
                                        className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className={`mt-1 p-1.5 rounded-full shrink-0 ${!notif.read ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                                            {getNotifIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notif.read ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                        {!notif.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                   {user?.avatarUrl ? (
                     <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                   ) : (
                     user?.name?.charAt(0) || 'U'
                   )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-40 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-100 md:hidden">
                       <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                       <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    
                    <div className="px-4 py-2">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account</p>
                       <button 
                          onClick={() => { setIsProfileMenuOpen(false); onNavigate(EquipmentType.PROFILE); }}
                          className="w-full text-left flex items-center px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                       >
                          <UserIcon className="w-4 h-4 mr-3 text-slate-400" /> My Profile
                       </button>
                       <button 
                          onClick={() => { setIsProfileMenuOpen(false); onNavigate(EquipmentType.SETTINGS); }}
                          className="w-full text-left flex items-center px-2 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                       >
                          <Settings className="w-4 h-4 mr-3 text-slate-400" /> Settings & Billing
                       </button>
                    </div>

                    <div className="border-t border-slate-100 my-1"></div>

                    <div className="px-4 py-2">
                       <button 
                          onClick={onLogout}
                          className="w-full text-left flex items-center px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium"
                       >
                          <LogOut className="w-4 h-4 mr-3" /> Sign Out
                       </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Content Area */}
        {children}

      </div>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};