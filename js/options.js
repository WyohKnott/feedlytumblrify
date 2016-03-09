(function () {

    'use strict';

    var resize = function () {
        let iframe = document.getElementById('iframe');
        iframe.style.height = iframe.contentWindow.document.body.offsetHeight + 'px';
    };

    var loadTab = function () {
        let tabUrl = document.location.hash.slice(1),
            currentTab = document.querySelector('.tabButton.selected');
        if (!tabUrl) {
            tabUrl = 'account.html';
        }
        let tabButton = document.querySelector('[href="#' + tabUrl + '"]');
        if (!tabButton || tabButton.classList.contains('selected')) {
            return;
        }
        if (currentTab) {
            currentTab.classList.remove('selected');
        }
        document.getElementById('iframe').src = tabUrl;
        setTimeout(resize, 200);
        tabButton.classList.add('selected');
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

    Array.from(document.getElementsByClassName('tabButton')).forEach((itm) => itm.addEventListener('click', changeTab, false));
    loadTab();

}());
