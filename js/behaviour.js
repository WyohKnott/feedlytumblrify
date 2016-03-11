/*jshint esversion: 6 */
/*jslint multivar*/
/*global fT */
(function () {

    var save = function (event) {
        var saveLabel = document.getElementById('save'),
            pref = {};
        pref[event.target.name] = event.target.checked;
        saveLabel.style.visibility = 'visible';
        saveLabel.innerText = 'Saving…';
        fT.setPrefs(pref).then(function () {
            saveLabel.innerText = 'Saved';
            setTimeout(() => saveLabel.style.visibility = 'hidden', 3000);
        });
    };

    Array.from(document.getElementsByTagName('input')).forEach(function (itm) {
        var name = itm.name;
        fT.getPrefs(itm.name).then(function (response) {
            if (response.hasOwnProperty(itm.name)) {
                itm.checked = response[itm.name];
            }
        });
    });

    Array.from(document.getElementsByTagName('input')).forEach((itm) => itm.addEventListener('change', save, false));

}());
