import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader } from 'lucide-react';
import axios from 'axios';
import '../styles/ReportChatbot.css';

const ReportChatbot = ({ onReportDataExtracted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [extractedData, setExtractedData] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchGreeting();
    }
  }, [isOpen]);

  // Fetch greeting message
  const fetchGreeting = async () => {
    try {
      const response = await axios.get('/api/ai/chatbot/greeting');
      if (response.data.success) {
        setMessages([{
          role: 'assistant',
          content: response.data.message,
          suggestions: response.data.suggestions,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch greeting:', error);
      setMessages([{
        role: 'assistant',
        content: "Hello! I'm SwachhBot. How can I help you report a hygiene issue today?",
        timestamp: new Date()
      }]);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      const response = await axios.post('/api/ai/chatbot/chat', {
        sessionId,
        message: userMessage
      });

      if (response.data.success) {
        // Add assistant response
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.message,
          suggestions: response.data.suggestions,
          timestamp: new Date()
        }]);

        // Update extracted data
        if (response.data.extractedData) {
          const newData = response.data.extractedData;
          setExtractedData(newData);

          // If report is complete, notify parent
          if (response.data.isComplete && onReportDataExtracted) {
            onReportDataExtracted(newData);
            setIsComplete(true);
          }
        }
      } else {
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Could you please try again?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Toggle chatbot
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Reset chat
  const handleReset = () => {
    setMessages([]);
    setExtractedData({});
    setIsComplete(false);
    fetchGreeting();
  };

  if (!isOpen) {
    return (
      <button className="chatbot-toggle" onClick={toggleChat} aria-label="Open chatbot">
        <MessageCircle size={24} />
        {Object.keys(extractedData).length > 0 && (
          <span className="chatbot-badge">{Object.keys(extractedData).length}</span>
        )}
      </button>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <Bot size={24} />
          <div>
            <h4>SwachhBot</h4>
            <span className="chatbot-status">
              {isLoading ? 'Typing...' : 'Online'}
            </span>
          </div>
        </div>
        <div className="chatbot-header-actions">
          {messages.length > 1 && (
            <button onClick={handleReset} title="Reset conversation" className="reset-btn">
              ↺
            </button>
          )}
          <button onClick={toggleChat} aria-label="Close chatbot">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className="message-content">
              <p>{msg.content}</p>
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="message-suggestions">
                  {msg.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="suggestion-chip"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {isComplete && (
        <div className="chatbot-complete-banner">
          ✓ Report details extracted! You can review and submit the form.
        </div>
      )}

      <div className="chatbot-input">
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!inputMessage.trim() || isLoading}
          className="send-button"
          aria-label="Send message"
        >
          {isLoading ? <Loader size={20} className="spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ReportChatbot;
