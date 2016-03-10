/*jshint esversion: 6 */
/*jslint multivar, browser*/
/*global btoa, crypto, fetch, Headers, TextEncoder, URL, URLSearchParams */
(function() {
    "use strict";

    var root = (typeof self == 'object' && self.self == self && self) ||
            (typeof global == 'object' && global.global == global && global) ||
            this;

    var OAuth_VERSION_1_0 = '1.0',
        encoder = new TextEncoder('utf-8');

    function ua2b64(ua) {
        return btoa(String.fromCharCode(...ua));
    }

    function getTimestamp() {
        return parseInt(+new Date() / 1000, 10);
    }

    function getNonce() {
        return ua2b64(crypto.getRandomValues(new Uint8Array(10)));
    }

    function mapSort(maplikeObject) {
        return maplikeObject.sort(function (a, b) {
            if (a[0] < b[0]) {
                return -1;
            } else if (a[0] > b[0]) {
                return 1;
            } else {
                if (a[1] < b[1]) {
                    return -1;
                } else if (a[1] > b[1]) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });
    }

    function toRFC3986(str) {
        return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16);
        });
    }

    function toFormData(authorizationHeader, urlParams) {
        var form = new FormData();
        urlParams.forEach(function (d) {
            if (!authorizationHeader.get(d[0])) {
                form.append(d[0], d[1]);
            }
        });
        return form;
    }

    function toSignatureData(authorizationHeader, urlParams) {
        var params = new URLSearchParams();
        urlParams.forEach(function (d) {
            if (!authorizationHeader.get(d[0])) {
                params.append(d[0], d[1]);
            }
        });
        return params;
    }

    function toSignatureBaseString(method, target, authorizationHeader, data) {
        var arr = [];
        for (let h of authorizationHeader) {
            if (h[1] !== undefined && h[1] !== '') {
                arr.push([h[0], toRFC3986(h[1] + '')]);
            }
        }
        if (data) {
            for (let d of data) {
                arr.push([toRFC3986(d[0]), toRFC3986(d[1] + '')]);
            };
        }
        arr = mapSort(arr).map((itm) => itm.join('='));
        return [method, toRFC3986(target), toRFC3986(arr.join('&'))].join('&');
    }

    function toHeaderString(authorizationHeader) {
        var arr = [],
            realm = '';
        for (let h of authorizationHeader) {
            if (h[1] !== undefined && h[1] !== '') {
                if (h[0] === 'realm') {
                    realm = h[0] + '="' + h[1] + '"';
                } else {
                    arr.push(h[0] + '="' + toRFC3986(h[1] + '') + '"');
                }
            }
        };

        arr.sort();
        if (realm) {
            arr.unshift(realm);
        }

        return arr.join(', ');
    }

    function OAuth(options) {
        var oauth = {
            consumerKey: options.consumerKey,
            consumerSecret: options.consumerSecret,
            accessTokenKey: options.accessTokenKey || '',
            accessTokenSecret: options.accessTokenSecret || '',
            callbackUrl: options.callbackUrl || 'oob',
            verifier: '',
            signatureMethod: options.signatureMethod || 'HMAC-SHA1'
        };

        this.realm = options.realm || '';
        this.requestTokenUrl = options.requestTokenUrl || '';
        this.authorizationUrl = options.authorizationUrl || '';
        this.accessTokenUrl = options.accessTokenUrl || '';

        this.getTokens = function () {
            return {
                apiKey: oauth.apiKey,
                consumerKey: oauth.consumerKey,
                consumerSecret: oauth.consumerSecret,
                accessTokenKey: oauth.accessTokenKey,
                accessTokenSecret: oauth.accessTokenSecret
            };
        };

        this.getAccessToken = function () {
            return [oauth.accessTokenKey, oauth.accessTokenSecret];
        };

        this.getAccessTokenKey = function () {
            return oauth.accessTokenKey;
        };

        this.getAccessTokenSecret = function () {
            return oauth.accessTokenSecret;
        };

        this.setAccessToken = function (tokenArray, tokenSecret) {
            if (tokenSecret) {
                tokenArray = [tokenArray, tokenSecret];
            }
            oauth.accessTokenKey = tokenArray[0];
            oauth.accessTokenSecret = tokenArray[1];
        };

        this.getVerifier = function () {
            return oauth.verifier;
        };

        this.setVerifier = function (verifier) {
            oauth.verifier = verifier;
        };

        this.setCallbackUrl = function (url) {
            oauth.callbackUrl = url;
        };

        /**
         * Makes an authenticated http request
         *
         * @param url {string} A valid http(s) url
         *        options {object} A valid fetch init object
         */
        this.request = function (url, options) {
            var requestURL, target, method, body, searchParams, signatureData, formData,
                    authorizationHeader, signatureBaseString, signaturePromise;

            requestURL = new URL(url);
            target = requestURL.protocol + '//' + requestURL.hostname + requestURL.pathname;
            if (!options) {
                options = {};
            }
            if (!options.method) {
                options.method = 'GET';
            }
            if (!options.headers) {
                options.headers = new Headers();
            }

            method = options.method.toUpperCase();
            body = options.body || '';

            authorizationHeader = new Map([
                ['oauth_callback', oauth.callbackUrl],
                ['oauth_consumer_key', oauth.consumerKey],
                ['oauth_nonce', getNonce()],
                ['oauth_signature_method', oauth.signatureMethod],
                ['oauth_timestamp', getTimestamp()],
                ['oauth_token', oauth.accessTokenKey],
                ['oauth_verifier', oauth.verifier],
                ['oauth_version', OAuth_VERSION_1_0]
            ]);

            searchParams = [...new URLSearchParams(body + '&' + requestURL.search.slice(1))];

            if (options.method === 'GET' || options.method === 'HEAD') {
                signatureData = toSignatureData(authorizationHeader, searchParams);
                signatureBaseString = toSignatureBaseString(method, target, authorizationHeader,
                        signatureData);
                signaturePromise = OAuth.signatureMethod[oauth.signatureMethod](oauth.consumerSecret,
                        oauth.accessTokenSecret, signatureBaseString);
                target += '?' + signatureData.toString();
                options.headers.set('Content-Type', 'text/plain;charset=UTF-8');
                delete options.body;
            } else {
                formData = toFormData(authorizationHeader, searchParams);
                signatureBaseString = toSignatureBaseString(method, target, authorizationHeader,
                        formData);
                signaturePromise = OAuth.signatureMethod[oauth.signatureMethod](oauth.consumerSecret,
                        oauth.accessTokenSecret, signatureBaseString);
                options.body = formData;
            }

            return signaturePromise.then(function (signature) {
                authorizationHeader.set('oauth_signature', signature);
                if (this.realm) {
                    authorizationHeader.set('realm', this.realm);
                }
                options.headers.set('Authorization', 'OAuth ' + toHeaderString(
                    authorizationHeader
                ));
                options.method = method;

                return fetch(target, options).then(function (response) {
                    if (response.ok) {
                        return response;
                    } else {
                        throw response;
                    }
                });
            }.bind(this));
        };

        return this;
    }

    OAuth.prototype.fetchRequestToken = function () {
        var oauth = this;
        oauth.setAccessToken('', '');
        return this.request(this.requestTokenUrl, {
            method: 'POST'
        }).then(function (res) {
            return res.text();
        }).then(function (data) {
            var tokens = new URLSearchParams(data);
            oauth.setAccessToken([tokens.get('oauth_token'), tokens.get(
                'oauth_token_secret'
            )]);
            return oauth.authorizationUrl + '?' + data;
        });
    };

    OAuth.prototype.fetchAccessToken = function () {
        var oauth = this;
        return this.request(this.accessTokenUrl, {
            method: 'POST'
        }).then(function (res) {
            return res.text();
        }).then(function (data) {
            var tokens = new URLSearchParams(data);
            oauth.setAccessToken([tokens.get('oauth_token'), tokens.get(
                'oauth_token_secret'
            )]);
            oauth.setVerifier('');
            return tokens;
        });
    };


    OAuth.signatureMethod = {
        'HMAC-SHA1': function (consumerSecret, tokenSecret, signatureBaseString) {
            var passphrase;

            consumerSecret = toRFC3986(consumerSecret);
            tokenSecret = toRFC3986(tokenSecret || '');
            passphrase = consumerSecret + '&' + tokenSecret;

            return crypto.subtle.importKey(
                "raw",
                encoder.encode(passphrase),
                {
                    name: "HMAC",
                    hash: {
                        name: "SHA-1"
                    }
                },
                false,
                ["sign", "verify"]
            ).then(function (key) {
                return crypto.subtle.sign(
                    {
                        name: "HMAC"
                    },
                    key,
                    encoder.encode(signatureBaseString)
                );
            }).then(function (signature) {
                return ua2b64(new Uint8Array(signature));
            }).catch(function (err) {
                console.error('Could not sign: ', err);
                throw err;
            });
        }
    };

    if (typeof exports != 'undefined') {
        if (typeof module != 'undefined' && module.exports) {
            exports = module.exports = OAuth;
        }
        exports.OAuth = OAuth;
    } else {
        root.OAuth = OAuth;
    }
}());
