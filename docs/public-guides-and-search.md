# Public learning pages and search preparation

The public website now has a /learn/ hub and three static pages:
- /learn/hangul-basics/
- /learn/korean-greetings/
- /learn/first-korean-words/

Each guide has a distinct title and description, substantive HTML text, linked sources, saved audio in both voices, a listening pace control, and a small recall question. Examples use the existing curriculum and references. Guide interactions do not award lesson completion or change account progress. Switching guides resets the preview quiz.

All guide routes are generated at build time and work on ordinary static hosting. There are now 102 saved audio clips. The existing signed-in local version keeps its models and account features.

## Domain configuration

Run `npm run build:free`. After choosing the actual public HTTPS origin, run `npm run site:configure -- --url https://YOUR-DOMAIN`. This writes sitemap.xml and robots.txt into apps/web/.next-public for the public routes only. Supply the real root origin with no path, query, credentials or localhost address. Rebuilding the static output requires running this setup again. Repackage after configuration before deployment. Robots rules are crawler instructions, not access control.

No domain has been configured, no site has been published, and no search-engine submission has been made. Indexing and ranking cannot be guaranteed. Canonical URLs, social-preview URLs and Search Console verification can be configured once the real domain is available.

## Verification

79 app tests pass. Both static-public and signed-in web builds pass. Browser checked recorded playback, retry/correct feedback, quiz reset, and navigation. At the mobile breakpoint the page width matched the viewport without horizontal overflow. Static HTML was checked for guide text and metadata; a fresh public ZIP includes all pages and 102 audio clips.
