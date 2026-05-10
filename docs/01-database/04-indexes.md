# Index Strategy

**Status:** Draft
**Owner:** DBA
**Last updated:** 2026-05-07

---

## Principles

- Index hot read paths.
- Composite indexes ordered by selectivity, then access pattern.
- GIN on JSONB only when querying JSONB content.
- Avoid over-indexing — write amplification matters at Postgres scale.

---

## Hot-path indexes by module

### Catalog / pricing / stock
```
-- PLP filtering (hot)
CREATE INDEX idx_vcp_country_active_price ON variant_country_price (country_id, active, regular_price);
CREATE INDEX idx_pcr_country_status ON product_country_readiness (country_id, status);

-- Variant lookup
CREATE INDEX idx_pv_product ON product_variant (product_id);

-- Stock availability view backing
CREATE INDEX idx_vws_variant ON variant_warehouse_stock (variant_id);
CREATE INDEX idx_vws_warehouse ON variant_warehouse_stock (warehouse_id);

-- JSONB attributes (Arabic name fields, variant attrs)
CREATE INDEX idx_pt_translation_jsonb ON product_translation USING gin (use_cases);
CREATE INDEX idx_pv_attrs_jsonb ON product_variant USING gin (attributes);

-- Arabic FTS fallback
CREATE INDEX idx_pt_name_trgm ON product_translation USING gin (name gin_trgm_ops);
```

### Orders

> 🟢 D-DB-001 Answered 2026-05-07: table renamed `order` → `customer_orders` (plural). No quoted identifiers needed. Index names retain `idx_order_*` prefix (already standardized; no SQL collision since `idx_order_*` is just an identifier, not the bare reserved word).

```
CREATE INDEX idx_order_country_status_created ON customer_orders (country_id, status, created_at DESC);
CREATE INDEX idx_order_customer ON customer_orders (customer_id, created_at DESC);
CREATE INDEX idx_order_marketer ON customer_orders (marketer_id) WHERE marketer_id IS NOT NULL;
CREATE INDEX idx_order_channel ON customer_orders (channel, status);
CREATE INDEX idx_order_line_order ON order_line (order_id);
CREATE INDEX idx_order_line_variant ON order_line (variant_id);
```

### Conversations / messages
```
CREATE INDEX idx_message_conversation_created ON message (conversation_id, created_at DESC);
CREATE INDEX idx_conversation_customer ON conversation (customer_id);
CREATE INDEX idx_conversation_country_state ON conversation (country_id, current_state);
CREATE INDEX idx_handoff_status ON handoff_request (status, requested_at DESC);
CREATE INDEX idx_faq_embedding ON faq_policy USING ivfflat (embedding vector_l2_ops);
```

### Marketers
```
CREATE INDEX idx_marketer_event_marketer_created ON marketer_event (marketer_id, created_at DESC);
CREATE INDEX idx_marketer_attribution_order ON marketer_order_attribution (order_id);
CREATE INDEX idx_marketer_attribution_marketer ON marketer_order_attribution (marketer_id, created_at DESC);
CREATE INDEX idx_marketer_link_short_code ON marketer_link (short_code);
```

### Audit
```
CREATE INDEX idx_audit_actor_created ON audit_log (actor_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log (entity, entity_id);
CREATE INDEX idx_audit_override ON audit_log (override_request_id) WHERE override_request_id IS NOT NULL;
CREATE INDEX idx_country_audit_country_field ON country_data_audit (country_id, entity, field, created_at DESC);
```

### Backup / override / import
```
CREATE INDEX idx_backup_status_created ON backup_job (status, created_at DESC);
CREATE INDEX idx_override_status_type ON override_request (status, override_type);
CREATE INDEX idx_override_requester ON override_request (requested_by, created_at DESC);
CREATE INDEX idx_import_job_status ON import_export_job (entity, status, created_at DESC);
```

---

## Maintenance

- `VACUUM ANALYZE` weekly minimum on hot tables.
- `pg_stat_user_indexes` reviewed monthly to drop unused indexes.
- New indexes go through DBA review (not added ad-hoc).

---

## TODO

- TODO: validate index list against query patterns once Phase 1 query plan profiling is available.
- TODO: confirm `ivfflat` lists count for FAQ vector index based on corpus size.
- TODO: decide on `BRIN` indexes for very large append-only tables (audit_log, message).
