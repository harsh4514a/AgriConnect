# Gujarat location geography import

This directory contains compressed, versioned source extracts for the repeatable import at `apps/api/scripts/import-gujarat-geography.ts`. The importer updates the existing `District → Taluka → Village` hierarchy; it does not create or delete location records.

## Sources and reuse notes

| Source | Use | Identifiers and point meaning | Provenance and license |
| --- | --- | --- | --- |
| [Local Government Directory (LGD), Ministry of Panchayati Raj](https://panchayat.gov.in/en/lgd/) | Administrative names and stable hierarchy crosswalk | State, district, subdistrict, village LGD codes; Census 2011 code when supplied | The bundled all-India [LGD mirror snapshot](https://github.com/vanga/india-local-government-directory) was generated 2026-05-25 from the [official LGD catalog](https://data.gov.in/catalog/local-government-directory-lgd). The mirror identifies the data as Government of India LGD data under [GODL-India](https://data.gov.in/Godl) and requires attribution. Recheck the source snapshot when refreshing. |
| [NIC Bharat Maps](https://bharatmaps.gov.in/), AdministrativeHeadQuarter MapServer | Census village points, town centres, district HQs, and subdistrict HQs | Census village code for village points; LGD district/subdistrict codes for headquarters; feature/object IDs retained in `coordinateSourceId` | NIC describes Bharat Maps as a public citizen-facing mapping platform built from Survey of India, ISRO, FSI, RGI, and other reference data at 1:50,000 scale. The queried REST layers do not publish a layer-specific license field. NIC's published [service SOP](https://mapservice.gov.in/gismapserviceMVC/assets/BharatMapsMapservice_SOP_Govt.pdf) asks applications using Bharat Maps services to show the NIC Bharat Maps logo. The app must keep attribution visible and the owner should confirm reuse/redistribution terms with NIC before distributing a production database snapshot. This is an explicit licensing limitation, not a claim of a separate open license. |
| [Survey of India village point layer](https://github.com/ramSeraph/indian_admin_boundaries/releases), Gujarat extract | Secondary village point when no unique Census-code point is available | LGD district and subdistrict codes plus one unique village name within that hierarchy, or a unique complete district/taluka/village path when older LGD parent codes changed; points are labeled `settlement_point_soi` | The source release declares CC0 1.0. Its 2017 layer can contain duplicate paths and does not cover every locality; ambiguous paths are skipped. Attribution is retained for traceability even though CC0 does not require it. |

The importer reports coordinates separately by meaning. A village point is not a town centre, taluka headquarters, district headquarters, or village-boundary centroid. The NIC source reports map scale, not point-level accuracy; decimal places are preserved but are not an accuracy claim.

Marketplace nearest ordering and Nearby Listings use Haversine great-circle distance between stored points. This is straight-line distance, not driving distance. Radius membership includes listings at the exact radius boundary and excludes unresolved coordinates.

## Matching and safety rules

- Canonical locations match by normalized complete hierarchy, not by village name alone.
- NIC village points join by Census 2011 code through a unique LGD row. Current LGD parent-code differences are counted as administrative changes and are not used to reject an otherwise unique Census-code identity.
- Towns require one canonical row, one full district/taluka/name match, and an LGD `Urban` category.
- Survey of India fallback points first use LGD district/subdistrict codes plus a unique village name. If historic codes changed, they may match only by a unique complete district/taluka/village path; the report records those parent-code mismatches separately.
- Duplicate source identifiers, duplicate names within a hierarchy, invalid points, and unmatched records are reported and left unresolved.
- Existing valid coordinates and existing non-null identifiers are preserved by default. Missing or invalid coordinate pairs can be filled by a valid unique source match.
- No record is assigned `0,0` as a coordinate. Missing values remain SQL `NULL`.

## Commands

From `apps/api`:

```sh
pnpm prisma migrate deploy
pnpm prisma generate
pnpm db:import-gujarat-geography
pnpm db:import-gujarat-geography -- --apply
```

The first importer command is a dry run. Both modes write `reports/latest-import-report.json`, including the canonical inventory, source matches, coordinates eligible to import, unresolved rows, and ambiguity lists. The `--apply` mode writes in batches of 1,000; each update statement is atomic, idempotent, and preserves valid preexisting coordinate pairs.
