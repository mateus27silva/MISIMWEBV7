import React, { useState } from 'react';
import { FolderOpen, X, Plus, Settings2, Waves, Layout, FileText, Sliders, DollarSign, BarChart3, Zap } from 'lucide-react';

interface ProjectSessionStub {
    id: string;
    name: string;
}

interface SubTab {
    id: string;
    label: string;
    type: 'node' | 'connection' | 'results' | 'category' | 'economics' | 'charts' | 'optimization';
}

interface ProjectTabBarProps {
    projects: ProjectSessionStub[];
    activeProjectId: string;
    onNewProject: () => void;
    onSelectProject: (id: string) => void;
    onCloseProject: (id: string) => void;
    onRenameProject: (id: string, name: string) => void;
    showAddButton?: boolean;
    activeProjectTabs?: SubTab[];
    activeTabId?: string;
    onSubTabSelect?: (id: string) => void;
    onSubTabClose?: (id: string) => void;
}

export const ProjectTabBar: React.FC<ProjectTabBarProps> = ({
    projects,
    activeProjectId,
    onNewProject,
    onSelectProject,
    onCloseProject,
    onRenameProject,
    showAddButton = true,
    activeProjectTabs = [],
    activeTabId,
    onSubTabSelect,
    onSubTabClose
}) => {
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [tempTabName, setTempTabName] = useState('');

    const startRenamingTab = (e: React.MouseEvent, project: ProjectSessionStub) => {
        e.stopPropagation();
        setEditingTabId(project.id);
        setTempTabName(project.name);
    };

    const finishRenamingTab = () => {
        if (editingTabId && tempTabName.trim()) {
            onRenameProject(editingTabId, tempTabName.trim());
        }
        setEditingTabId(null);
    };

    const handleTabKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') finishRenamingTab();
        if (e.key === 'Escape') setEditingTabId(null);
    };

    return (
        <div className="flex items-center px-2 bg-slate-100 border-b border-slate-200 shrink-0 overflow-x-auto pt-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <div className="flex space-x-1">
                {projects.map(proj => {
                    if (!proj) return null;
                    const isProjectActive = activeProjectId === proj.id;
                    const isEditing = editingTabId === proj.id;
                    const isFlowsheetActive = isProjectActive && (activeTabId === 'flowsheet' || !activeTabId);

                    return (
                        <React.Fragment key={proj.id}>
                            <div
                                className={`
                                  group relative flex items-center min-w-[160px] max-w-[240px] px-3 py-2 rounded-t-lg border-t border-x cursor-pointer select-none transition-all
                                  ${isProjectActive
                                        ? (isFlowsheetActive ? 'bg-white border-slate-200 border-b-white text-blue-700 font-bold z-10' : 'bg-slate-200/80 border-slate-200 text-slate-800 border-b-slate-200')
                                        : 'bg-slate-200 border-transparent text-slate-500 hover:bg-slate-300'
                                    }
                              `}
                                onClick={() => {
                                    onSelectProject(proj.id);
                                    if (isProjectActive && onSubTabSelect) onSubTabSelect('flowsheet');
                                }}
                                onDoubleClick={(e) => startRenamingTab(e, proj)}
                            >
                                <FolderOpen className={`w-3.5 h-3.5 mr-2 ${isProjectActive ? 'text-orange-500' : 'text-slate-400'}`} />

                                {isEditing ? (
                                    <input
                                        autoFocus
                                        type="text"
                                        value={tempTabName}
                                        onChange={(e) => setTempTabName(e.target.value)}
                                        onBlur={finishRenamingTab}
                                        onKeyDown={handleTabKeyDown}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full bg-white border border-blue-400 rounded px-1 py-0 text-xs focus:outline-none"
                                    />
                                ) : (
                                    <span className="text-xs truncate flex-1">{proj.name}</span>
                                )}

                                <button
                                    onClick={(e) => { e.stopPropagation(); onCloseProject(proj.id); }}
                                    className={`ml-2 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-300 transition-all ${isProjectActive ? 'opacity-100' : ''}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>

                                {isFlowsheetActive && <div className="absolute -bottom-px left-0 right-0 h-px bg-white"></div>}
                            </div>

                            {isProjectActive && activeProjectTabs.map(subTab => {
                                if (!subTab) return null;
                                const isSubTabActive = activeTabId === subTab.id;
                                
                                const renderIcon = () => {
                                    switch(subTab.type) {
                                        case 'node': return <Settings2 className="w-3 h-3 mr-2 text-orange-500"/>;
                                        case 'results': return <FileText className="w-3 h-3 mr-2 text-blue-500" />;
                                        case 'category': return <Sliders className="w-3 h-3 mr-2 text-purple-600" />;
                                        case 'economics': return <DollarSign className="w-3 h-3 mr-2 text-green-600" />;
                                        case 'charts': return <BarChart3 className="w-3 h-3 mr-2 text-blue-500" />;
                                        case 'optimization': return <Zap className="w-3 h-3 mr-2 text-orange-600" />;
                                        case 'connection': return <Waves className="w-3 h-3 mr-2 text-cyan-500" />;
                                        default: return <Waves className="w-3 h-3 mr-2 text-cyan-500"/>;
                                    }
                                };

                                return (
                                    <div 
                                        key={subTab.id}
                                        onClick={() => onSubTabSelect && onSubTabSelect(subTab.id)}
                                        className={`
                                            group relative flex items-center min-w-[120px] max-w-[200px] px-3 py-2 rounded-t-lg border-t border-x cursor-pointer select-none transition-all
                                            ${isSubTabActive 
                                                ? 'bg-white border-slate-200 border-b-white text-slate-800 font-bold z-10' 
                                                : 'bg-slate-100 border-transparent text-slate-500 hover:bg-slate-200 border-b-slate-200'
                                            }
                                        `}
                                    >
                                        {renderIcon()}
                                        <span className="text-xs truncate flex-1">{subTab.label}</span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onSubTabClose && onSubTabClose(subTab.id); }}
                                            className="ml-2 p-0.5 rounded-full hover:bg-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        {isSubTabActive && <div className="absolute -bottom-px left-0 right-0 h-px bg-white"></div>}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
                {showAddButton && (
                    <button
                        onClick={onNewProject}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors ml-1 mb-1"
                        title="Nova Simulação"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};