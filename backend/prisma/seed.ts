import 'dotenv/config';
import { PrismaClient, Difficulty, TypeQuestion } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─────────────────────────────────────────────────────────────
//  Uniform data shape (all question types — simple for demo):
//  {
//    question:   string      // câu hỏi hiển thị cho user
//    followUps:  string[]    // câu hỏi đào sâu thêm
//    tips:       string[]    // gợi ý cách trả lời
//    keyPoints:  string[]    // điểm chính cần cover
//  }
// ─────────────────────────────────────────────────────────────

type QuestionSeed = {
  title: string;
  slug: string;
  typeQuestion: TypeQuestion;
  difficulty: Difficulty;
  categoryNames: string[];
  data: {
    question: string;
    followUps: string[];
    tips: string[];
    keyPoints: string[];
  };
};

const questions: QuestionSeed[] = [
  // ══════════════════════════════════════════════════════════
  //  BEHAVIORAL  (24 câu)
  // ══════════════════════════════════════════════════════════

  // ── EASY (8) ──────────────────────────────────────────────
  {
    title: 'Tell me about yourself',
    slug: 'behavioral-tell-me-about-yourself',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Communication'],
    data: {
      question: 'Tell me about yourself.',
      followUps: [
        'What experience is most relevant to this role?',
        'How did you get into software engineering?',
      ],
      tips: [
        'Use the Present–Past–Future structure.',
        'Keep it under 2 minutes and tie your story to the role.',
        'Avoid reading your resume — synthesize it.',
      ],
      keyPoints: [
        'Clear narrative arc (past → present → future)',
        'Mentions relevant technical background',
        'Shows enthusiasm for the role',
        'Concise and well-structured',
      ],
    },
  },
  {
    title: 'Why do you want this job?',
    slug: 'behavioral-why-do-you-want-this-job',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Communication'],
    data: {
      question: 'Why do you want this job?',
      followUps: [
        'What do you know about our company?',
        'Where do you see yourself in 3 years?',
      ],
      tips: [
        'Research the company and mention specific products or values.',
        'Show genuine enthusiasm, not just a need for a paycheck.',
        'Connect your career goals to what the role offers.',
      ],
      keyPoints: [
        'Demonstrates company research',
        'Aligns personal goals with role',
        'Shows genuine motivation beyond salary',
        'Specific and not generic',
      ],
    },
  },
  {
    title: 'What are your greatest strengths?',
    slug: 'behavioral-greatest-strengths',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Communication', 'Ownership & Accountability'],
    data: {
      question: 'What are your greatest strengths?',
      followUps: [
        'Can you give a concrete example of that strength in action?',
        'How does this strength help you in a team setting?',
      ],
      tips: [
        'Name 2–3 strengths relevant to the role.',
        'Back each strength with a brief STAR story.',
        'Avoid vague answers like "I work hard".',
      ],
      keyPoints: [
        'Strengths are relevant to the engineering role',
        'Backed by concrete examples',
        'Demonstrates self-awareness',
        'Not generic or clichéd',
      ],
    },
  },
  {
    title: 'What is your biggest weakness?',
    slug: 'behavioral-biggest-weakness',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Adaptability & Growth', 'Ownership & Accountability'],
    data: {
      question: 'What is your biggest weakness?',
      followUps: [
        'How are you actively working to improve it?',
        'Has it ever negatively impacted a project?',
      ],
      tips: [
        'Choose a real weakness, not a disguised strength.',
        'Show self-awareness and concrete steps you are taking to improve.',
        'Keep the tone positive and growth-focused.',
      ],
      keyPoints: [
        'Names a genuine weakness',
        'Demonstrates self-awareness',
        'Describes active improvement steps',
        'Does not disguise a strength as a weakness',
      ],
    },
  },
  {
    title: 'How do you handle feedback and criticism?',
    slug: 'behavioral-handle-feedback',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Adaptability & Growth', 'Communication'],
    data: {
      question: 'How do you handle feedback and criticism?',
      followUps: [
        'Tell me about a time you received tough feedback. How did you respond?',
        'Have you ever disagreed with feedback given to you?',
      ],
      tips: [
        'Show that you welcome feedback as a growth opportunity.',
        'Give a specific example using STAR.',
        'Avoid sounding defensive.',
      ],
      keyPoints: [
        'Views feedback as opportunity not attack',
        'Specific example of receiving critical feedback',
        'Shows behavior change as a result',
        'Demonstrates emotional maturity',
      ],
    },
  },
  {
    title: 'Tell me about a time you worked in a team',
    slug: 'behavioral-teamwork-experience',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Teamwork & Collaboration'],
    data: {
      question:
        'Tell me about a time you worked effectively as part of a team.',
      followUps: [
        'What was your specific contribution?',
        'What would you do differently if you could repeat it?',
      ],
      tips: [
        'Use STAR (Situation, Task, Action, Result).',
        'Highlight collaboration and communication skills.',
        'Show that you can work with different personalities.',
      ],
      keyPoints: [
        'Clear situation and team context',
        'Distinguishes own contribution from team contribution',
        'Shows communication and collaboration',
        'Measurable positive outcome',
      ],
    },
  },
  {
    title: 'Describe your ideal work environment',
    slug: 'behavioral-ideal-work-environment',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Communication', 'Adaptability & Growth'],
    data: {
      question: 'Describe your ideal work environment.',
      followUps: [
        'How do you adapt when the environment is different from your preference?',
        'What kind of management style do you work best under?',
      ],
      tips: [
        'Align your answer with what you know about the company culture.',
        'Be honest but show flexibility — you can adapt.',
        'Mention collaboration, learning, and autonomy.',
      ],
      keyPoints: [
        'Answer is grounded and realistic',
        'Shows self-awareness about work preferences',
        'Demonstrates adaptability',
        'Culturally aligned with a typical engineering team',
      ],
    },
  },
  {
    title: 'Where do you see yourself in 5 years?',
    slug: 'behavioral-five-year-plan',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Communication', 'Ownership & Accountability'],
    data: {
      question: 'Where do you see yourself in 5 years?',
      followUps: [
        'How does this role fit into that vision?',
        'Are you more interested in technical depth or management?',
      ],
      tips: [
        'Show ambition without sounding like you will leave immediately.',
        'Align your goals with what the company can offer.',
        'Be authentic — generic answers are easily spotted.',
      ],
      keyPoints: [
        'Has a clear career direction',
        'Ambition is realistic and credible',
        'Ties personal goals to the role',
        'Does not imply a short tenure',
      ],
    },
  },

  // ── MEDIUM (10) ───────────────────────────────────────────
  {
    title: 'Describe a challenging project you led',
    slug: 'behavioral-challenging-project-led',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Leadership', 'Ownership & Accountability'],
    data: {
      question:
        'Describe a challenging project you led. How did you manage it to a successful outcome?',
      followUps: [
        'What was the biggest obstacle you faced?',
        'How did you keep the team motivated during difficulties?',
      ],
      tips: [
        'Quantify the impact (e.g., reduced latency by 40%, delivered 2 weeks early).',
        'Emphasize leadership, decision-making, and stakeholder communication.',
        'Show you can hold a team accountable without micromanaging.',
      ],
      keyPoints: [
        'Clear description of scope and challenge',
        'Shows proactive leadership actions',
        'Demonstrates stakeholder communication',
        'Quantified result',
      ],
    },
  },
  {
    title: 'Tell me about a conflict with a coworker',
    slug: 'behavioral-conflict-with-coworker',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Conflict Resolution', 'Communication'],
    data: {
      question:
        'Tell me about a time you had a conflict with a coworker and how you resolved it.',
      followUps: [
        'What was the root cause of the conflict?',
        'What did you learn about conflict resolution from this experience?',
      ],
      tips: [
        'Focus on the resolution, not the blame.',
        'Show empathy and willingness to understand the other perspective.',
        'Keep the tone professional — do not badmouth the coworker.',
      ],
      keyPoints: [
        'Describes conflict without excessive blame',
        'Shows empathy and perspective-taking',
        'Concrete resolution steps taken',
        'Lesson learned mentioned',
      ],
    },
  },
  {
    title: 'How do you prioritize tasks under pressure?',
    slug: 'behavioral-prioritize-under-pressure',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Time Management', 'Ownership & Accountability'],
    data: {
      question:
        'How do you prioritize your tasks when you have multiple deadlines and limited time?',
      followUps: [
        'Walk me through a specific situation where you had to make hard trade-offs.',
        'What tools or frameworks do you use for prioritization?',
      ],
      tips: [
        'Mention frameworks like Eisenhower Matrix, MoSCoW, or RICE.',
        'Show that you communicate proactively when timelines are at risk.',
        'Demonstrate calm under pressure.',
      ],
      keyPoints: [
        'Has a structured approach to prioritization',
        'Communicates proactively with stakeholders',
        'Makes trade-offs explicitly and transparently',
        'Specific example with outcome',
      ],
    },
  },
  {
    title: 'Tell me about a time you failed',
    slug: 'behavioral-time-you-failed',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Ownership & Accountability', 'Adaptability & Growth'],
    data: {
      question: 'Tell me about a time you failed. What did you learn from it?',
      followUps: [
        'How did you recover from the failure?',
        'Did this change how you approach similar situations now?',
      ],
      tips: [
        'Own the failure — do not deflect blame.',
        'Emphasize concrete lessons and behavioral changes after the failure.',
        'Pick a real failure, not a trivial one.',
      ],
      keyPoints: [
        'Takes full ownership without deflecting',
        'Failure is real and meaningful',
        'Clear lesson extracted',
        'Behavioral change described',
      ],
    },
  },
  {
    title: 'Describe a situation where you had to learn something quickly',
    slug: 'behavioral-learn-quickly',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Adaptability & Growth', 'Ownership & Accountability'],
    data: {
      question:
        'Describe a situation where you had to learn a new technology or skill quickly under a tight deadline.',
      followUps: [
        'How did you structure your learning?',
        'What resources did you rely on?',
      ],
      tips: [
        'Show a structured learning approach (docs → small projects → production).',
        'Tie the story to a measurable outcome.',
        'Mention how you validated your understanding.',
      ],
      keyPoints: [
        'Shows structured self-directed learning',
        'Timeline and deadline context is clear',
        'Demonstrates resourcefulness',
        'Outcome tied to learning',
      ],
    },
  },
  {
    title: 'How do you influence without authority?',
    slug: 'behavioral-influence-without-authority',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Leadership', 'Communication'],
    data: {
      question:
        'Tell me about a time you had to influence a decision when you had no direct authority.',
      followUps: [
        'How did you build buy-in from stakeholders?',
        'What would you do differently?',
      ],
      tips: [
        'Demonstrate data-driven persuasion and active listening.',
        "Show respect for others' perspectives while driving toward a good outcome.",
        'Avoid framing it as "I convinced everyone I was right".',
      ],
      keyPoints: [
        'Built credibility through data or logic',
        'Listened and adapted to concerns',
        'Achieved alignment without forcing',
        'Outcome benefits the team, not just self',
      ],
    },
  },
  {
    title: 'Describe a time you gave constructive feedback',
    slug: 'behavioral-gave-constructive-feedback',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Leadership', 'Communication'],
    data: {
      question:
        'Describe a time you had to give constructive feedback to a peer or junior engineer.',
      followUps: [
        'How did they react?',
        'Would you approach it differently in hindsight?',
      ],
      tips: [
        'Use the SBI (Situation–Behavior–Impact) framework.',
        'Emphasize psychological safety and positive intent.',
        'Show that feedback led to a positive change.',
      ],
      keyPoints: [
        'Feedback was specific and behavior-based, not personal',
        'Delivered with care and positive intent',
        "Describes the recipient's reaction honestly",
        'Shows growth from the interaction',
      ],
    },
  },
  {
    title: 'How do you make decisions with incomplete information?',
    slug: 'behavioral-decisions-incomplete-info',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Ownership & Accountability', 'Leadership'],
    data: {
      question:
        'Tell me about a time you had to make an important decision with incomplete data.',
      followUps: [
        'How did you mitigate the risk of being wrong?',
        'In retrospect, was it the right call?',
      ],
      tips: [
        'Show structured thinking: identify assumptions, assess risks, define reversibility.',
        'Demonstrate comfort with ambiguity — a key leadership quality.',
        'Be honest if the outcome was not perfect.',
      ],
      keyPoints: [
        'Identifies what information was missing and why',
        'Structured risk assessment before deciding',
        'Makes decision and moves forward confidently',
        'Reflects honestly on outcome',
      ],
    },
  },
  {
    title: 'Tell me about a time you mentored someone',
    slug: 'behavioral-mentored-someone',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Leadership', 'Teamwork & Collaboration'],
    data: {
      question: 'Tell me about a time you mentored or coached a colleague.',
      followUps: [
        'How did you tailor your approach to their learning style?',
        'What was the outcome for them?',
      ],
      tips: [
        "Show patience and genuine investment in others' growth.",
        'Quantify improvement if possible.',
        "Focus on the mentee's journey, not your own cleverness.",
      ],
      keyPoints: [
        'Shows genuine investment in the other person',
        'Tailored approach to individual needs',
        'Concrete improvement or outcome described',
        'Demonstrates leadership through others',
      ],
    },
  },
  {
    title: 'Describe a time you disagreed with a team decision',
    slug: 'behavioral-disagreed-team-decision',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Conflict Resolution', 'Teamwork & Collaboration'],
    data: {
      question:
        'Describe a time you disagreed with a decision made by your team or manager. How did you handle it?',
      followUps: [
        'Did you escalate? Why or why not?',
        'What did you do after the decision was finalized?',
      ],
      tips: [
        'Show that you voiced your concern professionally with data or reasoning.',
        'Demonstrate "disagree and commit" once a decision is made.',
        'Avoid sounding like you always think you are right.',
      ],
      keyPoints: [
        'Raised concern constructively and with evidence',
        'Respected the final decision',
        'Committed fully after disagreeing',
        'No passive-aggressive behavior described',
      ],
    },
  },
  {
    title: 'Tell me about a time you improved a process',
    slug: 'behavioral-improved-a-process',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Ownership & Accountability', 'Leadership'],
    data: {
      question:
        'Tell me about a time you identified an inefficiency and improved a process on your team.',
      followUps: [
        'How did you get buy-in from the team?',
        'How did you measure whether it worked?',
      ],
      tips: [
        'Before/after metrics make this answer stand out.',
        'Show initiative — you identified the problem, not just fixed it when told.',
        'Mention how you brought others along.',
      ],
      keyPoints: [
        'Proactively identified the problem',
        'Proposed and implemented a solution',
        'Quantified improvement',
        'Team adoption described',
      ],
    },
  },

  // ── HARD (6) ──────────────────────────────────────────────
  {
    title: 'Describe your most impactful technical decision',
    slug: 'behavioral-most-impactful-technical-decision',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Leadership', 'Ownership & Accountability'],
    data: {
      question:
        'Describe the most impactful technical decision you have ever made. What was the trade-off and what was the result?',
      followUps: [
        'How did you evaluate the alternatives?',
        'How did you get stakeholder alignment on the decision?',
        'What would you change if you faced the same decision today?',
      ],
      tips: [
        'Show systems thinking — consider technical debt, scalability, team capability.',
        'Quantify the impact (performance, cost, reliability).',
        'Be honest about what you would do differently.',
      ],
      keyPoints: [
        'Decision had real and significant scope',
        'Trade-offs were clearly identified and weighed',
        'Stakeholder alignment described',
        'Quantified outcome',
        'Honest reflection on what could be improved',
      ],
    },
  },
  {
    title: 'Tell me about a time you drove a cultural change',
    slug: 'behavioral-drove-cultural-change',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Leadership', 'Teamwork & Collaboration'],
    data: {
      question:
        'Tell me about a time you identified a broken process or cultural problem on a team and drove meaningful change.',
      followUps: [
        'How did you get leadership support?',
        'How did you handle resistance from team members?',
        'How did you measure success?',
      ],
      tips: [
        'Show empathy, systemic thinking, and long-term mindset.',
        'Concrete before/after metrics make this answer stand out.',
        'Show that change was durable, not just a one-time fix.',
      ],
      keyPoints: [
        'Correctly diagnosed the cultural problem',
        'Built coalition and got buy-in',
        'Handled resistance gracefully',
        'Durable measurable change resulted',
      ],
    },
  },
  {
    title: 'Describe a time you navigated a major ambiguous project',
    slug: 'behavioral-navigated-ambiguous-project',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Leadership', 'Time Management'],
    data: {
      question:
        'Describe a time you were given a highly ambiguous project with unclear requirements. How did you bring clarity and deliver?',
      followUps: [
        'How did you align stakeholders on scope?',
        'What did you do when requirements changed mid-project?',
      ],
      tips: [
        'Show discovery skills: user research, spike solutions, iterative delivery.',
        'Emphasize written documentation and cross-team communication.',
        'Demonstrate comfort with ambiguity — do not frame it as purely negative.',
      ],
      keyPoints: [
        'Describes how scope was clarified proactively',
        'Used iterative or discovery approach',
        'Stakeholder alignment maintained',
        'Delivered despite ambiguity',
      ],
    },
  },
  {
    title: 'Tell me about a time you had to manage up',
    slug: 'behavioral-manage-up',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Leadership', 'Communication'],
    data: {
      question:
        'Tell me about a time you disagreed with your manager or a senior leader and how you handled it professionally.',
      followUps: [
        'How did you present your case?',
        'What was the final outcome?',
        'What did you do when the decision went against your recommendation?',
      ],
      tips: [
        'Show respect and data-backed reasoning — avoid emotional language.',
        'Demonstrate "disagree and commit" once a decision is made.',
        'Show that you built trust, not friction.',
      ],
      keyPoints: [
        'Made the case professionally with evidence',
        'Respected the authority of the decision-maker',
        'Committed fully to the final direction',
        'Relationship remained intact or strengthened',
      ],
    },
  },
  {
    title: 'Tell me about a time you led through a crisis',
    slug: 'behavioral-led-through-crisis',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Leadership', 'Ownership & Accountability'],
    data: {
      question:
        'Tell me about a time you led a team through a crisis or major incident (e.g., production outage, data loss, severe deadline pressure).',
      followUps: [
        'How did you communicate with stakeholders during the incident?',
        'What did you do immediately after to prevent recurrence?',
        'What did you learn about yourself as a leader?',
      ],
      tips: [
        'Show calm, structured decision-making under pressure.',
        'Prioritize impact: what was most urgent vs. most important.',
        'Post-incident retrospective shows maturity.',
      ],
      keyPoints: [
        'Took clear command in an uncertain situation',
        'Communicated proactively with stakeholders',
        'Resolved the crisis with minimal damage',
        'Post-mortem and prevention steps taken',
      ],
    },
  },
  {
    title: 'How have you built and scaled an engineering team?',
    slug: 'behavioral-built-and-scaled-team',
    typeQuestion: TypeQuestion.BEHAVIORAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Leadership', 'Teamwork & Collaboration'],
    data: {
      question:
        'Describe a time you helped build or scale an engineering team. What challenges did you face and how did you overcome them?',
      followUps: [
        'How did you maintain culture as the team grew?',
        'How did you handle underperformers?',
        'What would you do differently?',
      ],
      tips: [
        'Talk about hiring bar, onboarding, documentation, and culture.',
        'Show that you developed others, not just yourself.',
        'Be honest about what did not work.',
      ],
      keyPoints: [
        'Hiring bar and process described',
        'Onboarding and ramp-up approach',
        'Culture preservation at scale',
        'Honest about challenges and failures',
      ],
    },
  },

  // ══════════════════════════════════════════════════════════
  //  TECHNICAL  (24 câu)
  // ══════════════════════════════════════════════════════════

  // ── EASY (8) ──────────────────────────────────────────────
  {
    title: 'What is the difference between a process and a thread?',
    slug: 'technical-process-vs-thread',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Operating Systems'],
    data: {
      question: 'What is the difference between a process and a thread?',
      followUps: [
        'When would you choose multiple processes over multiple threads?',
        'What is a race condition and how do threads cause it?',
      ],
      tips: [
        'Draw an outer box (process) with inner boxes (threads) sharing the heap.',
        'Mention trade-offs: threads are lighter but introduce race conditions.',
        'Bring up IPC mechanisms if you choose multi-process.',
      ],
      keyPoints: [
        'Process has own memory space; threads share within a process',
        'Context switching cost difference',
        'Thread crash can kill the process; process crash is isolated',
        'Threads communicate via shared memory; processes use IPC',
      ],
    },
  },
  {
    title: 'Explain HTTP vs HTTPS',
    slug: 'technical-http-vs-https',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Networking'],
    data: {
      question:
        'What is the difference between HTTP and HTTPS? How does TLS work at a high level?',
      followUps: [
        'What is a certificate authority and why do we need it?',
        'What is HSTS?',
      ],
      tips: [
        'Know the TLS handshake at a high level: hello → certificate → key exchange → symmetric key.',
        'Explain why asymmetric encryption is used only during handshake.',
        'Mention TLS 1.3 reduced round trips as a bonus.',
      ],
      keyPoints: [
        'HTTPS = HTTP over TLS providing encryption and authentication',
        'TLS handshake sequence at high level',
        'Asymmetric key exchange, then symmetric for data',
        'Certificates signed by CAs to prevent MITM',
      ],
    },
  },
  {
    title: 'What is a RESTful API?',
    slug: 'technical-what-is-restful-api',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Backend'],
    data: {
      question: 'What is a RESTful API? What are its core constraints?',
      followUps: [
        'What is the difference between REST and GraphQL?',
        'What does idempotent mean and which HTTP verbs are idempotent?',
      ],
      tips: [
        'Name all 6 constraints: client-server, stateless, cacheable, uniform interface, layered, code-on-demand.',
        'Contrast with GraphQL and gRPC to show broader knowledge.',
        'Mention idempotency: GET, PUT, DELETE are idempotent; POST is not.',
      ],
      keyPoints: [
        'REST is an architectural style, not a protocol',
        'Stateless — each request contains all context',
        'Uniform interface using HTTP verbs on resources',
        'Cacheable responses',
      ],
    },
  },
  {
    title: 'What is the difference between SQL and NoSQL?',
    slug: 'technical-sql-vs-nosql',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Databases'],
    data: {
      question:
        'What is the difference between SQL and NoSQL databases? When would you choose one over the other?',
      followUps: [
        'Can you name the different types of NoSQL databases?',
        'How does the CAP theorem relate to this choice?',
      ],
      tips: [
        'Give concrete examples: PostgreSQL, MySQL (SQL); MongoDB, Cassandra, Redis (NoSQL).',
        'Mention ACID vs BASE trade-off.',
        'Show you understand when each shines, not just definitions.',
      ],
      keyPoints: [
        'SQL: structured schema, ACID, relational model',
        'NoSQL: flexible schema, horizontal scaling, multiple models',
        'SQL for complex queries and strong consistency',
        'NoSQL for high write throughput or flexible schemas',
      ],
    },
  },
  {
    title: 'What are the four pillars of OOP?',
    slug: 'technical-four-pillars-oop',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['OOP & Design Patterns'],
    data: {
      question:
        'What are the four pillars of Object-Oriented Programming? Give a brief example of each.',
      followUps: [
        'What is the difference between abstraction and encapsulation?',
        'Can you give a code example of polymorphism?',
      ],
      tips: [
        'Give a concrete code sketch for each pillar.',
        'Know SOLID principles as a natural follow-up.',
        'Distinguish abstraction (what it does) from encapsulation (how it hides).',
      ],
      keyPoints: [
        'Encapsulation: bundling data and hiding internal state',
        'Abstraction: exposing only necessary interfaces',
        'Inheritance: subclass reuses parent code',
        'Polymorphism: same interface, different implementations',
      ],
    },
  },
  {
    title: 'What is Big O notation?',
    slug: 'technical-big-o-notation',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Algorithms'],
    data: {
      question:
        'Explain Big O notation. What is the difference between O(n), O(n log n), and O(n²)?',
      followUps: [
        'What is the time complexity of binary search and why?',
        'How do you calculate the space complexity of a recursive function?',
      ],
      tips: [
        'Be ready to analyze a code snippet on the fly.',
        'Know both time and space complexity.',
        'Drop constants and lower-order terms.',
      ],
      keyPoints: [
        'Big O describes worst-case growth as input grows',
        'O(1) constant, O(log n) binary search, O(n) linear, O(n log n) merge sort, O(n²) nested loops',
        'Drop constants and lower-order terms',
        'Applies to both time and space',
      ],
    },
  },
  {
    title: 'What is the difference between stack and heap memory?',
    slug: 'technical-stack-vs-heap',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Operating Systems'],
    data: {
      question: 'What is the difference between stack memory and heap memory?',
      followUps: [
        'What causes a stack overflow?',
        'What is a memory leak and when does it occur?',
      ],
      tips: [
        'Relate to languages: Java/Python use GC on heap; C requires manual malloc/free.',
        'Useful segue into garbage collection algorithms.',
        'Stack overflow = recursion too deep; memory leak = heap objects never freed.',
      ],
      keyPoints: [
        'Stack: LIFO, local variables, auto-managed, fast, limited size',
        'Heap: dynamic allocation, longer-lived, GC or manual, larger',
        'Stack overflow from deep recursion',
        'Memory leaks from unreleased heap objects',
      ],
    },
  },
  {
    title: 'What is the difference between concurrency and parallelism?',
    slug: 'technical-concurrency-vs-parallelism',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.EASY,
    categoryNames: ['Operating Systems', 'Backend'],
    data: {
      question: 'What is the difference between concurrency and parallelism?',
      followUps: [
        'Can you have concurrency without parallelism?',
        'How does Node.js achieve concurrency on a single thread?',
      ],
      tips: [
        'Classic analogy: concurrency is juggling (switching fast), parallelism is two jugglers.',
        'Concurrency is about structure; parallelism is about execution.',
        'Node.js event loop is a great concrete example of concurrent but not parallel.',
      ],
      keyPoints: [
        'Concurrency: multiple tasks making progress, possibly on one core',
        'Parallelism: multiple tasks running simultaneously on multiple cores',
        'Concurrency without parallelism is possible (single-core context switching)',
        'Go routines, async/await are concurrency models',
      ],
    },
  },

  // ── MEDIUM (10) ───────────────────────────────────────────
  {
    title: 'How does database indexing work?',
    slug: 'technical-database-indexing',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Databases'],
    data: {
      question:
        'How does database indexing work? Explain B-Tree indexes and when you would add or avoid an index.',
      followUps: [
        'How would you debug a slow query in production?',
        'What is a composite index and when does column order matter?',
      ],
      tips: [
        'Mention EXPLAIN/EXPLAIN ANALYZE in PostgreSQL to verify index usage.',
        'Know the difference between clustered and non-clustered (covering) indexes.',
        'Add index on high-cardinality columns used in WHERE, JOIN, ORDER BY.',
      ],
      keyPoints: [
        'B-Tree: O(log n) lookup, supports range queries',
        'Trade-off: faster reads, slower writes, extra storage',
        'Add on high-cardinality WHERE/JOIN/ORDER BY columns',
        'Avoid over-indexing on write-heavy tables',
      ],
    },
  },
  {
    title: 'Explain ACID properties',
    slug: 'technical-acid-properties',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Databases'],
    data: {
      question:
        'Explain ACID properties in databases. Give an example of where each matters.',
      followUps: [
        'What isolation anomalies exist and which isolation level prevents each?',
        'How does PostgreSQL implement durability?',
      ],
      tips: [
        'Know isolation anomalies: dirty read, non-repeatable read, phantom read.',
        'Contrast with BASE (NoSQL): Basically Available, Soft state, Eventually consistent.',
        'Durability example: WAL (Write-Ahead Log).',
      ],
      keyPoints: [
        'Atomicity: transaction is all-or-nothing',
        'Consistency: DB moves between valid states only',
        "Isolation: concurrent transactions do not see each other's intermediate state",
        'Durability: committed data survives crashes via WAL',
      ],
    },
  },
  {
    title: 'What is a deadlock and how do you prevent it?',
    slug: 'technical-deadlock-prevention',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Operating Systems', 'Databases'],
    data: {
      question:
        'What is a deadlock? How do you detect and prevent deadlocks in a concurrent system?',
      followUps: [
        'How do databases detect and resolve deadlocks?',
        'What is optimistic vs pessimistic locking?',
      ],
      tips: [
        'Four Coffman conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.',
        'Prevention: consistent lock ordering, lock timeout with retry, MVCC.',
        'Relate to database row-level locking and SELECT FOR UPDATE.',
      ],
      keyPoints: [
        'Deadlock: circular wait on locks between two or more processes',
        'Four Coffman conditions required for deadlock',
        'Prevention: consistent ordering, timeouts, optimistic concurrency',
        'DB deadlock detector kills one transaction and retries',
      ],
    },
  },
  {
    title: 'What is the CAP theorem?',
    slug: 'technical-cap-theorem',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Databases', 'Backend'],
    data: {
      question:
        'Explain the CAP theorem. How does it affect the design of distributed systems?',
      followUps: [
        'Give examples of CP and AP systems.',
        'What is PACELC and how does it extend CAP?',
      ],
      tips: [
        'In practice: partition tolerance is mandatory; real trade-off is C vs A.',
        'CP systems: HBase, Zookeeper. AP systems: Cassandra, DynamoDB.',
        'Know PACELC as a more nuanced extension of CAP.',
      ],
      keyPoints: [
        'CAP: Consistency, Availability, Partition tolerance — pick 2 during partition',
        'Partition tolerance is non-negotiable in real distributed systems',
        'CP vs AP trade-off depending on use case',
        'Eventual consistency is the common AP compromise',
      ],
    },
  },
  {
    title: 'Explain the event loop in Node.js',
    slug: 'technical-nodejs-event-loop',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Backend'],
    data: {
      question:
        'Explain how the Node.js event loop works. What are the different phases?',
      followUps: [
        'What is the difference between setTimeout(fn, 0) and setImmediate(fn)?',
        'How do you handle CPU-intensive tasks in Node.js?',
      ],
      tips: [
        'Draw the event loop phases: timers → pending callbacks → poll → check → close.',
        'process.nextTick and Promise microtasks run between every phase.',
        'CPU-heavy tasks block the loop — offload to worker threads.',
      ],
      keyPoints: [
        "Node.js is single-threaded using libuv's event loop",
        'Phases: timers → pending callbacks → poll → check → close',
        'Microtasks (nextTick, Promise) run between every phase',
        'CPU-bound work blocks the loop — use worker threads',
      ],
    },
  },
  {
    title: 'What is the difference between authentication and authorization?',
    slug: 'technical-authn-vs-authz',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Security', 'Backend'],
    data: {
      question:
        'What is the difference between authentication and authorization? How would you implement JWT-based auth?',
      followUps: [
        'What are the risks of storing JWT in localStorage?',
        'How do you handle token revocation with stateless JWT?',
      ],
      tips: [
        'AuthN = who are you? AuthZ = what can you do?',
        'Access token (short-lived) + refresh token (httpOnly cookie).',
        'JWT in localStorage is vulnerable to XSS — prefer httpOnly cookie.',
      ],
      keyPoints: [
        'Authentication verifies identity; authorization verifies permissions',
        'JWT = header.payload.signature, stateless, server verifies signature',
        'Access token short-lived; refresh token long-lived in httpOnly cookie',
        'Risks: localStorage XSS, missing expiry validation',
      ],
    },
  },
  {
    title: 'Explain SOLID principles',
    slug: 'technical-solid-principles',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['OOP & Design Patterns'],
    data: {
      question:
        'Explain the SOLID principles. Give a practical example of violating and fixing each principle.',
      followUps: [
        'Which SOLID principle is most commonly violated in your experience?',
        'How does dependency injection relate to SOLID?',
      ],
      tips: [
        'Walk through a refactoring example rather than just defining each principle.',
        'Tie to design patterns: Strategy (O), Factory (D), Adapter (L).',
        'Dependency Inversion is the most impactful for testability.',
      ],
      keyPoints: [
        'S: Single Responsibility — one reason to change',
        'O: Open/Closed — extend without modifying',
        'L: Liskov Substitution — subtypes are substitutable',
        'I: Interface Segregation — no fat interfaces',
        'D: Dependency Inversion — depend on abstractions',
      ],
    },
  },
  {
    title: 'How does garbage collection work?',
    slug: 'technical-garbage-collection',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Operating Systems', 'Backend'],
    data: {
      question:
        'How does garbage collection work? Explain the generational GC model used by the JVM or V8.',
      followUps: [
        'What is a stop-the-world pause and how do modern GCs minimize it?',
        'How do you detect and fix a memory leak in a Node.js application?',
      ],
      tips: [
        'Generational hypothesis: most objects die young.',
        'V8: Scavenger (young) + Mark-Compact (old).',
        'GC pauses cause latency — low-pause collectors use concurrent marking.',
      ],
      keyPoints: [
        'GC reclaims unreachable objects from roots',
        'Generational: young gen frequent fast GC, old gen less frequent',
        'V8 uses Scavenger + Mark-Compact; JVM uses similar generational model',
        'Stop-the-world pauses vs concurrent incremental GC',
      ],
    },
  },
  {
    title: 'What are common web security vulnerabilities?',
    slug: 'technical-web-security-vulnerabilities',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Security', 'Backend'],
    data: {
      question:
        'Explain XSS, CSRF, and SQL injection. How do you prevent each?',
      followUps: [
        'What is the Content Security Policy header?',
        'How does CSRF differ from XSS?',
      ],
      tips: [
        'XSS: sanitize output + CSP header. CSRF: CSRF tokens + SameSite cookies. SQLi: parameterized queries.',
        'Show you understand the attack vector, not just the fix.',
        'Mention OWASP Top 10 as a framework.',
      ],
      keyPoints: [
        'XSS: injecting scripts into page — prevent with output encoding and CSP',
        'CSRF: forged cross-site request — prevent with CSRF token or SameSite cookie',
        'SQL injection: malicious SQL input — prevent with parameterized queries',
        'Defense in depth: multiple layers, not one fix',
      ],
    },
  },
  {
    title: 'What is the difference between monolith and microservices?',
    slug: 'technical-monolith-vs-microservices',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Backend', 'System Design'],
    data: {
      question:
        'What are the trade-offs between a monolithic architecture and microservices?',
      followUps: [
        'When would you choose to stay with a monolith?',
        'What are the most common microservices failure patterns?',
      ],
      tips: [
        '"Monolith first" is often the right call for early-stage products.',
        'Microservices trade simplicity for scalability and team autonomy.',
        'Mention distributed systems challenges: latency, partial failure, data consistency.',
      ],
      keyPoints: [
        'Monolith: simpler, easier to debug, but hard to scale teams/components',
        'Microservices: independent scaling and deployment, but distributed systems complexity',
        'Data consistency across services is a major challenge',
        'Monolith first, then extract services when pain is clear',
      ],
    },
  },
  {
    title: 'How does CPU caching affect performance?',
    slug: 'technical-cpu-cache-performance',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['Operating Systems', 'Algorithms'],
    data: {
      question:
        'How does CPU caching work (L1/L2/L3)? How does cache locality affect algorithmic performance?',
      followUps: [
        'What is false sharing and why is it a problem in multithreaded code?',
        'How would you write a cache-friendly matrix multiplication?',
      ],
      tips: [
        'Demo with row-vs-column matrix traversal: row-major is cache friendly.',
        'Cache line = 64 bytes; spatial locality means sequential access is fast.',
        'False sharing: two threads writing to same cache line — nasty bug.',
      ],
      keyPoints: [
        'L1 ~4 cycles, L2 ~12, L3 ~40, RAM ~200 cycles',
        'Cache line 64 bytes — spatial locality key',
        'Sequential access is fast; random access causes cache misses',
        'False sharing in multithreaded code degrades performance',
      ],
    },
  },

  // ── HARD (6) ──────────────────────────────────────────────
  {
    title: 'How does distributed consensus work?',
    slug: 'technical-distributed-consensus-raft',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['System Design', 'Backend'],
    data: {
      question:
        'Explain how the Raft consensus algorithm achieves fault-tolerant consensus in a distributed system.',
      followUps: [
        'How does Raft differ from Paxos?',
        'What happens during a network partition in a Raft cluster?',
      ],
      tips: [
        'Know leader election: timeout triggers candidacy; wins with quorum vote.',
        'Log replication: committed once quorum acknowledges.',
        'Relate to etcd (Raft) used in Kubernetes.',
      ],
      keyPoints: [
        'Leader-based model: one leader per term elected by majority',
        'Log replication: leader appends, replicates, commits on quorum ack',
        'Tolerates f failures with 2f+1 nodes',
        'Safety: committed entries are never overwritten',
      ],
    },
  },
  {
    title: 'Deep dive: optimizing a slow SQL query',
    slug: 'technical-query-optimization-deep-dive',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Databases'],
    data: {
      question:
        'Walk me through how you would investigate and optimize a slow SQL query in a production PostgreSQL database.',
      followUps: [
        'What is the N+1 query problem and how do you fix it?',
        'When would you choose a materialized view over an index?',
      ],
      tips: [
        'EXPLAIN ANALYZE: look for Seq Scans on large tables, high-cost nodes.',
        'Push filters early, avoid functions on indexed columns in WHERE.',
        'Mention pg_stat_statements and slow query logs.',
      ],
      keyPoints: [
        'EXPLAIN ANALYZE to read query plan and identify bottlenecks',
        'Add missing selective indexes on WHERE/JOIN columns',
        'Rewrite query: push filters early, avoid SELECT *',
        'Consider partitioning, materialized views, or caching for heavy aggregations',
      ],
    },
  },
  {
    title: 'How does a database transaction log work?',
    slug: 'technical-database-transaction-log',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Databases'],
    data: {
      question:
        'Explain how the Write-Ahead Log (WAL) in PostgreSQL ensures durability and enables crash recovery.',
      followUps: [
        'How does WAL enable streaming replication?',
        'What is MVCC and how does PostgreSQL use it for isolation?',
      ],
      tips: [
        'WAL: write the log before writing data pages — log is sequential, data is random.',
        'MVCC: multiple versions of a row allow readers not to block writers.',
        'Checkpoint: periodically flush dirty pages to disk and truncate old WAL.',
      ],
      keyPoints: [
        'WAL: changes logged before applied to data pages — sequential write is fast',
        'Crash recovery: replay WAL from last checkpoint',
        'Replication: standby streams WAL and replays it',
        'MVCC: each transaction sees a consistent snapshot; no read-write blocking',
      ],
    },
  },
  {
    title: 'How does a load balancer work?',
    slug: 'technical-load-balancer-deep-dive',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Networking', 'System Design'],
    data: {
      question:
        'Explain how a load balancer works. What are the different algorithms and what are L4 vs L7 load balancing?',
      followUps: [
        'How does a load balancer handle sticky sessions?',
        'What happens when a backend goes down mid-request?',
      ],
      tips: [
        'L4 (transport): routes by IP/TCP without reading payload — fast.',
        'L7 (application): routes by URL, headers, cookies — more powerful.',
        'Algorithms: round-robin, least-connections, IP-hash, weighted.',
      ],
      keyPoints: [
        'L4 load balancing by IP/port — fast, no payload inspection',
        'L7 load balancing by HTTP headers/URL — powerful routing rules',
        'Algorithms: round-robin, least connections, IP hash, weighted',
        'Health checks, connection draining on backend removal',
      ],
    },
  },
  {
    title: 'Explain memory management without GC',
    slug: 'technical-memory-management-no-gc',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Operating Systems'],
    data: {
      question:
        "How does memory management work in C/C++ or Rust? Compare manual memory management with Rust's ownership model.",
      followUps: [
        "How does Rust's borrow checker prevent data races at compile time?",
        'What is RAII and how do smart pointers implement it in C++?',
      ],
      tips: [
        'C: malloc/free; common bugs: dangling pointers, double free, buffer overflow.',
        'Rust: one owner; move semantics; borrow checker at compile time.',
        'Rust achieves memory safety without GC — zero-cost abstractions.',
      ],
      keyPoints: [
        'C: manual malloc/free, prone to dangling pointers and leaks',
        'C++ RAII: destructor frees resources, smart pointers automate lifetime',
        'Rust ownership: one owner, move semantics, no dangling refs at compile time',
        'Rust borrow checker prevents data races — safety without GC overhead',
      ],
    },
  },
  {
    title: 'How do modern compilers optimize code?',
    slug: 'technical-compiler-optimizations',
    typeQuestion: TypeQuestion.TECHNICAL,
    difficulty: Difficulty.HARD,
    categoryNames: ['Algorithms', 'Operating Systems'],
    data: {
      question:
        'Explain key optimizations a modern compiler (e.g., LLVM) performs and how they affect runtime performance.',
      followUps: [
        'What is profile-guided optimization (PGO)?',
        'Why is premature optimization considered harmful?',
      ],
      tips: [
        'Mention -O0 vs -O2 vs -O3 and when to use each.',
        'Inlining eliminates call overhead but increases binary size.',
        'SIMD vectorization is a huge win for numerical code.',
      ],
      keyPoints: [
        'IR in SSA form for analysis',
        'Constant folding, dead code elimination, inlining',
        'Loop unrolling and SIMD vectorization',
        'Register allocation minimizes memory accesses',
      ],
    },
  },

  // ══════════════════════════════════════════════════════════
  //  SYSTEM_DESIGN  (12 câu)
  // ══════════════════════════════════════════════════════════

  // ── EASY (3) ──────────────────────────────────────────────
  {
    title: 'Design a URL shortener',
    slug: 'system-design-url-shortener',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.EASY,
    categoryNames: ['System Design', 'Databases'],
    data: {
      question: 'Design a URL shortening service like bit.ly.',
      followUps: [
        'How would you handle custom aliases?',
        'How do you expire URLs after a certain date?',
        'How would you scale to 100M shortened URLs per day?',
      ],
      tips: [
        'Think about read/write ratio first — this is read-heavy.',
        'Consider Base62 encoding for short codes.',
        'Cache frequently accessed URLs in Redis.',
      ],
      keyPoints: [
        'API design: POST /shorten, GET /:code with 301/302 redirect',
        'Hash function or Base62 encoding for short code generation',
        'DB schema: short_code, original_url, created_at, expires_at',
        'Cache layer (Redis) for hot redirects',
      ],
    },
  },
  {
    title: 'Design a rate limiter',
    slug: 'system-design-rate-limiter',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.EASY,
    categoryNames: ['System Design', 'Backend'],
    data: {
      question:
        'Design a rate limiter that limits each user to 100 requests per minute.',
      followUps: [
        'What is the difference between token bucket and sliding window algorithms?',
        'How do you share rate limit state across multiple API servers?',
      ],
      tips: [
        'Token bucket is smooth; fixed window is simple but has burst issue at boundary.',
        'Redis with atomic INCR/EXPIRE is the go-to for distributed rate limiting.',
        'Return 429 Too Many Requests with Retry-After header.',
      ],
      keyPoints: [
        'Algorithms: token bucket, leaky bucket, fixed window, sliding window',
        'Distributed state: Redis with atomic operations',
        'Key design: per user-id or per IP or per API key',
        '429 response with Retry-After header',
      ],
    },
  },
  {
    title: 'Design a parking lot system',
    slug: 'system-design-parking-lot',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.EASY,
    categoryNames: ['System Design', 'OOP & Design Patterns'],
    data: {
      question:
        'Design a parking lot system that can handle multiple floors, vehicle types, and payment.',
      followUps: [
        'How would you handle concurrent requests for the same spot?',
        'How do you generate and validate parking tickets?',
      ],
      tips: [
        'Start with object model: ParkingLot, Floor, Spot, Vehicle, Ticket, Payment.',
        'Use strategy pattern for pricing (hourly, flat rate, etc.).',
        'Show optimistic locking or a reservation system for concurrency.',
      ],
      keyPoints: [
        'Object model: ParkingLot → Floors → Spots; Vehicle types map to spot types',
        'Ticket: spot_id, vehicle_id, entry_time, exit_time, amount',
        'Concurrency: optimistic lock or atomic spot reservation',
        'Payment strategy pattern for extensible pricing',
      ],
    },
  },

  // ── MEDIUM (6) ───────────────────────────────────────────
  {
    title: 'Design a key-value store',
    slug: 'system-design-key-value-store',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['System Design', 'Databases'],
    data: {
      question: 'Design a distributed key-value store like Redis or DynamoDB.',
      followUps: [
        'How do you handle hot keys (one key getting millions of requests)?',
        'How do you handle node failures and data replication?',
      ],
      tips: [
        'Consistent hashing to distribute keys across nodes.',
        'Replication factor 3 for fault tolerance.',
        'Gossip protocol for node membership.',
      ],
      keyPoints: [
        'Consistent hashing for data distribution and minimal reshuffling on node change',
        'Replication across N nodes for fault tolerance',
        'Read/write quorum (R + W > N) for consistency',
        'Gossip protocol for decentralized cluster membership',
      ],
    },
  },
  {
    title: 'Design a notification system',
    slug: 'system-design-notification-system',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['System Design', 'Backend'],
    data: {
      question:
        'Design a notification system that supports push, email, and SMS at scale (millions of users).',
      followUps: [
        'How do you handle notification preferences per user?',
        'How do you guarantee at-least-once delivery?',
      ],
      tips: [
        'Decouple producers from delivery via message queue (Kafka/SQS).',
        'Separate workers for each channel: push, email, SMS.',
        'Idempotency key to handle retry without duplicate delivery.',
      ],
      keyPoints: [
        'Event-driven: service publishes event → notification service consumes',
        'Message queue for async, reliable delivery',
        'Per-channel workers: push (FCM/APNs), email (SES), SMS (Twilio)',
        'User preference table + idempotency for deduplication',
      ],
    },
  },
  {
    title: 'Design a news feed system',
    slug: 'system-design-news-feed',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['System Design', 'Databases'],
    data: {
      question:
        'Design a social media news feed (like Twitter/Facebook timeline).',
      followUps: [
        'What is the fan-out on write vs fan-out on read approach?',
        'How do you handle celebrity accounts with millions of followers?',
      ],
      tips: [
        'Fan-out on write: pre-compute feed for each follower — fast reads, slow writes.',
        'Fan-out on read: compute at read time — slow reads, fast writes.',
        'Hybrid: fan-out on write for regular users, on read for celebrities.',
      ],
      keyPoints: [
        'Fan-out on write vs fan-out on read trade-off',
        'Feed stored in Redis sorted set per user',
        'Hybrid approach for high-follower accounts',
        'Pagination with cursor-based approach',
      ],
    },
  },
  {
    title: 'Design a real-time chat system',
    slug: 'system-design-chat-system',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['System Design', 'Backend', 'Networking'],
    data: {
      question:
        'Design a real-time chat system like Slack or WhatsApp (1-on-1 and group chat).',
      followUps: [
        'How do you implement message ordering and deduplication?',
        'How do you handle offline users and message sync?',
      ],
      tips: [
        'WebSocket for persistent real-time connection.',
        'Message storage: append-only log per conversation.',
        'Presence service: track online/offline status.',
      ],
      keyPoints: [
        'WebSocket connections to chat servers for real-time',
        'Message service with append-only DB and sequence IDs per conversation',
        'Presence service with TTL heartbeats',
        'Push notifications for offline users via notification service',
      ],
    },
  },
  {
    title: 'Design a distributed job scheduler',
    slug: 'system-design-job-scheduler',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['System Design', 'Backend'],
    data: {
      question:
        'Design a distributed job scheduler that can run millions of cron-like jobs reliably.',
      followUps: [
        'How do you prevent a job from being executed twice (exactly-once semantics)?',
        'How do you handle jobs that take longer than their scheduled interval?',
      ],
      tips: [
        'Leader election (Raft/ZooKeeper) to prevent duplicate scheduling.',
        'Job state machine: scheduled → queued → running → done/failed.',
        'Dead letter queue for jobs that keep failing.',
      ],
      keyPoints: [
        'Scheduler service with leader election to avoid duplicates',
        'Job metadata DB: cron expression, last_run, next_run, status',
        'Worker pool pulls from queue; heartbeat for stuck job detection',
        'At-least-once with idempotent job handlers',
      ],
    },
  },
  {
    title: 'Design a search autocomplete system',
    slug: 'system-design-autocomplete',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.MEDIUM,
    categoryNames: ['System Design', 'Algorithms'],
    data: {
      question:
        'Design a search autocomplete/typeahead system (like Google Search suggestions).',
      followUps: [
        'How do you rank suggestions by relevance and frequency?',
        'How do you update suggestions in near real-time from new searches?',
      ],
      tips: [
        'Trie data structure for prefix lookup.',
        'Cache top-K suggestions per prefix in Redis.',
        'Batch update trie offline; near-real-time via log aggregation.',
      ],
      keyPoints: [
        'Trie for prefix matching; top-K results stored at each node',
        'Redis cache for hot prefixes — p99 latency target < 100ms',
        'Offline aggregation pipeline to recompute trie from search logs',
        'CDN for geographically distributed caching',
      ],
    },
  },

  // ── HARD (3) ──────────────────────────────────────────────
  {
    title: 'Design YouTube',
    slug: 'system-design-youtube',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.HARD,
    categoryNames: ['System Design', 'Backend'],
    data: {
      question:
        'Design a video streaming platform like YouTube. Focus on upload, transcoding, and streaming.',
      followUps: [
        'How do you implement adaptive bitrate streaming?',
        'How do you design the recommendation system at a high level?',
        'How do you handle 500 hours of video uploaded per minute?',
      ],
      tips: [
        'Separate upload pipeline from streaming pipeline.',
        'Transcoding is async: upload → object store → queue → workers → CDN.',
        'Adaptive bitrate: HLS/DASH serving multiple quality levels.',
      ],
      keyPoints: [
        'Upload: chunked upload to object store (S3), then async transcoding pipeline',
        'Transcoding workers: multiple resolutions and codecs (H.264, VP9)',
        'CDN for global low-latency streaming',
        'Adaptive bitrate streaming (HLS/DASH) based on client bandwidth',
      ],
    },
  },
  {
    title: 'Design a ride-sharing service',
    slug: 'system-design-ride-sharing',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.HARD,
    categoryNames: ['System Design', 'Backend'],
    data: {
      question: 'Design a ride-sharing service like Uber or Lyft.',
      followUps: [
        'How do you match riders with the nearest available driver efficiently?',
        'How do you handle surge pricing?',
        'How do you guarantee location updates at scale (millions of active drivers)?',
      ],
      tips: [
        'Location service: drivers send GPS updates every 4s → Redis geospatial index.',
        'Matching: find nearby drivers with GEORADIUS, rank by ETA.',
        'Trip state machine: requested → matched → en_route → arrived → in_trip → completed.',
      ],
      keyPoints: [
        'Real-time driver location: GPS push → Redis geospatial (GEORADIUS)',
        'Matching service: nearest N drivers, ETA ranking, lock assignment',
        'Trip state machine with event sourcing',
        'Surge pricing: ratio of demand/supply per geohash cell',
      ],
    },
  },
  {
    title: 'Design a distributed message queue',
    slug: 'system-design-distributed-message-queue',
    typeQuestion: TypeQuestion.SYSTEM_DESIGN,
    difficulty: Difficulty.HARD,
    categoryNames: ['System Design', 'Backend'],
    data: {
      question: 'Design a distributed message queue like Apache Kafka.',
      followUps: [
        'How does Kafka guarantee message ordering?',
        'How do you handle consumer lag?',
        'How does Kafka achieve high throughput with sequential disk writes?',
      ],
      tips: [
        'Topic → Partitions → Replicated logs across brokers.',
        'Ordering guaranteed per partition, not across partitions.',
        'Consumer group: each partition consumed by exactly one consumer in the group.',
      ],
      keyPoints: [
        'Topic partitioned across brokers; each partition is an append-only log',
        'Replication factor N: leader + N-1 followers per partition',
        'Consumer groups for parallel consumption; offset tracking per partition',
        'Sequential disk writes + OS page cache = high throughput',
      ],
    },
  },
];

