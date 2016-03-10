/*jshint esversion: 6 */
/*jslint multivar*/
/*global fT */
(function () {
    var save = function () {
        var spinLabel = document.getElementById('spin'),
            saveLabel = document.getElementById('save');

        spinLabel.style.visibility = 'visible';
        saveLabel.style.visibility = 'visible';
        saveLabel.innerText = 'Saving…';
        fT.setPrefs({autotagger: {
            text: document.getElementById('text').value.trim(),
            photo: document.getElementById('photo').value.trim(),
            quote: document.getElementById('quote').value.trim(),
            link: document.getElementById('link').value.trim(),
            answer: document.getElementById('answer').value.trim(),
            video: document.getElementById('video').value.trim(),
            audio: document.getElementById('audio').value.trim(),
            chat: document.getElementById('chat').value.trim()
        }}).then(function () {
            spinLabel.style.visibility = 'hidden';
            saveLabel.innerText = 'Saved';
            setTimeout(() => saveLabel.style.visibility = 'hidden', 3000);
        })
    };

    fT.getPrefs('autotagger').then(function (response) {
        if (response.autotagger) {
            for (itm of Object.keys(response.autotagger)) {
                document.getElementById(itm).value = response.autotagger[itm];
            }
        }
    });

    Array.from(document.getElementsByTagName('input')).forEach((itm) => itm.addEventListener('input', save, false));
    document.getElementById('text').focus();

}());
