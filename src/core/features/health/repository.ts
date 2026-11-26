export interface HealthRepository {
  /** Identifies the installation's database, so a remembered answer never crosses installations. */
  key: object;
  checkDatabase(): Promise<void>;
}

export function createHealthRepository(binding: D1Database): HealthRepository {
  return {
    key: binding,
    async checkDatabase() {
      await binding.prepare("SELECT 1").first();
    },
  };
}

export function publicSnapshotWork(binding: D1Database) {
  return binding.prepare(`SELECT requested_revision>completed_revision AS pending,
    (EXISTS(SELECT 1 FROM page_settings WHERE id='default') OR EXISTS(SELECT 1 FROM oa_bootstrap)) AS configured
    FROM public_snapshot_work WHERE id='default'`).first<{ pending: number; configured: number }>();
}
