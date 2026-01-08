chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateBookmarks') {
    chrome.runtime.sendMessage(message);
  }
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('X Bookmarks Exporter installed!');
});