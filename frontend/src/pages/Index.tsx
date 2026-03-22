import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ChatWidget from "@/components/ChatWidget";
import { TrendingUp, Bot, Shield, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Bot,
    title: "AI-Powered Algo Bots",
    description: "Browse and download institutional-grade trading algorithms. Each bot is vetted, version-controlled, and ready to deploy.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Market Intelligence",
    description: "Live quotes, technical indicators, news sentiment analysis, and AI-driven market insights — all in one place.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Shield,
    title: "Secure & Verified",
    description: "Every bot file is SHA-256 checksummed. JWT authentication and role-based access protect your account.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
];

const stats = [
  { label: "Trading Bots", value: "50+", sub: "and growing" },
  { label: "Daily Volume", value: "$2.4B", sub: "across all strategies" },
  { label: "Avg Win Rate", value: "67%", sub: "backtested results" },
  { label: "Active Traders", value: "12K+", sub: "worldwide" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ChatWidget />

      {/* Features Section */}
      <section className="py-24 px-4 md:px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(152_56%_45%/0.04)_0%,transparent_70%)]" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Platform Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to trade algorithmically
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From bot discovery to deployment, Phonix gives you edge in every market.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-6`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 md:px-6 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary mb-2 tabular-nums">{stat.value}</p>
                <p className="text-foreground font-semibold mb-1">{stat.label}</p>
                <p className="text-muted-foreground text-sm">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to trade smarter?
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join thousands of traders automating their strategies with Phonix algo bots.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 flex items-center gap-2"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/bots")}
              className="border border-border text-foreground px-8 py-3.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors"
            >
              Browse Bots
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">phonix</span>
            <span className="text-sm">© 2025 All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <button onClick={() => navigate("/bots")} className="hover:text-foreground transition">Bots</button>
            <button onClick={() => navigate("/markets")} className="hover:text-foreground transition">Markets</button>
            <button onClick={() => navigate("/login")} className="hover:text-foreground transition">Login</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
