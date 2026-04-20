import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>({ totalCount: 0, queryTimeMs: 0 });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, page: 1, pageSize: 20 })
    })
      .then(res => res.json())
      .then(data => {
        setResults(data.results || []);
        // Backend returns totalCount and queryTimeMs at the root, not inside 'metadata'
        setMetadata({ 
          totalCount: data.totalCount ?? 0, 
          queryTimeMs: data.queryTimeMs ?? 0 
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query]);

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0A0A0A]">
      
      {/* Sidebar Filters */}
      <aside className="w-full md:w-64 shrink-0 bg-[#0A0A0A] border-r border-white/5 p-6 md:h-[calc(100vh-73px)] md:sticky md:top-[73px] overflow-y-auto hidden md:block custom-scrollbar">
        
        <div className="mb-10">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-4">View Mode</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 bg-[#121212] border border-white/10 rounded-sm flex items-center gap-2 text-sm text-[#864535] font-semibold">
              <span className="material-symbols-outlined text-[16px]">list</span> Detailed
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-[#121212]/50 text-white/50 hover:text-white rounded-sm flex items-center gap-2 text-sm transition-colors">
              <span className="material-symbols-outlined text-[16px]">grid_view</span> Grid
            </button>
          </div>
        </div>

        <div className="mb-10">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-4">Sources</h3>
          <div className="space-y-2">
            {['programming', 'javascript', 'python', 'machinelearning', 'devops', 'webdev'].map((topic) => (
              <label key={topic} className="flex items-center gap-3 group cursor-pointer">
                <input type="checkbox" defaultChecked={query.toLowerCase().includes(topic) || query === ''} className="accent-[#864535] w-4 h-4 bg-transparent border-white/20 rounded-sm" />
                <span className="text-sm text-white/60 group-hover:text-white transition-colors">r/{topic}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold mb-4">Content Type</h3>
          <div className="flex flex-wrap gap-2">
            {['Posts', 'Comments', 'Media'].map((type) => (
              <button key={type} className="px-3 py-1 bg-[#121212] border border-white/10 text-xs text-white/50 rounded-sm hover:border-white/30 hover:text-white transition-colors">
                {type}
              </button>
            ))}
          </div>
        </div>

      </aside>

      {/* Main Results */}
      <section className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-10 md:py-16">
          
          <header className="mb-12 border-b border-white/5 pb-8">
            <p className="label-caps text-[#864535] mb-2 font-bold">Search Query Intelligence</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-tight">
              {query || 'All Documents'}
            </h1>
            <p className="text-xs text-white/40 font-mono uppercase tracking-widest bg-[#121212] inline-block px-3 py-1 rounded-sm border border-white/5">
              {metadata.totalCount} results indexed in {metadata.queryTimeMs / 1000}s
            </p>
          </header>

          <div className="space-y-6">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-2 border-[#864535]/20 border-t-[#864535] animate-spin mb-4" />
                <p className="text-xs uppercase tracking-widest text-white/40">Querying semantic archive...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-20 text-center bg-[#1D1D1D] rounded-sm premium-card">
                <span className="material-symbols-outlined text-4xl text-white/10 mb-4 block">search_off</span>
                <p className="text-white/50 text-sm mb-6">No records found for <strong className="text-white">"{query}"</strong></p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['javascript', 'python', 'machine learning', 'rust'].map(q => (
                    <button key={q} onClick={() => navigate(`/search?q=${q}`)}
                      className="border border-white/10 hover:border-[#864535]/50 bg-[#121212] text-xs px-4 py-2 text-white/70 hover:text-[#864535] rounded-sm transition-colors">
                      Try "{q}"
                    </button>
                  ))}
                </div>
              </div>
            ) : results.map((result: any, i: number) => (
              <article 
                key={i} 
                className="premium-card group cursor-pointer p-6 transition-all duration-300 hover:border-[#864535]/30 hover:-translate-y-1 rounded-sm relative overflow-hidden" 
                onClick={() => navigate(`/post/${result.docId}`)}
              >
                {/* Decorative left bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#864535]/0 group-hover:bg-[#864535] transition-colors" />
                
                <div className="flex items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-bold text-[#864535] uppercase tracking-widest border border-[#864535]/20 px-2 py-0.5 rounded-sm bg-[#864535]/5">r/{result.metadata?.subreddit || 'Unknown'}</span>
                      <span className="text-[10px] text-white/40 font-mono">u/{result.metadata?.author || 'archivist'}</span>
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-serif text-white group-hover:text-[#864535] transition-colors leading-tight mb-3 pr-8">
                      {result.title}
                    </h3>
                    
                    <p className="text-sm text-white/60 leading-relaxed line-clamp-2" dangerouslySetInnerHTML={{ __html: result.snippet?.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white bg-white/10 px-1 rounded-sm">$1</strong>') || '' }} />
                  </div>
                  
                  <div className="flex flex-col gap-3 shrink-0">
                    <div className="flex items-center gap-2 bg-[#121212] border border-white/5 px-2 py-1 rounded-sm">
                      <span className="material-symbols-outlined text-[14px] text-[#864535]">thumb_up</span>
                      <span className="text-xs text-white font-mono">{result.metadata?.redditScore || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#121212] border border-white/5 px-2 py-1 rounded-sm">
                      <span className="material-symbols-outlined text-[14px] text-white/40">chat_bubble</span>
                      <span className="text-xs text-white/60 font-mono">{result.metadata?.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {results.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest">Page 1 of {Math.ceil(metadata.totalCount / 20)}</p>
              <button className="text-xs font-bold uppercase tracking-widest text-[#864535] flex items-center gap-2 hover:text-[#A35D4B] group border border-[#864535]/30 px-4 py-2 rounded-sm transition-colors hover:bg-[#864535]/10">
                Next Page <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}