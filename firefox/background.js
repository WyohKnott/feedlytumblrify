/*jshint esversion: 6 */
/*jslint browser: true, es6: true, multivar: true */
/*global chrome */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (sender.tab.url) {
        if (request.getPrefs) {
            chrome.storage.local.get(request.getPrefs, function (response) {
                console.log('storage get', response);
                sendResponse(response);
            });
        } else if (request.setPrefs) {
            chrome.storage.local.set(request.setPrefs, function (response) {
                console.log('storage set', response);
                sendResponse(response);
            });
        }
        return true;
    }
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (changes.tumblrTokens && areaName === 'local') {
        chrome.runtime.sendMessage({storageChanged: 'tumblrTokens'});
    }
});
