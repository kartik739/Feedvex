import { DocumentStore } from '../src/services/document-store';
import { Indexer } from '../src/services/indexer';
import { TextProcessor } from '../src/services/text-processor';

/**
 * Seed script to add test data to the search engine
 * Run with: npx ts-node scripts/seed-test-data.ts
 */

const samplePosts = [
  {
    id: 'test1',
    title: 'Introduction to TypeScript: A Comprehensive Guide',
    content: 'TypeScript is a strongly typed programming language that builds on JavaScript. It adds optional static typing to the language, which can help catch errors early in development.',
    url: 'https://reddit.com/r/programming/test1',
    subreddit: 'programming',
    author: 'test_user_1',
    score: 150,
    numComments: 45,
    createdAt: new Date('2024-12-10'),
  },
  {
    id: 'test2',
    title: 'React vs Vue: Which Framework Should You Choose?',
    content: 'Comparing React and Vue.js frameworks for modern web development. Both have their strengths and are excellent choices for building user interfaces.',
    url: 'https://reddit.com/r/webdev/test2',
    subreddit: 'webdev',
    author: 'test_user_2',
    score: 230,
    numComments: 78,
    createdAt: new Date('2024-12-12'),
  },
  {
    id: 'test3',
    title: 'Machine Learning Basics: Getting Started with Python',
    content: 'Learn the fundamentals of machine learning using Python. This guide covers supervised learning, neural networks, and popular libraries like TensorFlow and PyTorch.',
    url: 'https://reddit.com/r/machinelearning/test3',
    subreddit: 'machinelearning',
    author: 'test_user_3',
    score: 420,
    numComments: 112,
    createdAt: new Date('2024-12-15'),
  },
  {
    id: 'test4',
    title: 'Docker Best Practices for Production Deployments',
    content: 'Essential Docker best practices including multi-stage builds, security considerations, and optimization techniques for production environments.',
    url: 'https://reddit.com/r/devops/test4',
    subreddit: 'devops',
    author: 'test_user_4',
    score: 310,
    numComments: 67,
    createdAt: new Date('2024-12-14'),
  },
  {
    id: 'test5',
    title: 'Understanding JavaScript Closures and Scope',
    content: 'Deep dive into JavaScript closures, lexical scope, and how they work. Includes practical examples and common use cases in modern JavaScript development.',
    url: 'https://reddit.com/r/javascript/test5',
    subreddit: 'javascript',
    author: 'test_user_5',
    score: 189,
    numComments: 34,
    createdAt: new Date('2024-12-11'),
  },
  {
    id: 'test6',
    title: 'GraphQL vs REST: API Design Patterns',
    content: 'Comparing GraphQL and REST API architectures. Learn when to use each approach and the trade-offs involved in API design decisions.',
    url: 'https://reddit.com/r/programming/test6',
    subreddit: 'programming',
    author: 'test_user_6',
    score: 275,
    numComments: 91,
    createdAt: new Date('2024-12-13'),
  },
  {
    id: 'test7',
    title: 'CSS Grid Layout: Complete Guide',
    content: 'Master CSS Grid with this comprehensive guide. Learn about grid containers, grid items, and how to create responsive layouts with ease.',
    url: 'https://reddit.com/r/webdev/test7',
    subreddit: 'webdev',
    author: 'test_user_7',
    score: 156,
    numComments: 28,
    createdAt: new Date('2024-12-09'),
  },
  {
    id: 'test8',
    title: 'Node.js Performance Optimization Tips',
    content: 'Improve your Node.js application performance with these optimization techniques including clustering, caching, and async patterns.',
    url: 'https://reddit.com/r/node/test8',
    subreddit: 'node',
    author: 'test_user_8',
    score: 198,
    numComments: 52,
    createdAt: new Date('2024-12-16'),
  },
  {
    id: 'test9',
    title: 'Git Workflow Strategies for Teams',
    content: 'Explore different Git branching strategies including Git Flow, GitHub Flow, and trunk-based development for effective team collaboration.',
    url: 'https://reddit.com/r/programming/test9',
    subreddit: 'programming',
    author: 'test_user_9',
    score: 342,
    numComments: 89,
    createdAt: new Date('2024-12-08'),
  },
  {
    id: 'test10',
    title: 'Database Indexing: Performance Optimization',
    content: 'Understanding database indexes and how they improve query performance. Covers B-tree indexes, hash indexes, and when to use each type.',
    url: 'https://reddit.com/r/database/test10',
    subreddit: 'database',
    author: 'test_user_10',
    score: 267,
    numComments: 73,
    createdAt: new Date('2024-12-17'),
  },
];

async function seedTestData() {
  console.log('🌱 Seeding test data...\n');

  // Initialize services
  const textProcessor = new TextProcessor();
  const indexer = new Indexer({
    indexPath: './data/index.json',
    autoPersist: false,
  });
  const documentStore = new DocumentStore({
    maxDocuments: 100000,
  });

  // Add documents
  for (const post of samplePosts) {
    console.log(`Adding: ${post.title}`);
    
    // Store document
    documentStore.addDocument({
      id: post.id,
      title: post.title,
      content: post.content,
      url: post.url,
      metadata: {
        subreddit: post.subreddit,
        author: post.author,
        score: post.score,
        numComments: post.numComments,
        createdAt: post.createdAt,
      },
    });

    // Index document
    const tokens = textProcessor.tokenize(`${post.title} ${post.content}`);
    indexer.indexDocument(post.id, tokens);
  }

  console.log(`\n✅ Successfully added ${samplePosts.length} test documents!`);
  console.log('\nYou can now:');
  console.log('1. Start the server: npm run dev:backend');
  console.log('2. Search for terms like: "TypeScript", "React", "Docker", "JavaScript"');
  console.log('3. Test the API at: http://localhost:3001/api/v1/search?q=TypeScript\n');
}

// Run the seed script
seedTestData().catch((error) => {
  console.error('❌ Error seeding data:', error);
  process.exit(1);
});
