// Puppeteer only powers the optional `npm run shots` screenshot script.
// Skip its ~200MB Chrome download on install; run
// `npx puppeteer browsers install chrome` if you actually want to use that script.
module.exports = {
  skipDownload: true,
};
