import { AlgorithmProblem } from '../types/visualizer';
import { buildFullTopicCurriculum, CORE_TOPICS } from './topicCurriculum';

export { CORE_TOPICS };

const BASE_PROBLEMS: AlgorithmProblem[] = [
  {
    id: 'reverse-linked-list',
    number: 206,
    title: 'Reverse Singly Linked List (In-Place Pointer Rotation)',
    slug: 'reverse-linked-list',
    difficulty: 'Easy',
    pattern: 'Linked List & Pointers',
    summary: 'Reverse a singly linked list in-place in O(1) auxiliary heap space by rotating prev, curr, and nxt node pointers.',
    description:
      'Given the head pointer of a singly linked list allocated on the heap, reverse the direction of every next reference in-place and return the new head pointer. You must not allocate new list nodes; mutate the existing .next fields directly.',
    constraints: [
      'The number of nodes in the list is in the range [0, 5000].',
      '-5000 <= Node.val <= 5000',
      'Must execute in O(N) time and O(1) extra heap space (iterative three-pointer technique).'
    ],
    defaultInput: '10 -> 20 -> 30 -> 40',
    sampleInputs: [
      { label: 'Standard 4-Node List', value: '10 -> 20 -> 30 -> 40' },
      { label: 'Prime Sequence (5 Nodes)', value: '2 -> 3 -> 5 -> 7 -> 11' },
      { label: 'Two-Node Flip', value: '42 -> 99' }
    ],
    companies: [
      'amazon', 'apple', 'microsoft', 'nvidia', 'spacex', 'hrt', 'morgan-stanley',
      'block', 'spotify', 'adobe', 'cisco', 'ibm', 'intel', 'amd', 'qualcomm', 'linear'
    ],
    frequencyScore: 96,
    keyInsight:
      'Before overwriting curr.next to point backward to prev, you MUST cache the original curr.next reference in a temporary stack variable (nxt). Otherwise, the remainder of the heap chain becomes unreachable and eligible for garbage collection.',
    pointerMechanicsNote:
      'Three stack pointers (prev, curr, nxt) march in lockstep: (1) nxt = curr.next saves the forward link, (2) curr.next = prev flips the heap arrow 180 degrees, (3) prev = curr and curr = nxt advance the frontier.',
    python: {
      code: `def reverseList(head: ListNode) -> ListNode:
    prev = None
    curr = head
    while curr is not None:
        nxt = curr.next      # Cache forward heap reference
        curr.next = prev     # Rewire next pointer backward
        prev = curr          # Advance prev to current node
        curr = nxt           # Advance curr to saved next node
    return prev`,
      timeComplexity: 'O(N) — Visits each heap node exactly once',
      spaceComplexity: 'O(1) — Only 3 stack pointer registers (24 bytes)',
      memoryProfileNote: 'Zero heap allocations during execution; mutates 8-byte .next reference fields in-place.'
    },
    java: {
      code: `public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;
    while (curr != null) {
        ListNode nxt = curr.next; // Save forward node address
        curr.next = prev;         // Flip node reference backward
        prev = curr;              // Step prev reference forward
        curr = nxt;               // Step curr reference forward
    }
    return prev;
}`,
      timeComplexity: 'O(N) — Single linear pass over heap nodes',
      spaceComplexity: 'O(1) — Three stack-frame reference variables',
      memoryProfileNote: 'Avoids O(N) JVM call-stack frames that a recursive implementation would allocate.'
    }
  },
  {
    id: 'trapping-rain-water',
    number: 42,
    title: 'Trapping Rain Water (Converging Two-Pointer Boundary)',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    pattern: 'Two Pointers',
    summary: 'Compute total trapped rainwater across an elevation map in O(N) time and O(1) memory using converging left and right pointers.',
    description:
      'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining. Instead of allocating O(N) prefix and suffix maximum arrays on the heap, maintain two converging pointers and two scalar boundary registers (leftMax, rightMax).',
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
      'Target Space Complexity: O(1) auxiliary memory.'
    ],
    defaultInput: '0, 2, 0, 3, 1, 0, 1, 3, 2, 1',
    sampleInputs: [
      { label: 'Classic Valley Profile', value: '0, 2, 0, 3, 1, 0, 1, 3, 2, 1' },
      { label: 'Deep Central Basin', value: '4, 1, 0, 2, 1, 4' },
      { label: 'Stepped Canyon', value: '3, 0, 2, 0, 4' }
    ],
    companies: [
      'google', 'meta', 'amazon', 'netflix', 'nvidia', 'bytedance', 'tesla',
      'deepmind', 'waymo', 'databricks', 'citadel', 'hrt', 'goldman-sachs',
      'uber', 'airbnb', 'robinhood', 'lyft', 'snap', 'snowflake', 'adobe'
    ],
    frequencyScore: 99,
    keyInsight:
      'Water trapped at any index is bounded by min(maxLeft, maxRight). Whenever height[left] <= height[right], we are guaranteed that a wall at least as tall as height[left] exists on the right, so leftMax alone dictates the water level at left.',
    pointerMechanicsNote:
      'Pointers left (index 0) and right (index n-1) move inward one step per iteration. Whichever side has the smaller current height advances, updating its running maximum or accumulating water.',
    python: {
      code: `def trap(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    left_max, right_max = height[left], height[right]
    water = 0
    while left < right:
        if left_max <= right_max:
            left += 1
            left_max = max(left_max, height[left])
            water += left_max - height[left]
        else:
            right -= 1
            right_max = max(right_max, height[right])
            water += right_max - height[right]
    return water`,
      timeComplexity: 'O(N) — Single converging pass across N elements',
      spaceComplexity: 'O(1) — Five scalar integers in stack frame',
      memoryProfileNote: 'Eliminates 2 * N integer heap allocations compared to prefix/suffix DP.'
    },
    java: {
      code: `public class Solution {
    public int trap(int[] height) {
        int left = 0, right = height.length - 1;
        int leftMax = height[left], rightMax = height[right];
        int water = 0;
        while (left < right) {
            if (leftMax <= rightMax) {
                left++;
                leftMax = Math.max(leftMax, height[left]);
                water += leftMax - height[left];
            } else {
                right--;
                rightMax = Math.max(rightMax, height[right]);
                water += rightMax - height[right];
            }
        }
        return water;
    }
}`,
      timeComplexity: 'O(N) — Exactly N - 1 pointer increments/decrements',
      spaceComplexity: 'O(1) — Pure stack registers, zero heap allocation',
      memoryProfileNote: 'Sequential array access maximizes L1 CPU cache line hits.'
    }
  },
  {
    id: 'lru-cache-pointers',
    number: 146,
    title: 'LRU Cache (Doubly-Linked List + HashMap Pointers)',
    slug: 'lru-cache-pointers',
    difficulty: 'Medium',
    pattern: 'Linked List & Pointers',
    summary: 'Design an O(1) Least Recently Used (LRU) cache combining a HashMap of node references with a doubly-linked list for instant pointer splicing.',
    description:
      'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement get(key) and put(key, value) in strictly O(1) time. Achieve this by storing key -> DLinkedNode* pointers in a HashMap while maintaining recency order in a doubly-linked list with dummy HEAD and TAIL sentinels.',
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4, 0 <= value <= 10^5',
      'Both get() and put() must run in O(1) average time.'
    ],
    defaultInput: 'cap=2 | PUT(1,10), PUT(2,20), GET(1), PUT(3,30)',
    sampleInputs: [
      { label: 'Capacity 2 Eviction Trace', value: 'cap=2 | PUT(1,10), PUT(2,20), GET(1), PUT(3,30)' },
      { label: 'Cache Hit & Promotion', value: 'cap=2 | PUT(5,50), PUT(9,90), GET(5), PUT(7,70)' }
    ],
    companies: [
      'google', 'meta', 'amazon', 'apple', 'microsoft', 'netflix', 'bytedance',
      'oracle', 'openai', 'anthropic', 'scale-ai', 'perplexity', 'databricks',
      'citadel', 'jane-street', 'morgan-stanley', 'stripe', 'airbnb', 'robinhood',
      'block', 'instacart', 'lyft', 'spotify', 'snap', 'linkedin', 'snowflake',
      'palantir', 'salesforce', 'adobe', 'cisco', 'intel', 'amd', 'atlassian',
      'cloudflare', 'crowdstrike', 'mongodb', 'figma', 'notion', 'vercel', 'linear',
      'palantir-foundry', 'reddit'
    ],
    frequencyScore: 98,
    keyInsight:
      'A HashMap alone gives O(1) lookup but cannot track eviction order in O(1). A doubly-linked list alone cannot find arbitrary keys in O(1). Storing the heap address of each Doubly-Linked Node inside the HashMap bridges both structures.',
    pointerMechanicsNote:
      'Every promotion or eviction rewires 4 pointers: node.prev.next = node.next and node.next.prev = node.prev detaches the node in O(1), then _insertAfterHead splices it right after the sentinel HEAD.',
    python: {
      code: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}  # key -> Heap Address of Node
        self.head, self.tail = Node(-1, -1), Node(-1, -1)
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node: Node):
        prev_node, nxt_node = node.prev, node.next
        prev_node.next, nxt_node.prev = nxt_node, prev_node

    def _insert_front(self, node: Node):
        node.next, node.prev = self.head.next, self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        node = self.cache[key]
        self._remove(node)
        self._insert_front(node)
        return node.val`,
      timeComplexity: 'O(1) — Constant pointer dereferences for get & put',
      spaceComplexity: 'O(C) — At most C nodes + 2 sentinel nodes on heap',
      memoryProfileNote: 'Sentinel head/tail nodes eliminate null-check branches during pointer splicing.'
    },
    java: {
      code: `class LRUCache {
    class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }
    private final int cap;
    private final Map<Integer, Node> cache = new HashMap<>();
    private final Node head = new Node(-1, -1), tail = new Node(-1, -1);

    public LRUCache(int capacity) {
        this.cap = capacity;
        head.next = tail;
        tail.prev = head;
    }
    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    private void insertFront(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
    public int get(int key) {
        if (!cache.containsKey(key)) return -1;
        Node node = cache.get(key);
        remove(node);
        insertFront(node);
        return node.val;
    }
}`,
      timeComplexity: 'O(1) — Direct HashMap bucket lookup + 4 pointer writes',
      spaceComplexity: 'O(C) — Bounded by cache capacity C',
      memoryProfileNote: 'Evicted Node objects have all references severed so JVM GC can reclaim them immediately.'
    }
  },
  {
    id: 'binary-tree-level-order',
    number: 102,
    title: 'Binary Tree Level Order Traversal (BFS Frontier Queue)',
    slug: 'binary-tree-level-order',
    difficulty: 'Medium',
    pattern: 'Trees & Graphs',
    summary: 'Traverse a binary tree level by level from root to leaves using a FIFO queue and frontier snapshot sizing.',
    description:
      'Given the root pointer of a binary tree on the heap, return the level-order traversal of its nodes values (i.e., from left to right, level by level). Visualize how the FIFO queue holds heap pointers to tree nodes and expands each depth ring.',
    constraints: [
      'The number of nodes in the tree is in the range [0, 2000].',
      '-1000 <= Node.val <= 1000',
      'Must group output strictly by tree depth level.'
    ],
    defaultInput: '3, 9, 20, null, null, 15, 7',
    sampleInputs: [
      { label: 'Standard 3-Level Tree', value: '3, 9, 20, null, null, 15, 7' },
      { label: 'Complete Binary Tree', value: '1, 2, 3, 4, 5, 6, 7' }
    ],
    companies: [
      'google', 'meta', 'microsoft', 'oracle', 'deepmind', 'morgan-stanley',
      'doordash', 'lyft', 'snap', 'pinterest', 'linkedin', 'palantir',
      'salesforce', 'crowdstrike', 'mongodb', 'figma', 'notion', 'palantir-foundry', 'reddit'
    ],
    frequencyScore: 94,
    keyInsight:
      'Capturing level_size = len(queue) at the start of each while-loop iteration freezes the exact boundary of the current tree depth before child pointers of the next depth are enqueued.',
    pointerMechanicsNote:
      'The curr pointer dequeues a TreeNode address from the front of the Deque, appends curr.val to the current level list, and enqueues non-null curr.left and curr.right heap addresses.',
    python: {
      code: `def levelOrder(root: TreeNode) -> list[list[int]]:
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        level_size = len(queue)
        current_level = []
        for _ in range(level_size):
            curr = queue.popleft()
            current_level.append(curr.val)
            if curr.left:
                queue.append(curr.left)
            if curr.right:
                queue.append(curr.right)
        result.append(current_level)
    return result`,
      timeComplexity: 'O(N) — Each tree node is enqueued and dequeued once',
      spaceComplexity: 'O(W) — Maximum queue width W <= N/2 at leaf level',
      memoryProfileNote: 'collections.deque uses doubly-linked blocks for O(1) popleft without array shifting.'
    },
    java: {
      code: `public class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {
        List<List<Integer>> result = new ArrayList<>();
        if (root == null) return result;
        Queue<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int levelSize = queue.size();
            List<Integer> currentLevel = new ArrayList<>(levelSize);
            for (int i = 0; i < levelSize; i++) {
                TreeNode curr = queue.poll();
                currentLevel.add(curr.val);
                if (curr.left != null) queue.offer(curr.left);
                if (curr.right != null) queue.offer(curr.right);
            }
            result.add(currentLevel);
        }
        return result;
    }
}`,
      timeComplexity: 'O(N) — Visits every node and edge exactly once',
      spaceComplexity: 'O(N) — ArrayDeque ring buffer holds at most one level of references',
      memoryProfileNote: 'ArrayDeque is cache-friendlier than LinkedList for Queue operations in Java.'
    }
  },
  {
    id: 'course-schedule-cycle',
    number: 207,
    title: 'Course Schedule — Directed Graph Cycle Detection (Kahn BFS)',
    slug: 'course-schedule-cycle',
    difficulty: 'Medium',
    pattern: 'Trees & Graphs',
    summary: 'Detect dependency cycles in a directed graph using Kahn topological sort with an in-degree array and zero-indegree frontier queue.',
    description:
      'There are numCourses courses labeled from 0 to numCourses - 1. Some courses have prerequisites represented as directed edges u -> v. Determine if it is possible to finish all courses (i.e., whether the directed graph is a valid Directed Acyclic Graph with no circular dependencies).',
    constraints: [
      '1 <= numCourses <= 2000',
      '0 <= prerequisites.length <= 5000',
      'prerequisites[i].length == 2'
    ],
    defaultInput: 'V=4 | 0->1, 0->2, 1->3, 2->3',
    sampleInputs: [
      { label: 'Valid DAG Diamond (4 Courses)', value: 'V=4 | 0->1, 0->2, 1->3, 2->3' },
      { label: 'Deadlock Cycle (0->1->2->0)', value: 'V=3 | 0->1, 1->2, 2->0' }
    ],
    companies: [
      'google', 'microsoft', 'nvidia', 'tiktok', 'tesla', 'spacex', 'openai',
      'anthropic', 'deepmind', 'scale-ai', 'waymo', 'databricks', 'two-sigma',
      'stripe', 'uber', 'coinbase', 'doordash', 'snap', 'pinterest', 'snowflake',
      'palantir', 'amd', 'atlassian', 'datadog', 'crowdstrike', 'figma', 'notion',
      'vercel', 'linear', 'palantir-foundry'
    ],
    frequencyScore: 95,
    keyInsight:
      'Nodes in a cycle always have an in-degree >= 1 and can never enter the zero-indegree queue. If the count of dequeued vertices at termination is strictly less than V, a directed cycle exists in the remaining vertices.',
    pointerMechanicsNote:
      'We allocate an adjacency list on the heap and an indegree[V] integer table. As curr pops from the queue, we traverse each outgoing neighbor pointer nxt, decrementing indegree[nxt] and pushing nxt when it hits 0.',
    python: {
      code: `def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    adj = [[] for _ in range(numCourses)]
    indegree = [0] * numCourses
    for dest, src in prerequisites:
        adj[src].append(dest)
        indegree[dest] += 1

    queue = deque([i for i in range(numCourses) if indegree[i] == 0])
    visited = 0
    while queue:
        curr = queue.popleft()
        visited += 1
        for nxt in adj[curr]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return visited == numCourses`,
      timeComplexity: 'O(V + E) — Processes each vertex and directed edge once',
      spaceComplexity: 'O(V + E) — Adjacency list + indegree array on heap',
      memoryProfileNote: 'Iterative Kahn BFS avoids Python recursion limit (1000 frames) on deep dependency chains.'
    },
    java: {
      code: `public class Solution {
    public boolean canFinish(int numCourses, int[][] prerequisites) {
        List<List<Integer>> adj = new ArrayList<>();
        int[] indegree = new int[numCourses];
        for (int i = 0; i < numCourses; i++) adj.add(new ArrayList<>());
        for (int[] edge : prerequisites) {
            adj.get(edge[1]).add(edge[0]);
            indegree[edge[0]]++;
        }
        Queue<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < numCourses; i++) {
            if (indegree[i] == 0) queue.offer(i);
        }
        int visited = 0;
        while (!queue.isEmpty()) {
            int curr = queue.poll();
            visited++;
            for (int nxt : adj.get(curr)) {
                if (--indegree[nxt] == 0) queue.offer(nxt);
            }
        }
        return visited == numCourses;
    }
}`,
      timeComplexity: 'O(V + E) — Optimal linear graph scan',
      spaceComplexity: 'O(V + E) — Adjacency lists and indegree[] array',
      memoryProfileNote: 'Primitive int[] indegree array stays contiguous in heap memory.'
    }
  },
  {
    id: 'cycle-detection-floyd',
    number: 141,
    title: 'Linked List Cycle Detection (Floyd Tortoise & Hare)',
    slug: 'cycle-detection-floyd',
    difficulty: 'Easy',
    pattern: 'Linked List & Pointers',
    summary: 'Detect whether a linked list contains a cycle in O(1) memory using slow (1x) and fast (2x) pointers.',
    description:
      'Given head, the head of a linked list, determine if the linked list has a cycle in it. A cycle exists if some node in the list can be reached again by continuously following the next pointer. Solve it using O(1) memory without allocating a HashSet.',
    constraints: [
      'The number of the nodes in the list is in the range [0, 10^4].',
      '-10^5 <= Node.val <= 10^5',
      'Target Space Complexity: O(1) extra memory.'
    ],
    defaultInput: '3 -> 2 -> 0 -> -4 (tail loops to index 1)',
    sampleInputs: [
      { label: 'Cyclic List (Tail -> Index 1)', value: '3 -> 2 -> 0 -> -4 (cycle=1)' },
      { label: 'Acyclic Linear List', value: '1 -> 2 -> 3 -> 4 (cycle=-1)' }
    ],
    companies: [
      'apple', 'oracle', 'tesla', 'spacex', 'hrt', 'goldman-sachs', 'jpmorgan',
      'linkedin', 'cisco', 'intel', 'amd', 'qualcomm', 'cloudflare'
    ],
    frequencyScore: 91,
    keyInsight:
      'Once both pointers enter the cycle, the fast pointer closes the distance to the slow pointer by exactly 1 node per step, guaranteeing an address collision (slow == fast) in at most C steps.',
    pointerMechanicsNote:
      'Both slow and fast start at head. In each step, slow = slow.next (+1 hop) while fast = fast.next.next (+2 hops). If fast reaches NULL, the list terminates; if slow == fast, their memory addresses match inside the loop.',
    python: {
      code: `def hasCycle(head: ListNode) -> bool:
    slow = head
    fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next          # Step +1 node
        fast = fast.next.next     # Step +2 nodes
        if slow is fast:          # Heap address collision
            return True
    return False`,
      timeComplexity: 'O(N) — At most N + C pointer hops',
      spaceComplexity: 'O(1) — Two pointer registers on stack (16 bytes)',
      memoryProfileNote: 'Uses Python identity operator (is) to compare raw object memory addresses in O(1).'
    },
    java: {
      code: `public class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head;
        ListNode fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;         // Advance tortoise 1 hop
            fast = fast.next.next;    // Advance hare 2 hops
            if (slow == fast) {       // Reference equality check
                return true;
            }
        }
        return false;
    }
}`,
      timeComplexity: 'O(N) — Linear in node count',
      spaceComplexity: 'O(1) — Zero heap overhead vs O(N) HashSet<ListNode>',
      memoryProfileNote: 'Reference equality (==) directly compares 64-bit compressed OOP heap addresses.'
    }
  },
  {
    id: 'longest-substring-unique',
    number: 3,
    title: 'Longest Substring Without Repeating Characters (Sliding Window)',
    slug: 'longest-substring-unique',
    difficulty: 'Medium',
    pattern: 'Sliding Window',
    summary: 'Maintain an elastic [left..right] sliding window and character index map to find the longest unique span in O(N) time.',
    description:
      'Given a string s, find the length of the longest substring without duplicate characters. Instead of shrinking the left pointer one character at a time, jump left directly past the last seen index of any duplicate character.',
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    defaultInput: 'abcabcbb',
    sampleInputs: [
      { label: 'Classic Repeat (abcabcbb)', value: 'abcabcbb' },
      { label: 'Inner Jump (pwwkew)', value: 'pwwkew' },
      { label: 'Palindrome Repeat (abba)', value: 'abba' }
    ],
    companies: [
      'google', 'netflix', 'tiktok', 'openai', 'perplexity', 'two-sigma',
      'goldman-sachs', 'stripe', 'spotify', 'qualcomm', 'atlassian', 'datadog',
      'cloudflare', 'crowdstrike', 'vercel', 'reddit'
    ],
    frequencyScore: 95,
    keyInsight:
      'When s[right] is already in seen_at and its recorded index is >= left, the current window [left..right] violates uniqueness. Jumping left = seen_at[ch] + 1 restores the invariant in O(1).',
    pointerMechanicsNote:
      'Pointer right scans 0..N-1 every step; pointer left monotonically jumps forward whenever a duplicate character inside the active window is encountered.',
    python: {
      code: `def lengthOfLongestSubstring(s: str) -> int:
    seen_at = {}
    left = 0
    max_len = 0
    for right, ch in enumerate(s):
        if ch in seen_at and seen_at[ch] >= left:
            left = seen_at[ch] + 1
        seen_at[ch] = right
        max_len = max(max_len, right - left + 1)
    return max_len`,
      timeComplexity: 'O(N) — Single pass of right pointer from 0 to N-1',
      spaceComplexity: 'O(min(N, Σ)) — HashMap bounded by alphabet size Σ',
      memoryProfileNote: 'Dictionary stores at most 128 ASCII character keys.'
    },
    java: {
      code: `public class Solution {
    public int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> seenAt = new HashMap<>();
        int left = 0, maxLen = 0;
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            if (seenAt.containsKey(ch) && seenAt.get(ch) >= left) {
                left = seenAt.get(ch) + 1;
            }
            seenAt.put(ch, right);
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}`,
      timeComplexity: 'O(N) — Strict single-pass sliding window',
      spaceComplexity: 'O(min(N, 128)) — Bounded character map',
      memoryProfileNote: 'Can also be backed by int[128] on the stack/heap to avoid Character boxing.'
    }
  },
  {
    id: 'search-rotated-sorted',
    number: 33,
    title: 'Search in Rotated Sorted Array (Modified Binary Search)',
    slug: 'search-rotated-sorted',
    difficulty: 'Medium',
    pattern: 'Binary Search',
    summary: 'Locate a target in a rotated sorted array in O(log N) time by identifying which half around mid preserves sorted order.',
    description:
      'Prior to being passed to your function, an ascending sorted array nums of distinct values was rotated at an unknown pivot index k. Given the array after rotation and an integer target, return the index of target in O(log n) runtime complexity.',
    constraints: [
      '1 <= nums.length <= 5000',
      '-10^4 <= nums[i] <= 10^4',
      'All values of nums are unique.',
      'Must run in O(log N) time.'
    ],
    defaultInput: 'nums=[4, 5, 6, 7, 0, 1, 2] | target=0',
    sampleInputs: [
      { label: 'Target in Right Partition (0)', value: 'nums=[4, 5, 6, 7, 0, 1, 2] | target=0' },
      { label: 'Target in Left Partition (5)', value: 'nums=[4, 5, 6, 7, 0, 1, 2] | target=5' },
      { label: 'Missing Target (-1)', value: 'nums=[4, 5, 6, 7, 0, 1, 2] | target=3' }
    ],
    companies: [
      'meta', 'apple', 'nvidia', 'oracle', 'spacex', 'waymo', 'perplexity',
      'hrt', 'doordash', 'instacart', 'snowflake', 'intel', 'qualcomm',
      'cloudflare', 'mongodb', 'linear'
    ],
    frequencyScore: 92,
    keyInsight:
      'Splitting a rotated sorted array at mid ALWAYS yields at least one strictly sorted subarray: either [low..mid] is sorted (nums[low] <= nums[mid]) or [mid..high] is sorted. Check if target lies inside the sorted half to halve the search space.',
    pointerMechanicsNote:
      'Three index pointers (low, mid, high) bisect the array. Each comparison discards half of the remaining address range by setting low = mid + 1 or high = mid - 1.',
    python: {
      code: `def search(nums: list[int], target: int) -> int:
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        if nums[low] <= nums[mid]:  # Left half [low..mid] is sorted
            if nums[low] <= target < nums[mid]:
                high = mid - 1
            else:
                low = mid + 1
        else:                       # Right half [mid..high] is sorted
            if nums[mid] < target <= nums[high]:
                low = mid + 1
            else:
                high = mid - 1
    return -1`,
      timeComplexity: 'O(log N) — Halves active index window every step',
      spaceComplexity: 'O(1) — Three integer index pointers on stack',
      memoryProfileNote: 'Iterative binary search uses zero extra stack frames.'
    },
    java: {
      code: `public class Solution {
    public int search(int[] nums, int target) {
        int low = 0, high = nums.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) return mid;
            if (nums[low] <= nums[mid]) {
                if (nums[low] <= target && target < nums[mid]) {
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            } else {
                if (nums[mid] < target && target <= nums[high]) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
        }
        return -1;
    }
}`,
      timeComplexity: 'O(log N) — At most 13 comparisons for N = 5000',
      spaceComplexity: 'O(1) — Constant register usage',
      memoryProfileNote: 'Uses low + (high - low) / 2 to prevent 32-bit signed integer overflow.'
    }
  },
  {
    id: 'daily-temperatures-stack',
    number: 739,
    title: 'Daily Temperatures (Monotonic Decreasing Index Stack)',
    slug: 'daily-temperatures-stack',
    difficulty: 'Medium',
    pattern: 'Monotonic Stack',
    summary: 'Resolve the next warmer day for every temperature in O(N) time by maintaining a monotonic decreasing stack of unresolved array indices.',
    description:
      'Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0.',
    constraints: [
      '1 <= temperatures.length <= 10^5',
      '30 <= temperatures[i] <= 100'
    ],
    defaultInput: '73, 74, 75, 71, 69, 72, 76, 73',
    sampleInputs: [
      { label: 'Standard Forecast (8 Days)', value: '73, 74, 75, 71, 69, 72, 76, 73' },
      { label: 'Rising Front (4 Days)', value: '60, 65, 70, 80' }
    ],
    companies: [
      'amazon', 'bytedance', 'waymo', 'citadel', 'jane-street', 'uber',
      'robinhood', 'palantir', 'datadog'
    ],
    frequencyScore: 90,
    keyInsight:
      'Store array INDICES on the stack rather than temperatures. Whenever temperatures[curr] > temperatures[stack[-1]], the current day is the first warmer day for the index at the top of the stack; pop prev_idx and write curr - prev_idx.',
    pointerMechanicsNote:
      'Each index i is pushed onto the heap stack exactly once and popped at most once, yielding an amortized O(1) cost per element.',
    python: {
      code: `def dailyTemperatures(temperatures: list[int]) -> list[int]:
    n = len(temperatures)
    ans = [0] * n
    stack = []  # Monotonic decreasing stack of indices
    for curr, temp in enumerate(temperatures):
        while stack and temp > temperatures[stack[-1]]:
            prev_idx = stack.pop()
            ans[prev_idx] = curr - prev_idx
        stack.append(curr)
    return ans`,
      timeComplexity: 'O(N) — Each index pushed once and popped at most once',
      spaceComplexity: 'O(N) — Monotonic stack holds at most N indices',
      memoryProfileNote: 'Storing integer indices avoids duplicating temperature tuples in memory.'
    },
    java: {
      code: `public class Solution {
    public int[] dailyTemperatures(int[] temperatures) {
        int n = temperatures.length;
        int[] ans = new int[n];
        Deque<Integer> stack = new ArrayDeque<>();
        for (int curr = 0; curr < n; curr++) {
            while (!stack.isEmpty() && temperatures[curr] > temperatures[stack.peek()]) {
                int prevIdx = stack.pop();
                ans[prevIdx] = curr - prevIdx;
            }
            stack.push(curr);
        }
        return ans;
    }
}`,
      timeComplexity: 'O(N) — Strictly linear amortized push/pop count',
      spaceComplexity: 'O(N) — Output array + index stack',
      memoryProfileNote: 'ArrayDeque outperforms legacy java.util.Stack (which synchronizes every call).'
    }
  },
  {
    id: 'three-sum-zero',
    number: 15,
    title: '3Sum — Zero-Sum Triplets (Anchor + Converging Pointers)',
    slug: 'three-sum-zero',
    difficulty: 'Medium',
    pattern: 'Two Pointers',
    summary: 'Find all unique triplets [nums[i], nums[left], nums[right]] that sum to zero in O(N^2) time by sorting and sweeping two pointers.',
    description:
      'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. Notice that the solution set must not contain duplicate triplets.',
    constraints: [
      '3 <= nums.length <= 3000',
      '-10^5 <= nums[i] <= 10^5'
    ],
    defaultInput: '-4, -1, -1, 0, 1, 2',
    sampleInputs: [
      { label: 'Canonical Duplicate Test', value: '-4, -1, -1, 0, 1, 2' },
      { label: 'Symmetric Zeroes', value: '-2, 0, 1, 1, 2' }
    ],
    companies: [
      'meta', 'microsoft', 'tiktok', 'citadel', 'airbnb', 'instacart',
      'pinterest', 'mongodb'
    ],
    frequencyScore: 94,
    keyInsight:
      'Sorting the array in-place enables two critical optimizations: (1) for each anchor index i, we solve 2Sum on [i+1..n-1] with converging pointers in O(N), and (2) duplicate values are adjacent and skipped via simple pointer increments.',
    pointerMechanicsNote:
      'Anchor i locks the first element; left = i + 1 and right = n - 1 converge based on whether total < 0 (left++) or total > 0 (right--).',
    python: {
      code: `def threeSum(nums: list[int]) -> list[list[int]]:
    nums.sort()
    res = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        left, right = i + 1, len(nums) - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                res.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
    return res`,
      timeComplexity: 'O(N^2) — O(N log N) sort + N linear two-pointer sweeps',
      spaceComplexity: 'O(1) — In-place sort and three index pointers (excluding output)',
      memoryProfileNote: 'Avoids O(N) HashSet overhead and tuple hashing collisions.'
    },
    java: {
      code: `public class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        for (int i = 0; i < nums.length - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int left = i + 1, right = nums.length - 1;
            while (left < right) {
                int total = nums[i] + nums[left] + nums[right];
                if (total < 0) left++;
                else if (total > 0) right--;
                else {
                    res.add(Arrays.asList(nums[i], nums[left], nums[right]));
                    left++;
                    right--;
                    while (left < right && nums[left] == nums[left - 1]) left++;
                }
            }
        }
        return res;
    }
}`,
      timeComplexity: 'O(N^2) — Optimal quadratic bound for 3Sum',
      spaceComplexity: 'O(log N) — Dual-Pivot Quicksort stack space in Java',
      memoryProfileNote: 'Arrays.sort(int[]) sorts primitive ints in-place with zero heap object allocation.'
    }
  },
  {
    id: 'coin-change-dp',
    number: 322,
    title: 'Coin Change (1D Bottom-Up Dynamic Programming Table)',
    slug: 'coin-change-dp',
    difficulty: 'Medium',
    pattern: 'Dynamic Programming',
    summary: 'Compute the minimum number of coins required to make up a target amount using a 1D bottom-up DP state array on the heap.',
    description:
      'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount cannot be made up by any combination of the coins, return -1.',
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4'
    ],
    defaultInput: 'coins=[1, 3, 4] | amount=6',
    sampleInputs: [
      { label: 'Greedy Trap (coins=[1,3,4], amt=6)', value: 'coins=[1, 3, 4] | amount=6' },
      { label: 'US Coins (coins=[1,2,5], amt=7)', value: 'coins=[1, 2, 5] | amount=7' }
    ],
    companies: [
      'google', 'bytedance', 'anthropic', 'deepmind', 'citadel', 'jane-street',
      'two-sigma', 'goldman-sachs', 'jpmorgan', 'airbnb', 'block', 'salesforce',
      'ibm', 'palantir-foundry'
    ],
    frequencyScore: 93,
    keyInsight:
      'A greedy choice fails for coins=[1,3,4] and amount=6 (greedy picks 4+1+1 = 3 coins, whereas 3+3 = 2 coins). Tabulating dp[a] = min(dp[a], dp[a - coin] + 1) across all sub-amounts 1..amount guarantees global optimality.',
    pointerMechanicsNote:
      'Pointer a iterates from 1 to amount while a lookback pointer (a - coin) reads previously solved subproblem cells in the contiguous dp[] heap array.',
    python: {
      code: `def coinChange(coins: list[int], amount: int) -> int:
    INF = amount + 1
    dp = [INF] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for coin in coins:
            if a - coin >= 0:
                dp[a] = min(dp[a], dp[a - coin] + 1)
    return dp[amount] if dp[amount] != INF else -1`,
      timeComplexity: 'O(A * C) — A = amount, C = number of coin denominations',
      spaceComplexity: 'O(A) — Single 1D array of length amount + 1',
      memoryProfileNote: '1D bottom-up table compresses O(C * A) 2D matrix into a single contiguous array.'
    },
    java: {
      code: `public class Solution {
    public int coinChange(int[] coins, int amount) {
        int inf = amount + 1;
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, inf);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int coin : coins) {
                if (a - coin >= 0) {
                    dp[a] = Math.min(dp[a], dp[a - coin] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
}`,
      timeComplexity: 'O(A * C) — Predictable tight nested loop',
      spaceComplexity: 'O(A) — 4 * (amount + 1) bytes on the heap',
      memoryProfileNote: 'Using amount + 1 as sentinel infinity prevents Integer.MAX_VALUE + 1 overflow.'
    }
  },
  {
    id: 'kth-largest-heap',
    number: 215,
    title: 'Kth Largest Element in an Array (Bounded Min-Heap)',
    slug: 'kth-largest-heap',
    difficulty: 'Medium',
    pattern: 'Heap & Priority Queue',
    summary: 'Maintain a bounded Min-Heap of size K so the root always holds the Kth largest element seen so far in O(N log K) time and O(K) space.',
    description:
      'Given an integer array nums and an integer k, return the kth largest element in the array. Note that it is the kth largest element in the sorted order, not the kth distinct element. Solve it without sorting the entire array.',
    constraints: [
      '1 <= k <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4'
    ],
    defaultInput: 'nums=[3, 2, 1, 5, 6, 4] | k=2',
    sampleInputs: [
      { label: 'K=2 on 6 Elements', value: 'nums=[3, 2, 1, 5, 6, 4] | k=2' },
      { label: 'K=3 on Stream', value: 'nums=[7, 10, 4, 3, 20, 15] | k=3' }
    ],
    companies: [
      'amazon', 'netflix', 'tiktok', 'openai', 'scale-ai', 'perplexity',
      'databricks', 'uber', 'coinbase', 'doordash', 'lyft', 'spotify',
      'pinterest', 'atlassian', 'datadog', 'reddit'
    ],
    frequencyScore: 91,
    keyInsight:
      'A Min-Heap of size K acts as a "VIP club of the K largest numbers" where the smallest member sits at root index 0 (the gatekeeper). Any incoming number larger than heap[0] evicts the root and sifts down in O(log K).',
    pointerMechanicsNote:
      'Binary heap is stored as a contiguous array where parent i has children at 2i+1 and 2i+2. Evicting heap[0] swaps the last leaf to index 0 and restores the heap invariant.',
    python: {
      code: `def findKthLargest(nums: list[int], k: int) -> int:
    min_heap = []
    for num in nums:
        heapq.heappush(min_heap, num)
        if len(min_heap) > k:
            heapq.heappop(min_heap)  # Evict smallest of K+1 elements
    return min_heap[0]`,
      timeComplexity: 'O(N log K) — N heap insertions/evictions on size-K heap',
      spaceComplexity: 'O(K) — Heap array holds at most K + 1 elements',
      memoryProfileNote: 'When K << N (e.g., Top 10 out of 10M), O(K) heap uses negligible memory vs O(N) sort.'
    },
    java: {
      code: `public class Solution {
    public int findKthLargest(int[] nums, int k) {
        PriorityQueue<Integer> minHeap = new PriorityQueue<>(k + 1);
        for (int num : nums) {
            minHeap.offer(num);
            if (minHeap.size() > k) {
                minHeap.poll(); // Evict minimum element at root
            }
        }
        return minHeap.peek();
    }
}`,
      timeComplexity: 'O(N log K) — Bounded siftUp and siftDown operations',
      spaceComplexity: 'O(K) — PriorityQueue internal Object[] array of size K+1',
      memoryProfileNote: 'Root element minHeap.peek() at index 0 is always the Kth largest value.'
    }
  },
  {
    id: 'valid-parentheses-stack',
    number: 20,
    title: 'Valid Parentheses & Delimiter Matching (LIFO Stack)',
    slug: 'valid-parentheses-stack',
    difficulty: 'Easy',
    pattern: 'Monotonic Stack',
    summary: 'Validate nested bracket delimiters in O(N) time by pushing expected closing delimiters onto a LIFO stack.',
    description:
      'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. Open brackets must be closed by the same type of brackets in the exact reverse (Last-In-First-Out) order.',
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only "()[]{}"'
    ],
    defaultInput: '{[()]}',
    sampleInputs: [
      { label: 'Valid Nested ({[()]})', value: '{[()]}' },
      { label: 'Mismatched Cross ([{]} )', value: '[{]}' }
    ],
    companies: [
      'meta', 'tesla', 'anthropic', 'jane-street', 'jpmorgan', 'stripe',
      'coinbase', 'linkedin', 'salesforce', 'cisco', 'ibm', 'figma', 'notion', 'vercel'
    ],
    frequencyScore: 89,
    keyInsight:
      'Every opening bracket creates a deferred obligation that must be fulfilled before any earlier obligation. A LIFO stack mirrors this lexical nesting depth.',
    pointerMechanicsNote:
      'Pointer idx scans the string left-to-right while top points to the top of the stack array on the heap.',
    python: {
      code: `def isValid(s: str) -> bool:
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
        else:
            stack.append(ch)
    return len(stack) == 0`,
      timeComplexity: 'O(N) — Single pass over N characters',
      spaceComplexity: 'O(N) — Stack depth at most N',
      memoryProfileNote: 'Early return on mismatch avoids scanning the rest of an invalid string.'
    },
    java: {
      code: `public class Solution {
    public boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : s.toCharArray()) {
            if (ch == '(') stack.push(')');
            else if (ch == '[') stack.push(']');
            else if (ch == '{') stack.push('}');
            else if (stack.isEmpty() || stack.pop() != ch) {
                return false;
            }
        }
        return stack.isEmpty();
    }
}`,
      timeComplexity: 'O(N) — Constant time push/pop per character',
      spaceComplexity: 'O(N) — ArrayDeque backing array',
      memoryProfileNote: 'Pushing the expected closing bracket eliminates a HashMap lookup in Java.'
    }
  },
  {
    id: 'two-sum-hash',
    number: 1,
    title: 'Two Sum (One-Pass Hash Table & Pointer Index Lookup)',
    slug: 'two-sum-hash',
    difficulty: 'Easy',
    pattern: 'Two Pointers',
    summary: 'Locate two array indices whose elements sum to target in a single O(N) pass by caching seen values and their heap indices in a HashMap.',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      'Only one valid answer exists.'
    ],
    defaultInput: 'nums=[2, 11, 15, 7] | target=9',
    sampleInputs: [
      { label: '4-Element Scan ([2,11,15,7], t=9)', value: 'nums=[2, 11, 15, 7] | target=9' },
      { label: 'Tail Pair ([3,2,4,8], t=12)', value: 'nums=[3, 2, 4, 8] | target=12' }
    ],
    companies: [
      'amazon', 'scale-ai', 'morgan-stanley', 'jpmorgan', 'coinbase',
      'robinhood', 'block', 'instacart', 'ibm'
    ],
    frequencyScore: 98,
    keyInsight:
      'For each element nums[i], its required partner is complement = target - nums[i]. Checking a hash table for complement turns an O(N) inner scan into an O(1) bucket lookup.',
    pointerMechanicsNote:
      'Pointer i scans the contiguous array while seen{} maps value -> index on the heap.',
    python: {
      code: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}  # val -> index in nums
    for i, num in enumerate(nums):
        comp = target - num
        if comp in seen:
            return [seen[comp], i]
        seen[num] = i
    return []`,
      timeComplexity: 'O(N) — Single pass with O(1) average hash lookup',
      spaceComplexity: 'O(N) — Hash table stores at most N key-value entries',
      memoryProfileNote: 'Trades O(N) heap dictionary memory to reduce runtime from O(N^2) to O(N).'
    },
    java: {
      code: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (seen.containsKey(comp)) {
                return new int[]{seen.get(comp), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
      timeComplexity: 'O(N) — Amortized O(1) HashMap bucket access',
      spaceComplexity: 'O(N) — HashMap Node<Integer,Integer> entries on heap',
      memoryProfileNote: 'Pre-sizing HashMap(nums.length) avoids internal table resize rehashing.'
    }
  },
  {
    id: 'container-most-water',
    number: 11,
    title: 'Container With Most Water (Greedy Two-Pointer Contraction)',
    slug: 'container-most-water',
    difficulty: 'Medium',
    pattern: 'Two Pointers',
    summary: 'Maximize rectangular area between two vertical lines in O(N) time and O(1) space by always advancing the shorter boundary pointer.',
    description:
      'You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.',
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4'
    ],
    defaultInput: '1, 8, 6, 2, 5, 4, 8, 3, 7',
    sampleInputs: [
      { label: 'Standard 9-Bar Profile', value: '1, 8, 6, 2, 5, 4, 8, 3, 7' },
      { label: 'Symmetric Pillars', value: '4, 3, 2, 1, 4' }
    ],
    companies: ['apple', 'two-sigma', 'adobe', 'google', 'meta', 'amazon'],
    frequencyScore: 93,
    keyInsight:
      'Area is width * min(height[left], height[right]). Moving the taller pointer inward reduces width while the height remains capped by the shorter pointer, so it can NEVER increase area. Only moving the shorter pointer has a chance to find a taller wall.',
    pointerMechanicsNote:
      'Pointers left and right start at opposite ends of the array and converge in O(N) steps with zero heap allocation.',
    python: {
      code: `def maxArea(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        w = right - left
        h = min(height[left], height[right])
        best = max(best, w * h)
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best`,
      timeComplexity: 'O(N) — Exactly N - 1 pointer comparisons',
      spaceComplexity: 'O(1) — Pure register execution',
      memoryProfileNote: 'Zero auxiliary heap allocation; ideal for memory-constrained runtimes.'
    },
    java: {
      code: `public class Solution {
    public int maxArea(int[] height) {
        int left = 0, right = height.length - 1;
        int best = 0;
        while (left < right) {
            int w = right - left;
            int h = Math.min(height[left], height[right]);
            best = Math.max(best, w * h);
            if (height[left] < height[right]) {
                left++;
            } else {
                right--;
            }
        }
        return best;
    }
}`,
      timeComplexity: 'O(N) — Linear single pass',
      spaceComplexity: 'O(1) — Four 32-bit int variables on the JVM stack',
      memoryProfileNote: 'No garbage collector pressure.'
    }
  }
];

export const PROBLEMS: AlgorithmProblem[] = buildFullTopicCurriculum(BASE_PROBLEMS);


