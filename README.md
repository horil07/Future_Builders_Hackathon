# Job Autofill AI

A local-first Chrome/Edge extension that stores a reusable job-application profile, detects form fields on government and private job portals, maps relevant profile data, and shows a review panel before filling anything.

## What it does

- Save personal, address, education, experience, skills, links, preferences, and selected documents once.
- Detect fields using labels, placeholders, names, IDs, ARIA labels, nearby text, and weighted text similarity.
- Match only profile values that exist and exceed a confidence threshold.
- Review, edit, deselect, and then apply suggested values.
- Handle text inputs, textareas, selects, radios, checkboxes, and common document-upload fields.
- Skip passwords, OTPs, CAPTCHAs, payment/bank fields, declarations, consent/terms fields, and submit buttons.
- Never auto-submit an application.
- Works generically across government and private portals; site-specific adapters can be added for difficult portals.

## Install in Chrome / Edge

1. Extract this folder.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this project folder.
6. Open the extension → **Edit my profile** and save your details.
7. Open a job application form → extension → **Detect & review fields**.
8. Review/edit the suggestions and click **Apply selected fields**.
9. Manually review the website and submit it yourself.

## Architecture

```text
Profile options page
       │
       ▼
chrome.storage.local  ← documents stored as data URLs
       │
       ▼
Content script field scanner
       │
       ├─ safety filter
       ├─ field text extraction
       ├─ keyword + token similarity scoring
       ├─ value / select / radio matching
       └─ document field classification
       │
       ▼
Review overlay
       │
       ▼
User-approved DOM fill
```

## AI / mapping strategy

The MVP uses a deterministic local “AI-assisted” mapping engine: normalized text features + weighted phrase matching + token similarity + confidence thresholds. This is intentional for privacy and reliability. A production version can add an optional local/hosted LLM mapper for ambiguous fields while retaining the same review step.

Recommended production enhancement:

```text
DOM metadata → redact page → mapping API / local model → {fieldId, profileKey, confidence, reason} → review → fill
```

## Government portals

Government forms often use custom widgets, multi-step forms, strict upload rules, or fields rendered inside iframes. The generic engine handles normal HTML forms, but complex portals may require a small site adapter. Keep adapters isolated by hostname so updates to one portal do not affect others.

## Private portals

The generic engine works with standard HTML used by many ATS/job sites. React-controlled inputs are handled through native value setters plus `input`, `change`, and `blur` events.

## Security notes

- Profile data remains in the browser extension by default.
- Sensitive fields are not transmitted anywhere by this version.
- `unlimitedStorage` is requested so locally stored document data is not constrained by the default extension quota.
- Do not store unnecessary government IDs.
- Some websites deliberately prevent scripted file attachment. In those cases upload manually.
- CAPTCHA/OTP bypass is intentionally unsupported.
- Final submission is intentionally manual.

## Files

- `manifest.json` — Chrome Manifest V3 configuration
- `background.js` — profile initialization and messaging
- `content.js` — detection, scoring, review UI, and filling
- `content.css` — in-page review styles
- `popup.*` — compact extension interface
- `options.*` — reusable profile + document editor

## Next production steps

1. Encrypt selected sensitive fields before storage using a passphrase-derived Web Crypto key.
2. Move large documents to IndexedDB instead of base64 in extension storage.
3. Add portal adapters for SSC/UPSC/IBPS/Workday/Greenhouse/Lever as needed.
4. Add a test fixture suite with saved HTML forms.
5. Add optional LLM mapping only for low-confidence/unknown fields.
6. Add profile versions for government vs private applications.
7. Add per-site allow/deny lists and an audit log of fields filled.

## Limitations

Browser extensions cannot reliably automate every portal. Cross-origin iframes, anti-bot systems, custom Shadow DOM widgets, and upload restrictions may require explicit support. This project intentionally prioritizes safe review-first autofill rather than unattended submission.
