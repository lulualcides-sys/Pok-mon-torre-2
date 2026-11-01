# Verified native module snapshot

`source-src-97f03e6e1b.json.gz` preserves the public client HTML and 75 JavaScript modules from the existing user-authorized Poké Arena 2D capture. Every file was compared with its SHA-256 in `site-capture/CAPTURE-REPORT.json` before packaging; no captured module was edited. The JSON records the original origin, capture timestamp, module version, file text and individual hashes.

Archive SHA-256: `0684f9db2d7c8efa81cba16e3b6ba8ecb68e35c10c6bf308a7b98c1fdb628fc2`. Compressed size: 398638 bytes. The source version was exercised by WebGL Actions 41263204733 and 41299829399 before snapshot packaging.

The capture script uses this archive for the pinned module version because the external host began returning 404 for individual old modules. It validates all file hashes, identities and paths before use, and records the snapshot digest in the capture report. Assets and Phaser library remain under the existing capture/install checks; this archive is not a complete offline game. `POKEARENA_SOURCE_VERSION=latest` deliberately selects live discovery for compatibility audits and does not use this snapshot.

This preserves provenance under the project's existing authorized capture workflow; it does not claim original authorship or change third-party notices. Keep this snapshot unchanged. An upstream upgrade must be audited separately against the approved native arena HUD and existing patch guards.
