import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ChatWidget from "@/components/ChatWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ChatWidget />
    </div>
  );
};

export default Index;
