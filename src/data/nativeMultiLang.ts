import { Language } from '../types/visualizer';

type ExtraLanguage = Exclude<Language, 'python' | 'java'>;

/**
 * Genuine, idiomatic implementations in C++20, Go 1.22, TypeScript 5, and Rust 1.78
 * for all 15 native trace families (eliminating generic placeholder stubs).
 */
export const NATIVE_MULTI_LANG_CODE: Record<string, Record<ExtraLanguage, string>> = {
  'reverse-linked-list': {
    cpp: `struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(nullptr) {}
};

class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr != nullptr) {
            ListNode* nxt = curr->next; // Cache forward heap address
            curr->next = prev;          // Flip pointer 180 degrees
            prev = curr;                // Advance prev register
            curr = nxt;                 // Advance curr register
        }
        return prev;
    }
};`,
    go: `type ListNode struct {
    Val  int
    Next *ListNode
}

func reverseList(head *ListNode) *ListNode {
    var prev *ListNode = nil
    curr := head
    for curr != nil {
        nxt := curr.Next // Save forward reference
        curr.Next = prev // Mutate .Next backward in-place
        prev = curr      // Step prev forward
        curr = nxt       // Step curr forward
    }
    return prev
}`,
    typescript: `class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

export function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr: ListNode | null = head;
  while (curr !== null) {
    const nxt: ListNode | null = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nxt;
  }
  return prev;
}`,
    rust: `#[derive(PartialEq, Eq, Clone, Debug)]
pub struct ListNode {
    pub val: i32,
    pub next: Option<Box<ListNode>>,
}

pub fn reverse_list(head: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
    let mut prev = None;
    let mut curr = head;
    while let Some(mut node) = curr {
        curr = node.next.take(); // Move ownership of .next
        node.next = prev;        // Rewire backward in-place
        prev = Some(node);       // Advance prev owner
    }
    prev
}`,
  },

  'trapping-rain-water': {
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int trap(const vector<int>& height) {
        if (height.empty()) return 0;
        int left = 0, right = static_cast<int>(height.size()) - 1;
        int leftMax = height[left], rightMax = height[right];
        int water = 0;
        while (left < right) {
            if (leftMax <= rightMax) {
                left++;
                leftMax = max(leftMax, height[left]);
                water += leftMax - height[left];
            } else {
                right--;
                rightMax = max(rightMax, height[right]);
                water += rightMax - height[right];
            }
        }
        return water;
    }
};`,
    go: `package main

func trap(height []int) int {
    if len(height) == 0 {
        return 0
    }
    left, right := 0, len(height)-1
    leftMax, rightMax := height[left], height[right]
    water := 0
    for left < right {
        if leftMax <= rightMax {
            left++
            if height[left] > leftMax {
                leftMax = height[left]
            }
            water += leftMax - height[left]
        } else {
            right--
            if height[right] > rightMax {
                rightMax = height[right]
            }
            water += rightMax - height[right]
        }
    }
    return water
}`,
    typescript: `export function trap(height: number[]): number {
  if (height.length === 0) return 0;
  let left = 0;
  let right = height.length - 1;
  let leftMax = height[left];
  let rightMax = height[right];
  let water = 0;
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
}`,
    rust: `pub fn trap(height: &[i32]) -> i32 {
    if height.is_empty() {
        return 0;
    }
    let (mut left, mut right) = (0usize, height.len() - 1);
    let (mut left_max, mut right_max) = (height[left], height[right]);
    let mut water = 0;
    while left < right {
        if left_max <= right_max {
            left += 1;
            left_max = left_max.max(height[left]);
            water += left_max - height[left];
        } else {
            right -= 1;
            right_max = right_max.max(height[right]);
            water += right_max - height[right];
        }
    }
    water
}`,
  },

  'lru-cache-pointers': {
    cpp: `#include <list>
#include <unordered_map>
using namespace std;

class LRUCache {
    int cap;
    list<pair<int, int>> order;
    unordered_map<int, list<pair<int, int>>::iterator> cache;
public:
    LRUCache(int capacity) : cap(capacity) {}

    int get(int key) {
        auto it = cache.find(key);
        if (it == cache.end()) return -1;
        order.splice(order.begin(), order, it->second);
        return it->second->second;
    }

    void put(int key, int value) {
        if (cache.count(key)) {
            cache[key]->second = value;
            order.splice(order.begin(), order, cache[key]);
            return;
        }
        if ((int)order.size() == cap) {
            cache.erase(order.back().first);
            order.pop_back();
        }
        order.emplace_front(key, value);
        cache[key] = order.begin();
    }
};`,
    go: `package main

import "container/list"

type entry struct{ key, val int }

type LRUCache struct {
    cap   int
    order *list.List
    cache map[int]*list.Element
}

func NewLRUCache(capacity int) *LRUCache {
    return &LRUCache{cap: capacity, order: list.New(), cache: make(map[int]*list.Element)}
}

func (c *LRUCache) Get(key int) int {
    if el, ok := c.cache[key]; ok {
        c.order.MoveToFront(el)
        return el.Value.(*entry).val
    }
    return -1
}

func (c *LRUCache) Put(key, value int) {
    if el, ok := c.cache[key]; ok {
        el.Value.(*entry).val = value
        c.order.MoveToFront(el)
        return
    }
    if c.order.Len() == c.cap {
        lru := c.order.Back()
        delete(c.cache, lru.Value.(*entry).key)
        c.order.Remove(lru)
    }
    c.cache[key] = c.order.PushFront(&entry{key, value})
}`,
    typescript: `export class LRUCache {
  private readonly cap: number;
  private readonly cache = new Map<number, number>();

  constructor(capacity: number) {
    this.cap = capacity;
  }

  get(key: number): number {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val); // Promote to MRU end
    return val;
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.cap) {
      const oldestKey = this.cache.keys().next().value!;
      this.cache.delete(oldestKey); // Evict LRU node
    }
  }
}`,
    rust: `use std::collections::{HashMap, VecDeque};

