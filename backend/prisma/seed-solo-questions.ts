import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5_000,
});

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type SoloQuestionType = 'TECHNICAL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN';

type TheoryQuestionData = {
  tips: string[];
  question: string;
  followUps: string[];
  keyPoints: string[];
};

type TopicSeed = {
  slug: string;
  questions: Record<Difficulty, string>;
  tips: string[];
  followUps: string[];
  keyPoints: string[];
};

type QuestionGroup = {
  type: SoloQuestionType;
  categoryName: string;
  topics: TopicSeed[];
};

type SoloQuestionSeed = {
  slug: string;
  type: SoloQuestionType;
  difficulty: Difficulty;
  categoryName: string;
  data: TheoryQuestionData;
};

const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const technicalTopics: TopicSeed[] = [
  {
    slug: 'rest-api-design',
    questions: {
      EASY: 'How would you design a basic REST API for managing todos?',
      MEDIUM: 'How would you design a production-ready REST API for order management?',
      HARD: 'How would you evolve a public REST API without breaking existing clients?',
    },
    tips: [
      'Start with resources, HTTP methods, and response status codes.',
      'Mention validation, pagination, and consistent error formats.',
      'Discuss backward compatibility when the API changes.',
    ],
    followUps: [
      'How would you handle idempotency for create or update requests?',
      'How would you document the contract for frontend and external clients?',
      'What metrics would show that the API is healthy?',
    ],
    keyPoints: [
      'Resource-oriented endpoint design',
      'Clear request and response contracts',
      'Validation and error handling',
      'Versioning and observability',
    ],
  },
  {
    slug: 'database-indexing',
    questions: {
      EASY: 'What is a database index and when would you add one?',
      MEDIUM: 'How would you choose indexes for a table with millions of user events?',
      HARD: 'How would you optimize slow PostgreSQL queries in a high-write workload?',
    },
    tips: [
      'Explain the read performance benefit and write overhead.',
      'Tie index choices to real query patterns.',
      'Mention query plans instead of guessing.',
    ],
    followUps: [
      'How does column order affect a composite index?',
      'When would you use a partial index?',
      'How would you detect over-indexing?',
    ],
    keyPoints: [
      'Selectivity and query patterns',
      'Composite and partial indexes',
      'EXPLAIN or EXPLAIN ANALYZE',
      'Storage and write amplification trade-offs',
    ],
  },
  {
    slug: 'caching-strategy',
    questions: {
      EASY: 'When would you use caching in a backend service?',
      MEDIUM: 'How would you add Redis caching to reduce database load?',
      HARD: 'How would you design caching for a globally distributed application?',
    },
    tips: [
      'Define cache hit, miss, TTL, and invalidation.',
      'Compare cache-aside and write-through approaches.',
      'State the consistency trade-off clearly.',
    ],
    followUps: [
      'How would you prevent cache stampede?',
      'How would you invalidate cached data after writes?',
      'What should happen when Redis is unavailable?',
    ],
    keyPoints: [
      'Cache-aside pattern',
      'TTL and invalidation strategy',
      'Staleness budget',
      'Hit rate and latency metrics',
    ],
  },
  {
    slug: 'authentication-authorization',
    questions: {
      EASY: 'What is the difference between authentication and authorization?',
      MEDIUM: 'How would you implement JWT authentication for a web application?',
      HARD: 'How would you design authorization for a multi-tenant SaaS platform?',
    },
    tips: [
      'Separate identity verification from permission checks.',
      'Mention token lifecycle and secure storage.',
      'Think about tenant boundaries and least privilege.',
    ],
    followUps: [
      'Where should refresh tokens be stored?',
      'How would you handle logout and token revocation?',
      'How would you prevent cross-tenant data access?',
    ],
    keyPoints: [
      'Authentication vs. authorization',
      'Access token and refresh token flow',
      'RBAC or ABAC permissions',
      'Tenant isolation and audit logs',
    ],
  },
  {
    slug: 'message-queues',
    questions: {
      EASY: 'Why would a backend service use a message queue?',
      MEDIUM: 'How would you process payment notifications using a message queue?',
      HARD: 'How would you design an event-driven order processing workflow?',
    },
    tips: [
      'Explain producers, queues, consumers, and retries.',
      'Mention delivery guarantees and idempotency.',
      'Discuss dead-letter queues for failed messages.',
    ],
    followUps: [
      'How would you avoid double-processing the same event?',
      'How would you monitor queue lag?',
      'How would you handle schema changes in events?',
    ],
    keyPoints: [
      'Asynchronous processing',
      'At-least-once delivery',
      'Idempotent consumers',
      'Retry and dead-letter handling',
    ],
  },
  {
    slug: 'transaction-handling',
    questions: {
      EASY: 'What is a database transaction and why is it useful?',
      MEDIUM: 'How would you safely update inventory when many users buy the same item?',
      HARD: 'How would you handle a business workflow that spans multiple services?',
    },
    tips: [
      'Use commit and rollback to explain atomicity.',
      'Discuss isolation and race conditions.',
      'For distributed flows, mention sagas and compensation.',
    ],
    followUps: [
      'When would you use optimistic locking?',
      'How would you prevent overselling?',
      'How would you recover from a failed workflow step?',
    ],
    keyPoints: [
      'ACID properties',
      'Concurrency control',
      'Isolation levels and retries',
      'Saga pattern for distributed workflows',
    ],
  },
  {
    slug: 'api-error-handling',
    questions: {
      EASY: 'How should an API return validation errors to clients?',
      MEDIUM: 'How would you design a consistent error response format for APIs?',
      HARD: 'How would you handle errors across a chain of dependent services?',
    },
    tips: [
      'Keep client-facing errors stable and safe.',
      'Include machine-readable error codes.',
      'Think about retryability and partial failure.',
    ],
    followUps: [
      'What information should not be exposed in production errors?',
      'How would support trace a failed request?',
      'How would you decide which errors are retryable?',
    ],
    keyPoints: [
      'HTTP status code mapping',
      'Consistent error schema',
      'Correlation or request IDs',
      'Timeouts, retries, and circuit breakers',
    ],
  },
  {
    slug: 'observability-logging',
    questions: {
      EASY: 'What information would you include in backend logs?',
      MEDIUM: 'How would you monitor the health of a backend API?',
      HARD: 'How would you design observability for a microservices platform?',
    },
    tips: [
      'Separate logs, metrics, and traces.',
      'Avoid logging secrets or sensitive data.',
      'Tie alerts to user impact.',
    ],
    followUps: [
      'Why are request IDs useful?',
      'What metrics would trigger alerts?',
      'How would you trace one request across services?',
    ],
    keyPoints: [
      'Structured logs',
      'Request rate, errors, and duration',
      'Distributed tracing',
      'SLO-based alerting',
    ],
  },
  {
    slug: 'rate-limiting',
    questions: {
      EASY: 'Why would you add rate limiting to an API?',
      MEDIUM: 'How would you implement rate limiting for authenticated users?',
      HARD: 'How would you design distributed rate limiting for a public API platform?',
    },
    tips: [
      'Explain abuse protection and capacity protection.',
      'Compare fixed window, sliding window, and token bucket.',
      'Mention distributed counters and retry headers.',
    ],
    followUps: [
      'Would you limit by IP, user ID, or API key?',
      'How would clients know when to retry?',
      'How would you handle different customer plans?',
    ],
    keyPoints: [
      '429 response behavior',
      'Token bucket or sliding window',
      'Redis or distributed counter storage',
      'Per-user and per-plan quotas',
    ],
  },
  {
    slug: 'background-jobs',
    questions: {
      EASY: 'When should work be moved to a background job?',
      MEDIUM: 'How would you design a reliable background job system for sending emails?',
      HARD: 'How would you operate a background processing platform with retries and priorities?',
    },
    tips: [
      'Use slow or retryable work as examples.',
      'Mention job state, retries, and backoff.',
      'Discuss idempotency and priority queues.',
    ],
    followUps: [
      'How would you make a job safe to retry?',
      'How would you handle jobs that always fail?',
      'How would you monitor worker health?',
    ],
    keyPoints: [
      'Queue-backed asynchronous processing',
      'Retry policy and backoff',
      'Idempotent handlers',
      'Dead-letter and monitoring strategy',
    ],
  },
];

