import { useState } from "react";
import { ChevronDown, ExternalLink, Zap, LogOut, User, Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Markets", path: "/markets" },
  { label: "Bots", path: "/bots" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          <div className="flex flex-col leading-none">
            <span className="text-foreground font-bold text-lg tracking-tight">
              phonix
            </span>
          </div>
        </div>
      </div>

      {/* Center Nav – Desktop */}
      <div className="hidden md:flex items-center bg-secondary/30 rounded-full px-2 py-2 border border-border/50 backdrop-blur-sm">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              isActive(item.path)
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {item.label === "Home" && isActive(item.path) && <span className="text-xs">🏠</span>}
            {item.label}
          </button>
        ))}
      </div>


      {/* Right Actions */}
      <div className="hidden md:flex items-center gap-4">
        {isAuthenticated && user ? (
          // User Profile Menu
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-all"
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border border-primary"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-foreground max-w-[100px] truncate">
                {user.name}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-xl backdrop-blur-sm z-50">
                {/* Profile Info */}
                <div className="px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-primary"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  {user.role === "admin" && (
                    <span className="inline-block text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded-full">
                      Admin
                    </span>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </button>
                  {user.role === "admin" && (
                    <button
                      onClick={() => {
                        navigate("/admin/dashboard");
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Admin Dashboard
                    </button>
                  )}
                </div>

                {/* Logout Button */}
                <div className="px-4 py-3 border-t border-border/50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Login/Signup Buttons
          <>
            <a
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors rounded-lg px-4 py-2 hover:bg-secondary/30"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
            >
              Sign Up <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {showMobileMenu && (
        <div className="absolute top-[72px] left-4 right-4 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 md:hidden z-50">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => { navigate(item.path); setShowMobileMenu(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <hr className="border-white/10 my-1" />

          {isAuthenticated && user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-white/5 pb-4 mb-2">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-primary/50 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-[15px] font-medium text-white truncate">{user.name}</span>
                  <span className="text-[13px] text-zinc-500 truncate">{user.email}</span>
                </div>
              </div>
              <button
                onClick={() => { navigate("/profile"); setShowMobileMenu(false); }}
                className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <User className="w-5 h-5" /> View Profile
              </button>
              {user.role === "admin" && (
                <button
                  onClick={() => { navigate("/admin/dashboard"); setShowMobileMenu(false); }}
                  className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-primary hover:bg-primary/10 rounded-xl transition-colors"
                >
                  <Zap className="w-5 h-5" /> Admin Dashboard
                </button>
              )}
              <button
                onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                className="flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-red-400 hover:bg-red-400/10 rounded-xl transition-colors mt-2"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-2">
              <button onClick={() => { navigate("/login"); setShowMobileMenu(false); }} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[15px] font-medium transition-colors">
                Sign In
              </button>
              <button onClick={() => { navigate("/signup"); setShowMobileMenu(false); }} className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-[15px] font-medium flex items-center justify-center gap-2 transition-colors">
                Sign Up <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
