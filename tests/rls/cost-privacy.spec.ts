// Cost privacy RLS tests — D-RBAC-001 enforcement.
//
// Tests the database layer (Layer 1 of the 9-layer defense-in-depth chain
// per /docs/03-rbac/04-cost-privacy.md). Every non-finance role must return
// 0 rows when SELECTing actual_cost / marketer_cost. Class 2 deletion-block
// triggers must reject DELETE on every Class 2 cost-bearing table.
//
// Permissions matrix (per /docs/03-rbac/matrix/role-permission-matrix.csv):
//   cost.read         — super_admin, finance_admin
//   cost.write        — super_admin, finance_admin
//   marketer_cost.read  — super_admin, finance_admin, marketing_manager,
//                         marketer_manager, external_marketer (own only — Sprint 2B)
//   marketer_cost.write — super_admin, finance_admin, marketing_manager
//
// Test methodology:
//   - Each test runs in BEGIN..ROLLBACK so test data never persists.
//   - Catalog fixture (country / product / variant) seeded as superuser.
//   - Cost row INSERTed as superuser (bypasses RLS).
//   - Test then SET LOCAL ROLE app_user + SET LOCAL app.current_user_id
//     to specific test user; runs SELECT/INSERT/UPDATE/DELETE; asserts.
//
// Sprint 2A scope: cost.read / cost.write / marketer_cost.read /
// marketer_cost.write checks across the cost-bearing tables. Class 2
// triggers verified for variant_country_cost, variant_marketer_cost,
// cost_history, cost_read_log, stock_movement.

import { afterAll, describe, expect, test } from 'vitest';
import {
  pool,
  seedCatalog,
  seedRole,
  seedVariantCountryCost,
  seedVariantMarketerCost,
  withSavepoint,
  withTx,
  withUser,
} from './helpers';

afterAll(async () => {
  await pool.end();
});

describe('D-RBAC-001 — variant_country_cost SELECT (cost.read)', () => {
  test('super_admin (cost.read granted) sees actual_cost rows', async () => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      await seedVariantCountryCost(client, variantId, countryId, '99.99');

      const ctx = await seedRole(client, 'super_admin', ['cost.read', 'cost.write']);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query<{ actual_cost: string }>(
          `SELECT actual_cost FROM variant_country_cost WHERE variant_id = $1`,
          [variantId],
        );
        expect(r.rowCount).toBe(1);
        expect(r.rows[0]!.actual_cost).toBe('99.99');
      });
    });
  });

  test('finance_admin (cost.read granted) sees actual_cost rows', async () => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      await seedVariantCountryCost(client, variantId, countryId);

      const ctx = await seedRole(client, 'finance_admin', ['cost.read', 'cost.write']);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query(
          `SELECT actual_cost FROM variant_country_cost WHERE variant_id = $1`,
          [variantId],
        );
        expect(r.rowCount).toBe(1);
      });
    });
  });

  test.each([
    'admin',
    'country_manager',
    'product_manager',
    'inventory_manager',
    'warehouse_manager',
    'warehouse_staff',
    'marketing_manager',
    'marketer_manager',
    'sales_manager',
    'sales_agent',
    'customer_support_agent',
    'ai_supervisor',
    'content_seo_editor',
    'media_manager',
    'b2b_sales_agent',
    'maintenance_service_agent',
    'shipping_coordinator',
    'read_only_auditor',
    'developer_api_admin',
    'external_marketer',
  ])('%s (no cost.read) returns 0 rows from variant_country_cost', async (roleName) => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      await seedVariantCountryCost(client, variantId, countryId);

      // Role has many other permissions but NOT cost.read / cost.write.
      // Sample slugs from role-permission-matrix.csv to make the role
      // realistic — what matters is the absence of cost.read.
      const ctx = await seedRole(client, roleName, ['catalog.read']);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query(
          `SELECT actual_cost FROM variant_country_cost WHERE variant_id = $1`,
          [variantId],
        );
        expect(
          r.rowCount,
          `${roleName} must NOT see actual_cost — D-RBAC-001 cost privacy bypass`,
        ).toBe(0);
      });
    });
  });
});

