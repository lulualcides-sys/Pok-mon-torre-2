# T44 — Plan

Base: PR #488 HEAD b7c27ab9; independent child DRAFT, no edits to existing PR branches. Patch build-preview.mjs only at its habilidades.js fallback, add narrow pure helper and regression test. Unit RED: upstream-reformatted import no longer contains exact legacy string. GREEN: helper preserves original import and adds only weather hook. Rollback: close this child PR; do not merge #488/#486 without #471 visual acceptance. Capture real upstream Phaser source and run visual guard on exact SHA; CI failure means no publication.
