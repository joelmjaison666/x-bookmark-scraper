let isScrapingActive = false;
let bookmarksSet = new Set();
let observer = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScraping') {
    startScraping();
    sendResponse({ success: true });
  }
});

function startScraping() {
  if (isScrapingActive) return;
  isScrapingActive = true;

  console.log('X Bookmarks Scraper: Starting...');
  
  scrapeCurrentBookmarks();
  
  observer = new MutationObserver(() => {
    scrapeCurrentBookmarks();
  });

  const timeline = document.querySelector('[aria-label*="Timeline"]') || document.body;
  observer.observe(timeline, { childList: true, subtree: true });
}

function scrapeCurrentBookmarks() {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  
  tweets.forEach(tweet => {
    try {
      const bookmark = extractBookmarkData(tweet);
      if (bookmark && !bookmarksSet.has(bookmark.id)) {
        bookmarksSet.add(bookmark.id);
        
        chrome.runtime.sendMessage({
          action: 'updateBookmarks',
          bookmarks: Array.from(bookmarksSet).map(id => 
            findBookmarkById(id)
          ).filter(Boolean)
        });
      }
    } catch (e) {
      console.error('Error extracting bookmark:', e);
    }
  });
}

function extractBookmarkData(tweetElement) {
  const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
  if (!tweetLink) return null;
  
  const tweetUrl = tweetLink.href;
  const tweetId = tweetUrl.match(/status\/(\d+)/)?.[1];
  if (!tweetId) return null;

  const authorLink = tweetElement.querySelector('[data-testid="User-Name"] a');
  const authorName = authorLink?.textContent || 'Unknown';
  const authorHandle = authorLink?.href?.split('/').pop() || 'unknown';

  const tweetText = tweetElement.querySelector('[data-testid="tweetText"]')?.textContent || '';

  const images = Array.from(tweetElement.querySelectorAll('img[src*="media"]'))
    .map(img => img.src)
    .filter(src => !src.includes('profile'));

  const timeElement = tweetElement.querySelector('time');
  const timestamp = timeElement?.getAttribute('datetime') || new Date().toISOString();

  const bookmark = {
    id: tweetId,
    url: tweetUrl,
    author: {
      name: authorName,
      handle: authorHandle,
      url: `https://x.com/${authorHandle}`
    },
    text: tweetText,
    images: images,
    timestamp: timestamp,
    scrapedAt: new Date().toISOString()
  };

  window.bookmarksMap = window.bookmarksMap || new Map();
  window.bookmarksMap.set(tweetId, bookmark);

  return bookmark;
}

function findBookmarkById(id) {
  return window.bookmarksMap?.get(id);
}