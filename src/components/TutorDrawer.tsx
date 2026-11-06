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
      content: `TraceCraft Academic Mentor ready. Inspecting **${problem.title}** (${language.toUpperCase()}) at Step ${currentStep.stepIndex + 1}/${totalSteps}. Ask a question below or start Live Voice Mode for spoken walkthroughs synchronized with the memory visualizer.`,
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
    setLiveStatus('Idle');
  };

  useEffect(() => {
    return () => {
      stopLiveVoice();
    };
  }, []);

  // Fallback spoken narration for serverless deployments (e.g., Vercel) where raw WebSockets are unavailable
  const runServerlessVoiceFallback = () => {
    const step = currentStepRef.current;
    const pointerText =
      step.pointers.length > 0
        ? `Active pointers: ${step.pointers.map((p) => `${p.name} at ${p.targetAddress}`).join(', ')}.`
        : '';
    const spokenText = `Step ${step.stepIndex + 1} of ${totalSteps}: ${step.title}. ${step.intuition} ${pointerText} Memory mutation: ${step.memoryMutation}`;
    setLiveTranscript(spokenText);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = 1.02;
      utterance.onstart = () => setLiveStatus('Voice Narration Active');
      utterance.onend = () => setLiveStatus('Idle');
      window.speechSynthesis.speak(utterance);
    } else {
      setLiveStatus('Transcript Ready');
    }
  };

  const connectLiveVoiceSession = (autoNarrateCurrentStep = false) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (autoNarrateCurrentStep) {
        sendVoiceNarrationPrompt();
      }
      return;
    }

    setIsLiveVoiceActive(true);
    setLiveStatus('Connecting to Live Voice...');
    setLiveTranscript('');

    audioPlayerRef.current = new LiveAudioPlayer();
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/api/live`);
    wsRef.current = ws;

    let connectedOnce = false;

    ws.onopen = () => {
      connectedOnce = true;
      const step = currentStepRef.current;
      const context = `Current Problem: ${problem.title} (${language}). Step ${step.stepIndex + 1} of ${totalSteps}: ${step.title}. Intuition: ${step.intuition}. Memory Mutation: ${step.memoryMutation}.`;
      ws.send(JSON.stringify({ type: 'init', context }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'connected') {
          setLiveStatus('Live Voice Active (24kHz PCM)');
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
          if (autoNarrateCurrentStep) {
            runServerlessVoiceFallback();
          } else {
            setLiveStatus(`Voice Error: ${data.error}`);
          }
        }
      } catch {
        // ignore malformed frame
      }
    };

    ws.onerror = () => {
      if (!connectedOnce && autoNarrateCurrentStep) {
        runServerlessVoiceFallback();
      }
    };

    ws.onclose = () => {
      if (!connectedOnce && autoNarrateCurrentStep) {
        runServerlessVoiceFallback();
        return;
      }
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
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      runServerlessVoiceFallback();
      return;
    }
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
      setLiveStatus('Live Connected (Mic Muted)');
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
      setLiveStatus('Listening (16kHz PCM) & Speaking (24kHz Audio)');
    } catch (err: any) {
      setLiveStatus(`Microphone unavailable: ${err?.message || 'Permission denied'}`);
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
          content: `Note: ${err?.message || 'Unable to connect to tutor endpoint.'}`,
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
      aria-label="AI Tutor and Live Voice Mode Panel"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-[#111111] border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            Live Voice &amp; Academic Tutor
          </div>
          <h3 className="text-sm font-bold text-neutral-950 dark:text-neutral-100">
            Real-Time Engineering Mentor
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Tutor panel"
          className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Live Voice Mode Deck */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio
              className={`w-4 h-4 ${
                isLiveVoiceActive
                  ? 'text-neutral-950 dark:text-white'
                  : 'text-neutral-400'
              }`}
            />
            <span className="text-xs font-semibold text-neutral-950 dark:text-neutral-100">
              Live Voice Mode
            </span>
          </div>
          <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
            {liveStatus}
          </span>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Streams real-time voice explanations synchronized with the active pointer and memory state on screen.
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
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-950 transition-colors whitespace-nowrap shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Explain Step in Voice
          </button>

          <button
            type="button"
            onClick={toggleMicrophoneStreaming}
            className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              isMicStreaming
                ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950'
                : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {isMicStreaming ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isMicStreaming ? 'Mute Mic' : 'Talk Live'}
          </button>

          {isLiveVoiceActive && (
            <button
              type="button"
              onClick={stopLiveVoice}
              className="px-2.5 py-2 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-neutral-950 dark:hover:text-white"
            >
              Stop
            </button>
          )}
        </div>

        {liveTranscript && (
          <div className="p-2.5 rounded-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 max-h-28 overflow-y-auto">
            <div className="text-[10px] font-mono text-neutral-500 mb-1">
              Voice Transcript:
            </div>
            {liveTranscript}
          </div>
        )}
      </div>

      {/* Quick Pedagogical Prompts */}
      <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() =>
            sendTextMessage(
              `Explain why the pointer mutation at Step ${currentStep.stepIndex + 1} (${currentStep.title}) preserves the loop invariant.`
            )
          }
          className="px-2.5 py-1 text-[11px] font-medium rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-neutral-300 transition-colors"
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
          className="px-2.5 py-1 text-[11px] font-medium rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-neutral-300 transition-colors"
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
          className="px-2.5 py-1 text-[11px] font-medium rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-neutral-300 transition-colors"
        >
          Interview Edge Cases
        </button>
      </div>

      {/* Chat Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 ml-6'
                : 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 mr-4'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono opacity-75 mb-1">
              <span>{msg.role === 'user' ? 'You' : 'TraceCraft Mentor'}</span>
              <span>{msg.timestamp}</span>
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="p-3 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 font-mono">
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
        className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about pointers, memory, or complexity..."
          aria-label="Ask AI Tutor a question"
          className="flex-1 px-3 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-300"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send question to AI Tutor"
          className="p-2 rounded-md bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-white disabled:opacity-50 text-white dark:text-neutral-950 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </aside>
  );
};
