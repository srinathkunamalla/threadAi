import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Bookmark, Check, CheckCheck, ChevronDown,
  CircleHelp, Clipboard, Clock3, Copy, FileText, History, Lightbulb,
  LoaderCircle, Menu, MessageCircle, MessageSquareQuote, Plus, RotateCcw,
  Settings2, ShieldCheck, Sparkles, Trash2, WandSparkles, X,
  Zap, Linkedin, ExternalLink, PenLine
} from 'lucide-react';
import type { Draft, GenerateInput, GenerateResult, Length, Perspective, SavedDraft } from './types';

const EXAMPLE_POST = `Most teams think an AI agent is just an LLM with tool calling. But in production, durable execution, permissions, memory, and reliable evaluation all have to work together. The hard part isn't generating an answer; it's ensuring the right action happens safely, especially when an agent retries after a timeout.`;
const perspectives: { id: Perspective; title: string; desc: string; icon: typeof Lightbulb }[] = [
  { id: 'technical', title: 'Technical', desc: 'Architecture & trade-offs', icon: Settings2 },
  { id: 'leadership', title: 'Leadership', desc: 'Teams & strategy', icon: Lightbulb },
  { id: 'conversational', title: 'Conversational', desc: 'Human & approachable', icon: MessageCircle }
];
const kinds = [
  { eyebrow: 'OPTION 01', icon: Zap, css: 'indigo' },
  { eyebrow: 'OPTION 02', icon: Lightbulb, css: 'orange' },
  { eyebrow: 'OPTION 03', icon: MessageCircle, css: 'teal' }
] as const;
const lengthNames: Record<Length, string> = { short: 'Concise', balanced: 'Balanced', detailed: 'Detailed' };
const storageKey = 'threadcraft:saved:v1';
const countWords = (str: string) => str.trim() ? str.trim().split(/\s+/).length : 0;
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
function fromStorage(): SavedDraft[] {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((v): v is SavedDraft => typeof v?.id === 'string' && typeof v?.text === 'string' && typeof v?.createdAt === 'string').slice(0, 60);
  } catch { return []; }
}

