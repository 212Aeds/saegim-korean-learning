# Saegim website discoverability

## Before launch

- Publish a useful, readable public homepage and clear About/privacy pages without requiring sign-in. Account data and private conversations belong behind authentication.
- Add public Korean guides at separate URLs, such as /learn/hangul and /learn/korean-greetings. Use original explanations and referenced examples; the current #today/#learn sections do not provide separate server routes for search pages.
- Give each public page a descriptive title, description, heading, and internal links. Include social preview images and accessible image text.
- Configure a real public site URL before adding canonical URLs, sitemap.xml, and robots.txt. Do not publish localhost URLs in a sitemap. Robots rules do not secure private data.
- Check mobile layouts, loading performance, keyboard navigation, readable font sizes, and broken links.

## Once the website has a public HTTPS URL

- Verify ownership in Google Search Console and submit the sitemap. Use URL Inspection to check important public pages. Indexing and ranking are not guaranteed.
- Link relevant guides from the homepage and publish useful improvements regularly. Explain what Saegim teaches accurately; avoid unsupported claims about learning outcomes.
- Add a feedback/report-a-problem route so learners can identify incorrect language content and bugs.

## Public hosting boundary

The local Qwen, Whisper, and TTS servers run on this laptop. Publishing the frontend does not make those loopback endpoints available to other visitors. Plan the public core around lessons, review, and progress that your deployment can actually serve; decide separately how public speech and AI will be hosted and funded. Avoid making the laptop servers public as an incidental SEO step.

References: https://developers.google.com/search/docs/fundamentals/seo-starter-guide and https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
