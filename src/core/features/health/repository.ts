import { sql } from "drizzle-orm";

import { createDatabase } from "../../platform/db/client";

export interface HealthRepository {
  /** Identifies the installation's database, so a remembered answer never crosses installations. */
  key: object;
  checkDatabase(): Promise<void>;
}

export function createHealthRepository(binding: D1Database): HealthRepository {
  const database = createDatabase(binding);

  return {
    key: binding,
    async checkDatabase() {
      await database.run(sql`select 1`);
    },
  };
}
