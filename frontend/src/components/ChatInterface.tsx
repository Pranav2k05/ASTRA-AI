import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Monitor, Loader2, Check, Command, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface Wallpaper {
  id: string;
  description: string;
  fullUrl: string;
  thumbUrl: string;
  author: string;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  wallpapers?: Wallpaper[];
  actionExecuted?: string;
  success?: boolean;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Hello! I am **ASTRA**, your secure personal AI Assistant. How can I help you on your laptop today?\n\nYou can ask me to:\n- Open code folders: `open vscode C:\\folder`\n- Launch terminals: `open powershell` or `open cmd`\n- Organize your Desktop files: `organize desktop`\n- Search and apply wallpapers: `search wallpapers neon city`"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [wallpaperLoading, setWallpaperLoading] = useState<string | null>(null);
  const [wallpaperApplied, setWallpaperApplied] = useState<string | null>(null);
  
  // Voice integration states
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const voiceEnabledRef = useRef(voiceEnabled);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          submitMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'X-ASTRA-Token': (window as any).ASTRA_TOKEN || ''
    };
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\*\*|`|\[ACTION:[^\]]+\]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) || 
                           voices.find(v => v.lang.startsWith('en')) || 
                           voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const submitMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: text })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.reply,
          wallpapers: data.wallpapers,
          actionExecuted: data.actionExecuted,
          success: data.success
        }]);

        if (voiceEnabledRef.current) {
          speakText(data.reply);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: `Error: ${errData.error || 'Failed to process message with backend.'}`
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `Failed to connect to local ASTRA server. Make sure the Java backend is active.\n\n*(Error: ${err.message})*`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    submitMessage(inputValue);
    setInputValue('');
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setInputValue('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSetWallpaper = async (wallpaper: Wallpaper) => {
    setWallpaperLoading(wallpaper.id);
    setWallpaperApplied(null);
    try {
      const res = await fetch('/api/system/wallpaper/set', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ url: wallpaper.fullUrl })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWallpaperApplied(wallpaper.id);
      } else {
        alert(data.error || 'Failed to apply wallpaper.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating desktop background.');
    } finally {
      setWallpaperLoading(null);
    }
  };

  // Custom JSX Renderer for standard chat markdown strings
  const renderMessageText = (text: string) => {
    const blocks = text.split(/(```[\s\S]*?```)/g);
    return blocks.map((block, idx) => {
      if (block.startsWith('```') && block.endsWith('```')) {
        const content = block.slice(3, -3).trim();
        const lines = content.split('\n');
        // If the first line is language format, omit it
        const isLang = /^[a-zA-Z0-9_-]+$/.test(lines[0].trim());
        const codeContent = isLang ? lines.slice(1).join('\n') : content;
        
        return (
          <pre key={idx} style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '16px',
            borderRadius: '10px',
            overflowX: 'auto',
            fontSize: '13px',
            fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border-light)',
            margin: '12px 0',
            color: '#a9b1d6',
            lineHeight: 1.5
          }}>
            <code>{codeContent}</code>
          </pre>
        );
      }

      const parts = block.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
      return (
        <span key={idx}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} style={{ color: 'white', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={pIdx} style={{
                background: 'rgba(255,255,255,0.08)',
                padding: '3px 7px',
                borderRadius: '6px',
                color: '#f43f5e',
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>{part.slice(1, -1)}</code>;
            }
            if (part === '\n') {
              return <br key={pIdx} />;
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%', overflow: 'hidden' }}>
      
      {/* Scrollable Chat Area */}
      <div style={{ flexGrow: 1, overflowY: 'auto', padding: '0 8px 24px 8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className="animate-slide-in"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            {/* Sender Badge */}
            <span style={{ 
              fontSize: '11px', 
              color: 'var(--text-muted)', 
              marginBottom: '6px', 
              fontWeight: 600,
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {msg.sender === 'user' ? 'You' : 'ASTRA AI'}
              {msg.sender === 'assistant' && <Sparkles size={10} style={{ color: 'var(--accent-primary)' }} />}
            </span>

            {/* Bubble */}
            <div style={{
              maxWidth: '85%',
              padding: '16px 20px',
              borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
              background: msg.sender === 'user' 
                ? 'var(--gradient-primary)' 
                : 'rgba(255, 255, 255, 0.03)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border-light)',
              boxShadow: msg.sender === 'user' 
                ? '0 10px 15px -3px rgba(139, 92, 246, 0.2)' 
                : 'none',
              color: 'var(--text-primary)',
              fontSize: '15px',
              lineHeight: 1.6
            }}>
              {renderMessageText(msg.text)}

              {/* Tag indicator showing triggered actions */}
              {msg.actionExecuted && msg.actionExecuted !== 'NONE' && (
                <div style={{ 
                  marginTop: '12px', 
                  paddingTop: '12px', 
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: msg.success ? 'var(--accent-green)' : 'var(--accent-red)'
                }}>
                  <Command size={12} />
                  <span>
                    Action Executed: <strong>{msg.actionExecuted}</strong> ({msg.success ? 'Success' : 'Failed'})
                  </span>
                </div>
              )}
            </div>

            {/* Wallpaper Results Grid inside chat bubble */}
            {msg.wallpapers && msg.wallpapers.length > 0 && (
              <div style={{
                marginTop: '16px',
                width: '100%',
                maxWidth: '85%',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px'
              }}>
                {msg.wallpapers.map((wp) => (
                  <div key={wp.id} className="glass-panel" style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--border-light)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                  >
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', overflow: 'hidden' }}>
                      <img
                        src={wp.thumbUrl}
                        alt={wp.description}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        by {wp.author}
                      </span>
                      <button
                        onClick={() => handleSetWallpaper(wp)}
                        disabled={wallpaperLoading === wp.id}
                        className="glow-button"
                        style={{
                          marginTop: 'auto',
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: wallpaperApplied === wp.id 
                            ? 'var(--accent-green)' 
                            : 'var(--gradient-primary)',
                          boxShadow: wallpaperApplied === wp.id 
                            ? '0 4px 10px rgba(16, 185, 129, 0.3)' 
                            : '0 4px 10px rgba(139, 92, 246, 0.3)'
                        }}
                      >
                        {wallpaperLoading === wp.id ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Applying...
                          </>
                        ) : wallpaperApplied === wp.id ? (
                          <>
                            <Check size={12} />
                            Applied!
                          </>
                        ) : (
                          <>
                            <Monitor size={12} />
                            Set Desktop Background
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>ASTRA AI</span>
            <div style={{
              padding: '16px 20px',
              borderRadius: '18px 18px 18px 2px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form Bar */}
      <form onSubmit={handleSendMessage} style={{
        marginTop: 'auto',
        display: 'flex',
        gap: '12px',
        padding: '12px 16px',
        background: 'rgba(18, 18, 30, 0.4)',
        border: '1px solid var(--border-light)',
        borderRadius: '14px',
        alignItems: 'center'
      }}>
        {/* Toggle Audio Feedback */}
        <button
          type="button"
          onClick={() => setVoiceEnabled(prev => !prev)}
          style={{
            background: 'transparent',
            border: 'none',
            color: voiceEnabled ? 'var(--accent-primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            transition: 'color 0.2s'
          }}
          title={voiceEnabled ? "Mute spoken feedback" : "Enable spoken feedback"}
        >
          {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {isListening ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexGrow: 1, padding: '8px 4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 600, marginRight: '8px' }}>ASTRA is listening...</span>
            <div className="voice-bar voice-bar-1"></div>
            <div className="voice-bar voice-bar-2"></div>
            <div className="voice-bar voice-bar-3"></div>
            <div className="voice-bar voice-bar-4"></div>
          </div>
        ) : (
          <input
            type="text"
            placeholder="Ask ASTRA to open folders, terminals, set backgrounds or clean the desktop..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            style={{
              flexGrow: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: '15px',
              padding: '8px 4px'
            }}
          />
        )}

        {/* Toggle Microphone */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={loading}
          style={{
            background: isListening ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            border: isListening ? '1px solid rgba(6, 182, 212, 0.3)' : 'none',
            borderRadius: '50%',
            color: isListening ? 'var(--accent-cyan)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            transition: 'all 0.2s'
          }}
          title={isListening ? "Stop listening" : "Talk to ASTRA"}
        >
          {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
        </button>

        <button
          type="submit"
          disabled={loading || !inputValue.trim() || isListening}
          className="glow-button"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