pub struct LRUCache {
    cap: usize,
    order: VecDeque<i32>,
    values: HashMap<i32, i32>,
}

impl LRUCache {
    pub fn new(capacity: usize) -> Self {
        Self { cap: capacity, order: VecDeque::new(), values: HashMap::new() }
    }

    pub fn get(&mut self, key: i32) -> i32 {
        if let Some(&val) = self.values.get(&key) {
            self.order.retain(|&k| k != key);
            self.order.push_front(key);
            return val;
        }
        -1
    }

    pub fn put(&mut self, key: i32, value: i32) {
        if self.values.contains_key(&key) {
            self.order.retain(|&k| k != key);
        } else if self.order.len() == self.cap {
            if let Some(lru) = self.order.pop_back() {
                self.values.remove(&lru);
            }
        }
        self.order.push_front(key);
        self.values.insert(key, value);
    }
}`,
  },

  'binary-tree-level-order': {
    cpp: `#include <vector>
#include <queue>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
};

class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        vector<vector<int>> result;
        if (!root) return result;
        queue<TreeNode*> q;
        q.push(root);
        while (!q.empty()) {
            int levelSize = static_cast<int>(q.size());
            vector<int> level;
            for (int i = 0; i < levelSize; i++) {
                TreeNode* curr = q.front();
                q.pop();
                level.push_back(curr->val);
                if (curr->left) q.push(curr->left);
                if (curr->right) q.push(curr->right);
            }
            result.push_back(move(level));
        }
        return result;
    }
};`,
    go: `package main

type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

func levelOrder(root *TreeNode) [][]int {
    if root == nil {
        return nil
    }
    var result [][]int
    queue := []*TreeNode{root}
    for len(queue) > 0 {
        levelSize := len(queue)
        level := make([]int, 0, levelSize)
        for i := 0; i < levelSize; i++ {
            curr := queue[0]
            queue = queue[1:]
            level = append(level, curr.Val)
            if curr.Left != nil {
                queue = append(queue, curr.Left)
            }
            if curr.Right != nil {
                queue = append(queue, curr.Right)
            }
        }
        result = append(result, level)
    }
    return result
}`,
    typescript: `interface TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

export function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];
  const result: number[][] = [];
  const queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel: number[] = [];
    for (let i = 0; i < levelSize; i++) {
      const curr = queue.shift()!;
      currentLevel.push(curr.val);
      if (curr.left) queue.push(curr.left);
      if (curr.right) queue.push(curr.right);
    }
    result.push(currentLevel);
  }
  return result;
}`,
    rust: `use std::collections::VecDeque;

