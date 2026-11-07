import { CompanyProfile } from '../types/visualizer';

export const COMPANIES: CompanyProfile[] = [
  // FAANG & Hyperscalers (12)
  {
    id: 'google',
    name: 'Google',
    tier: 'FAANG & Hyperscalers',
    hq: 'Mountain View, CA',
    interviewBarSummary: 'Emphasizes optimal asymptotic bounds, graph/tree traversals, sliding window invariants, and explicit edge-case memory handling.',
    preferredLanguages: ['Python', 'Java', 'C++', 'Go'],
    signaturePatterns: ['Sliding Window', 'Trees & Graphs', 'Dynamic Programming', 'Two Pointers'],
    totalCuratedQuestions: 184,
    featuredQuestions: [
      { problemId: 'trapping-rain-water', frequency: '96%', roundType: 'Onsite Coding', interviewerFocus: 'Dual-pointer O(1) auxiliary heap space vs O(N) prefix arrays.' },
      { problemId: 'lru-cache-pointers', frequency: '93%', roundType: 'Onsite Coding', interviewerFocus: 'Doubly-linked list pointer splicing + HashMap node reference synchronization.' },
      { problemId: 'longest-substring-unique', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Sliding window left-pointer jump without redundant character scans.' },
      { problemId: 'course-schedule-cycle', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Kahn topological indegree decay and queue pointer progression.' },
      { problemId: 'coin-change-dp', frequency: '86%', roundType: 'Phone Screen', interviewerFocus: '1D bottom-up state transition vs recursive call-stack overflow.' },
      { problemId: 'binary-tree-level-order', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Deque reference consumption per BFS frontier level.' }
    ]
  },
  {
    id: 'meta',
    name: 'Meta',
    tier: 'FAANG & Hyperscalers',
    hq: 'Menlo Park, CA',
    interviewBarSummary: 'High-speed execution: expects 2 medium/hard problems in 40 minutes with bug-free dry runs and zero extra memory allocations where O(1) exists.',
    preferredLanguages: ['Python', 'Java', 'C++'],
    signaturePatterns: ['Two Pointers', 'Sliding Window', 'Trees & Graphs', 'Monotonic Stack'],
    totalCuratedQuestions: 184,
    featuredQuestions: [
      { problemId: 'three-sum-zero', frequency: '97%', roundType: 'Phone Screen', interviewerFocus: 'Sorting in-place + skipping duplicate pointer values cleanly.' },
      { problemId: 'trapping-rain-water', frequency: '94%', roundType: 'Onsite Coding', interviewerFocus: 'Tracing lMax and rMax register updates step-by-step.' },
      { problemId: 'valid-parentheses-stack', frequency: '92%', roundType: 'Phone Screen', interviewerFocus: 'Stack pointer push/pop invariants on mismatched delimiters.' },
      { problemId: 'binary-tree-level-order', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'BFS queue snapshot sizing and tree node pointer dereferencing.' },
      { problemId: 'lru-cache-pointers', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'Pointer rewiring in moveToHead() and evictTail() under capacity.' },
      { problemId: 'search-rotated-sorted', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'Strict monotonic half identification using mid pointer.' }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon',
    tier: 'FAANG & Hyperscalers',
    hq: 'Seattle, WA',
    interviewBarSummary: 'Pairs Leadership Principles with production-grade data structure manipulation: LRU caches, monotonic stacks, heaps, and BFS graphs.',
    preferredLanguages: ['Java', 'Python', 'C++'],
    signaturePatterns: ['Linked List & Pointers', 'Heap & Priority Queue', 'Monotonic Stack', 'Trees & Graphs'],
    totalCuratedQuestions: 184,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '98%', roundType: 'Bar Raiser / Core', interviewerFocus: 'Thread-safe awareness, dummy head/tail sentinel nodes in Java/Python.' },
      { problemId: 'two-sum-hash', frequency: '95%', roundType: 'Phone Screen', interviewerFocus: 'Single-pass hash table lookup and collision amortized cost.' },
      { problemId: 'trapping-rain-water', frequency: '92%', roundType: 'Onsite Coding', interviewerFocus: 'Two-pointer convergence vs monotonic stack water layer accumulation.' },
      { problemId: 'reverse-linked-list', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'In-place prev/curr/nxt pointer rotation without losing heap reference.' },
      { problemId: 'daily-temperatures-stack', frequency: '87%', roundType: 'Onsite Coding', interviewerFocus: 'Monotonic decreasing stack storing indices rather than values.' },
      { problemId: 'kth-largest-heap', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'Min-heap of size K vs full array sort memory footprint.' }
    ]
  },
  {
    id: 'apple',
    name: 'Apple',
    tier: 'FAANG & Hyperscalers',
    hq: 'Cupertino, CA',
    interviewBarSummary: 'Deep systems-level thinking: memory layout, cache locality, pointer mutation safety, and clean object lifecycle in Java and Python.',
    preferredLanguages: ['Java', 'Python', 'Swift', 'C++'],
    signaturePatterns: ['Linked List & Pointers', 'Two Pointers', 'Binary Search', 'Dynamic Programming'],
    totalCuratedQuestions: 137,
    featuredQuestions: [
      { problemId: 'reverse-linked-list', frequency: '94%', roundType: 'Phone Screen', interviewerFocus: 'Exact order of pointer assignment: nxt = curr.next before rewiring.' },
      { problemId: 'cycle-detection-floyd', frequency: '91%', roundType: 'Onsite Coding', interviewerFocus: 'Floyd tortoise & hare pointer phase-2 entry node proof.' },
      { problemId: 'lru-cache-pointers', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Preventing dangling node references during eviction.' },
      { problemId: 'container-most-water', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Greedy contraction proof of the shorter boundary pointer.' },
      { problemId: 'search-rotated-sorted', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'Zero-allocation iterative binary search vs recursion stack.' }
    ]
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    tier: 'FAANG & Hyperscalers',
    hq: 'Redmond, WA',
    interviewBarSummary: 'Strong focus on linked lists, trees, matrix/graph traversals, and clear modular code with explicit null-pointer guards.',
    preferredLanguages: ['Java', 'Python', 'C#', 'C++'],
    signaturePatterns: ['Linked List & Pointers', 'Trees & Graphs', 'Binary Search', 'Dynamic Programming'],
    totalCuratedQuestions: 139,
    featuredQuestions: [
      { problemId: 'reverse-linked-list', frequency: '95%', roundType: 'Phone Screen', interviewerFocus: 'Null head and single-node edge cases during pointer flip.' },
      { problemId: 'lru-cache-pointers', frequency: '92%', roundType: 'Onsite Coding', interviewerFocus: 'O(1) get and put via doubly linked nodes.' },
      { problemId: 'binary-tree-level-order', frequency: '89%', roundType: 'Phone Screen', interviewerFocus: 'Queue frontier segmentation and child pointer validation.' },
      { problemId: 'three-sum-zero', frequency: '87%', roundType: 'Onsite Coding', interviewerFocus: 'Two-pointer sweep after O(N log N) sort.' },
      { problemId: 'course-schedule-cycle', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'Directed graph cycle detection for dependency resolution.' }
    ]
  },
  {
    id: 'netflix',
    name: 'Netflix',
    tier: 'FAANG & Hyperscalers',
    hq: 'Los Gatos, CA',
    interviewBarSummary: 'Senior-heavy bar focusing on caching policies, streaming window algorithms, top-K priority queues, and latency-predictable memory structures.',
    preferredLanguages: ['Java', 'Python', 'Go'],
    signaturePatterns: ['Linked List & Pointers', 'Sliding Window', 'Heap & Priority Queue', 'Two Pointers'],
    totalCuratedQuestions: 107,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '97%', roundType: 'System & Algo', interviewerFocus: 'Eviction determinism and O(1) doubly-linked pointer splice.' },
      { problemId: 'kth-largest-heap', frequency: '92%', roundType: 'Onsite Coding', interviewerFocus: 'Bounded min-heap memory stability on high-volume streams.' },
      { problemId: 'longest-substring-unique', frequency: '89%', roundType: 'Phone Screen', interviewerFocus: 'Sliding window telemetry buffer deduplication.' },
      { problemId: 'trapping-rain-water', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'In-place two-pointer boundary tracking.' }
    ]
  },
  {
    id: 'nvidia',
    name: 'Nvidia',
    tier: 'FAANG & Hyperscalers',
    hq: 'Santa Clara, CA',
    interviewBarSummary: 'Focuses on contiguous array memory layouts, pointer arithmetic analogies, bit/index manipulation, and dependency DAG scheduling.',
    preferredLanguages: ['Python', 'C++', 'Java'],
    signaturePatterns: ['Two Pointers', 'Binary Search', 'Trees & Graphs', 'Dynamic Programming'],
    totalCuratedQuestions: 74,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '95%', roundType: 'Onsite Coding', interviewerFocus: 'CUDA kernel / compute graph dependency topological ordering.' },
      { problemId: 'trapping-rain-water', frequency: '91%', roundType: 'Onsite Coding', interviewerFocus: 'Memory-bandwidth optimal single pass with two pointers.' },
      { problemId: 'search-rotated-sorted', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Branch-minimized binary search index updates.' },
      { problemId: 'reverse-linked-list', frequency: '86%', roundType: 'Phone Screen', interviewerFocus: 'In-place pointer mutation without heap churn.' }
    ]
  },
  {
    id: 'bytedance',
    name: 'ByteDance',
    tier: 'FAANG & Hyperscalers',
    hq: 'Singapore / San Jose, CA',
    interviewBarSummary: 'Known for rigorous algorithmic depth: monotonic stacks, dynamic programming, hard sliding windows, and tree/linked-list hybrids.',
    preferredLanguages: ['Python', 'Java', 'Go', 'C++'],
    signaturePatterns: ['Monotonic Stack', 'Dynamic Programming', 'Sliding Window', 'Linked List & Pointers'],
    totalCuratedQuestions: 122,
    featuredQuestions: [
      { problemId: 'trapping-rain-water', frequency: '96%', roundType: 'Onsite Coding', interviewerFocus: 'Both two-pointer and monotonic stack derivations required.' },
      { problemId: 'daily-temperatures-stack', frequency: '92%', roundType: 'Phone Screen', interviewerFocus: 'Monotonic stack O(N) amortized push/pop count proof.' },
      { problemId: 'lru-cache-pointers', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Hand-rolled doubly linked list node class without library OrderedDict.' },
      { problemId: 'coin-change-dp', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'DP state array memory compression.' }
    ]
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    tier: 'FAANG & Hyperscalers',
    hq: 'Los Angeles, CA',
    interviewBarSummary: 'High bar on feed-ranking primitives: top-K heaps, sliding windows, graph BFS, and pointer-heavy cache structures.',
    preferredLanguages: ['Python', 'Java', 'Go'],
    signaturePatterns: ['Heap & Priority Queue', 'Sliding Window', 'Monotonic Stack', 'Trees & Graphs'],
    totalCuratedQuestions: 122,
    featuredQuestions: [
      { problemId: 'kth-largest-heap', frequency: '94%', roundType: 'Phone Screen', interviewerFocus: 'Top-K candidate selection in O(N log K) time.' },
      { problemId: 'longest-substring-unique', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Session window uniqueness with hash map index jumps.' },
      { problemId: 'course-schedule-cycle', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Pipeline task dependency cycle detection.' },
      { problemId: 'three-sum-zero', frequency: '86%', roundType: 'Onsite Coding', interviewerFocus: 'Duplicate-free triplet enumeration via converging pointers.' }
    ]
  },
  {
    id: 'oracle',
    name: 'Oracle',
    tier: 'FAANG & Hyperscalers',
    hq: 'Austin, TX',
    interviewBarSummary: 'Core database & cloud infrastructure focus: B-tree/binary tree traversals, LRU buffer pool management, and binary search.',
    preferredLanguages: ['Java', 'Python', 'C++'],
    signaturePatterns: ['Trees & Graphs', 'Linked List & Pointers', 'Binary Search', 'Heap & Priority Queue'],
    totalCuratedQuestions: 106,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '95%', roundType: 'Onsite Coding', interviewerFocus: 'Database buffer pool page pinning and LRU list manipulation.' },
      { problemId: 'binary-tree-level-order', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Tree index traversal and level boundary tracking.' },
      { problemId: 'search-rotated-sorted', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Logarithmic partition lookup on shifted index arrays.' },
      { problemId: 'cycle-detection-floyd', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'Deadlock/cycle detection in pointer chains.' }
    ]
  },
  {
    id: 'tesla',
    name: 'Tesla',
    tier: 'FAANG & Hyperscalers',
    hq: 'Palo Alto, CA',
    interviewBarSummary: 'Prioritizes deterministic memory usage, graph pathfinding, sensor window filtering, and zero-overhead pointer algorithms.',
    preferredLanguages: ['Python', 'C++', 'Java'],
    signaturePatterns: ['Two Pointers', 'Trees & Graphs', 'Sliding Window', 'Binary Search'],
    totalCuratedQuestions: 77,
    featuredQuestions: [
      { problemId: 'cycle-detection-floyd', frequency: '92%', roundType: 'Phone Screen', interviewerFocus: 'Constant-space O(1) loop detection without hash set allocation.' },
      { problemId: 'course-schedule-cycle', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Autonomous task DAG scheduling and cycle rejection.' },
      { problemId: 'trapping-rain-water', frequency: '86%', roundType: 'Onsite Coding', interviewerFocus: 'Single-pass elevation profile integration.' },
      { problemId: 'valid-parentheses-stack', frequency: '83%', roundType: 'Phone Screen', interviewerFocus: 'Command telemetry packet framing validation.' }
    ]
  },
  {
    id: 'spacex',
    name: 'SpaceX',
    tier: 'FAANG & Hyperscalers',
    hq: 'Hawthorne, CA',
    interviewBarSummary: 'Strict memory bounds: static/bounded buffers, cycle detection, binary search on telemetry streams, and DAG validation.',
    preferredLanguages: ['Python', 'C++', 'Java'],
    signaturePatterns: ['Binary Search', 'Linked List & Pointers', 'Trees & Graphs', 'Two Pointers'],
    totalCuratedQuestions: 76,
    featuredQuestions: [
      { problemId: 'search-rotated-sorted', frequency: '93%', roundType: 'Phone Screen', interviewerFocus: 'Ring-buffer timestamp binary search after wrap-around.' },
      { problemId: 'cycle-detection-floyd', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Zero-heap-allocation state loop detection.' },
      { problemId: 'course-schedule-cycle', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'Flight sequence state-machine dependency verification.' },
      { problemId: 'reverse-linked-list', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'In-place packet queue reversal.' }
    ]
  },

  // AI & Frontier Labs (7)
  {
    id: 'openai',
    name: 'OpenAI',
    tier: 'AI & Frontier Labs',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Practical, high-complexity data structures: KV-cache eviction (LRU), dependency graphs, token windowing, and clean extensible code.',
    preferredLanguages: ['Python', 'Java', 'C++'],
    signaturePatterns: ['Linked List & Pointers', 'Sliding Window', 'Trees & Graphs', 'Heap & Priority Queue'],
    totalCuratedQuestions: 132,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '96%', roundType: 'Onsite Coding', interviewerFocus: 'KV-cache page eviction with O(1) pointer splice.' },
      { problemId: 'course-schedule-cycle', frequency: '92%', roundType: 'Onsite Coding', interviewerFocus: 'Compute graph topological execution order.' },
      { problemId: 'longest-substring-unique', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Context window sliding span deduplication.' },
      { problemId: 'kth-largest-heap', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'Top-K logits beam/sampling heap selection.' }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    tier: 'AI & Frontier Labs',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Deep emphasis on correctness invariants, stateful stream parsing, stack machines, and caching under memory constraints.',
    preferredLanguages: ['Python', 'Java', 'Rust', 'C++'],
    signaturePatterns: ['Linked List & Pointers', 'Monotonic Stack', 'Trees & Graphs', 'Dynamic Programming'],
    totalCuratedQuestions: 104,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '95%', roundType: 'Onsite Coding', interviewerFocus: 'Prefix cache eviction invariants and reference integrity.' },
      { problemId: 'valid-parentheses-stack', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'Streaming structured grammar/delimiter validation.' },
      { problemId: 'course-schedule-cycle', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'DAG evaluation order and cycle reporting.' },
      { problemId: 'coin-change-dp', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'Optimal dynamic programming state formulation.' }
    ]
  },
  {
    id: 'deepmind',
    name: 'Google DeepMind',
    tier: 'AI & Frontier Labs',
    hq: 'London, UK',
    interviewBarSummary: 'Combines algorithmic rigor in dynamic programming, graph search (BFS/DFS), and memory-efficient tree representations.',
    preferredLanguages: ['Python', 'C++', 'Java'],
    signaturePatterns: ['Dynamic Programming', 'Trees & Graphs', 'Heap & Priority Queue', 'Binary Search'],
    totalCuratedQuestions: 114,
    featuredQuestions: [
      { problemId: 'coin-change-dp', frequency: '94%', roundType: 'Onsite Coding', interviewerFocus: 'Bellman optimality equation & state table transition.' },
      { problemId: 'binary-tree-level-order', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'Search tree frontier expansion and memory bounds.' },
      { problemId: 'course-schedule-cycle', frequency: '87%', roundType: 'Onsite Coding', interviewerFocus: 'Directed graph reachability and topological sort.' },
      { problemId: 'trapping-rain-water', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Two-pointer invariant reasoning.' }
    ]
  },
  {
    id: 'scale-ai',
    name: 'Scale AI',
    tier: 'AI & Frontier Labs',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Fast-paced coding rounds testing graph workflows, priority queues, sliding windows, and clean full-stack data structures.',
    preferredLanguages: ['Python', 'Java', 'TypeScript'],
    signaturePatterns: ['Trees & Graphs', 'Heap & Priority Queue', 'Sliding Window', 'Two Pointers'],
    totalCuratedQuestions: 89,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '93%', roundType: 'Onsite Coding', interviewerFocus: 'Annotation pipeline task dependency resolution.' },
      { problemId: 'kth-largest-heap', frequency: '89%', roundType: 'Phone Screen', interviewerFocus: 'Priority queue scoring and top-K batching.' },
      { problemId: 'two-sum-hash', frequency: '86%', roundType: 'Phone Screen', interviewerFocus: 'Hash indexing for fast record pairing.' },
      { problemId: 'lru-cache-pointers', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'In-memory asset cache eviction.' }
    ]
  },
  {
    id: 'waymo',
    name: 'Waymo',
    tier: 'AI & Frontier Labs',
    hq: 'Mountain View, CA',
    interviewBarSummary: 'Robotics and perception algorithms: spatial search, monotonic queues/stacks, graph shortest paths, and deterministic memory.',
    preferredLanguages: ['C++', 'Python', 'Java'],
    signaturePatterns: ['Trees & Graphs', 'Monotonic Stack', 'Binary Search', 'Two Pointers'],
    totalCuratedQuestions: 117,
    featuredQuestions: [
      { problemId: 'trapping-rain-water', frequency: '91%', roundType: 'Onsite Coding', interviewerFocus: 'LiDAR elevation scan depression/occlusion calculation.' },
      { problemId: 'daily-temperatures-stack', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Monotonic stack horizon detection.' },
      { problemId: 'search-rotated-sorted', frequency: '86%', roundType: 'Phone Screen', interviewerFocus: 'Circular sensor scan angle binary search.' },
      { problemId: 'course-schedule-cycle', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'Planner module DAG execution.' }
    ]
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    tier: 'AI & Frontier Labs',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Search & retrieval engineering: top-K ranking heaps, LRU query caches, string windowing, and low-latency graph traversal.',
    preferredLanguages: ['Python', 'Java', 'C++'],
    signaturePatterns: ['Heap & Priority Queue', 'Linked List & Pointers', 'Sliding Window', 'Binary Search'],
    totalCuratedQuestions: 88,
    featuredQuestions: [
      { problemId: 'kth-largest-heap', frequency: '95%', roundType: 'Phone Screen', interviewerFocus: 'Top-K document reranking with bounded min-heap.' },
      { problemId: 'lru-cache-pointers', frequency: '92%', roundType: 'Onsite Coding', interviewerFocus: 'Semantic query cache O(1) hit promotion.' },
      { problemId: 'longest-substring-unique', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Token span deduplication.' },
      { problemId: 'search-rotated-sorted', frequency: '83%', roundType: 'Onsite Coding', interviewerFocus: 'Sharded index binary search.' }
    ]
  },
  {
    id: 'databricks',
    name: 'Databricks',
    tier: 'AI & Frontier Labs',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Famous for tough algorithmic interviews: DAG query planning, LRU memory management, monotonic stacks, and external/heap sorting.',
    preferredLanguages: ['Java', 'Python', 'Scala', 'C++'],
    signaturePatterns: ['Trees & Graphs', 'Linked List & Pointers', 'Heap & Priority Queue', 'Monotonic Stack'],
    totalCuratedQuestions: 117,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '96%', roundType: 'Onsite Coding', interviewerFocus: 'Spark DAG stage dependency cycle detection & ordering.' },
      { problemId: 'lru-cache-pointers', frequency: '93%', roundType: 'Onsite Coding', interviewerFocus: 'Off-heap/in-memory cache block replacement.' },
      { problemId: 'trapping-rain-water', frequency: '89%', roundType: 'Phone Screen', interviewerFocus: 'Two-pointer partition scan.' },
      { problemId: 'kth-largest-heap', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Distributed partition top-K aggregation.' }
    ]
  },

  // Quant & High-Frequency (7)
  {
    id: 'citadel',
    name: 'Citadel',
    tier: 'Quant & High-Frequency',
    hq: 'Miami, FL',
    interviewBarSummary: 'Unforgiving bar on time and cache complexity: monotonic stacks for time-series, dynamic programming, and zero-allocation two-pointer scans.',
    preferredLanguages: ['C++', 'Python', 'Java'],
    signaturePatterns: ['Monotonic Stack', 'Dynamic Programming', 'Two Pointers', 'Heap & Priority Queue'],
    totalCuratedQuestions: 108,
    featuredQuestions: [
      { problemId: 'trapping-rain-water', frequency: '97%', roundType: 'Onsite Coding', interviewerFocus: 'Branch-efficiency and register-only state tracking.' },
      { problemId: 'daily-temperatures-stack', frequency: '94%', roundType: 'Phone Screen', interviewerFocus: 'Time-series next-higher tick horizon via monotonic stack.' },
      { problemId: 'coin-change-dp', frequency: '91%', roundType: 'Onsite Coding', interviewerFocus: 'Tight 1D cache-line friendly DP table layout.' },
      { problemId: 'three-sum-zero', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Multi-leg order book matching via sorted pointers.' },
      { problemId: 'lru-cache-pointers', frequency: '86%', roundType: 'Onsite Coding', interviewerFocus: 'Pre-allocated node pool LRU design.' }
    ]
  },
  {
    id: 'jane-street',
    name: 'Jane Street',
    tier: 'Quant & High-Frequency',
    hq: 'New York, NY',
    interviewBarSummary: 'Deep focus on state invariants, functional/imperative pointer trade-offs, order-book priority queues, and cycle/graph reasoning.',
    preferredLanguages: ['OCaml', 'Python', 'Java', 'C++'],
    signaturePatterns: ['Monotonic Stack', 'Heap & Priority Queue', 'Trees & Graphs', 'Dynamic Programming'],
    totalCuratedQuestions: 102,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '93%', roundType: 'Onsite Coding', interviewerFocus: 'State transition invariants on every pointer mutation.' },
      { problemId: 'daily-temperatures-stack', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'Stack invariant proof across price ticks.' },
      { problemId: 'valid-parentheses-stack', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Parser stack state transitions.' },
      { problemId: 'coin-change-dp', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'Exact combinatorial state space pruning.' }
    ]
  },
  {
    id: 'two-sigma',
    name: 'Two Sigma',
    tier: 'Quant & High-Frequency',
    hq: 'New York, NY',
    interviewBarSummary: 'Strong emphasis on algorithmic modeling, sliding window statistics, dynamic programming, and graph connectivity.',
    preferredLanguages: ['Python', 'Java', 'C++'],
    signaturePatterns: ['Sliding Window', 'Dynamic Programming', 'Two Pointers', 'Trees & Graphs'],
    totalCuratedQuestions: 102,
    featuredQuestions: [
      { problemId: 'longest-substring-unique', frequency: '92%', roundType: 'Phone Screen', interviewerFocus: 'Rolling window invariant over high-frequency streams.' },
      { problemId: 'coin-change-dp', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Dynamic programming memoization vs tabulation memory.' },
      { problemId: 'course-schedule-cycle', frequency: '87%', roundType: 'Onsite Coding', interviewerFocus: 'Signal pipeline DAG topological evaluation.' },
      { problemId: 'container-most-water', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Two-pointer optimization proof.' }
    ]
  },
  {
    id: 'hrt',
    name: 'Hudson River Trading',
    tier: 'Quant & High-Frequency',
    hq: 'New York, NY',
    interviewBarSummary: 'Systems & low-latency focus: pointer layouts, ring buffers, binary search in shifted buffers, and O(1) memory algorithms.',
    preferredLanguages: ['C++', 'Python', 'Java'],
    signaturePatterns: ['Two Pointers', 'Linked List & Pointers', 'Binary Search', 'Monotonic Stack'],
    totalCuratedQuestions: 102,
    featuredQuestions: [
      { problemId: 'cycle-detection-floyd', frequency: '94%', roundType: 'Phone Screen', interviewerFocus: 'Pointer chasing overhead and Floyd O(1) space proof.' },
      { problemId: 'search-rotated-sorted', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Circular buffer binary search index math.' },
      { problemId: 'trapping-rain-water', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'Single-pass L1-cache friendly pointer convergence.' },
      { problemId: 'reverse-linked-list', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'Intrusive linked list pointer manipulation.' }
    ]
  },
  {
    id: 'goldman-sachs',
    name: 'Goldman Sachs',
    tier: 'Quant & High-Frequency',
    hq: 'New York, NY',
    interviewBarSummary: 'Classic algorithmic benchmarks: Trapping Rain Water is their #1 most famous interview question, alongside DP and hash/pointer problems.',
    preferredLanguages: ['Java', 'Python', 'C++'],
    signaturePatterns: ['Two Pointers', 'Dynamic Programming', 'Sliding Window', 'Hash & Array' as any],
    totalCuratedQuestions: 87,
    featuredQuestions: [
      { problemId: 'trapping-rain-water', frequency: '99%', roundType: 'Onsite Coding', interviewerFocus: 'Signature Goldman question: expects O(N) time and O(1) space two-pointer trace.' },
      { problemId: 'coin-change-dp', frequency: '93%', roundType: 'Phone Screen', interviewerFocus: 'Minimum denomination count via bottom-up DP.' },
      { problemId: 'longest-substring-unique', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'Sliding window index map updates.' },
      { problemId: 'cycle-detection-floyd', frequency: '87%', roundType: 'Onsite Coding', interviewerFocus: 'Fast/slow pointer cycle entry identification.' }
    ]
  },
  {
    id: 'morgan-stanley',
    name: 'Morgan Stanley',
    tier: 'Quant & High-Frequency',
    hq: 'New York, NY',
    interviewBarSummary: 'Strong focus on Java memory model, collections internals (HashMap/LinkedHashMap), LRU caches, and tree/linked-list algorithms.',
    preferredLanguages: ['Java', 'Python', 'C++'],
    signaturePatterns: ['Linked List & Pointers', 'Trees & Graphs', 'Dynamic Programming', 'Two Pointers'],
    totalCuratedQuestions: 88,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '95%', roundType: 'Onsite Coding', interviewerFocus: 'Internal pointer mechanics of LinkedHashMap vs custom Node class.' },
      { problemId: 'reverse-linked-list', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Iterative vs recursive stack frame overhead in JVM.' },
      { problemId: 'two-sum-hash', frequency: '89%', roundType: 'Phone Screen', interviewerFocus: 'Hash bucket resolution and O(N) single pass.' },
      { problemId: 'binary-tree-level-order', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'Breadth-first traversal queue memory profile.' }
    ]
  },
  {
    id: 'jpmorgan',
    name: 'JPMorgan Chase',
    tier: 'Quant & High-Frequency',
    hq: 'New York, NY',
    interviewBarSummary: 'Tests practical core algorithms: valid parentheses/parsers, coin change DP, two-sum variants, and linked-list cycle detection.',
    preferredLanguages: ['Java', 'Python'],
    signaturePatterns: ['Dynamic Programming', 'Monotonic Stack', 'Two Pointers', 'Linked List & Pointers'],
    totalCuratedQuestions: 86,
    featuredQuestions: [
      { problemId: 'valid-parentheses-stack', frequency: '96%', roundType: 'Phone Screen', interviewerFocus: 'Stack lifo invariants for transaction expression validation.' },
      { problemId: 'coin-change-dp', frequency: '93%', roundType: 'Onsite Coding', interviewerFocus: 'Settlement denomination optimization via DP.' },
      { problemId: 'two-sum-hash', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Complement lookup in O(1) expected time.' },
      { problemId: 'cycle-detection-floyd', frequency: '86%', roundType: 'Onsite Coding', interviewerFocus: 'Detecting circular settlement chains.' }
    ]
  },

  // FinTech & Commerce (13)
  {
    id: 'stripe',
    name: 'Stripe',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Pragmatic, clean, bug-free code: string/delimiter parsing, dependency graphs, rate-limiter sliding windows, and state maps.',
    preferredLanguages: ['Python', 'Java', 'Ruby', 'Go'],
    signaturePatterns: ['Sliding Window', 'Monotonic Stack', 'Trees & Graphs', 'Linked List & Pointers'],
    totalCuratedQuestions: 106,
    featuredQuestions: [
      { problemId: 'valid-parentheses-stack', frequency: '93%', roundType: 'Phone Screen', interviewerFocus: 'Header/token delimiter validation using an explicit stack.' },
      { problemId: 'course-schedule-cycle', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Ledger settlement dependency graph resolution.' },
      { problemId: 'lru-cache-pointers', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'Idempotency key cache eviction mechanics.' },
      { problemId: 'longest-substring-unique', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'Sliding window rate-limit bucket analysis.' }
    ]
  },
  {
    id: 'uber',
    name: 'Uber',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Heavy on graphs, BFS/DFS, priority queues (dispatch matching), monotonic stacks, and sliding windows.',
    preferredLanguages: ['Java', 'Python', 'Go', 'C++'],
    signaturePatterns: ['Trees & Graphs', 'Heap & Priority Queue', 'Sliding Window', 'Monotonic Stack'],
    totalCuratedQuestions: 138,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '95%', roundType: 'Onsite Coding', interviewerFocus: 'Trip state & route dependency graph resolution.' },
      { problemId: 'kth-largest-heap', frequency: '92%', roundType: 'Phone Screen', interviewerFocus: 'Nearest-K driver priority queue maintenance.' },
      { problemId: 'trapping-rain-water', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Two-pointer surge boundary scan.' },
      { problemId: 'daily-temperatures-stack', frequency: '86%', roundType: 'Phone Screen', interviewerFocus: 'Monotonic stack next-peak wait time.' }
    ]
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Famous for challenging coding rounds requiring clean custom data structures, DP, graph traversal, and pointer precision.',
    preferredLanguages: ['Java', 'Python', 'TypeScript'],
    signaturePatterns: ['Dynamic Programming', 'Trees & Graphs', 'Linked List & Pointers', 'Two Pointers'],
    totalCuratedQuestions: 107,
    featuredQuestions: [
      { problemId: 'coin-change-dp', frequency: '94%', roundType: 'Onsite Coding', interviewerFocus: 'Booking night-combination DP state transitions.' },
      { problemId: 'trapping-rain-water', frequency: '91%', roundType: 'Onsite Coding', interviewerFocus: 'Terrain/water volume visualization and pointer updates.' },
      { problemId: 'lru-cache-pointers', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Search result listing cache doubly-linked list.' },
      { problemId: 'three-sum-zero', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'Multi-filter budget combination matching.' }
    ]
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Practical order-book and transaction matching problems: heaps, hash maps, DAG ordering, and stack validation.',
    preferredLanguages: ['Go', 'Python', 'Java'],
    signaturePatterns: ['Heap & Priority Queue', 'Trees & Graphs', 'Two Pointers', 'Monotonic Stack'],
    totalCuratedQuestions: 69,
    featuredQuestions: [
      { problemId: 'kth-largest-heap', frequency: '93%', roundType: 'Phone Screen', interviewerFocus: 'Order-book top-K liquidity depth via min-heap.' },
      { problemId: 'course-schedule-cycle', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Nonce/transaction dependency DAG ordering.' },
      { problemId: 'two-sum-hash', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'UTXO / order complement matching.' },
      { problemId: 'valid-parentheses-stack', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Smart-contract ABI expression validation.' }
    ]
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    tier: 'FinTech & Commerce',
    hq: 'Menlo Park, CA',
    interviewBarSummary: 'Focuses on financial time-series algorithms: monotonic stacks, two pointers, sliding windows, and priority queues.',
    preferredLanguages: ['Python', 'Java', 'Go'],
    signaturePatterns: ['Monotonic Stack', 'Sliding Window', 'Two Pointers', 'Heap & Priority Queue'],
    totalCuratedQuestions: 70,
    featuredQuestions: [
      { problemId: 'daily-temperatures-stack', frequency: '95%', roundType: 'Phone Screen', interviewerFocus: 'Days until higher stock close via monotonic stack.' },
      { problemId: 'trapping-rain-water', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Drawdown trough accumulation with two pointers.' },
      { problemId: 'two-sum-hash', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Trade pair offset matching in O(N).' },
      { problemId: 'lru-cache-pointers', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'Quote ticker cache eviction.' }
    ]
  },
  {
    id: 'block',
    name: 'Block (Square)',
    tier: 'FinTech & Commerce',
    hq: 'Oakland, CA',
    interviewBarSummary: 'Clean object-oriented and algorithmic execution in Java/Python: linked lists, hash tables, DP for change-making, and trees.',
    preferredLanguages: ['Java', 'Python', 'Kotlin', 'Go'],
    signaturePatterns: ['Dynamic Programming', 'Linked List & Pointers', 'Two Pointers', 'Trees & Graphs'],
    totalCuratedQuestions: 70,
    featuredQuestions: [
      { problemId: 'coin-change-dp', frequency: '95%', roundType: 'Phone Screen', interviewerFocus: 'POS register minimum coin/bill change calculation.' },
      { problemId: 'lru-cache-pointers', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Merchant session cache pointer operations.' },
      { problemId: 'reverse-linked-list', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Ledger audit chain traversal and reversal.' },
      { problemId: 'two-sum-hash', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'Split-payment complement lookup.' }
    ]
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Dispatch and logistics optimization: BFS level traversal, topological sort, binary search, and monotonic stacks.',
    preferredLanguages: ['Python', 'Java', 'Kotlin', 'Go'],
    signaturePatterns: ['Trees & Graphs', 'Binary Search', 'Heap & Priority Queue', 'Monotonic Stack'],
    totalCuratedQuestions: 76,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '94%', roundType: 'Onsite Coding', interviewerFocus: 'Multi-stop delivery precedence validation.' },
      { problemId: 'binary-tree-level-order', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'BFS radius ring expansion from merchant node.' },
      { problemId: 'kth-largest-heap', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Top-K Dasher scoring queue.' },
      { problemId: 'search-rotated-sorted', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'Shift-schedule circular binary search.' }
    ]
  },
  {
    id: 'instacart',
    name: 'Instacart',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Practical problem solving around lookup tables, binary search, sliding windows, and two-pointer basket matching.',
    preferredLanguages: ['Python', 'Ruby', 'Java', 'Go'],
    signaturePatterns: ['Two Pointers', 'Binary Search', 'Sliding Window', 'Linked List & Pointers'],
    totalCuratedQuestions: 72,
    featuredQuestions: [
      { problemId: 'two-sum-hash', frequency: '93%', roundType: 'Phone Screen', interviewerFocus: 'Promo bundle item pair lookup in O(N).' },
      { problemId: 'search-rotated-sorted', frequency: '89%', roundType: 'Phone Screen', interviewerFocus: 'Sorted catalog shard binary search.' },
      { problemId: 'three-sum-zero', frequency: '86%', roundType: 'Onsite Coding', interviewerFocus: 'Three-item basket target matching.' },
      { problemId: 'lru-cache-pointers', frequency: '83%', roundType: 'Onsite Coding', interviewerFocus: 'Inventory SKU cache eviction.' }
    ]
  },
  {
    id: 'lyft',
    name: 'Lyft',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Focuses on stateful data structures (LRU Cache, Min-Heap), graph BFS, and two-pointer interval/array scans.',
    preferredLanguages: ['Python', 'Java', 'Go'],
    signaturePatterns: ['Linked List & Pointers', 'Heap & Priority Queue', 'Trees & Graphs', 'Two Pointers'],
    totalCuratedQuestions: 70,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '95%', roundType: 'Onsite Coding', interviewerFocus: 'Live coding a complete LRU cache with custom Node pointers.' },
      { problemId: 'trapping-rain-water', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Two-pointer memory efficiency.' },
      { problemId: 'kth-largest-heap', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'ETA ranking heap.' },
      { problemId: 'binary-tree-level-order', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'BFS level-by-level graph/tree exploration.' }
    ]
  },
  {
    id: 'spotify',
    name: 'Spotify',
    tier: 'FinTech & Commerce',
    hq: 'Stockholm / New York',
    interviewBarSummary: 'Playlist & streaming data structures: doubly-linked queues, sliding windows, top-K heaps, and hash maps.',
    preferredLanguages: ['Java', 'Python', 'C++'],
    signaturePatterns: ['Linked List & Pointers', 'Sliding Window', 'Heap & Priority Queue', 'Two Pointers'],
    totalCuratedQuestions: 102,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '93%', roundType: 'Onsite Coding', interviewerFocus: 'Offline audio track cache eviction with O(1) pointer updates.' },
      { problemId: 'longest-substring-unique', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'Longest repeat-free playback window.' },
      { problemId: 'reverse-linked-list', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Playlist queue pointer manipulation.' },
      { problemId: 'kth-largest-heap', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'Top-K streamed track aggregation.' }
    ]
  },
  {
    id: 'snap',
    name: 'Snap',
    tier: 'FinTech & Commerce',
    hq: 'Santa Monica, CA',
    interviewBarSummary: 'Graph algorithms, BFS/DFS, dynamic programming, and low-memory mobile-friendly pointer manipulation.',
    preferredLanguages: ['Java', 'Python', 'C++'],
    signaturePatterns: ['Trees & Graphs', 'Dynamic Programming', 'Linked List & Pointers', 'Sliding Window'],
    totalCuratedQuestions: 102,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '92%', roundType: 'Onsite Coding', interviewerFocus: 'Lens filter render graph topological sort.' },
      { problemId: 'lru-cache-pointers', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Story media memory cache eviction.' },
      { problemId: 'binary-tree-level-order', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Social graph degree-of-separation BFS.' },
      { problemId: 'trapping-rain-water', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'Two-pointer scan.' }
    ]
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Feed ranking & visual discovery: heaps, graphs, binary search, and dynamic programming.',
    preferredLanguages: ['Python', 'Java', 'C++'],
    signaturePatterns: ['Heap & Priority Queue', 'Trees & Graphs', 'Binary Search', 'Two Pointers'],
    totalCuratedQuestions: 102,
    featuredQuestions: [
      { problemId: 'kth-largest-heap', frequency: '92%', roundType: 'Phone Screen', interviewerFocus: 'Pin feed candidate top-K heap.' },
      { problemId: 'course-schedule-cycle', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Taxonomy DAG cycle check.' },
      { problemId: 'three-sum-zero', frequency: '86%', roundType: 'Phone Screen', interviewerFocus: 'Sorted pointer convergence.' },
      { problemId: 'binary-tree-level-order', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'Board hierarchy level traversal.' }
    ]
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    tier: 'FinTech & Commerce',
    hq: 'Sunnyvale, CA',
    interviewBarSummary: 'Economic graph traversal (1st/2nd/3rd degree BFS), tree level-order, cycle detection, and thread-safe caches.',
    preferredLanguages: ['Java', 'Python', 'Scala'],
    signaturePatterns: ['Trees & Graphs', 'Linked List & Pointers', 'Two Pointers', 'Binary Search'],
    totalCuratedQuestions: 105,
    featuredQuestions: [
      { problemId: 'binary-tree-level-order', frequency: '96%', roundType: 'Phone Screen', interviewerFocus: 'Connection degree BFS frontier expansion.' },
      { problemId: 'cycle-detection-floyd', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Reference chain loop detection.' },
      { problemId: 'lru-cache-pointers', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Profile cache doubly-linked node splicing.' },
      { problemId: 'valid-parentheses-stack', frequency: '86%', roundType: 'Phone Screen', interviewerFocus: 'Boolean search query delimiter validation.' }
    ]
  },

  // Enterprise & Cloud Systems (15)
  {
    id: 'snowflake',
    name: 'Snowflake',
    tier: 'Enterprise & Cloud Systems',
    hq: 'Bozeman, MT / San Mateo, CA',
    interviewBarSummary: 'Database internals & distributed execution: query DAG scheduling, buffer cache LRU, binary search on micro-partitions, and DP.',
    preferredLanguages: ['Java', 'C++', 'Python'],
    signaturePatterns: ['Linked List & Pointers', 'Binary Search', 'Trees & Graphs', 'Dynamic Programming'],
    totalCuratedQuestions: 65,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '96%', roundType: 'Onsite Coding', interviewerFocus: 'Warehouse local SSD/RAM page eviction pointer splice.' },
      { problemId: 'search-rotated-sorted', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Micro-partition zone-map binary search.' },
      { problemId: 'course-schedule-cycle', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'Query operator pipeline DAG scheduling.' },
      { problemId: 'trapping-rain-water', frequency: '86%', roundType: 'Onsite Coding', interviewerFocus: 'Two-pointer memory-bounded scan.' }
    ]
  },
  {
    id: 'palantir',
    name: 'Palantir',
    tier: 'Enterprise & Cloud Systems',
    hq: 'Denver, CO',
    interviewBarSummary: 'Ontology graph resolution: topological sort, cycle detection, BFS traversals, and complex state invariants.',
    preferredLanguages: ['Java', 'Python', 'TypeScript'],
    signaturePatterns: ['Trees & Graphs', 'Sliding Window', 'Monotonic Stack', 'Linked List & Pointers'],
    totalCuratedQuestions: 92,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '97%', roundType: 'Onsite Coding', interviewerFocus: 'Ontology transform pipeline lineage & cycle detection.' },
      { problemId: 'binary-tree-level-order', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Entity relationship graph hop-by-hop BFS.' },
      { problemId: 'lru-cache-pointers', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'Object view cache pointer management.' },
      { problemId: 'daily-temperatures-stack', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Time-series alert threshold horizon.' }
    ]
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    tier: 'Enterprise & Cloud Systems',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Enterprise Java & Python fundamentals: LRU cache, tree traversals, dynamic programming, and stack-based expression evaluators.',
    preferredLanguages: ['Java', 'Python', 'C++'],
    signaturePatterns: ['Linked List & Pointers', 'Trees & Graphs', 'Dynamic Programming', 'Monotonic Stack'],
    totalCuratedQuestions: 56,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '94%', roundType: 'Onsite Coding', interviewerFocus: 'Multi-tenant metadata cache eviction.' },
      { problemId: 'valid-parentheses-stack', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Formula field syntax delimiter validation.' },
      { problemId: 'binary-tree-level-order', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Role hierarchy level-order traversal.' },
      { problemId: 'coin-change-dp', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'Quota allocation optimization DP.' }
    ]
  },
  {
    id: 'adobe',
    name: 'Adobe',
    tier: 'Enterprise & Cloud Systems',
    hq: 'San Jose, CA',
    interviewBarSummary: 'Document DOM trees, undo/redo linked stacks, two-pointer geometry/array processing, and binary search.',
    preferredLanguages: ['C++', 'Java', 'Python'],
    signaturePatterns: ['Linked List & Pointers', 'Two Pointers', 'Trees & Graphs', 'Dynamic Programming'],
    totalCuratedQuestions: 57,
    featuredQuestions: [
      { problemId: 'reverse-linked-list', frequency: '93%', roundType: 'Phone Screen', interviewerFocus: 'Action history chain pointer reversal.' },
      { problemId: 'container-most-water', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'Bounding box area maximization via two pointers.' },
      { problemId: 'trapping-rain-water', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'Scanline raster boundary filling.' },
      { problemId: 'lru-cache-pointers', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'Glyph/texture tile cache eviction.' }
    ]
  },
  {
    id: 'cisco',
    name: 'Cisco',
    tier: 'Enterprise & Cloud Systems',
    hq: 'San Jose, CA',
    interviewBarSummary: 'Networking & packet processing: linked buffer lists, ring-buffer binary search, routing loop detection (Floyd), and graphs.',
    preferredLanguages: ['C++', 'Python', 'Java', 'C'],
    signaturePatterns: ['Linked List & Pointers', 'Trees & Graphs', 'Binary Search', 'Two Pointers'],
    totalCuratedQuestions: 94,
    featuredQuestions: [
      { problemId: 'cycle-detection-floyd', frequency: '95%', roundType: 'Phone Screen', interviewerFocus: 'Routing table next-hop pointer loop detection in O(1) memory.' },
      { problemId: 'reverse-linked-list', frequency: '92%', roundType: 'Phone Screen', interviewerFocus: 'Sk_buff packet descriptor chain reversal.' },
      { problemId: 'lru-cache-pointers', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'ARP/flow table cache replacement.' },
      { problemId: 'valid-parentheses-stack', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Config parser bracket matching.' }
    ]
  },
  {
    id: 'ibm',
    name: 'IBM',
    tier: 'Enterprise & Cloud Systems',
    hq: 'Armonk, NY',
    interviewBarSummary: 'Core computer science foundations: linked lists, stacks, binary trees, dynamic programming, and two pointers.',
    preferredLanguages: ['Java', 'Python', 'C++'],
    signaturePatterns: ['Linked List & Pointers', 'Dynamic Programming', 'Two Pointers', 'Trees & Graphs'],
    totalCuratedQuestions: 59,
    featuredQuestions: [
      { problemId: 'two-sum-hash', frequency: '94%', roundType: 'Phone Screen', interviewerFocus: 'Hash table indexing and time/space trade-off.' },
      { problemId: 'reverse-linked-list', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Three-pointer iterative reversal trace.' },
      { problemId: 'coin-change-dp', frequency: '87%', roundType: 'Onsite Coding', interviewerFocus: 'Dynamic programming tabulation.' },
      { problemId: 'valid-parentheses-stack', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'Stack LIFO memory behavior.' }
    ]
  },
  {
    id: 'intel',
    name: 'Intel',
    tier: 'Enterprise & Cloud Systems',
    hq: 'Santa Clara, CA',
    interviewBarSummary: 'Hardware-conscious software engineering: memory alignment, pointer manipulation, cycle detection, and binary search.',
    preferredLanguages: ['C++', 'Python', 'Java'],
    signaturePatterns: ['Linked List & Pointers', 'Binary Search', 'Two Pointers', 'Trees & Graphs'],
    totalCuratedQuestions: 91,
    featuredQuestions: [
      { problemId: 'reverse-linked-list', frequency: '94%', roundType: 'Phone Screen', interviewerFocus: 'In-place pointer updates and register usage.' },
      { problemId: 'cycle-detection-floyd', frequency: '91%', roundType: 'Onsite Coding', interviewerFocus: 'Fast/slow pointer address convergence.' },
      { problemId: 'lru-cache-pointers', frequency: '89%', roundType: 'Onsite Coding', interviewerFocus: 'CPU L2/L3 cache line LRU replacement policy.' },
      { problemId: 'search-rotated-sorted', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'Binary search without division overflow.' }
    ]
  },
  {
    id: 'amd',
    name: 'AMD',
    tier: 'Enterprise & Cloud Systems',
    hq: 'Santa Clara, CA',
    interviewBarSummary: 'Systems & compiler optimization focus: instruction DAG scheduling, pointer reversal, LRU cache mechanics, and binary search.',
    preferredLanguages: ['C++', 'Python', 'Java'],
    signaturePatterns: ['Linked List & Pointers', 'Trees & Graphs', 'Binary Search', 'Two Pointers'],
    totalCuratedQuestions: 61,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '93%', roundType: 'Onsite Coding', interviewerFocus: 'Compiler instruction dependency DAG scheduling.' },
      { problemId: 'lru-cache-pointers', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Set-associative cache LRU doubly-linked list.' },
      { problemId: 'reverse-linked-list', frequency: '88%', roundType: 'Phone Screen', interviewerFocus: 'Free-list memory block pointer reversal.' },
      { problemId: 'cycle-detection-floyd', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Pointer chain loop detection.' }
    ]
  },
  {
    id: 'qualcomm',
    name: 'Qualcomm',
    tier: 'Enterprise & Cloud Systems',
    hq: 'San Diego, CA',
    interviewBarSummary: 'Embedded & systems rigor: zero-extra-memory linked list algorithms, circular buffer binary search, and sliding windows.',
    preferredLanguages: ['C++', 'Python', 'Java', 'C'],
    signaturePatterns: ['Linked List & Pointers', 'Two Pointers', 'Binary Search', 'Sliding Window'],
    totalCuratedQuestions: 94,
    featuredQuestions: [
      { problemId: 'cycle-detection-floyd', frequency: '95%', roundType: 'Phone Screen', interviewerFocus: 'DMA descriptor ring cycle detection in O(1) RAM.' },
      { problemId: 'reverse-linked-list', frequency: '92%', roundType: 'Phone Screen', interviewerFocus: 'In-place linked list reversal.' },
      { problemId: 'search-rotated-sorted', frequency: '87%', roundType: 'Onsite Coding', interviewerFocus: 'Rotated ring buffer binary search.' },
      { problemId: 'longest-substring-unique', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Packet frame window scan.' }
    ]
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    tier: 'Enterprise & Cloud Systems',
    hq: 'Sydney / San Francisco',
    interviewBarSummary: 'Known for clean, modular data structure design: rate limiters (sliding window), caches (LRU), and issue dependency graphs.',
    preferredLanguages: ['Java', 'Python', 'TypeScript', 'Go'],
    signaturePatterns: ['Sliding Window', 'Linked List & Pointers', 'Trees & Graphs', 'Heap & Priority Queue'],
    totalCuratedQuestions: 55,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '94%', roundType: 'Onsite Coding', interviewerFocus: 'Clean OOP node separation and O(1) eviction.' },
      { problemId: 'course-schedule-cycle', frequency: '91%', roundType: 'Onsite Coding', interviewerFocus: 'Jira issue blocker cycle detection.' },
      { problemId: 'longest-substring-unique', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Sliding window state maintenance.' },
      { problemId: 'kth-largest-heap', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Priority queue ticket ranking.' }
    ]
  },
  {
    id: 'datadog',
    name: 'Datadog',
    tier: 'Enterprise & Cloud Systems',
    hq: 'New York, NY',
    interviewBarSummary: 'High-throughput observability engineering: time-series monotonic stacks, sliding window aggregations, and top-K metric heaps.',
    preferredLanguages: ['Go', 'Python', 'Java', 'Rust'],
    signaturePatterns: ['Sliding Window', 'Monotonic Stack', 'Heap & Priority Queue', 'Trees & Graphs'],
    totalCuratedQuestions: 60,
    featuredQuestions: [
      { problemId: 'daily-temperatures-stack', frequency: '94%', roundType: 'Phone Screen', interviewerFocus: 'Metric spike duration via monotonic stack.' },
      { problemId: 'kth-largest-heap', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Top-K noisy host aggregation with bounded min-heap.' },
      { problemId: 'longest-substring-unique', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'Log stream sliding window.' },
      { problemId: 'course-schedule-cycle', frequency: '85%', roundType: 'Onsite Coding', interviewerFocus: 'Service trace DAG cycle detection.' }
    ]
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    tier: 'Enterprise & Cloud Systems',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Edge networking & caching: LRU cache eviction, sliding window rate limiting, binary search, and fast cycle detection.',
    preferredLanguages: ['Rust', 'Go', 'Python', 'Java'],
    signaturePatterns: ['Linked List & Pointers', 'Sliding Window', 'Binary Search', 'Two Pointers'],
    totalCuratedQuestions: 60,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '96%', roundType: 'Onsite Coding', interviewerFocus: 'CDN edge asset cache O(1) promotion and eviction.' },
      { problemId: 'longest-substring-unique', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'Sliding window request fingerprinting.' },
      { problemId: 'search-rotated-sorted', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Consistent-hash ring binary search.' },
      { problemId: 'cycle-detection-floyd', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'CNAME redirect chain loop detection.' }
    ]
  },
  {
    id: 'crowdstrike',
    name: 'CrowdStrike',
    tier: 'Enterprise & Cloud Systems',
    hq: 'Austin, TX',
    interviewBarSummary: 'Endpoint telemetry & process trees: tree level-order traversal, process DAG cycle detection, and sliding window anomaly scans.',
    preferredLanguages: ['C++', 'Go', 'Python', 'Java'],
    signaturePatterns: ['Trees & Graphs', 'Sliding Window', 'Linked List & Pointers', 'Heap & Priority Queue'],
    totalCuratedQuestions: 58,
    featuredQuestions: [
      { problemId: 'binary-tree-level-order', frequency: '93%', roundType: 'Phone Screen', interviewerFocus: 'Process spawn tree breadth-first inspection.' },
      { problemId: 'course-schedule-cycle', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Execution dependency graph analysis.' },
      { problemId: 'lru-cache-pointers', frequency: '87%', roundType: 'Onsite Coding', interviewerFocus: 'Signature hash cache eviction.' },
      { problemId: 'longest-substring-unique', frequency: '83%', roundType: 'Phone Screen', interviewerFocus: 'Event sequence windowing.' }
    ]
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    tier: 'Enterprise & Cloud Systems',
    hq: 'New York, NY',
    interviewBarSummary: 'Storage engine (WiredTiger) & query planner algorithms: LRU cache pages, tree traversals, binary search, and two-pointer merges.',
    preferredLanguages: ['C++', 'Java', 'Python', 'Go'],
    signaturePatterns: ['Linked List & Pointers', 'Trees & Graphs', 'Binary Search', 'Two Pointers'],
    totalCuratedQuestions: 58,
    featuredQuestions: [
      { problemId: 'lru-cache-pointers', frequency: '95%', roundType: 'Onsite Coding', interviewerFocus: 'WiredTiger storage page eviction doubly-linked list.' },
      { problemId: 'binary-tree-level-order', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Index tree level traversal.' },
      { problemId: 'search-rotated-sorted', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Chunk range binary search.' },
      { problemId: 'three-sum-zero', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'Index-backed multi-key join pointers.' }
    ]
  },
  {
    id: 'figma',
    name: 'Figma',
    tier: 'Enterprise & Cloud Systems',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Scene-graph trees, undo/redo pointer stacks, spatial bounding boxes, and dependency graph evaluation.',
    preferredLanguages: ['TypeScript', 'C++', 'Python', 'Java'],
    signaturePatterns: ['Trees & Graphs', 'Monotonic Stack', 'Linked List & Pointers', 'Two Pointers'],
    totalCuratedQuestions: 64,
    featuredQuestions: [
      { problemId: 'binary-tree-level-order', frequency: '93%', roundType: 'Phone Screen', interviewerFocus: 'Canvas scene-graph layer hierarchy traversal.' },
      { problemId: 'course-schedule-cycle', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'Component instance dependency cycle detection.' },
      { problemId: 'valid-parentheses-stack', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Vector path command group nesting validation.' },
      { problemId: 'lru-cache-pointers', frequency: '84%', roundType: 'Onsite Coding', interviewerFocus: 'Texture atlas tile LRU eviction.' }
    ]
  },
  {
    id: 'notion',
    name: 'Notion',
    tier: 'Enterprise & Cloud Systems',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Block-tree hierarchy manipulation, formula dependency graphs, LRU block caches, and clean extensible code.',
    preferredLanguages: ['TypeScript', 'Python', 'Java'],
    signaturePatterns: ['Trees & Graphs', 'Linked List & Pointers', 'Monotonic Stack', 'Sliding Window'],
    totalCuratedQuestions: 58,
    featuredQuestions: [
      { problemId: 'binary-tree-level-order', frequency: '94%', roundType: 'Phone Screen', interviewerFocus: 'Nested block tree breadth-first serialization.' },
      { problemId: 'course-schedule-cycle', frequency: '91%', roundType: 'Onsite Coding', interviewerFocus: 'Rollup/formula circular reference detection.' },
      { problemId: 'lru-cache-pointers', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'Client block record cache eviction.' },
      { problemId: 'valid-parentheses-stack', frequency: '85%', roundType: 'Phone Screen', interviewerFocus: 'Markdown/formula expression parser stack.' }
    ]
  },
  {
    id: 'vercel',
    name: 'Vercel',
    tier: 'Enterprise & Cloud Systems',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Build pipeline task graphs (Turborepo DAGs), edge cache eviction (LRU), and fast streaming string parsers.',
    preferredLanguages: ['TypeScript', 'Rust', 'Go', 'Python', 'Java'],
    signaturePatterns: ['Trees & Graphs', 'Linked List & Pointers', 'Sliding Window', 'Monotonic Stack'],
    totalCuratedQuestions: 61,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '96%', roundType: 'Onsite Coding', interviewerFocus: 'Monorepo task build graph topological execution & cycle check.' },
      { problemId: 'lru-cache-pointers', frequency: '92%', roundType: 'Onsite Coding', interviewerFocus: 'Remote build artifact cache eviction.' },
      { problemId: 'longest-substring-unique', frequency: '86%', roundType: 'Phone Screen', interviewerFocus: 'Log stream token windowing.' },
      { problemId: 'valid-parentheses-stack', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Route config bracket validation.' }
    ]
  },
  {
    id: 'linear',
    name: 'Linear',
    tier: 'Enterprise & Cloud Systems',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Local-first sync engine primitives: delta linked lists, topological dependency graphs, binary search on sync cursors, and LRU caches.',
    preferredLanguages: ['TypeScript', 'Python', 'Java'],
    signaturePatterns: ['Linked List & Pointers', 'Trees & Graphs', 'Binary Search', 'Two Pointers'],
    totalCuratedQuestions: 57,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '93%', roundType: 'Onsite Coding', interviewerFocus: 'Issue blocking graph cycle detection.' },
      { problemId: 'lru-cache-pointers', frequency: '90%', roundType: 'Onsite Coding', interviewerFocus: 'IndexedDB / in-memory entity hydration LRU.' },
      { problemId: 'reverse-linked-list', frequency: '87%', roundType: 'Phone Screen', interviewerFocus: 'Sync delta log undo chain reversal.' },
      { problemId: 'search-rotated-sorted', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Fast cursor binary lookup.' }
    ]
  },
  {
    id: 'palantir-foundry',
    name: 'Rippling',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Employee graph & payroll rule dependency resolution: DAG topological sorts, LRU caches, two pointers, and DP.',
    preferredLanguages: ['Python', 'Java', 'Go', 'TypeScript'],
    signaturePatterns: ['Trees & Graphs', 'Dynamic Programming', 'Linked List & Pointers', 'Two Pointers'],
    totalCuratedQuestions: 67,
    featuredQuestions: [
      { problemId: 'course-schedule-cycle', frequency: '95%', roundType: 'Onsite Coding', interviewerFocus: 'Payroll formula dependency graph evaluation.' },
      { problemId: 'binary-tree-level-order', frequency: '91%', roundType: 'Phone Screen', interviewerFocus: 'Org chart reporting hierarchy BFS.' },
      { problemId: 'lru-cache-pointers', frequency: '88%', roundType: 'Onsite Coding', interviewerFocus: 'Permission policy cache eviction.' },
      { problemId: 'coin-change-dp', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Benefits deduction optimization DP.' }
    ]
  },
  {
    id: 'reddit',
    name: 'Reddit',
    tier: 'FinTech & Commerce',
    hq: 'San Francisco, CA',
    interviewBarSummary: 'Nested comment trees, hot-ranking priority queues, rate-limiting sliding windows, and cache eviction.',
    preferredLanguages: ['Python', 'Go', 'Java'],
    signaturePatterns: ['Trees & Graphs', 'Heap & Priority Queue', 'Sliding Window', 'Linked List & Pointers'],
    totalCuratedQuestions: 103,
    featuredQuestions: [
      { problemId: 'binary-tree-level-order', frequency: '94%', roundType: 'Phone Screen', interviewerFocus: 'Comment thread tree level-by-level pagination.' },
      { problemId: 'kth-largest-heap', frequency: '90%', roundType: 'Phone Screen', interviewerFocus: 'Subreddit top-K hot post min-heap.' },
      { problemId: 'lru-cache-pointers', frequency: '87%', roundType: 'Onsite Coding', interviewerFocus: 'Hot thread memory cache eviction.' },
      { problemId: 'longest-substring-unique', frequency: '84%', roundType: 'Phone Screen', interviewerFocus: 'Sliding window spam token filter.' }
    ]
  }
];
