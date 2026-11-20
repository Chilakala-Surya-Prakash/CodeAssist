import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Pause,
  Play,
  RotateCcw,
  Server,
} from 'lucide-react';
import {
  SYSTEMS_CONCURRENCY_SCENARIOS,
  SystemsArchitectureScenario,
} from '../utils/zeroCostEngines';

interface SystemsConcurrencyLabProps {
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  stepIdx: number;
  onStepChange: (idx: number) => void;
}

function renderConsistentHashingSvg(stepIdx: number) {
  // Ring center (375, 148), radius 84 inside 760x290 canvas for generous label clearance
  const cx = 375;
  const cy = 148;
  const r = 84;
  const polar = (deg: number, radius = r) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const nodeA = polar(120);
  const nodeB = polar(240);
  const nodeC = polar(350);
  const keyPos = polar(198);
  const keyOuter = polar(198, r + 28);

  const isCrash = stepIdx === 2;
  const isRouteB = stepIdx === 1;

  return (
    <svg
      viewBox="0 0 760 290"
      className="w-full h-[250px] sm:h-[275px]"
      role="img"
      aria-label="Consistent Hashing Ring Topology Diagram"
      data-testid="systems-topology-svg"
    >
      <defs>
        <marker id="sys-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
        </marker>
        <marker id="sys-arrow-emerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
        </marker>
        <marker id="sys-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
        </marker>
      </defs>

      {/* Client & L7 Proxy Box on far left */}
      <rect x="16" y="42" width="144" height="84" rx="10" className="fill-white dark:fill-neutral-900 stroke-blue-500" strokeWidth="1.8" />
      <text x="88" y="68" textAnchor="middle" className="fill-neutral-900 dark:fill-white text-[11px] font-mono font-bold">
        L7 Envoy Proxy
      </text>
      <text x="88" y="86" textAnchor="middle" className="fill-neutral-500 text-[10px] font-mono">
        MurmurHash3
      </text>
      <text x="88" y="108" textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 text-[10px] font-mono font-semibold">
        user_9481 → 198°
      </text>

      {/* Arrow from Proxy cleanly down-right to Key 198° */}
      <path
        d={`M 88 126 Q 92 252 ${keyOuter.x - 16} ${keyOuter.y - 2}`}
        fill="none"
        stroke="#2563EB"
        strokeWidth="2"
        strokeDasharray={stepIdx === 0 ? '5 4' : 'none'}
        markerEnd="url(#sys-arrow-blue)"
      />

      {/* Hash Ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-neutral-300 dark:stroke-neutral-700" strokeWidth="3" />
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-neutral-500 text-[10px] font-mono">
        Hash Space
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" className="fill-neutral-800 dark:fill-neutral-200 text-[11px] font-mono font-bold">
        [0 .. 2³² - 1]
      </text>
      <text x={cx} y={cy + 24} textAnchor="middle" className="fill-neutral-400 text-[9px] font-mono">
        Clockwise Lookup ↻
      </text>

      {/* Clockwise Routing Arc: 198° -> 240° (Step 1) or 198° -> 350° (Step 2 Failover) */}
      {isRouteB && (
        <path
          d={`M ${keyPos.x} ${keyPos.y} A ${r} ${r} 0 0 1 ${nodeB.x} ${nodeB.y}`}
          fill="none"
          stroke="#059669"
          strokeWidth="4"
          markerEnd="url(#sys-arrow-emerald)"
        />
      )}
      {isCrash && (
        <path
          d={`M ${keyPos.x} ${keyPos.y} A ${r} ${r} 0 0 1 ${nodeC.x} ${nodeC.y}`}
          fill="none"
          stroke="#D97706"
          strokeWidth="4"
          strokeDasharray="6 3"
          markerEnd="url(#sys-arrow-amber)"
        />
      )}

      {/* Key Marker @ 198° */}
      <circle cx={keyPos.x} cy={keyPos.y} r="7" fill="#2563EB" />
      <text x={keyOuter.x + 8} y={keyOuter.y + 8} textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 text-[10.5px] font-mono font-bold">
        Key (198°)
      </text>

      {/* Node A @ 120° */}
      <circle cx={nodeA.x} cy={nodeA.y} r="13" className="fill-white dark:fill-neutral-900 stroke-neutral-400 dark:stroke-neutral-500" strokeWidth="2" />
      <text x={nodeA.x} y={nodeA.y + 4} textAnchor="middle" className="fill-neutral-800 dark:fill-neutral-200 text-[10px] font-mono font-bold">
        A
      </text>
      <text x={nodeA.x + 22} y={nodeA.y + 4} className="fill-neutral-700 dark:fill-neutral-300 text-[10.5px] font-mono font-medium">
        Node A (120°) · Untouched
      </text>

      {/* Node B @ 240° */}
      <circle
        cx={nodeB.x}
        cy={nodeB.y}
        r="14"
        className={
          isCrash
            ? 'fill-rose-600 stroke-rose-400'
            : isRouteB
            ? 'fill-emerald-600 stroke-emerald-400'
            : 'fill-white dark:fill-neutral-900 stroke-blue-500'
        }
        strokeWidth="2.5"
      />
      <text
        x={nodeB.x}
        y={nodeB.y + 4}
        textAnchor="middle"
        className={isCrash || isRouteB ? 'fill-white text-[10px] font-mono font-bold' : 'fill-neutral-900 dark:fill-white text-[10px] font-mono font-bold'}
      >
        {isCrash ? '✕' : 'B'}
      </text>
      <text
        x={nodeB.x - 22}
        y={nodeB.y + 4}
        textAnchor="end"
        className={isCrash ? 'fill-rose-600 dark:fill-rose-400 text-[10.5px] font-mono font-bold' : 'fill-neutral-700 dark:fill-neutral-300 text-[10.5px] font-mono font-semibold'}
      >
        {isCrash ? 'Node B (240°) · CRASHED' : 'Node B (240°) · Target'}
      </text>

      {/* Node C @ 350° */}
      <circle
        cx={nodeC.x}
        cy={nodeC.y}
        r="14"
        className={
          isCrash
            ? 'fill-amber-500 stroke-amber-300'
            : 'fill-white dark:fill-neutral-900 stroke-neutral-400 dark:stroke-neutral-500'
        }
        strokeWidth="2.5"
      />
      <text
        x={nodeC.x}
        y={nodeC.y + 4}
        textAnchor="middle"
        className={isCrash ? 'fill-neutral-950 text-[10px] font-mono font-bold' : 'fill-neutral-800 dark:fill-neutral-200 text-[10px] font-mono font-bold'}
      >
        C
      </text>
      <text
        x={nodeC.x}
        y={nodeC.y - 22}
        textAnchor="middle"
        className={isCrash ? 'fill-amber-600 dark:fill-amber-400 text-[10.5px] font-mono font-bold' : 'fill-neutral-600 dark:fill-neutral-400 text-[10.5px] font-mono'}
      >
        {isCrash ? 'Node C (350°) · FAILOVER HIT' : 'Node C (350°) · Replica'}
      </text>

      {/* Churn Guarantee Card cleanly placed in upper-right clear zone */}
      <rect x="554" y="64" width="194" height="74" rx="8" className="fill-white dark:fill-neutral-900 stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1.4" />
      <text x="568" y="85" className="fill-neutral-500 text-[9.5px] font-mono uppercase font-semibold">
        Churn Guarantee
      </text>
      <text x="568" y="105" className="fill-neutral-900 dark:fill-white text-[11px] font-mono font-bold">
        {isCrash ? 'Only (120°..240°] remaps' : 'O(log V) TreeMap lookup'}
      </text>
      <text x="568" y="123" className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-mono">
        {isCrash ? 'Node A stays 100% warm' : 'O(K/N) keys move on scale'}
      </text>
    </svg>
  );
}

