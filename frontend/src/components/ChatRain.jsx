import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, X } from 'lucide-react';

export default function ChatRain({ socket, user, vipLevel, playableBalance, setPlayableBalance }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeRain, setActiveRain] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('init_data', (data) => {
      if (data && data.chat) {
        setMessages(data.chat);
      }
    });

    socket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev, msg].slice(-40));
    });

    socket.on('rain_event', (data) => {
      // Spawn floating packets
      setActiveRain(data.packets);
      // Automatically clean up after 6 seconds
      setTimeout(() => {
        setActiveRain([]);
      }, 6000);
    });

    socket.on('rain_claim_success', (data) => {
      setPlayableBalance(data.balance);
      alert(`Claimed! ₹${data.amount} added to playable balance.`);
    });

    return () => {
      socket.off('init_data');
      socket.off('chat_message');
      socket.off('rain_event');
      socket.off('rain_claim_success');
    };
  }, [socket, setPlayableBalance]);

  const handleSend = () => {
    if (!inputText.trim() || !socket) return;
    socket.emit('send_chat', {
      sender: user ? user.phone_number.substring(0, 3) + '***' : 'Player',
      text: inputText,
      vip_level: vipLevel
    });
    setInputText('');
  };

  const claimPacket = (packet) => {
    if (!socket || !user) return;
    socket.emit('claim_rain', {
      userId: user.id,
      amount: packet.amount
    });
    // Remove packet visually
    setActiveRain((prev) => prev.filter((p) => p.id !== packet.id));
  };

  return (
    <>
      {/* Floating Rain Layer */}
      <div className="rain-container">
        {activeRain.map((packet, index) => (
          <div
            key={packet.id}
            className="rain-packet"
            style={{
              left: `${Math.random() * 70 + 10}%`,
              animationDelay: `${index * 0.2}s`
            }}
            onClick={() => claimPacket(packet)}
          >
            <Sparkles size={16} color="#D4AF37" />
            <div>₹{packet.amount}</div>
          </div>
        ))}
      </div>

      {/* Slideout Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'absolute',
          right: '12px',
          top: '80px',
          zIndex: 90,
          background: 'rgba(22, 22, 26, 0.8)',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '10px',
          borderRadius: '50%',
          color: 'var(--success-layer)',
          cursor: 'pointer',
          backdropFilter: 'blur(5px)'
        }}
      >
        <MessageSquare size={20} />
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '280px',
            height: '100%',
            background: 'rgba(22, 22, 26, 0.98)',
            borderLeft: '1px solid var(--border-glass)',
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(15px)'
          }}
        >
          {/* Header */}
          <div className="row p-12" style={{ borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--success-layer)" />
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>VIP Live Chat</span>
            </div>
            <X size={20} style={{ cursor: 'pointer', color: '#888' }} onClick={() => setIsOpen(false)} />
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: m.system ? 'rgba(0, 229, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                  border: m.system ? '1px solid rgba(0, 229, 255, 0.1)' : '1px solid var(--border-glass)',
                  padding: '8px',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              >
                <div className="row mb-12">
                  <span
                    style={{
                      fontWeight: 700,
                      color: m.system ? 'var(--success-layer)' : '#fff',
                      fontSize: '12px'
                    }}
                  >
                    {m.sender}
                  </span>
                  {m.vip > 0 && (
                    <span
                      style={{
                        color: 'var(--vip-status)',
                        fontSize: '9px',
                        fontWeight: 700,
                        border: '1px solid var(--vip-status)',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        transform: 'scale(0.9)'
                      }}
                    >
                      VIP {m.vip}
                    </span>
                  )}
                </div>
                <div style={{ color: m.system ? '#00E5FF' : '#E2E2E9', wordBreak: 'break-word' }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="row p-12" style={{ borderTop: '1px solid var(--border-glass)' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, marginRight: '8px', padding: '8px 12px', fontSize: '13px' }}
              placeholder="Send messages..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              style={{
                background: 'var(--success-layer)',
                color: '#09090A',
                border: 'none',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
