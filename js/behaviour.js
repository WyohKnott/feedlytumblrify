/*jshint esversion: 6 */
/*jslint browser: true, es6: true, multivar: true */
/*global fT */
(function () {
    "use strict";

    function purgeTagHistory() {
        fT.dialog('Do you want to delete your tags history? This will delete all tags suggestions.', [
            {
                caption: 'Yes',
                value: true
            },
            {
                caption: 'No',
                value: false,
                default: true
            }
        ]).then(function (response) {
            if (response === true) {
                fT.setPrefs({frequentTags: {}});
            }
        });
    }

    function save(event) {
        var saveLabel = document.getElementById('save'),
            pref = {};
        pref[event.target.name] = event.target.checked;
        saveLabel.innerText = 'Saving…';
        saveLabel.style.visibility = 'visible';
        fT.setPrefs(pref).then(function () {
            saveLabel.innerText = 'Saved';
            setTimeout(() => saveLabel.style.visibility = 'hidden', 3000);
        });
    }

    Array.from(document.getElementsByTagName('input')).forEach(function (itm) {
        fT.getPrefs(itm.name).then(function (response) {
            if (response.hasOwnProperty(itm.name)) {
                itm.checked = response[itm.name];
            }
        });
    });

    Array.from(document.getElementsByTagName('input')).forEach((itm) => itm.addEventListener('change', save, false));
    document.getElementById('purgeTagHistory').addEventListener('click', purgeTagHistory, false);

}());
