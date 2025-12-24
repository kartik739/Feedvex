import * as fs from 'fs/promises';

/**
 * Configuration for AutocompleteService
 */
export interface AutocompleteConfig {
  maxSuggestions?: number; // Maximum number of suggestions to return
  triePath?: string; // Path to persist trie data
}

/**
 * Suggestion with term and frequency
 */
export interface Suggestion {
  term: string;
  frequency: number;
  queryCount: number;
}

/**
 * Trie node for prefix matching
 */
class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency: number; // Term frequency in corpus
  queryCount: number; // Number of times queried

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0;
    this.queryCount = 0;
  }
}

/**
 * Serializable trie structure for persistence
 */
interface SerializableTrieNode {
  children: { [key: string]: SerializableTrieNode };
  isEndOfWord: boolean;
  frequency: number;
  queryCount: number;
}

/**
 * AutocompleteService provides query suggestions based on prefix matching
 * Implements requirements 10.1-10.5 for autocomplete functionality
 */
export class AutocompleteService {
  private config: AutocompleteConfig;
  private root: TrieNode;

  constructor(config: AutocompleteConfig = {}) {
    this.config = {
      maxSuggestions: 10,
      triePath: 'autocomplete-trie.json',
      ...config,
    };
    this.root = new TrieNode();
  }

  /**
   * Adds a term to the trie with its frequency
   * Requirement 10.2: Use trie data structure for efficient prefix matching
   * @param term Term to add
   * @param frequency Term frequency in corpus
   */
  addTerm(term: string, frequency: number = 1): void {
    if (!term || term.trim() === '') {
      return;
    }

    const normalizedTerm = term.toLowerCase().trim();
    let node = this.root;

    for (const char of normalizedTerm) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.frequency = frequency;
  }

  /**
   * Records a user query to improve suggestion ranking
   * Requirement 10.5: Record selections to improve future ranking
   * @param query User query
   */
  recordQuery(query: string): void {
    if (!query || query.trim() === '') {
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    let node = this.root;

    for (const char of normalizedQuery) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }

    node.isEndOfWord = true;
    node.queryCount++;
  }

  /**
   * Gets autocomplete suggestions for a prefix
   * Requirements 10.1, 10.3: Return up to 10 suggestions, prioritize by frequency
   * @param prefix Prefix to match
   * @param limit Maximum number of suggestions (default from config)
   * @returns Array of suggestions sorted by frequency
   */
  getSuggestions(prefix: string, limit?: number): Suggestion[] {
    if (!prefix || prefix.trim() === '') {
      return [];
    }

    const maxSuggestions = limit || this.config.maxSuggestions!;
    const normalizedPrefix = prefix.toLowerCase().trim();

    // Find the node corresponding to the prefix
    let node = this.root;
    for (const char of normalizedPrefix) {
      if (!node.children.has(char)) {
        return []; // Prefix not found
      }
      node = node.children.get(char)!;
    }

    // Collect all terms with this prefix
    const suggestions: Suggestion[] = [];
    this.collectSuggestions(node, normalizedPrefix, suggestions);

    // Requirement 10.3: Sort by frequency (corpus frequency + query count)
    suggestions.sort((a, b) => {
      const scoreA = a.frequency + a.queryCount * 2; // Weight queries higher
      const scoreB = b.frequency + b.queryCount * 2;
      return scoreB - scoreA;
    });

    // Requirement 10.1: Return up to maxSuggestions
    return suggestions.slice(0, maxSuggestions);
  }

  /**
   * Recursively collects all terms from a trie node
   * @param node Current trie node
   * @param prefix Current prefix
   * @param suggestions Array to collect suggestions
   */
  private collectSuggestions(node: TrieNode, prefix: string, suggestions: Suggestion[]): void {
    if (node.isEndOfWord) {
      suggestions.push({
        term: prefix,
        frequency: node.frequency,
        queryCount: node.queryCount,
      });
    }

    for (const [char, childNode] of node.children.entries()) {
      this.collectSuggestions(childNode, prefix + char, suggestions);
    }
  }

  /**
   * Builds trie from a map of terms and their frequencies
   * Requirement 10.4: Include terms from indexed documents and historical queries
   * @param terms Map of term to frequency
   */
  buildTrie(terms: Map<string, number>): void {
    this.root = new TrieNode();
    for (const [term, frequency] of terms.entries()) {
      this.addTerm(term, frequency);
    }
  }

  /**
   * Serializes trie node to JSON-compatible structure
   * @param node Trie node to serialize
   * @returns Serializable trie node
   */
  private serializeNode(node: TrieNode): SerializableTrieNode {
    const children: { [key: string]: SerializableTrieNode } = {};
    for (const [char, childNode] of node.children.entries()) {
      children[char] = this.serializeNode(childNode);
    }

    return {
      children,
      isEndOfWord: node.isEndOfWord,
      frequency: node.frequency,
      queryCount: node.queryCount,
    };
  }

  /**
   * Deserializes JSON structure to trie node
   * @param data Serializable trie node
   * @returns Trie node
   */
  private deserializeNode(data: SerializableTrieNode): TrieNode {
    const node = new TrieNode();
    node.isEndOfWord = data.isEndOfWord;
    node.frequency = data.frequency;
    node.queryCount = data.queryCount;

    for (const [char, childData] of Object.entries(data.children)) {
      node.children.set(char, this.deserializeNode(childData));
    }

    return node;
  }

  /**
   * Persists trie to disk
   * Requirement 10.2: Persist trie to disk for fast startup
   */
  async persist(): Promise<void> {
    if (!this.config.triePath) {
      throw new Error('No trie path configured for persistence');
    }

    const serialized = this.serializeNode(this.root);
    await fs.writeFile(this.config.triePath, JSON.stringify(serialized, null, 2), 'utf-8');
  }

  /**
   * Loads trie from disk
   * Requirement 10.2: Load trie from file on startup
   */
  async load(): Promise<void> {
    if (!this.config.triePath) {
      throw new Error('No trie path configured for loading');
    }

    try {
      const data = await fs.readFile(this.config.triePath, 'utf-8');
      const serialized: SerializableTrieNode = JSON.parse(data);
      this.root = this.deserializeNode(serialized);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, start with empty trie
        this.root = new TrieNode();
      } else {
        throw error;
      }
    }
  }

  /**
   * Clears all trie data
   */
  clear(): void {
    this.root = new TrieNode();
  }

  /**
   * Gets statistics about the trie
   */
  getStats(): {
    totalTerms: number;
    totalNodes: number;
  } {
    let totalTerms = 0;
    let totalNodes = 0;

    const countNodes = (node: TrieNode): void => {
      totalNodes++;
      if (node.isEndOfWord) {
        totalTerms++;
      }
      for (const child of node.children.values()) {
        countNodes(child);
      }
    };

    countNodes(this.root);

    return {
      totalTerms,
      totalNodes: totalNodes - 1, // Exclude root
    };
  }
}
