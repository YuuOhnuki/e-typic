#!/usr/bin/env bun

/**
 * スキーママイグレーション実行スクリプト
 * 使用法: bun scripts/migrate.ts [status|up]
 */

import { runPendingMigrations, showMigrationStatus } from '@/lib/db/migrations';

async function main() {
  const command = process.argv[2] || 'up';

  try {
    switch (command) {
      case 'status':
        await showMigrationStatus();
        break;
      case 'up':
      default:
        console.log('🔄 Running database migrations...\n');
        await runPendingMigrations();
        console.log('\n✅ Migration complete!\n');
        break;
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

main();
