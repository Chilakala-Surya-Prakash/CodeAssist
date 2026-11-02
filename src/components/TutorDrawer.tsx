import React, { useEffect, useRef, useState } from 'react';
import { AlgorithmProblem, ExecutionStep, Language, TutorMessage } from '../types/visualizer';
import { float32ToBase64Pcm16, LiveAudioPlayer } from '../utils/liveAudio';
import { Mic, MicOff, Send, Volume2, X, Radio } from 'lucide-react';

interface TutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  problem: AlgorithmProblem;
  language: Language;
  code: string;
  currentStep: ExecutionStep;
  totalSteps: number;
  onStepCommand: (action: 'next' | 'prev' | 'reset' | 'goto', stepIndex?: number) => void;
  voiceTriggerCount?: number;
}

export const TutorDrawer: React.FC<TutorDrawerProps> = ({
  isOpen,
  onClose,
  problem,
  language,
  code,
  currentStep,
  totalSteps,
  onStepCommand,
  voiceTriggerCount = 0,
}) => {
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to TraceCraft Academic Tutoring. We are currently inspecting **${problem.title}** (${language.toUpperCase()}) at Step ${currentStep.stepIndex + 1}/${totalSteps}. You can ask questions in text OR switch to **Gemini Live Voice Mode** for real-time spoken explanations synchronized with the visualization on your screen.`,
      timestamp: 'Ready',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gemini Live API Voice Mode State
  const [isLiveVoiceActive, setIsLiveVoiceActive] = useState(false);
  const [isMicStreaming, setIsMicStreaming] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('Idle');
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const onStepCommandRef = useRef(onStepCommand);
  const currentStepRef = useRef(currentStep);

  useEffect(() => {
    onStepCommandRef.current = onStepCommand;
  }, [onStepCommand]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const stopLiveVoice = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      inputAudioCtxRef.current.close();
      inputAudioCtxRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }
    setIsMicStreaming(false);
    setIsLiveVoiceActive(false);
    setLiveStatus('Disconnected');
  };

  useEffect(() => {
    return () => {
      stopLiveVoice();
    };
  }, []);

  const connectLiveVoiceSession = (autoNarrateCurrentStep = false) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (autoNarrateCurrentStep) {
        sendVoiceNarrationPrompt();
      }
      return;
    }

    setIsLiveVoiceActive(true);
    setLiveStatus('Connecting to Gemini Live Voice...');
    setLiveTranscript('');

    audioPlayerRef.current = new LiveAudioPlayer();
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/api/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      const step = currentStepRef.current;
      const context = `Current Problem: ${problem.title} (${language}). Step ${step.stepIndex + 1} of ${totalSteps}: ${step.title}. Intuition: ${step.intuition}. Memory Mutation: ${step.memoryMutation}.`;
      ws.send(JSON.stringify({ type: 'init', context }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'connected') {
          setLiveStatus('Gemini Live Voice Active (24kHz PCM)');
          if (autoNarrateCurrentStep) {
            sendVoiceNarrationPrompt();
          }
        }
        if (data.audio) {
          audioPlayerRef.current?.enqueuePcm24k(data.audio);
        }
        if (data.outputTranscript) {
          setLiveTranscript((prev) => prev + data.outputTranscript);
        }
        if (data.interrupted) {
          audioPlayerRef.current?.interrupt();
        }
        if (data.visualizerCommand) {
          const cmd = data.visualizerCommand;
          if (cmd.action) {
            onStepCommandRef.current(cmd.action, cmd.stepIndex);
          }
        }
        if (data.error) {
          setLiveStatus(`Voice Error: ${data.error}`);
        }
      } catch {
        // ignore malformed frame
      }
    };

    ws.onclose = () => {
      setIsLiveVoiceActive(false);
      setIsMicStreaming(false);
      setLiveStatus('Idle');
    };
  };

  useEffect(() => {
    if (voiceTriggerCount > 0 && isOpen) {
      connectLiveVoiceSession(true);
    }
  }, [voiceTriggerCount, isOpen]);

  const sendVoiceNarrationPrompt = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const step = currentStepRef.current;
    setLiveTranscript('');
    wsRef.current.send(
      JSON.stringify({
        text: `Please explain Step ${step.stepIndex + 1} of ${totalSteps} ("${step.title}") for ${problem.title} in ${language.toUpperCase()} out loud in voice mode. Reference the exact pointers (${step.pointers.map((p) => `${p.name}->${p.targetAddress}`).join(', ')}) and memory mutation (${step.memoryMutation}), and call syncVisualizerStep(action="next") if appropriate after explaining this step.`,
      })
    );
  };

  const toggleMicrophoneStreaming = async () => {
    if (isMicStreaming) {
      if (processorRef.current) processorRef.current.disconnect();
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
      setIsMicStreaming(false);
      setLiveStatus('Gemini Live Connected (Mic Muted)');
      return;
    }

    try {
      if (!isLiveVoiceActive) {
        connectLiveVoiceSession(false);
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const base64Audio = float32ToBase64Pcm16(e.inputBuffer.getChannelData(0));
          wsRef.current.send(JSON.stringify({ audio: base64Audio }));
        }
      };

      setIsMicStreaming(true);
      setLiveStatus('Listening (16kHz PCM Mic) & Speaking (24kHz Live Audio)');
    } catch (err: any) {
      setLiveStatus(`Microphone access unavailable: ${err?.message || 'Permission denied'}`);
    }
  };

  const sendTextMessage = async (promptText?: string) => {
    const query = (promptText ?? input).trim();
    if (!query || isLoading) return;

    const userMsg: TutorMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stepContext: {
        problemTitle: problem.title,
        stepIndex: currentStep.stepIndex,
        language,
      },
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          problemTitle: problem.title,
          language,
          code,
          currentStep,
          history: messages.slice(-6),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Tutor request failed');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Note: ${err?.message || 'Unable to connect to Gemini server.'}`,
          timestamp: 'System',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Gemini AI Tutor and Live Voice Mode Panel"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-[#0F1522] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-sky-600 dark:text-sky-400">
            Gemini 3.8 Live Voice &amp; Academic Tutor
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Real-Time Personalized Mentor
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Tutor panel"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Gemini Live Native Voice Mode Deck (Synchronized with Screen Visualization) */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isLiveVoiceActive ? 'text-sky-500' : 'text-slate-400'}`} />
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Gemini Live Native Voice Mode
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {liveStatus}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Streams native 24kHz PCM voice directly from <code className="font-mono">gemini-3.8-live</code> while stepping the pointer visualization on screen.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isLiveVoiceActive) {
                sendVoiceNarrationPrompt();
              } else {
                connectLiveVoiceSession(true);
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Explain Current Step in Live Voice
          </button>

          <button
            type="button"
            onClick={toggleMicrophoneStreaming}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              isMicStreaming
                ? 'border-rose-500 bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {isMicStreaming ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isMicStreaming ? 'Mute Mic' : 'Talk Live'}
          </button>

          {isLiveVoiceActive && (
            <button
              type="button"
              onClick={stopLiveVoice}
              className="px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Stop
            </button>
          )}
        </div>

        {liveTranscript && (
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 max-h-28 overflow-y-auto">
            <div className="text-[10px] font-mono text-sky-500 mb-1">
              Live Voice Stream Transcript:
            </div>
            {liveTranscript}
          </div>
        )}
      </div>

      {/* Quick Pedagogical Prompts */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() =>
            sendTextMessage(
              `Explain why the pointer mutation at Step ${currentStep.stepIndex + 1} (${currentStep.title}) preserves the loop invariant.`
            )
          }
          className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-500 transition-colors"
        >
          Why this pointer move?
        </button>
        <button
          type="button"
          onClick={() =>
            sendTextMessage(
              `Compare the heap memory layout of ${problem.title} in Python vs Java.`
            )
          }
          className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-500 transition-colors"
        >
          Python vs Java Memory
        </button>
        <button
          type="button"
          onClick={() =>
            sendTextMessage(
              `What edge cases (like NULL head or 1-element input) should I mention in my interview for ${problem.title}?`
            )
          }
          className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-500 transition-colors"
        >
          Interview Edge Cases
        </button>
      </div>

      {/* Chat Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-xl text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-sky-600 text-white ml-6'
                : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 mr-4'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono opacity-75 mb-1">
              <span>{msg.role === 'user' ? 'You' : 'TraceCraft AI Mentor'}</span>
              <span>{msg.timestamp}</span>
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono">
            Analyzing stack &amp; heap state at Step {currentStep.stepIndex + 1}...
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendTextMessage();
        }}
        className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about pointers, memory, or complexity..."
          aria-label="Ask AI Tutor a question"
          className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send question to AI Tutor"
          className="p-2 rounded-lg bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50 text-white transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};
