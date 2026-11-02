# T44 — Native abilities import compatibility

The 2026-11-02 native client (src-d4dfea5df3) changed the exact config import in habilidades.js. Guardião #41532659667 failed before screenshots. Initial child PR #489 cb2593ce failed CI #41540318972 because signature-fx TORRE2_FORMS patches the SAME config import before weatherFromMove. Both imports must be injected safely, one at a time, preserving all native symbols and rejecting ambiguous source. No combat, VFX, save schema, map art or trainers changed. Native build, Chromium and Guardião on exact SHA are required before merge.
