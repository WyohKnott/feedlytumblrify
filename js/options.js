/* jshint esversion: 6 */
(function () {
    "use strict";

    var loginButton = document.getElementById('login'),
        logoutButton = document.getElementById('logout'),
        consumerKeyInput = document.getElementById('consumerKey'),
        consumerSecretInput = document.getElementById('consumerSecret'),
        statusText = document.getElementById('status'),
        accountText = document.getElementById('account'),
        avatar = document.getElementById('statusWrap'),
        callbackRegex = new RegExp('^https://localhost/redirectpage.*$', 'i');

    // Oauth connection logic
    // Step 1
    var login = function () {
        var config = {},
            tokens = {
            consumerKey: consumerKeyInput.value,
            consumerSecret: consumerSecretInput.value
        };
        if (!tokens.consumerKey || !tokens.consumerSecret) {
            console.log('Missing consumerKey and consumerSecret');
            return;
        }
        config = Object.assign(tokens, tumblrEndpoints);
        tumblrClient = OAuth(config);
        tumblrClient.fetchRequestToken().then(function (url) {
            console.info('OAuth: request tokens obtained');
            chrome.tabs.create({
                url: url,
                active: true
            });
        }).catch(function (err) {
            console.error('OAuth: error while fetching request tokens: ', err.statusText);
            // We still save the consumerKey and secret
            setPrefs({
                tumblrTokens: {
                    consumerKey: config.consumerKey,
                    consumerSecret: config.consumerSecret,
                    accessTokenKey: '',
                    accessTokenSecret: ''
                }
            });
            tumblrClient = {};
        });
    };

    // Step 2
    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (tab.url && callbackRegex.test(tab.url) && changeInfo.status === 'complete') {
            //callback page
            var verifier = new URLSearchParams((new URL(tab.url)).search).get('oauth_verifier');
            if (!verifier) {
                console.error('Could not determine the oauth_verifier');
                return;
            }
            if (typeof tumblrClient.setVerifier !== 'function') {
                throw new Error('tumblrClient is not correctly initialized');
            }
            tumblrClient.setVerifier(verifier);
            getAccessToken();
            chrome.tabs.remove(tabId);
        }
    });

    // Step 3
    var getAccessToken = function () {
        if (typeof tumblrClient.fetchAccessToken !== 'function') {
            throw new Error('tumblrClient is not correctly initialized');
        }
        var tempTokens = tumblrClient.getTokens();
        tumblrClient.fetchAccessToken().then(function (response) {
            console.info('OAuth: access tokens obtained');
            tumblrClient.setVerifier('');
            setPrefs({
                tumblrTokens: {
                    consumerKey: tempTokens.consumerKey,
                    consumerSecret: tempTokens.consumerSecret,
                    accessTokenKey: tumblrClient.getAccessTokenKey(),
                    accessTokenSecret: tumblrClient.getAccessTokenSecret()
                }
            });
        }).catch(function (err) {
            console.error('OAuth: error while fetching access tokens: ', err.statusText);
            tumblrClient.setVerifier('');
            setPrefs({
                tumblrTokens: {
                    consumerKey: tempTokens.consumerKey,
                    consumerSecret: tempTokens.consumerSecret,
                    accessTokenKey: '',
                    accessTokenSecret: ''
                }
            });
        });
    };

    function update(status) {
        if (status.logged) {
            consumerKeyInput.value = status.consumerKey;
            consumerKeyInput.disabled = true;
            consumerSecretInput.value = status.consumerSecret;
            consumerSecretInput.disabled = true;
            statusText.textContent = 'logged as';
            accountText.textContent = status.account;
            avatar.style.background = 'url(https://api.tumblr.com/v2/blog/' + status.account +
                '.tumblr.com/avatar/128) no-repeat center';
            loginButton.disabled = true;
            logoutButton.disabled = false;
            document.body.classList.remove('loggedout');
            document.body.classList.add('loggedin');
        } else {
            consumerKeyInput.value = status.consumerKey;
            consumerKeyInput.disabled = false;
            consumerSecretInput.value = status.consumerSecret;
            consumerSecretInput.disabled = false;
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
    logoutButton.addEventListener('click', logout, false);

    chrome.storage.onChanged.addListener(() => getStatus().then((status) => update(status)));
    getStatus().then((status) => update(status));

}());
