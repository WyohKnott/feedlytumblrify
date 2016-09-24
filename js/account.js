/*jshint esversion: 6 */
/*jslint browser: true, es6: true, multivar: true */
/*global chrome, OAuth, fT, URL, URLSearchParams */
(function () {
    "use strict";

    var form = document.forms[0],
        loginButton = form.elements.login,
        logoutButton = form.elements.logout,
        callbackRegex = new RegExp('^https:\/\/localhost\/redirectpage.*$', 'i');

    function setDefaultPrefs () {
        Promise.all([fT.getPrefs('enableOriginalTags'), fT.getPrefs('enableTagsFrequency')]).then(function (prefs) {
            if (!prefs[0].hasOwnProperty('enableOriginalTags')) {
                fT.setPrefs({enableOriginalTags: false});
            }
            if (!prefs[1].hasOwnProperty('enableTagsFrequency')) {
                fT.setPrefs({enableTagsFrequency: true});
            }
        });
    }

    // Oauth connection logic
    // Step 1
    function login () {
        fetch('assets/keys.json').then(function (response) {
            return response.json();
        }).then (function (keys) {
            var config = {},
                tokens = {
                    consumerKey: keys.consumerKey,
                    consumerSecret: keys.consumerSecret
                };
            if (!tokens.consumerKey || !tokens.consumerSecret) {
                fT.dialog('You need a valid key file. The extension package have probably been built without it.');
                return;
            }
            config = Object.assign(tokens, fT.tumblrEndpoints);
            fT.tumblrClient = new OAuth(config);
            fT.tumblrClient.fetchRequestToken().then(function (url) {
                console.info('OAuth: request tokens obtained');
                chrome.tabs.create({
                    url: url,
                    active: true
                });
            }).catch(function (err) {
                console.error('OAuth: error while fetching request tokens: ', err.statusText || err);
                // We still save the consumerKey and secret
                fT.setPrefs({
                    tumblrTokens: {
                        consumerKey: config.consumerKey,
                        consumerSecret: config.consumerSecret,
                        accessTokenKey: '',
                        accessTokenSecret: ''
                    }
                });
                fT.tumblrClient = {};
            });
        }).catch(function (err) {
            console.error("Could not fetch keys from key file.")
        });
    }

    // Step 2
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (tab.url && callbackRegex.test(tab.url) && changeInfo.status === 'complete') {
            //callback page
            var verifier = new URLSearchParams((new URL(tab.url)).search).get('oauth_verifier');
            if (!verifier) {
                console.error('Could not determine the oauth_verifier');
                return;
            }
            if (typeof fT.tumblrClient.setVerifier !== 'function') {
                throw new Error('tumblrClient is not correctly initialized');
            }
            fT.tumblrClient.setVerifier(verifier);
            getAccessToken();
            chrome.tabs.remove(tabId);
        }
    });

    // Step 3
    function getAccessToken () {
        if (typeof fT.tumblrClient.fetchAccessToken !== 'function') {
            throw new Error('tumblrClient is not correctly initialized');
        }
        var tempTokens = fT.tumblrClient.getTokens();
        fT.tumblrClient.fetchAccessToken().then(function () {
            console.info('OAuth: access tokens obtained');
            fT.tumblrClient.setVerifier('');
            fT.setPrefs({
                tumblrTokens: {
                    consumerKey: tempTokens.consumerKey,
                    consumerSecret: tempTokens.consumerSecret,
                    accessTokenKey: fT.tumblrClient.getAccessTokenKey(),
                    accessTokenSecret: fT.tumblrClient.getAccessTokenSecret()
                }
            });
        }).catch(function (err) {
            console.error('OAuth: error while fetching access tokens: ', err.statusText || err);
            fT.tumblrClient.setVerifier('');
            fT.setPrefs({
                tumblrTokens: {
                    consumerKey: tempTokens.consumerKey,
                    consumerSecret: tempTokens.consumerSecret,
                    accessTokenKey: '',
                    accessTokenSecret: ''
                }
            });
        });
    }

    function update (status) {
        let consumerKeyInput = form.elements.consumerKey,
            consumerSecretInput = form.elements.consumerSecret,
            statusText = document.getElementById('status'),
            accountText = document.getElementById('account'),
            avatar = document.getElementById('statusWrap');

        if (status.logged) {
            statusText.textContent = 'logged as';
            accountText.textContent = status.account;
            avatar.style.background = 'url(https://api.tumblr.com/v2/blog/' + status.account +
                    '.tumblr.com/avatar/128) no-repeat center';
            loginButton.disabled = true;
            logoutButton.disabled = false;
            document.body.classList.remove('loggedout');
            document.body.classList.add('loggedin');
        } else {
            statusText.textContent = 'logged out';
            accountText.textContent = '';
            avatar.style.background = 'url(assets/default_avatar_128.png) no-repeat center';
            loginButton.disabled = false;
            logoutButton.disabled = true;
            document.body.classList.remove('loggedin');
            document.body.classList.add('loggedout');
        }
    }

    loginButton.addEventListener('click', login, false);
    logoutButton.addEventListener('click', fT.logout, false);

    chrome.storage.onChanged.addListener(function (changes, areaName) {
        if (changes.tumblrTokens && areaName === 'local') {
            fT.getStatus().then((status) => update(status));
        }
    });
    setDefaultPrefs();
    fT.getStatus().then((status) => update(status));

}());