pub struct TreeNode {
    pub val: i32,
    pub left: Option<Box<TreeNode>>,
    pub right: Option<Box<TreeNode>>,
}

pub fn level_order(root: Option<&TreeNode>) -> Vec<Vec<i32>> {
    let mut result = Vec::new();
    let mut queue = VecDeque::new();
    if let Some(node) = root {
        queue.push_back(node);
    }
    while !queue.is_empty() {
        let level_size = queue.len();
        let mut level = Vec::with_capacity(level_size);
        for _ in 0..level_size {
            if let Some(curr) = queue.pop_front() {
                level.push(curr.val);
                if let Some(ref l) = curr.left { queue.push_back(l); }
                if let Some(ref r) = curr.right { queue.push_back(r); }
            }
        }
        result.push(level);
    }
    result
}`,
  },

  'course-schedule-cycle': {
    cpp: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    bool canFinish(int numCourses, const vector<vector<int>>& prerequisites) {
        vector<vector<int>> adj(numCourses);
        vector<int> indegree(numCourses, 0);
        for (const auto& edge : prerequisites) {
            adj[edge[1]].push_back(edge[0]);
            indegree[edge[0]]++;
        }
        queue<int> q;
        for (int i = 0; i < numCourses; i++) {
            if (indegree[i] == 0) q.push(i);
        }
        int visited = 0;
        while (!q.empty()) {
            int curr = q.front();
            q.pop();
            visited++;
            for (int nxt : adj[curr]) {
                if (--indegree[nxt] == 0) q.push(nxt);
            }
        }
        return visited == numCourses;
    }
};`,
    go: `package main

func canFinish(numCourses int, prerequisites [][]int) bool {
    adj := make([][]int, numCourses)
    indegree := make([]int, numCourses)
    for _, edge := range prerequisites {
        dest, src := edge[0], edge[1]
        adj[src] = append(adj[src], dest)
        indegree[dest]++
    }
    queue := []int{}
    for i := 0; i < numCourses; i++ {
        if indegree[i] == 0 {
            queue = append(queue, i)
        }
    }
    visited := 0
    for len(queue) > 0 {
        curr := queue[0]
        queue = queue[1:]
        visited++
        for _, nxt := range adj[curr] {
            indegree[nxt]--
            if indegree[nxt] == 0 {
                queue = append(queue, nxt)
            }
        }
    }
    return visited == numCourses
}`,
    typescript: `export function canFinish(numCourses: number, prerequisites: [number, number][]): boolean {
  const adj: number[][] = Array.from({ length: numCourses }, () => []);
  const indegree = new Array<number>(numCourses).fill(0);
  for (const [dest, src] of prerequisites) {
    adj[src].push(dest);
    indegree[dest]++;
  }
  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if (indegree[i] === 0) queue.push(i);
  }
  let visited = 0;
  while (queue.length > 0) {
    const curr = queue.shift()!;
    visited++;
    for (const nxt of adj[curr]) {
      if (--indegree[nxt] === 0) queue.push(nxt);
    }
  }
  return visited === numCourses;
}`,
    rust: `use std::collections::VecDeque;

pub fn can_finish(num_courses: usize, prerequisites: &[(usize, usize)]) -> bool {
    let mut adj = vec![Vec::new(); num_courses];
    let mut indegree = vec![0usize; num_courses];
    for &(dest, src) in prerequisites {
        adj[src].push(dest);
        indegree[dest] += 1;
    }
    let mut queue: VecDeque<usize> = (0..num_courses)
        .filter(|&i| indegree[i] == 0)
        .collect();
    let mut visited = 0;
    while let Some(curr) = queue.pop_front() {
        visited += 1;
        for &nxt in &adj[curr] {
            indegree[nxt] -= 1;
            if indegree[nxt] == 0 {
                queue.push_back(nxt);
            }
        }
    }
    visited == num_courses
}`,
  },

  'cycle-detection-floyd': {
    cpp: `struct ListNode {
    int val;
    ListNode *next;
};

class Solution {
public:
    bool hasCycle(ListNode* head) {
        ListNode* slow = head;
        ListNode* fast = head;
        while (fast != nullptr && fast->next != nullptr) {
            slow = slow->next;       // +1 hop
            fast = fast->next->next; // +2 hops
            if (slow == fast) {
                return true;
            }
        }
        return false;
    }
};`,
    go: `type ListNode struct {
    Val  int
    Next *ListNode
}

func hasCycle(head *ListNode) bool {
    slow, fast := head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
        if slow == fast {
            return true
        }
    }
    return false
}`,
    typescript: `interface ListNode {
  val: number;
  next: ListNode | null;
}

export function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      return true;
    }
  }
  return false;
}`,
    rust: `pub fn has_cycle(next_index: &[Option<usize>]) -> bool {
    let (mut slow, mut fast) = (Some(0usize), Some(0usize));
    while let Some(f) = fast {
        let f1 = next_index.get(f).copied().flatten();
        fast = f1.and_then(|idx| next_index.get(idx).copied().flatten());
        slow = slow.and_then(|idx| next_index.get(idx).copied().flatten());
        if slow.is_some() && slow == fast {
            return true;
        }
    }
    false
}`,
  },

  'longest-substring-unique': {
    cpp: `#include <string>
#include <unordered_map>
#include <algorithm>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(const string& s) {
        unordered_map<char, int> seenAt;
        int left = 0, maxLen = 0;
        for (int right = 0; right < static_cast<int>(s.size()); right++) {
            char ch = s[right];
            if (seenAt.count(ch) && seenAt[ch] >= left) {
                left = seenAt[ch] + 1;
            }
            seenAt[ch] = right;
            maxLen = max(maxLen, right - left + 1);
        }
        return maxLen;
    }
};`,
    go: `package main

func lengthOfLongestSubstring(s string) int {
    seenAt := make(map[rune]int)
    left, maxLen := 0, 0
    for right, ch := range []rune(s) {
        if prev, ok := seenAt[ch]; ok && prev >= left {
            left = prev + 1
        }
        seenAt[ch] = right
        if span := right - left + 1; span > maxLen {
            maxLen = span
        }
    }
    return maxLen
}`,
    typescript: `export function lengthOfLongestSubstring(s: string): number {
  const seenAt = new Map<string, number>();
  let left = 0;
  let maxLen = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    const prev = seenAt.get(ch);
    if (prev !== undefined && prev >= left) {
      left = prev + 1;
    }
    seenAt.set(ch, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
    rust: `use std::collections::HashMap;

pub fn length_of_longest_substring(s: &str) -> usize {
    let mut seen_at = HashMap::new();
    let (mut left, mut max_len) = (0usize, 0usize);
    for (right, ch) in s.chars().enumerate() {
        if let Some(&prev) = seen_at.get(&ch) {
            if prev >= left {
                left = prev + 1;
            }
        }
        seen_at.insert(ch, right);
        max_len = max_len.max(right - left + 1);
    }
    max_len
}`,
  },

  'search-rotated-sorted': {
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(const vector<int>& nums, int target) {
        int low = 0, high = static_cast<int>(nums.size()) - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) return mid;
            if (nums[low] <= nums[mid]) {
                if (nums[low] <= target && target < nums[mid]) high = mid - 1;
                else low = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[high]) low = mid + 1;
                else high = mid - 1;
            }
        }
        return -1;
    }
};`,
    go: `package main

func search(nums []int, target int) int {
    low, high := 0, len(nums)-1
    for low <= high {
        mid := low + (high-low)/2
        if nums[mid] == target {
            return mid
        }
        if nums[low] <= nums[mid] {
            if nums[low] <= target && target < nums[mid] {
                high = mid - 1
            } else {
                low = mid + 1
            }
        } else {
            if nums[mid] < target && target <= nums[high] {
                low = mid + 1
            } else {
                high = mid - 1
            }
        }
    }
    return -1
}`,
    typescript: `export function search(nums: number[], target: number): number {
  let low = 0;
  let high = nums.length - 1;
  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (nums[mid] === target) return mid;
    if (nums[low] <= nums[mid]) {
      if (nums[low] <= target && target < nums[mid]) high = mid - 1;
      else low = mid + 1;
    } else {
      if (nums[mid] < target && target <= nums[high]) low = mid + 1;
      else high = mid - 1;
    }
  }
  return -1;
}`,
    rust: `pub fn search(nums: &[i32], target: i32) -> i32 {
    let (mut low, mut high) = (0isize, nums.len() as isize - 1);
    while low <= high {
        let mid = low + (high - low) / 2;
        let m = mid as usize;
        if nums[m] == target {
            return mid as i32;
        }
        if nums[low as usize] <= nums[m] {
            if nums[low as usize] <= target && target < nums[m] { high = mid - 1; }
            else { low = mid + 1; }
        } else {
            if nums[m] < target && target <= nums[high as usize] { low = mid + 1; }
            else { high = mid - 1; }
        }
    }
    -1
}`,
  },

  'daily-temperatures-stack': {
    cpp: `#include <vector>
#include <stack>
using namespace std;

class Solution {
public:
    vector<int> dailyTemperatures(const vector<int>& temps) {
        vector<int> ans(temps.size(), 0);
        stack<int> st; // Monotonic decreasing indices
        for (int i = 0; i < static_cast<int>(temps.size()); i++) {
            while (!st.empty() && temps[i] > temps[st.top()]) {
                int prevIdx = st.top();
                st.pop();
                ans[prevIdx] = i - prevIdx;
            }
            st.push(i);
        }
        return ans;
    }
};`,
    go: `package main

func dailyTemperatures(temps []int) []int {
    ans := make([]int, len(temps))
    stack := []int{}
    for i, t := range temps {
        for len(stack) > 0 && t > temps[stack[len(stack)-1]] {
            prevIdx := stack[len(stack)-1]
            stack = stack[:len(stack)-1]
            ans[prevIdx] = i - prevIdx
        }
        stack = append(stack, i)
    }
    return ans
}`,
    typescript: `export function dailyTemperatures(temps: number[]): number[] {
  const ans = new Array<number>(temps.length).fill(0);
  const stack: number[] = [];
  for (let i = 0; i < temps.length; i++) {
    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {
      const prevIdx = stack.pop()!;
      ans[prevIdx] = i - prevIdx;
    }
    stack.push(i);
  }
  return ans;
}`,
    rust: `pub fn daily_temperatures(temps: &[i32]) -> Vec<i32> {
    let mut ans = vec![0i32; temps.len()];
    let mut stack: Vec<usize> = Vec::new();
    for (i, &t) in temps.iter().enumerate() {
        while let Some(&prev) = stack.last() {
            if t > temps[prev] {
                stack.pop();
                ans[prev] = (i - prev) as i32;
            } else {
                break;
            }
        }
        stack.push(i);
    }
    ans
}`,
  },

  'three-sum-zero': {
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> threeSum(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        int n = static_cast<int>(nums.size());
        for (int i = 0; i < n - 2; i++) {
            if (i > 0 && nums[i] == nums[i - 1]) continue;
            int lo = i + 1, hi = n - 1;
            while (lo < hi) {
                int sum = nums[i] + nums[lo] + nums[hi];
                if (sum == 0) {
                    res.push_back({nums[i], nums[lo++], nums[hi--]});
                    while (lo < hi && nums[lo] == nums[lo - 1]) lo++;
                } else if (sum < 0) lo++;
                else hi--;
            }
        }
        return res;
    }
};`,
    go: `package main

