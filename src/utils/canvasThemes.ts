import { CanvasThemeTemplate } from '../types/visualizer';

export interface ThemeConfig {
  id: CanvasThemeTemplate;
  name: string;
  label: string;
  icon: string;
  tagline: string;
  containerClass: string;
  gridClass: string;
  headerClass: string;
  cardBaseClass: string;
  cardIdleClass: string;
  cardActiveClass: string;
  cardMutatedClass: string;
  cardTargetClass: string;
  cardDiscardedClass: string;
  svgArrowColor: string;
  svgReversedColor: string;
  svgGlowFilter: string;
  svgStrokeDash: string;
  waterGradient: string;
  stackChamberClass: string;
  subPanelClass: string;
  tableHeaderClass: string;
  tableRowClass: string;
  tableRowActiveClass: string;
  badgeMutedClass: string;
}

export const CANVAS_THEMES: Record<CanvasThemeTemplate, ThemeConfig> = {
  neon: {
    id: 'neon',
    name: 'Neon Circuit',
    label: '⚡ Neon',
    icon: '⚡',
    tagline: 'Cyberpunk laser tracers, glowing neon conduits & illuminated memory nodes',
    containerClass:
      'border border-cyan-500/30 bg-[#060913] text-cyan-100 shadow-[0_0_35px_rgba(6,182,212,0.14)]',
    gridClass:
      'bg-[radial-gradient(#0e3a53_1.5px,transparent_1.5px)] [background-size:20px_20px]',
    headerClass:
      'bg-[#081020]/90 border-b border-cyan-500/20 backdrop-blur-md text-cyan-200',
    cardBaseClass:
      'rounded-xl border transition-all duration-200 font-mono backdrop-blur-xs',
    cardIdleClass:
      'border-cyan-900/60 bg-[#091224]/85 text-cyan-100 hover:border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.06)]',
    cardActiveClass:
      'border-cyan-400 bg-cyan-950/80 text-cyan-50 ring-2 ring-cyan-400/80 shadow-[0_0_24px_rgba(34,211,238,0.55)]',
    cardMutatedClass:
      'border-emerald-400 bg-emerald-950/80 text-emerald-50 ring-2 ring-emerald-400/80 shadow-[0_0_24px_rgba(52,211,153,0.6)] scale-[1.02]',
    cardTargetClass:
      'border-fuchsia-400 bg-fuchsia-950/80 text-fuchsia-50 ring-2 ring-fuchsia-400/80 shadow-[0_0_24px_rgba(232,121,249,0.55)]',
    cardDiscardedClass:
      'border-cyan-950/40 bg-cyan-950/20 text-cyan-800 opacity-40',
    svgArrowColor: '#22d3ee',
    svgReversedColor: '#34d399',
    svgGlowFilter: 'drop-shadow(0 0 5px rgba(34,211,238,0.85))',
    svgStrokeDash: '4 3',
    waterGradient: 'bg-gradient-to-t from-cyan-600 via-teal-400 to-emerald-300',
    stackChamberClass:
      'border-2 border-dashed border-cyan-400/60 bg-[#071120]/90 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    subPanelClass:
      'border border-cyan-500/20 bg-[#070e1c] text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.06)]',
    tableHeaderClass: 'border-b border-cyan-900/60 text-cyan-400',
    tableRowClass: 'border-b border-cyan-950/50 text-cyan-200',
    tableRowActiveClass: 'bg-cyan-950/50 text-cyan-50',
    badgeMutedClass: 'border-cyan-800/60 bg-cyan-950/50 text-cyan-300',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Silicon CAD',
    label: '📐 Blueprint',
    icon: '📐',
    tagline: 'Deep CAD architecture with copper bus routing & microchip alignment',
    containerClass:
      'border border-sky-500/40 bg-[#081528] text-sky-100 shadow-[0_4px_24px_rgba(14,165,233,0.15)]',
    gridClass:
      'bg-[linear-gradient(to_right,#0c2340_1px,transparent_1px),linear-gradient(to_bottom,#0c2340_1px,transparent_1px)] [background-size:24px_24px]',
    headerClass:
      'bg-[#091b33]/95 border-b border-sky-400/30 backdrop-blur-md text-sky-200',
    cardBaseClass:
      'rounded-xl border transition-all duration-200 font-mono',
    cardIdleClass:
      'border-sky-700/60 bg-[#0a1e38] text-sky-100 hover:border-sky-400 shadow-sm',
    cardActiveClass:
      'border-sky-300 bg-sky-900/90 text-white ring-2 ring-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.45)]',
    cardMutatedClass:
      'border-amber-400 bg-amber-950/70 text-amber-100 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.45)] scale-[1.02]',
    cardTargetClass:
      'border-teal-400 bg-teal-950/70 text-teal-100 ring-2 ring-teal-400 shadow-[0_0_16px_rgba(45,212,191,0.35)]',
    cardDiscardedClass:
      'border-sky-900/40 bg-sky-950/20 text-sky-700 opacity-40',
    svgArrowColor: '#38bdf8',
    svgReversedColor: '#fbbf24',
    svgGlowFilter: 'drop-shadow(0 0 4px rgba(56,189,248,0.7))',
    svgStrokeDash: 'none',
    waterGradient: 'bg-gradient-to-t from-sky-700 via-sky-500 to-sky-300',
    stackChamberClass:
      'border-2 border-dashed border-sky-400/60 bg-[#091b34]/90 shadow-sm',
    subPanelClass:
      'border border-sky-700/40 bg-[#091a32] text-sky-100 shadow-sm',
    tableHeaderClass: 'border-b border-sky-800/60 text-sky-400',
    tableRowClass: 'border-b border-sky-900/50 text-sky-200',
    tableRowActiveClass: 'bg-sky-900/50 text-sky-50',
    badgeMutedClass: 'border-sky-700/60 bg-sky-950/50 text-sky-300',
  },
  glass: {
    id: 'glass',
    name: 'Modern Glass',
    label: '💎 Glass',
    icon: '💎',
    tagline: 'Refined frosted glassmorphism, crisp shadows & dual light/dark elegance',
    containerClass:
      'border border-neutral-200/90 dark:border-neutral-800/80 bg-white/80 dark:bg-[#0D1117]/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.05)] text-neutral-900 dark:text-neutral-100',
    gridClass:
      'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]',
    headerClass:
      'bg-white/80 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800/80 backdrop-blur-md text-neutral-900 dark:text-neutral-100',
    cardBaseClass:
      'rounded-xl border transition-all duration-200 font-mono shadow-xs',
    cardIdleClass:
      'border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 hover:border-neutral-400',
    cardActiveClass:
      'border-blue-500 dark:border-blue-400 bg-blue-50/90 dark:bg-blue-950/60 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/50 shadow-md',
    cardMutatedClass:
      'border-emerald-500 dark:border-emerald-400 bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/50 shadow-md scale-[1.02]',
    cardTargetClass:
      'border-violet-500 dark:border-violet-400 bg-violet-50/90 dark:bg-violet-950/60 text-violet-950 dark:text-violet-100 ring-2 ring-violet-500/50 shadow-sm',
    cardDiscardedClass:
      'border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-100/40 dark:bg-neutral-900/20 text-neutral-400 opacity-40',
    svgArrowColor: '#2563eb',
    svgReversedColor: '#059669',
    svgGlowFilter: 'none',
    svgStrokeDash: 'none',
    waterGradient: 'bg-gradient-to-t from-blue-600 via-sky-400 to-cyan-300',
    stackChamberClass:
      'border-2 border-dashed border-amber-400/80 dark:border-amber-600/80 bg-white/90 dark:bg-[#111111]/90 shadow-xs',
    subPanelClass:
      'border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
    tableHeaderClass: 'border-b border-neutral-100 dark:border-neutral-800/80 text-neutral-400',
    tableRowClass: 'border-b border-neutral-100 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300',
    tableRowActiveClass: 'bg-neutral-50 dark:bg-neutral-900/60 text-neutral-950 dark:text-neutral-100',
    badgeMutedClass: 'border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300',
  },
  paper: {
    id: 'paper',
    name: 'Paper Studio',
    label: '📜 Paper',
    icon: '📜',
    tagline: 'Warm tactile sketchbook ivory, crisp editorial ink lines & tactile nodes',
    containerClass:
      'border border-stone-300 dark:border-stone-800 bg-[#FAF7EE] dark:bg-[#151412] text-stone-900 dark:text-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
    gridClass:
      'bg-[radial-gradient(#d6d3cb_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#292723_1.2px,transparent_1.2px)] [background-size:16px_16px]',
    headerClass:
      'bg-[#F4EFE6] dark:bg-[#1B1917] border-b border-stone-300 dark:border-stone-800 text-stone-900 dark:text-stone-100',
    cardBaseClass:
      'rounded-xl border transition-all duration-200 font-mono shadow-xs',
    cardIdleClass:
      'border-stone-400/80 dark:border-stone-700 bg-white dark:bg-[#1f1d19] text-stone-900 dark:text-stone-100 hover:border-stone-600',
    cardActiveClass:
      'border-stone-900 dark:border-stone-100 bg-[#ECE5D8] dark:bg-[#2A2722] text-stone-950 dark:text-white ring-2 ring-stone-900 dark:ring-stone-100',
    cardMutatedClass:
      'border-emerald-700 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-600 scale-[1.02]',
    cardTargetClass:
      'border-amber-700 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-600',
    cardDiscardedClass:
      'border-stone-300/50 dark:border-stone-800/50 bg-stone-200/30 dark:bg-stone-900/30 text-stone-400 opacity-40',
    svgArrowColor: '#57534e',
    svgReversedColor: '#047857',
    svgGlowFilter: 'none',
    svgStrokeDash: 'none',
    waterGradient: 'bg-gradient-to-t from-stone-700 via-stone-500 to-stone-400',
    stackChamberClass:
      'border-2 border-dashed border-stone-400 dark:border-stone-700 bg-white/90 dark:bg-[#1c1a17]/90 shadow-xs',
    subPanelClass:
      'border border-stone-300 dark:border-stone-800 bg-white dark:bg-[#191816] text-stone-900 dark:text-stone-100 shadow-xs',
    tableHeaderClass: 'border-b border-stone-200 dark:border-stone-800 text-stone-400',
    tableRowClass: 'border-b border-stone-100 dark:border-stone-800/60 text-stone-700 dark:text-stone-300',
    tableRowActiveClass: 'bg-stone-100 dark:bg-stone-900/60 text-stone-950 dark:text-stone-100',
    badgeMutedClass: 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300',
  },
};
