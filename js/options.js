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

    function loadTab(tabUrl) {
        let iframe = document.getElementById('iframe');
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
        let hash = iframe.src.substring(iframe.src.lastIndexOf('/') + 1),
            tabUrl = (new URL(event.target.href)).hash.slice(1);

        event.stopPropagation();

        if (hash !== tabUrl) {
            loadTab(tabUrl);
        }
    }

    document.getElementById('iframe').addEventListener('load', iframeOnChange, false);
    window.addEventListener('popstate', function(event) {
            event.stopPropagation();
        }, false);
    Array.from(document.getElementsByClassName('tabButton')).forEach((itm) => itm.addEventListener('click', changeTab, false));
    loadTab();

}());
