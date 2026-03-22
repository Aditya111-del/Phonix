import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { marketsAPI } from "@/api";
import { Send, Plus, Trash2, MessageSquare, TrendingUp, ChevronRight, Sparkles, Menu, X } from "lucide-react";
import Navbar from "@/components/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  symbol?: string | null;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  symbol?: string | null;
  preview: string;
  messageCount: number;
  updatedAt: string;
}

// ── Markdown Renderer ──────────────────────────────────────────────────────────

function renderMarkdown(raw: string): string {
  // Escape HTML first
  let text = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // ── Protected Code Blocks ──────────────────────────────────────────────────
  const codeBlocks: string[] = [];
  text = text.replace(/```([a-z0-9]+)?\r?\n([\s\S]*?)```/gi, (match, lang, code) => {
    const blockIndex = codeBlocks.length;
    const displayLang = (lang || 'PLAINTEXT').toUpperCase();
    codeBlocks.push(`
      <div class="my-6 rounded-[10px] overflow-hidden bg-[#111113] border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] font-sans phonix-code-block">
        <div class="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/5">
          <span class="text-[10px] font-mono text-zinc-500 font-semibold tracking-widest code-lang-label">${displayLang}</span>
          <div class="flex items-center gap-1">
            <button class="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-all code-copy-btn pointer-events-auto">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>COPY</span>
            </button>
            <div class="w-[1px] h-3 bg-white/10"></div>
            <button class="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-all code-dl-btn pointer-events-auto">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              <span>DOWNLOAD</span>
            </button>
          </div>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre class="text-[13px] font-mono text-zinc-300 pointer-events-auto select-text break-words whitespace-pre-wrap"><code class="code-raw-text">${code.trim()}</code></pre>
        </div>
      </div>
    `);
    return `@@CODE_BLOCK_${blockIndex}@@`;
  });

  // Tables: detect pipe-separated rows and create sleek Perplexity-style tables
  text = text.replace(/((\|.+\|\r?\n)+)/g, (tableBlock) => {
    const rows = tableBlock.trim().split(/\r?\n/);
    let html = '<div class="overflow-hidden rounded-[10px] border border-white/5 my-6 bg-[#1c1c1e]"><table class="w-full text-[14px] border-collapse">';
    rows.forEach((row, i) => {
      if (/^\|[-:| ]+\|$/.test(row.trim())) return; // skip separator row
      const cells = row.split("|").filter((_, ci) => ci > 0 && ci < row.split("|").length - 1);
      const tag = i === 0 ? "th" : "td";
      const rowClass = i === 0
        ? 'class="bg-white/5 border-b border-white/5 text-left"'
        : i !== rows.length - 1 
          ? 'class="border-b border-white/5 text-left transition-colors hover:bg-white/[0.02]"'
          : 'class="text-left transition-colors hover:bg-white/[0.02]"';
      html += `<tr ${rowClass}>${cells.map(c => `<${tag} class="px-5 py-3.5 ${tag === "th" ? "font-medium text-zinc-300" : "text-zinc-300 font-normal"}">${c.trim()}</${tag}>`).join("")}</tr>`;
    });
    html += "</table></div>";
    return html;
  });

  // Headers (Perplexity style: subtle, slightly larger, slightly muted)
  text = text
    .replace(/^### (.+)$/gm, '<h4 class="text-[15px] font-semibold text-zinc-100 mt-6 mb-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold text-zinc-100 mt-8 mb-3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="text-lg font-semibold text-zinc-100 mt-8 mb-4">$1</h2>');

  // Bold & italic
  text = text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-zinc-100">$1</strong>')
    .replace(/__(.+?)__/g, '<strong class="font-semibold text-zinc-100">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-zinc-300 italic">$1</em>');

  // Bullet lists — wrap consecutive <li> items
  text = text.replace(/^[-*] (.+)$/gm, '<li class="ml-5 list-disc text-zinc-300 marker:text-zinc-600 mb-2 leading-relaxed pl-1">$1</li>');
  text = text.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-5 list-decimal text-zinc-300 marker:text-zinc-600 mb-2 leading-relaxed pl-1">$2</li>');
  text = text.replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, (block) => `<ul class="my-4">${block}</ul>`);

  // Horizontal rule
  text = text.replace(/^---+$/gm, '<hr class="border-white/[0.08] my-8" />');

  // Inline Source Badges (Clickable pills with favicons)
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, (match, label, url) => {
    try {
      const domain = new URL(url).hostname;
      const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[#18181b] hover:bg-white/[0.04] transition-colors text-[13px] font-medium text-zinc-300 rounded-[6px] border border-white/10 align-middle mr-2 mt-1 mb-1 pointer-events-auto shadow-sm" title="${url}"><img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="" class="w-4 h-4 rounded-sm object-contain bg-white pb-[1px]" />${formattedLabel}</a>`;
    } catch {
      return `<a href="${url}" target="_blank" class="text-primary hover:underline">${label}</a>`;
    }
  });

  // Inline code tags
  text = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-white/10 text-[13px] font-mono text-zinc-300 rounded border border-white/5">$1</code>');

  // Paragraphs
  text = text.replace(/\n\n/g, '</p><p class="mb-5 text-[15px] text-zinc-300 leading-[1.65]">');
  text = text.replace(/\n/g, "<br />");
  text = `<p class="mb-5 text-[15px] text-zinc-300 leading-[1.65]">${text}</p>`;

  // Restore protected blocks (Tables and Code)
  codeBlocks.forEach((block, index) => {
    text = text.replace(`@@CODE_BLOCK_${index}@@`, `</p>${block}<p class="mb-5 text-[15px] text-zinc-300 leading-[1.65]">`);
  });

  // Clean up any empty lingering P tags
  text = text.replace(/<p[^>]*><\/p>/g, '');

  return text;
}

