import 'dotenv/config';
import { PrismaClient, Difficulty } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const questions = [
  // ─────────────── EASY (8 câu) ───────────────

  {
    title: 'Two Sum',
    slug: 'two-sum',
    description:
      'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    difficulty: Difficulty.EASY,
    tags: ['array', 'hash-table'],
    constraints:
      '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nOnly one valid answer exists.',
    hints: [
      'Use a hash map to store numbers you have seen so far.',
      'For each number, check if (target - num) already exists in the map.',
    ],
    testCases: [
      { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isSample: true, order: 1 },
      { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isSample: true, order: 2 },
      { input: '[3,3]\n6', expectedOutput: '[0,1]', isSample: false, order: 3 },
      { input: '[1,5,3,7]\n8', expectedOutput: '[1,2]', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    description:
      "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n- Open brackets must be closed by the same type of brackets.\n- Open brackets must be closed in the correct order.\n- Every close bracket has a corresponding open bracket of the same type.",
    difficulty: Difficulty.EASY,
    tags: ['string', 'stack'],
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'",
    hints: [
      'Use a stack. Push opening brackets; pop and verify on closing brackets.',
      "Map each closing bracket to its matching opener: ')' → '('.",
    ],
    testCases: [
      { input: '()', expectedOutput: 'true', isSample: true, order: 1 },
      { input: '()[]{}', expectedOutput: 'true', isSample: true, order: 2 },
      { input: '(]', expectedOutput: 'false', isSample: false, order: 3 },
      { input: '([)]', expectedOutput: 'false', isSample: false, order: 4 },
      { input: '{[]}', expectedOutput: 'true', isSample: false, order: 5 },
    ],
  },

  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    description:
      'You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day **in the future** to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.',
    difficulty: Difficulty.EASY,
    tags: ['array', 'dynamic-programming'],
    constraints: '1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4',
    hints: [
      'Keep track of the minimum price seen so far (buy day).',
      'At each day, compute profit = prices[i] - minPrice and update the answer.',
    ],
    testCases: [
      { input: '[7,1,5,3,6,4]', expectedOutput: '5', isSample: true, order: 1 },
      { input: '[7,6,4,3,1]', expectedOutput: '0', isSample: true, order: 2 },
      { input: '[1,2]', expectedOutput: '1', isSample: false, order: 3 },
      { input: '[2,4,1]', expectedOutput: '2', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    description:
      'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
    difficulty: Difficulty.EASY,
    tags: ['two-pointers', 'string'],
    constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
    hints: [
      'Use two pointers starting from both ends.',
      'Skip non-alphanumeric characters and compare lowercase versions.',
    ],
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', isSample: true, order: 1 },
      { input: '"race a car"', expectedOutput: 'false', isSample: true, order: 2 },
      { input: '" "', expectedOutput: 'true', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    description:
      'You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.',
    difficulty: Difficulty.EASY,
    tags: ['linked-list', 'recursion'],
    constraints:
      'The number of nodes in both lists is in the range [0, 50].\n-100 <= Node.val <= 100\nBoth list1 and list2 are sorted in non-decreasing order.',
    hints: [
      'Use a dummy head node to avoid edge-case handling at the start.',
      'Compare the current nodes of both lists and append the smaller one.',
    ],
    testCases: [
      { input: '[1,2,4]\n[1,3,4]', expectedOutput: '[1,1,2,3,4,4]', isSample: true, order: 1 },
      { input: '[]\n[]', expectedOutput: '[]', isSample: true, order: 2 },
      { input: '[]\n[0]', expectedOutput: '[0]', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    description:
      'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.',
    difficulty: Difficulty.EASY,
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    constraints: '1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4',
    hints: [
      "Kadane's algorithm: keep a running sum; reset to 0 when it goes negative.",
      'Track the maximum sum seen at each step.',
    ],
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isSample: true, order: 1 },
      { input: '[1]', expectedOutput: '1', isSample: true, order: 2 },
      { input: '[5,4,-1,7,8]', expectedOutput: '23', isSample: false, order: 3 },
      { input: '[-1,-2,-3]', expectedOutput: '-1', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    description:
      'You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?',
    difficulty: Difficulty.EASY,
    tags: ['dynamic-programming', 'math', 'memoization'],
    constraints: '1 <= n <= 45',
    hints: [
      'The number of ways to reach step n equals ways(n-1) + ways(n-2).',
      'This is essentially the Fibonacci sequence.',
    ],
    testCases: [
      { input: '2', expectedOutput: '2', isSample: true, order: 1 },
      { input: '3', expectedOutput: '3', isSample: true, order: 2 },
      { input: '10', expectedOutput: '89', isSample: false, order: 3 },
      { input: '1', expectedOutput: '1', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Binary Search',
    slug: 'binary-search',
    description:
      'Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.',
    difficulty: Difficulty.EASY,
    tags: ['array', 'binary-search'],
    constraints: '1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique.\nnums is sorted in ascending order.',
    hints: [
      'Maintain left and right pointers. Check the midpoint each iteration.',
      'Narrow the search range based on whether mid value is less or greater than target.',
    ],
    testCases: [
      { input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4', isSample: true, order: 1 },
      { input: '[-1,0,3,5,9,12]\n2', expectedOutput: '-1', isSample: true, order: 2 },
      { input: '[5]\n5', expectedOutput: '0', isSample: false, order: 3 },
      { input: '[1,3,5,7,9]\n1', expectedOutput: '0', isSample: false, order: 4 },
    ],
  },

  // ─────────────── MEDIUM (8 câu) ───────────────

  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    description:
      'Given a string `s`, find the length of the **longest substring** without repeating characters.',
    difficulty: Difficulty.MEDIUM,
    tags: ['hash-table', 'string', 'sliding-window'],
    constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
    hints: [
      'Use a sliding window with a set to track characters in the current window.',
      'When a duplicate is found, shrink the window from the left.',
    ],
    testCases: [
      { input: '"abcabcbb"', expectedOutput: '3', isSample: true, order: 1 },
      { input: '"bbbbb"', expectedOutput: '1', isSample: true, order: 2 },
      { input: '"pwwkew"', expectedOutput: '3', isSample: false, order: 3 },
      { input: '""', expectedOutput: '0', isSample: false, order: 4 },
    ],
  },

  {
    title: '3Sum',
    slug: '3sum',
    description:
      'Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'two-pointers', 'sorting'],
    constraints:
      '3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5',
    hints: [
      'Sort the array first to simplify duplicate handling.',
      'Fix one element, then use two pointers on the remainder.',
      'Skip duplicate values at each pointer position.',
    ],
    testCases: [
      { input: '[-1,0,1,2,-1,-4]', expectedOutput: '[[-1,-1,2],[-1,0,1]]', isSample: true, order: 1 },
      { input: '[0,1,1]', expectedOutput: '[]', isSample: true, order: 2 },
      { input: '[0,0,0]', expectedOutput: '[[0,0,0]]', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    description:
      'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'two-pointers', 'greedy'],
    constraints: 'n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4',
    hints: [
      'Start with pointers at both ends. Area = min(h[l], h[r]) * (r - l).',
      'Move the pointer pointing to the shorter line inward.',
    ],
    testCases: [
      { input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49', isSample: true, order: 1 },
      { input: '[1,1]', expectedOutput: '1', isSample: true, order: 2 },
      { input: '[4,3,2,1,4]', expectedOutput: '16', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    description:
      'Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nThe product of any prefix or suffix of `nums` is **guaranteed** to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in `O(n)` time and **without using the division operation**.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'prefix-sum'],
    constraints: '2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30',
    hints: [
      'Build a prefix product array and a suffix product array.',
      'answer[i] = prefix[i-1] * suffix[i+1]. Can be done in O(1) extra space.',
    ],
    testCases: [
      { input: '[1,2,3,4]', expectedOutput: '[24,12,8,6]', isSample: true, order: 1 },
      { input: '[-1,1,0,-3,3]', expectedOutput: '[0,0,9,0,0]', isSample: true, order: 2 },
    ],
  },

  {
    title: 'Find Minimum in Rotated Sorted Array',
    slug: 'find-minimum-in-rotated-sorted-array',
    description:
      'Suppose an array of length `n` sorted in ascending order is **rotated** between 1 and `n` times.\n\nGiven the sorted rotated array `nums` of **unique** elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in `O(log n)` time.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'binary-search'],
    constraints: 'n == nums.length\n1 <= n <= 5000\n-5000 <= nums[i] <= 5000\nAll integers are unique.\nnums is sorted and rotated between 1 and n times.',
    hints: [
      'Use binary search. The minimum is at the rotation pivot.',
      'If nums[mid] > nums[right], the minimum is in the right half; otherwise in the left half.',
    ],
    testCases: [
      { input: '[3,4,5,1,2]', expectedOutput: '1', isSample: true, order: 1 },
      { input: '[4,5,6,7,0,1,2]', expectedOutput: '0', isSample: true, order: 2 },
      { input: '[11,13,15,17]', expectedOutput: '11', isSample: false, order: 3 },
      { input: '[2,1]', expectedOutput: '1', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    description:
      "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.\n\nAn **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.",
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'depth-first-search', 'breadth-first-search', 'graph'],
    constraints:
      'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is either "0" or "1".',
    hints: [
      'Iterate over each cell. When you find a "1", run DFS/BFS to mark all connected land as visited.',
      'Each DFS/BFS call counts as one island.',
    ],
    testCases: [
      {
        input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        expectedOutput: '1',
        isSample: true,
        order: 1,
      },
      {
        input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        expectedOutput: '3',
        isSample: true,
        order: 2,
      },
    ],
  },

  {
    title: 'Coin Change',
    slug: 'coin-change',
    description:
      'You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.',
    difficulty: Difficulty.MEDIUM,
    tags: ['array', 'dynamic-programming', 'breadth-first-search'],
    constraints:
      '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
    hints: [
      'Classic bottom-up DP: dp[i] = minimum coins to make amount i.',
      'dp[0] = 0. For each amount i, try every coin denomination.',
    ],
    testCases: [
      { input: '[1,5,11]\n11', expectedOutput: '1', isSample: true, order: 1 },
      { input: '[2]\n3', expectedOutput: '-1', isSample: true, order: 2 },
      { input: '[1]\n0', expectedOutput: '0', isSample: false, order: 3 },
      { input: '[1,2,5]\n11', expectedOutput: '3', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Longest Palindromic Substring',
    slug: 'longest-palindromic-substring',
    description:
      'Given a string `s`, return the longest palindromic substring in `s`.',
    difficulty: Difficulty.MEDIUM,
    tags: ['string', 'dynamic-programming', 'two-pointers'],
    constraints: '1 <= s.length <= 1000\ns consists of only digits and English letters.',
    hints: [
      'Expand around every center (both single-character and between two characters).',
      'Track the longest expansion seen so far.',
    ],
    testCases: [
      { input: '"babad"', expectedOutput: '"bab"', isSample: true, order: 1 },
      { input: '"cbbd"', expectedOutput: '"bb"', isSample: true, order: 2 },
      { input: '"a"', expectedOutput: '"a"', isSample: false, order: 3 },
      { input: '"racecar"', expectedOutput: '"racecar"', isSample: false, order: 4 },
    ],
  },

  // ─────────────── HARD (4 câu) ───────────────

  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    description:
      'Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.',
    difficulty: Difficulty.HARD,
    tags: ['array', 'two-pointers', 'dynamic-programming', 'stack', 'monotonic-stack'],
    constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
    hints: [
      'For each index, water trapped = min(maxLeft, maxRight) - height[i].',
      'Two-pointer approach: move the side with the smaller max inward.',
    ],
    testCases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6', isSample: true, order: 1 },
      { input: '[4,2,0,3,2,5]', expectedOutput: '9', isSample: true, order: 2 },
      { input: '[3,0,2,0,4]', expectedOutput: '7', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    description:
      'Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the **median** of the two sorted arrays.\n\nThe overall run time complexity should be `O(log (m+n))`.',
    difficulty: Difficulty.HARD,
    tags: ['array', 'binary-search', 'divide-and-conquer'],
    constraints:
      'nums1.length == m\nnums2.length == n\n0 <= m <= 1000\n0 <= n <= 1000\n1 <= m + n <= 2000\n-10^6 <= nums1[i], nums2[i] <= 10^6',
    hints: [
      'Binary search on the smaller array to find the correct partition point.',
      'Partition both arrays so that elements on the left half are all ≤ elements on the right half.',
    ],
    testCases: [
      { input: '[1,3]\n[2]', expectedOutput: '2.00000', isSample: true, order: 1 },
      { input: '[1,2]\n[3,4]', expectedOutput: '2.50000', isSample: true, order: 2 },
      { input: '[0,0]\n[0,0]', expectedOutput: '0.00000', isSample: false, order: 3 },
      { input: '[]\n[1]', expectedOutput: '1.00000', isSample: false, order: 4 },
    ],
  },

  {
    title: 'Merge K Sorted Lists',
    slug: 'merge-k-sorted-lists',
    description:
      'You are given an array of `k` linked-lists `lists`, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.',
    difficulty: Difficulty.HARD,
    tags: ['linked-list', 'divide-and-conquer', 'heap', 'merge-sort'],
    constraints:
      'k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500\n-10^4 <= lists[i][j] <= 10^4\nlists[i] is sorted in ascending order.\nThe sum of lists[i].length will not exceed 10^4.',
    hints: [
      'Use a min-heap (priority queue) to always pick the smallest head among all lists.',
      'Alternatively, use divide-and-conquer: merge pairs of lists repeatedly.',
    ],
    testCases: [
      { input: '[[1,4,5],[1,3,4],[2,6]]', expectedOutput: '[1,1,2,3,4,4,5,6]', isSample: true, order: 1 },
      { input: '[]', expectedOutput: '[]', isSample: true, order: 2 },
      { input: '[[]]', expectedOutput: '[]', isSample: false, order: 3 },
    ],
  },

  {
    title: 'Word Ladder',
    slug: 'word-ladder',
    description:
      'A **transformation sequence** from word `beginWord` to word `endWord` using a dictionary `wordList` is a sequence `beginWord -> s1 -> s2 -> ... -> sk` such that:\n- Every adjacent pair of words differs by a single letter.\n- Every word in the sequence (except `beginWord`) is in `wordList`.\n\nGiven `beginWord`, `endWord`, and `wordList`, return the **number of words** in the shortest transformation sequence from `beginWord` to `endWord`, or `0` if no such sequence exists.',
    difficulty: Difficulty.HARD,
    tags: ['hash-table', 'string', 'breadth-first-search'],
    constraints:
      '1 <= beginWord.length <= 10\nendWord.length == beginWord.length\n1 <= wordList.length <= 5000\nwordList[i].length == beginWord.length\nbeginWord, endWord, and wordList[i] consist of lowercase English letters.\nbeginWord != endWord\nAll words in wordList are unique.',
    hints: [
      'Model the problem as a graph: nodes are words, edges connect words that differ by one letter.',
      'BFS from beginWord. The shortest path length is the answer.',
      'Pre-process wordList into a set for O(1) lookup.',
    ],
    testCases: [
      { input: '"hit"\n"cog"\n["hot","dot","dog","lot","log","cog"]', expectedOutput: '5', isSample: true, order: 1 },
      { input: '"hit"\n"cog"\n["hot","dot","dog","lot","log"]', expectedOutput: '0', isSample: true, order: 2 },
    ],
  },
];

// ─────────────── SEED RUNNER ───────────────

async function main() {
  console.log(' Seeding 20 DSA coding questions...\n');

  await prisma.$transaction(async (tx) => {
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

    const saved = await tx.codingQuestion.findMany({
      where: { slug: { in: questions.map((q) => q.slug) } },
      select: { id: true, slug: true },
    });
    const slugToId = Object.fromEntries(saved.map((q) => [q.slug, q.id]));

    const allTestCases = questions.flatMap((q) =>
      (q.testCases ?? []).map((tc, i) => ({
        codingQuestionId: slugToId[q.slug],
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isSample: tc.isSample,
        isHidden: false,
        points: 1,
        order: tc.order ?? i + 1,
      }))
    );

    await tx.testCase.createMany({
      data: allTestCases,
      skipDuplicates: true, // cần @@unique([codingQuestionId, order]) trong schema
    });
  });

  // Summary
  const counts = questions.reduce(
    (acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('Done!\n');
  console.log(`   EASY   : ${counts['EASY'] ?? 0} questions`);
  console.log(`   MEDIUM : ${counts['MEDIUM'] ?? 0} questions`);
  console.log(`   HARD   : ${counts['HARD'] ?? 0} questions`);
  console.log(`   TOTAL  : ${questions.length} questions`);
}

main()
  .catch((e) => {
    console.error(' Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());