export default function App() {
  const [active, setActive] = useState<'compose' | 'saved' | 'guide'>('compose');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [postText, setPostText] = useState(EXAMPLE_POST);
  const [perspective, setPerspective] = useState<Perspective>('technical');
  const [length, setLength] = useState<Length>('balanced');
  const [context, setContext] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saved, setSaved] = useState<SavedDraft[]>(fromStorage);
  const [serverMode, setServerMode] = useState<'live' | 'demo' | 'offline'>('offline');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showMobileActions, setShowMobileActions] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/health').then(async r => { if (!r.ok) throw Error(); return r.json(); })
      .then(d => setServerMode(d.mode === 'live' ? 'live' : 'demo'))
      .catch(() => setServerMode('offline'));
  }, []);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(saved.slice(0, 60))); } catch { /* browser storage disabled */ }
  }, [saved]);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }
  function switchTab(tab: 'compose' | 'saved' | 'guide') {
    setActive(tab);
    setSidebarOpen(false);
    setShowMobileActions(false);
  }
  async function generate() {
    setError('');
    if (postText.trim().length < 30) { setError('Add at least 30 characters from the LinkedIn post.'); return; }
    if (postText.length > 8000) { setError('The post must be under 8,000 characters.'); return; }
    setIsGenerating(true);
    try {
      const payload: GenerateInput = { postText, perspective, length, context };
      const response = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data: GenerateResult & { error?: string } = await response.json();
      if (!response.ok) throw Error(data.error || 'Something went wrong.');
      if (!Array.isArray(data.drafts) || data.drafts.length !== 3) throw Error('Unexpected response from the server.');
      setDrafts(data.drafts);
      setResult(data);
      setServerMode(data.mode);
      notify(data.mode === 'live' ? '3 AI drafts are ready to review' : '3 demo drafts are ready to explore');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to generate drafts.');
    } finally { setIsGenerating(false); }
  }
  async function copyDraft(value: string) {
    try { await navigator.clipboard.writeText(value); notify('Copied to clipboard'); }
    catch { notify('Copy unavailable — select the text manually'); }
  }
  function saveDraft(draft: Draft) {
    const exists = saved.some(d => d.text.trim() === draft.text.trim());
    if (exists) { notify('Already in your saved drafts'); return; }
    setSaved(prev => [{ id: uid(), text: draft.text, kind: draft.kind, createdAt: new Date().toISOString(), sourcePreview: postText.slice(0, 135) }, ...prev].slice(0, 60));
    notify('Added to saved drafts');
  }
  function updateDraft(i: number, text: string) {
    setDrafts(prev => prev.map((d, idx) => idx === i ? { ...d, text } : d));
  }
  function resetComposer() {
    setPostText(''); setContext(''); setDrafts([]); setResult(null); setError('');
    setPerspective('technical'); setLength('balanced'); notify('Ready for a new post');
  }

  return <div className="app-shell">
    {sidebarOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><MessageSquareQuote size={22} strokeWidth={2.5} /></div>
        <div className="brand-copy"><b>threadcraft<span>.</span></b><small>AI COMMENT STUDIO</small></div>
        <button className="sidebar-x icon-button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"><X size={18} /></button>
      </div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav-stack" aria-label="Main navigation">
        <button className={`nav-link ${active === 'compose' ? 'selected' : ''}`} onClick={() => switchTab('compose')}><WandSparkles size={18} /><span>Comment studio</span>{active === 'compose' && <span className="nav-indicator" />}</button>
        <button className={`nav-link ${active === 'saved' ? 'selected' : ''}`} onClick={() => switchTab('saved')}><Bookmark size={18} /><span>Saved drafts</span><span className="nav-count">{saved.length}</span></button>
        <button className={`nav-link ${active === 'guide' ? 'selected' : ''}`} onClick={() => switchTab('guide')}><CircleHelp size={18} /><span>How it works</span></button>
      </nav>
      <div className="sidebar-separator" />
      <div className="workspace-label">YOUR WORKFLOW</div>
      <div className="sidebar-steps">
        <div><span>01</span><p>Pick a great post</p></div>
        <div><span>02</span><p>Shape your viewpoint</p></div>
        <div><span>03</span><p>Make it your own</p></div>
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><div className="tip-icon"><Sparkles size={17}/></div><strong>Good comments start with a real point of view.</strong><p>AI helps you express it. You bring the expertise.</p></div>
        <div className="sidebar-footer"><ShieldCheck size={15} /> Human-reviewed by design</div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <span className="breadcrumb">Workspace</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{active === 'compose' ? 'Comment studio' : active === 'saved' ? 'Saved drafts' : 'How it works'}</span>
        </div>
        <div className="topbar-right">
          <span className={`mode-pill ${serverMode}`}><span className="status-dot" />{serverMode === 'live' ? 'AI connected' : serverMode === 'demo' ? 'Demo mode' : 'Connecting...'}</span>
          <div className="avatar">TC</div>
        </div>
      </header>

      <div className="content">
        {active === 'compose' && <>
          <section className="hero">
            <div className="hero-content"><div className="hero-eyebrow"><Sparkles size={14} /> YOUR WRITING CO-PILOT</div><h1>Make every<br/><em>comment count.</em></h1><p>Turn an interesting post into a thoughtful conversation. Your perspective, thoughtfully amplified.</p></div>
            <div className="hero-graphic" aria-hidden="true"><div className="glow-orb orb-one"/><div className="glow-orb orb-two"/><div className="floating-card back-card"><span></span><span></span><span></span></div><div className="floating-card front-card"><div className="mini-spark"><Sparkles size={18} /></div><div className="mini-lines"><span></span><span></span><span></span></div><div className="mini-check"><Check size={16}/></div></div><div className="float-star"><Sparkles size={26}/></div></div>
          </section>

          <div className="section-heading"><div><h2>Your workspace</h2><p>One great comment at a time.</p></div><button className="plain-action" onClick={resetComposer}><RotateCcw size={15}/> Start fresh</button></div>
          <div className="studio-grid">
            <section className="input-panel panel">
              <div className="panel-heading"><div className="step-badge">1</div><div><h3>Start with a post</h3><p>What sparked your interest?</p></div><span className="panel-tag">INPUT</span></div>
              <div className="editor-wrapper"><div className="editor-topline"><Linkedin size={17} fill="currentColor"/><span>LINKEDIN POST CONTENT</span></div><textarea aria-label="LinkedIn post content" value={postText} onChange={e => setPostText(e.target.value)} placeholder="Paste a LinkedIn post here to get started..." className="post-input" maxLength={8000}/><div className="editor-footer"><span>{postText.length.toLocaleString()} / 8,000 characters</span><button onClick={() => {setPostText(EXAMPLE_POST); setError(''); notify('Sample post loaded');}} className="text-link">Try sample post <ArrowRight size={14}/></button></div></div>
              <div className="control-header"><div><h4>Choose your perspective</h4><p>How should your comment sound?</p></div></div>
              <div className="perspective-grid">
                {perspectives.map(p => <button key={p.id} className={`perspective-option ${perspective === p.id ? 'is-active' : ''}`} onClick={() => setPerspective(p.id)}><p.icon size={21}/><strong>{p.title}</strong><small>{p.desc}</small>{perspective === p.id && <span className="selected-check"><Check size={11}/></span>}</button>)}
              </div>
              <div className="two-controls"><div className="length-control"><h4>Comment length</h4><div className="segmented" aria-label="Comment length">{(['short', 'balanced', 'detailed'] as Length[]).map(l => <button key={l} className={length === l ? 'on' : ''} onClick={() => setLength(l)}>{lengthNames[l]}</button>)}</div></div></div>
              <div className="extra-context"><button className="context-toggle" onClick={() => setShowContext(v => !v)}><span><Plus size={17} /> Add your own experience <small>(optional)</small></span><ChevronDown size={17} className={showContext ? 'rotate' : ''}/></button>{showContext && <div className="context-body"><textarea value={context} onChange={e => setContext(e.target.value)} maxLength={1200} placeholder="For example: I've worked on payment retries and idempotency in distributed checkout systems..." rows={3} aria-label="Your experience"/><p>Only add experiences that are genuinely yours. The AI won't invent them.</p></div>}</div>
              {error && <div className="error-banner" role="alert">{error}</div>}
              <button className="generate-button" disabled={isGenerating || postText.trim().length < 30 || postText.length > 8000 || serverMode === 'offline'} onClick={generate}>{isGenerating ? <><LoaderCircle className="spin" size={19}/> Creating your drafts...</> : <><Sparkles size={19}/> Generate thoughtful comments <ArrowRight size={18}/></>}</button>
              <p className="generate-note"><ShieldCheck size={14}/> Drafts are never posted automatically. You stay in control.</p>
            </section>

            <section className="output-panel panel">
              <div className="panel-heading"><div className="step-badge purple">2</div><div><h3>Your comment drafts</h3><p>Review, refine & make it yours.</p></div><span className="panel-tag">OUTPUT</span></div>
              {result ? <>
                {result.mode === 'demo' && <div className="demo-banner"><CircleHelp size={17}/><span><strong>Demo suggestions</strong> — illustrative templates, not AI-generated. Add an API key for tailored AI comments.</span></div>}
                <div className="summary-box"><div className="summary-label"><Lightbulb size={15}/> WHAT THIS POST IS ABOUT</div><p>{result.postSummary}</p></div>
                <div className="draft-list">{drafts.map((draft, i) => {
                  const kind = kinds[i]; const Icon = kind.icon;
                  return <article className="draft-card" key={i}>
                    <div className="draft-top"><div className={`draft-icon ${kind.css}`}><Icon size={17}/></div><div className="draft-titles"><span>{kind.eyebrow} · {draft.kind}</span><h4>{draft.title}</h4></div><span className="draft-wordcount">{countWords(draft.text)} words</span></div>
                    <textarea aria-label={`Edit ${draft.kind} draft`} className="draft-content" value={draft.text} onChange={e => updateDraft(i, e.target.value)} rows={Math.min(8, Math.max(4, Math.ceil(draft.text.length / 55)))}/>
                    <div className="draft-why"><Sparkles size={12}/>{draft.why}</div>
                    <div className="draft-actions"><button onClick={() => saveDraft(draft)}><Bookmark size={15}/> Save</button><button className="copy-btn" onClick={() => copyDraft(draft.text)}><Copy size={15}/> Copy draft</button></div>
                  </article>;
                })}</div>
                <button className="regenerate-btn" onClick={generate} disabled={isGenerating}><RotateCcw size={16}/> Generate new options</button>
              </> : <div className="empty-output"><div className="empty-illustration"><div className="empty-large"><MessageSquareQuote size={36}/></div><div className="empty-small"><Sparkles size={17}/></div></div><h3>Your ideas, beautifully expressed.</h3><p>Your three personalized comment options will appear here. Pick one, edit it, and make the conversation yours.</p><div className="empty-steps"><span><CheckCheck size={14}/> Three distinct angles</span><span><PenLine size={14}/> Fully editable drafts</span><span><Clipboard size={14}/> One-click copy</span></div></div>}
            </section>
          </div>
          <div className="bottom-note"><div><ShieldCheck size={20}/><div><strong>A thoughtful voice is your best differentiator.</strong><p>Review every draft for accuracy and add your real expertise before sharing.</p></div></div><button onClick={() => switchTab('guide')}>Our approach <ArrowRight size={16}/></button></div>
        </>}

        {active === 'saved' && <section className="secondary-view"><div className="view-kicker"><Bookmark size={16}/> YOUR LIBRARY</div><div className="view-header"><div><h1>Saved drafts<span className="accent-period">.</span></h1><p>Thoughts worth keeping, ready whenever you are.</p></div><button className="small-primary" onClick={() => switchTab('compose')}><Plus size={16}/> New comment</button></div>
          {saved.length ? <div className="saved-grid">{saved.map(item => <article className="saved-card" key={item.id}><div className="saved-meta"><span className="saved-type"><Bookmark size={14}/>{item.kind}</span><span><Clock3 size={13}/>{new Date(item.createdAt).toLocaleDateString()}</span></div><textarea aria-label="Edit saved draft" value={item.text} onChange={e => setSaved(prev => prev.map(d => d.id === item.id ? {...d, text: e.target.value} : d))} rows={6}/><div className="saved-source">Based on: {item.sourcePreview || 'Your post'}</div><div className="saved-actions"><button onClick={() => setSaved(prev => prev.filter(d => d.id !== item.id))} className="delete-button" title="Delete saved draft"><Trash2 size={16}/></button><button className="copy-btn" onClick={() => copyDraft(item.text)}><Copy size={15}/> Copy draft</button></div></article>)}</div> : <div className="no-saved"><Bookmark size={30}/><h3>No saved drafts yet</h3><p>Generate a few comments and save the ones you want to revisit. Your drafts stay in this browser.</p><button className="small-primary" onClick={() => switchTab('compose')}>Open comment studio <ArrowRight size={16}/></button></div>}
          <div className="storage-notice"><ShieldCheck size={16}/> Drafts are stored locally in this browser, not in a cloud account. Clearing browser storage removes them.</div>
        </section>}

        {active === 'guide' && <section className="secondary-view guide-view"><div className="view-kicker"><CircleHelp size={16}/> A BETTER WAY TO ENGAGE</div><div className="view-header"><div><h1>How it works<span className="accent-period">.</span></h1><p>Useful conversations, without the automated noise.</p></div><button className="small-primary" onClick={() => switchTab('compose')}>Try the studio <ArrowRight size={16}/></button></div><div className="guide-grid">
          <div className="guide-card"><div className="guide-number">01</div><FileText size={25}/><h3>Bring a real post</h3><p>Copy the text of a LinkedIn post you actually care about. This app does not scrape LinkedIn or access your account.</p></div>
          <div className="guide-card"><div className="guide-number">02</div><WandSparkles size={25}/><h3>Explore three perspectives</h3><p>Generate an insight, a fresh angle, and a conversation starter tailored to your chosen voice and real experience.</p></div>
          <div className="guide-card"><div className="guide-number">03</div><PenLine size={25}/><h3>Review and publish yourself</h3><p>Fix any inaccurate claims, add your personal judgment, copy the final wording and publish it yourself on LinkedIn.</p></div></div>
          <div className="guide-principles"><h3>Built around trust</h3><div><ShieldCheck size={22}/><p><strong>Human review, always.</strong> The application has no LinkedIn publishing integration and cannot post comments on your behalf.</p></div><div><History size={22}/><p><strong>Your drafts stay on your device.</strong> Saved comments are held in your browser's local storage. Posts entered for live generation are sent to your configured server and OpenAI API.</p></div><div><Sparkles size={22}/><p><strong>No fake credibility.</strong> The generation instructions prohibit invented experiences, achievements, or metrics.</p></div></div>
          <a className="docs-link" href="https://developers.openai.com/api/docs/quickstart" target="_blank" rel="noreferrer">OpenAI API setup guide <ExternalLink size={15}/></a>
        </section>}
      </div>
      <footer className="footer"><span>© 2026 Threadcraft Studio</span><span>Better conversations, by design. <Sparkles size={13}/></span></footer>
    </main>
    {toast && <div className="toast" role="status"><Check size={17}/>{toast}</div>}
    {showMobileActions && <div className="mobile-action-sheet"><button onClick={() => {switchTab('saved'); setShowMobileActions(false)}}><Bookmark size={16}/> Saved drafts</button><button onClick={() => {resetComposer(); setShowMobileActions(false)}}><RotateCcw size={16}/> Start fresh</button></div>}
    <button className="floating-mobile-button" aria-label="Quick actions" onClick={() => setShowMobileActions(v => !v)}>{showMobileActions ? <X size={21}/> : <Plus size={22}/>}</button>
  </div>;
}
