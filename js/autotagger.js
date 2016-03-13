/*jshint esversion: 6 */
/*jslint browser: true, es6: true, multivar: true */
/*global fT */
(function () {
    "use strict";

    //Debounce?
    function save(event) {
        var saveLabel = document.getElementById('save'),
            autotags = {};
        saveLabel.innerText = 'Saving…';
        saveLabel.style.visibility = 'visible';
        Array.from(document.getElementsByTagName('input')).forEach((itm) => autotags[itm.name] = fT.tagsTrim(itm.value));
        fT.setPrefs({autotagger: autotags}).then(function () {
            saveLabel.innerText = 'Saved';
            setTimeout(() => saveLabel.style.visibility = 'hidden', 3000);
        });
    }

    fT.getPrefs('autotagger').then(function (response) {
        var form = document.forms[0];
        if (response.autotagger) {
            for (let itm of Object.keys(response.autotagger)) {
                form[itm].value = response.autotagger[itm];
            }
        }
    });

    Array.from(document.getElementsByTagName('input')).forEach((itm) => itm.addEventListener('input', save, false));
    document.getElementById('text').focus();

}());
