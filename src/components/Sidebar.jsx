import { useState } from 'react';
import { FiSend, FiPlus, FiMenu, FiX, FiEdit2, FiCheck, FiXCircle, FiDownload } from 'react-icons/fi';

// Update a conversation's title in localStorage
const onRenameConversation = (conversationId, newTitle) => {
  const key = 'chat_conversations';
  const data = localStorage.getItem(key);
  if (!data) return;

  const sessions = JSON.parse(data);
  const updated = sessions.map(session => 
    session.id === conversationId 
      ? { ...session, title: newTitle, updatedAt: new Date().toISOString() } 
      : session
  );

  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
};

// Remove one session from localStorage by its id
const onDeleteConversation = (targetId) => {
  const key = 'chat_conversations';
  const data = localStorage.getItem(key);
  if (!data) return; // nothing stored yet

  // Parse stored JSON
  const sessions = JSON.parse(data);

  // Filter out the one you want to remove
  const updated = sessions.filter(session => session.id !== targetId);

  // Save it back
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}

export const Sidebar = ({ 
  conversations = [], 
  currentConversationId, 
  onSelectConversation, 
  onCreateNew,
  isMobileMenuOpen,
  onCloseMobileMenu,
  onConversationsUpdate
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Function to handle chat export
  const handleExportChat = () => {
    if (!currentConversationId) return;
    
    const conversation = conversations.find(c => c.id === currentConversationId);
    if (!conversation) return;
    
    // Format the data for export
    const exportData = {
      id: conversation.id,
      title: conversation.title || 'Exported Chat',
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages
        .filter(msg => !msg.isTyping) // Exclude typing indicators
        .map(({ id, text, sender, timestamp }) => ({
          id,
          text,
          sender,
          timestamp,
          time: new Date(timestamp).toLocaleString()
        }))
    };
    
    // Create a blob and download link
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    // Create a temporary anchor element
    const exportFileDefaultName = `chat_${conversation.title || 'export'}_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleRename = (e, conversationId, currentTitle) => {
    e.stopPropagation();
    setEditingId(conversationId);
    setEditValue(currentTitle);
  };

  const saveRename = (conversationId) => {
    if (editValue.trim()) {
      const updated = onRenameConversation(conversationId, editValue.trim());
      onConversationsUpdate(updated);
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e, conversationId) => {
    if (e.key === 'Enter') {
      saveRename(conversationId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };

  return (
  <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 z-30 w-72 bg-gradient-to-b from-white to-gray-50/80 backdrop-blur-lg border-r border-gray-200/50 transition-transform duration-300 ease-in-out flex flex-col h-screen shadow-xl`}>
    <div className="p-5 border-b border-gray-200/50">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Chat History</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleExportChat}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 hover:scale-110"
            aria-label="Export chat"
            title="Export chat history"
          >
            <FiDownload className="w-5 h-5" />
          </button>
        </div>
      </div>
      <button
        onClick={onCreateNew}
        className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 font-medium"
      >
        <FiPlus className="w-4 h-4" />
        New Chat
      </button>
    </div>
    <div className="flex-1 overflow-y-auto py-2">
      {conversations.map((conv) => (
        <div 
          key={conv.id}
          className="group relative w-[90%] mx-auto my-1"
        >
          <button
            onClick={() => {
              onSelectConversation(conv.id);
              onCloseMobileMenu();
            }}
            className={`w-full text-left p-[7px] rounded-xl transition-all duration-200 ${
              currentConversationId === conv.id 
                ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200/50 text-indigo-700 shadow-md' 
                : 'text-gray-700 hover:bg-gray-100/50 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              {editingId === conv.id ? (
                <div className="flex-1 flex items-center">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, conv.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent border-b border-indigo-300 focus:outline-none focus:border-indigo-500 px-1 py-0.5 text-sm"
                    autoFocus
                  />
                  <div className="flex ml-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRename(conv.id);
                      }}
                      className="p-1 text-green-500 hover:text-green-600"
                      title="Save"
                    >
                      <FiCheck className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                      }}
                      className="p-1 text-red-500 hover:text-red-600 ml-1"
                      title="Cancel"
                    >
                      <FiXCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="truncate font-medium px-2">{conv.title || 'New Chat'}</div>
              )}
              <button
                onClick={(e) => handleRename(e, conv.id, conv.title || 'New Chat')}
                className="p-1 text-gray-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 mr-1"
                title="Rename conversation"
              >
                <FiEdit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {conv.updatedAt && (
              <div className="text-xs text-gray-500 mt-1 px-2">
                {new Date(conv.updatedAt).toLocaleDateString()}
              </div>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Delete the conversation and update the UI
              const updatedConversations = onDeleteConversation(conv.id);
              if (onConversationsUpdate) {
                onConversationsUpdate(updatedConversations);
              }
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Delete conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
    <div className="p-4 border-t border-gray-200/50">
      <div className="text-sm text-gray-500 text-center">
        Made with ❤️ for aviara labs
      </div>
    </div>
    </div>
  );
}