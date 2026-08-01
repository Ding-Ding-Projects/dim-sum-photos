# Gallery and fictional lore

The Pages gallery and Windows companion load the catalog records, show English and Traditional Chinese names, descriptions, ingredients, allergens, and a clearly labeled fictional origin plus three fictional facts. Search is plain text by default and the adjacent regex builder enables bounded JavaScript regular expressions locally.

## Failure modes and security

Catalog loading failures appear as non-blocking notifications. Patterns and sample text stay local and are length bounded. Release image URLs are restricted to the project catalog release.

## Verification

`npm run validate:data` in `apps/dim-sum-atlas` validates 2,866 records and deterministic lore.

Suggested articles: [Bulk image export](bulk-export.md), [Pages deployment](pages.md).