const behavioralTopics: TopicSeed[] = [
  {
    slug: 'tell-me-about-yourself',
    questions: {
      EASY: 'Tell me about yourself.',
      MEDIUM: 'Walk me through your background and why it fits this role.',
      HARD: 'Tell me about yourself in a way that connects your past work to the impact you want to have here.',
    },
    tips: [
      'Use a present-past-future structure.',
      'Keep it under two minutes and tie the story to the role.',
      'Avoid reading your resume line by line.',
    ],
    followUps: [
      'What experience is most relevant to this role?',
      'Why are you interested in this team?',
      'What do you want to grow into next?',
    ],
    keyPoints: [
      'Clear narrative arc',
      'Relevant technical background',
      'Motivation for the role',
      'Concise and structured answer',
    ],
  },
  {
    slug: 'conflict-with-teammate',
    questions: {
      EASY: 'Tell me about a time you had a disagreement with a teammate.',
      MEDIUM: 'Describe a conflict with a teammate where you had to reach alignment.',
      HARD: 'Tell me about a serious technical disagreement where the team was split and you had to move the decision forward.',
    },
    tips: [
      'Use the STAR structure.',
      'Focus on behavior, not blame.',
      'Show how you listened and found shared goals.',
    ],
    followUps: [
      'What did you learn from the disagreement?',
      'How did you keep the relationship productive?',
      'What would you do differently now?',
    ],
    keyPoints: [
      'Clear conflict context',
      'Respectful communication',
      'Evidence-based decision making',
      'Positive outcome or learning',
    ],
  },
  {
    slug: 'handling-feedback',
    questions: {
      EASY: 'Tell me about a time you received constructive feedback.',
      MEDIUM: 'Describe feedback that changed the way you work.',
      HARD: 'Tell me about a time you received difficult feedback from a senior stakeholder and turned it into measurable improvement.',
    },
    tips: [
      'Choose feedback that was meaningful, not superficial.',
      'Explain the action you took afterward.',
      'Show maturity and ownership.',
    ],
    followUps: [
      'How did you react at first?',
      'What specific behavior did you change?',
      'How did you know you improved?',
    ],
    keyPoints: [
      'Openness to feedback',
      'Concrete improvement plan',
      'Measurable behavior change',
      'Growth mindset',
    ],
  },
  {
    slug: 'missed-deadline',
    questions: {
      EASY: 'Tell me about a time you missed a deadline.',
      MEDIUM: 'Describe a project where delivery risk appeared late and how you handled it.',
      HARD: 'Tell me about a high-pressure deadline where you had to renegotiate scope without losing stakeholder trust.',
    },
    tips: [
      'Be honest about the cause.',
      'Explain communication and trade-offs.',
      'End with prevention steps.',
    ],
    followUps: [
      'When did you notify stakeholders?',
      'How did you decide what to cut or delay?',
      'What process did you change afterward?',
    ],
    keyPoints: [
      'Ownership of the miss',
      'Early risk communication',
      'Scope and priority trade-offs',
      'Preventive process change',
    ],
  },
  {
    slug: 'production-incident',
    questions: {
      EASY: 'Tell me about a time something broke in production.',
      MEDIUM: 'Describe an incident you helped resolve and what you learned from it.',
      HARD: 'Tell me about a major production incident where you coordinated debugging, communication, and follow-up prevention.',
    },
    tips: [
      'Separate mitigation from root cause analysis.',
      'Mention communication during the incident.',
      'Include postmortem actions.',
    ],
    followUps: [
      'How did you prioritize actions during the incident?',
      'What monitoring helped or was missing?',
      'What long-term fix came from the postmortem?',
    ],
    keyPoints: [
      'Calm incident response',
      'User impact mitigation',
      'Root cause analysis',
      'Actionable postmortem follow-up',
    ],
  },
  {
    slug: 'prioritization-pressure',
    questions: {
      EASY: 'How do you prioritize tasks when everything feels urgent?',
      MEDIUM: 'Tell me about a time you had to choose between multiple important tasks.',
      HARD: 'Describe a situation where competing business and technical priorities forced you to make a difficult trade-off.',
    },
    tips: [
      'Explain the prioritization criteria.',
      'Talk about impact, urgency, and dependencies.',
      'Show that you communicated trade-offs.',
    ],
    followUps: [
      'Who did you involve in the decision?',
      'What did you deprioritize?',
      'How did you measure whether the choice was right?',
    ],
    keyPoints: [
      'Impact-based prioritization',
      'Stakeholder alignment',
      'Clear trade-off communication',
      'Outcome measurement',
    ],
  },
  {
    slug: 'influencing-without-authority',
    questions: {
      EASY: 'Tell me about a time you influenced someone without being their manager.',
      MEDIUM: 'Describe how you got buy-in for an idea across your team.',
      HARD: 'Tell me about a time you influenced a cross-functional decision without formal authority.',
    },
    tips: [
      'Show how you understood other people incentives.',
      'Use data, prototypes, or examples to persuade.',
      'Avoid making the answer sound political.',
    ],
    followUps: [
      'What objections did people have?',
      'How did you adapt your message for different audiences?',
      'What happened after the decision?',
    ],
    keyPoints: [
      'Empathy for stakeholders',
      'Evidence-based persuasion',
      'Clear communication',
      'Durable alignment',
    ],
  },
  {
    slug: 'mentoring-teammate',
    questions: {
      EASY: 'Tell me about a time you helped a teammate learn something.',
      MEDIUM: 'Describe how you mentored a teammate through a technical challenge.',
      HARD: 'Tell me about a time you raised the technical level of a team, not just one person.',
    },
    tips: [
      'Explain the learner starting point.',
      'Describe your coaching method.',
      'Show impact beyond being helpful.',
    ],
    followUps: [
      'How did you adapt to their learning style?',
      'How did you avoid taking over the work?',
      'What changed for the teammate or team afterward?',
    ],
    keyPoints: [
      'Patience and clarity',
      'Practical guidance',
      'Empowerment instead of control',
      'Visible improvement',
    ],
  },
  {
    slug: 'dealing-with-ambiguity',
    questions: {
      EASY: 'Tell me about a time you worked on an unclear task.',
      MEDIUM: 'Describe a project where requirements were ambiguous and how you clarified them.',
      HARD: 'Tell me about a time you turned an ambiguous business problem into a concrete technical plan.',
    },
    tips: [
      'Start with what was unknown.',
      'Mention clarifying questions and assumptions.',
      'Show how you reduced risk incrementally.',
    ],
    followUps: [
      'What assumptions did you validate first?',
      'How did you keep stakeholders aligned?',
      'How did you avoid overbuilding?',
    ],
    keyPoints: [
      'Requirement clarification',
      'Assumption tracking',
      'Incremental delivery',
      'Risk reduction',
    ],
  },
  {
    slug: 'disagreeing-with-stakeholder',
    questions: {
      EASY: 'Tell me about a time you disagreed with a stakeholder.',
      MEDIUM: 'Describe a time you pushed back on a request that you believed was not the right priority.',
      HARD: 'Tell me about a time you challenged a senior stakeholder while preserving trust and momentum.',
    },
    tips: [
      'Be respectful and specific.',
      'Explain the business or technical risk.',
      'Offer an alternative instead of only saying no.',
    ],
    followUps: [
      'What evidence did you use?',
      'How did you handle disagreement if they still pushed back?',
      'What was the final outcome?',
    ],
    keyPoints: [
      'Respectful pushback',
      'Risk and impact framing',
      'Alternative proposal',
      'Trust-preserving communication',
    ],
  },
];

