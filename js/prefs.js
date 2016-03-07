/* jshint esversion: 6 */

var tumblrClient = '';
var tumblrEndpoints = {
        callbackUrl: 'https://localhost/redirectpage',
        requestTokenUrl: 'https://www.tumblr.com/oauth/request_token',
        authorizationUrl: 'https://www.tumblr.com/oauth/authorize',
        accessTokenUrl: 'https://www.tumblr.com/oauth/access_token'
    };

var getPrefs = function (prefs) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.get(prefs, function (response) {
            resolve(response);
        });
    });
};

var setPrefs = function (prefs) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.set(prefs, function (response) {
            resolve(response);
        });
    });
};

var getStatus = function () {
    var config = {};

    // Read current tokens
    return getPrefs('tumblrTokens').then(function (response) {
        config = response.tumblrTokens || config;
        config = Object.assign(config, tumblrEndpoints);

        if (config.consumerKey && config.consumerSecret && config.accessTokenKey && config.accessTokenSecret) {
            // we have all the tokens but are they still valid?
            tumblrClient = OAuth(config);
            return tumblrClient.request('https://api.tumblr.com/v2/user/info').then(function (response) {
                return response.json();
            }).then(function (data) {
                console.info('Logged in, as ', data.response.user.name);
                return {
                    logged: true,
                    account: data.response.user.name,
                    consumerKey: config.consumerKey,
                    consumerSecret: config.consumerSecret,
                    accessTokenKey: config.accessTokenKey,
                    accessTokenSecret: config.accessTokenSecret
                };
            }).catch(function (err) {
                console.info('Outdated tokens', err.statusText);
                logout();
                return {
                    logged: false,
                    consumerKey: config.consumerKey,
                    consumerSecret: config.consumerSecret
                };
            });
        } else if (config.consumerKey && config.consumerSecret) {
            return {
                logged: false,
                consumerKey: config.consumerKey,
                consumerSecret: config.consumerSecret
            };
        } else {
            return {
                logged: false,
                consumerKey: '',
                consumerSecret: ''
            };
        }
    });
};

var logout = function () {
    var currentPrefs = {
        consumerKey: '',
        consumerSecret: '',
        accessTokenKey: '',
        accessTokenSecret: ''
    };
    tumblrClient = {};
    getPrefs('tumblrTokens').then(function (response) {
        currentPrefs = response.tumblrTokens || currentPrefs;
        return currentPrefs;
    }).then(function (prefs) {
        return setPrefs({
            tumblrTokens: {
                consumerKey: prefs.consumerKey,
                consumerSecret: prefs.consumerSecret,
                accessTokenKey: '',
                accessTokenSecret: ''
            }
        });
    }).then(function (response) {
        console.info('Logged out');
    });
};