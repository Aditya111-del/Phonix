import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Mail, User, Calendar, Shield, LogOut } from "lucide-react";
import { useEffect } from "react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const createdAt = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background pt-20 pb-10">
      <div className="max-w-2xl mx-auto px-4">
        {/* Profile Card */}
        <div className="bg-secondary/30 border border-border rounded-2xl p-8 shadow-lg backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Your Profile
              </h1>
              <p className="text-muted-foreground">
                Manage your account information
              </p>
            </div>
          </div>

          {/* Profile Picture and Basic Info */}
          <div className="flex flex-col gap-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 pb-8 border-b border-border/50">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-2 border-primary"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl text-primary-foreground font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Account</p>
                <h2 className="text-2xl font-bold text-foreground">
                  {user.name}
                </h2>
                {user.role === "admin" && (
                  <span className="inline-block mt-2 text-xs font-semibold bg-primary/20 text-primary px-3 py-1 rounded-full">
                    Administrator
                  </span>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="bg-background/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Email Address</p>
                </div>
                <p className="text-foreground font-medium break-all">
                  {user.email}
                </p>
              </div>

              {/* Role */}
              <div className="bg-background/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Account Type</p>
                </div>
                <p className="text-foreground font-medium capitalize">
                  {user.role === "admin" ? "Administrator" : "Standard User"}
                </p>
              </div>

              {/* User ID */}
              <div className="bg-background/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">User ID</p>
                </div>
                <p className="text-foreground font-medium font-mono text-sm break-all">
                  {user.id}
                </p>
              </div>

              {/* Member Since */}
              <div className="bg-background/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">Member Since</p>
                </div>
                <p className="text-foreground font-medium">{createdAt}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-8 border-t border-border/50">
              {user.role === "admin" && (
                <button
                  onClick={() => navigate("/admin/dashboard")}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Go to Admin Dashboard
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="w-full bg-secondary text-foreground py-2.5 rounded-lg font-medium hover:bg-secondary/80 transition-all"
              >
                Back to Home
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 text-red-500 py-2.5 rounded-lg font-medium hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-secondary/20 border border-border/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> More profile editing options will be available soon.
            You can currently update your password and other settings from the settings panel.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
