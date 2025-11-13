const CONVERSATIONS_KEY = 'chat_conversations';
const CURRENT_CONVERSATION_KEY = 'current_conversation';

// Get all conversations from localStorage
export const getConversations = () => {
  try {
    const conversations = localStorage.getItem(CONVERSATIONS_KEY);
    return conversations ? JSON.parse(conversations) : [];
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

// Save conversations to localStorage
export const saveConversations = (conversations) => {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving conversations:', error);
  }
};

// Get current conversation ID
export const getCurrentConversationId = () => {
  return localStorage.getItem(CURRENT_CONVERSATION_KEY);
};

// Set current conversation ID
export const setCurrentConversationId = (id) => {
  localStorage.setItem(CURRENT_CONVERSATION_KEY, id);
};

// Create a new conversation
export const createNewConversation = () => {
  const newConversation = {
    id: Date.now().toString(),
    title: 'New Chat',
    messages: [],
    createdAt: new Date().toISOString()
  };
  
  const conversations = getConversations();
  conversations.unshift(newConversation);
  saveConversations(conversations);
  setCurrentConversationId(newConversation.id);
  
  return newConversation;
};

// Update a conversation
export const updateConversation = (conversationId, updates) => {
  const conversations = getConversations();
  const index = conversations.findIndex(c => c.id === conversationId);
  
  if (index !== -1) {
    conversations[index] = { ...conversations[index], ...updates };
    saveConversations(conversations);
    return conversations[index];
  }
  
  return null;
};

// Get a specific conversation
export const getConversation = (conversationId) => {
  const conversations = getConversations();
  return conversations.find(c => c.id === conversationId) || null;
};