function renderRedisPipelineSvg(stepIdx: number) {
  const nodes = [
    { x: 24, label: 'API Workers', sub: '1,200 concurrent', active: true, tone: 'blue' },
    { x: 184, label: 'Redis L1 KV', sub: stepIdx === 0 ? 'MISS (NIL)' : stepIdx === 2 ? 'SETEX HOT' : 'Waiting', active: stepIdx === 0 || stepIdx === 2, tone: stepIdx === 0 ? 'rose' : 'emerald' },
    { x: 344, label: 'SETNX Lock', sub: stepIdx === 1 ? 'Worker #1 Holds' : 'TTL 2000ms', active: stepIdx === 1, tone: 'amber' },
    { x: 500, label: 'PostgreSQL', sub: stepIdx === 1 ? '1 Single Query' : 'Protected', active: stepIdx === 1, tone: 'emerald' },
  ];

  return (
    <svg viewBox="0 0 640 220" className="w-full h-[210px]" role="img" aria-label="Redis Cache-Aside and Lease Lock Diagram" data-testid="systems-topology-svg">
      <defs>
        <marker id="redis-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
        </marker>
        <marker id="redis-arr-ok" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
        </marker>
      </defs>

      {nodes.map((n, idx) => (
        <g key={n.label}>
          <rect
            x={n.x}
            y="62"
            width="124"
            height="84"
            rx="10"
            className={
              n.active
                ? 'fill-white dark:fill-neutral-900 stroke-blue-600 dark:stroke-blue-400'
                : 'fill-neutral-50 dark:fill-neutral-900/50 stroke-neutral-300 dark:stroke-neutral-700'
            }
            strokeWidth={n.active ? 2.2 : 1.2}
          />
          <text x={n.x + 62} y="96" textAnchor="middle" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
            {n.label}
          </text>
          <text x={n.x + 62} y="118" textAnchor="middle" className="fill-neutral-500 text-[10px] font-mono">
            {n.sub}
          </text>
          {idx < nodes.length - 1 && (
            <line
              x1={n.x + 124}
              y1="104"
              x2={nodes[idx + 1].x - 4}
              y2="104"
              stroke={stepIdx === 2 && idx === 0 ? '#059669' : '#2563EB'}
              strokeWidth={n.active ? 2.2 : 1.3}
              strokeDasharray={n.active ? 'none' : '4 4'}
              markerEnd={stepIdx === 2 && idx === 0 ? 'url(#redis-arr-ok)' : 'url(#redis-arr)'}
            />
          )}
        </g>
      ))}

      {/* Bottom Flow Banner */}
      <rect x="24" y="168" width="600" height="34" rx="7" className="fill-neutral-100 dark:fill-neutral-900 stroke-neutral-200 dark:stroke-neutral-800" />
      <text x="324" y="189" textAnchor="middle" className="fill-neutral-800 dark:fill-neutral-200 text-[11px] font-mono font-semibold">
        {stepIdx === 0
          ? 'Thundering Herd Risk: 1,200 misses arrive simultaneously on key "feed:celebrity_1"'
          : stepIdx === 1
          ? 'Single-Flight Coalescing: Worker #1 acquires SETNX Lease → 1,199 peers backoff 15ms (saved 1,199 DB queries)'
          : 'Write-Back + Jittered TTL (3600s + 42s): Redis hot, P99 latency returns to 0.8ms'}
      </text>
    </svg>
  );
}

