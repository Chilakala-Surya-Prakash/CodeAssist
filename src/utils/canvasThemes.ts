import { CanvasThemeTemplate } from '../types/visualizer';

export interface ThemeConfig {
  id: CanvasThemeTemplate;
  name: string;
  label: string;
  icon: string;
  tagline: string;
  isDarkSurface: boolean;
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
  svgEdgeIdleColor: string;
  svgEdgeActiveColor: string;
  svgGlowFilter: string;
  svgStrokeDash: string;
  waterGradient: string;
  stackChamberClass: string;
  stackItemIdleClass: string;
  stackItemTopClass: string;
  subPanelClass: string;
  insetSurfaceClass: string;
  dividerClass: string;
  barIdleClass: string;
  statusIdleBadgeClass: string;
  themeToggleTrackClass: string;
  themeToggleActiveClass: string;
  themeToggleIdleClass: string;
  tableHeaderClass: string;
  tableRowClass: string;
  tableRowActiveClass: string;
  badgeMutedClass: string;
}

export const CANVAS_THEMES: Record<CanvasThemeTemplate, ThemeConfig> = {
  glass: {
    id: 'glass',
    name: 'Studio',
    label: 'Studio',
    icon: '◇',
    tagline: 'Crisp adaptive studio canvas tuned for both Light and Dark modes',
    isDarkSurface: false,
    containerClass:
      'border border-neutral-200/90 dark:border-neutral-800/80 bg-white dark:bg-[#0D1117] shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-neutral-900 dark:text-neutral-100',
    gridClass:
      'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:18px_18px]',
    headerClass:
      'bg-neutral-50/90 dark:bg-neutral-900/80 border-b border-neutral-200/80 dark:border-neutral-800/80 text-neutral-900 dark:text-neutral-100',
    cardBaseClass:
      'rounded-xl border transition-all duration-200 font-mono shadow-xs',
    cardIdleClass:
      'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111620] text-neutral-900 dark:text-neutral-100 hover:border-neutral-400 dark:hover:border-neutral-600',
    cardActiveClass:
      'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/60 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/40 shadow-sm',
    cardMutatedClass:
      'border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/40 shadow-sm scale-[1.02]',
    cardTargetClass:
      'border-violet-600 dark:border-violet-400 bg-violet-50 dark:bg-violet-950/60 text-violet-950 dark:text-violet-100 ring-2 ring-violet-500/40 shadow-sm',
    cardDiscardedClass:
      'border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/40 text-neutral-500 dark:text-neutral-400 opacity-65',
    svgArrowColor: '#2563eb',
    svgReversedColor: '#059669',
    svgEdgeIdleColor: '#94a3b8',
    svgEdgeActiveColor: '#2563eb',
    svgGlowFilter: 'none',
    svgStrokeDash: 'none',
    waterGradient: 'bg-gradient-to-t from-blue-600 via-sky-500 to-cyan-300',
    stackChamberClass:
      'border-2 border-dashed border-amber-500/70 dark:border-amber-600/70 bg-neutral-50/90 dark:bg-[#111620]/90 shadow-xs',
    stackItemIdleClass:
      'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200',
    stackItemTopClass:
      'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-bold ring-1 ring-amber-500/70',
    subPanelClass:
      'border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111111] text-neutral-900 dark:text-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
    insetSurfaceClass:
      'border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70 text-neutral-800 dark:text-neutral-200',
    dividerClass: 'border-neutral-200/80 dark:border-neutral-800/80',
    barIdleClass: 'bg-slate-400/75 dark:bg-slate-600',
    statusIdleBadgeClass:
      'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
    themeToggleTrackClass:
      'border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/90',
    themeToggleActiveClass:
      'bg-white dark:bg-neutral-950 text-neutral-950 dark:text-white font-semibold shadow-2xs ring-1 ring-neutral-300 dark:ring-neutral-700',
    themeToggleIdleClass:
      'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60',
    tableHeaderClass: 'border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400',
    tableRowClass: 'border-b border-neutral-100 dark:border-neutral-800/60 text-neutral-700 dark:text-neutral-300',
    tableRowActiveClass: 'bg-blue-50/70 dark:bg-blue-950/30 text-neutral-950 dark:text-neutral-100',
    badgeMutedClass: 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300',
  },
  paper: {
    id: 'paper',
    name: 'Paper',
    label: 'Paper',
    icon: '▤',
    tagline: 'Warm sketchbook ivory with high-contrast editorial ink lines',
    isDarkSurface: false,
    containerClass:
      'border border-stone-300 dark:border-stone-800 bg-[#FAF7EE] dark:bg-[#151412] text-stone-900 dark:text-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
    gridClass:
      'bg-[radial-gradient(#d6d3cb_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#292723_1.2px,transparent_1.2px)] [background-size:16px_16px]',
    headerClass:
      'bg-[#F4EFE6] dark:bg-[#1B1917] border-b border-stone-300 dark:border-stone-800 text-stone-900 dark:text-stone-100',
    cardBaseClass:
      'rounded-xl border transition-all duration-200 font-mono shadow-xs',
    cardIdleClass:
      'border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1f1d19] text-stone-900 dark:text-stone-100 hover:border-stone-500',
    cardActiveClass:
      'border-stone-900 dark:border-stone-100 bg-[#ECE5D8] dark:bg-[#2A2722] text-stone-950 dark:text-white ring-2 ring-stone-900/70 dark:ring-stone-100/70',
    cardMutatedClass:
      'border-emerald-700 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-600/60 scale-[1.02]',
    cardTargetClass:
      'border-amber-700 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-600/60',
    cardDiscardedClass:
      'border-stone-300/70 dark:border-stone-800 bg-stone-200/50 dark:bg-stone-900/40 text-stone-500 dark:text-stone-400 opacity-65',
    svgArrowColor: '#44403c',
    svgReversedColor: '#047857',
    svgEdgeIdleColor: '#a8a29e',
    svgEdgeActiveColor: '#1c1917',
    svgGlowFilter: 'none',
    svgStrokeDash: 'none',
    waterGradient: 'bg-gradient-to-t from-sky-700 via-sky-500 to-sky-300',
    stackChamberClass:
      'border-2 border-dashed border-stone-400 dark:border-stone-700 bg-white/95 dark:bg-[#1c1a17]/95 shadow-xs',
    stackItemIdleClass:
      'border-stone-300 dark:border-stone-700 bg-[#FAF7EE] dark:bg-[#26231f] text-stone-900 dark:text-stone-100',
    stackItemTopClass:
      'border-amber-700 bg-amber-100/90 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 font-bold ring-1 ring-amber-600',
    subPanelClass:
      'border border-stone-300 dark:border-stone-800 bg-white dark:bg-[#191816] text-stone-900 dark:text-stone-100 shadow-xs',
    insetSurfaceClass:
      'border border-stone-200 dark:border-stone-800 bg-[#F7F3EA] dark:bg-[#22201c] text-stone-800 dark:text-stone-200',
    dividerClass: 'border-stone-300/80 dark:border-stone-800',
    barIdleClass: 'bg-stone-400 dark:bg-stone-600',
    statusIdleBadgeClass:
      'bg-stone-200/80 dark:bg-stone-800 text-stone-800 dark:text-stone-200',
    themeToggleTrackClass:
      'border border-stone-300 dark:border-stone-700 bg-[#EAE3D5] dark:bg-stone-800',
    themeToggleActiveClass:
      'bg-white dark:bg-stone-950 text-stone-950 dark:text-stone-100 font-semibold shadow-2xs ring-1 ring-stone-400/70 dark:ring-stone-600',
    themeToggleIdleClass:
      'text-stone-700 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-stone-700/60',
    tableHeaderClass: 'border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400',
    tableRowClass: 'border-b border-stone-100 dark:border-stone-800/60 text-stone-800 dark:text-stone-300',
    tableRowActiveClass: 'bg-[#F4EFE6] dark:bg-stone-900/60 text-stone-950 dark:text-stone-100',
    badgeMutedClass: 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-200',
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    label: 'Blueprint',
    icon: '⊞',
    tagline: 'CAD technical blueprint with crisp signal bus lines & dark slate grid',
    isDarkSurface: true,
    containerClass:
      'border border-sky-500/40 bg-[#081528] text-sky-100 shadow-[0_4px_24px_rgba(14,165,233,0.12)]',
    gridClass:
      'bg-[linear-gradient(to_right,#0c2340_1px,transparent_1px),linear-gradient(to_bottom,#0c2340_1px,transparent_1px)] [background-size:24px_24px]',
    headerClass:
      'bg-[#091b33]/95 border-b border-sky-400/30 backdrop-blur-md text-sky-100',
    cardBaseClass:
      'rounded-xl border transition-all duration-200 font-mono',
    cardIdleClass:
      'border-sky-700/60 bg-[#0a1e38] text-sky-100 hover:border-sky-400 shadow-sm',
    cardActiveClass:
      'border-sky-300 bg-sky-900/90 text-white ring-2 ring-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.4)]',
    cardMutatedClass:
      'border-amber-400 bg-amber-950/70 text-amber-100 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] scale-[1.02]',
    cardTargetClass:
      'border-teal-400 bg-teal-950/70 text-teal-100 ring-2 ring-teal-400 shadow-[0_0_16px_rgba(45,212,191,0.35)]',
    cardDiscardedClass:
      'border-sky-900/50 bg-sky-950/30 text-sky-400 opacity-55',
    svgArrowColor: '#38bdf8',
    svgReversedColor: '#fbbf24',
    svgEdgeIdleColor: '#38bdf8',
    svgEdgeActiveColor: '#fbbf24',
    svgGlowFilter: 'drop-shadow(0 0 4px rgba(56,189,248,0.65))',
    svgStrokeDash: 'none',
    waterGradient: 'bg-gradient-to-t from-sky-700 via-sky-500 to-sky-300',
    stackChamberClass:
      'border-2 border-dashed border-sky-400/60 bg-[#091b34]/90 shadow-sm',
    stackItemIdleClass:
      'border-sky-700/60 bg-sky-950/60 text-sky-100',
    stackItemTopClass:
      'border-amber-400 bg-amber-500/20 text-amber-200 font-bold ring-1 ring-amber-400',
    subPanelClass:
      'border border-sky-700/40 bg-[#091a32] text-sky-100 shadow-sm',
    insetSurfaceClass:
      'border border-sky-800/70 bg-[#071427] text-sky-100',
    dividerClass: 'border-sky-800/70',
    barIdleClass: 'bg-sky-400/35',
    statusIdleBadgeClass: 'bg-sky-900/80 text-sky-200',
    themeToggleTrackClass: 'border border-sky-500/30 bg-[#06101f]',
    themeToggleActiveClass:
      'bg-sky-500/25 text-white font-semibold shadow-2xs ring-1 ring-sky-400/60',
    themeToggleIdleClass: 'text-sky-300/80 hover:text-white hover:bg-sky-500/15',
    tableHeaderClass: 'border-b border-sky-800/60 text-sky-300',
    tableRowClass: 'border-b border-sky-900/50 text-sky-100',
    tableRowActiveClass: 'bg-sky-900/50 text-white',
    badgeMutedClass: 'border-sky-700/60 bg-sky-950/60 text-sky-200',
  },
  neon: {
    id: 'neon',
    name: 'Circuit',
    label: 'Circuit',
    icon: '⚡',
    tagline: 'High-contrast dark circuit board with illuminated memory conduits',
    isDarkSurface: true,
    containerClass:
      'border border-cyan-500/30 bg-[#060913] text-cyan-100 shadow-[0_0_28px_rgba(6,182,212,0.12)]',
    gridClass:
      'bg-[radial-gradient(#0e3a53_1.5px,transparent_1.5px)] [background-size:20px_20px]',
    headerClass:
      'bg-[#081020]/90 border-b border-cyan-500/20 backdrop-blur-md text-cyan-100',
    cardBaseClass:
      'rounded-xl border transition-all duration-200 font-mono backdrop-blur-xs',
    cardIdleClass:
      'border-cyan-900/70 bg-[#091224]/90 text-cyan-100 hover:border-cyan-400/60',
    cardActiveClass:
      'border-cyan-400 bg-cyan-950/80 text-cyan-50 ring-2 ring-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.45)]',
    cardMutatedClass:
      'border-emerald-400 bg-emerald-950/80 text-emerald-50 ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.5)] scale-[1.02]',
    cardTargetClass:
      'border-fuchsia-400 bg-fuchsia-950/80 text-fuchsia-50 ring-2 ring-fuchsia-400/80 shadow-[0_0_20px_rgba(232,121,249,0.45)]',
    cardDiscardedClass:
      'border-cyan-950/60 bg-cyan-950/30 text-cyan-400 opacity-55',
    svgArrowColor: '#22d3ee',
    svgReversedColor: '#34d399',
    svgEdgeIdleColor: '#0e7490',
    svgEdgeActiveColor: '#22d3ee',
    svgGlowFilter: 'drop-shadow(0 0 4px rgba(34,211,238,0.75))',
    svgStrokeDash: '4 3',
    waterGradient: 'bg-gradient-to-t from-cyan-600 via-teal-400 to-emerald-300',
    stackChamberClass:
      'border-2 border-dashed border-cyan-400/60 bg-[#071120]/90',
    stackItemIdleClass:
      'border-cyan-800/70 bg-cyan-950/50 text-cyan-100',
    stackItemTopClass:
      'border-amber-400 bg-amber-500/20 text-amber-200 font-bold ring-1 ring-amber-400',
    subPanelClass:
      'border border-cyan-500/20 bg-[#070e1c] text-cyan-100',
    insetSurfaceClass:
      'border border-cyan-900/60 bg-[#050b16] text-cyan-100',
    dividerClass: 'border-cyan-900/60',
    barIdleClass: 'bg-cyan-200/25',
    statusIdleBadgeClass: 'bg-cyan-950/80 text-cyan-200',
    themeToggleTrackClass: 'border border-cyan-500/25 bg-[#040710]',
    themeToggleActiveClass:
      'bg-cyan-500/25 text-white font-semibold shadow-2xs ring-1 ring-cyan-400/60',
    themeToggleIdleClass: 'text-cyan-300/80 hover:text-white hover:bg-cyan-500/15',
    tableHeaderClass: 'border-b border-cyan-900/60 text-cyan-300',
    tableRowClass: 'border-b border-cyan-950/50 text-cyan-100',
    tableRowActiveClass: 'bg-cyan-950/50 text-white',
    badgeMutedClass: 'border-cyan-800/70 bg-cyan-950/60 text-cyan-200',
  },
};
