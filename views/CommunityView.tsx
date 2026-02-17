
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  ThumbsUp, 
  User, 
  Plus, 
  Search, 
  PenTool,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  ArrowLeft,
  X,
  Loader2,
  Paperclip,
  ExternalLink,
  Award,
  CheckCircle2,
  ChevronRight,
  File as FileIcon,
  Activity,
  AlertCircle
} from 'lucide-react';
import { EquipmentType } from '../types';
import { supabase } from '../services/supabaseClient';

interface Attachment {
    type: 'link' | 'image' | 'pdf';
    url: string;
    name: string;
}

interface Discussion {
    id: string;
    title: string;
    author: string;
    author_id: string;
    authorAvatar: string | null;
    date: string;
    preview: string;
    fullContent: string;
    type: 'discussion' | 'research' | 'event';
    tags: string[];
    views: number;
    likes: number;
    hasLiked: boolean;
    isSolved: boolean;
    attachments: Attachment[];
}

interface CommunityViewProps {
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        subtitle?: string;
        credits?: number;
    } | null;
    onNavigate?: (view: EquipmentType) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'discussions' | 'publish' | 'profile'>('discussions');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<{posts_count: number, total_likes: number} | null>(null);
  
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados do Formulário de Publicação
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAttachUrl, setNewAttachUrl] = useState('');
  const [newAttachName, setNewAttachName] = useState('');
  const [newAttachType, setNewAttachType] = useState<'link' | 'image' | 'pdf'>('link');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          likes:community_likes(count)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const mapped: Discussion[] = (posts || []).map(p => ({
        id: p.id,
        title: p.title,
        author: p.profiles?.full_name || 'Usuário',
        author_id: p.user_id,
        authorAvatar: p.profiles?.avatar_url || null,
        date: new Date(p.created_at).toLocaleDateString('pt-BR'),
        preview: p.content.substring(0, 150) + '...',
        fullContent: p.content,
        type: p.type,
        tags: p.tags || [],
        views: p.views || 0,
        likes: p.likes?.[0]?.count || 0,
        hasLiked: false,
        isSolved: p.is_solved,
        attachments: p.attachments || []
      }));

      setDiscussions(mapped);

      if (user) {
          const { data: stats } = await supabase.rpc('get_community_user_stats', { p_user_id: user.id });
          setUserStats(stats);
      }
    } catch (err: any) {
      setError("Falha ao carregar a comunidade.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddAttachment = () => {
      if (!newAttachUrl || !newAttachName) return;
      setAttachments([...attachments, { type: newAttachType, url: newAttachUrl, name: newAttachName }]);
      setNewAttachUrl(''); setNewAttachName('');
  };

  const handlePublish = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !title.trim() || !content.trim()) return;

      setIsSubmitting(true);
      try {
          const { error: postErr } = await supabase.from('community_posts').insert({
              user_id: user.id,
              title,
              content,
              type: 'discussion',
              attachments: attachments
          });
          if (postErr) throw postErr;

          setTitle(''); setContent(''); setAttachments([]);
          await fetchData();
          setActiveTab('discussions');
      } catch (err: any) {
          alert("Erro: " + err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  const activePost = discussions.find(d => d.id === selectedPostId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Banner Superior */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-600 rounded-full opacity-10 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black mb-2 uppercase tracking-tight">Community Hub</h1>
            <p className="text-slate-400 max-w-xl">O centro de inteligência compartilhada para engenharia mineral.</p>
          </div>
          <div className="flex space-x-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar..."
                    className="pl-10 pr-4 py-3 w-full bg-slate-800 border-none text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
             </div>
             <button onClick={() => { setActiveTab('publish'); setSelectedPostId(null); }} className="px-6 py-3 bg-orange-600 text-white font-black uppercase text-[11px] tracking-widest rounded-xl hover:bg-orange-700 transition-all shadow-lg">
                Novo Post
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Navegação de Abas */}
          <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-2xl shadow-sm">
            {[
                { id: 'discussions', label: 'Discussões', icon: MessageSquare },
                { id: 'publish', label: 'Publicar', icon: PenTool },
                { id: 'profile', label: 'Meu Perfil', icon: User }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setSelectedPostId(null); }} 
                    className={`px-8 py-5 font-bold text-xs uppercase tracking-widest flex items-center border-b-2 transition-all ${activeTab === tab.id ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <tab.icon className="w-4 h-4 mr-2" /> {tab.label}
                </button>
            ))}
          </div>

          {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-600" />
                  <p className="font-bold uppercase tracking-widest text-[10px]">Acessando Database...</p>
              </div>
          ) : selectedPostId && activePost ? (
              <div className="animate-in slide-in-from-right-4">
                  <button onClick={() => setSelectedPostId(null)} className="mb-6 flex items-center text-slate-500 hover:text-blue-600 font-bold text-xs uppercase tracking-widest">
                      <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                  </button>
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                      <h1 className="text-2xl font-black text-slate-900 mb-6">{activePost.title}</h1>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-8">{activePost.fullContent}</p>

                      {activePost.attachments && activePost.attachments.length > 0 && (
                          <div className="pt-8 border-t border-slate-100">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                                  <Paperclip className="w-3.5 h-3.5 mr-2" /> Arquivos e Referências
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {activePost.attachments.map((at, i) => (
                                      <a key={i} href={at.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                                          <div className="p-3 bg-white rounded-xl mr-4 shadow-sm group-hover:text-blue-600">
                                            {at.type === 'image' ? <ImageIcon className="w-5 h-5" /> : at.type === 'pdf' ? <FileIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{at.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">{at.type}</p>
                                          </div>
                                          <ExternalLink className="w-4 h-4 text-slate-300" />
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          ) : activeTab === 'publish' ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in slide-in-from-bottom-4">
                  <h2 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Nova Postagem Técnica</h2>
                  <form onSubmit={handlePublish} className="space-y-6">
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-orange-500" placeholder="Título da Discussão" required />
                      <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-800 resize-none focus:ring-2 focus:ring-orange-500" placeholder="O que você deseja compartilhar?" required />
                      
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center"><Paperclip className="w-4 h-4 mr-2 text-orange-600" /> Anexar Documentos ou Fotos</h4>
                          <div className="flex flex-col sm:flex-row gap-3">
                              <select value={newAttachType} onChange={e => setNewAttachType(e.target.value as any)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none">
                                  <option value="link">Link</option>
                                  <option value="image">Imagem</option>
                                  <option value="pdf">PDF</option>
                              </select>
                              <input type="text" value={newAttachName} onChange={e => setNewAttachName(e.target.value)} placeholder="Nome" className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none" />
                              <input type="text" value={newAttachUrl} onChange={e => setNewAttachUrl(e.target.value)} placeholder="URL do arquivo" className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none" />
                              <button type="button" onClick={handleAddAttachment} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs">Anexar</button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {attachments.map((at, i) => (
                                  <div key={i} className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-slate-100">
                                      <div className="flex items-center min-w-0">
                                          {at.type === 'image' ? <ImageIcon className="w-3.5 h-3.5 mr-2 text-blue-500" /> : <FileIcon className="w-3.5 h-3.5 mr-2 text-slate-400" />}
                                          <span className="text-[10px] font-bold text-slate-700 truncate">{at.name}</span>
                                      </div>
                                      <button type="button" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 ml-2"><X className="w-4 h-4" /></button>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-orange-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-orange-700 transition-all disabled:opacity-50">
                          {isSubmitting ? 'Publicando...' : 'Publicar Agora'}
                      </button>
                  </form>
              </div>
          ) : activeTab === 'profile' ? (
              <div className="space-y-6 animate-in fade-in">
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-8">
                      <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shrink-0">
                          {user?.name?.charAt(0)}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user?.name}</h2>
                          <p className="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">{user?.subtitle || 'Engenheiro de Processos'}</p>
                          <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 mt-8">
                              <div className="text-center px-8 py-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                  <p className="text-2xl font-black text-slate-900 leading-none">{userStats?.posts_count || 0}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Posts</p>
                              </div>
                              <div className="text-center px-8 py-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                  <p className="text-2xl font-black text-slate-900 leading-none">{userStats?.total_likes || 0}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Likes Recebidos</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
                      <h3 className="font-black text-slate-900 mb-6 flex items-center uppercase text-xs tracking-widest"><FileText className="w-4 h-4 mr-3 text-blue-600" /> Meu Histórico de Postagens</h3>
                      <div className="space-y-4">
                          {discussions.filter(d => d.author_id === user?.id).length === 0 ? (
                              <p className="text-center py-10 text-slate-400 italic">Você ainda não realizou postagens.</p>
                          ) : (
                              discussions.filter(d => d.author_id === user?.id).map(post => (
                                  <div key={post.id} onClick={() => setSelectedPostId(post.id)} className="p-5 border border-slate-100 rounded-2xl hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer flex justify-between items-center group">
                                      <div>
                                          <p className="font-bold text-slate-900 group-hover:text-blue-600 text-lg">{post.title}</p>
                                          <div className="flex items-center space-x-4 mt-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{post.date}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">• {post.likes} LIKES</span>
                                          </div>
                                      </div>
                                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-all" />
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              </div>
          ) : (
              <div className="space-y-4">
                  {discussions.map(post => (
                      <div key={post.id} onClick={() => setSelectedPostId(post.id)} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer group">
                          <h3 className="text-xl font-black text-slate-900 group-hover:text-orange-600 transition-colors mb-4 leading-tight">{post.title}</h3>
                          <p className="text-slate-500 text-sm line-clamp-2 mb-8 leading-relaxed">{post.preview}</p>
                          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                              <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">{post.author.charAt(0)}</div>
                                  <div>
                                     <span className="text-xs font-bold text-slate-700 block">{post.author}</span>
                                     <span className="text-[10px] text-slate-400 font-bold uppercase">{post.date}</span>
                                  </div>
                              </div>
                              <div className="flex space-x-4 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                  <span className="flex items-center"><ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> {post.likes}</span>
                                  <span className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg"><Paperclip className="w-3.5 h-3.5 mr-1.5" /> {post.attachments?.length || 0} ANEXOS</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
        </div>

        {/* Barra Lateral Direita */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 uppercase text-xs tracking-widest flex items-center"><Award className="w-4 h-4 mr-2 text-orange-600" /> Ranking Experts</h3>
              <div className="space-y-4">
                 {[
                    { name: "Eng. Mateus Silva", badge: "Diamante", score: 1250 },
                    { name: "Expert_Minas_99", badge: "Ouro", score: 890 }
                 ].map((colab, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs">{colab.name.charAt(0)}</div>
                          <div>
                             <p className="text-sm font-bold text-slate-900">{colab.name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">{colab.badge}</p>
                          </div>
                       </div>
                       <span className="text-xs font-mono font-bold text-emerald-600">+{colab.score}</span>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[40px] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-orange-600 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all"></div>
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center">Insight da Rede <Activity className="w-4 h-4 ml-2 text-orange-500" /></h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                 O uso de reagentes depressores biodegradáveis em circuitos de molibdenita pode reduzir o custo ambiental em até 15% sem perda de recuperação.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