function renderTokenBucketSvg(stepIdx: number) {
  const tokensRemaining = stepIdx === 0 ? 0 : 0;
  const rejected = stepIdx === 1;

  return (
    <svg viewBox="0 0 640 220" className="w-full h-[210px]" role="img" aria-label="Redis Lua Atomic Token Bucket Diagram" data-testid="systems-topology-svg">
      <defs>
        <marker id="tb-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill={rejected ? '#E11D48' : '#059669'} />
        </marker>
      </defs>

      {/* API Gateway */}
      <rect x="20" y="56" width="136" height="90" rx="10" className="fill-white dark:fill-neutral-900 stroke-blue-500" strokeWidth="2" />
      <text x="88" y="88" textAnchor="middle" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
        API Gateway
      </text>
      <text x="88" y="108" textAnchor="middle" className="fill-neutral-500 text-[10px] font-mono">
        {rejected ? 'Burst Req #4 (t=10.2s)' : 'Burst #1-#3 (t=10.0s)'}
      </text>
      <text x="88" y="128" textAnchor="middle" className={rejected ? 'fill-rose-600 dark:fill-rose-400 text-[10px] font-mono font-bold' : 'fill-emerald-600 dark:fill-emerald-400 text-[10px] font-mono font-bold'}>
        {rejected ? 'HTTP 429 REJECT' : 'HTTP 200 ALLOWED'}
      </text>

      {/* Arrow Gateway -> Lua */}
      <line x1="156" y1="101" x2="206" y2="101" stroke={rejected ? '#E11D48' : '#059669'} strokeWidth="2.2" markerEnd="url(#tb-arr)" />

      {/* Redis Lua Atomic Bucket */}
      <rect x="212" y="34" width="212" height="134" rx="10" className="fill-neutral-50 dark:fill-neutral-900 stroke-neutral-400 dark:stroke-neutral-600" strokeWidth="1.8" />
      <text x="318" y="56" textAnchor="middle" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
        Redis Lua Token Bucket
      </text>
      <text x="318" y="72" textAnchor="middle" className="fill-neutral-500 text-[9.5px] font-mono">
        Cap = 3 · Refill = 1 token/sec (Atomic)
      </text>

      {/* 3 Visual Token Slots */}
      {[0, 1, 2].map((slot) => (
        <g key={slot}>
          <rect
            x={236 + slot * 58}
            y="88"
            width="46"
            height="46"
            rx="8"
            className={
              slot < tokensRemaining
                ? 'fill-emerald-500 stroke-emerald-700'
                : 'fill-white dark:fill-neutral-950 stroke-dashed stroke-neutral-300 dark:stroke-neutral-700'
            }
            strokeDasharray={slot < tokensRemaining ? 'none' : '4 3'}
            strokeWidth="1.6"
          />
          <text x={259 + slot * 58} y="115" textAnchor="middle" className="fill-neutral-400 text-[9.5px] font-mono font-bold">
            {rejected ? 'EMPTY' : 'USED'}
          </text>
        </g>
      ))}
      <text x="318" y="154" textAnchor="middle" className="fill-neutral-600 dark:fill-neutral-400 text-[9.5px] font-mono">
        {rejected ? 'Refill = floor(0.2s * 1/s) = 0 → Drop' : '3 tokens consumed atomically → 0 left'}
      </text>

      {/* Arrow Lua -> GPU Pool */}
      <line
        x1="424"
        y1="101"
        x2="474"
        y2="101"
        stroke={rejected ? '#E11D48' : '#059669'}
        strokeWidth="2.2"
        strokeDasharray={rejected ? '5 4' : 'none'}
        markerEnd="url(#tb-arr)"
      />

      {/* Upstream GPU Pool */}
      <rect
        x="480"
        y="56"
        width="140"
        height="90"
        rx="10"
        className={
          rejected
            ? 'fill-emerald-50 dark:fill-emerald-950/30 stroke-emerald-500'
            : 'fill-white dark:fill-neutral-900 stroke-emerald-500'
        }
        strokeWidth="2"
      />
      <text x="550" y="88" textAnchor="middle" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
        Inference GPUs
      </text>
      <text x="550" y="108" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-mono font-semibold">
        {rejected ? 'Protected (0 overload)' : 'Serving 3 Requests'}
      </text>
      <text x="550" y="128" textAnchor="middle" className="fill-neutral-500 text-[9.5px] font-mono">
        Zero race conditions
      </text>
    </svg>
  );
}