// ── Time formatter ─────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(date).toLocaleDateString();
}

// ── Suggestion Chips ───────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: "🍎", label: "Analyze Apple", query: "Analyze Apple stock — price targets and trading signal" },
  { icon: "⚡", label: "Tesla outlook", query: "What is Tesla's current outlook? Buy or sell?" },
  { icon: "₿", label: "Bitcoin", query: "Bitcoin market analysis — bullish or bearish right now?" },
  { icon: "📊", label: "Market pulse", query: "Give me today's overall market sentiment and top stocks to watch" },
  { icon: "🟢", label: "Nvidia AI", query: "Nvidia stock analysis — is the AI rally still valid?" },
  { icon: "💰", label: "S&P 500", query: "Analyze the S&P 500 — current trend and 30-day outlook" },
];

// ── Component ──────────────────────────────────────────────────────────────────

const Markets = () => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Handle Code Copy/Download Click Delegation
  const handleCodeAction = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const copyBtn = target.closest('.code-copy-btn');
    const dlBtn = target.closest('.code-dl-btn');

    if (copyBtn) {
      const wrapper = copyBtn.closest('.phonix-code-block');
      const codeText = wrapper?.querySelector('.code-raw-text')?.textContent;
      if (codeText) {
        navigator.clipboard.writeText(codeText);
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg><span class="text-green-400">COPIED!</span>`;
        setTimeout(() => { if (copyBtn) copyBtn.innerHTML = originalHtml; }, 2000);
      }
    }

    if (dlBtn) {
      const wrapper = dlBtn.closest('.phonix-code-block');
      const langNode = wrapper?.querySelector('.code-lang-label');
      const lang = langNode?.textContent?.toLowerCase() || '';
      const ext = lang === 'python' ? 'py' : lang === 'javascript' || lang === 'js' ? 'js' : lang === 'typescript' ? 'ts' : lang === 'html' ? 'html' : lang === 'css' ? 'css' : 'txt';
      const codeText = wrapper?.querySelector('.code-raw-text')?.textContent;
      if (codeText) {
        const blob = new Blob([codeText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `phonix_snippet.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  // Load sessions on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    loadSessions();
  }, [isAuthenticated]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await marketsAPI.getSessions();
      if (res.success) setSessions(res.sessions || []);
    } catch (e) {
      console.error("Failed to load sessions:", e);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadSession = async (id: string) => {
    try {
      const res = await marketsAPI.getSession(id);
      if (res.success && res.session) {
        setCurrentSessionId(id);
        setMessages(
          res.session.messages.map((m: any) => ({
            id: m._id || String(Date.now() + Math.random()),
            role: m.role,
            content: m.content,
            symbol: m.symbol,
            timestamp: new Date(m.timestamp || Date.now()),
          }))
        );
      }
    } catch (e) {
      console.error("Failed to load session:", e);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setChatInput("");
    setIsMobileSidebarOpen(false);
    inputRef.current?.focus();
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await marketsAPI.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) handleNewChat();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const handleSubmit = async (query?: string) => {
    const text = (query || chatInput).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsLoading(true);

    try {
      // ── Stream UI Initialization ──
      const aiMsgId = (Date.now() + 1).toString();

      // ── Execute Stream Buffer ──
      const stream = marketsAPI.analyzeStream("", text, null, [], currentSessionId || undefined);
      let finalContent = "";
      let activeSessionId = currentSessionId;
      let msgInitialized = false;

      for await (const chunk of stream) {
        if (!msgInitialized) {
          msgInitialized = true;
          setIsLoading(false); // Hide the "Thinking..." bubbles
          
          setMessages((prev) => [
            ...prev,
            { id: aiMsgId, role: "assistant", content: "", timestamp: new Date() }
          ]);
        }
        if (chunk.error) {
          throw new Error(chunk.error);
        }
        if (chunk.content) {
          finalContent += chunk.content;
          setMessages((prev) => 
            prev.map(m => m.id === aiMsgId ? { ...m, content: finalContent } : m)
          );
        }
        if (chunk.isDone) {
          if (chunk.sessionId && !activeSessionId) {
            activeSessionId = chunk.sessionId;
            setCurrentSessionId(chunk.sessionId);
            loadSessions();
          }
          if (chunk.symbol) {
             setMessages((prev) => 
               prev.map(m => m.id === aiMsgId ? { ...m, symbol: chunk.symbol } : m)
             );
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ Could not reach the AI service. Check your connection and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Sign in to access PhonixAI Markets</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition"
          >
            Sign In <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background flex flex-col relative">
      <Navbar />

      <div className="flex flex-1 overflow-hidden mt-[64px] relative">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="absolute inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={`absolute md:relative flex-shrink-0 flex flex-col border-r border-white/8 bg-[#18181b] z-30 h-full transition-transform duration-300 w-72 md:w-64 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          {/* Mobile Closer Header */}
          <div className="md:hidden flex items-center justify-between p-3 border-b border-white/8">
            <span className="font-semibold text-sm px-1 text-zinc-200">Menu</span>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* New Chat */}
          <div className="p-3 border-b border-white/8">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary rounded-xl text-sm font-medium transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              New Analysis
            </button>
          </div>

          {/* Market Tabs */}
          <div className="p-3 border-b border-white/8">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 px-1">Markets</p>
            <div className="space-y-0.5">
              {[
                { id: "overview", label: "Overview" },
                { id: "gainers", label: "Top Gainers" },
                { id: "losers", label: "Top Losers" },
                { id: "crypto", label: "Crypto" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    activeTab === tab.id
                      ? "bg-primary/15 text-primary font-medium"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Session History */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 px-1">
                History
              </p>
              {sessionsLoading ? (
                <div className="space-y-2 mt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 px-1 mt-2">
                  Your analyses will appear here
                </p>
              ) : (
                <div className="space-y-0.5">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
                        currentSessionId === session.id
                          ? "bg-primary/15 border border-primary/20"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${currentSessionId === session.id ? "text-primary" : "text-foreground/80"}`}>
                          {session.title}
                        </p>
                        {session.symbol && (
                          <span className="text-[10px] font-mono text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {session.symbol}
                          </span>
                        )}
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                          {timeAgo(new Date(session.updatedAt))}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-white/8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">PhonixAI</p>
                <p className="text-[10px] text-muted-foreground">nvidia/nemotron-120b</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Chat Area ── */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-background">
          {/* Mobile Header Bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#18181b] z-10 shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-1.5 -ml-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 font-semibold text-[15px] tracking-tight text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                PhonixAI
              </div>
            </div>
            <button
               onClick={handleNewChat}
               className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
               aria-label="New chat"
            >
               <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Messages or Welcome Screen */}
          <div className="flex-1 overflow-y-auto w-full">
            {messages.length === 0 ? (
              /* v0-Style Welcome Screen */
              <div className="h-full flex flex-col items-center justify-center px-4 md:px-6 pb-20">
                <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-8 tracking-tight text-center px-4">
                  What do you want to analyze?
                </h1>

                {/* Centered v0 Input Box */}
                <div className="w-full max-w-2xl bg-[#18181b]/80 border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all focus-within:bg-[#18181b] focus-within:border-white/20 focus-within:ring-4 focus-within:ring-white/5 focus-within:shadow-[0_0_40px_rgba(0,0,0,0.5)] mx-4 md:mx-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isLoading}
                    placeholder="Ask PhonixAI to analyze a stock, crypto, or market trend..."
                    className="w-full bg-transparent text-foreground placeholder-muted-foreground/50 px-5 pt-5 pb-3 focus:outline-none text-[15px] font-medium"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    autoFocus
                  />
                  
                  <div className="flex items-center justify-between px-3 pb-3 mt-1">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors"
                        title="Add context"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-xs text-muted-foreground font-medium border border-white/5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        PhonixAI
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-muted-foreground/60 hidden sm:flex items-center gap-1 px-2 border-r border-white/10 pr-3">
                        Model v3.5
                      </div>
                      <button
                        onClick={() => handleSubmit()}
                        disabled={isLoading || !chatInput.trim()}
                        className="p-1.5 bg-foreground text-background rounded-lg hover:opacity-90 disabled:opacity-20 disabled:hover:opacity-20 transition-all flex items-center justify-center w-8 h-8"
                      >
                        <Send className="w-4 h-4 translate-x-[1px] translate-y-[-1px]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtle text below input */}
                <p className="text-xs text-muted-foreground/40 mt-6 text-center">
                  Unlock real-time data and expert analysis with PhonixAI
                </p>
              </div>
            ) : (
              /* Message Thread */
              <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 md:space-y-10 pb-32 md:pb-40">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 md:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-400 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-400" />
                      </div>
                    )}

                    <div className={`flex flex-col gap-1.5 max-w-[90%] md:max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      {msg.role === "assistant" && msg.symbol && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] md:text-[11px] font-medium bg-white/5 border border-white/10 text-zinc-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {msg.symbol}
                          </span>
                        </div>
                      )}

                      {msg.role === "user" ? (
                        <div className="bg-[#242424] text-zinc-200 px-4 md:px-5 py-2.5 md:py-3 rounded-[20px] rounded-tr-sm shadow-md border border-white/5">
                          <p className="text-[14.5px] md:text-[15px] leading-relaxed font-light">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="w-full" onClick={handleCodeAction}>
                          <div
                            className="text-[15px] leading-relaxed max-w-none text-zinc-300"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                          />
                        </div>
                      )}

                      <span className="text-[10px] text-zinc-600 px-1 mt-1 font-medium">
                        {timeAgo(msg.timestamp)}
                      </span>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-8 h-8 bg-[#242424] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold text-zinc-400 border border-white/5">
                        U
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex gap-5 animate-in fade-in duration-300">
                    <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-zinc-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Pinned Bottom Input (Only visible during chat) ── */}
          {messages.length > 0 && (
            <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-10 pointer-events-none px-4 md:px-0">
              <div className="max-w-3xl mx-auto md:px-6">
                <form id="markets-chat-form" onSubmit={handleFormSubmit} className="pointer-events-auto">
                  <div className="flex flex-col bg-[#1e1e20] border border-white/10 focus-within:border-white/20 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all duration-300">
                    <input
                      ref={inputRef}
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isLoading}
                      placeholder="Ask a follow-up..."
                      className="w-full bg-transparent text-zinc-200 placeholder-zinc-500 px-5 pt-4 pb-2 focus:outline-none text-[15px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between px-3 pb-3 mt-1">
                      <div className="flex items-center gap-2">
                        <button type="button" className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-md transition-colors">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-zinc-500 hidden sm:block pr-1">
                          Model v3.5
                        </span>
                        <button
                          type="submit"
                          disabled={isLoading || !chatInput.trim()}
                          className="w-8 h-8 rounded-full bg-white text-black hover:bg-zinc-200 disabled:bg-white/10 disabled:text-zinc-600 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <svg className="w-4 h-4 translate-y-[-1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Markets;
