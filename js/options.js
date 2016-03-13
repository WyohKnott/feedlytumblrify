/*jshint esversion: 6 */
/*jslint browser: true, es6: true, multivar: true */
/*global URL */
(function () {

    'use strict';

    function iframeOnChange(event) {
        let iframe = event.target,
            tabUrl = iframe.src.substring(iframe.src.lastIndexOf('/') + 1),
            currentTab = document.querySelector('.tabButton.selected'),
            tabButton = document.querySelector('[href="#' + tabUrl + '"]');
        if (currentTab) {
            currentTab.classList.remove('selected');
        }
        tabButton.classList.add('selected');
    }

    function loadTab() {
        let tabUrl = document.location.hash.slice(1),
            iframe = document.getElementById('iframe');
        if (!tabUrl) {
            tabUrl = 'account.html';
        }
        let tabButton = document.querySelector('[href="#' + tabUrl + '"]');
        if (!tabButton || tabButton.classList.contains('selected')) {
            return;
        }
        iframe.src = tabUrl;
        iframe.focus();
    }

    function changeTab(event) {
        let hash = document.location.hash,
            tabUrl = (new URL(event.target.href)).hash;

        event.stopPropagation();

        if (hash !== tabUrl) {
            document.location.hash = tabUrl;
            loadTab();
        }
    }

    document.getElementById('iframe').addEventListener('load', iframeOnChange, false);
    Array.from(document.getElementsByClassName('tabButton')).forEach((itm) => itm.addEventListener('click', changeTab, false));
    loadTab();

}());
