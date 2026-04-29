# Wedding Card Website

A cute online wedding invitation website for **Abhishek R & Nanditha PK** with:

- romantic pink theme
- Kerala-style wedding presentation
- venue section with map link
- RSVP form
- local Excel guest sheet saving
- Netlify-ready deployment setup

## Files

- `index.html` : main wedding invitation page
- `styles.css` : design and theme styles
- `script.js` : RSVP and map interactions
- `server.mjs` : local app server for RSVP saving
- `build-rsvp-workbook.mjs` : generates the Excel guest sheet
- `success.html` : thank-you page for Netlify form submissions
- `netlify.toml` : Netlify deployment config

## Local Preview

To run locally with RSVP saving:

```bash
/Users/abhishek/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.mjs
```

Open:

```bash
http://localhost:8000
```

## RSVP Saving

On localhost:

- RSVP entries are saved in `data/rsvp-submissions.json`
- attendee workbook is generated at `data/rsvp-attendees.xlsx`

On Netlify:

- RSVPs are collected using Netlify Forms
- local Excel saving does not run on Netlify hosting

## Netlify Deploy

1. Push the code to GitHub
2. Open Netlify
3. Import the GitHub repository
4. Set publish directory to `.`
5. Deploy the site

## Notes

- The venue map link points to Peruma Auditorium, Payyoli
- The design is optimized for mobile and desktop
- `.idea/` and generated RSVP data files are not committed
