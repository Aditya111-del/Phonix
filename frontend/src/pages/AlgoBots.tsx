import Navbar from "@/components/Navbar";
import { Download, Star, TrendingUp, ChevronDown, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { botsAPI } from "@/api";
import { useAuth } from "@/hooks/useAuth";

interface Bot {
  _id: string;
  name: string;
  description: string;
  version: string;
  rating: number;
  reviews: number;
  downloads: number;
  type: string;
  riskLevel: string;
  minBalance: number;
  tags?: string[];
  backtestResults?: {
    winRate: number;
    avgProfit: number;
    totalTrades: number;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const AlgoBots = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("downloads");
  const [currentPage, setCurrentPage] = useState(1);

  const botTypes = ["scalping", "swing", "day-trading", "position", "arbitrage", "other"];

  useEffect(() => {
    fetchBots();
  }, [selectedType, searchQuery, sortBy, currentPage]);

  const fetchBots = async () => {
    try {
      setLoading(true);
      console.log('[AlgoBots] Fetching bots...', { selectedType, searchQuery, sortBy, currentPage });
      
      const response = await botsAPI.getAll({
        page: currentPage,
        limit: 12,
        type: selectedType || undefined,
        search: searchQuery || undefined,
        sort: sortBy,
      });

      console.log('[AlgoBots] API Response:', response);

      if (response.success && Array.isArray(response.data)) {
        const validBots = response.data.filter(bot => bot && bot._id && bot.type);
        console.log('[AlgoBots] Valid bots:', validBots.length);
        setBots(validBots);
        setPagination(response.pagination);
        setError("");
      } else {
        const errorMsg = response.error || "Failed to load bots";
        console.error('[AlgoBots] Error:', errorMsg);
        setError(errorMsg);
        setBots([]);
      }
    } catch (err) {
      const errorMsg = `Error loading bots: ${err.message}`;
      console.error('[AlgoBots]', errorMsg);
      setError(errorMsg);
      setBots([]);
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
      setLoading(true);
      console.log("[AlgoBots] Starting download:", botName, "ID:", botId);
      
      const response = await botsAPI.download(botId);

      console.log("[AlgoBots] Download response:", {
        success: response.success,
        hasBlob: !!response.blob,
        blobSize: response.blob?.size,
        fileName: response.fileName,
        error: response.error,
      });

      if (!response.success) {
        alert(`Download failed: ${response.error || "Unknown error"}`);
        return;
      }

      if (!response.blob) {
        alert("Download failed: No file data received");
        return;
      }

      // Create download link from blob
      const url = window.URL.createObjectURL(response.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = response.fileName || `${botName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("[AlgoBots] Download completed for:", botName);
      alert(`Bot "${botName}" downloaded successfully!`);
    } catch (err) {
      console.error("[AlgoBots] Download error:", err);
      alert(`Download failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-500 bg-green-500/10";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10";
      case "high":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  const formatDownloads = (downloads: number) => {
    if (downloads > 1000000) return (downloads / 1000000).toFixed(1) + "M";
    if (downloads > 1000) return (downloads / 1000).toFixed(1) + "K";
    return downloads.toString();
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

      {/* Filters Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search bots..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none transition"
            >
              <option value="">All Types</option>
              {botTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} Trading
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none"
            >
              <option value="downloads">Most Downloaded</option>
              <option value="newest">Newest</option>
              <option value="rating">Highest Rated</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {bots.map((bot) => (
                <div key={bot._id} className="border border-border rounded-lg p-6 bg-card hover:bg-secondary/50 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">{bot.name}</h3>
                      <div className="flex gap-2 flex-wrap mb-2">
                        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                          {bot.type ? bot.type.charAt(0).toUpperCase() + bot.type.slice(1) : "Unknown"}
                        </span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(bot.riskLevel || "medium")}`}>
                          {bot.riskLevel ? bot.riskLevel.charAt(0).toUpperCase() + bot.riskLevel.slice(1) : "Medium"} Risk
                        </span>
                      </div>
                    </div>
                    <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{bot.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 my-4 pb-4 border-b border-border">
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="font-semibold text-foreground">{bot.rating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{bot.reviews} reviews</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">{formatDownloads(bot.downloads)}</p>
                      <p className="text-xs text-muted-foreground">Downloads</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">v{bot.version}</p>
                      <p className="text-xs text-muted-foreground">Version</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">${bot.minBalance}</p>
                      <p className="text-xs text-muted-foreground">Min Balance</p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(bot._id, bot.name)}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground hover:bg-secondary/80 disabled:opacity-50 transition"
                >
                  Previous
                </button>

                {Array.from({ length: pagination.pages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-2 rounded-lg transition ${
                      currentPage === i + 1
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border border-border text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={currentPage === pagination.pages}
                  className="px-4 py-2 bg-secondary border border-border rounded-lg text-foreground hover:bg-secondary/80 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default AlgoBots;