import "sort"

func threeSum(nums []int) [][]int {
    sort.Ints(nums)
    var res [][]int
    for i := 0; i < len(nums)-2; i++ {
        if i > 0 && nums[i] == nums[i-1] {
            continue
        }
        lo, hi := i+1, len(nums)-1
        for lo < hi {
            sum := nums[i] + nums[lo] + nums[hi]
            if sum == 0 {
                res = append(res, []int{nums[i], nums[lo], nums[hi]})
                lo++
                hi--
                for lo < hi && nums[lo] == nums[lo-1] {
                    lo++
                }
            } else if sum < 0 {
                lo++
            } else {
                hi--
            }
        }
    }
    return res
}`,
    typescript: `export function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const res: number[][] = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    let lo = i + 1;
    let hi = nums.length - 1;
    while (lo < hi) {
      const sum = nums[i] + nums[lo] + nums[hi];
      if (sum === 0) {
        res.push([nums[i], nums[lo++], nums[hi--]]);
        while (lo < hi && nums[lo] === nums[lo - 1]) lo++;
      } else if (sum < 0) lo++;
      else hi--;
    }
  }
  return res;
}`,
    rust: `pub fn three_sum(mut nums: Vec<i32>) -> Vec<Vec<i32>> {
    nums.sort_unstable();
    let mut res = Vec::new();
    let n = nums.len();
    for i in 0..n.saturating_sub(2) {
        if i > 0 && nums[i] == nums[i - 1] { continue; }
        let (mut lo, mut hi) = (i + 1, n - 1);
        while lo < hi {
            let sum = nums[i] + nums[lo] + nums[hi];
            if sum == 0 {
                res.push(vec![nums[i], nums[lo], nums[hi]]);
                lo += 1;
                hi -= 1;
                while lo < hi && nums[lo] == nums[lo - 1] { lo += 1; }
            } else if sum < 0 { lo += 1; }
            else { hi -= 1; }
        }
    }
    res
}`,
  },

  'coin-change-dp': {
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int coinChange(const vector<int>& coins, int amount) {
        vector<int> dp(amount + 1, amount + 1);
        dp[0] = 0;
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (a - c >= 0) {
                    dp[a] = min(dp[a], dp[a - c] + 1);
                }
            }
        }
        return dp[amount] > amount ? -1 : dp[amount];
    }
};`,
    go: `package main

func coinChange(coins []int, amount int) int {
    dp := make([]int, amount+1)
    for i := 1; i <= amount; i++ {
        dp[i] = amount + 1
    }
    for a := 1; a <= amount; a++ {
        for _, c := range coins {
            if a-c >= 0 && dp[a-c]+1 < dp[a] {
                dp[a] = dp[a-c] + 1
            }
        }
    }
    if dp[amount] > amount {
        return -1
    }
    return dp[amount]
}`,
    typescript: `export function coinChange(coins: number[], amount: number): number {
  const dp = new Array<number>(amount + 1).fill(amount + 1);
  dp[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (a - c >= 0) {
        dp[a] = Math.min(dp[a], dp[a - c] + 1);
      }
    }
  }
  return dp[amount] > amount ? -1 : dp[amount];
}`,
    rust: `pub fn coin_change(coins: &[i32], amount: usize) -> i32 {
    let inf = (amount + 1) as i32;
    let mut dp = vec![inf; amount + 1];
    dp[0] = 0;
    for a in 1..=amount {
        for &c in coins {
            if c > 0 && a >= c as usize {
                dp[a] = dp[a].min(dp[a - c as usize] + 1);
            }
        }
    }
    if dp[amount] > amount as i32 { -1 } else { dp[amount] }
}`,
  },

  'kth-largest-heap': {
    cpp: `#include <vector>
#include <queue>
using namespace std;

class Solution {
public:
    int findKthLargest(const vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> minHeap;
        for (int num : nums) {
            minHeap.push(num);
            if (static_cast<int>(minHeap.size()) > k) {
                minHeap.pop();
            }
        }
        return minHeap.top();
    }
};`,
    go: `package main

import "container/heap"

type MinHeap []int
func (h MinHeap) Len() int           { return len(h) }
func (h MinHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h MinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *MinHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *MinHeap) Pop() any          { old := *h; x := old[len(old)-1]; *h = old[:len(old)-1]; return x }

func findKthLargest(nums []int, k int) int {
    h := &MinHeap{}
    for _, num := range nums {
        heap.Push(h, num)
        if h.Len() > k {
            heap.Pop(h)
        }
    }
    return (*h)[0]
}`,
    typescript: `export function findKthLargest(nums: number[], k: number): number {
  const minHeap: number[] = [];
  for (const num of nums) {
    minHeap.push(num);
    minHeap.sort((a, b) => a - b); // Keep smallest root at index 0
    if (minHeap.length > k) {
      minHeap.shift(); // Evict smallest element outside top-K
    }
  }
  return minHeap[0];
}`,
    rust: `use std::cmp::Reverse;
use std::collections::BinaryHeap;

pub fn find_kth_largest(nums: &[i32], k: usize) -> i32 {
    let mut min_heap = BinaryHeap::new();
    for &num in nums {
        min_heap.push(Reverse(num));
        if min_heap.len() > k {
            min_heap.pop();
        }
    }
    min_heap.peek().map(|r| r.0).unwrap_or(0)
}`,
  },

  'valid-parentheses-stack': {
    cpp: `#include <string>
#include <stack>
#include <unordered_map>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        unordered_map<char, char> matching = {{')', '('}, {'}', '{'}, {']', '['}};
        for (char ch : s) {
            if (matching.count(ch)) {
                if (st.empty() || st.top() != matching[ch]) return false;
                st.pop();
            } else {
                st.push(ch);
            }
        }
        return st.empty();
    }
};`,
    go: `package main

func isValid(s string) bool {
    st := []rune{}
    matching := map[rune]rune{')': '(', '}': '{', ']': '['}
    for _, ch := range s {
        if open, exists := matching[ch]; exists {
            if len(st) == 0 || st[len(st)-1] != open {
                return false
            }
            st = st[:len(st)-1]
        } else {
            st = append(st, ch)
        }
    }
    return len(st) == 0
}`,
    typescript: `export function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  for (const ch of s) {
    if (map[ch]) {
      if (stack.pop() !== map[ch]) return false;
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;
}`,
    rust: `pub fn is_valid(s: String) -> bool {
    let mut stack = Vec::new();
    for ch in s.chars() {
        match ch {
            '(' => stack.push(')'),
            '{' => stack.push('}'),
            '[' => stack.push(']'),
            ')' | '}' | ']' => {
                if stack.pop() != Some(ch) {
                    return false;
                }
            }
            _ => {}
        }
    }
    stack.is_empty()
}`,
  },

  'two-sum-hash': {
    cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            int comp = target - nums[i];
            if (seen.count(comp)) {
                return {seen[comp], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
    go: `package main

func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        comp := target - num
        if idx, ok := seen[comp]; ok {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}`,
    typescript: `export function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const comp = target - nums[i];
    if (seen.has(comp)) {
      return [seen.get(comp)!, i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
    rust: `use std::collections::HashMap;

pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
    let mut seen = HashMap::new();
    for (i, &num) in nums.iter().enumerate() {
        let comp = target - num;
        if let Some(&prev_idx) = seen.get(&comp) {
            return vec![prev_idx as i32, i as i32];
        }
        seen.insert(num, i);
    }
    vec![]
}`,
  },

  'container-most-water': {
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxArea(vector<int>& height) {
        int left = 0, right = (int)height.size() - 1;
        int max_water = 0;
        while (left < right) {
            int w = right - left;
            int h = min(height[left], height[right]);
            max_water = max(max_water, w * h);
            if (height[left] < height[right]) left++;
            else right--;
        }
        return max_water;
    }
};`,
    go: `package main

func maxArea(height []int) int {
    left, right := 0, len(height)-1
    maxWater := 0
    for left < right {
        w := right - left
        h := height[left]
        if height[right] < h {
            h = height[right]
        }
        if area := w * h; area > maxWater {
            maxWater = area
        }
        if height[left] < height[right] {
            left++
        } else {
            right--
        }
    }
    return maxWater
}`,
    typescript: `export function maxArea(height: number[]): number {
  let left = 0, right = height.length - 1;
  let maxWater = 0;
  while (left < right) {
    const w = right - left;
    const h = Math.min(height[left], height[right]);
    maxWater = Math.max(maxWater, w * h);
    if (height[left] < height[right]) left++;
    else right--;
  }
  return maxWater;
}`,
    rust: `pub fn max_area(height: Vec<i32>) -> i32 {
    let (mut left, mut right) = (0usize, height.len().saturating_sub(1));
    let mut max_water = 0;
    while left < right {
        let w = (right - left) as i32;
        let h = height[left].min(height[right]);
        max_water = max_water.max(w * h);
        if height[left] < height[right] {
            left += 1;
        } else {
            right = right.saturating_sub(1);
        }
    }
    max_water
}`,
  },

  'sort-colors-dutch-flag': {
    cpp: `#include <vector>
#include <utility>
using namespace std;

class Solution {
public:
    void sortColors(vector<int>& nums) {
        int low = 0, mid = 0, high = static_cast<int>(nums.size()) - 1;
        while (mid <= high) {
            if (nums[mid] == 0) {
                swap(nums[low++], nums[mid++]);
            } else if (nums[mid] == 1) {
                mid++;
            } else {
                swap(nums[mid], nums[high--]);
            }
        }
    }
};`,
    go: `package main

func sortColors(nums []int) {
    low, mid, high := 0, 0, len(nums)-1
    for mid <= high {
        if nums[mid] == 0 {
            nums[low], nums[mid] = nums[mid], nums[low]
            low++
            mid++
        } else if nums[mid] == 1 {
            mid++
        } else {
            nums[mid], nums[high] = nums[high], nums[mid]
            high--
        }
    }
}`,
    typescript: `export function sortColors(nums: number[]): number[] {
  let low = 0, mid = 0, high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
  return nums;
}`,
    rust: `pub fn sort_colors(nums: &mut [i32]) {
    let (mut low, mut mid) = (0usize, 0usize);
    let mut high = nums.len() as isize - 1;
    while (mid as isize) <= high {
        match nums[mid] {
            0 => {
                nums.swap(low, mid);
                low += 1;
                mid += 1;
            }
            1 => {
                mid += 1;
            }
            _ => {
                nums.swap(mid, high as usize);
                high -= 1;
            }
        }
    }
}`,
  },

  'kadane-max-subarray': {
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int maxSubArray(const vector<int>& nums) {
        int curSum = nums[0], bestSum = nums[0];
        for (size_t i = 1; i < nums.size(); i++) {
            curSum = max(nums[i], curSum + nums[i]);
            bestSum = max(bestSum, curSum);
        }
        return bestSum;
    }
};`,
    go: `package main

func maxSubArray(nums []int) int {
    curSum, bestSum := nums[0], nums[0]
    for i := 1; i < len(nums); i++ {
        if curSum+nums[i] < nums[i] {
            curSum = nums[i]
        } else {
            curSum = curSum + nums[i]
        }
        if curSum > bestSum {
            bestSum = curSum
        }
    }
    return bestSum
}`,
    typescript: `export function maxSubArray(nums: number[]): number {
  let curSum = nums[0];
  let bestSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    curSum = Math.max(nums[i], curSum + nums[i]);
    if (curSum > bestSum) {
      bestSum = curSum;
    }
  }
  return bestSum;
}`,
    rust: `pub fn max_sub_array(nums: &[i32]) -> i32 {
    let (mut cur_sum, mut best_sum) = (nums[0], nums[0]);
    for &x in &nums[1..] {
        cur_sum = x.max(cur_sum + x);
        best_sum = best_sum.max(cur_sum);
    }
    best_sum
}`,
  },

  'merge-intervals-greedy': {
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        sort(intervals.begin(), intervals.end());
        vector<vector<int>> merged = {intervals[0]};
        for (size_t i = 1; i < intervals.size(); i++) {
            if (intervals[i][0] <= merged.back()[1]) {
                merged.back()[1] = max(merged.back()[1], intervals[i][1]);
            } else {
                merged.push_back(intervals[i]);
            }
        }
        return merged;
    }
};`,
    go: `package main

import "sort"

func merge(intervals [][]int) [][]int {
    sort.Slice(intervals, func(i, j int) bool {
        return intervals[i][0] < intervals[j][0]
    })
    merged := [][]int{intervals[0]}
    for i := 1; i < len(intervals); i++ {
        last := merged[len(merged)-1]
        if intervals[i][0] <= last[1] {
            if intervals[i][1] > last[1] {
                last[1] = intervals[i][1]
            }
        } else {
            merged = append(merged, intervals[i])
        }
    }
    return merged
}`,
    typescript: `export function merge(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      merged.push(intervals[i]);
    }
  }
  return merged;
}`,
    rust: `pub fn merge(mut intervals: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
    intervals.sort_by_key(|iv| iv[0]);
    let mut merged: Vec<Vec<i32>> = vec![intervals[0].clone()];
    for iv in intervals.into_iter().skip(1) {
        let last = merged.last_mut().unwrap();
        if iv[0] <= last[1] {
            last[1] = last[1].max(iv[1]);
        } else {
            merged.push(iv);
        }
    }
    merged
}`,
  },
};
