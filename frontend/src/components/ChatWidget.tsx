import { MessageCircle } from "lucide-react";
import { useState } from "react";

const chatOptions = [
  "I need help with my Trading Account",
  "I need help to open a live account",
  "I need more information about trading",
];

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat Options */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2 animate-fade-in-up">
          {chatOptions.map((option) => (
            <button
              key={option}
              className="bg-secondary border border-border text-foreground text-sm px-4 py-2.5 rounded-lg hover:bg-muted transition-colors whitespace-nowrap"
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ChatWidget;
