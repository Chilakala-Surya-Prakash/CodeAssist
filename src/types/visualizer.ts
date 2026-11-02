export type Language = 'python' | 'java';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type AlgorithmPattern =
  | 'Two Pointers'
  | 'Sliding Window'
  | 'Linked List & Pointers'
  | 'Binary Search'
  | 'Monotonic Stack'
  | 'Trees & Graphs'
  | 'Dynamic Programming'
  | 'Heap & Priority Queue'
  | 'Backtracking & Tries';

export interface StackVariable {
  name: string;
  value: string;
  type: string;
  address: string; // e.g., 0x7FFF01A0
  isPointer: boolean;
  pointsToAddress?: string; // Heap address if pointer
  changed?: boolean;
}

export interface StackFrame {
  id: string;
  functionName: string;
  line: number;
  returnAddress: string;
  variables: StackVariable[];
  isActive: boolean;
}

export interface HeapCell {
  index: number | string;
  label?: string;
  value: string | number;
  addressOffset: string; // e.g., +0x00, +0x08
  nextAddress?: string | null; // For linked list / tree nodes
  leftAddress?: string | null;
  rightAddress?: string | null;
  status: 'idle' | 'active' | 'compared' | 'mutated' | 'visited' | 'discarded' | 'target';
  annotation?: string;
}

export interface HeapObject {
  id: string;
  address: string; // e.g., 0x1040A0
  type: 'Array' | 'LinkedList' | 'HashMap' | 'Stack' | 'BinaryTree' | 'DPTable' | 'GraphQueue';
  label: string;
  byteSize: number;
  refCount: number;
  gcStatus: 'allocated' | 'newly_allocated' | 'mutated' | 'garbage_candidate';
  cells: HeapCell[];
}

export interface PointerRef {
  id: string;
  name: string; // e.g., "left", "right", "curr", "prev", "nxt", "mid", "slow", "fast", "top"
  targetObjectId: string;
  targetIndex: number | string | null; // null means NULL pointer
  targetAddress: string; // e.g., 0x1040A8 or 0x0000 (NULL)
  role: 'primary' | 'secondary' | 'fast' | 'anchor' | 'mutator';
  deltaDescription?: string; // e.g., "moved +1 (+8 bytes) -> 0x1040A8"
}

export interface ExecutionStep {
  stepIndex: number;
  title: string;
  pythonLine: number;
  javaLine: number;
  operationType:
    | 'ALLOCATE_HEAP'
    | 'INIT_POINTER'
    | 'MOVE_POINTER'
    | 'COMPARE_VALUES'
    | 'MUTATE_MEMORY'
    | 'REWIRE_NEXT_PTR'
    | 'PUSH_STACK_FRAME'
    | 'POP_STACK_FRAME'
    | 'RETURN_RESULT';
  intuition: string;
  memoryMutation: string;
  invariantCheck: string;
  stackFrames: StackFrame[];
  heapObjects: HeapObject[];
  pointers: PointerRef[];
  stdout?: string;
  metrics: {
    comparisons: number;
    pointerOps: number;
    heapBytesUsed: number;
    timeStepO: string;
  };
}

export interface ProblemSolution {
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  memoryProfileNote: string;
}

export interface AlgorithmProblem {
  id: string;
  number: number;
  title: string;
  slug: string;
  difficulty: Difficulty;
  pattern: AlgorithmPattern;
  summary: string;
  description: string;
  constraints: string[];
  defaultInput: string;
  sampleInputs: { label: string; value: string }[];
  companies: string[]; // Company IDs
  frequencyScore: number; // e.g., 98
  keyInsight: string;
  pointerMechanicsNote: string;
  python: ProblemSolution;
  java: ProblemSolution;
}

export interface CompanyQuestionEntry {
  problemId: string;
  frequency: string; // e.g. "94% (Last 6 mos)"
  roundType: 'Phone Screen' | 'Onsite Coding' | 'Bar Raiser / Core' | 'System & Algo';
  interviewerFocus: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  tier: 'FAANG & Hyperscalers' | 'AI & Frontier Labs' | 'Quant & High-Frequency' | 'FinTech & Commerce' | 'Enterprise & Cloud Systems';
  hq: string;
  interviewBarSummary: string;
  preferredLanguages: string[];
  signaturePatterns: AlgorithmPattern[];
  totalCuratedQuestions: number;
  featuredQuestions: CompanyQuestionEntry[];
}

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  stepContext?: {
    problemTitle: string;
    stepIndex: number;
    language: Language;
  };
}
