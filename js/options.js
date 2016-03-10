/*jshint esversion: 6 */
/*jslint multivar*/
/*global URL */
(function () {

    'use strict';

    var resize = function () {
        let iframe = document.getElementById('iframe');
        iframe.style.height = iframe.contentWindow.document.body.offsetHeight + 'px';
        iframe.focus();
    };

    var iframeOnChange = function () {
        let tabUrl = this.src.substring(iframe.src.lastIndexOf('/') + 1),
            currentTab = document.querySelector('.tabButton.selected'),
            tabButton = document.querySelector('[href="#' + tabUrl + '"]');
        if (currentTab) {
            currentTab.classList.remove('selected');
        }
        tabButton.classList.add('selected');
        setTimeout(resize, 200);
    };

    var loadTab = function () {
        let tabUrl = document.location.hash.slice(1);
        if (!tabUrl) {
            tabUrl = 'account.html';
        }
        let tabButton = document.querySelector('[href="#' + tabUrl + '"]');
        if (!tabButton || tabButton.classList.contains('selected')) {
            return;
        }
        document.getElementById('iframe').src = tabUrl;
    };

    var changeTab = function (event) {
        let hash = document.location.hash,
            tabUrl = (new URL(this.href)).hash;

        event.stopPropagation();

        if (hash !== tabUrl) {
            document.location.hash = tabUrl;
            loadTab();
        }
    };

    document.getElementById('iframe').addEventListener('load', iframeOnChange, false);
    Array.from(document.getElementsByClassName('tabButton')).forEach((itm) => itm.addEventListener('click', changeTab, false));
    loadTab();

}());
