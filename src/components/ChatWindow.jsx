import { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import { sendMessage } from '../api/llm';

const ChatWindow = ({ messages = [], onNewMessage, currentConversationId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    onNewMessage(userMessage, currentConversationId);
    setIsLoading(true);

    try {
      const aiResponse = await sendMessage(userMessage);
      onNewMessage(aiResponse, currentConversationId);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-100">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200">
        <InputBox onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatWindow;
