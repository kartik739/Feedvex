import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/documents/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.document) setDoc(data.document);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0A0A0A]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Retrieving Record...</p>
      </div>
    </div>
  );

  if (!doc) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-[#0A0A0A]">
      <span className="material-symbols-outlined text-4xl text-white/10 mb-2">find_in_page</span>
      <p className="text-white/50 text-xs uppercase tracking-widest">Record not found</p>
      <button onClick={() => navigate(-1)} className="premium-btn-outline mt-4 text-[10px]">
        ← Back to Results
      </button>
    </div>
  );

  return (
    <div className="flex-1 bg-[#0A0A0A] flex flex-col relative">

      {/* Decorative ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-amber-500/5 rounded-[100%] blur-[100px] pointer-events-none" />

      {/* Article Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-20 relative z-10">

        {/* Metadata Banner */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Link to={`/search?q=${doc.subreddit}`} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] uppercase tracking-widest px-3 py-1 font-bold rounded-sm hover:bg-amber-500 hover:text-[#0A0A0A] transition-colors">
            r/{doc.subreddit}
          </Link>
          <span className="text-white/40 text-xs font-mono">u/{doc.author}</span>
          <span className="text-white/20 text-xs">•</span>
          <span className="text-white/40 text-xs font-mono">
            {doc.createdUtc ? new Date(doc.createdUtc).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Archived'}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl md:text-5xl font-serif font-bold leading-[1.1] tracking-tight text-white mb-10">
          {doc.title}
        </h1>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-6 py-4 border-y border-white/10 mb-12 bg-[#121212]/50 px-4 rounded-sm">
          <div className="flex items-center gap-2 text-white/70">
            <span className="material-symbols-outlined text-[16px] text-amber-500">thumb_up</span>
            <span className="text-sm font-semibold font-mono">{(doc.redditScore || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
            <span className="text-sm font-semibold font-mono">{(doc.commentCount || 0).toLocaleString()}</span>
          </div>
          <div className="flex-1" />
          <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors group">
            <span className="material-symbols-outlined text-[16px] group-hover:text-amber-500 transition-colors">bookmark</span> Save
          </button>
          <button className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors group">
            <span className="material-symbols-outlined text-[16px] group-hover:text-amber-500 transition-colors">share</span> Share
          </button>
        </div>

        {/* Body Text */}
        <div className="prose prose-invert prose-stone max-w-none">
          {doc.content ? (
            <p className="text-white/80 text-lg leading-relaxed font-sans whitespace-pre-wrap">
              {doc.content}
            </p>
          ) : (
            <p className="text-white/40 italic">No text content in this post.</p>
          )}
        </div>

        {/* Reddit Link CTA */}
        <div className="mt-16 p-8 glass-panel rounded-sm flex flex-col sm:flex-row items-center justify-between gap-6 border border-amber-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 text-center sm:text-left">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Original Source</p>
            <p className="text-lg font-serif font-bold text-white">Join the discussion on Reddit</p>
            <p className="text-sm text-white/40 mt-1">Read all {doc.commentCount || 0} comments</p>
          </div>
          <a href={doc.url} target="_blank" rel="noopener noreferrer"
            className="relative z-10 bg-amber-500 text-black px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-amber-400 transition-colors rounded-sm flex items-center gap-2 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            Open thread <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>

      </main>
    </div>
  );
}