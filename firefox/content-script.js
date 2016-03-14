/*jshint esversion: 6 */
/*jslint browser: true, es6: true, multivar: true */
/*global chrome, OAuth, fT */
(function () {
    "use strict";

    var blogsList = [],
        blogpostRegex = new RegExp(/^https?:\/\/[\da-z\.\-]+\.[a-z\.]{2,6}\/post\/\d+\/?.*$/, 'i'),
        obsConfig = {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        },
        observer = new MutationObserver(processPage),
        buttonsArray = [],
        frequentTags = {};

    const MIN_FREQUENCY = 0.60,
          MIN_REBLOG = 5;

    function update(status) {
        if (status.logged) {
            startup(status);
        } else {
            cleanup();
        }
    }

    function startup(status) {
        fT.tumblrClient.request('https://api.tumblr.com/v2/user/info').then(function (response) {
            return response.json();
        }).then(function (data) {
            blogsList = [];
            let blogs = data.response.user.blogs;
            blogs.forEach(function (itm) {
                blogsList.push(itm.name + '.tumblr.com');
            });
            console.info('Associated blogs: ', blogsList.join());
            return data;
        }).then(function (data) {
            observer.observe(document, obsConfig);
            processPage();
        }).catch(function (err) {
            console.warn('Error while connecting to Tumblr', err.statusText || err);
            if (err.status === 401) {
                fT.getStatus().then((status) => update(status));
            }
        });
    }

    function cleanup() {
        observer.disconnect();
        buttonsArray.forEach(function (el) {
            if (el instanceof TumblrifyButtons) {
                el.destroy();
            }
        });
        buttonsArray = [];
        blogsList = [];
    }

    var Dropdown = (function () {
        function clickHandler (event) {
            let li = event.target.closest('li'),
                currentFocus = this.dropdownContainer.getElementsByClassName('focused')[0];
            event.stopPropagation();
            if (currentFocus) {
                currentFocus.classList.remove('focused');
            }
            li.classList.add('focused');
            if (li.classList.contains('selected')) {
                li.classList.remove('selected');
            } else {
                li.classList.add('selected');
            }
        }

        function hoverHandler (event) {
            let currentFocus = this.dropdownContainer.getElementsByClassName('focused')[0];
            let nextFocus = event.target.closest('li');
            if (currentFocus) {
                currentFocus.classList.remove('focused');
            }
            if (nextFocus) {
                nextFocus.classList.add('focused');
            }
        }

        function keyHandler (event) {
            if (this.dropdownContainer.style.display === 'none' || this.dropdownContainer.style.display === '') {
                if (event.keyCode === 40) {
                    event.stopPropagation();
                    this.open();
                }
            } else {
                let currentFocus = this.dropdownContainer.getElementsByClassName('focused')[0];
                if (!currentFocus) {
                    this.dropdownContainer.getElementsByTagName('li')[0].classList.add('focused');
                    return;
                }
                if (event.keyCode === 40 || event.keyCode === 9) {
                    let nextFocus = currentFocus.nextElementSibling;
                    event.preventDefault();
                    if (nextFocus) {
                        currentFocus.classList.remove('focused');
                        nextFocus.classList.add('focused');
                    }
                } else if (event.keyCode === 38 || (event.shiftKey && event.keyCode === 9)) {
                    let previousFocus = currentFocus.previousElementSibling;
                    event.preventDefault();
                    if (previousFocus) {
                        currentFocus.classList.remove('focused');
                        previousFocus.classList.add('focused');
                    }
                } else if (event.keyCode === 13) {
                    event.preventDefault();
                    if (currentFocus.classList.contains('selected')) {
                        currentFocus.classList.remove('selected');
                    } else {
                        currentFocus.classList.add('selected');
                    }
                    this.close();
                } else if (event.keyCode === 32) {
                    event.preventDefault();
                    if (currentFocus.classList.contains('selected')) {
                        currentFocus.classList.remove('selected');
                    } else {
                        currentFocus.classList.add('selected');
                    }
                } else if (event.keyCode === 27) {
                    event.stopPropagation();
                    this.close();
                }
            }
        }

        function Dropdown (el, optionsList) {
            this.dropdownContainer = document.createElement('ul');
            this.linkedEl = el;

            let tagsGroup = document.createElement('div'),
                tagsArrow = document.createElement('i'),
                parentEl = this.linkedEl.parentElement,
                nextSibling = this.linkedEl.nextElementSibling;

            this.linkedEl.closest('.popupContainer').addEventListener('click', this.close.bind(this), false);
            tagsArrow.addEventListener('click', this.toggle.bind(this), false);
            this.linkedEl.addEventListener('keydown', keyHandler.bind(this), false);
            this.dropdownContainer.addEventListener('click', clickHandler.bind(this), false);
            this.dropdownContainer.addEventListener('mouseover', hoverHandler.bind(this), false);

            this.dropdownContainer.classList.add('dropdown');
            this.linkedEl.classList.add('expand');
            tagsGroup.classList.add('divGroup');
            tagsArrow.classList.add('arrowDown');

            tagsArrow.innerText = '\uf0d7';

            optionsList.forEach((function (itm) {
                let li = document.createElement('li'),
                    liGroup = document.createElement('div'),
                    optionName = document.createElement('span'),
                    optionValue = document.createElement('span');

                liGroup.classList.add('li-group');
                optionName.classList.add('option-name');
                optionValue.classList.add('option-value');

                if (itm.type === 'Autotag') {
                    li.classList.add('selected');
                }
                li.dataset.tags = itm.value;
                optionName.innerText = itm.type + ': ' + itm.name;
                optionValue.innerText = itm.value;

                liGroup.appendChild(optionName);
                liGroup.appendChild(optionValue);
                li.appendChild(liGroup);
                this.dropdownContainer.appendChild(li);
            }).bind(this));

            tagsGroup.appendChild(this.linkedEl);
            tagsGroup.appendChild(tagsArrow);
            parentEl.insertBefore(tagsGroup, nextSibling);
            parentEl.appendChild(this.dropdownContainer);

            return this;
        }

        Dropdown.prototype.toggle = function (event) {
            event.stopPropagation();
            if (this.dropdownContainer.style.display === 'none' || this.dropdownContainer.style.display === '') {
                this.open();
            } else {
                this.close();
            }
        };

        Dropdown.prototype.open = function () {
            this.dropdownContainer.style.display = 'flex';
            this.dropdownContainer.style.position = 'absolute';
            this.dropdownContainer.style.top = this.linkedEl.parentElement.offsetTop + this.linkedEl.offsetTop + this.linkedEl.getBoundingClientRect().height + 'px';
            this.dropdownContainer.style.left = this.linkedEl.parentElement.offsetLeft + this.linkedEl.offsetLeft + 'px';
            this.dropdownContainer.getElementsByTagName('li')[0].classList.add('focused');
        };

        Dropdown.prototype.close = function () {
            let currentFocus = this.dropdownContainer.getElementsByClassName('focused')[0];
            if (currentFocus) {
                currentFocus.classList.remove('focused');
            }
            this.dropdownContainer.style.display = 'none';

        };

        Dropdown.prototype.destroy = function () {
            this.linkedEl = null;
            this.dropdownContainer = null;
        };

        return Dropdown;
    }());

    var ReblogPopup = (function () {
        function keyHandler (event) {
            event.stopPropagation();
            if (event.keyCode === 27) {
                this.close();
            }
        }

        function toggleSelect (event) {
            event.stopPropagation();
            let clickEvent = new MouseEvent('mousedown', {bubbles: true, cancelable: true, view: window});
            this.popupContainer.querySelector('[name="blog_identifier"]').dispatchEvent(clickEvent);
        }

        function uuid () {
            let idChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                randomId = Array(5).fill(0);
            randomId.forEach((k, i) => {
                randomId[i] = idChar.charAt(~~(Math.random() * idChar.length));
            });
            return randomId.join('');
        }

        function calculateFrequency (tagObj) {
            var frequencyArr = [];
            let count = tagObj.count,
                tags = tagObj.tags;
            if (count <= MIN_REBLOG) {
                return frequencyArr;
            }
            for (let tag of Object.keys(tags)) {
                let freq = +tags[tag] / +count;
                if (freq >= MIN_FREQUENCY) {
                    frequencyArr.push({
                        type: 'Tag suggestion',
                        name: ~~(freq * 100) + '%',
                        value: tag
                    });
                }
            }
            return frequencyArr;
        }

        function ReblogPopup(parentEl, data) {
            let popupWrapper = document.createElement('form'),
                arrowDiv = document.createElement('div'),
                tagsInput = document.createElement('input'),
                clearTagsButton = document.createElement('button'),
                restoreTagsButton = document.createElement('button'),
                commentArea = document.createElement('div'),
                attachReblogCheckbox = document.createElement('input'),
                attachReblogLabel = document.createElement('label'),
                attachReblogGroup = document.createElement('div'),
                blogsSelect = document.createElement('select'),
                blogsGroup = document.createElement('div'),
                blogsArrow = document.createElement('i'),
                buttonsGroup = document.createElement('div'),
                publishButton = document.createElement('button'),
                queueButton = document.createElement('button'),
                draftButton = document.createElement('button'),
                prefsResolve = [];

            this.popupContainer = document.createElement('div');
            this.postData = data;

            this.popupContainer.addEventListener('click', (e) => e.stopPropagation(), false);
            publishButton.addEventListener('click', this.publish.bind(this), false);
            queueButton.addEventListener('click', this.queue.bind(this), false);
            draftButton.addEventListener('click', this.draft.bind(this), false);
            clearTagsButton.addEventListener('click', this.clearTags.bind(this), false);
            restoreTagsButton.addEventListener('click', this.restoreTags.bind(this), false);
            blogsArrow.addEventListener('click', toggleSelect.bind(this), false);
            this.popupContainer.addEventListener('keydown', keyHandler.bind(this), false);

            popupWrapper.autocomplete = 'off';

            tagsInput.name = 'tags';
            blogsSelect.name = 'blog_identifier';
            attachReblogCheckbox.name = 'attachReblog';
            publishButton.name = 'publishButton';
            queueButton.name = 'queueButton';
            draftButton.name = 'draftButton';
            clearTagsButton.name = 'clearTagsButton';
            restoreTagsButton.name = 'restoreTagsButton';

            publishButton.type = 'button';
            queueButton.type = 'button';
            draftButton.type = 'button';
            clearTagsButton.type = 'button';
            restoreTagsButton.type = 'button';

            prefsResolve.push(fT.getPrefs('enableOriginalTags').then((function (prefs) {
                if (prefs.enableOriginalTags) {
                    tagsInput.value =  this.postData.tags.join(',');
                    clearTagsButton.style.display = 'inline-block';
                    restoreTagsButton.style.display = 'none';
                } else {
                    tagsInput.value = '';
                    clearTagsButton.style.display = 'none';
                    restoreTagsButton.style.display = 'inline-block';
                }
            }).bind(this)));

            prefsResolve.push(Promise.all([
                    fT.getPrefs('autotagger'),
                    fT.getPrefs('tagbundle'),
                    fT.getPrefs('enableTagsFrequency')
                ]).then((function (prefs) {
                    let optionsList = [];
                    if (prefs[0].autotagger) {
                        let autotags = prefs[0].autotagger[this.postData.type];
                        if (autotags.length) {
                            optionsList.push({
                                type: 'Autotag',
                                name: this.postData.type,
                                value: autotags
                            });
                        }
                    }

                    if (prefs[2].enableTagsFrequency) {
                        if (frequentTags.hasOwnProperty(this.postData.blog_name)) {
                            optionsList = optionsList.concat(calculateFrequency(frequentTags[this.postData.blog_name]));
                        }
                        if (this.postData.source_name && frequentTags.hasOwnProperty(this.postData.source_name)) {
                            optionsList = optionsList.concat(calculateFrequency(frequentTags[this.postData.source_name]));
                        }
                    }

                    if (prefs[1].tagbundle && prefs[1].tagbundle.length) {
                        prefs[1].tagbundle.forEach(function (itm){
                            optionsList.push({
                                type: 'Bundle',
                                name: itm.name,
                                value: itm.value
                            });
                        });
                    }

                    if (optionsList.length) {
                        this.dropdown = new Dropdown(tagsInput, optionsList);
                    }
                }).bind(this)));

            blogsList.forEach(function (itm) {
                let blogItm = document.createElement('option');
                blogItm.value = itm;
                blogItm.innerText = itm;
                blogsSelect.appendChild(blogItm);
            });

            blogsArrow.innerText = '\uf0d7';
            publishButton.innerText = '\uf079';
            queueButton.innerText = '\uf017';
            draftButton.innerText = '\uf044';
            clearTagsButton.innerText = 'Clear tags';
            restoreTagsButton.innerText = 'Restore tags';

            attachReblogCheckbox.type = 'checkbox';
            attachReblogCheckbox.value = 'attach_reblog_tree';
            attachReblogCheckbox.checked = false;
            attachReblogLabel.innerText = 'Remove comment tree';

            publishButton.classList.add('blue');
            queueButton.classList.add('blue');
            draftButton.classList.add('blue');

            arrowDiv.classList.add('arrow');
            popupWrapper.classList.add('popupWrapper');
            this.popupContainer.classList.add('popupContainer');
            commentArea.classList.add('commentArea');
            buttonsGroup.classList.add('buttonsGroup');
            blogsSelect.classList.add('expand');
            blogsGroup.classList.add('divGroup');
            blogsArrow.classList.add('arrowDown');
            attachReblogGroup.classList.add('divGroup');
            let randomId = uuid();
            attachReblogCheckbox.setAttribute('id', 'attachReblog-' + randomId);
            attachReblogLabel.htmlFor = 'attachReblog-' + randomId;

            buttonsGroup.appendChild(publishButton);
            buttonsGroup.appendChild(queueButton);
            buttonsGroup.appendChild(draftButton);
            blogsGroup.appendChild(blogsSelect);
            blogsGroup.appendChild(blogsArrow);
            popupWrapper.appendChild(tagsInput);
            popupWrapper.appendChild(clearTagsButton);
            popupWrapper.appendChild(restoreTagsButton);
            popupWrapper.appendChild(commentArea);
            attachReblogGroup.appendChild(attachReblogCheckbox);
            attachReblogGroup.appendChild(attachReblogLabel);
            popupWrapper.appendChild(attachReblogGroup);
            popupWrapper.appendChild(blogsGroup);
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
                    ]
                }
            });
            // do not not propagate to Feedly shortcuts!
            commentArea.addEventListener('input', (e) => e.stopPropagation(), false);
            commentArea.addEventListener('keypress', (e) => e.stopPropagation(), false);
            commentArea.addEventListener('keyup', (e) => e.stopPropagation(), false);

            this.popupContainer.appendChild(arrowDiv);
            this.popupContainer.appendChild(popupWrapper);
            Promise.all(prefsResolve).then(() => parentEl.appendChild(this.popupContainer))
                .catch((e) => console.warn(e));

            return this;
        }

        ReblogPopup.prototype.clearTags = function () {
            let form = this.popupContainer.getElementsByTagName('form')[0],
                tagsInput = form.elements.tags,
                clearTagsButton = form.elements.clearTagsButton,
                restoreTagsButton = form.elements.restoreTagsButton;

            tagsInput.value = '';
            clearTagsButton.style.display = 'none';
            restoreTagsButton.style.display = 'inline-block';
        };

        ReblogPopup.prototype.restoreTags = function () {
            let form = this.popupContainer.getElementsByTagName('form')[0],
                tagsInput = form.elements.tags,
                clearTagsButton = form.elements.clearTagsButton,
                restoreTagsButton = form.elements.restoreTagsButton;

            tagsInput.value = fT.tagsTrim(tagsInput.value);
            if (tagsInput.value.length) {
                tagsInput.value += ', ';
            }
            tagsInput.value += this.postData.tags.join(',');
            clearTagsButton.style.display = 'inline-block';
            restoreTagsButton.style.display = 'none';
        };

        ReblogPopup.prototype.publish = function () {
            this.reblog('published');
        };

        ReblogPopup.prototype.queue = function () {
            this.reblog('queue');
        };

        ReblogPopup.prototype.draft = function () {
            this.reblog('draft');
        };

        ReblogPopup.prototype.reblog = function (state) {
            var form = this.popupContainer.getElementsByTagName('form')[0],
                blog_identifier = form.elements.blog_identifier.value.trim(),
                comment = this.editor.elements[0].innerHTML.trim(),
                tags = fT.tagsTrim(form.elements.tags.value).replace(/-/g, ' '),
                attachReblog = !form.elements.attachReblog.checked,
                buttonsGroup = this.popupContainer.getElementsByClassName('buttonsGroup')[0],
                allTags = tags;

            Array.from(buttonsGroup.children).forEach((itm) => itm.disabled = true);
            if (this.dropdown) {
                let selectedTags = Array.from(this.dropdown.dropdownContainer.getElementsByClassName('selected'));
                selectedTags.forEach((itm) => allTags += ',' + itm.dataset.tags);
            }

            return fT.tumblrClient.request('https://api.tumblr.com/v2/blog/' + blog_identifier + '/post/reblog', {
                    method: 'POST',
                    body: 'id=' + this.postData.id + '&reblog_key=' + this.postData.reblog_key +
                        '&state=' + state + '&comment=' + comment + '&tags=' + allTags +
                        '&attach_reblog_tree=' + attachReblog
            }).then((function (response) {
                let showReblogButton = this.popupContainer.parentElement.getElementsByClassName('fa-retweet')[0];
                this.close();
                showReblogButton.classList.add('reblogged');
                return response.json();
            }).bind(this)).then((function () {
                return fT.getPrefs('enableTagsFrequency').then((function (prefs) {
                    if (prefs.enableTagsFrequency && tags.length) {
                        let tagsArr = tags.split(',').map((itm) => fT.tagsTrim(itm).toLowerCase());
                        if (!frequentTags.hasOwnProperty(this.postData.blog_name)) {
                            frequentTags[this.postData.blog_name] = {};
                        }
                        frequentTags[this.postData.blog_name].count = frequentTags[this.postData.blog_name].hasOwnProperty('count') ? +frequentTags[this.postData.blog_name].count + 1  : 1;
                        tagsArr.forEach((function (itm) {
                            if (frequentTags[this.postData.blog_name].hasOwnProperty('tags')) {
                                frequentTags[this.postData.blog_name].tags[itm] = frequentTags[this.postData.blog_name].tags[itm] ? +frequentTags[this.postData.blog_name].tags[itm] + 1  : 1;
                            } else {
                                frequentTags[this.postData.blog_name].tags = {};
                                frequentTags[this.postData.blog_name].tags[itm] = 1;
                            }
                        }).bind(this));
                        fT.setPrefs({frequentTags: frequentTags});
                    }
                }).bind(this));
            }).bind(this)).catch((function (err) {
                this.close();
                console.log('Error while reblogging post', err.statusText || err);
                if (err.status === 401) {
                    fT.getStatus().then((status) => update(status));
                } else if (err.status === 403) {
                    console.log('You are probably blocked by this blog\'s author.');
                } else if (err.status === 404) {
                    console.log('This post has been deleted or is private.');
                } else {
                    Array.from(buttonsGroup.children).forEach((itm) => itm.disabled = false);
                }
            }).bind(this));
        };

        ReblogPopup.prototype.close = function () {
            if (this.dropdown) {
                this.dropdown.close();
            }
            this.popupContainer.style.display = 'none';
        };

        ReblogPopup.prototype.destroy = function () {
            this.popupContainer.parentElement.removeChild(this.popupContainer);
            this.postData = null;
            if (this.dropdown) {
                this.dropdown.destroy();
                this.dropdown = null;
            }
            this.popupContainer = null;
        };

        return ReblogPopup;
    }());

    var TumblrifyButtons = (function () {
        function TumblrifyButtons(parentEl, data) {
            let likeButton = document.createElement('i'),
                showReblogButton = document.createElement('i');

            this.buttonsContainer = document.createElement('div');
            this.postData = data;

            this.buttonsContainer.addEventListener('click', (e) => e.stopPropagation(), false);
            likeButton.addEventListener('click', this.like.bind(this), false);
            showReblogButton.addEventListener('click', this.showReblog.bind(this), false);

            this.buttonsContainer.classList.add('buttonsContainer');
            likeButton.classList.add('fa', 'fa-lg', 'fa-heart');
            if (data.liked) {
                likeButton.classList.add('liked');
            }
            showReblogButton.classList.add('fa', 'fa-lg', 'fa-retweet');

            this.buttonsContainer.appendChild(likeButton);
            this.buttonsContainer.appendChild(showReblogButton);

            parentEl.appendChild(this.buttonsContainer);
            return this;
        }

        TumblrifyButtons.prototype.like = function (event) {
            let res,
                likeButton = this.buttonsContainer.children[0];
            event.stopPropagation();
            if (this.postData.liked) {
                res = fT.tumblrClient.request('https://api.tumblr.com/v2/user/unlike', {
                    method: 'POST',
                    body: 'id=' + this.postData.id + '&reblog_key=' + this.postData.reblog_key
                }).then((function (response) {
                    likeButton.classList.remove('liked');
                    this.postData.liked = false;
                    return response;
                }).bind(this));
            } else {
                res = fT.tumblrClient.request('https://api.tumblr.com/v2/user/like', {
                    method: 'POST',
                    body: 'id=' + this.postData.id + '&reblog_key=' + this.postData.reblog_key
                }).then((function (response) {
                    likeButton.classList.add('liked');
                    this.postData.liked = true;
                    return response;
                }).bind(this));
            }
            return res.catch(function (err) {
                console.log('Error while liking post', err.statusText || err);
                if (err.status === 401) {
                    fT.getStatus().then((status) => update(status));
                } else if (err.status === 403) {
                    console.log('You are probably blocked by this blog\'s author.');
                } else if (err.status === 404) {
                    console.log('This post has been deleted or is private.');
                }
            });
        };

        TumblrifyButtons.prototype.showReblog = function (event) {
            event.stopPropagation();
            this.popup = (this.popup instanceof ReblogPopup) ? this.popup : new ReblogPopup(this.buttonsContainer,
                this.postData);
            if (this.popup.popupContainer.style.display !== 'block') {
                this.popup.popupContainer.style.display = 'block';
                let buttonsGroup = this.popup.popupContainer.getElementsByClassName('buttonsGroup')[0];
                Array.from(buttonsGroup.children).forEach((itm) => itm.disabled = false);
            } else {
                this.popup.close();
            }
        };

        TumblrifyButtons.prototype.destroy = function () {
            let parentEl = this.buttonsContainer.parentElement;
            parentEl.removeChild(this.buttonsContainer);
            parentEl.closest('.tumblrify').classList.remove('tumblrify');
            this.popupContainer.destroy();
            this.popupContainer = null;
            this.postData = null;
            this.buttonsContainer = null;
        };

        return TumblrifyButtons;
    }());

    function getPost(blogName, id) {
        return fT.tumblrClient.request('https://api.tumblr.com/v2/blog/' + blogName + '/posts?id=' + id)
        .then(function (response) {
            return response.json();
        }).then(function (data) {
            if (data.response.posts[0]) {
                let postData = {
                    blog_name: data.response.posts[0].blog_name,
                    id: data.response.posts[0].id,
                    reblog_key: data.response.posts[0].reblog_key,
                    type: data.response.posts[0].type,
                    liked: data.response.posts[0].liked,
                    tags: data.response.posts[0].tags
                };
                if (data.response.posts[0].trail && data.response.posts[0].trail[0] &&
                    data.response.posts[0].trail[0].is_root_item && !data.response.posts[0].trail[0].is_current_item &&
                    data.response.posts[0].blog_name !== data.response.posts[0].trail[0].blog.name) {
                    postData.source_name = data.response.posts[0].trail[0].blog.name;
                }
                return postData;
            } else {
                throw new Error({status: 404, statusTest: 'Not found'});
            }
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
                if (itm.getElementsByClassName('buttonsContainer').length) { return false;}
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
                    parentEl = itm.getElementsByClassName('headerInfo headerInfo-article')[0];
                } else {
                    parentEl = itm;
                }
                buttonsArray.push(new TumblrifyButtons(parentEl, data));
            }).catch(function (err) {
                console.log('Error while fetching post', blogName, id, err.statusText || err);
                if (err.status === 401) {
                    fT.getStatus().then((status) => update(status));
                }
            });
        });
        /*
         *  Below is to handle moving the buttons in the sliding header while in sidebar view
         *  To put it back, we need to detect when the sliding header is destroyed with MutationRecord.removedNodes
         */
        if (document.getElementsByClassName('u100Entry tumblrify')[0]) {
            var removedHeader = '';
            let slidingHeader = document.querySelector('.headerInfo.sliderContainer:not(.moved)');
            if (slidingHeader) {
                let headerContent = slidingHeader.getElementsByClassName('sliderWidth sliderCenter'),
                    buttonsContainer = slidingHeader.closest('.slideEntryContent').getElementsByClassName('buttonsContainer')[0];
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
                        return (itm.getElementsByClassName('buttonsContainer moved')[0] && itm.parentElement === null);
                    });
                }
            }
            if (removedHeader.length) {
                let parentEl = document.querySelector('.u100Entry.tumblrify .headerInfo.headerInfo-article'),
                    buttonsContainer = removedHeader[0].getElementsByClassName('buttonsContainer moved')[0];
                buttonsContainer.classList.remove('moved');
                parentEl.appendChild(buttonsContainer);
            }
        }
    }

    //onpopstate doesn't seem to work
    var cleanupInterval = window.setInterval(function () {
        buttonsArray.forEach(function (el, index, arr) {
            if (el instanceof TumblrifyButtons && el.buttonsContainer.parentElement === null) {
                el.destroy();
                el = null;
                delete arr[index];
            }
        });
    }, 120000);

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (!sender.tab.url) {
            if (request.storageChanged === 'tumblrTokens') {
                fT.getStatus().then((status) => update(status));
            }
        }
    });
    fT.getPrefs('frequentTags').then(function (response) {
            frequentTags = response.hasOwnProperty('frequentTags') ? response.frequentTags : {};
    });
    fT.getStatus().then((status) => update(status));

}());
