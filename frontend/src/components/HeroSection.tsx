import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import matrixMap from "@/assets/matrix-map.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,hsl(152_56%_45%/0.08)_0%,transparent_60%)]" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 mt-20 animate-fade-in-up">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-full px-4 py-2 mb-8">
          <span className="text-primary text-sm">📊</span>
          <span className="text-foreground text-sm font-medium">Daily Finances</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white max-w-4xl mx-auto leading-none mb-6 tracking-wide bitcount-prop-font">
          Your Gateway to Algo Trading
        </h1>

        {/* Subheadline */}
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10">
          Trade Forex, Stocks, Indices, and more — with institutional-grade tools, tight spreads, and local regulation
        </p>

        {/* CTAs */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate("/login")} className="bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors">
            Open Account
          </button>
          <button onClick={() => navigate("/bots")} className="border border-border text-foreground px-8 py-3.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2">
            Algo Bots <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Matrix Map Background */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] flex items-end justify-center opacity-30 pointer-events-none">
        <img
          src={matrixMap}
          alt="Global markets visualization"
          className="w-full max-w-6xl object-contain"
        />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
