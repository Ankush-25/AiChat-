import { useState, useRef, useEffect } from 'react';
import { IoSend } from 'react-icons/io5';
import { FiMenu, FiX, FiPlus, FiSend } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { sendMessage } from './api/llm';
import { getConversations, saveConversations, getCurrentConversationId, setCurrentConversationId, createNewConversation as createNewConversationUtil, getConversation, updateConversation } from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { TypingIndicator } from './components/MessageItem';

// Skeleton loader component
const MessageSkeleton = ({ isUser = false }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 px-4 md:px-6`}>
    <div className={`rounded-3xl p-5 max-w-[85%] lg:max-w-[65%] backdrop-blur-sm ${
      isUser 
        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
        : 'bg-white/80 shadow-lg border border-gray-200'
    }`}>
      <div className="space-y-3">
        <div className="h-4 bg-opacity-40 rounded-full w-3/4 animate-pulse" style={{
          backgroundColor: isUser ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.1)'
        }}></div>
        <div className="h-4 bg-opacity-40 rounded-full w-1/2 animate-pulse" style={{
          backgroundColor: isUser ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.1)'
        }}></div>
      </div>
    </div>
  </div>
);

// Message component
const Message = ({ message, isLast, onRetry }) => {
  const messageRef = useRef(null);
  const isUser = message.sender === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (isLast) {
      messageRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLast]);

  if (message.isTyping) {
    return <TypingIndicator />;
  }

  // Format the time to show both time and date if it's not today
  const messageDate = new Date(message.timestamp);
  const now = new Date();
  const isToday = messageDate.toDateString() === now.toDateString();
  const timeString = isToday 
    ? messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : messageDate.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });

  return (
    <div 
      ref={messageRef}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 px-2 sm:px-4`}
    >
      <div className="relative max-w-[90%] sm:max-w-[85%] lg:max-w-[70%] w-full">
        {/* Message bubble */}
        <div 
          className={`rounded-2xl p-4 shadow-sm transition-all duration-200 ${
            isUser 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-none' 
              : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
          }`}
        >
          {/* Message content */}
          <div className="prose prose-sm sm:prose-base max-w-none">
            {isUser ? (
              <div className="whitespace-pre-wrap leading-relaxed">{message.text}</div>
            ) : (
              <div className="space-y-3">
                <ReactMarkdown 
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="rounded-lg overflow-hidden my-2">
                          <div className="bg-gray-800 text-gray-100 p-2 text-xs font-mono">
                            {match[1]}
                          </div>
                          <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      );
                    },
                    a: ({node, ...props}) => (
                      <a 
                        {...props} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`${isUser ? 'text-indigo-200 hover:text-white' : 'text-indigo-600 hover:text-indigo-800'} underline`}
                      />
                    ),
                    ul: ({node, ...props}) => (
                      <ul className="list-disc pl-5 space-y-1.5 my-2" {...props} />
                    ),
                    ol: ({node, ...props}) => (
                      <ol className="list-decimal pl-5 space-y-1.5 my-2" {...props} />
                    ),
                    blockquote: ({node, ...props}) => (
                      <blockquote 
                        className={`border-l-4 ${isUser ? 'border-indigo-300' : 'border-gray-300'} pl-4 italic ${isUser ? 'text-indigo-100' : 'text-gray-600'} my-3`} 
                        {...props} 
                      />
                    ),
                    p: ({node, ...props}) => (
                      <p className="my-2 leading-relaxed" {...props} />
                    ),
                    h1: ({node, ...props}) => (
                      <h3 className={`text-xl font-bold mt-4 mb-2 ${isUser ? 'text-white' : 'text-gray-900'}`} {...props} />
                    ),
                    h2: ({node, ...props}) => (
                      <h4 className={`text-lg font-semibold mt-3 mb-1.5 ${isUser ? 'text-white' : 'text-gray-900'}`} {...props} />
                    ),
                    h3: ({node, ...props}) => (
                      <h5 className={`font-medium mt-2.5 mb-1 ${isUser ? 'text-white' : 'text-gray-900'}`} {...props} />
                    ),
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Message metadata */}
          <div className={`flex items-center justify-between mt-3 pt-2 ${isUser ? 'border-t border-indigo-400/30' : 'border-t border-gray-100'}`}>
            <span className={`text-xs ${isUser ? 'text-indigo-100/80' : 'text-gray-500'}`}>
              {timeString}
            </span>
            {!isUser && !message.error && (
              <div className="flex items-center space-x-1">
                <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
                  AI
                </span>
              </div>
            )}
          </div>

          {/* Error state */}
          {message.error && (
            <div className="mt-3 pt-2 border-t border-red-200/30">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry && onRetry();
                }}
                className="flex items-center space-x-1.5 text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Try again</span>
              </button>
            </div>
          )}
        </div>

        {/* Message tail */}
        <div 
          className={`absolute -bottom-1.5 ${
            isUser ? 'right-0' : 'left-0'
          } w-4 h-4 overflow-hidden`}
        >
          <div 
            className={`absolute w-4 h-4 transform rotate-45 ${
              isUser 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-500 -right-1 -bottom-1' 
                : 'bg-white border-b border-l border-gray-100 -left-1 -bottom-1'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesContainerRef = useRef(null);

  // Handle click outside of sidebar to close it on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector('.sidebar-container');
      const menuButton = document.querySelector('.mobile-menu-button');
      
      if (isMobileMenuOpen && 
          !sidebar?.contains(event.target) && 
          !menuButton?.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    // Add event listener when sidebar is open
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const loadConversations = () => {
      const savedConversations = getConversations();
      setConversations(savedConversations);
      
      // Load current conversation if exists
      const currentId = getCurrentConversationId();
      if (currentId) {
        const conv = getConversation(currentId);
        setCurrentConversation(conv || null);
      } else if (savedConversations.length > 0) {
        // If no current conversation but conversations exist, select the first one
        setCurrentConversation(savedConversations[0]);
        setCurrentConversationId(savedConversations[0].id);
      } else {
        // Create a new conversation if none exist
        handleNewConversation();
      }
      
      setIsLoading(false);
    };
    
    loadConversations();
  }, []);

  // Handle scroll events
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Show scroll button if not at bottom
      setShowScrollButton(scrollHeight - (scrollTop + clientHeight) > 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && !showScrollButton) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation?.messages, showScrollButton]);

  const handleNewConversation = () => {
    const newConversation = createNewConversationUtil();
    setCurrentConversation(newConversation);
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setMessageInput('');
    setIsMobileMenuOpen(false); // Close mobile menu when creating new chat
  };

  const handleSelectConversation = (conversationId) => {
    const conversation = getConversation(conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      setCurrentConversationId(conversationId);
      setMessageInput('');
      setIsMobileMenuOpen(false); // Close mobile menu when selecting a conversation
    }
  };

  // Handle conversations list updates (renames, deletes)
  const handleConversationsUpdate = (updatedConversations) => {
    setConversations(updatedConversations);
    saveConversations(updatedConversations);
    
    // If current conversation was updated, refresh it
    if (currentConversation) {
      const updatedCurrent = updatedConversations.find(c => c.id === currentConversation.id);
      if (updatedCurrent) {
        setCurrentConversation(updatedCurrent);
      } else if (updatedConversations.length > 0) {
        // If current conversation was deleted, select the first one
        setCurrentConversation(updatedConversations[0]);
        setCurrentConversationId(updatedConversations[0].id);
      } else {
        // If no conversations left, create a new one
        const newConversation = createNewConversation();
        setCurrentConversation(newConversation);
      }
    }
  };

  // Handle retry for failed messages
  const handleRetryMessage = async (failedMessage) => {
    if (!currentConversation) return;

    try {
      setIsSending(true);
      
      // Remove the error message
      const updatedMessages = currentConversation.messages.filter(
        msg => msg.id !== failedMessage.id && !msg.isTyping
      );
      
      // Add the user message again
      const userMessage = {
        id: Date.now(),
        text: failedMessage.text,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      const updatedConversation = {
        ...currentConversation,
        messages: [...updatedMessages, userMessage],
        updatedAt: new Date().toISOString()
      };
      
      setCurrentConversation(updatedConversation);
      
      // Add typing indicator
      const typingMessage = { isTyping: true, id: 'typing' };
      setCurrentConversation(prev => ({
        ...prev,
        messages: [...updatedMessages, userMessage, typingMessage]
      }));
      
      // Send message to API
      const aiResponse = await sendMessage(userMessage);
      
      // Update with AI response
      const finalMessages = [...updatedMessages, userMessage, {
        ...aiResponse,
        id: Date.now() + 1
      }];
      
      const finalConversation = {
        ...updatedConversation,
        messages: finalMessages,
        updatedAt: new Date().toISOString()
      };
      
      setCurrentConversation(finalConversation);
      
      // Update conversations list
      const updatedConversations = conversations.map(conv => 
        conv.id === finalConversation.id ? finalConversation : conv
      );
      setConversations(updatedConversations);
      saveConversations(updatedConversations);
      
    } catch (error) {
      console.error('Error retrying message:', error);
      // Show error message again
      const errorMessage = {
        id: Date.now(),
        text: 'Sorry, there was an error processing your message. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        error: true
      };
      
      const finalMessages = [
        ...currentConversation.messages.filter(msg => !msg.isTyping && !msg.error),
        errorMessage
      ];
      
      const finalConversation = {
        ...currentConversation,
        messages: finalMessages,
        updatedAt: new Date().toISOString()
      };
      
      setCurrentConversation(finalConversation);
      
      // Update conversations list with error state
      const updatedConversations = conversations.map(conv => 
        conv.id === finalConversation.id ? finalConversation : conv
      );
      setConversations(updatedConversations);
      saveConversations(updatedConversations);
      
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageText = messageInput.trim();
    if (!messageText || isSending) return;

    // Create a new conversation if none exists
    let currentConv = currentConversation;
    if (!currentConv) {
      currentConv = createNewConversationUtil();
      setCurrentConversation(currentConv);
      setConversations(prev => [currentConv, ...prev]);
    }

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    // Update UI with user message immediately
    const updatedMessages = [...(currentConv.messages || []), userMessage];
    const updatedConversation = {
      ...currentConv,
      messages: updatedMessages,
      title: currentConv.title === 'New Chat' && userMessage.text
        ? userMessage.text.slice(0, 30) + (userMessage.text.length > 30 ? '...' : '')
        : currentConv.title,
      updatedAt: new Date().toISOString()
    };

    setCurrentConversation(updatedConversation);
    setMessageInput('');
    setIsSending(true);

    try {
      // Add typing indicator
      const typingMessage = { isTyping: true, id: 'typing' };
      setCurrentConversation(prev => ({
        ...prev,
        messages: [...updatedMessages, typingMessage]
      }));

      // Send message to API
      const aiResponse = await sendMessage(userMessage);
      
      // Remove typing indicator and add AI response
      const finalMessages = [...updatedMessages, {
        ...aiResponse,
        id: Date.now() + 1
      }];
      
      const finalConversation = {
        ...updatedConversation,
        messages: finalMessages,
        updatedAt: new Date().toISOString()
      };

      // Update state
      setCurrentConversation(finalConversation);
      
      // Update conversations list
      const updatedConversations = conversations.map(conv => 
        conv.id === finalConversation.id ? finalConversation : conv
      );
      setConversations(updatedConversations);
      saveConversations(updatedConversations);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message
      const errorMessage = {
        id: Date.now(),
        text: 'Sorry, there was an error processing your message. Please try again.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        error: true
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      const finalConversation = {
        ...updatedConversation,
        messages: finalMessages
      };
      
      setCurrentConversation(finalConversation);
      
      // Update conversations list with error state
      const updatedConversations = conversations.map(conv => 
        conv.id === finalConversation.id ? finalConversation : conv
      );
      setConversations(updatedConversations);
      saveConversations(updatedConversations);
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-white">
        <div className="m-auto text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="mobile-menu-button fixed top-4 left-4 z-40 p-3 rounded-2xl bg-white/80 backdrop-blur-lg shadow-lg text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105 md:hidden border border-gray-200"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <FiX className="w-6 h-6" />
        ) : (
          <FiMenu className="w-6 h-6" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`sidebar-container fixed inset-y-0 left-0 z-30 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative transition-transform duration-300 ease-in-out`}>
        <Sidebar
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onSelectConversation={handleSelectConversation}
        onCreateNew={handleNewConversation}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        onConversationsUpdate={handleConversationsUpdate}
      />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
        {/* Chat header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 p-5 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-semibold text-gray-800 truncate max-w-[50vw]">
            {currentConversation?.title || 'New Chat'}
          </h1>
        </header>

        {/* Messages container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
        >
          {currentConversation?.messages?.length > 0 ? (
            <>
              {currentConversation.messages.map((message, index) => (
                <Message
                  key={message.id}
                  message={message}
                  isLast={index === currentConversation.messages.length - 1}
                  onRetry={message.error ? () => handleRetryMessage(message) : undefined}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              
              
              <p className="text-gray-600 dark:text-gray-400 max-w-md text-lg leading-relaxed">
                Ask me anything or share your thoughts. I'm here to assist you with any questions or tasks you have.
              </p>
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}   
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-24 right-6 p-3 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg text-gray-600 hover:bg-white transition-all duration-200 hover:scale-110 border border-gray-200"
            aria-label="Scroll to bottom"
          >
            <BsArrowDownCircle className="w-6 h-6" />
          </button>
        )}

        {/* Message input */}
        <div className="bg-white/80 backdrop-blur-lg border-t border-gray-200/50 p-5">
          <form 
            onSubmit={handleSendMessage} 
            className="flex gap-3 bg-white rounded-2xl shadow-lg p-2 border border-gray-200"
          >
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white border-0 focus:ring-0 text-gray-800 placeholder-gray-500 px-5 py-3.5 text-base rounded-xl focus:outline-none"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || isSending}
              className={`p-3.5 rounded-xl transition-all duration-200 transform ${
                !messageInput.trim() || isSending
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-105'
              } focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed`}
              aria-label="Send message"
            >
              <IoSend className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;