function renderMesiFalseSharingSvg(stepIdx: number) {
  const isPadded = stepIdx === 2;
  const isRfo = stepIdx === 1;

  return (
    <svg viewBox="0 0 640 245" className="w-full h-[235px]" role="img" aria-label="CPU L1 64-Byte Cache Line False Sharing MESI Schematic" data-testid="systems-topology-svg">
      {/* Core 0 */}
      <rect x="28" y="20" width="240" height="74" rx="10" className="fill-white dark:fill-neutral-900 stroke-blue-500" strokeWidth="2" />
      <text x="44" y="44" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
        CPU Core 0 (Thread A: counterA++)
      </text>
      <text x="44" y="64" className="fill-neutral-500 text-[10px] font-mono">
        L1d Cache Line 0x1000
      </text>
      <rect x="192" y="50" width="64" height="24" rx="5" className={stepIdx === 0 ? 'fill-blue-100 dark:fill-blue-950' : 'fill-emerald-600'} />
      <text x="224" y="66" textAnchor="middle" className={stepIdx === 0 ? 'fill-blue-700 dark:fill-blue-300 text-[10px] font-mono font-bold' : 'fill-white text-[10px] font-mono font-bold'}>
        {stepIdx === 0 ? 'SHARED (S)' : 'MOD (M)'}
      </text>

      {/* Core 1 */}
      <rect x="372" y="20" width="240" height="74" rx="10" className={isRfo ? 'fill-rose-50 dark:fill-rose-950/30 stroke-rose-500' : 'fill-white dark:fill-neutral-900 stroke-emerald-500'} strokeWidth="2" />
      <text x="388" y="44" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
        CPU Core 1 (Thread B: counterB++)
      </text>
      <text x="388" y="64" className="fill-neutral-500 text-[10px] font-mono">
        {isPadded ? 'L1d Cache Line 0x1040' : 'L1d Cache Line 0x1000'}
      </text>
      <rect x="536" y="50" width="64" height="24" rx="5" className={isRfo ? 'fill-rose-600' : isPadded ? 'fill-emerald-600' : 'fill-blue-100 dark:fill-blue-950'} />
      <text x="568" y="66" textAnchor="middle" className={isRfo || isPadded ? 'fill-white text-[10px] font-mono font-bold' : 'fill-blue-700 dark:fill-blue-300 text-[10px] font-mono font-bold'}>
        {isRfo ? 'INVALID (I)' : isPadded ? 'MOD (M)' : 'SHARED (S)'}
      </text>

      {/* MESI Bus arrow between Core 0 & Core 1 */}
      <line
        x1="268"
        y1="57"
        x2="372"
        y2="57"
        stroke={isRfo ? '#E11D48' : isPadded ? '#059669' : '#94A3B8'}
        strokeWidth={isRfo ? 3 : 1.5}
        strokeDasharray={isPadded ? '4 4' : 'none'}
      />
      <text x="320" y="48" textAnchor="middle" className={isRfo ? 'fill-rose-600 dark:fill-rose-400 text-[9.5px] font-mono font-bold' : 'fill-neutral-500 text-[9.5px] font-mono'}>
        {isRfo ? 'RFO INVALIDATE!' : isPadded ? 'Zero Bus Traffic' : 'MESI Ring Bus'}
      </text>

      {/* 64-Byte Cache Line Layout */}
      {!isPadded ? (
        <g>
          <rect x="76" y="132" width="488" height="84" rx="10" className="fill-neutral-50 dark:fill-neutral-900 stroke-neutral-400 dark:stroke-neutral-700" strokeWidth="1.8" />
          <text x="92" y="154" className="fill-neutral-500 text-[10px] font-mono font-semibold">
            SINGLE 64-BYTE CACHE LINE (0x1000 .. 0x103F) — FALSE SHARING COLLISION
          </text>
          <rect x="92" y="166" width="110" height="36" rx="6" className="fill-blue-600" />
          <text x="147" y="188" textAnchor="middle" className="fill-white text-[10.5px] font-mono font-bold">
            counterA (+0x00)
          </text>
          <rect x="208" y="166" width="110" height="36" rx="6" className={isRfo ? 'fill-rose-600' : 'fill-emerald-600'} />
          <text x="263" y="188" textAnchor="middle" className="fill-white text-[10.5px] font-mono font-bold">
            counterB (+0x04)
          </text>
          <rect x="324" y="166" width="224" height="36" rx="6" className="fill-neutral-200 dark:fill-neutral-800" />
          <text x="436" y="188" textAnchor="middle" className="fill-neutral-500 text-[10px] font-mono">
            Remaining 56 bytes in same cache line
          </text>
        </g>
      ) : (
        <g>
          <rect x="28" y="132" width="276" height="84" rx="10" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-500" strokeWidth="1.8" />
          <text x="44" y="154" className="fill-emerald-700 dark:fill-emerald-300 text-[10px] font-mono font-bold">
            LINE 0: 0x1000..0x103F (alignas(64))
          </text>
          <rect x="44" y="166" width="108" height="36" rx="6" className="fill-blue-600" />
          <text x="98" y="188" textAnchor="middle" className="fill-white text-[10px] font-mono font-bold">
            counterA (+0x00)
          </text>
          <rect x="158" y="166" width="130" height="36" rx="6" className="fill-neutral-200 dark:fill-neutral-800" />
          <text x="223" y="188" textAnchor="middle" className="fill-neutral-500 text-[9.5px] font-mono">
            60B Padding
          </text>

          <rect x="336" y="132" width="276" height="84" rx="10" className="fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-500" strokeWidth="1.8" />
          <text x="352" y="154" className="fill-emerald-700 dark:fill-emerald-300 text-[10px] font-mono font-bold">
            LINE 1: 0x1040..0x107F (alignas(64))
          </text>
          <rect x="352" y="166" width="108" height="36" rx="6" className="fill-emerald-600" />
          <text x="406" y="188" textAnchor="middle" className="fill-white text-[10px] font-mono font-bold">
            counterB (+0x40)
          </text>
          <rect x="466" y="166" width="130" height="36" rx="6" className="fill-neutral-200 dark:fill-neutral-800" />
          <text x="531" y="188" textAnchor="middle" className="fill-neutral-500 text-[9.5px] font-mono">
            60B Padding
          </text>
        </g>
      )}
    </svg>
  );
}

