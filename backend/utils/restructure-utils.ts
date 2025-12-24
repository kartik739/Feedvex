#!/usr/bin/env ts-node

/**
 * Main utility script for monorepo restructure
 * Provides backup and validation functionality
 */

import { createBackup, BackupResult } from './backup';
import { 
  validateFileExists, 
  validateDirectoryExists, 
  validateFilesExist,
  getAllFiles,
  ValidationResult 
} from './validation';
import {
  validateAllConfigPaths,
  validateTsConfigPaths,
  validateJestConfigPaths,
  validatePackageJsonPaths
} from './configValidation';

/**
 * Creates a backup of the current state
 */
export function backup(): BackupResult {
  console.log('Creating backup...');
  
  const gitBackup = createBackup();
  if (gitBackup.success) {
    console.log(`✓ Git backup created: ${gitBackup.backupPath}`);
    return gitBackup;
  }
  
  console.error(`✗ Backup failed: ${gitBackup.error}`);
  return gitBackup;
}

/**
 * Validates the current project structure before restructuring
 */
export function validatePreRestructure(): boolean {
  console.log('\nValidating current project structure...\n');
  
  let allValid = true;

  console.log('Checking directories...');
  const dirs = ['src', 'scripts', 'frontend', 'config'];
  for (const dir of dirs) {
    const result = validateDirectoryExists(dir);
    if (!result.valid) {
      console.log(`  ✗ ${dir}: ${result.errors.join(', ')}`);
      allValid = false;
    } else {
      console.log(`  ✓ ${dir}`);
    }
  }

  console.log('\nChecking configuration files...');
  const files = [
    'package.json',
    'tsconfig.json',
    'jest.config.js',
    '.env',
    'Dockerfile',
    'docker-compose.yml'
  ];
  for (const file of files) {
    const result = validateFileExists(file);
    if (!result.valid) {
      console.log(`  ✗ ${file}: ${result.errors.join(', ')}`);
      allValid = false;
    } else {
      console.log(`  ✓ ${file}`);
    }
  }

  console.log('\nValidating configuration file paths...');
  const configResults = validateAllConfigPaths();
  
  console.log('\n  tsconfig.json:');
  console.log(`    Status: ${configResults.tsconfig.valid ? '✓' : '✗'}`);
  if (configResults.tsconfig.pathsFound.length > 0) {
    console.log(`    Paths: ${configResults.tsconfig.pathsFound.join(', ')}`);
  }
  if (configResults.tsconfig.errors.length > 0) {
    console.log(`    Errors: ${configResults.tsconfig.errors.join(', ')}`);
    allValid = false;
  }

  console.log('\n  jest.config.js:');
  console.log(`    Status: ${configResults.jest.valid ? '✓' : '✗'}`);
  if (configResults.jest.pathsFound.length > 0) {
    console.log(`    Paths: ${configResults.jest.pathsFound.join(', ')}`);
  }

  console.log('\n  package.json:');
  console.log(`    Status: ${configResults.packageJson.valid ? '✓' : '✗'}`);
  if (configResults.packageJson.pathsFound.length > 0) {
    console.log(`    Paths: ${configResults.packageJson.pathsFound.slice(0, 5).join(', ')}...`);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Overall validation: ${allValid ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('='.repeat(50));

  return allValid;
}

/**
 * Validates the project structure after restructuring
 */
export function validatePostRestructure(): boolean {
  console.log('\nValidating restructured project...\n');
  
  let allValid = true;

  console.log('Checking new directory structure...');
  const newDirs = ['backend/src', 'backend/scripts', 'frontend/src'];
  for (const dir of newDirs) {
    const result = validateDirectoryExists(dir);
    if (!result.valid) {
      console.log(`  ✗ ${dir}: ${result.errors.join(', ')}`);
      allValid = false;
    } else {
      console.log(`  ✓ ${dir}`);
    }
  }

  console.log('\nChecking old directories removed...');
  const oldDirs = ['src', 'scripts'];
  for (const dir of oldDirs) {
    const result = validateDirectoryExists(dir);
    if (result.valid) {
      console.log(`  ✗ ${dir}: Should have been removed`);
      allValid = false;
    } else {
      console.log(`  ✓ ${dir} (removed)`);
    }
  }

  console.log('\nValidating configuration file paths...');
  const configResults = validateAllConfigPaths();
  
  const tsConfigValid = configResults.tsconfig.pathsFound.some(p => p.includes('backend/src'));
  console.log(`  tsconfig.json: ${tsConfigValid ? '✓' : '✗'} (references backend/src)`);
  if (!tsConfigValid) allValid = false;

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Overall validation: ${allValid ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('='.repeat(50));

  return allValid;
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'backup':
      backup();
      break;
    case 'validate-pre':
      const preValid = validatePreRestructure();
      process.exit(preValid ? 0 : 1);
      break;
    case 'validate-post':
      const postValid = validatePostRestructure();
      process.exit(postValid ? 0 : 1);
      break;
    default:
      console.log('Usage:');
      console.log('  ts-node backend/utils/restructure-utils.ts backup          - Create backup');
      console.log('  ts-node backend/utils/restructure-utils.ts validate-pre    - Validate before restructure');
      console.log('  ts-node backend/utils/restructure-utils.ts validate-post   - Validate after restructure');
      process.exit(1);
  }
}

// Export for use in tests
export {
  validateFileExists,
  validateDirectoryExists,
  validateFilesExist,
  getAllFiles,
  validateTsConfigPaths,
  validateJestConfigPaths,
  validatePackageJsonPaths,
  validateAllConfigPaths
};
