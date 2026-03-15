import Navbar from "@/components/Navbar";
import { Download, Star, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { botsAPI } from "@/api";
import { useAuth } from "@/hooks/useAuth";

interface Bot {
  id: string;
  name: string;
  description: string;
  version: string;
  rating: number;
  downloads: number;
  type: string;
}

const AlgoBots = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const response = await botsAPI.getAll();
      if (response.success) {
        setBots(response.data);
      } else {
        setError("Failed to load bots");
      }
    } catch (err) {
      setError("Error loading bots");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (botId: string, botName: string) => {
    if (!isAuthenticated) {
      alert("Please sign in first to download bots");
      navigate("/login");
      return;
    }

    try {
      console.log('[AlgoBots] Starting download:', botName);
      const response = await botsAPI.download(botId);
      
      if (response.success) {
        console.log('[AlgoBots] Download response:', response);
        
        // Trigger file download
        const downloadUrl = `http://localhost:5000${response.downloadUrl}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = response.bot.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('[AlgoBots] Download initiated for:', botName);
      } else {
        alert(`Download failed: ${response.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('[AlgoBots] Download error:', err);
      alert("Download failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Algo Bots Marketplace
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Download and deploy cutting-edge trading algorithms to automate your trading strategy
            </p>
          </div>
        </div>
      </section>

      {/* Bots Grid */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading bots...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        ) : bots.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No bots available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {bots.map((bot) => (
            <div
              key={bot.id}
              className="border border-border rounded-lg p-6 bg-card hover:bg-secondary/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {bot.name}
                  </h3>
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                    {bot.type}
                  </span>
                </div>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-4">
                {bot.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 my-4 pb-4 border-b border-border">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-semibold text-foreground">
                      {bot.rating}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground mb-1">
                    {bot.downloads}
                  </p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground mb-1">
                    v{bot.version}
                  </p>
                  <p className="text-xs text-muted-foreground">Version</p>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(bot.id, bot.name)}
                className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AlgoBots;