function renderDeadlockSvg(stepIdx: number) {
  const isDeadlock = stepIdx === 1;
  const isResolved = stepIdx === 2;

  return (
    <svg viewBox="0 0 640 245" className="w-full h-[235px]" role="img" aria-label="Mutex AB-BA Deadlock Wait-For Graph Diagram" data-testid="systems-topology-svg">
      <defs>
        <marker id="dl-hold" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
        </marker>
        <marker id="dl-wait" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#E11D48" />
        </marker>
      </defs>

      {/* Thread 1 (Top Left) */}
      <rect x="46" y="28" width="170" height="62" rx="10" className={isDeadlock ? 'fill-rose-50 dark:fill-rose-950/30 stroke-rose-500' : 'fill-white dark:fill-neutral-900 stroke-blue-500'} strokeWidth="2" />
      <text x="131" y="54" textAnchor="middle" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
        Thread 1 (A → B)
      </text>
      <text x="131" y="74" textAnchor="middle" className={isDeadlock ? 'fill-rose-600 dark:fill-rose-400 text-[10px] font-mono font-bold' : 'fill-neutral-500 text-[10px] font-mono'}>
        {isDeadlock ? 'BLOCKED on Mutex_B' : isResolved ? 'Locks 0x5000 → 0x5040' : 'Holds Mutex_A'}
      </text>

      {/* Mutex A (Top Right) */}
      <rect x="424" y="28" width="170" height="62" rx="10" className="fill-neutral-50 dark:fill-neutral-900 stroke-emerald-500" strokeWidth="2" />
      <text x="509" y="54" textAnchor="middle" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
        Mutex_A (0x5000)
      </text>
      <text x="509" y="74" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-mono">
        {isResolved ? '1st Global Order' : 'Owner: Thread 1'}
      </text>

      {/* Mutex B (Bottom Left) */}
      <rect x="46" y="156" width="170" height="62" rx="10" className="fill-neutral-50 dark:fill-neutral-900 stroke-emerald-500" strokeWidth="2" />
      <text x="131" y="182" textAnchor="middle" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
        Mutex_B (0x5040)
      </text>
      <text x="131" y="202" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[10px] font-mono">
        {isResolved ? '2nd Global Order' : 'Owner: Thread 2'}
      </text>

      {/* Thread 2 (Bottom Right) */}
      <rect x="424" y="156" width="170" height="62" rx="10" className={isDeadlock ? 'fill-rose-50 dark:fill-rose-950/30 stroke-rose-500' : 'fill-white dark:fill-neutral-900 stroke-blue-500'} strokeWidth="2" />
      <text x="509" y="182" textAnchor="middle" className="fill-neutral-950 dark:fill-white text-[11px] font-mono font-bold">
        Thread 2 (B → A)
      </text>
      <text x="509" y="202" textAnchor="middle" className={isDeadlock ? 'fill-rose-600 dark:fill-rose-400 text-[10px] font-mono font-bold' : 'fill-neutral-500 text-[10px] font-mono'}>
        {isDeadlock ? 'BLOCKED on Mutex_A' : isResolved ? 'Waits cleanly for 0x5000' : 'Holds Mutex_B'}
      </text>

      {/* Ownership & Wait Edges */}
      {!isResolved ? (
        <>
          <line x1="424" y1="59" x2="220" y2="59" stroke="#059669" strokeWidth="2.2" markerEnd="url(#dl-hold)" />
          <text x="322" y="50" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[9.5px] font-mono font-bold">
            HELD BY T1
          </text>

          <line x1="216" y1="187" x2="420" y2="187" stroke="#059669" strokeWidth="2.2" markerEnd="url(#dl-hold)" />
          <text x="322" y="204" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-[9.5px] font-mono font-bold">
            HELD BY T2
          </text>

          {isDeadlock && (
            <>
              <line x1="131" y1="90" x2="131" y2="152" stroke="#E11D48" strokeWidth="2.5" strokeDasharray="5 3" markerEnd="url(#dl-wait)" />
              <text x="142" y="126" className="fill-rose-600 dark:fill-rose-400 text-[9.5px] font-mono font-bold">
                T1 WAITS
              </text>
              <line x1="509" y1="156" x2="509" y2="94" stroke="#E11D48" strokeWidth="2.5" strokeDasharray="5 3" markerEnd="url(#dl-wait)" />
              <text x="498" y="126" textAnchor="end" className="fill-rose-600 dark:fill-rose-400 text-[9.5px] font-mono font-bold">
                T2 WAITS
              </text>
              <rect x="242" y="106" width="156" height="32" rx="6" className="fill-rose-600" />
              <text x="320" y="126" textAnchor="middle" className="fill-white text-[10px] font-mono font-bold">
                CIRCULAR WAIT CYCLE
              </text>
            </>
          )}
        </>
      ) : (
        <>
          <line x1="216" y1="59" x2="420" y2="59" stroke="#059669" strokeWidth="2.2" markerEnd="url(#dl-hold)" />
          <line x1="424" y1="78" x2="220" y2="174" stroke="#059669" strokeWidth="2.2" markerEnd="url(#dl-hold)" />
          <rect x="228" y="106" width="184" height="34" rx="6" className="fill-emerald-600" />
          <text x="320" y="127" textAnchor="middle" className="fill-white text-[10px] font-mono font-bold">
            DAG ORDER: 0x5000 → 0x5040
          </text>
        </>
      )}
    </svg>
  );
}