const systemDesignTopics: TopicSeed[] = [
  {
    slug: 'url-shortener',
    questions: {
      EASY: 'How would you design a URL shortening service like Bitly?',
      MEDIUM: 'Design a URL shortener that supports custom aliases and high read traffic.',
      HARD: 'Design a globally distributed URL shortener with analytics and abuse prevention.',
    },
    tips: [
      'Start with requirement clarification such as read/write ratio.',
      'Discuss API design, data model, and redirect latency.',
      'Explain the hashing mechanism vs. base-62 encoding.',
    ],
    followUps: [
      'How would you handle custom aliases?',
      'What database would you choose for high-scale reads?',
      'How would you prevent predictable or abusive URLs?',
    ],
    keyPoints: [
      'Short code generation',
      'Database indexing and caching',
      'Redirect performance',
      'Analytics and abuse controls',
    ],
  },
  {
    slug: 'chat-application',
    questions: {
      EASY: 'How would you design a simple one-to-one chat application?',
      MEDIUM: 'Design a chat application that supports groups, delivery status, and unread counts.',
      HARD: 'Design a real-time chat platform with multi-device sync and offline delivery.',
    },
    tips: [
      'Clarify real-time requirements and message durability.',
      'Discuss WebSocket connections and fallback behavior.',
      'Separate message storage from delivery state.',
    ],
    followUps: [
      'How would you handle users reconnecting?',
      'How would you maintain message ordering?',
      'How would unread counts stay correct across devices?',
    ],
    keyPoints: [
      'WebSocket or real-time gateway',
      'Message persistence',
      'Delivery and read receipts',
      'Ordering and offline sync',
    ],
  },
  {
    slug: 'notification-system',
    questions: {
      EASY: 'How would you design a simple notification system?',
      MEDIUM: 'Design a multi-channel notification service for a SaaS product.',
      HARD: 'Design a high-volume notification platform for millions of users.',
    },
    tips: [
      'Clarify channels such as email, push, and in-app.',
      'Mention templates, preferences, and suppression rules.',
      'Keep sending asynchronous and observable.',
    ],
    followUps: [
      'How would users unsubscribe?',
      'How would you avoid duplicate notifications?',
      'How would you handle provider outages?',
    ],
    keyPoints: [
      'Notification templates',
      'User preferences',
      'Queue-based delivery',
      'Retry, deduplication, and provider fallback',
    ],
  },
  {
    slug: 'file-storage-service',
    questions: {
      EASY: 'How would you design a basic file upload and storage service?',
      MEDIUM: 'Design a file storage service that supports large uploads and previews.',
      HARD: 'Design a secure global file storage platform with compliance requirements.',
    },
    tips: [
      'Separate file bytes from metadata.',
      'Discuss signed URLs and access control.',
      'Mention scanning, previews, and lifecycle policies.',
    ],
    followUps: [
      'How would users download files securely?',
      'How would you resume interrupted uploads?',
      'How would you handle encryption and data residency?',
    ],
    keyPoints: [
      'Object storage',
      'Metadata database',
      'Signed URLs',
      'Security and lifecycle management',
    ],
  },
  {
    slug: 'news-feed',
    questions: {
      EASY: 'How would you design a simple social media news feed?',
      MEDIUM: 'Design a scalable feed for users who follow many accounts.',
      HARD: 'Design a personalized feed platform like Twitter or LinkedIn.',
    },
    tips: [
      'Clarify freshness, ranking, and following relationships.',
      'Compare fanout-on-read and fanout-on-write.',
      'Discuss hot users and cache strategy.',
    ],
    followUps: [
      'When would you precompute feeds?',
      'How would you handle users with millions of followers?',
      'How would you evaluate feed quality?',
    ],
    keyPoints: [
      'User-follow graph',
      'Fanout strategy',
      'Timeline cache',
      'Ranking and moderation pipeline',
    ],
  },
  {
    slug: 'ride-matching-service',
    questions: {
      EASY: 'How would you design a basic ride matching service?',
      MEDIUM: 'Design a ride matching system for a city with thousands of drivers.',
      HARD: 'Design a large-scale ride dispatch platform like Uber.',
    },
    tips: [
      'Clarify rider, driver, and trip lifecycle.',
      'Discuss real-time location updates.',
      'Mention geospatial indexing and atomic assignment.',
    ],
    followUps: [
      'How would you choose the nearest driver?',
      'How would you avoid assigning one driver twice?',
      'How would you optimize for ETA and acceptance probability?',
    ],
    keyPoints: [
      'Location ingestion',
      'Geospatial search',
      'Driver availability state',
      'Dispatch optimization',
    ],
  },
  {
    slug: 'video-streaming-platform',
    questions: {
      EASY: 'How would you design a simple video upload and playback service?',
      MEDIUM: 'Design a video platform that supports multiple playback qualities.',
      HARD: 'Design a global video streaming platform like YouTube.',
    },
    tips: [
      'Clarify upload, processing, and playback flows.',
      'Discuss transcoding and adaptive bitrate streaming.',
      'Mention CDN delivery and analytics.',
    ],
    followUps: [
      'Why do we need transcoding?',
      'How would the player choose video quality?',
      'How would you reduce startup latency globally?',
    ],
    keyPoints: [
      'Object storage for raw video',
      'Transcoding pipeline',
      'Adaptive bitrate playback',
      'CDN and viewing analytics',
    ],
  },
  {
    slug: 'payment-processing-system',
    questions: {
      EASY: 'How would you design a simple payment processing flow?',
      MEDIUM: 'Design a payment system that integrates with an external provider.',
      HARD: 'Design a reliable wallet and payment ledger system.',
    },
    tips: [
      'Focus on state transitions and idempotency.',
      'Discuss webhooks and reconciliation.',
      'Do not store raw card data.',
    ],
    followUps: [
      'How would you prevent duplicate charges?',
      'How would you verify provider webhooks?',
      'How would you guarantee balance correctness?',
    ],
    keyPoints: [
      'Payment state machine',
      'Idempotent requests',
      'Webhook verification',
      'Immutable ledger and reconciliation',
    ],
  },
  {
    slug: 'search-autocomplete',
    questions: {
      EASY: 'How would you design a basic search autocomplete feature?',
      MEDIUM: 'Design autocomplete for a large product catalog.',
      HARD: 'Design a global search autocomplete system with personalization.',
    },
    tips: [
      'Clarify prefix matching and latency goals.',
      'Mention ranking by popularity or relevance.',
      'Discuss freshness, localization, and safety filters.',
    ],
    followUps: [
      'How would you rank suggestions?',
      'How would you cache hot prefixes?',
      'How would you merge global and personal suggestions?',
    ],
    keyPoints: [
      'Prefix index',
      'Suggestion ranking',
      'Hot prefix caching',
      'Personalization and moderation',
    ],
  },
  {
    slug: 'online-booking-platform',
    questions: {
      EASY: 'How would you design a simple appointment booking system?',
      MEDIUM: 'Design a booking platform with payment and reservation holds.',
      HARD: 'Design a high-scale booking platform for mentors across time zones.',
    },
    tips: [
      'Clarify availability, booking states, and time zones.',
      'Discuss preventing double booking.',
      'Mention payment, cancellation, and calendar sync.',
    ],
    followUps: [
      'How would users see available slots?',
      'How would hold expiration work?',
      'How would you sync external calendars?',
    ],
    keyPoints: [
      'Availability model',
      'Atomic slot reservation',
      'Booking lifecycle',
      'Time zone safe scheduling',
    ],
  },
];

