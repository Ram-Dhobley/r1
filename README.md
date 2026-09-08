# Watchwise

Watchwise helps people find something good to watch across the streaming services they already subscribe to.

## Live catalog setup

The app can load `dist/data/catalog.json` when present. The included GitHub Actions workflow refreshes that file once daily using TMDB’s API for India (`IN`), then deploys the updated catalog to GitHub Pages.

1. Create a TMDB API Read Access Token.
2. In the GitHub repository, add it as an Actions secret named `TMDB_READ_TOKEN`.
3. Enable GitHub Pages using GitHub Actions as the source.
4. Run **Refresh Watchwise catalog** once from the Actions tab.

The public catalog uses TMDB metadata and regional watch-provider data. Availability can change, so users should confirm the title is available before watching.
