import Navbar from "@/components/Navbar";
import { Upload, Edit2, Trash2, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "@/api";
import { useAuth } from "@/hooks/useAuth";

interface UploadedBot {
  id: string;
  name: string;
  description: string;
  uploadedAt: string;
  status: "active" | "pending" | "inactive";
  downloads: number;
  type: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [bots, setBots] = useState<UploadedBot[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    version: "1.0.0",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!isAuthenticated) {
      console.log('[Admin] Not authenticated, redirecting to login');
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      console.log('[Admin] Not admin, redirecting home');
      navigate("/");
      return;
    }

    console.log('[Admin] User authenticated as admin:', user?.name);
    fetchBots();
  }, [isAuthenticated, user, navigate]);

  const fetchBots = async () => {
    try {
      const response = await adminAPI.getAllBots();
      if (response.success) {
        setBots(response.data);
      } else {
        setError(response.error || response.message || "Failed to load bots");
      }
    } catch (err) {
      console.error("Fetch bots error:", err);
      setError("Failed to load bots. Is the backend server running on port 5000?");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.type || !file) {
      setError("Please fill all fields and select a file");
      return;
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      setError(`File size exceeds 100MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Validate file extension
    const allowedExtensions = ['zip', 'rar', '7z', 'tar'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`);
      return;
    }

    setUploading(true);
    setError("");

    try {
      console.log('[Admin] Starting upload:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const uploadFormData = new FormData();
      uploadFormData.append("name", formData.name);
      uploadFormData.append("description", formData.description);
      uploadFormData.append("type", formData.type);
      uploadFormData.append("version", formData.version);
      uploadFormData.append("file", file);

      const response = await adminAPI.uploadBot(uploadFormData);

      console.log('[Admin] Upload response:', response);

      if (response.success) {
        console.log('[Admin] Upload successful, bot created:', response.data.name);
        setBots([...bots, response.data]);
        setFormData({ name: "", description: "", type: "", version: "1.0.0" });
        setFile(null);
        setShowUploadForm(false);
        alert(`✅ Bot "${response.data.name}" uploaded successfully!`);
      } else {
        setError(response.error || response.message || "Upload failed");
      }
    } catch (err) {
      console.error("[Admin] Upload error:", err);
      const errorMsg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await adminAPI.deleteBot(id);
      if (response.success) {
        setBots(bots.filter((bot) => bot.id !== id));
      } else {
        setError("Failed to delete bot");
      }
    } catch (err) {
      setError("Delete failed");
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700";
      case "inactive":
        return "bg-red-500/10 text-red-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Loading state while auth is being initialized */}
      {!isAuthenticated && loading === true && (
        <section className="pt-32 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-muted-foreground">Loading authentication...</p>
          </div>
        </section>
      )}

      {/* Check if admin */}
      {isAuthenticated && (user?.role !== "admin") && (
        <section className="pt-32 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-red-500 text-lg mb-4">
              You must be an admin to access this page
            </p>
            <a href="/" className="text-primary hover:underline">
              Go Home
            </a>
          </div>
        </section>
      )}

      {!isAuthenticated && (
        <section className="pt-32 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-red-500 text-lg mb-4">
              You must be logged in to access admin dashboard
            </p>
            <a href="/login" className="text-primary hover:underline">
              Go to Login
            </a>
          </div>
        </section>
      )}

      {/* Admin Dashboard Content */}
      {isAuthenticated && user?.role === "admin" && (
        <>
          {/* Header */}
          <section className="pt-32 pb-8 px-4 md:px-6 border-b border-border">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Admin Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    Logged in as: <span className="text-primary font-semibold">{user?.name}</span> (Admin)
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Bot
                </button>
              </div>
            </div>
          </section>

          {/* Upload Form */}
          {showUploadForm && (
            <section className="px-4 md:px-6 py-8 bg-secondary/30 border-b border-border">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Upload New Algorithm Bot
                </h2>
                {error && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                  </div>
                )}
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Bot Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Momentum Trader Pro"
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Bot Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="">Select a type</option>
                        <option value="momentum">Momentum</option>
                        <option value="mean-reversion">Mean Reversion</option>
                        <option value="trend-following">Trend Following</option>
                        <option value="arbitrage">Arbitrage</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the algorithm and its strategy..."
                      rows={3}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      required
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Version
                      </label>
                      <input
                        type="text"
                        name="version"
                        value={formData.version}
                        onChange={handleInputChange}
                        placeholder="e.g., 1.0.0"
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Bot File * (Max 100MB)
                      </label>
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".zip,.rar,.7z,.tar"
                        className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                      {file && (
                        <div className="mt-2 p-2 bg-primary/5 border border-primary/20 rounded text-xs text-foreground">
                          ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={uploading || !file}
                      className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 ${
                        uploading || !file
                          ? "bg-primary/50 text-primary-foreground/50 cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {uploading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Uploading...
                        </span>
                      ) : (
                        "Upload Bot"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadForm(false);
                        setError("");
                      }}
                      className="border border-border text-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* Bots Table */}
          <section className="px-4 md:px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Uploaded Bots ({bots.length})
              </h2>
              
              {loading ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Loading bots...</p>
                </div>
              ) : error && bots.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-red-500 mb-4">{error}</p>
                  <p className="text-muted-foreground text-sm">Check console for more details</p>
                </div>
              ) : bots.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground">No bots uploaded yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Click "Upload Bot" to add your first algorithm</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Downloads
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Version
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bots.map((bot) => (
                        <tr
                          key={bot.id}
                          className="border-b border-border hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <p className="font-medium text-foreground">{bot.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{bot.description}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium capitalize">
                              {bot.type}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                                bot.status
                              )}`}
                            >
                              {bot.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-foreground">
                              {bot.downloads}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-sm text-muted-foreground">
                              {bot.uploadedAt || 'N/A'}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete(bot.id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Delete bot"
                              >
                                <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
