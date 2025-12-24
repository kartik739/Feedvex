import { loadConfig } from './config';

function main() {
  try {
    const config = loadConfig();
    console.log('Reddit Search Engine starting...');
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Port: ${config.port}`);
    console.log(`Subreddits: ${config.reddit.subreddits.join(', ')}`);
    console.log('Configuration loaded successfully');

    // TODO: Initialize services and start server
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

main();
