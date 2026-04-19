import 'dotenv/config';
import { PrismaClient, Difficulty } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const questions = [
  // ═══════════════════════════════════════════════
  // EASY (14 câu)
  // ═══════════════════════════════════════════════

  {
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    description:
      'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
    difficulty: Difficulty.EASY,
    tags: ['linked-list', 'recursion'],
    constraints:
      'The number of nodes in the list is in the range [0, 5000].\n-5000 <= Node.val <= 5000',
    hints: [
      'Keep track of prev, curr, and next pointers.',
      'At each step: save next, point curr.next to prev, advance both pointers.',
    ],
    testCases: [
      {
        input: '[1,2,3,4,5]',
        expectedOutput: '[5,4,3,2,1]',
        isSample: true,
        order: 1,
      },
      { input: '[1,2]', expectedOutput: '[2,1]', isSample: true, order: 2 },
      { input: '[]', expectedOutput: '[]', isSample: false, order: 3 },
      { input: '[1]', expectedOutput: '[1]', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Invert Binary Tree',
    slug: 'invert-binary-tree',
    description:
      'Given the `root` of a binary tree, invert the tree, and return its root.',
    difficulty: Difficulty.EASY,
    tags: ['tree', 'depth-first-search', 'breadth-first-search', 'binary-tree'],
    constraints:
      'The number of nodes in the tree is in the range [0, 100].\n-100 <= Node.val <= 100',
    hints: [
      'Recursively swap left and right children for every node.',
      'Base case: if node is null, return null.',
    ],
    testCases: [
      {
        input: '[4,2,7,1,3,6,9]',
        expectedOutput: '[4,7,2,9,6,3,1]',
        isSample: true,
        order: 1,
      },
      { input: '[2,1,3]', expectedOutput: '[2,3,1]', isSample: true, order: 2 },
      { input: '[]', expectedOutput: '[]', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Maximum Depth of Binary Tree',
    slug: 'maximum-depth-of-binary-tree',
    description:
      "Given the `root` of a binary tree, return its maximum depth.\n\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    difficulty: Difficulty.EASY,
    tags: ['tree', 'depth-first-search', 'breadth-first-search', 'binary-tree'],
    constraints:
      'The number of nodes in the tree is in the range [0, 10^4].\n-100 <= Node.val <= 100',
    hints: [
      'DFS: depth(node) = 1 + max(depth(left), depth(right)).',
      'BFS: count levels using a queue.',
    ],
    testCases: [
      {
        input: '[3,9,20,null,null,15,7]',
        expectedOutput: '3',
        isSample: true,
        order: 1,
      },
      { input: '[1,null,2]', expectedOutput: '2', isSample: true, order: 2 },
      { input: '[]', expectedOutput: '0', isSample: false, order: 3 },
      { input: '[0]', expectedOutput: '1', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Symmetric Tree',
    slug: 'symmetric-tree',
    description:
      'Given the `root` of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center).',
    difficulty: Difficulty.EASY,
    tags: ['tree', 'depth-first-search', 'breadth-first-search', 'binary-tree'],
    constraints:
      'The number of nodes in the tree is in the range [1, 1000].\n-100 <= Node.val <= 100',
    hints: [
      'Use a helper isMirror(left, right) that checks both sides simultaneously.',
      'Two trees are mirrors if their roots are equal and each left subtree mirrors the right subtree.',
    ],
    testCases: [
      {
        input: '[1,2,2,3,4,4,3]',
        expectedOutput: 'true',
        isSample: true,
        order: 1,
      },
      {
        input: '[1,2,2,null,3,null,3]',
        expectedOutput: 'false',
        isSample: true,
        order: 2,
      },
      { input: '[1]', expectedOutput: 'true', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Single Number',
    slug: 'single-number',
    description:
      'Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with a linear runtime complexity and use only constant extra space.',
    difficulty: Difficulty.EASY,
    tags: ['array', 'bit-manipulation'],
    constraints:
      '1 <= nums.length <= 3 * 10^4\n-3 * 10^4 <= nums[i] <= 3 * 10^4\nEach element in the array appears twice except for one element which appears only once.',
    hints: [
      'XOR of a number with itself is 0, and XOR with 0 is the number itself.',
      'XOR all elements together — duplicates cancel out, leaving the single number.',
    ],
    testCases: [
      { input: '[2,2,1]', expectedOutput: '1', isSample: true, order: 1 },
      { input: '[4,1,2,1,2]', expectedOutput: '4', isSample: true, order: 2 },
      { input: '[1]', expectedOutput: '1', isSample: false, order: 3 },
      { input: '[0,1,0]', expectedOutput: '1', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Move Zeroes',
    slug: 'move-zeroes',
    description:
      "Given an integer array `nums`, move all `0`'s to the end of it while maintaining the relative order of the non-zero elements.\n\nNote that you must do this **in-place** without making a copy of the array.",
    difficulty: Difficulty.EASY,
    tags: ['array', 'two-pointers'],
    constraints: '1 <= nums.length <= 10^4\n-2^31 <= nums[i] <= 2^31 - 1',
    hints: [
      'Use a slow pointer to track the position where the next non-zero element should go.',
      'After placing all non-zeros, fill the rest with zeros.',
    ],
    testCases: [
      {
        input: '[0,1,0,3,12]',
        expectedOutput: '[1,3,12,0,0]',
        isSample: true,
        order: 1,
      },
      { input: '[0]', expectedOutput: '[0]', isSample: true, order: 2 },
      {
        input: '[1,0,0,2,3]',
        expectedOutput: '[1,2,3,0,0]',
        isSample: false,
        order: 3,
      },
      { input: '[1]', expectedOutput: '[1]', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Linked List Cycle',
    slug: 'linked-list-cycle',
    description:
      'Given `head`, the head of a linked list, determine if the linked list has a cycle in it.\n\nReturn `true` if there is a cycle in the linked list. Otherwise, return `false`.',
    difficulty: Difficulty.EASY,
    tags: ['hash-table', 'linked-list', 'two-pointers'],
    constraints:
      'The number of nodes in the list is in the range [0, 10^4].\n-10^5 <= Node.val <= 10^5',
    hints: [
      "Floyd's Cycle Detection: use a slow pointer (1 step) and a fast pointer (2 steps).",
      'If they ever meet, there is a cycle.',
    ],
    testCases: [
      {
        input: '[3,2,0,-4]\npos=1',
        expectedOutput: 'true',
        isSample: true,
        order: 1,
      },
      {
        input: '[1,2]\npos=0',
        expectedOutput: 'true',
        isSample: true,
        order: 2,
      },
      {
        input: '[1]\npos=-1',
        expectedOutput: 'false',
        isSample: false,
        order: 3,
      },
    ],
  },

  {
    title: 'Count Primes',
    slug: 'count-primes',
    description:
      'Given an integer `n`, return the number of prime numbers that are strictly less than `n`.',
    difficulty: Difficulty.EASY,
    tags: ['array', 'math', 'enumeration', 'number-theory'],
    constraints: '0 <= n <= 5 * 10^6',
    hints: [
      'Use the Sieve of Eratosthenes: mark multiples of each prime as composite.',
      'Start from 2, mark 4, 6, 8... then 3, mark 9, 12... and so on up to sqrt(n).',
    ],
    testCases: [
      { input: '10', expectedOutput: '4', isSample: true, order: 1 },
      { input: '0', expectedOutput: '0', isSample: true, order: 2 },
      { input: '1', expectedOutput: '0', isSample: false, order: 3 },
      { input: '20', expectedOutput: '8', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Is Balanced Binary Tree',
    slug: 'balanced-binary-tree',
    description:
      'Given a binary tree, determine if it is **height-balanced**.\n\nA height-balanced binary tree is a binary tree in which the depth of the two subtrees of every node never differs by more than one.',
    difficulty: Difficulty.EASY,
    tags: ['tree', 'depth-first-search', 'binary-tree'],
    constraints:
      'The number of nodes in the tree is in the range [0, 5000].\n-10^4 <= Node.val <= 10^4',
    hints: [
      'Write a helper that returns the height of a subtree, or -1 if it is unbalanced.',
      'At each node, check if both subtrees are balanced and their height difference <= 1.',
    ],
    testCases: [
      {
        input: '[3,9,20,null,null,15,7]',
        expectedOutput: 'true',
        isSample: true,
        order: 1,
      },
      {
        input: '[1,2,2,3,3,null,null,4,4]',
        expectedOutput: 'false',
        isSample: true,
        order: 2,
      },
      { input: '[]', expectedOutput: 'true', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Majority Element',
    slug: 'majority-element',
    description:
      'Given an array `nums` of size `n`, return the majority element.\n\nThe majority element is the element that appears more than `⌊n / 2⌋` times. You may assume that the majority element always exists in the array.',
    difficulty: Difficulty.EASY,
    tags: ['array', 'hash-table', 'sorting', 'counting'],
    constraints:
      'n == nums.length\n1 <= n <= 5 * 10^4\n-10^9 <= nums[i] <= 10^9',
    hints: [
      'Boyer-Moore Voting Algorithm: maintain a candidate and a count.',
      'Increment count if current element equals candidate; decrement otherwise. Reset when count reaches 0.',
    ],
    testCases: [
      { input: '[3,2,3]', expectedOutput: '3', isSample: true, order: 1 },
      {
        input: '[2,2,1,1,1,2,2]',
        expectedOutput: '2',
        isSample: true,
        order: 2,
      },
      { input: '[1]', expectedOutput: '1', isSample: false, order: 3 },
      { input: '[6,5,5]', expectedOutput: '5', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Missing Number',
    slug: 'missing-number',
    description:
      'Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing from the array.',
    difficulty: Difficulty.EASY,
    tags: ['array', 'hash-table', 'math', 'bit-manipulation'],
    constraints:
      'n == nums.length\n1 <= n <= 10^4\n0 <= nums[i] <= n\nAll the numbers of nums are unique.',
    hints: [
      'Expected sum = n*(n+1)/2. Subtract the actual sum to find the missing number.',
      'Alternatively, XOR all indices and all values — the missing number remains.',
    ],
    testCases: [
      { input: '[3,0,1]', expectedOutput: '2', isSample: true, order: 1 },
      { input: '[0,1]', expectedOutput: '2', isSample: true, order: 2 },
      {
        input: '[9,6,4,2,3,5,7,0,1]',
        expectedOutput: '8',
        isSample: false,
        order: 3,
      },
      { input: '[0]', expectedOutput: '1', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Intersection of Two Arrays',
    slug: 'intersection-of-two-arrays',
    description:
      'Given two integer arrays `nums1` and `nums2`, return an array of their intersection. Each element in the result must be unique and you may return the result in any order.',
    difficulty: Difficulty.EASY,
    tags: ['array', 'hash-table', 'two-pointers', 'sorting'],
    constraints:
      '1 <= nums1.length, nums2.length <= 1000\n0 <= nums1[i], nums2[i] <= 1000',
    hints: [
      'Convert one array to a Set, then iterate the other and collect matches.',
    ],
    testCases: [
      {
        input: '[1,2,2,1]\n[2,2]',
        expectedOutput: '[2]',
        isSample: true,
        order: 1,
      },
      {
        input: '[4,9,5]\n[9,4,9,8,4]',
        expectedOutput: '[9,4]',
        isSample: true,
        order: 2,
      },
      {
        input: '[1,2,3]\n[4,5,6]',
        expectedOutput: '[]',
        isSample: false,
        order: 3,
      },
    ],
  },

  {
    title: 'Excel Sheet Column Number',
    slug: 'excel-sheet-column-number',
    description:
      'Given a string `columnTitle` that represents the column title as appears in an Excel spreadsheet, return its corresponding column number.\n\nFor example: A -> 1, B -> 2, ..., Z -> 26, AA -> 27, AB -> 28.',
    difficulty: Difficulty.EASY,
    tags: ['math', 'string'],
    constraints:
      '1 <= columnTitle.length <= 7\ncolumnTitle consists only of uppercase English letters.\ncolumnTitle is in the range ["A", "FXSHRXW"].',
    hints: [
      'Think of it as converting a base-26 number.',
      'result = result * 26 + (char - "A" + 1) for each character.',
    ],
    testCases: [
      { input: '"A"', expectedOutput: '1', isSample: true, order: 1 },
      { input: '"AB"', expectedOutput: '28', isSample: true, order: 2 },
      { input: '"ZY"', expectedOutput: '701', isSample: false, order: 3 },
      {
        input: '"FXSHRXW"',
        expectedOutput: '2147483647',
        isSample: false,
        order: 4,
      },
    ],
  },

  {
    title: 'Implement Stack Using Queues',
    slug: 'implement-stack-using-queues',
    description:
      'Implement a last-in-first-out (LIFO) stack using only two queues. The implemented stack should support all the functions of a normal stack (`push`, `top`, `pop`, and `empty`).',
    difficulty: Difficulty.EASY,
    tags: ['stack', 'design', 'queue'],
    constraints:
      '1 <= x <= 9\nAt most 100 calls will be made to push, pop, top, and empty.\nAll calls to pop and top are valid.',
    hints: [
      'On push, enqueue to q2, then move all of q1 into q2, then swap q1 and q2.',
      'This makes pop and top O(1) at the cost of O(n) push.',
    ],
    testCases: [
      {
        input:
          '["MyStack","push","push","top","pop","empty"]\n[[],[1],[2],[],[],[]]',
        expectedOutput: '[null,null,null,2,2,false]',
        isSample: true,
        order: 1,
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // MEDIUM (20 câu)
  // ═══════════════════════════════════════════════

  {
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    description:
      'Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'hash-table', 'string', 'sorting'],
    constraints:
      '1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100\nstrs[i] consists of lowercase English letters.',
    hints: [
      'Sort each string alphabetically to get a canonical key, then group by key.',
      'Alternatively, use a character-frequency tuple as the key.',
    ],
    testCases: [
      {
        input: '["eat","tea","tan","ate","nat","bat"]',
        expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
        isSample: true,
        order: 1,
      },
      { input: '[""]', expectedOutput: '[[""]]', isSample: true, order: 2 },
      { input: '["a"]', expectedOutput: '[["a"]]', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Top K Frequent Elements',
    slug: 'top-k-frequent-elements',
    description:
      'Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'hash-table', 'sorting', 'heap'],
    constraints:
      '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4\nk is in the range [1, the number of unique elements in the array].',
    hints: [
      'Count frequencies with a hash map, then extract top-k using a min-heap of size k.',
      'Bucket sort approach: create buckets by frequency (index = count), O(n).',
    ],
    testCases: [
      {
        input: '[1,1,1,2,2,3]\n2',
        expectedOutput: '[1,2]',
        isSample: true,
        order: 1,
      },
      { input: '[1]\n1', expectedOutput: '[1]', isSample: true, order: 2 },
      {
        input: '[4,1,1,4,2,2,2]\n2',
        expectedOutput: '[2,1]',
        isSample: false,
        order: 3,
      },
    ],
  },

  {
    title: 'Encode and Decode Strings',
    slug: 'encode-and-decode-strings',
    description:
      'Design an algorithm to encode a list of strings to a single string. The encoded string is then sent over the network and is decoded back to the original list of strings.\n\nImplement `encode(strs)` and `decode(s)`.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'string', 'design'],
    constraints:
      '1 <= strs.length <= 200\n0 <= strs[i].length <= 200\nstrs[i] contains any possible characters out of 256 valid ASCII characters.',
    hints: [
      'Prefix each string with its length followed by a delimiter, e.g. "4#word".',
      'On decode, read the length, then jump exactly that many characters.',
    ],
    testCases: [
      {
        input: '["lint","code","love","you"]',
        expectedOutput: '["lint","code","love","you"]',
        isSample: true,
        order: 1,
      },
      {
        input: '["we","say",":","yes"]',
        expectedOutput: '["we","say",":","yes"]',
        isSample: false,
        order: 2,
      },
    ],
  },

  {
    title: 'Validate Binary Search Tree',
    slug: 'validate-binary-search-tree',
    description:
      "Given the `root` of a binary tree, determine if it is a valid binary search tree (BST).\n\nA valid BST is defined as follows:\n- The left subtree of a node contains only nodes with keys **less than** the node's key.\n- The right subtree of a node contains only nodes with keys **greater than** the node's key.\n- Both the left and right subtrees must also be binary search trees.",
    difficulty: Difficulty.MEDIUM,
    tags: ['tree', 'depth-first-search', 'binary-search-tree', 'binary-tree'],
    constraints:
      'The number of nodes in the tree is in the range [1, 10^4].\n-2^31 <= Node.val <= 2^31 - 1',
    hints: [
      'Pass down min and max bounds as you recurse.',
      'Left child must be < node.val; right child must be > node.val.',
    ],
    testCases: [
      { input: '[2,1,3]', expectedOutput: 'true', isSample: true, order: 1 },
      {
        input: '[5,1,4,null,null,3,6]',
        expectedOutput: 'false',
        isSample: true,
        order: 2,
      },
      { input: '[2,2,2]', expectedOutput: 'false', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Binary Tree Level Order Traversal',
    slug: 'binary-tree-level-order-traversal',
    description:
      "Given the `root` of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
    difficulty: Difficulty.MEDIUM,
    tags: ['tree', 'breadth-first-search', 'binary-tree'],
    constraints:
      'The number of nodes in the tree is in the range [0, 2000].\n-1000 <= Node.val <= 1000',
    hints: [
      'Use a queue. At the start of each iteration, the queue holds all nodes of the current level.',
      'Process them all, enqueueing their children — those become the next level.',
    ],
    testCases: [
      {
        input: '[3,9,20,null,null,15,7]',
        expectedOutput: '[[3],[9,20],[15,7]]',
        isSample: true,
        order: 1,
      },
      { input: '[1]', expectedOutput: '[[1]]', isSample: true, order: 2 },
      { input: '[]', expectedOutput: '[]', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Construct Binary Tree from Preorder and Inorder Traversal',
    slug: 'construct-binary-tree-from-preorder-and-inorder',
    description:
      'Given two integer arrays `preorder` and `inorder` where `preorder` is the preorder traversal of a binary tree and `inorder` is the inorder traversal of the same tree, construct and return the binary tree.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'hash-table', 'divide-and-conquer', 'tree', 'binary-tree'],
    constraints:
      '1 <= preorder.length <= 3000\ninorder.length == preorder.length\n-3000 <= preorder[i], inorder[i] <= 3000\npreorder and inorder consist of unique values.\nEach value of inorder also appears in preorder.',
    hints: [
      'The first element of preorder is always the root.',
      'Find the root in inorder to determine left/right subtree sizes, then recurse.',
    ],
    testCases: [
      {
        input: '[3,9,20,15,7]\n[9,3,15,20,7]',
        expectedOutput: '[3,9,20,null,null,15,7]',
        isSample: true,
        order: 1,
      },
      { input: '[-1]\n[-1]', expectedOutput: '[-1]', isSample: true, order: 2 },
    ],
  },

  {
    title: 'Kth Smallest Element in a BST',
    slug: 'kth-smallest-element-in-bst',
    description:
      'Given the `root` of a binary search tree, and an integer `k`, return the `k`th smallest value (1-indexed) of all the values of the nodes in the tree.',
    difficulty: Difficulty.MEDIUM,
    tags: ['tree', 'depth-first-search', 'binary-search-tree', 'binary-tree'],
    constraints:
      'The number of nodes in the tree is n.\n1 <= k <= n <= 10^4\n0 <= Node.val <= 10^4',
    hints: [
      'In-order traversal of a BST gives values in sorted ascending order.',
      'The k-th element visited during in-order traversal is the answer.',
    ],
    testCases: [
      {
        input: '[3,1,4,null,2]\n1',
        expectedOutput: '1',
        isSample: true,
        order: 1,
      },
      {
        input: '[5,3,6,2,4,null,null,1]\n3',
        expectedOutput: '3',
        isSample: true,
        order: 2,
      },
      {
        input: '[1,null,2]\n2',
        expectedOutput: '2',
        isSample: false,
        order: 3,
      },
    ],
  },

  {
    title: 'Lowest Common Ancestor of a BST',
    slug: 'lowest-common-ancestor-of-bst',
    description:
      'Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.\n\nThe lowest common ancestor is defined between two nodes `p` and `q` as the lowest node in `T` that has both `p` and `q` as descendants (where we allow a node to be a descendant of itself).',
    difficulty: Difficulty.MEDIUM,
    tags: ['tree', 'depth-first-search', 'binary-search-tree', 'binary-tree'],
    constraints:
      'The number of nodes in the tree is in the range [2, 10^5].\n-10^9 <= Node.val <= 10^9\nAll Node.val are unique.\np != q\np and q will exist in the BST.',
    hints: [
      'Use BST property: if both p and q are less than root, LCA is in the left subtree.',
      'If both are greater, LCA is in the right subtree. Otherwise, root is the LCA.',
    ],
    testCases: [
      {
        input: '[6,2,8,0,4,7,9,null,null,3,5]\np=2\nq=8',
        expectedOutput: '6',
        isSample: true,
        order: 1,
      },
      {
        input: '[6,2,8,0,4,7,9,null,null,3,5]\np=2\nq=4',
        expectedOutput: '2',
        isSample: true,
        order: 2,
      },
    ],
  },

  {
    title: 'Combination Sum',
    slug: 'combination-sum',
    description:
      'Given an array of distinct integers `candidates` and a target integer `target`, return a list of all unique combinations of `candidates` where the chosen numbers sum to `target`. You may return the combinations in any order.\n\nThe same number may be chosen from `candidates` an unlimited number of times.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'backtracking'],
    constraints:
      '1 <= candidates.length <= 30\n2 <= candidates[i] <= 40\nAll elements of candidates are distinct.\n1 <= target <= 40',
    hints: [
      'Use backtracking: at each step, choose a candidate and recurse with remaining target.',
      'To avoid duplicates, only iterate from the current index onward.',
    ],
    testCases: [
      {
        input: '[2,3,6,7]\n7',
        expectedOutput: '[[2,2,3],[7]]',
        isSample: true,
        order: 1,
      },
      {
        input: '[2,3,5]\n8',
        expectedOutput: '[[2,2,2,2],[2,3,3],[3,5]]',
        isSample: true,
        order: 2,
      },
      { input: '[2]\n1', expectedOutput: '[]', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Permutations',
    slug: 'permutations',
    description:
      'Given an array `nums` of distinct integers, return all the possible permutations. You can return the answer in any order.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'backtracking'],
    constraints:
      '1 <= nums.length <= 6\n-10 <= nums[i] <= 10\nAll the integers of nums are unique.',
    hints: [
      'Backtracking: at each position, try every unused number.',
      'Use a boolean visited array to mark which elements are already in the current permutation.',
    ],
    testCases: [
      {
        input: '[1,2,3]',
        expectedOutput: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]',
        isSample: true,
        order: 1,
      },
      {
        input: '[0,1]',
        expectedOutput: '[[0,1],[1,0]]',
        isSample: true,
        order: 2,
      },
      { input: '[1]', expectedOutput: '[[1]]', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Subsets',
    slug: 'subsets',
    description:
      'Given an integer array `nums` of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets. Return the solution in any order.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'backtracking', 'bit-manipulation'],
    constraints:
      '1 <= nums.length <= 10\n-10 <= nums[i] <= 10\nAll the numbers of nums are unique.',
    hints: [
      'Backtracking: at each index, choose to include or exclude the element.',
      'Alternatively, iterate from 0 to 2^n and use bit masking.',
    ],
    testCases: [
      {
        input: '[1,2,3]',
        expectedOutput: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]',
        isSample: true,
        order: 1,
      },
      { input: '[0]', expectedOutput: '[[],[0]]', isSample: true, order: 2 },
    ],
  },

  {
    title: 'Word Search',
    slug: 'word-search',
    description:
      'Given an `m x n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'backtracking', 'depth-first-search', 'matrix'],
    constraints:
      'm == board.length\nn = board[i].length\n1 <= m, n <= 6\n1 <= word.length <= 15\nboard and word consists of only lowercase and uppercase English letters.',
    hints: [
      'DFS + backtracking: for each cell matching word[0], start a DFS.',
      "Mark cells as visited (e.g., '#') before recursing and restore afterward.",
    ],
    testCases: [
      {
        input:
          '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\n"ABCCED"',
        expectedOutput: 'true',
        isSample: true,
        order: 1,
      },
      {
        input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\n"SEE"',
        expectedOutput: 'true',
        isSample: true,
        order: 2,
      },
      {
        input:
          '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\n"ABCB"',
        expectedOutput: 'false',
        isSample: false,
        order: 3,
      },
    ],
  },

  {
    title: 'Jump Game',
    slug: 'jump-game',
    description:
      "You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\nReturn `true` if you can reach the last index, or `false` otherwise.",
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'dynamic-programming', 'greedy'],
    constraints: '1 <= nums.length <= 10^4\n0 <= nums[i] <= 10^5',
    hints: [
      'Greedy: track the farthest index reachable so far.',
      'If the current index exceeds the farthest reachable, return false.',
    ],
    testCases: [
      {
        input: '[2,3,1,1,4]',
        expectedOutput: 'true',
        isSample: true,
        order: 1,
      },
      {
        input: '[3,2,1,0,4]',
        expectedOutput: 'false',
        isSample: true,
        order: 2,
      },
      { input: '[0]', expectedOutput: 'true', isSample: false, order: 3 },
      { input: '[1,0,0]', expectedOutput: 'false', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Unique Paths',
    slug: 'unique-paths',
    description:
      'There is a robot on an `m x n` grid. The robot is initially located at the **top-left corner**. The robot tries to move to the **bottom-right corner**. The robot can only move either **down** or **right** at any point in time.\n\nGiven the two integers `m` and `n`, return the number of possible unique paths.',
    difficulty: Difficulty.MEDIUM,
    tags: ['math', 'dynamic-programming', 'combinatorics'],
    constraints: '1 <= m, n <= 100',
    hints: [
      'dp[i][j] = dp[i-1][j] + dp[i][j-1]. Base case: first row and first column are all 1.',
      'Mathematical solution: C(m+n-2, m-1) (combinations).',
    ],
    testCases: [
      { input: '3\n7', expectedOutput: '28', isSample: true, order: 1 },
      { input: '3\n2', expectedOutput: '3', isSample: true, order: 2 },
      { input: '1\n1', expectedOutput: '1', isSample: false, order: 3 },
      { input: '7\n3', expectedOutput: '28', isSample: false, order: 4 },
    ],
  },

  {
    title: 'House Robber',
    slug: 'house-robber',
    description:
      'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and it will automatically contact the police if two adjacent houses were broken into on the same night.\n\nGiven an integer array `nums` representing the amount of money of each house, return the maximum amount of money you can rob tonight without alerting the police.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'dynamic-programming'],
    constraints: '1 <= nums.length <= 100\n0 <= nums[i] <= 400',
    hints: [
      'dp[i] = max(dp[i-1], dp[i-2] + nums[i]).',
      'You only need the previous two values, so this can be done in O(1) space.',
    ],
    testCases: [
      { input: '[1,2,3,1]', expectedOutput: '4', isSample: true, order: 1 },
      { input: '[2,7,9,3,1]', expectedOutput: '12', isSample: true, order: 2 },
      { input: '[2,1]', expectedOutput: '2', isSample: false, order: 3 },
      { input: '[1,2,3,4,5]', expectedOutput: '9', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Decode Ways',
    slug: 'decode-ways',
    description:
      'A message containing letters from `A-Z` can be encoded into numbers using the mapping: `\'A\' -> "1"`, `\'B\' -> "2"`, ..., `\'Z\' -> "26"`.\n\nGiven a string `s` containing only digits, return the number of ways to decode it.',
    difficulty: Difficulty.MEDIUM,
    tags: ['string', 'dynamic-programming'],
    constraints:
      '1 <= s.length <= 100\ns contains only digits and may contain leading zeros.',
    hints: [
      'dp[i] = number of ways to decode s[0..i-1].',
      'If s[i-1] != "0", dp[i] += dp[i-1]. If s[i-2..i-1] is in ["10".."26"], dp[i] += dp[i-2].',
    ],
    testCases: [
      { input: '"12"', expectedOutput: '2', isSample: true, order: 1 },
      { input: '"226"', expectedOutput: '3', isSample: true, order: 2 },
      { input: '"06"', expectedOutput: '0', isSample: false, order: 3 },
      { input: '"11106"', expectedOutput: '2', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Maximum Product Subarray',
    slug: 'maximum-product-subarray',
    description:
      'Given an integer array `nums`, find a subarray that has the largest product, and return the product.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'dynamic-programming'],
    constraints:
      '1 <= nums.length <= 2 * 10^4\n-10 <= nums[i] <= 10\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.',
    hints: [
      'Track both the maximum and minimum product ending at the current index (negatives can flip).',
      'maxProd = max(num, maxProd*num, minProd*num); similarly for minProd.',
    ],
    testCases: [
      { input: '[2,3,-2,4]', expectedOutput: '6', isSample: true, order: 1 },
      { input: '[-2,0,-1]', expectedOutput: '0', isSample: true, order: 2 },
      { input: '[-2,3,-4]', expectedOutput: '24', isSample: false, order: 3 },
      { input: '[0,2]', expectedOutput: '2', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Pacific Atlantic Water Flow',
    slug: 'pacific-atlantic-water-flow',
    description:
      "There is an `m x n` rectangular island that borders both the Pacific Ocean and Atlantic Ocean. The Pacific Ocean touches the island's left and top edges, and the Atlantic Ocean touches the island's right and bottom edges.\n\nWater can only flow in four directions (up, down, left, right) from a cell to an adjacent one with an equal or lower height.\n\nReturn a list of grid coordinates `result` where `result[i] = [ri, ci]` denotes that rain water can flow from cell `(ri, ci)` to **both** the Pacific and Atlantic oceans.",
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'depth-first-search', 'breadth-first-search', 'matrix'],
    constraints:
      'm == heights.length\nn == heights[r].length\n1 <= m, n <= 200\n0 <= heights[r][c] <= 10^5',
    hints: [
      'Reverse the direction: BFS/DFS from ocean borders, going uphill.',
      'Find cells reachable from Pacific and cells reachable from Atlantic, then intersect.',
    ],
    testCases: [
      {
        input: '[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]',
        expectedOutput: '[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]',
        isSample: true,
        order: 1,
      },
      { input: '[[1]]', expectedOutput: '[[0,0]]', isSample: true, order: 2 },
    ],
  },

  {
    title: 'Course Schedule',
    slug: 'course-schedule',
    description:
      'There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you must take course `bi` first if you want to take course `ai`.\n\nReturn `true` if you can finish all courses. Otherwise, return `false`.',
    difficulty: Difficulty.MEDIUM,
    tags: [
      'depth-first-search',
      'breadth-first-search',
      'graph',
      'topological-sort',
    ],
    constraints:
      '1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000\nprerequisites[i].length == 2\n0 <= ai, bi < numCourses\nAll the pairs prerequisites[i] are unique.',
    hints: [
      'Build a directed graph. The answer is false iff there is a cycle.',
      "Use DFS with three states (unvisited, visiting, visited) — 'visiting' a node you're currently exploring signals a cycle.",
    ],
    testCases: [
      { input: '2\n[[1,0]]', expectedOutput: 'true', isSample: true, order: 1 },
      {
        input: '2\n[[1,0],[0,1]]',
        expectedOutput: 'false',
        isSample: true,
        order: 2,
      },
      {
        input: '5\n[[1,4],[2,4],[3,1],[3,2]]',
        expectedOutput: 'true',
        isSample: false,
        order: 3,
      },
    ],
  },

  {
    title: 'Rotting Oranges',
    slug: 'rotting-oranges',
    description:
      'You are given an `m x n` grid where each cell can have one of three values:\n- `0` representing an empty cell,\n- `1` representing a fresh orange,\n- `2` representing a rotten orange.\n\nEvery minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten.\n\nReturn the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return `-1`.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'breadth-first-search', 'matrix'],
    constraints:
      'm == grid.length\nn == grid[i].length\n1 <= m, n <= 10\ngrid[i][j] is 0, 1, or 2.',
    hints: [
      'Multi-source BFS: start from all initially rotten oranges simultaneously.',
      'Count fresh oranges; decrement when each turns rotten. Time = BFS levels.',
    ],
    testCases: [
      {
        input: '[[2,1,1],[1,1,0],[0,1,1]]',
        expectedOutput: '4',
        isSample: true,
        order: 1,
      },
      {
        input: '[[2,1,1],[0,1,1],[1,0,1]]',
        expectedOutput: '-1',
        isSample: true,
        order: 2,
      },
      { input: '[[0,2]]', expectedOutput: '0', isSample: false, order: 3 },
    ],
  },

  // ═══════════════════════════════════════════════
  // HARD (6 câu)
  // ═══════════════════════════════════════════════

  {
    title: 'Sliding Window Maximum',
    slug: 'sliding-window-maximum',
    description:
      'You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. You can only see the `k` numbers in the window. Each time the sliding window moves right by one position.\n\nReturn the max sliding window.',
    difficulty: Difficulty.HARD,
    tags: ['array', 'queue', 'sliding-window', 'heap', 'monotonic-queue'],
    constraints:
      '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4\n1 <= k <= nums.length',
    hints: [
      'Use a monotonic deque (decreasing order) storing indices.',
      'Remove elements outside the window from the front; remove smaller elements from the back before inserting.',
    ],
    testCases: [
      {
        input: '[1,3,-1,-3,5,3,6,7]\n3',
        expectedOutput: '[3,3,5,5,6,7]',
        isSample: true,
        order: 1,
      },
      { input: '[1]\n1', expectedOutput: '[1]', isSample: true, order: 2 },
      {
        input: '[1,-1]\n1',
        expectedOutput: '[1,-1]',
        isSample: false,
        order: 3,
      },
      { input: '[9,11]\n2', expectedOutput: '[11]', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Serialize and Deserialize Binary Tree',
    slug: 'serialize-and-deserialize-binary-tree',
    description:
      'Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.\n\nDesign an algorithm to serialize and deserialize a binary tree. Implement `serialize(root)` and `deserialize(data)`.',
    difficulty: Difficulty.HARD,
    tags: [
      'string',
      'tree',
      'depth-first-search',
      'breadth-first-search',
      'design',
      'binary-tree',
    ],
    constraints:
      'The number of nodes in the tree is in the range [0, 10^4].\n-1000 <= Node.val <= 1000',
    hints: [
      'BFS level-order: serialize null pointers as "null" tokens.',
      'On deserialize, use a queue to reconstruct nodes level by level.',
    ],
    testCases: [
      {
        input: '[1,2,3,null,null,4,5]',
        expectedOutput: '[1,2,3,null,null,4,5]',
        isSample: true,
        order: 1,
      },
      { input: '[]', expectedOutput: '[]', isSample: true, order: 2 },
      { input: '[1]', expectedOutput: '[1]', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Find Median from Data Stream',
    slug: 'find-median-from-data-stream',
    description:
      'The **median** is the middle value in an ordered integer list. If the size of the list is even, there is no middle value, and the median is the mean of the two middle values.\n\nImplement the `MedianFinder` class:\n- `addNum(int num)` — adds integer `num` from the data stream to the data structure.\n- `findMedian()` — returns the median of all elements so far.',
    difficulty: Difficulty.HARD,
    tags: ['two-pointers', 'design', 'sorting', 'heap', 'data-stream'],
    constraints:
      '-10^5 <= num <= 10^5\nThere will be at least one element in the data structure before calling findMedian.\nAt most 5 * 10^4 calls will be made to addNum and findMedian.',
    hints: [
      'Maintain a max-heap for the lower half and a min-heap for the upper half.',
      'Balance the heaps so their sizes differ by at most 1. Median = top(s) or average of both tops.',
    ],
    testCases: [
      {
        input:
          '["MedianFinder","addNum","addNum","findMedian","addNum","findMedian"]\n[[],[1],[2],[],[3],[]]',
        expectedOutput: '[null,null,null,1.50000,null,2.00000]',
        isSample: true,
        order: 1,
      },
    ],
  },

  {
    title: 'Largest Rectangle in Histogram',
    slug: 'largest-rectangle-in-histogram',
    description:
      "Given an array of integers `heights` representing the histogram's bar height where the width of each bar is `1`, return the area of the largest rectangle in the histogram.",
    difficulty: Difficulty.HARD,
    tags: ['array', 'stack', 'monotonic-stack'],
    constraints: '1 <= heights.length <= 10^5\n0 <= heights[i] <= 10^4',
    hints: [
      'Use a monotonic increasing stack storing indices.',
      'When a shorter bar is found, pop the stack and compute the rectangle width using the current and stack-top indices.',
    ],
    testCases: [
      {
        input: '[2,1,5,6,2,3]',
        expectedOutput: '10',
        isSample: true,
        order: 1,
      },
      { input: '[2,4]', expectedOutput: '4', isSample: true, order: 2 },
      { input: '[1,1]', expectedOutput: '2', isSample: false, order: 3 },
      {
        input: '[6,2,5,4,5,1,6]',
        expectedOutput: '12',
        isSample: false,
        order: 4,
      },
    ],
  },

  {
    title: 'Edit Distance',
    slug: 'edit-distance',
    description:
      'Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`.\n\nYou have the following three operations permitted on a word:\n- Insert a character\n- Delete a character\n- Replace a character',
    difficulty: Difficulty.HARD,
    tags: ['string', 'dynamic-programming'],
    constraints:
      '0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.',
    hints: [
      'dp[i][j] = min edit distance between word1[0..i-1] and word2[0..j-1].',
      'If chars match: dp[i][j] = dp[i-1][j-1]. Else: dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).',
    ],
    testCases: [
      {
        input: '"horse"\n"ros"',
        expectedOutput: '3',
        isSample: true,
        order: 1,
      },
      {
        input: '"intention"\n"execution"',
        expectedOutput: '5',
        isSample: true,
        order: 2,
      },
      { input: '""\n""', expectedOutput: '0', isSample: false, order: 3 },
      { input: '"a"\n"b"', expectedOutput: '1', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Regular Expression Matching',
    slug: 'regular-expression-matching',
    description:
      "Given an input string `s` and a pattern `p`, implement regular expression matching with support for `'.' ` and `'*'` where:\n- `'.'` matches any single character.\n- `'*'` matches zero or more of the preceding element.\n\nThe matching should cover the **entire** input string (not partial).",
    difficulty: Difficulty.HARD,
    tags: ['string', 'dynamic-programming', 'recursion'],
    constraints:
      "1 <= s.length <= 20\n1 <= p.length <= 30\ns contains only lowercase English letters.\np contains only lowercase English letters, '.', and '*'.\nIt is guaranteed for each occurrence of '*', there will be a previous valid character to match.",
    hints: [
      'dp[i][j] = whether s[0..i-1] matches p[0..j-1].',
      "Handle the '*' case by checking zero occurrences (dp[i][j-2]) or one+ occurrences (dp[i-1][j] if chars match).",
    ],
    testCases: [
      { input: '"aa"\n"a"', expectedOutput: 'false', isSample: true, order: 1 },
      { input: '"aa"\n"a*"', expectedOutput: 'true', isSample: true, order: 2 },
      {
        input: '"ab"\n".*"',
        expectedOutput: 'true',
        isSample: false,
        order: 3,
      },
      {
        input: '"mississippi"\n"mis*is*p*."',
        expectedOutput: 'false',
        isSample: false,
        order: 4,
      },
    ],
  },
];

// ─────────────── SEED RUNNER ───────────────

async function main() {
  console.log(
    `🌱 Seeding ${questions.length} additional DSA coding questions...\n`,
  );

  await prisma.$transaction(
    async (tx) => {
      // Upsert questions
      for (const q of questions) {
        await tx.codingQuestion.upsert({
          where: { slug: q.slug },
          update: {
            title: q.title,
            description: q.description,
            difficulty: q.difficulty,
            tags: q.tags,
            constraints: q.constraints ?? '',
            hints: q.hints ?? [],
            isPublished: true,
          },
          create: {
            title: q.title,
            slug: q.slug,
            description: q.description,
            difficulty: q.difficulty,
            tags: q.tags,
            constraints: q.constraints ?? '',
            hints: q.hints ?? [],
            isPublished: true,
            timeLimit: 2000,
            memoryLimit: 256000,
          },
        });
      }

      // Fetch IDs
      const saved = await tx.codingQuestion.findMany({
        where: { slug: { in: questions.map((q) => q.slug) } },
        select: { id: true, slug: true },
      });
      const slugToId = Object.fromEntries(saved.map((q) => [q.slug, q.id]));

      // Upsert test cases — delete existing for these questions then re-insert
      const ids = Object.values(slugToId);
      await tx.testCase.deleteMany({
        where: { codingQuestionId: { in: ids } },
      });

      const allTestCases = questions.flatMap((q) =>
        (q.testCases ?? []).map((tc) => ({
          codingQuestionId: slugToId[q.slug],
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isSample: tc.isSample,
          isHidden: false,
          points: 1,
          order: tc.order,
        })),
      );

      await tx.testCase.createMany({ data: allTestCases });
    },
    {
      maxWait: 30000, // 30 giây để bắt đầu transaction
      timeout: 180000, // 3 phút để hoàn thành (tăng cao vì seed lớn)
    },
  );

  // Summary
  const counts = questions.reduce(
    (acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log('✅ Done!\n');
  console.log(`   EASY   : ${counts['EASY'] ?? 0} questions`);
  console.log(`   MEDIUM : ${counts['MEDIUM'] ?? 0} questions`);
  console.log(`   HARD   : ${counts['HARD'] ?? 0} questions`);
  console.log(`   TOTAL  : ${questions.length} questions`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
