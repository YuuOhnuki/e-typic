import { getDbClient } from './client';

/**
 * 指定されたテーブルに列が存在するかチェック
 */
async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  const db = getDbClient();
  try {
    const result = await db.execute(`PRAGMA table_info(${tableName})`);
    return result.rows.some((row) => {
      if (Array.isArray(row)) {
        return row[1] === columnName; // name is at index 1
      }
      return (row as Record<string, unknown>).name === columnName;
    });
  } catch (error) {
    console.error(`Failed to check column ${columnName} in ${tableName}:`, error);
    return false;
  }
}

/**
 * データベーススキーマのマイグレーション
 * 既存データを保持しながら段階的にスキーマを更新する
 */

export const MIGRATIONS = [
  {
    id: 'init',
    description: '初期スキーマ作成',
    up: async () => {
      // このマイグレーションはスキップ（schema.ts で初期化）
    },
  },
  {
    id: 'add_user_stats',
    description: 'usersテーブルに統計情報用列を追加',
    up: async () => {
      const db = getDbClient();
      try {
        // 列の存在確認（既に存在する場合はスキップ）
        if (!(await columnExists('users', 'total_games'))) {
          await db.execute(`
            ALTER TABLE users ADD COLUMN total_games INTEGER NOT NULL DEFAULT 0
          `);
        }
        if (!(await columnExists('users', 'total_experience'))) {
          await db.execute(`
            ALTER TABLE users ADD COLUMN total_experience INTEGER NOT NULL DEFAULT 0
          `);
        }
        if (!(await columnExists('users', 'best_kpm'))) {
          await db.execute(`
            ALTER TABLE users ADD COLUMN best_kpm REAL NOT NULL DEFAULT 0
          `);
        }
        if (!(await columnExists('users', 'best_correct_rate'))) {
          await db.execute(`
            ALTER TABLE users ADD COLUMN best_correct_rate REAL NOT NULL DEFAULT 0
          `);
        }
        console.log('✓ Migration: add_user_stats completed');
      } catch (error) {
        console.error('✗ Migration: add_user_stats failed', error);
        throw error;
      }
    },
  },
  {
    id: 'add_game_results_user_link',
    description: 'game_resultsテーブルにuser_idを追加',
    up: async () => {
      const db = getDbClient();
      try {
        if (!(await columnExists('game_results', 'user_id'))) {
          await db.execute(`
            ALTER TABLE game_results ADD COLUMN user_id TEXT
          `);
        }
        console.log('✓ Migration: add_game_results_user_link completed');
      } catch (error) {
        console.error('✗ Migration: add_game_results_user_link failed', error);
        throw error;
      }
    },
  },
];

/**
 * 実行済みマイグレーションを記録するテーブルを作成
 */
export async function createMigrationsTable() {
  const db = getDbClient();
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        executed_at INTEGER NOT NULL DEFAULT (unixepoch())
      )
    `);
  } catch (error) {
    console.error('Failed to create migrations table:', error);
    throw error;
  }
}

/**
 * 実行済みマイグレーションを取得
 */
export async function getExecutedMigrations(): Promise<string[]> {
  const db = getDbClient();
  try {
    const result = await db.execute({
      sql: 'SELECT id FROM schema_migrations ORDER BY executed_at',
      args: [],
    });

    return result.rows
      .map((row) => {
        if (Array.isArray(row)) {
          return row[0] as string;
        }
        return (row as Record<string, unknown>).id as string;
      });
  } catch (error) {
    console.error('Failed to get executed migrations:', error);
    return [];
  }
}

/**
 * 単一のマイグレーションを実行
 */
export async function executeMigration(migrationId: string) {
  const db = getDbClient();
  const migration = MIGRATIONS.find((m) => m.id === migrationId);
  if (!migration) {
    throw new Error(`Migration not found: ${migrationId}`);
  }

  try {
    await migration.up();
    await db.execute(
      `INSERT INTO schema_migrations (id) VALUES (?)`,
      [migrationId]
    );
    return true;
  } catch (error) {
    console.error(`Failed to execute migration ${migrationId}:`, error);
    throw error;
  }
}

/**
 * 全ての未実行マイグレーションを実行
 */
export async function runPendingMigrations() {
  try {
    // マイグレーションテーブルを作成
    await createMigrationsTable();

    // 実行済みマイグレーションを取得
    const executed = await getExecutedMigrations();

    // 未実行のマイグレーションをフィルター
    const pending = MIGRATIONS.filter((m) => !executed.includes(m.id));

    if (pending.length === 0) {
      console.log('✓ All migrations are up to date');
      return;
    }

    console.log(`Running ${pending.length} pending migration(s)...`);

    // マイグレーションを順序に実行
    for (const migration of pending) {
      console.log(`Running migration: ${migration.id} - ${migration.description}`);
      await executeMigration(migration.id);
    }

    console.log('✓ All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * マイグレーションの状態を確認
 */
export async function showMigrationStatus() {
  try {
    await createMigrationsTable();
    const executed = await getExecutedMigrations();

    console.log('\n=== Migration Status ===');
    MIGRATIONS.forEach((m) => {
      const status = executed.includes(m.id) ? '✓' : '○';
      console.log(`${status} ${m.id} - ${m.description}`);
    });
    console.log('========================\n');
  } catch (error) {
    console.error('Failed to show migration status:', error);
  }
}