const questionGroups: QuestionGroup[] = [
  {
    type: 'TECHNICAL',
    categoryName: 'Technical',
    topics: technicalTopics,
  },
  {
    type: 'BEHAVIORAL',
    categoryName: 'Behavioral',
    topics: behavioralTopics,
  },
  {
    type: 'SYSTEM_DESIGN',
    categoryName: 'System Design',
    topics: systemDesignTopics,
  },
];

function toSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const questions: SoloQuestionSeed[] = questionGroups.flatMap((group) =>
  group.topics.flatMap((topic) =>
    difficulties.map((difficulty) => {
      const question = topic.questions[difficulty];

      return {
        slug: `solo-${toSlug(group.categoryName)}-${difficulty.toLowerCase()}-${topic.slug}`,
        type: group.type,
        difficulty,
        categoryName: group.categoryName,
        data: {
          tips: topic.tips,
          question,
          followUps: topic.followUps,
          keyPoints: topic.keyPoints,
        },
      };
    }),
  ),
);

async function main() {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const categoryIds = new Map<string, number>();

    for (const categoryName of questionGroups.map((group) => group.categoryName)) {
      const categoryResult = await client.query<{ id: number }>(
        `
          insert into categories (name)
          values ($1)
          on conflict (name) do update set name = excluded.name
          returning id
        `,
        [categoryName],
      );

      categoryIds.set(categoryName, categoryResult.rows[0].id);
    }

    for (const seed of questions) {
      const questionResult = await client.query<{ id: number }>(
        `
          insert into questions (title, slug, difficulty, type, is_published, created_at, updated_at)
          values ($1, $2, $3::"Difficulty", $4::"QuestionType", true, now(), now())
          on conflict (slug) do update set
            title = excluded.title,
            difficulty = excluded.difficulty,
            type = excluded.type,
            is_published = true,
            updated_at = now()
          returning id
        `,
        [seed.data.question, seed.slug, seed.difficulty, seed.type],
      );

      const questionId = questionResult.rows[0].id;

      await client.query(
        `
          insert into theory_questions (question_id, data)
          values ($1, $2::jsonb)
          on conflict (question_id) do update set data = excluded.data
        `,
        [questionId, JSON.stringify(seed.data)],
      );

      const categoryId = categoryIds.get(seed.categoryName);
      if (categoryId) {
        await client.query(
          `
            insert into question_categories (question_id, category_id)
            values ($1, $2)
            on conflict (question_id, category_id) do nothing
          `,
          [questionId, categoryId],
        );
      }
    }

    await client.query('commit');
    console.log(`Seeded ${questions.length} solo interview questions.`);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
