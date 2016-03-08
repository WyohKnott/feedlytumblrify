/* jshint esversion: 6 */
(function () {
    "use strict";

    var blogsList = [],
        blogpostRegex = /^https?:\/\/[\da-z\.-]+\.[a-z\.]{2,6}\/post\/\d+\/?.*$/i,
        obsConfig = {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        },
        observer = new MutationObserver(processPage),
        buttonsArray = [];

    function update(status) {
        if (status.logged) {
            startup(status);
        } else {
            cleanup();
        }
    }

    function startup(status) {
        tumblrClient.request('https://api.tumblr.com/v2/user/info').then(function (response) {
            return response.json();
        }).then(function (data) {
            let blogs = data.response.user.blogs;
            blogsList = [];
            blogs.forEach(function (itm) {
                blogsList.push(itm.name + '.tumblr.com');
            });
            console.info('Associated blogs: ', blogsList.join());
            return data;
        }).then(function (data) {
            observer.observe(document, obsConfig);
            processPage();
        }).catch(function (err) {
            console.warn('Error while connecting to Tumblr', err);
            if (err.status === 401) {
                getStatus().then((status) => update(status));
            }
        });
    }

    function cleanup() {
        observer.disconnect();
        buttonsArray.forEach(function (el) {
            if (el instanceof tumblrifyButtons) {
                el.destroy();
            }
        });
        buttonsArray = [];
        blogsList = [];
    }

    var reblogPopup = (function () {
        function reblogPopup(el, data) {
            if (!(this instanceof reblogPopup)) {
                return new reblogPopup(el, data);
            }
            return this.init(el, data);
        }

        reblogPopup.prototype = {
            popupContainer: '',
            editor: '',
            postData: '',

            init: function (el, data) {
                let popupWrapper = document.createElement('div'),
                    arrowDiv = document.createElement('div'),
                    tagsInput = document.createElement('input'),
                    clearTagsButton = document.createElement('button'),
                    restoreTagsButton = document.createElement('button'),
                    commentArea = document.createElement('div'),
                    attachReblogCheckbox = document.createElement('input'),
                    attachReblogLabel = document.createElement('label'),
                    blogsSelect = document.createElement('select'),
                    buttonsGroup = document.createElement('div'),
                    publishButton = document.createElement('button'),
                    queueButton = document.createElement('button'),
                    draftButton = document.createElement('button'),
                    parentEl = el;

                this.popupContainer = document.createElement('div');
                this.postData = data;

                this.popupContainer.addEventListener('click', (e) => e.stopPropagation(), false);
                publishButton.addEventListener('click', this.publish.bind(this), false);
                queueButton.addEventListener('click', this.queue.bind(this), false);
                draftButton.addEventListener('click', this.draft.bind(this), false);
                clearTagsButton.addEventListener('click', this.clearTags.bind(this), false);
                restoreTagsButton.addEventListener('click', this.restoreTags.bind(this), false);
                this.popupContainer.addEventListener('keydown', this.keyHandler.bind(this), false);

                tagsInput.name = 'tags';
                blogsSelect.name = 'blog_identifier';
                attachReblogCheckbox.name = 'attachReblog';

                tagsInput.value = this.postData.tags.join(',');
                blogsList.forEach(function (itm) {
                    let blogItm = document.createElement('option');
                    blogItm.value = itm;
                    blogItm.innerText = itm;
                    blogsSelect.appendChild(blogItm);
                });

                publishButton.innerText = '\ue040';
                queueButton.innerText = '\ue8b5';
                draftButton.innerText = '\ue882';
                clearTagsButton.innerText = 'Clear tags';
                restoreTagsButton.innerText = 'Restore tags';

                attachReblogCheckbox.type = 'checkbox';
                attachReblogCheckbox.value = 'attach_reblog_tree';
                attachReblogCheckbox.checked = false;
                attachReblogLabel.innerText = 'Remove comment tree';
                attachReblogLabel.insertBefore(attachReblogCheckbox, attachReblogLabel.childNodes[0]);

                publishButton.classList.add('blue');
                queueButton.classList.add('blue');
                draftButton.classList.add('blue');
                restoreTagsButton.style.display = 'none';

                arrowDiv.classList.add('arrow');
                popupWrapper.classList.add('popupWrapper');
                this.popupContainer.classList.add('popupContainer');
                commentArea.classList.add('commentArea');
                buttonsGroup.classList.add('buttonsGroup');
                publishButton.classList.add('publishButton');
                queueButton.classList.add('queueButton');
                draftButton.classList.add('draftButton');
                clearTagsButton.classList.add('clearTagsButton');
                restoreTagsButton.classList.add('restoreTagsButton');

                buttonsGroup.appendChild(publishButton);
                buttonsGroup.appendChild(queueButton);
                buttonsGroup.appendChild(draftButton);
                popupWrapper.appendChild(tagsInput);
                popupWrapper.appendChild(clearTagsButton);
                popupWrapper.appendChild(restoreTagsButton);
                popupWrapper.appendChild(commentArea);
                popupWrapper.appendChild(attachReblogLabel);
                popupWrapper.appendChild(blogsSelect);
                popupWrapper.appendChild(buttonsGroup);

                this.editor = new MediumEditor(commentArea, {
                    activeButtonClass: 'medium-editor-button-active',
                    buttonLabels: 'fontawesome',
                    contentWindow: window,
                    delay: 0,
                    disableReturn: false,
                    disableDoubleReturn: false,
                    disableExtraSpaces: false,
                    disableEditing: false,
                    elementsContainer: false,
                    extensions: {},
                    ownerDocument: document,
                    spellcheck: true,
                    targetBlank: false,
                    toolbar: {
                        allowMultiParagraphSelection: true,
                        buttons: ['bold', 'italic', 'h2', 'anchor', 'strikethrough',
                            'orderedlist', 'unorderedlist', 'indent', 'outdent',
                            'quote'
                        ],
                    }
                });
                // do not not propagate to Feedly shortcuts!
                commentArea.addEventListener('input', (e) => e.stopPropagation(), false);
                commentArea.addEventListener('keypress', (e) => e.stopPropagation(), false);
                commentArea.addEventListener('keyup', (e) => e.stopPropagation(), false);

                this.popupContainer.appendChild(arrowDiv);
                this.popupContainer.appendChild(popupWrapper);

                parentEl.appendChild(this.popupContainer);
                return this;
            },

            clearTags: function () {
                let tagsInput = this.popupContainer.querySelector('[name=tags]'),
                    clearTagsButton = this.popupContainer.querySelector('.clearTagsButton'),
                    restoreTagsButton = this.popupContainer.querySelector('.restoreTagsButton');
                tagsInput.value = '';
                clearTagsButton.style.display = 'none';
                restoreTagsButton.style.display = 'inline-block';
            },

            restoreTags: function () {
                let tagsInput = this.popupContainer.querySelector('[name=tags]'),
                    clearTagsButton = this.popupContainer.querySelector('.clearTagsButton'),
                    restoreTagsButton = this.popupContainer.querySelector('.restoreTagsButton');
                tagsInput.value = tagsInput.value.trim();
                if (tagsInput.value.length) {
                    tagsInput.value += ', ';
                }
                tagsInput.value += this.postData.tags.join(',');
                clearTagsButton.style.display = 'inline-block';
                restoreTagsButton.style.display = 'none';
            },

            publish: function () {
                this.reblog('published');
            },

            queue: function () {
                this.reblog('queue');

            },

            draft: function () {
                this.reblog('draft');
            },

            reblog: function (state) {
                var popup = this;
                let blog_identifier = this.popupContainer.querySelector('[name=blog_identifier]').value
                    .trim(),
                    comment = this.popupContainer.querySelector('.commentArea').innerHTML.trim().replace(
                        /\r\n|\r|\n/g, '<br />'),
                    tags = this.popupContainer.querySelector('[name=tags]').value.trim().replace(
                        /-/g, ' '),
                    attachReblog = !this.popupContainer.querySelector('[name=attachReblog]').checked;
                return tumblrClient.request('https://api.tumblr.com/v2/blog/' + blog_identifier +
                    '/post/reblog', {
                        method: 'POST',
                        body: 'id=' + this.postData.id + '&reblog_key=' + this.postData.reblog_key +
                            '&state=' + state + '&comment=' + comment + '&tags=' + tags +
                            '&attach_reblog_tree=' + attachReblog
                    }).then(function (response) {
                    let showReblogButton = popup.popupContainer.parentElement.querySelector(
                        '.ic-reblog');
                    popup.close();
                    showReblogButton.classList.add('reblogged');
                    return response.json();
                }).catch(function (err) {
                    console.warn('Error while reblogging post', err);
                    if (err.status === 401) {
                        getStatus().then((status) => update(status));
                    }
                });
            },

            keyHandler: function (event) {
                e.stopPropagation();
                if (event.keyCode === 27) {
                    this.close();
                }
            },

            close: function () {
                this.popupContainer.style.display = 'none';
            }

        };

        return reblogPopup;

    }());

    var tumblrifyButtons = (function () {
        function tumblrifyButtons(el, data) {
            if (!(this instanceof tumblrifyButtons)) {
                return new tumblrifyButtons(el, data);
            }
            return this.init(el, data);
        }

        tumblrifyButtons.prototype = {
            buttonsContainer: '',
            postData: '',
            popup: '',

            init: function (el, data) {
                let likeButton = document.createElement('i'),
                    showReblogButton = document.createElement('i'),
                    parentEl = el;

                this.buttonsContainer = document.createElement('div');
                this.postData = data;

                this.buttonsContainer.addEventListener('click', (e) => e.stopPropagation(), false);
                likeButton.addEventListener('click', this.like.bind(this), false);
                showReblogButton.addEventListener('click', this.showReblog.bind(this), false);

                this.buttonsContainer.classList.add('buttonsContainer');
                likeButton.classList.add('ic', 'ic-lg', 'ic-like');
                if (data.liked) {
                    likeButton.classList.add('liked');
                }
                showReblogButton.classList.add('ic', 'ic-lg', 'ic-reblog');

                this.buttonsContainer.appendChild(likeButton);
                this.buttonsContainer.appendChild(showReblogButton);

                parentEl.appendChild(this.buttonsContainer);
                return this;
            },

            like: function (event) {
                var data = this;
                let res,
                    likeButton = this.buttonsContainer.children[0];
                event.stopPropagation();
                if (this.postData.liked) {
                    res = tumblrClient.request('https://api.tumblr.com/v2/user/unlike', {
                        method: 'POST',
                        body: 'id=' + this.postData.id + '&reblog_key=' + this.postData.reblog_key
                    }).then(function (response) {
                        likeButton.classList.remove('liked');
                        data.postData.liked = false;
                        return response;
                    });
                } else {
                    res = tumblrClient.request('https://api.tumblr.com/v2/user/like', {
                        method: 'POST',
                        body: 'id=' + this.postData.id + '&reblog_key=' + this.postData.reblog_key
                    }).then(function (response) {
                        likeButton.classList.add('liked');
                        data.postData.liked = true;
                        return response;
                    });
                }
                return res.catch(function (err) {
                    console.warn('Error while liking post', err);
                    if (err.status === 401) {
                        getStatus().then((status) => update(status));
                    }
                });
            },

            showReblog: function (event) {
                event.stopPropagation();
                this.popup = (this.popup instanceof reblogPopup) ? this.popup : reblogPopup(this.buttonsContainer,
                    this.postData);
                if (this.popup.popupContainer.style.display !== 'block') {
                    this.popup.popupContainer.style.display = 'block';
                } else {
                    this.popup.close();
                }
            },

            destroy: function () {
                let parentEl = this.buttonsContainer.parentElement;
                parentEl.removeChild(this.buttonsContainer);
                parentEl.closest('.tumblrify').classList.remove('tumblrify');
                delete this.buttonsContainer;
                delete this.postData;
                delete this.popupContainer;
            }

        };

        return tumblrifyButtons;

    }());

    function getPost(blogName, id) {
        return tumblrClient.request('https://api.tumblr.com/v2/blog/' + blogName + '/posts?id=' + id).then(function (
            response) {
            return response.json();
        }).then(function (data) {
            if (data.response.posts[0]) {
                return {
                    id: data.response.posts[0].id,
                    reblog_key: data.response.posts[0].reblog_key,
                    liked: data.response.posts[0].liked,
                    tags: data.response.posts[0].tags
                };
            } else {
                throw new Error('no post found');
            }
        }).catch(function (err) {
            console.warn('Error while fetching post', blogName, id, err);
            if (err.status === 401) {
                getStatus().then((status) => update(status));
            }
            throw err;
        });
    }

    function processPage(mutations) {
        // .u5Entry = Cards , .u4Entry = Magazine view
        // .u100Frame = full articles, .u100Entry = sidebar article
        // data-alternate-link
        let nodes = Array.from(document.querySelectorAll(
                '.u4Entry:not(.tumblrify), .u5Entry:not(.tumblrify), .u100Entry:not(.tumblrify), .u100Frame:not(.tumblrify)'
            )),
            filteredNodes = nodes.filter(function (itm) {
                if (itm.querySelectorAll('.buttonsContainer').length) { return false;}
                let link = itm.getAttribute('data-alternate-link');
                return blogpostRegex.test(link);
            });
        filteredNodes.forEach(function (itm) {
            let url = new URL(itm.getAttribute('data-alternate-link')),
                blogName = url.hostname,
                id = url.pathname.match(/(post\/)(\d*)/i)[2];
            itm.classList.add('tumblrify');
            if (!blogName.length || !id.length) {
                return;
            }
            getPost(blogName, id).then(function (data) {
                let parentEl = '';
                if (itm.classList.contains('u100Entry') || itm.classList.contains('u100Frame')) {
                    parentEl = itm.querySelector('.headerInfo.headerInfo-article');
                } else {
                    parentEl = itm;
                }
                buttonsArray.push(new tumblrifyButtons(parentEl, data));
            });
        });
        /*
         *  Below is to handle moving the buttons in the sliding header while in sidebar view
         *  To put it back, we need to detect when the sliding header is destroyed with MutationRecord.removedNodes
         */
        if (document.querySelector('.u100Entry.tumblrify')) {
            var removedHeader = '';
            let slidingHeader = document.querySelector('.headerInfo.sliderContainer:not(.moved)');
            if (slidingHeader) {
                let headerContent = slidingHeader.querySelector('.sliderWidth.sliderCenter'),
                    buttonsContainer = slidingHeader.closest('.slideEntryContent').querySelector('.buttonsContainer');
                if (headerContent && buttonsContainer) {
                    buttonsContainer.classList.add('moved');
                    slidingHeader.classList.add('moved');
                    headerContent.appendChild(buttonsContainer);
                }
            }
            for (let records of mutations) {
                if (records.removedNodes.length) {
                    removedHeader = Array.from(records.removedNodes).filter(function (itm) {
                        if (itm.nodeType !== 1) { return false; }
                        return (itm.querySelector('.buttonsContainer.moved') && itm.parentElement === null);
                    });
                }
            }
            if (removedHeader.length) {
                let parentEl = document.querySelector('.u100Entry.tumblrify .headerInfo.headerInfo-article'),
                    buttonsContainer = removedHeader[0].querySelector('.buttonsContainer.moved');
                buttonsContainer.classList.remove('moved');
                parentEl.appendChild(buttonsContainer);
            }
        }
    }

    //onpopstate doesn't seem to work
    var cleanupInterval = window.setInterval(function () {
        buttonsArray.forEach(function (el, index, arr) {
            if (el instanceof tumblrifyButtons && el.buttonsContainer.parentElement === null) {
                el.destroy();
                delete arr[index];
            }
        });
    }, 120000);

    chrome.storage.onChanged.addListener(() => getStatus()
        .then((status) => update(status))
    );
    getStatus().then((status) => update(status));

}());
