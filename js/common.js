/*jshint esversion: 6 */
/*jslint browser: true, es6: true, multivar: true */
/*global chrome, OAuth, URL, URLSearchParams */
var fT = (function () {

    "use strict";

    return {
        tumblrClient: '',
        tumblrEndpoints: {
            callbackUrl: 'https://localhost/redirectpage',
            requestTokenUrl: 'https://www.tumblr.com/oauth/request_token',
            authorizationUrl: 'https://www.tumblr.com/oauth/authorize',
            accessTokenUrl: 'https://www.tumblr.com/oauth/access_token'
        },

        getPrefs: function (prefs) {
            return new Promise(function (resolve, reject) {
                chrome.storage.local.get(prefs, function (response) {
                    resolve(response);
                });
            });
        },

        setPrefs: function (prefs) {
            return new Promise(function (resolve, reject) {
                chrome.storage.local.set(prefs, function (response) {
                    resolve(response);
                });
            });
        },

        dialog: function (message, buttonsArr) {
            var overlay = document.createElement('div');
            return new Promise(function (resolve, reject) {
                let wrapperDiv = document.createElement('div'),
                    messageDiv = document.createElement('div'),
                    buttonsDiv = document.createElement('div');

                overlay.setAttribute('id', 'overlay');
                wrapperDiv.classList.add('wrapper');
                messageDiv.classList.add('message');
                buttonsDiv.classList.add('buttons');
                messageDiv.innerText = message;

                if (!buttonsArr || !buttonsArr.length) {
                    buttonsArr = [{caption: 'OK', value: true, default: true}];
                }

                buttonsArr.forEach(function (button) {
                    if (!button.hasOwnProperty('caption') || !button.hasOwnProperty('value')) {
                        return;
                    }

                    let buttonEl = document.createElement('button');
                    buttonEl.type = 'button';
                    buttonEl.innerText = button.caption;
                    if (button.default) {
                        buttonEl.classList.add('default');
                    }
                    buttonEl.addEventListener('click', () => resolve(button.value), false);
                    buttonsDiv.appendChild(buttonEl);
                });

                wrapperDiv.appendChild(messageDiv);
                wrapperDiv.appendChild(buttonsDiv);
                overlay.appendChild(wrapperDiv);
                document.body.appendChild(overlay);
                overlay.querySelector('.default').focus();
            }).then(function (response) {
                overlay.parentElement.removeChild(overlay);
                return response;
            }).catch(function (err) {
                overlay.parentElement.removeChild(overlay);
                console.warn('Error in confirmation function', err);
            });
        },

        getStatus: function () {
            var config = {};

            // Read current tokens
            return fT.getPrefs('tumblrTokens').then(function (response) {
                config = response.tumblrTokens || config;
                config = Object.assign(config, fT.tumblrEndpoints);

                if (config.consumerKey && config.consumerSecret && config.accessTokenKey && config.accessTokenSecret) {
                    // we have all the tokens but are they still valid?
                    fT.tumblrClient = new OAuth(config);
                    return fT.tumblrClient.request('https://api.tumblr.com/v2/user/info').then(function (response) {
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
                        if (err.status === 401 || err.status === 403) {
                            console.info('Outdated tokens', err.statusText);
                            fT.logout();
                            return {
                                logged: false,
                                consumerKey: config.consumerKey,
                                consumerSecret: config.consumerSecret
                            };
                        } else {
                            // network probably unreachable
                            // we keep the tokens for future use.
                            return {
                                logged: false,
                                consumerKey: config.consumerKey,
                                consumerSecret: config.consumerSecret,
                                accessTokenKey: config.accessTokenKey,
                                accessTokenSecret: config.accessTokenSecret
                            };
                        }
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
        },

        logout: function () {
            fT.tumblrClient = {};
            return fT.getPrefs('tumblrTokens').then(function (response) {
                let currentPrefs = response.tumblrTokens || { consumerKey: '', consumerSecret: '' };
                return currentPrefs;
            }).then(function (prefs) {
                console.info('Logged out');
                return fT.setPrefs({
                    tumblrTokens: {
                        consumerKey: prefs.consumerKey,
                        consumerSecret: prefs.consumerSecret,
                        accessTokenKey: '',
                        accessTokenSecret: ''
                    }
                });
            });
        }
    };
}());
