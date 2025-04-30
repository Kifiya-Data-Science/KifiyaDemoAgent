'use client';

import { useState, useEffect, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';

interface Message {
  content: string;
  sender: 'user' | 'bot';
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatboxRef = useRef<HTMLDivElement>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  // Play audio chunks sequentially
  const playAudioQueue = () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    const audioBase64 = audioQueueRef.current.shift()!;
    const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
    audio.onended = () => {
      isPlayingRef.current = false;
      playAudioQueue();
    };
    audio.play().catch((err) => {
      console.error('Audio playback error:', err);
      isPlayingRef.current = false;
      playAudioQueue();
    });
  };

  // Send text input to backend and stream response
  const sendToAPI = async (userInput: string): Promise<void> => {
    console.log('Sending POST to /chat with input:', userInput);
    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: userInput }] }),
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let botMessage: Message = { content: '', sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Stream complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('Received chunk:', data);
              if (data.error) {
                botMessage.content = `Error: ${data.error}`;
                setMessages((prev) => [...prev.slice(0, -1), { ...botMessage }]);
                return;
              }
              botMessage.content += data.text || '';
              setMessages((prev) => [...prev.slice(0, -1), { ...botMessage }]);
              if (data.audio) {
                audioQueueRef.current.push(data.audio);
                playAudioQueue();
              }
            } catch (err) {
              console.error('SSE parse error:', err);
            }
          }
        }
      }

      // Handle remaining buffer
      if (buffer && buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          console.log('Final chunk:', data);
          if (data.error) {
            botMessage.content = `Error: ${data.error}`;
          } else {
            botMessage.content += data.text || '';
            if (data.audio) {
              audioQueueRef.current.push(data.audio);
              playAudioQueue();
            }
          }
          setMessages((prev) => [...prev.slice(0, -1), { ...botMessage }]);
        } catch (err) {
          console.error('Final SSE parse error:', err);
        }
      }
    } catch (error) {
      console.error('Error in sendToAPI:', error);
      setMessages((prev) => [
        ...prev,
        { content: 'Sorry, I couldn’t process your request.', sender: 'bot' },
      ]);
    }
  };

  // Send voice input to backend and stream response
  const sendVoiceToAPI = async (): Promise<void> => {
    if (audioChunksRef.current.length === 0) {
      setMessages((prev) => [
        ...prev,
        { content: 'No audio recorded.', sender: 'bot' },
      ]);
      return;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    console.log('Sending POST to /voice_chat');
    try {
      const response = await fetch('http://localhost:8000/voice_chat', {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream',
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let botMessage: Message = { content: '', sender: 'bot' };
      setMessages((prev) => [...prev, botMessage]);

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Voice chat stream complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('Received chunk:', data);
              if (data.error) {
                botMessage.content = `Error: ${data.error}`;
                setMessages((prev) => [...prev.slice(0, -1), { ...botMessage }]);
                return;
              }
              if (data.isTranscription) {
                // Replace "Recording..." with transcribed user message
                setMessages((prev) => [
                  ...prev.slice(0, -1), // Remove "Recording..." or bot message
                  { content: data.text || 'Voice input received', sender: 'user' },
                  botMessage,
                ]);
              } else {
                botMessage.content += data.text || '';
                setMessages((prev) => [...prev.slice(0, -1), { ...botMessage }]);
                if (data.audio) {
                  audioQueueRef.current.push(data.audio);
                  playAudioQueue();
                }
              }
            } catch (err) {
              console.error('SSE parse error:', err);
            }
          }
        }
      }

      // Handle remaining buffer
      if (buffer && buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          console.log('Final chunk:', data);
          if (data.error) {
            botMessage.content = `Error: ${data.error}`;
            setMessages((prev) => [...prev.slice(0, -1), { ...botMessage }]);
          } else if (data.isTranscription) {
            setMessages((prev) => [
              ...prev.slice(0, -1),
              { content: data.text || 'Voice input received', sender: 'user' },
              botMessage,
            ]);
          } else {
            botMessage.content += data.text || '';
            if (data.audio) {
              audioQueueRef.current.push(data.audio);
              playAudioQueue();
            }
            setMessages((prev) => [...prev.slice(0, -1), { ...botMessage }]);
          }
        } catch (err) {
          console.error('Final SSE parse error:', err);
        }
      }
    } catch (error) {
      console.error('Error in sendVoiceToAPI:', error);
      setMessages((prev) => [
        ...prev,
        { content: 'Sorry, I couldn’t process your voice input.', sender: 'bot' },
      ]);
    }
  };

  // Handle text input submission
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { content: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    await sendToAPI(input);
  };

  // Toggle voice recording
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = 'audio/webm;codecs=opus';
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await sendVoiceToAPI();
      };

      mediaRecorder.start();
      setIsRecording(true);
      /*setMessages((prev) => [...prev, { content: 'Recording...', sender: 'bot' }]);*/
    } catch (error) {
      console.error('Mic access error:', error);
      setMessages((prev) => [...prev, { content: 'Mic access failed.', sender: 'bot' }]);
    }
  };

  // Handle node click events
  useEffect(() => {
    const handleNodeClick = async (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const nodeId = customEvent.detail;
      setMessages((prev) => [...prev, { content: nodeId, sender: 'user' }]);
      await sendToAPI(nodeId);
    };

    window.addEventListener('nodeClicked', handleNodeClick);
    return () => window.removeEventListener('nodeClicked', handleNodeClick);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    chatboxRef.current?.scrollTo({ top: chatboxRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div ref={chatboxRef} className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}>
            <div className="content">
              <span className="sender">{msg.sender === 'user' ? 'U' : 'K'}:</span>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="chat-input"
          placeholder="Type your message..."
        />
        <IconButton onClick={handleSend} color="primary" className="icon-button">
          <SendIcon />
        </IconButton>
        <IconButton
          onClick={toggleRecording}
          color={isRecording ? 'secondary' : 'default'}
          className="icon-button"
        >
          <MicIcon />
        </IconButton>
      </div>
    </div>
  );
};

export default Chat;