# Monorepo Restructure Utilities

This directory contains utilities for safely backing up and validating the monorepo restructure process.

## Files

- **backup.ts** - Creates backups of the current state using git branches
- **validation.ts** - Validates file existence, content, and directory structure
- **configValidation.ts** - Validates paths in configuration files (tsconfig, jest, package.json)
- **restructure-utils.ts** - Main CLI script that ties everything together

## Usage

### Create a Backup

Before starting the restructure, create a backup:

```bash
npx ts-node backend/utils/restructure-utils.ts backup
```

This creates a git branch with the current state for easy rollback.

### Validate Before Restructure

Check that the current project structure is valid:

```bash
npx ts-node backend/utils/restructure-utils.ts validate-pre
```

This validates:
- Critical directories exist (src/, scripts/, frontend/, config/)
- Configuration files exist
- Paths in config files are correct

### Validate After Restructure

After completing the restructure, validate the new structure:

```bash
npx ts-node backend/utils/restructure-utils.ts validate-post
```

This validates:
- New directories exist (backend/src/, backend/scripts/)
- Old directories are removed (src/, scripts/)
- Configuration files reference new paths

## Testing

Run the test suite:

```bash
npx jest --config=backend/utils/jest.config.js
```

This includes:
- Unit tests for validation functions
- Property-based tests (100+ iterations) for structure preservation

## Safety Features

- **Git Backup**: Creates a branch with the current state for easy rollback
- **Comprehensive Validation**: Checks files, directories, and config paths
- **Clear Error Messages**: Reports exactly what's wrong if validation fails
- **Exit Codes**: Returns proper exit codes for CI/CD integration