// ─────────────────────────────────────────────────────────────
//  SEED RUNNER
// ─────────────────────────────────────────────────────────────

const CATEGORY_NAMES = [
  // Behavioral
  'Leadership',
  'Teamwork & Collaboration',
  'Conflict Resolution',
  'Communication',
  'Adaptability & Growth',
  'Time Management',
  'Ownership & Accountability',
  // Technical / System Design
  'System Design',
  'Databases',
  'Operating Systems',
  'Networking',
  'OOP & Design Patterns',
  'Security',
  'Algorithms',
  'Backend',
  'Frontend',
];

async function main() {
  const counter: Record<string, number> = {};
  for (const q of questions) {
    const k = `${q.typeQuestion}_${q.difficulty}`;
    counter[k] = (counter[k] ?? 0) + 1;
  }

  console.log(`\n Seeding ${questions.length} questions...\n`);

  await prisma.$transaction(
    async (tx) => {
      // 1. Upsert categories
      await tx.category.createMany({
        data: CATEGORY_NAMES.map((name) => ({ name })),
        skipDuplicates: true,
      });

      const allCategories = await tx.category.findMany({
        where: { name: { in: CATEGORY_NAMES } },
      });
      const catMap = Object.fromEntries(
        allCategories.map((c) => [c.name, c.id]),
      );

      // 2. Upsert questions
      for (const q of questions) {
        await tx.question.upsert({
          where: { slug: q.slug },
          update: {
            title: q.title,
            typeQuestion: q.typeQuestion,
            difficulty: q.difficulty,
            data: q.data,
            isPublished: true,
            updatedAt: new Date(),
          },
          create: {
            title: q.title,
            slug: q.slug,
            typeQuestion: q.typeQuestion,
            difficulty: q.difficulty,
            data: q.data,
            isPublished: true,
          },
        });
      }

      // 3. Link categories
      const saved = await tx.question.findMany({
        where: { slug: { in: questions.map((q) => q.slug) } },
        select: { id: true, slug: true },
      });
      const slugToId = Object.fromEntries(saved.map((q) => [q.slug, q.id]));

      const links = questions.flatMap((q) =>
        (q.categoryNames ?? [])
          .filter((name) => catMap[name] !== undefined)
          .map((name) => ({
            questionId: slugToId[q.slug],
            categoryId: catMap[name],
          })),
      );

      if (links.length > 0) {
        await tx.categoryQuestion.createMany({
          data: links,
          skipDuplicates: true,
        });
      }
    },
    {
      maxWait: 30000, // 30 giây để bắt đầu transaction
      timeout: 180000, // 3 phút để hoàn thành (tăng cao vì seed lớn)
    },
  );

  // Summary
  console.log('Done!\n');
  const types: TypeQuestion[] = [
    TypeQuestion.BEHAVIORAL,
    TypeQuestion.TECHNICAL,
    TypeQuestion.SYSTEM_DESIGN,
  ];
  for (const t of types) {
    console.log(`  ${t}`);
    for (const d of [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD]) {
      console.log(`    ${d.padEnd(6)} : ${counter[`${t}_${d}`] ?? 0}`);
    }
  }
  console.log(`\n  TOTAL  : ${questions.length} questions`);
}

main()
  .catch((e) => {
    console.error(' Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
