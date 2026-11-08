import type { Hono } from 'hono';
import type { AppEnv } from '../../app/types';
import type { AppServices } from '../../app/services';
import { createSetupRepository } from './repository';

export function registerSetupRoutes(app:Hono<AppEnv>,services:AppServices) {
  // Owner setup is private readiness, not public availability. The snapshot
  // routes alone decide whether published content exists and can be served.
  app.get('/setup/status',async c=> {
    c.header('Cache-Control','no-store');
    if(!await createSetupRepository(c.env.DB).initialized())return c.json({state:'setup_required'},409);
    return await services.pageSettings.get()?c.json({state:'ready'}):c.json({state:'unavailable'},503);
  });
}