function renderScenarioTopology(scenario: SystemsArchitectureScenario, stepIdx: number) {
  switch (scenario.id) {
    case 'consistent-hashing-lb':
      return renderConsistentHashingSvg(stepIdx);
    case 'redis-cache-pipeline':
      return renderRedisPipelineSvg(stepIdx);
    case 'rate-limiter-token-bucket':
      return renderTokenBucketSvg(stepIdx);
    case 'os-mesi-false-sharing':
      return renderMesiFalseSharingSvg(stepIdx);
    case 'os-deadlock-mutex':
      return renderDeadlockSvg(stepIdx);
    default:
      return renderConsistentHashingSvg(stepIdx);
  }
}

export const SystemsConcurrencyLab: React.FC<SystemsConcurrencyLabProps> = ({
  selectedScenarioId,
  onSelectScenario,
  stepIdx,
  onStepChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const activeScenario =
    SYSTEMS_CONCURRENCY_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    SYSTEMS_CONCURRENCY_SCENARIOS[0];
  const boundedStepIdx = Math.min(stepIdx, Math.max(0, activeScenario.steps.length - 1));
  const currentStep = activeScenario.steps[boundedStepIdx];

  useEffect(() => {
    setIsPlaying(false);
  }, [selectedScenarioId]);

  useEffect(() => {
    if (!isPlaying) return;
    if (boundedStepIdx >= activeScenario.steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      onStepChange(Math.min(activeScenario.steps.length - 1, boundedStepIdx + 1));
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [isPlaying, boundedStepIdx, activeScenario.steps.length, onStepChange]);

  return (
    <section
      className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] p-5 sm:p-6 space-y-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      data-testid="systems-concurrency-visualizer"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            DISTRIBUTED ARCHITECTURE &amp; OS / HARDWARE CONCURRENCY SIMULATOR
          </div>
          <h2 className="text-xl font-bold text-neutral-950 dark:text-neutral-100 mt-1">
            System Design Packet Tracer &amp; CPU Cache / Mutex Concurrency Lab
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Step through live topology diagrams for Consistent Hashing failover, Redis Stampede locks, Atomic Token Buckets, CPU 64B MESI False Sharing, and AB-BA Deadlock graphs.
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Systems concurrency scenarios">
          {SYSTEMS_CONCURRENCY_SCENARIOS.map((scen) => (
            <button
              key={scen.id}
              type="button"
              onClick={() => {
                onSelectScenario(scen.id);
                onStepChange(0);
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-md border transition-colors ${
                activeScenario.id === scen.id
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                  : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {scen.category === 'Distributed System Design' ? (
                <Server className="w-3 h-3 inline mr-1" />
              ) : (
                <Cpu className="w-3 h-3 inline mr-1" />
              )}
              {scen.title.split('&')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Step Header + Playback Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <div className="min-w-0">
            <div className="text-xs font-mono text-neutral-500">
              {activeScenario.category} · Target Firms: {activeScenario.companies.join(', ')}
            </div>
            <div className="text-sm font-semibold text-neutral-950 dark:text-white mt-0.5">
              Step {boundedStepIdx + 1}/{activeScenario.steps.length}: {currentStep.title}
            </div>
            <p className="text-xs font-mono text-blue-700 dark:text-blue-400 mt-1">
              Packet / Bus Trace: {currentStep.packetLabel}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onStepChange(0);
              }}
              disabled={boundedStepIdx === 0}
              aria-label="Reset systems simulation"
              className="p-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onStepChange(Math.max(0, boundedStepIdx - 1));
              }}
              disabled={boundedStepIdx === 0}
              aria-label="Previous systems step"
              className="px-2.5 py-1.5 text-xs font-mono rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <button
              type="button"
              onClick={() => {
                if (boundedStepIdx >= activeScenario.steps.length - 1) onStepChange(0);
                setIsPlaying((p) => !p);
              }}
              aria-label={isPlaying ? 'Pause systems autoplay' : 'Play systems simulation'}
              className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 flex items-center gap-1"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onStepChange(Math.min(activeScenario.steps.length - 1, boundedStepIdx + 1));
              }}
              disabled={boundedStepIdx >= activeScenario.steps.length - 1}
              aria-label="Next systems step"
              className="px-2.5 py-1.5 text-xs font-mono rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dedicated SVG Topology Visualizer Canvas */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#0D1017] p-3 overflow-x-auto">
          {renderScenarioTopology(activeScenario, boundedStepIdx)}
        </div>

        {/* Live State & Telemetry Table */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {currentStep.stateTable.map((row) => (
            <div
              key={row.key}
              className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] text-xs font-mono"
            >
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span>{row.key}</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {row.status}
                </span>
              </div>
              <div className="font-semibold text-neutral-950 dark:text-white mt-1">
                {row.value}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-xs font-mono text-neutral-700 dark:text-neutral-300">
          <strong>Hardware / Protocol Invariant:</strong> {currentStep.invariantNote}
        </div>
      </div>
    </section>
  );
};
