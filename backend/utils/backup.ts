import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Backup utility for monorepo restructure
 * Creates a backup of the current state before restructuring
 */

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  error?: string;
  timestamp: string;
}

/**
 * Creates a backup of the current repository state
 * Uses git to create a stash with all changes including untracked files
 */
export function createBackup(): BackupResult {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        error: 'Not a git repository. Backup requires git.',
        timestamp
      };
    }

    // Create a backup branch with current state
    const branchName = `backup-before-restructure-${timestamp}`;
    
    // Stash any uncommitted changes
    try {
      execSync('git stash push -u -m "Pre-restructure backup"', { stdio: 'pipe' });
    } catch {
      // No changes to stash, that's fine
    }

    // Create backup branch
    execSync(`git branch ${branchName}`, { stdio: 'pipe' });

    return {
      success: true,
      backupPath: branchName,
      timestamp
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp
    };
  }
}