describe('D-RBAC-001 — variant_country_cost INSERT/UPDATE (cost.write)', () => {
  test('super_admin can INSERT a new actual_cost row', async () => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      const ctx = await seedRole(client, 'super_admin', ['cost.read', 'cost.write']);

      await withUser(client, ctx.userId, async () => {
        await expect(
          client.query(
            `INSERT INTO variant_country_cost (variant_id, country_id, actual_cost, currency_code)
             VALUES ($1, $2, '42.00', 'USD')`,
            [variantId, countryId],
          ),
        ).resolves.toBeDefined();
      });
    });
  });

  test('country_manager (no cost.write) cannot INSERT actual_cost', async () => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      const ctx = await seedRole(client, 'country_manager', ['catalog.read']);

      await withUser(client, ctx.userId, async () => {
        // Wrap the expected-failing INSERT in a SAVEPOINT so the RLS error
        // doesn't leave the outer `withTx` transaction in aborted state
        // (Postgres would then reject withUser's `RESET ROLE` cleanup with
        // code 25P02). The original RLS error is re-thrown unchanged so
        // `rejects.toThrow(...)` still matches the policy-violation message.
        await expect(
          withSavepoint(client, () =>
            client.query(
              `INSERT INTO variant_country_cost (variant_id, country_id, actual_cost, currency_code)
               VALUES ($1, $2, '42.00', 'USD')`,
              [variantId, countryId],
            ),
          ),
        ).rejects.toThrow(/row-level security|new row violates/i);
      });
    });
  });
});

describe('D-RBAC-001 — variant_marketer_cost SELECT (marketer_cost.read)', () => {
  test.each([
    ['super_admin', ['marketer_cost.read']],
    ['finance_admin', ['marketer_cost.read']],
    ['marketing_manager', ['marketer_cost.read']],
    ['marketer_manager', ['marketer_cost.read']],
    ['external_marketer', ['marketer_cost.read']],
  ])('%s (marketer_cost.read granted) sees marketer_cost rows', async (roleName, perms) => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      await seedVariantMarketerCost(client, variantId, countryId, '15.50');

      const ctx = await seedRole(client, roleName, perms);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query(
          `SELECT marketer_cost FROM variant_marketer_cost WHERE variant_id = $1`,
          [variantId],
        );
        expect(r.rowCount).toBeGreaterThan(0);
      });
    });
  });

  test.each([
    'admin',
    'country_manager',
    'product_manager',
    'inventory_manager',
    'sales_manager',
    'sales_agent',
    'customer_support_agent',
    'b2b_sales_agent',
    'shipping_coordinator',
    'developer_api_admin',
  ])('%s (no marketer_cost.read) returns 0 rows from variant_marketer_cost', async (roleName) => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      await seedVariantMarketerCost(client, variantId, countryId);

      const ctx = await seedRole(client, roleName, ['catalog.read']);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query(
          `SELECT marketer_cost FROM variant_marketer_cost WHERE variant_id = $1`,
          [variantId],
        );
        expect(
          r.rowCount,
          `${roleName} must NOT see marketer_cost — D-RBAC-001 cost privacy bypass`,
        ).toBe(0);
      });
    });
  });
});

describe('D-RBAC-001 — cost_history SELECT (cost.read)', () => {
  test('finance_admin sees cost_history rows', async () => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      // INSERT cost_history as superuser (bypasses RLS)
      await client.query(
        `INSERT INTO cost_history (variant_id, country_id, was_actual_cost, reason)
         VALUES ($1, $2, '42.00', 'test seed')`,
        [variantId, countryId],
      );

      const ctx = await seedRole(client, 'finance_admin', ['cost.read', 'cost.write']);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query(
          `SELECT was_actual_cost FROM cost_history WHERE variant_id = $1`,
          [variantId],
        );
        expect(r.rowCount).toBe(1);
      });
    });
  });

  test('country_manager (no cost.read) returns 0 rows from cost_history', async () => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      await client.query(
        `INSERT INTO cost_history (variant_id, country_id, was_actual_cost, reason)
         VALUES ($1, $2, '42.00', 'test seed')`,
        [variantId, countryId],
      );

      const ctx = await seedRole(client, 'country_manager', ['catalog.read']);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query(
          `SELECT was_actual_cost FROM cost_history WHERE variant_id = $1`,
          [variantId],
        );
        expect(r.rowCount).toBe(0);
      });
    });
  });
});

