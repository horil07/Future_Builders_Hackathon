# Privacy model

Job Autofill AI is designed as a local-first tool.

- Profile information is stored using `chrome.storage.local`.
- This version has no analytics, telemetry, remote database, or third-party API calls.
- Form data is read only to classify visible application fields.
- The extension does not submit applications.
- OTPs, CAPTCHAs, passwords, banking/payment fields, consent/declaration fields, and submit controls are excluded from autofill.
- Documents are stored locally in the extension profile. Remove them from the options page/profile storage when they are no longer needed.
