# Funnel Data Import Guide

## Overview
The CheckoutChamp Funnel Tracker web app now supports importing funnel data in both wrapped and unwrapped formats.

## Supported Formats

### Format 1: Wrapped (with "funnels" key)
```json
{
  "funnels": {
    "funnel-id-1": {
      "domain": "https://example.com",
      "firstSeen": "2025-11-10T20:45:24.638Z",
      "lastSeen": "2025-11-10T20:45:24.638Z",
      "name": "My Funnel Name",
      "pages": {
        "page-id-1": {
          "externalURL": null,
          "firstSeen": "2025-11-10T20:45:24.638Z",
          "referenceId": "ref-id-1",
          "splitEnabled": false,
          "title": "Page Title",
          "urlSlug": "page-slug"
        }
      }
    }
  }
}
```

### Format 2: Unwrapped (direct funnel object)
```json
{
  "funnel-id-1": {
    "domain": "https://example.com",
    "firstSeen": "2025-11-10T20:45:24.638Z",
    "lastSeen": "2025-11-10T20:45:24.638Z",
    "name": "My Funnel Name",
    "pages": {
      "page-id-1": {
        "externalURL": null,
        "firstSeen": "2025-11-10T20:45:24.638Z",
        "referenceId": "ref-id-1",
        "splitEnabled": false,
        "title": "Page Title",
        "urlSlug": "page-slug"
      }
    }
  }
}
```

## How to Import

### Via Web Interface
1. Start the web app: `cd web-app && npm run dev`
2. Open http://localhost:3000 in your browser
3. Click the "Import JSON" button
4. Select your JSON file
5. The import will process automatically and show results

### Via API
```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d @your-import-file.json
```

## Sample Data
A sample import file is available at `/home/user/chrome_dev_ext/sample-import.json` for testing.

## Data Structure Details

### Funnel Object
- `domain` (string): The base domain URL
- `firstSeen` (ISO 8601 timestamp): When the funnel was first detected
- `lastSeen` (ISO 8601 timestamp): When the funnel was last seen
- `name` (string): The funnel name
- `pages` (object): Collection of pages in the funnel

### Page Object
- `title` (string): Page title
- `urlSlug` (string): URL slug for the page
- `firstSeen` (ISO 8601 timestamp): When the page was first detected
- `externalURL` (string | null): External URL if applicable
- `referenceId` (string): Reference ID for the page
- `splitEnabled` (boolean): Whether A/B testing is enabled
- `pageType` (string, optional): Type of page (e.g., "1" for landing, "4" for checkout)

## Import Behavior
- The import uses a transaction for atomicity (all or nothing)
- Existing funnels are updated if they already exist (upsert)
- Pages are created or updated based on `funnelId` and `pageId`
- The import returns counts of funnels and pages imported, plus any errors

## Troubleshooting

### Invalid Data Format
Ensure your JSON is valid and follows one of the supported formats above.

### Import Fails
Check the console or API response for specific error messages. Common issues:
- Missing required fields (name, domain, firstSeen, lastSeen)
- Invalid timestamp format (must be ISO 8601)
- Malformed JSON

### Database Location
The SQLite database is created at `web-app/checkout-champ.db` by default.
