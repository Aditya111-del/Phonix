import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { marketsAPI } from "@/api";
import { Send, Plus, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  preview: string;
}

interface MarketTab {
  id: string;
  label: string;
}

const MARKET_TABS: MarketTab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'gainers', label: 'Gainers' },
  { id: 'losers', label: 'Losers' },
  { id: 'active', label: 'Active' },
  { id: 'crypto', label: 'Crypto' },
];

const Markets = () => {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [symbol, setSymbol] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle new chat
  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId('');
    setChatInput('');
    setSymbol('');
  };

  // Handle chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);

    try {
      // Extract symbol if user mentions one
      const symbolMatch = chatInput.match(/\b[A-Z]{1,5}\b/);
      const targetSymbol = symbolMatch ? symbolMatch[0] : symbol;
      
      if (symbolMatch) {
        setSymbol(symbolMatch[0]);
      }

      if (!targetSymbol) {
        // User hasn't mentioned a symbol yet
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Please mention a stock symbol (like AAPL, GOOGL, TSLA) to analyze. What market would you like to explore?',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setLoading(false);
        return;
      }

      // Call market analysis API
      const data = await marketsAPI.analyze(targetSymbol, chatInput, null, []);
      
      if (data.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.analysis,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);

        // Save chat session
        if (!currentSessionId) {
          const newSessionId = Date.now().toString();
          setCurrentSessionId(newSessionId);
          setChatSessions(prev => [{
            id: newSessionId,
            title: chatInput.substring(0, 50),
            timestamp: new Date(),
            preview: chatInput
          }, ...prev]);
        }
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to analyze'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error('[Markets] Error:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Failed to process your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = (sessionId: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    if (currentSessionId === sessionId) {
      handleNewChat();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to access Markets.</p>
          <a href="/login" className="text-primary hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Platform Navbar */}
      <Navbar />

      {/* Market Tabs */}
      <div className="mt-20 bg-gradient-to-b from-card/30 to-transparent sticky top-20 z-40 px-6 border-b border-white/5">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide">
          {MARKET_TABS.map((tab) => (
            <button
              key={tab.id}
              className="px-0 py-4 text-sm font-medium transition-all whitespace-nowrap border-b-2 duration-300 border-transparent text-muted-foreground hover:text-foreground/80"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-gradient-to-b from-white/5 to-transparent flex flex-col overflow-hidden border-r border-white/5">
          {/* Header */}
          <div className="p-4 border-b border-white/5">
            <button
              onClick={handleNewChat}
              className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 text-foreground rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm"
            >
              New Chat
            </button>
          </div>

          {/* Recent Chats */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <p className="text-xs font-semibold text-muted-foreground px-2 py-2 uppercase tracking-wider">Recent</p>
              <div className="space-y-0.5 mt-2">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                      currentSessionId === session.id
                        ? 'bg-primary/15 text-foreground'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground/80'
                    }`}
                    onClick={() => setCurrentSessionId(session.id)}
                  >
                    <p className="text-xs truncate font-medium">{session.title}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(session.id);
                      }}
                      className="p-0.5 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 mt-1 inline-block"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground/60">Phonix Agent</p>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                  <h2 className="text-4xl font-semibold text-foreground mb-3">Phonix Agent</h2>
                  <p className="text-sm text-muted-foreground mb-8">Ask about stocks, crypto, and markets. Mention any symbol.</p>
                  <div className="space-y-2.5">
                    <button className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-foreground transition-all duration-200 font-medium hover:shadow-sm">
                      Tell me about Apple
                    </button>
                    <button className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-foreground transition-all duration-200 font-medium hover:shadow-sm">
                      Analyze Tesla stock
                    </button>
                    <button className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-foreground transition-all duration-200 font-medium hover:shadow-sm">
                      How is Bitcoin performing?
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl px-5 py-3 rounded-2xl transition-all duration-300 ${
                    msg.role === 'user'
                      ? 'bg-primary/90 text-primary-foreground rounded-br-none shadow-lg hover:shadow-xl'
                      : 'bg-white/5 text-foreground hover:bg-white/10'
                  }`}>
                    <p className="text-sm leading-relaxed font-normal">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-white/5 px-5 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="bg-gradient-to-t from-background to-transparent p-6">
            <form onSubmit={handleChatSubmit} className="max-w-full mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 focus-within:border-primary/50 focus-within:bg-white/10 transition-all duration-300">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Ask something..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none text-sm font-normal"
                  />
                  <button
                    type="submit"
                    disabled={loading || !chatInput.trim()}
                    className="p-2 bg-primary/20 hover:bg-primary/40 text-primary rounded-lg transition-all duration-200 disabled:opacity-30 hover:shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Markets;
