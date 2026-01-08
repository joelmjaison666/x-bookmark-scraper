let bookmarks = [];

// Load saved bookmarks on popup open
chrome.storage.local.get(['bookmarks'], (result) => {
  if (result.bookmarks) {
    bookmarks = result.bookmarks;
    updateUI();
  }
});

document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
    showStatus('Please navigate to X/Twitter bookmarks page first', 'error');
    return;
  }

  // Send message to content script to start scraping
  chrome.tabs.sendMessage(tab.id, { action: 'startScraping' }, (response) => {
    if (response && response.success) {
      showStatus('Scraping started! Scroll through your bookmarks...', 'success');
      startListening();
    }
  });
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (bookmarks.length === 0) {
    showStatus('No bookmarks to export', 'error');
    return;
  }

  const dataStr = JSON.stringify(bookmarks, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: `x-bookmarks-${Date.now()}.json`,
    saveAs: true
  });

  showStatus(`Exported ${bookmarks.length} bookmarks!`, 'success');
});

function startListening() {
  // Listen for bookmark updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateBookmarks') {
      bookmarks = message.bookmarks;
      chrome.storage.local.set({ bookmarks: bookmarks });
      updateUI();
    }
  });
}

function updateUI() {
  document.getElementById('count').textContent = bookmarks.length;
  document.getElementById('exportBtn').disabled = bookmarks.length === 0;
}

function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}