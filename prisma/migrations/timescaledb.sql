-- ============================================================
-- TimescaleDB Post-Migration Script
-- Run this AFTER: prisma migrate deploy  (or prisma db push)
-- ============================================================

-- 1. Enable TimescaleDB extension (must run as superuser)
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- 2. Convert Telemetry to a hypertable partitioned by "timestamp"
--    chunk_time_interval = 1 day (adjust for your data volume)
SELECT create_hypertable(
  '"Telemetry"',
  'timestamp',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- 3. Convert EnergyReading to a hypertable partitioned by "timestamp"
SELECT create_hypertable(
  '"EnergyReading"',
  'timestamp',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- 4. Enable TimescaleDB compression on Telemetry (optional, saves ~90% storage)
--    Data older than 7 days will be compressed automatically.
ALTER TABLE "Telemetry" SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = '"deviceId"',
  timescaledb.compress_orderby = 'timestamp DESC'
);
SELECT add_compression_policy('"Telemetry"', INTERVAL '7 days', if_not_exists => TRUE);

-- 5. Enable TimescaleDB compression on EnergyReading
ALTER TABLE "EnergyReading" SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = '"meterId"',
  timescaledb.compress_orderby = 'timestamp DESC'
);
SELECT add_compression_policy('"EnergyReading"', INTERVAL '7 days', if_not_exists => TRUE);

-- 6. Retention policy: auto-drop chunks older than 1 year (adjust as needed)
SELECT add_retention_policy('"Telemetry"', INTERVAL '1 year', if_not_exists => TRUE);
SELECT add_retention_policy('"EnergyReading"', INTERVAL '1 year', if_not_exists => TRUE);

-- Done!
-- Verify hypertables:
-- SELECT hypertable_name, num_chunks FROM timescaledb_information.hypertables;
