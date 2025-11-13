import { useEffect, useRef } from 'react';

const MessageItem = ({ message, isLast }) => {
  const isUser = message.sender === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const messageRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (isLast) {
      messageRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLast]);

  if (message.isTyping) {
    return (
      <div className="flex justify-start mb-4">
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messageRef}
      className={`flex mb-4 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`message-${isUser ? 'user' : 'ai'} message-enter`}>
        <div className="whitespace-pre-wrap break-words">{message.text}</div>
        <div className={`text-xs mt-1 text-right ${isUser ? 'text-indigo-200' : 'text-gray-500'}`}>
          {time}
        </div>
      </div>
    </div>
  );
};
export default MessageItem;


// Typing indicator component
export const TypingIndicator = () => (
  <div className="flex justify-start mb-6 px-4 md:px-6">
    <div className="relative">
      <div className="flex items-center space-x-1.5 bg-white/80 backdrop-blur-sm rounded-3xl px-5 py-4 shadow-lg border border-gray-200">
        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <div className="absolute -bottom-2 left-5 w-4 h-4 bg-white/80 transform rotate-45 border-b border-r border-gray-200"></div>
    </div>
  </div>
);