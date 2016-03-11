/*jshint esversion: 6 */
/*jslint multivar*/
/*global fT */
(function () {

    //Debounce?
    var save = function (event) {
        var saveLabel = document.getElementById('save');
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
            saveLabel.innerText = 'Saved';
            setTimeout(() => saveLabel.style.visibility = 'hidden', 3000);
        });
    };

    fT.getPrefs('autotagger').then(function (response) {
        if (response.autotagger) {
            for (let itm of Object.keys(response.autotagger)) {
                document.getElementById(itm).value = response.autotagger[itm];
            }
        }
    });

    Array.from(document.getElementsByTagName('input')).forEach((itm) => itm.addEventListener('input', save, false));
    document.getElementById('text').focus();

}());
