// RLS test helpers — D-RBAC-001 enforcement test suite.
//
// Provides:
//   - Shared pg.Pool against DATABASE_URL
//   - Per-test transaction wrapper (BEGIN/ROLLBACK)
//   - Role + permission + user seeding
//   - Run-as-user helper (SET LOCAL ROLE app_user + SET LOCAL app.current_user_id)
//   - Test fixture catalog (country / product / variant / cost row)
//
// All helpers assume the migrations 0001-0006 have already been applied
// (CI runs `pnpm db:migrate up` before `pnpm test:rls`).

import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 4,
});

export interface SeedRoleResult {
  roleId: string;
  userId: string;
  roleName: string;
  permissionSlugs: readonly string[];
}

/**
 * Run `fn` inside a fresh BEGIN..ROLLBACK transaction.
 * Guarantees no test data persists between tests.
 */
export async function withTx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  await client.query('BEGIN');
  try {
    return await fn(client);
  } finally {
    await client.query('ROLLBACK').catch(() => {
      // Ignore rollback errors (transaction may already be aborted).
    });
    client.release();
  }
}

/**
 * Seed a role with the given permission slugs and create one test user
 * assigned to that role. Permissions that don't yet exist in the catalog
 * are inserted on the fly. Caller must be inside a transaction.
 */
export async function seedRole(
  client: pg.PoolClient,
  roleName: string,
  permissionSlugs: readonly string[],
): Promise<SeedRoleResult> {
  // Use unique role names per test so parallel tests don't collide on the
  // role.name UNIQUE constraint.
  const uniqueRoleName = `${roleName}_${Math.random().toString(36).slice(2, 10)}`;

  const role = await client.query<{ id: string }>(
    `INSERT INTO role (name, is_system) VALUES ($1, false) RETURNING id`,
    [uniqueRoleName],
  );
  const roleId = role.rows[0]!.id;

  for (const slug of permissionSlugs) {
    await client.query(
      `INSERT INTO permission (slug, group_name)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING`,
      [slug, slug.split('.')[0] ?? 'misc'],
    );

    const perm = await client.query<{ id: string }>(
      `SELECT id FROM permission WHERE slug = $1`,
      [slug],
    );
    const permissionId = perm.rows[0]!.id;

    await client.query(
      `INSERT INTO role_permission (role_id, permission_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [roleId, permissionId],
    );
  }

  const user = await client.query<{ id: string }>(
    `INSERT INTO "user" (email, role_id, active)
     VALUES ($1, $2, true)
     RETURNING id`,
    [`rls-test-${uniqueRoleName}@example.com`, roleId],
  );

  return {
    roleId,
    userId: user.rows[0]!.id,
    roleName: uniqueRoleName,
    permissionSlugs,
  };
}

/**
 * Run a query closure as the given userId with the app_user role engaged.
 * RLS policies on variant_country_cost / variant_marketer_cost / cost_history
 * read app.current_user_id() and app.has_permission() — both resolved from
 * the session vars set here.
 *
 * Resets back to the outer role on exit so subsequent setup queries run with
 * superuser privileges again.
 */
export async function withUser<T>(
  client: pg.PoolClient,
  userId: string,
  fn: () => Promise<T>,
): Promise<T> {
  await client.query(`SET LOCAL ROLE app_user`);
  // SET LOCAL with a value parameter requires inline literal; use parameterized
  // SET with format() guarded by uuid cast on the GUC consumer side
  // (app.current_user_id() casts to uuid; invalid input would throw).
  await client.query(`SET LOCAL app.current_user_id = '${userId}'`);
  try {
    return await fn();
  } finally {
    await client.query(`RESET ROLE`);
  }
}

export interface CatalogFixture {
  countryId: string;
  productId: string;
  variantId: string;
}

/**
 * Seed a minimal catalog fixture: 1 country + 1 product + 1 variant.
 * Called once per test inside its transaction so the fixture is rolled back.
 *
 * Uses superuser (no SET ROLE) so RLS-protected tables are writable.
 */
export async function seedCatalog(client: pg.PoolClient): Promise<CatalogFixture> {
  const country = await client.query<{ id: string }>(
    `INSERT INTO country (code, name_ar, name_en, currency_code, default_locale, active)
     VALUES ($1, 'بلد الاختبار', 'Test Country', 'TST', 'en-tt', true)
     RETURNING id`,
    [`tt_${Math.random().toString(36).slice(2, 6)}`],
  );
  const countryId = country.rows[0]!.id;

  // locale row required by translation FKs (we don't insert translations here,
  // but an upstream test might). Skip — minimal fixture.

  const product = await client.query<{ id: string }>(
    `INSERT INTO product (sku, brand, status)
     VALUES ($1, 'TestBrand', 'active')
     RETURNING id`,
    [`SKU-${Math.random().toString(36).slice(2, 10)}`],
  );
  const productId = product.rows[0]!.id;

  const variant = await client.query<{ id: string }>(
    `INSERT INTO product_variant (product_id, sku, height_cm, max_load_kg, material, ladder_type)
     VALUES ($1, $2, 200, 150, 'aluminum', 'telescopic')
     RETURNING id`,
    [productId, `VAR-${Math.random().toString(36).slice(2, 10)}`],
  );
  const variantId = variant.rows[0]!.id;

  return { countryId, productId, variantId };
}

/**
 * Insert a test row into variant_country_cost as superuser (bypasses RLS at
 * insert time so we can later verify RLS at read time).
 */
export async function seedVariantCountryCost(
  client: pg.PoolClient,
  variantId: string,
  countryId: string,
  actualCost: string = '50.00',
): Promise<void> {
  await client.query(
    `INSERT INTO variant_country_cost (variant_id, country_id, actual_cost, currency_code)
     VALUES ($1, $2, $3, 'USD')`,
    [variantId, countryId, actualCost],
  );
}

/**
 * Insert a test row into variant_marketer_cost as superuser.
 */
export async function seedVariantMarketerCost(
  client: pg.PoolClient,
  variantId: string,
  countryId: string,
  marketerCost: string = '30.00',
): Promise<void> {
  await client.query(
    `INSERT INTO variant_marketer_cost (variant_id, country_id, marketer_cost, currency_code)
     VALUES ($1, $2, $3, 'USD')`,
    [variantId, countryId, marketerCost],
  );
}
