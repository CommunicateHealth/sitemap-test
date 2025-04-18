# sitemap-test
Simple nodejs script for testing a number of random pages from a site's sitemap.

Optionally posts errors to slack.

## Dependencies
* NodeJS
* NPM
* if positng errors to Slack, an enviroment variable SLACK_API_URL should be configured.

## Usage
`npm update`

`node sitemap-test #tests baseUrl [sitemapPath]`

## Notes
* `baseUrl` example: "https://example.com"
* `sitemapPath` defaults to "/sitemap.xml"