describe('D-DB-010 Class 2 — DELETE blocked at trigger level', () => {
  test('cannot DELETE from variant_country_cost', async () => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      await seedVariantCountryCost(client, variantId, countryId);

      // Even as superuser, the BEFORE-DELETE trigger raises an exception.
      await expect(
        client.query(`DELETE FROM variant_country_cost WHERE variant_id = $1`, [variantId]),
      ).rejects.toThrow(/Class 2.*DELETE forbidden/i);
    });
  });

  test('cannot DELETE from variant_marketer_cost', async () => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      await seedVariantMarketerCost(client, variantId, countryId);

      await expect(
        client.query(`DELETE FROM variant_marketer_cost WHERE variant_id = $1`, [variantId]),
      ).rejects.toThrow(/Class 2.*DELETE forbidden/i);
    });
  });

  test('cannot DELETE from cost_history', async () => {
    await withTx(async (client) => {
      const { variantId, countryId } = await seedCatalog(client);
      await client.query(
        `INSERT INTO cost_history (variant_id, country_id, was_actual_cost) VALUES ($1, $2, '1.00')`,
        [variantId, countryId],
      );

      await expect(
        client.query(`DELETE FROM cost_history WHERE variant_id = $1`, [variantId]),
      ).rejects.toThrow(/Class 2.*DELETE forbidden/i);
    });
  });

  test('cannot DELETE from cost_read_log', async () => {
    await withTx(async (client) => {
      // Insert one row directly (bypassing the future Phase 2 instrumentation).
      const userRes = await client.query<{ id: string }>(
        `INSERT INTO "user" (email, active) VALUES ('cleanup-test@example.com', true) RETURNING id`,
      );
      await client.query(
        `INSERT INTO cost_read_log (actor_user_id, actor_role, entity_type, entity_id, redacted)
         VALUES ($1, 'super_admin', 'variant_country_cost', $2, false)`,
        [userRes.rows[0]!.id, userRes.rows[0]!.id],
      );

      await expect(client.query(`DELETE FROM cost_read_log`)).rejects.toThrow(
        /Class 2.*DELETE forbidden/i,
      );
    });
  });

  test('cannot DELETE from stock_movement', async () => {
    await withTx(async (client) => {
      const { variantId } = await seedCatalog(client);

      // Need a warehouse for stock_movement FK.
      const country2 = await client.query<{ id: string }>(
        `INSERT INTO country (code, name_ar, name_en, currency_code, default_locale, active)
         VALUES ('zw', 'زو', 'Z', 'ZWZ', 'en-zw', true)
         RETURNING id`,
      );
      const wh = await client.query<{ id: string }>(
        `INSERT INTO warehouse (code, name, country_id, type)
         VALUES ($1, 'Test WH', $2, 'main')
         RETURNING id`,
        [`WH-${Math.random().toString(36).slice(2, 6)}`, country2.rows[0]!.id],
      );

      await client.query(
        `INSERT INTO stock_movement (variant_id, warehouse_id, type, qty)
         VALUES ($1, $2, 'inbound', 10)`,
        [variantId, wh.rows[0]!.id],
      );

      await expect(
        client.query(`DELETE FROM stock_movement WHERE variant_id = $1`, [variantId]),
      ).rejects.toThrow(/Class 2.*DELETE forbidden/i);
    });
  });

  test('audit_log DELETE still blocked (Sprint 1 trigger from migration 0002)', async () => {
    await withTx(async (client) => {
      await client.query(
        `INSERT INTO audit_log (actor_type, action, entity)
         VALUES ('system', 'rls_test', 'cost_privacy_spec')`,
      );

      await expect(client.query(`DELETE FROM audit_log`)).rejects.toThrow(
        /Class 2.*DELETE forbidden/i,
      );
    });
  });
});

describe('app.has_permission() helper', () => {
  test('returns true for granted permission slug', async () => {
    await withTx(async (client) => {
      const ctx = await seedRole(client, 'tester', ['cost.read']);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query<{ has: boolean }>(
          `SELECT app.has_permission('cost.read') AS has`,
        );
        expect(r.rows[0]!.has).toBe(true);
      });
    });
  });

  test('returns false for ungranted permission slug', async () => {
    await withTx(async (client) => {
      const ctx = await seedRole(client, 'tester', ['catalog.read']);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query<{ has: boolean }>(
          `SELECT app.has_permission('cost.read') AS has`,
        );
        expect(r.rows[0]!.has).toBe(false);
      });
    });
  });

  test('returns false when user is inactive', async () => {
    await withTx(async (client) => {
      const ctx = await seedRole(client, 'tester', ['cost.read']);
      // Deactivate the user
      await client.query(`UPDATE "user" SET active = false WHERE id = $1`, [ctx.userId]);

      await withUser(client, ctx.userId, async () => {
        const r = await client.query<{ has: boolean }>(
          `SELECT app.has_permission('cost.read') AS has`,
        );
        expect(r.rows[0]!.has).toBe(false);
      });
    });
  });

  test('returns false when no app.current_user_id is set', async () => {
    await withTx(async (client) => {
      await client.query(`SET LOCAL ROLE app_user`);
      // Note: NOT setting app.current_user_id
      try {
        const r = await client.query<{ has: boolean }>(
          `SELECT app.has_permission('cost.read') AS has`,
        );
        expect(r.rows[0]!.has).toBe(false);
      } finally {
        await client.query(`RESET ROLE`);
      }
    });
  });
});
