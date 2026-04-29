import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            Loading active telemetry...
          </p>
        </div>
      </div>
    );

  if (!stats)
    return (
      <div className="flex-1 p-8 text-center bg-[#0A0A0A] flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-4xl text-white/10 mb-4 block">warning</span>
        <p className="text-white/50 text-[10px] uppercase tracking-widest">
          Failed to load system statistics.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-xs text-amber-500 hover:text-amber-400 border border-amber-500/30 bg-amber-500/5 px-4 py-2 rounded-sm outline-none focus:border-amber-500"
        >
          Retry Connection
        </button>
      </div>
    );

  return (
    <div className="flex-1 bg-[#0A0A0A] flex flex-col items-center">
      <div className="w-full max-w-5xl px-6 py-12 md:py-20 relative">
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        <header className="mb-16 border-b border-white/5 pb-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#121212] border border-white/10 rounded-full px-3 py-1 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold">
              System Operational
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 tracking-tight">
            Telemetry
          </h1>
          <p className="text-sm text-white/40 max-w-xl leading-relaxed">
            Real-time metrics on index density, semantic extraction, and overall engine performance.
          </p>
        </header>

        {/* Global Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 relative z-10">
          <div className="glass-panel p-6 rounded-sm border-l-2 border-l-amber-500">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
              Total Records
            </p>
            <p className="text-3xl font-mono font-bold text-white mb-1">
              {stats.totalDocuments ?? 0}
            </p>
            <p className="text-xs text-amber-500 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">trending_up</span> Live
              updating
            </p>
          </div>
          <div className="glass-panel p-6 rounded-sm border border-white/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
              Avg Search Time
            </p>
            <p className="text-3xl font-mono font-bold text-white mb-1">
              {(stats.averageSearchLatency || 0).toFixed(1)}{' '}
              <span className="text-sm text-white/30 font-sans">ms</span>
            </p>
            <p className="text-xs text-white/30">Target: &lt;50ms</p>
          </div>
          <div className="glass-panel p-6 rounded-sm border border-white/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
              Total Queries
            </p>
            <p className="text-3xl font-mono font-bold text-white mb-1">
              {stats.totalQueries ?? 0}
            </p>
            <p className="text-xs text-white/30">Last 24 hours</p>
          </div>
          <div className="glass-panel p-6 rounded-sm border border-white/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">Uptime</p>
            <p className="text-3xl font-mono font-bold text-white mb-1">
              {stats.uptime ? (stats.uptime / 3600).toFixed(1) : '0.0'}{' '}
              <span className="text-sm text-white/30 font-sans">hrs</span>
            </p>
            <p className="text-xs text-white/30">Current process</p>
          </div>
        </div>

        {/* Dense Data Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          {/* Subreddit Distribution */}
          <div>
            <h2 className="text-lg font-serif font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">list_alt</span>
              Index Distribution
            </h2>
            <div className="glass-panel rounded-sm">
              <div className="p-4 border-b border-white/5 flex gap-4 text-[10px] uppercase tracking-[0.2em] text-white/30 font-semibold bg-[#121212]">
                <div className="w-1/2">Collection</div>
                <div className="w-1/4 text-right">Records</div>
                <div className="w-1/4 text-right">Share</div>
              </div>
              <ul className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                {stats.documentsBySubreddit &&
                  Object.entries(stats.documentsBySubreddit).map(([sub, count]: any) => {
                    const perc =
                      stats.totalDocuments > 0
                        ? ((count / stats.totalDocuments) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <li key={sub}>
                        <button
                          onClick={() => navigate(`/search?q=${sub}`)}
                          className="w-full text-left p-3 flex gap-4 items-center hover:bg-[#1A1A1A] rounded-sm transition-colors group"
                        >
                          <div className="w-1/2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-amber-500 transition-colors" />
                            <span className="text-sm font-medium text-white/80 group-hover:text-white">
                              r/{sub}
                            </span>
                          </div>
                          <div className="w-1/4 text-right font-mono text-sm text-white/60">
                            {count}
                          </div>
                          <div className="w-1/4 text-right font-mono text-sm text-amber-500/70">
                            {perc}%
                          </div>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>

          {/* Popular Queries */}
          <div>
            <h2 className="text-lg font-serif font-bold text-white mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">trending_up</span>
              Query Intelligence
            </h2>
            <div className="flex flex-wrap gap-3">
              {stats.popularQueries && stats.popularQueries.length > 0 ? (
                stats.popularQueries.map((item: any) => (
                  <button
                    key={item.query}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(item.query)}`)}
                    className="flex items-center gap-3 bg-[#1A1A1A] border border-white/5 px-4 py-3 rounded-sm hover:-translate-y-0.5 hover:border-amber-500/30 hover:bg-[#262626] transition-all group"
                  >
                    <span className="text-lg text-white group-hover:text-amber-500 font-serif font-semibold">
                      {item.query}
                    </span>
                    <span className="text-[10px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded-sm">
                      {item.count}
                    </span>
                  </button>
                ))
              ) : (
                <div className="w-full py-12 text-center bg-[#121212] border border-white/5 rounded-sm border-dashed">
                  <span className="material-symbols-outlined text-white/10 text-3xl mb-2 block">
                    hourglass_empty
                  </span>
                  <p className="text-white/40 text-xs">Accumulating query data...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
