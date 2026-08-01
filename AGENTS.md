# Shared project guidance mirror

This file is a sanitized mirror of the shared agent guidance. Keep changes scoped, preserve unrelated work, use local assets, avoid secrets, verify changes with real tests and runtime checks, and keep documentation accurate. Public repositories omit private infrastructure details and house vocabulary. Windows desktop scope is intentional for this project.

## Current project

Dim Sum Atlas is an open-source Windows-only Electron gallery backed by this repository's dim-sum image releases. The app uses local metadata, downloads missing release images on demand, caches them locally, and supports bulk image export to metadata manifests, ZIP, and encrypted portable 7z archives.
