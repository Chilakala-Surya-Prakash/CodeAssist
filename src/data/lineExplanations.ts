export type LineRole = 'setup' | 'loop' | 'condition' | 'mutate' | 'return' | 'helper';

export interface LineExplanationEntry {
  /** Short, jargon-free explanation of WHAT this line does. */
  summary: string;
  /** Plain-English explanation of WHY this line is necessary for the algorithm. */
  why: string;
  /** Optional common interview bug or edge-case pitfall on this line. */
  watchOut?: string;
  /** High-level structural role for quick visual scanning. */
  role: LineRole;
}

export type ProblemLineGuide = Record<number, LineExplanationEntry>;

/**
 * Hand-crafted, plain-English line-by-line guides for all 18 native trace families.
 * Indexed by 1-based Python line number and semantically mapped across Java, C++, Go,
 * TypeScript, and Rust — and inherited by pattern-template variants via traceFamilyId.
 */
export const PREWRITTEN_LINE_GUIDES: Record<string, ProblemLineGuide> = {
  'reverse-linked-list': {
    1: {
      role: 'setup',
      summary: 'Start the function with `head`, pointing to the first node in the list.',
      why: 'We only receive the starting node; every other node is reached by following `.next` links.',
    },
    2: {
      role: 'setup',
      summary: 'Create `prev` and set it to `None` (no previous node yet).',
      why: 'The original first node will become the new tail, so its `.next` needs to point to `None`.',
    },
    3: {
      role: 'setup',
      summary: 'Start `curr` at `head` so we can walk through the list one node at a time.',
      why: 'We keep `curr` as our moving cursor while `prev` trails one step behind it.',
    },
    4: {
      role: 'loop',
      summary: 'Keep looping as long as `curr` still points to a real node.',
      why: 'When `curr` becomes `None`, we have walked past the last node and reversed every link.',
    },
    5: {
      role: 'mutate',
      summary: 'Save the next node (`curr.next`) into a temporary variable called `nxt`.',
      why: 'The very next line overwrites `curr.next`, so we must remember where the rest of the list lives first.',
      watchOut: 'Skipping this step breaks the chain and loses the rest of the list forever.',
    },
    6: {
      role: 'mutate',
      summary: 'Flip the current node’s `.next` arrow so it points backward to `prev`.',
      why: 'This is the actual reversal step — done in-place with zero extra node allocations.',
    },
    7: {
      role: 'mutate',
      summary: 'Move `prev` forward to `curr`.',
      why: 'Now that `curr` is reversed, it becomes the "previous" node for the next iteration.',
    },
    8: {
      role: 'mutate',
      summary: 'Move `curr` forward to the saved `nxt` node.',
      why: 'We use `nxt` (not `curr.next`, which now points backward!) to continue down the original list.',
      watchOut: 'Writing `curr = curr.next` here would jump backward instead of forward.',
    },
    9: {
      role: 'return',
      summary: 'Return `prev`, which now sits on the new front of the reversed list.',
      why: 'At loop exit `curr` is `None`, so `prev` is guaranteed to hold the last non-null node we visited.',
    },
  },

  'two-sum-hash': {
    1: {
      role: 'setup',
      summary: 'Take the list of numbers `nums` and the `target` sum we want to reach.',
      why: 'Our goal is to return the two positions (indices) whose values add up to `target`.',
    },
    2: {
      role: 'setup',
      summary: 'Create an empty hash map `seen` that remembers `{number: index}` for numbers we already visited.',
      why: 'Hash map lookups take O(1) average time, letting us avoid a slow O(N²) nested loop.',
    },
    3: {
      role: 'loop',
      summary: 'Scan through `nums` once, getting both the current index `i` and value `num`.',
      why: 'A single left-to-right pass is enough because every valid pair has an earlier partner and a later partner.',
    },
    4: {
      role: 'setup',
      summary: 'Calculate `comp = target - num`, the exact partner number needed to hit `target`.',
      why: 'Instead of checking every pair, we only need to ask: "Have I already seen `comp`?"',
    },
    5: {
      role: 'condition',
      summary: 'Check if that needed partner `comp` is already stored in `seen`.',
      why: 'If it is, we found both halves of the answer without looking any further.',
      watchOut: 'Check BEFORE inserting `num` into `seen` so a number cannot pair with itself (e.g., 3 + 3 = 6).',
    },
    6: {
      role: 'return',
      summary: 'Immediately return `[seen[comp], i]` — the earlier partner’s index and the current index.',
      why: 'The problem asks for indices (positions), not the raw values themselves.',
    },
    7: {
      role: 'mutate',
      summary: 'Record the current number and its index in `seen` for future elements to find.',
      why: 'If a later number needs `num` as its complement, it will find index `i` in O(1) time.',
    },
    8: {
      role: 'return',
      summary: 'Return an empty list `[]` if no two numbers add up to `target`.',
      why: 'Provides a clean fallback when the input has no valid pair.',
    },
  },

  'trapping-rain-water': {
    1: {
      role: 'setup',
      summary: 'Take the array `height` of bar elevations and prepare to compute total trapped rainwater.',
      why: 'Each bar can trap water up to the height of the shorter of the tallest walls on its left and right.',
    },
    2: {
      role: 'setup',
      summary: 'Place two pointers at the opposite ends of the array: `left = 0` and `right = n - 1`.',
      why: 'Walking inward from both ends eliminates the need for O(N) prefix and suffix max arrays.',
    },
    3: {
      role: 'setup',
      summary: 'Initialize `left_max` and `right_max` to the heights of the two outer boundary bars.',
      why: 'These track the tallest wall seen so far from each side as the pointers converge.',
    },
    4: {
      role: 'setup',
      summary: 'Start the `water` accumulator at `0`.',
      why: 'We add trapped water column by column as each pointer steps inward.',
    },
    5: {
      role: 'loop',
      summary: 'Keep moving the pointers inward until `left` and `right` meet.',
      why: 'Once both pointers meet at the global highest peak, every column has been accounted for.',
    },
    6: {
      role: 'condition',
      summary: 'Check whether the left wall (`left_max`) is shorter than or equal to the right wall (`right_max`).',
      why: 'Water level is limited by the SHORTER wall, so whichever side has the smaller max is safe to finalize right now.',
      watchOut: 'Always advance the side with the smaller max — advancing the taller side could overestimate water if a deeper drop sits on the other side.',
    },
    7: {
      role: 'mutate',
      summary: 'Step the `left` pointer one bar to the right.',
      why: 'We are now evaluating the next interior column bounded by `left_max`.',
    },
    8: {
      role: 'mutate',
      summary: 'Update `left_max` if the new bar is taller than any left wall seen so far.',
      why: 'A taller bar becomes the new retaining wall and traps 0 water on top of itself.',
    },
    9: {
      role: 'mutate',
      summary: 'Add `left_max - height[left]` to `water`.',
      why: 'Since `left_max <= right_max`, the right side is guaranteed to hold this much water without spilling.',
    },
    10: {
      role: 'condition',
      summary: 'Otherwise, the right wall (`right_max`) is the limiting bottleneck.',
      why: 'So it is safe to step inward from the right side and calculate water using `right_max`.',
    },
    11: {
      role: 'mutate',
      summary: 'Step the `right` pointer one bar to the left.',
      why: 'Moves to the next interior column bounded by `right_max`.',
    },
    12: {
      role: 'mutate',
      summary: 'Update `right_max` if the new bar is taller than any right wall seen so far.',
      why: 'Ensures `right_max - height[right]` is never negative.',
    },
    13: {
      role: 'mutate',
      summary: 'Add `right_max - height[right]` to `water`.',
      why: 'The taller wall on the left guarantees this water stays trapped at index `right`.',
    },
    14: {
      role: 'return',
      summary: 'Return the total accumulated `water`.',
      why: 'Every column has been measured exactly once in O(N) time and O(1) extra space.',
    },
  },

  'three-sum-zero': {
    1: {
      role: 'setup',
      summary: 'Take the list `nums` and find all unique triplets `[a, b, c]` that sum to `0`.',
      why: 'Sorting first lets us reduce the O(N³) brute-force search to O(N²) with two pointers.',
    },
    2: {
      role: 'mutate',
      summary: 'Sort `nums` in ascending order in-place.',
      why: 'Sorted order lets us move `left` right to increase the sum, move `right` left to decrease it, and easily skip duplicates.',
    },
    3: {
      role: 'setup',
      summary: 'Create an empty list `res` to collect unique valid triplets.',
      why: 'Each triplet whose three values add to zero will be appended here.',
    },
    4: {
      role: 'loop',
      summary: 'Fix each index `i` (up to `len(nums) - 3`) as the first number of the triplet.',
      why: 'We need at least two elements after `i` to form a three-number combination.',
    },
    5: {
      role: 'condition',
      summary: 'Check if this anchor value `nums[i]` is identical to the anchor we just processed.',
      why: 'Reusing the exact same first number would produce duplicate triplets.',
      watchOut: 'Make sure `i > 0` is checked first so we do not compare index 0 with the last element `nums[-1]`.',
    },
    6: {
      role: 'mutate',
      summary: 'Skip this duplicate anchor and jump to the next `i`.',
      why: 'Guarantees every triplet in `res` is unique without needing a hash set.',
    },
    7: {
      role: 'setup',
      summary: 'Start two pointers `left = i + 1` and `right = len(nums) - 1` on the remaining subarray.',
      why: 'Now we just solve a sorted Two Sum problem looking for `nums[left] + nums[right] == -nums[i]`.',
    },
    8: {
      role: 'loop',
      summary: 'Keep searching while `left` is strictly to the left of `right`.',
      why: 'We need two distinct positions after `i` to complete the triplet.',
    },
    9: {
      role: 'setup',
      summary: 'Compute the sum `total` of the anchor plus the two pointer elements.',
      why: 'Comparing `total` to `0` tells us which pointer to move next.',
    },
    10: {
      role: 'condition',
      summary: 'Check if `total` is too small (less than `0`).',
      why: 'Because the array is sorted, the only way to make the sum larger is to advance `left`.',
    },
    11: {
      role: 'mutate',
      summary: 'Move `left` one step right to pick a larger number.',
      why: 'Eliminates all pairs using the too-small `nums[left]` value in one step.',
    },
    12: {
      role: 'condition',
      summary: 'Check if `total` is too big (greater than `0`).',
      why: 'The only way to shrink the sum is to move `right` inward toward smaller numbers.',
    },
    13: {
      role: 'mutate',
      summary: 'Move `right` one step left to pick a smaller number.',
      why: 'Eliminates all pairs using the too-large `nums[right]` value.',
    },
    14: {
      role: 'condition',
      summary: 'Otherwise `total == 0` — we found a valid zero-sum triplet!',
      why: 'Both pointers have landed on an exact match for the anchor `nums[i]`.',
    },
    15: {
      role: 'mutate',
      summary: 'Record `[nums[i], nums[left], nums[right]]` in the result list `res`.',
      why: 'Saves this valid triplet before searching for any other pairs with the same anchor.',
    },
    16: {
      role: 'mutate',
      summary: 'Advance `left` by 1 to look for the next candidate pair.',
      why: 'Staying on the same `left` could only repeat the triplet we just saved.',
    },
    17: {
      role: 'mutate',
      summary: 'Retreat `right` by 1 simultaneously.',
      why: 'If `left` increased, `right` must decrease to keep the sum at zero.',
    },
    18: {
      role: 'loop',
      summary: 'Skip over any consecutive duplicate values at `left`.',
      why: 'Prevents emitting the exact same triplet twice when repeated numbers appear inside the array.',
      watchOut: 'Forgetting this inner dedup loop is the #1 bug in 3Sum interviews (e.g., on `[-2, 0, 0, 2, 2]`).',
    },
    19: {
      role: 'mutate',
      summary: 'Keep nudging `left` forward past each repeated value.',
      why: 'Ensures the next checked pair starts on a brand-new number.',
    },
    20: {
      role: 'return',
      summary: 'Return all collected unique zero-sum triplets.',
      why: 'Every possible anchor and valid pair has been explored in O(N²) time.',
    },
  },

  'sort-colors-dutch-flag': {
    1: {
      role: 'setup',
      summary: 'Sort an array containing only `0`s, `1`s, and `2`s in-place in a single pass.',
      why: 'Dijkstra’s Dutch National Flag algorithm partitions three values in O(N) time and O(1) space.',
    },
    2: {
      role: 'setup',
      summary: 'Set `low = 0`, `mid = 0`, and `high = len(nums) - 1`.',
      why: '`low` marks the end of the `0`-zone, `high` marks the start of the `2`-zone, and `mid` scans the unknown middle.',
    },
    3: {
      role: 'loop',
      summary: 'Keep scanning while `mid <= high` (there are still unclassified elements left).',
      why: 'Notice `<=` instead of `<`: the element sitting right at `high` has not been inspected yet!',
      watchOut: 'Using `mid < high` misses the final element at `high` and can leave a `0` sitting in the `1`-zone.',
    },
    4: {
      role: 'condition',
      summary: 'Check if the current scanned element `nums[mid]` is `0`.',
      why: '`0` belongs in the front partition (`[0..low-1]`).',
    },
    5: {
      role: 'mutate',
      summary: 'Swap `nums[low]` and `nums[mid]` to move this `0` to the front zone.',
      why: 'Everything between `low` and `mid` is already known to be `1`, so swapping puts `0` at `low` and `1` (or the same `0`) at `mid`.',
    },
    6: {
      role: 'mutate',
      summary: 'Advance `low` by 1 because the `0`-zone just grew by one slot.',
      why: 'Keeps the invariant that every index strictly before `low` holds `0`.',
    },
    7: {
      role: 'mutate',
      summary: 'Advance `mid` by 1 to inspect the next unknown element.',
      why: 'Safe to move `mid` here because the value swapped in from `low` was already scanned earlier.',
    },
    8: {
      role: 'condition',
      summary: 'Check if `nums[mid]` is `1`.',
      why: '`1` already sits in the correct middle zone (`[low..mid]`), so no swap is needed.',
    },
    9: {
      role: 'mutate',
      summary: 'Simply advance `mid` by 1, leaving the `1` right where it is.',
      why: 'Expands the middle `1`-zone in O(1) without touching memory.',
    },
    10: {
      role: 'condition',
      summary: 'Otherwise `nums[mid]` must be `2`.',
      why: '`2` belongs at the back of the array (`[high+1..n-1]`).',
    },
    11: {
      role: 'mutate',
      summary: 'Swap `nums[mid]` with `nums[high]` to throw this `2` to the back zone.',
      why: 'Places `2` into its final region at the tail of the array.',
    },
    12: {
      role: 'mutate',
      summary: 'Shrink `high` by 1 — and DO NOT increment `mid`!',
      why: 'The unknown value that just arrived from `high` could be `0`, `1`, or `2`, so `mid` must inspect it on the next loop turn.',
      watchOut: 'Incrementing `mid` here is the classic Dutch Flag bug — it skips inspecting the swapped-in element.',
    },
    13: {
      role: 'return',
      summary: 'Return the now three-way partitioned `nums` array.',
      why: 'Once `mid > high`, the unknown region is empty and all `0`s, `1`s, and `2`s are grouped in order.',
    },
  },

  'cycle-detection-floyd': {
    1: {
      role: 'setup',
      summary: 'Check whether a linked list loops back on itself (has a cycle) using O(1) memory.',
      why: 'Instead of storing every visited node in a hash set, Floyd’s algorithm uses two pointers moving at different speeds.',
    },
    2: {
      role: 'setup',
      summary: 'Start the `slow` pointer (tortoise) at `head`.',
      why: '`slow` advances 1 node per step.',
    },
    3: {
      role: 'setup',
      summary: 'Start the `fast` pointer (hare) at `head` as well.',
      why: '`fast` advances 2 nodes per step, closing any gap inside a cycle by 1 node each turn.',
    },
    4: {
      role: 'loop',
      summary: 'Keep moving as long as `fast` and `fast.next` are both non-null.',
      why: 'Because `fast` jumps two steps (`fast.next.next`), we must verify both hops exist to avoid a NullPointer crash.',
      watchOut: 'Checking only `fast is not None` crashes with an attribute error when `fast` reaches the last node.',
    },
    5: {
      role: 'mutate',
      summary: 'Move `slow` forward by 1 node.',
      why: 'Steady 1-step traversal ensures `slow` enters any cycle smoothly.',
    },
    6: {
      role: 'mutate',
      summary: 'Move `fast` forward by 2 nodes.',
      why: 'Moving 1 step faster per turn guarantees `fast` laps `slow` inside a cycle without ever jumping past it.',
    },
    7: {
      role: 'condition',
      summary: 'Check if `slow` and `fast` point to the exact same node in memory (`is`).',
      why: 'We compare node identity (memory address), NOT `.val`, because two different nodes can share the same number.',
      watchOut: 'Comparing `slow.val == fast.val` gives false positives when duplicate values exist in a non-cyclic list.',
    },
    8: {
      role: 'return',
      summary: 'Return `True` — the pointers collided, proving a cycle exists.',
      why: 'In a straight list, `fast` reaches `None` first and can never meet `slow` again.',
    },
    9: {
      role: 'return',
      summary: 'Return `False` — `fast` reached the end of the list (`None`), so there is no cycle.',
      why: 'Any list with a reachable tail cannot loop infinitely.',
    },
  },

  'lru-cache-pointers': {
    1: {
      role: 'helper',
      summary: 'Define a `Node` blueprint for our doubly-linked recency list.',
      why: 'Each cache entry stores both its `key` and `val` plus `prev`/`next` links so we can unlink it in O(1).',
    },
    2: {
      role: 'helper',
      summary: 'Initialize a new doubly-linked node with `key` and `val`.',
      why: 'Storing `key` inside the node lets us delete the evicted entry from the hash map when removing the tail node.',
    },
    3: {
      role: 'setup',
      summary: 'Save `key` and `val` on the node.',
      why: '`val` answers `get()`, while `key` tells us which dictionary slot to delete on eviction.',
    },
    4: {
      role: 'setup',
      summary: 'Start `prev` and `next` pointers as `None` until the node is spliced into the list.',
      why: 'Prevents dangling links before insertion.',
    },
    6: {
      role: 'helper',
      summary: 'Define the `LRUCache` combining a hash map (O(1) lookup) with a doubly-linked list (O(1) reorder).',
      why: 'Neither structure alone can do both lookup and recency eviction in O(1) time.',
    },
    7: {
      role: 'setup',
      summary: 'Construct the cache with a fixed maximum `capacity`.',
      why: 'Once the number of stored keys exceeds `capacity`, we evict the least recently used item.',
    },
    8: {
      role: 'setup',
      summary: 'Store the cache capacity limit in `self.cap`.',
      why: 'Checked during `put()` to decide when eviction is required.',
    },
    9: {
      role: 'setup',
      summary: 'Create `self.cache = {}` mapping each `key` directly to its heap `Node` object.',
      why: 'Jumping straight to the node reference lets us unlink and promote it without scanning the list.',
    },
    10: {
      role: 'setup',
      summary: 'Create two dummy sentinel nodes: `head` (most recent side) and `tail` (least recent side).',
      why: 'Sentinels eliminate messy `if head is None` / `if tail is None` null checks on every insert and remove.',
    },
    11: {
      role: 'mutate',
      summary: 'Connect `head.next = tail` and `tail.prev = head` to form an empty doubly-linked chain.',
      why: 'All real cache nodes will always sit safely between `head` and `tail`.',
    },
    13: {
      role: 'helper',
      summary: 'Helper `_remove(node)` detaches any node from its current spot in O(1) time.',
      why: 'Reused for both eviction (removing the LRU node) and promotion (moving a hit node to the front).',
    },
    14: {
      role: 'setup',
      summary: 'Grab the node’s two neighbors: `prev_node` and `nxt_node`.',
      why: 'Because of our dummy sentinels, both neighbors are guaranteed to exist.',
    },
    15: {
      role: 'mutate',
      summary: 'Bridge `prev_node` and `nxt_node` directly to each other, bypassing `node`.',
      why: 'Snips `node` out of the chain in two pointer writes without shifting any other elements.',
    },
    17: {
      role: 'helper',
      summary: 'Helper `_insert_front(node)` splices a node right after dummy `head` (Most Recently Used).',
      why: 'Every `get` hit or `put` write marks the node as freshest by placing it at the front.',
    },
    18: {
      role: 'mutate',
      summary: 'Wire `node` to point forward to the current first node (`head.next`) and backward to `head`.',
      why: 'Connects `node`’s own outgoing pointers BEFORE modifying `head.next`.',
      watchOut: 'Always wire `node.next` before overwriting `self.head.next`, or you lose the rest of the list.',
    },
    19: {
      role: 'mutate',
      summary: 'Point the old first node’s `.prev` back to our new `node`.',
      why: 'Keeps the doubly-linked list symmetric in both forward and backward directions.',
    },
    20: {
      role: 'mutate',
      summary: 'Update `self.head.next` to point to `node`.',
      why: 'Completes the 4-pointer splice so `node` is now officially the Most Recently Used item.',
    },
    22: {
      role: 'helper',
      summary: 'Look up `key` in the cache, mark it as Most Recently Used if found, and return its value.',
      why: 'Reading an entry counts as "using" it, so it must move to the front of the recency list.',
    },
    23: {
      role: 'condition',
      summary: 'Check if `key` is missing from `self.cache`.',
      why: 'Fast O(1) hash lookup immediately detects a cache miss.',
    },
    24: {
      role: 'return',
      summary: 'Return `-1` to signal a cache miss.',
      why: 'Matches the standard LRU Cache contract when a key is not present.',
    },
    25: {
      role: 'setup',
      summary: 'Fetch the exact `Node` object from `self.cache[key]` in O(1) time.',
      why: 'Gives us direct access to both `node.val` and its `.prev`/`.next` pointers.',
    },
    26: {
      role: 'mutate',
      summary: 'Unlink `node` from its old recency position.',
      why: 'Prepares the node to be reinserted at the MRU front.',
    },
    27: {
      role: 'mutate',
      summary: 'Re-insert `node` right after `head` as the Most Recently Used entry.',
      why: 'Protects this recently accessed key from being evicted next.',
    },
    28: {
      role: 'return',
      summary: 'Return the cached value `node.val`.',
      why: 'Completes the O(1) cache hit.',
    },
  },

  'coin-change-dp': {
    1: {
      role: 'setup',
      summary: 'Find the fewest coins needed to make `amount` (or `-1` if impossible).',
      why: 'Greedy (always picking the biggest coin) fails on coin sets like `[1, 3, 4]` for `6`, so we use bottom-up DP.',
    },
    2: {
      role: 'setup',
      summary: 'Define `INF = amount + 1` as an impossible sentinel value.',
      why: 'Even using all 1-cent coins takes at most `amount` coins, so `amount + 1` safely acts like infinity without overflow.',
    },
    3: {
      role: 'setup',
      summary: 'Create a table `dp` of size `amount + 1`, initially filled with `INF`.',
      why: '`dp[a]` will store the minimum number of coins required to build exact sub-amount `a`.',
    },
    4: {
      role: 'mutate',
      summary: 'Set base case `dp[0] = 0`.',
      why: 'It takes 0 coins to make an amount of 0; every larger amount builds up from this anchor.',
    },
    5: {
      role: 'loop',
      summary: 'Solve every sub-amount `a` in order from `1` up to `amount`.',
      why: 'Because `a - coin` is always smaller than `a`, `dp[a - coin]` is already solved when we need it.',
    },
    6: {
      role: 'loop',
      summary: 'Try using each available coin denomination as the LAST coin added to reach `a`.',
      why: 'Exploring every coin option guarantees we discover the globally fewest-coin combination.',
    },
    7: {
      role: 'condition',
      summary: 'Check if `coin` fits inside `a` (`a - coin >= 0`).',
      why: 'Prevents negative array indexing when a coin is larger than the current sub-amount.',
    },
    8: {
      role: 'mutate',
      summary: 'Update `dp[a]` to the smaller of its current best or `dp[a - coin] + 1`.',
      why: 'If we use this `coin`, we pay 1 coin plus the already-optimal answer for the remaining `a - coin`.',
      watchOut: 'Never forget the `+ 1` for the coin you just added!',
    },
    9: {
      role: 'return',
      summary: 'Return `dp[amount]` if reachable, otherwise return `-1`.',
      why: 'If `dp[amount]` is still `INF`, no combination of coins could ever reach `amount`.',
    },
  },

  'kadane-max-subarray': {
    1: {
      role: 'setup',
      summary: 'Find the largest possible sum of any contiguous subarray inside `nums`.',
      why: 'Kadane’s algorithm solves this in a single O(N) pass with O(1) extra memory.',
    },
    2: {
      role: 'setup',
      summary: 'Initialize `cur_sum = nums[0]` (best subarray sum ending at index 0).',
      why: 'Starting at `nums[0]` instead of `0` handles all-negative arrays correctly!',
      watchOut: 'Initializing `cur_sum = 0` or `best_sum = 0` gives the wrong answer `0` when every number is negative.',
    },
    3: {
      role: 'setup',
      summary: 'Initialize `best_sum = nums[0]` (best contiguous sum seen anywhere so far).',
      why: 'Tracks the global winner across all ending positions.',
    },
    4: {
      role: 'loop',
      summary: 'Walk through the rest of the array from index `1` to the end.',
      why: 'Index `0` is already accounted for in our initial registers.',
    },
    5: {
      role: 'condition',
      summary: 'Ask: is extending the previous subarray (`cur_sum + nums[i]`) worse than starting fresh at `nums[i]`?',
      why: 'Whenever `cur_sum` is negative, carrying it forward only drags the next subarray down.',
    },
    6: {
      role: 'mutate',
      summary: 'Drop the old prefix and start a brand-new subarray right at `nums[i]`.',
      why: 'A negative running prefix can never help build a bigger future sum.',
    },
    7: {
      role: 'condition',
      summary: 'Otherwise, the previous subarray helps (or does not hurt) our total.',
      why: 'So we keep the current streak alive.',
    },
    8: {
      role: 'mutate',
      summary: 'Extend the active subarray by adding `nums[i]` to `cur_sum`.',
      why: 'Grows the contiguous window one slot to the right.',
    },
    9: {
      role: 'condition',
      summary: 'Check if our active subarray `cur_sum` just beat the all-time record `best_sum`.',
      why: 'The best subarray might end in the middle of the array before later negative numbers arrive.',
    },
    10: {
      role: 'mutate',
      summary: 'Update `best_sum` to record the new peak subarray sum.',
      why: 'Preserves the highest sum seen anywhere during the scan.',
    },
    11: {
      role: 'return',
      summary: 'Return `best_sum`, the maximum contiguous subarray sum.',
      why: 'Every possible ending index has been evaluated in O(N) time and O(1) space.',
    },
  },

  'container-most-water': {
    1: {
      role: 'setup',
      summary: 'Find two vertical lines that together with the x-axis hold the most water.',
      why: 'Area equals `width * min(height[left], height[right])`, so we maximize both width and the shorter wall.',
    },
    2: {
      role: 'setup',
      summary: 'Start `left` at the very first line (`0`) and `right` at the very last line (`n - 1`).',
      why: 'This begins with the maximum possible horizontal width and narrows inward greedily.',
    },
    3: {
      role: 'setup',
      summary: 'Initialize `best = 0` to remember the largest area found so far.',
      why: 'We update `best` every time a pair beats our previous record.',
    },
    4: {
      role: 'loop',
      summary: 'Keep checking pairs while `left < right`.',
      why: 'Once the pointers meet, width becomes `0` and no more water can be held.',
    },
    5: {
      role: 'setup',
      summary: 'Calculate the horizontal distance `w = right - left` between the two walls.',
      why: 'Width shrinks by 1 on every iteration, so only a taller limiting wall can ever beat `best`.',
    },
    6: {
      role: 'setup',
      summary: 'Find the effective water height `h = min(height[left], height[right])`.',
      why: 'Water spills over the shorter of the two walls.',
    },
    7: {
      role: 'mutate',
      summary: 'Update `best` if the current container area `w * h` is larger.',
      why: 'Records the best pair discovered so far.',
    },
    8: {
      role: 'condition',
      summary: 'Check whether the left wall is shorter than the right wall.',
      why: 'Moving the taller wall inward can NEVER improve `min(left, right)` while width shrinks — only moving the shorter wall has a chance!',
      watchOut: 'Moving the taller pointer instead of the shorter one misses the optimal container.',
    },
    9: {
      role: 'mutate',
      summary: 'Advance `left` inward to hunt for a taller left wall.',
      why: 'We have already achieved the maximum possible area using this short `height[left]` wall.',
    },
    10: {
      role: 'condition',
      summary: 'Otherwise, the right wall is shorter (or tied).',
      why: 'So `height[right]` is the current bottleneck to replace.',
    },
    11: {
      role: 'mutate',
      summary: 'Move `right` inward to hunt for a taller right wall.',
      why: 'Eliminates all smaller-width pairs that would still be capped by `height[right]`.',
    },
    12: {
      role: 'return',
      summary: 'Return `best`, the maximum water area found.',
      why: 'Two pointers guarantee O(N) time instead of checking all O(N²) pairs.',
    },
  },

  'merge-intervals-greedy': {
    1: {
      role: 'setup',
      summary: 'Merge all overlapping `[start, end]` intervals and return a clean list of non-overlapping spans.',
      why: 'Sorting by start time puts every potentially overlapping interval right next to its neighbor.',
    },
    2: {
      role: 'mutate',
      summary: 'Sort the intervals in ascending order by their start coordinate (`iv[0]`).',
      why: 'Once sorted, if a new interval does not overlap the last merged block, it can never overlap any earlier block either.',
      watchOut: 'Forgetting to sort first breaks the sweep-line invariant when intervals arrive out of order.',
    },
    3: {
      role: 'setup',
      summary: 'Seed the `merged` output list with the very first sorted interval.',
      why: 'Gives us an active "current merged block" (`merged[-1]`) to compare against.',
    },
    4: {
      role: 'loop',
      summary: 'Sweep through each remaining interval from index `1` to the end.',
      why: 'Each interval either extends the latest merged block or starts a brand-new disjoint block.',
    },
    5: {
      role: 'setup',
      summary: 'Unpack the current interval into `start` and `end`.',
      why: 'Makes the overlap comparison crystal clear to read.',
    },
    6: {
      role: 'condition',
      summary: 'Check if `start <= merged[-1][1]` (does this interval touch or overlap the last merged block?).',
      why: 'Using `<=` merges touching endpoints too (e.g., `[1, 4]` and `[4, 5]` become `[1, 5]`).',
      watchOut: 'Using `<` instead of `<=` fails on touching intervals like `[1, 4]` and `[4, 5]`.',
    },
    7: {
      role: 'mutate',
      summary: 'Extend the last merged block’s end to `max(merged[-1][1], end)`.',
      why: 'Taking `max` is crucial when the new interval is completely swallowed inside the existing one (e.g., `[1, 10]` + `[2, 4]`).',
      watchOut: 'Setting `merged[-1][1] = end` directly shrinks `[1, 10]` down to `[1, 4]` on nested intervals!',
    },
    8: {
      role: 'condition',
      summary: 'Otherwise there is a gap (`start > merged[-1][1]`) — no overlap.',
      why: 'The previous merged block is completely finished and will never be touched again.',
    },
    9: {
      role: 'mutate',
      summary: 'Append `[start, end]` as a brand-new disjoint interval in `merged`.',
      why: 'Starts the next active block for upcoming intervals to compare against.',
    },
    10: {
      role: 'return',
      summary: 'Return the final `merged` list of non-overlapping intervals.',
      why: 'Total cost is O(N log N) for the initial sort plus a single O(N) sweep.',
    },
  },

  'longest-substring-unique': {
    1: {
      role: 'setup',
      summary: 'Find the length of the longest contiguous substring in `s` with no repeating characters.',
      why: 'A sliding window `[left..right]` lets us find the answer in a single O(N) pass.',
    },
    2: {
      role: 'setup',
      summary: 'Create a map `seen_at` storing the most recent index where each character appeared.',
      why: 'Lets us jump `left` straight past a duplicate in O(1) instead of shrinking one character at a time.',
    },
    3: {
      role: 'setup',
      summary: 'Start the window’s left boundary `left = 0`.',
      why: 'The active duplicate-free substring is always `s[left..right]`.',
    },
    4: {
      role: 'setup',
      summary: 'Track the longest valid window seen so far in `max_len = 0`.',
      why: 'Updated on every step after restoring uniqueness.',
    },
    5: {
      role: 'loop',
      summary: 'Expand the window’s right boundary `right` across every character `ch` in `s`.',
      why: 'Each character enters the window once and is processed in O(1) time.',
    },
    6: {
      role: 'condition',
      summary: 'Check if `ch` was seen before AND its last occurrence is STILL inside our current window (`>= left`).',
      why: 'Old duplicates sitting to the left of `left` are already outside our window and must be ignored.',
      watchOut: 'Without `seen_at[ch] >= left`, `left` can accidentally jump BACKWARD (e.g., on `"abba"`).',
    },
    7: {
      role: 'mutate',
      summary: 'Jump `left` directly to `seen_at[ch] + 1` to evict the earlier duplicate.',
      why: 'Restores the "all unique characters" invariant in one O(1) jump.',
    },
    8: {
      role: 'mutate',
      summary: 'Record `seen_at[ch] = right` as the newest position of `ch`.',
      why: 'Keeps the lookup table fresh for any future repeat of `ch`.',
    },
    9: {
      role: 'mutate',
      summary: 'Measure the current window size (`right - left + 1`) and update `max_len`.',
      why: '`+ 1` converts two inclusive indices into a character count.',
    },
    10: {
      role: 'return',
      summary: 'Return `max_len`, the longest unique-character substring length.',
      why: 'Both `left` and `right` only move forward, guaranteeing O(N) time.',
    },
  },

  'daily-temperatures-stack': {
    1: {
      role: 'setup',
      summary: 'For each day, compute how many days you must wait until a strictly warmer temperature.',
      why: 'A monotonic decreasing stack resolves waiting days in O(N) time instead of O(N²) scanning.',
    },
    2: {
      role: 'setup',
      summary: 'Store the number of days `n = len(temperatures)`.',
      why: 'Used to pre-allocate the answer array to the exact right length.',
    },
    3: {
      role: 'setup',
      summary: 'Initialize `ans` with `n` zeros.',
      why: 'Any day that never sees a warmer future day automatically keeps its default answer of `0`.',
    },
    4: {
      role: 'setup',
      summary: 'Create an empty `stack` holding indices of days still waiting for a warmer day.',
      why: 'We store INDICES (not raw temperatures) so we can compute the day gap `curr - prev_idx`.',
      watchOut: 'Pushing temperatures instead of indices makes it impossible to calculate how many days elapsed.',
    },
    5: {
      role: 'loop',
      summary: 'Scan each day index `curr` and its temperature `temp` from left to right.',
      why: 'Each new warmer day can resolve multiple colder days sitting on the stack at once.',
    },
    6: {
      role: 'loop',
      summary: 'While the stack is non-empty and today (`temp`) is strictly warmer than the day on top of the stack...',
      why: 'Today is the FIRST warmer day that the stacked day has ever seen, so we can immediately lock in its answer.',
      watchOut: 'Use `>` (strictly warmer), not `>=` — an equal temperature does not count as warmer.',
    },
    7: {
      role: 'mutate',
      summary: 'Pop that waiting day’s index (`prev_idx`) off the stack.',
      why: 'Once resolved, it never needs to be compared again (giving O(N) amortized time).',
    },
    8: {
      role: 'mutate',
      summary: 'Write the wait duration `curr - prev_idx` into `ans[prev_idx]`.',
      why: 'The index difference is the exact number of days between `prev_idx` and today.',
    },
    9: {
      role: 'mutate',
      summary: 'Push today’s index `curr` onto the stack to wait for a future warmer day.',
      why: 'Maintains the monotonic decreasing temperature order from bottom to top of the stack.',
    },
    10: {
      role: 'return',
      summary: 'Return the completed wait-days array `ans`.',
      why: 'Every index was pushed once and popped at most once — guaranteed O(N) time.',
    },
  },

  'valid-parentheses-stack': {
    1: {
      role: 'setup',
      summary: 'Verify whether every opening bracket `(`, `[`, `{` is closed by the right type in the right order.',
      why: 'The most recently opened bracket must be closed first (Last-In, First-Out) — a classic stack problem.',
    },
    2: {
      role: 'setup',
      summary: 'Build a lookup table `pairs` mapping each closing bracket to its matching opener.',
      why: 'Lets us test both "is this a closing bracket?" and "what opener does it expect?" cleanly in O(1).',
    },
    3: {
      role: 'setup',
      summary: 'Start an empty `stack` to hold unmatched opening brackets.',
      why: 'The top of the stack always represents the innermost open bracket waiting to be closed.',
    },
    4: {
      role: 'loop',
      summary: 'Inspect each bracket character `ch` in the string `s` from left to right.',
      why: 'A single linear scan checks nesting order in O(N) time.',
    },
    5: {
      role: 'condition',
      summary: 'Check if `ch` is a closing bracket (`)`, `]`, or `}`).',
      why: 'Closers must match the top of the stack; openers simply get pushed.',
    },
    6: {
      role: 'condition',
      summary: 'Check if the stack is empty OR its top bracket does not match `pairs[ch]`.',
      why: 'An empty stack means a stray closer like `")"` with no opener; a mismatch means crossed brackets like `"([)]"`.',
      watchOut: 'Always check `not stack` before `stack[-1]` so a leading `")"` does not throw an index error.',
    },
    7: {
      role: 'return',
      summary: 'Return `False` right away — we found an invalid closing bracket.',
      why: 'No later characters can fix a mismatched or stray closing bracket.',
    },
    8: {
      role: 'mutate',
      summary: 'Pop the matched opening bracket off the stack.',
      why: 'This pair is now cleanly closed, revealing the outer bracket underneath.',
    },
    9: {
      role: 'condition',
      summary: 'Otherwise `ch` is an opening bracket (`(`, `[`, or `{`).',
      why: 'It needs to wait on the stack until its matching closer appears.',
    },
    10: {
      role: 'mutate',
      summary: 'Push the opening bracket `ch` onto the top of the stack.',
      why: 'Makes it the newest innermost bracket expected to close next.',
    },
    11: {
      role: 'return',
      summary: 'Return `True` only if the stack is completely empty at the end.',
      why: 'If any opening brackets remain unclosed (like `"((("`), the string is invalid!',
      watchOut: 'Returning `True` unconditionally here fails on unclosed inputs like `"("`.',
    },
  },

  'binary-tree-level-order': {
    1: {
      role: 'setup',
      summary: 'Traverse a binary tree level by level from top to bottom and return each level’s values.',
      why: 'Breadth-First Search (BFS) with a FIFO queue naturally visits nodes in strict depth order.',
    },
    2: {
      role: 'condition',
      summary: 'Check if the tree is empty (`root` is `None`).',
      why: 'Prevents putting `None` into the queue and crashing when reading `curr.val`.',
    },
    3: {
      role: 'return',
      summary: 'Return an empty list `[]` for an empty tree.',
      why: 'Clean base case exit.',
    },
    4: {
      role: 'setup',
      summary: 'Create `result = []` to collect one sub-list per tree depth.',
      why: 'Each completed level will be appended as its own list.',
    },
    5: {
      role: 'setup',
      summary: 'Initialize a FIFO `queue` containing just the `root` node.',
      why: 'Depth 0 starts with only the root; `deque.popleft()` runs in O(1) time.',
    },
    6: {
      role: 'loop',
      summary: 'Keep processing levels as long as there are nodes waiting in the `queue`.',
      why: 'Each pass of this outer `while` loop processes exactly ONE full tree level.',
    },
    7: {
      role: 'setup',
      summary: 'Snapshot `level_size = len(queue)` BEFORE adding any children.',
      why: 'Freezes the exact count of nodes belonging to the current level so newly enqueued children stay in the NEXT level.',
      watchOut: 'Reading `len(queue)` dynamically instead of snapshotting mixes multiple depths together!',
    },
    8: {
      role: 'setup',
      summary: 'Create an empty list `current_level` for this depth’s values.',
      why: 'Holds the left-to-right values of the `level_size` nodes we are about to pop.',
    },
    9: {
      role: 'loop',
      summary: 'Loop exactly `level_size` times to drain only the current level.',
      why: 'Guarantees clean separation between depth `d` and depth `d + 1`.',
    },
    10: {
      role: 'mutate',
      summary: 'Dequeue the front node `curr` from the left end of the queue.',
      why: 'FIFO order ensures nodes are visited strictly from left to right.',
    },
    11: {
      role: 'mutate',
      summary: 'Append `curr.val` to `current_level`.',
      why: 'Records this node’s value at the right position in its depth row.',
    },
    12: {
      role: 'condition',
      summary: 'Check if `curr` has a left child.',
      why: 'We enqueue left before right to preserve standard left-to-right order on the next level.',
    },
    13: {
      role: 'mutate',
      summary: 'Push `curr.left` to the back of the queue for the next level.',
      why: 'It will wait behind all remaining nodes of the current level.',
    },
    14: {
      role: 'condition',
      summary: 'Check if `curr` has a right child.',
      why: 'Avoids pushing `None` placeholders into the queue.',
    },
    15: {
      role: 'mutate',
      summary: 'Push `curr.right` to the back of the queue for the next level.',
      why: 'Ensures every reachable node in the tree is queued exactly once.',
    },
    16: {
      role: 'mutate',
      summary: 'Add the finished `current_level` list to `result`.',
      why: 'Locks in this depth’s output before advancing to the children.',
    },
    17: {
      role: 'return',
      summary: 'Return `result` containing all levels from root to leaves.',
      why: 'Every node is enqueued and dequeued once: O(N) time.',
    },
  },

  'kth-largest-heap': {
    1: {
      role: 'setup',
      summary: 'Find the `k`-th largest element in `nums` without fully sorting the entire array.',
      why: 'Keeping a tiny min-heap of size `k` runs in O(N log K) time and O(K) space — ideal when `K << N`.',
    },
    2: {
      role: 'setup',
      summary: 'Create an empty list `min_heap` managed by Python’s `heapq` (smallest item always at index 0).',
      why: 'Counter-intuitively, a MIN-heap (not max-heap) is the clean tool for finding the K-th LARGEST item!',
      watchOut: 'Why a min-heap? Because it lets us instantly evict the smallest intruder whenever we hold K+1 items.',
    },
    3: {
      role: 'loop',
      summary: 'Stream through every number `num` in `nums`.',
      why: 'Works even on infinite data streams where you cannot store all N numbers.',
    },
    4: {
      role: 'mutate',
      summary: 'Push `num` into `min_heap` (sifting up in O(log K) time).',
      why: 'Gives `num` a chance to enter the top-K leaderboard.',
    },
    5: {
      role: 'condition',
      summary: 'Check if the heap now holds more than `k` items (`len(min_heap) > k`).',
      why: 'We only want to retain the `k` largest numbers seen so far.',
    },
    6: {
      role: 'mutate',
      summary: 'Pop and discard the smallest item at the root of `min_heap`.',
      why: 'Since there are `k` items larger than it in the heap, this popped value can never be in the top `k`.',
    },
    7: {
      role: 'return',
      summary: 'Return `min_heap[0]` — the smallest of the top `k` largest elements.',
      why: 'The smallest element among the top `k` winners is by definition the `k`-th largest overall!',
    },
  },

  'course-schedule-cycle': {
    1: {
      role: 'setup',
      summary: 'Determine if all `numCourses` can be completed given prerequisite pairs (i.e., the graph has no cycle).',
      why: 'Kahn’s topological sort peels off courses with 0 remaining prerequisites; a cycle leaves stuck courses behind.',
    },
    2: {
      role: 'setup',
      summary: 'Build an adjacency list `adj` where `adj[src]` lists every course unlocked by finishing `src`.',
      why: 'Lets us quickly notify dependent courses the moment a prerequisite is completed.',
    },
    3: {
      role: 'setup',
      summary: 'Create `indegree` initialized to `0` for every course.',
      why: '`indegree[c]` counts how many unfinished prerequisites course `c` is still waiting on.',
    },
    4: {
      role: 'loop',
      summary: 'Read each `[dest, src]` prerequisite pair (`src` must be taken before `dest`).',
      why: 'Translates the raw edge list into our graph and dependency counts.',
    },
    5: {
      role: 'mutate',
      summary: 'Add a directed edge `src -> dest` into `adj[src]`.',
      why: 'Records that completing `src` helps unlock `dest`.',
    },
    6: {
      role: 'mutate',
      summary: 'Increment `indegree[dest]` by 1.',
      why: '`dest` now has one more prerequisite that must finish first.',
    },
    8: {
      role: 'setup',
      summary: 'Seed a BFS `queue` with all courses whose `indegree == 0` (ready to take right away).',
      why: 'Any valid schedule must start with courses that have no prerequisites.',
    },
    9: {
      role: 'setup',
      summary: 'Initialize `visited = 0` to count how many courses we successfully complete.',
      why: 'At the end, `visited == numCourses` proves no deadlock cycle existed.',
    },
    10: {
      role: 'loop',
      summary: 'Keep taking courses while the ready `queue` is not empty.',
      why: 'Each iteration completes one ready course and potentially unlocks new ones.',
    },
    11: {
      role: 'mutate',
      summary: 'Dequeue the next ready course `curr`.',
      why: 'Its prerequisites are all satisfied, so we can take it now.',
    },
    12: {
      role: 'mutate',
      summary: 'Increment `visited` by 1 to mark `curr` as completed.',
      why: 'Tracks progress toward completing all `numCourses`.',
    },
    13: {
      role: 'loop',
      summary: 'Visit every dependent course `nxt` that was waiting on `curr`.',
      why: 'Finishing `curr` satisfies one prerequisite for each of its neighbors.',
    },
    14: {
      role: 'mutate',
      summary: 'Decrement `indegree[nxt]` by 1.',
      why: '`nxt` now has one fewer unfinished prerequisite left.',
    },
    15: {
      role: 'condition',
      summary: 'Check if `indegree[nxt]` just dropped to `0`.',
      why: 'That means every prerequisite for `nxt` is now finished and `nxt` is unlocked!',
    },
    16: {
      role: 'mutate',
      summary: 'Enqueue `nxt` so it can be taken next.',
      why: 'Continues the topological wave through the dependency graph.',
    },
    17: {
      role: 'return',
      summary: 'Return `visited == numCourses` (`True` if all courses finished, `False` if a cycle trapped some).',
      why: 'Courses trapped in a circular dependency never reach `indegree == 0`, leaving `visited < numCourses`.',
    },
  },

  'search-rotated-sorted': {
    1: {
      role: 'setup',
      summary: 'Find `target` in a rotated sorted array in O(log N) time (return its index or `-1`).',
      why: 'Even after rotation, splitting at `mid` ALWAYS leaves at least one half completely sorted!',
    },
    2: {
      role: 'setup',
      summary: 'Set search bounds `low = 0` and `high = len(nums) - 1`.',
      why: 'Our candidate answer is always contained inside the closed interval `[low..high]`.',
    },
    3: {
      role: 'loop',
      summary: 'Keep bisecting while `low <= high` (at least one element remains).',
      why: 'Must be `<=` so a single-element window (`low == high`) is still checked.',
      watchOut: 'Using `low < high` skips the final remaining element and can falsely return `-1`.',
    },
    4: {
      role: 'setup',
      summary: 'Compute the midpoint index `mid = (low + high) // 2`.',
      why: 'Cuts the remaining search space in half on every iteration.',
    },
    5: {
      role: 'condition',
      summary: 'Check if `nums[mid]` is already our `target`.',
      why: 'Best-case early exit when we land right on the answer.',
    },
    6: {
      role: 'return',
      summary: 'Return `mid`, the exact index where `target` was found.',
      why: 'Search succeeded in O(log N) steps.',
    },
    7: {
      role: 'condition',
      summary: 'Check if the left half `[low..mid]` is cleanly sorted (`nums[low] <= nums[mid]`).',
      why: 'Using `<=` handles the 2-element case where `low == mid`! Once we know which half is sorted, we can safely range-check `target`.',
      watchOut: 'Using `<` instead of `<=` breaks on 2-element rotated arrays like `[3, 1]` searching for `1`!',
    },
    8: {
      role: 'condition',
      summary: 'Check if `target` lies strictly inside the sorted left half (`nums[low] <= target < nums[mid]`).',
      why: 'Because `[low..mid]` is sorted with no rotation pivot, a simple range check is 100% reliable.',
    },
    9: {
      role: 'mutate',
      summary: 'Discard the right half by setting `high = mid - 1`.',
      why: '`target` is guaranteed to be on the left side if it exists.',
    },
    10: {
      role: 'condition',
      summary: 'Otherwise `target` is outside the sorted left range.',
      why: 'So it can only live in the right half `[mid + 1..high]`.',
    },
    11: {
      role: 'mutate',
      summary: 'Discard the left half by setting `low = mid + 1`.',
      why: 'Narrows the search into the right half.',
    },
    12: {
      role: 'condition',
      summary: 'Otherwise the rotation pivot is on the left, meaning the RIGHT half `[mid..high]` is cleanly sorted.',
      why: 'Now we can safely range-check `target` against `[mid..high]`.',
    },
    13: {
      role: 'condition',
      summary: 'Check if `target` lies inside the sorted right half (`nums[mid] < target <= nums[high]`).',
      why: 'A clean monotonic range check tells us immediately whether to stay right or jump left.',
    },
    14: {
      role: 'mutate',
      summary: 'Discard the left half by setting `low = mid + 1`.',
      why: '`target` belongs inside the sorted right interval.',
    },
    15: {
      role: 'condition',
      summary: 'Otherwise `target` is not in the sorted right half.',
      why: 'So we must search the rotated left half instead.',
    },
    16: {
      role: 'mutate',
      summary: 'Discard the right half by setting `high = mid - 1`.',
      why: 'Cuts the search space in half toward the left side.',
    },
    17: {
      role: 'return',
      summary: 'Return `-1` — the search window is empty, so `target` does not exist in `nums`.',
      why: 'Every valid candidate was eliminated in O(log N) comparisons.',
    },
  },
};
