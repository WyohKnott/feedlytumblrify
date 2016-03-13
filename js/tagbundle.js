/*jshint esversion: 6 */
/*jslint browser: true, es6: true, multivar: true */
/*global fT */
(function () {
    "use strict";
    var tagbundle = [],
        bundleArray = [];

    var BundleEditor = (function () {
        function keyHandler(event) {
            if (event.keyCode === 27) {
                event.stopPropagation();
                this.closeEdit();
            } else if (event.keyCode === 13) {
                event.stopPropagation();
                this.save();
            }
        }

        function BundleEditor(parentEl, data) {
            let leftButtons = document.createElement('div'),
                contentDiv = document.createElement('div'),
                rightButtons = document.createElement('div'),
                editButton = document.createElement('div'),
                deleteButton = document.createElement('div'),
                cancelButton = document.createElement('div'),
                confirmButton = document.createElement('div'),
                nameInput = document.createElement('input'),
                valueInput = document.createElement('input');

            this.blankMode = (data === undefined);
            this.bundleContainer = document.createElement('li');
            this.data = this.blankMode  ? {name: '', value: ''} : data;

            editButton.addEventListener('click', this.openEdit.bind(this), false);
            deleteButton.addEventListener('click', this.delete.bind(this), false);
            cancelButton.addEventListener('click', this.closeEdit.bind(this), false);
            confirmButton.addEventListener('click', this.save.bind(this), false);
            nameInput.addEventListener('keydown', keyHandler.bind(this), false);
            valueInput.addEventListener('keydown', keyHandler.bind(this), false);

            editButton.innerText = '\uf040';
            deleteButton.innerText = '\uf1f8';
            cancelButton.innerText = '\uf05e';
            confirmButton.innerText = '\uf00c';

            editButton.style.display = 'inline-block';
            deleteButton.style.display = 'none';
            cancelButton.style.display = 'inline-block';
            confirmButton.style.display = 'inline-block';
            rightButtons.style.display = 'none';

            nameInput.value = this.data.name;
            valueInput.value = this.data.value;
            nameInput.disabled = true;
            valueInput.disabled = true;
            nameInput.maxlength = 20;

            leftButtons.classList.add('leftButtons');
            rightButtons.classList.add('rightButtons');
            contentDiv.classList.add('content');
            editButton.classList.add('button', 'edit');
            deleteButton.classList.add('button', 'delete');
            cancelButton.classList.add('button', 'cancel');
            confirmButton.classList.add('button', 'confirm');
            nameInput.classList.add('name');
            valueInput.classList.add('value');

            leftButtons.appendChild(editButton);
            leftButtons.appendChild(deleteButton);
            rightButtons.appendChild(cancelButton);
            rightButtons.appendChild(confirmButton);
            contentDiv.appendChild(nameInput);
            contentDiv.appendChild(valueInput);
            this.bundleContainer.appendChild(leftButtons);
            this.bundleContainer.appendChild(contentDiv);
            this.bundleContainer.appendChild(rightButtons);

            if (this.blankMode) {
                let newBundle = document.createElement('div');
                newBundle.classList.add('newBundle');
                newBundle.innerText = '\uf055';
                newBundle.addEventListener('click', this.openEdit.bind(this), false);
                editButton.style.display = 'none';
                this.bundleContainer.classList.add('blank');
                this.bundleContainer.appendChild(newBundle);
            }

            parentEl.appendChild(this.bundleContainer);

            return this;
        }

        BundleEditor.prototype.openEdit = function () {
            let editButton = this.bundleContainer.querySelector('.edit'),
                deleteButton = this.bundleContainer.querySelector('.delete'),
                rightButtons = this.bundleContainer.querySelector('.rightButtons'),
                nameInput = this.bundleContainer.querySelector('.name'),
                valueInput = this.bundleContainer.querySelector('.value');

            if (this.blankMode) {
                let newBundle = this.bundleContainer.querySelector('.newBundle');
                deleteButton.style.visibility = 'hidden';
                newBundle.style.display = 'none';
            }

            editButton.style.display = 'none';
            deleteButton.style.display = 'inline-block';
            rightButtons.style.display = 'flex';
            nameInput.disabled = false;
            valueInput.disabled = false;
            nameInput.placeholder = 'Enter a name for this bundle';
            valueInput.placeholder = 'Enter a comma-separated list of tags';
            this.bundleContainer.classList.add('in-edit');
            nameInput.focus();
        };

        BundleEditor.prototype.closeEdit = function () {
            let editButton = this.bundleContainer.querySelector('.edit'),
                deleteButton = this.bundleContainer.querySelector('.delete'),
                rightButtons = this.bundleContainer.querySelector('.rightButtons'),
                nameInput = this.bundleContainer.querySelector('.name'),
                valueInput = this.bundleContainer.querySelector('.value');

            if (this.blankMode) {
                let newBundle = this.bundleContainer.querySelector('.newBundle');
                deleteButton.style.visibility = 'visible';
                newBundle.style.display = 'flex';
            }

            editButton.style.display = 'inline-block';
            deleteButton.style.display = 'none';
            rightButtons.style.display = 'none';
            nameInput.disabled = true;
            valueInput.disabled = true;
            nameInput.placeholder = '';
            valueInput.placeholder = '';
            nameInput.value = this.data.name;
            valueInput.value = this.data.value;
            this.bundleContainer.classList.remove('in-edit');
        };

        BundleEditor.prototype.save = function () {
            let saveLabel = document.getElementById('save'),
                nameInput = this.bundleContainer.querySelector('.name'),
                valueInput = this.bundleContainer.querySelector('.value'),
                itmIndex = tagbundle.findIndex((function (itm) {
                    return itm.name === this.data.name && itm.value === this.data.value;
                }).bind(this));
            if (!nameInput.value.trim().length || !valueInput.value.trim().length) {
                fT.dialog('You must provide a name and tags.');
                return;
            }

            saveLabel.style.visibility = 'visible';
            saveLabel.innerText = 'Saving…';
            if (itmIndex > -1) {
                this.data = {
                    name: nameInput.value,
                    value: valueInput.value
                };
                tagbundle[itmIndex] = this.data;
            } else {
                tagbundle.push({
                    name: nameInput.value,
                    value: valueInput.value
                });
            }
            tagbundle.sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });
            fT.setPrefs({tagbundle: tagbundle}).then((function () {
                this.closeEdit();
                saveLabel.innerText = 'Saved';
                setTimeout(() => saveLabel.style.visibility = 'hidden', 3000);
                startup();
            }).bind(this));
        };

        BundleEditor.prototype.delete = function () {
            let saveLabel = document.getElementById('save'),
                nameInput = this.bundleContainer.querySelector('.name'),
                itmIndex = tagbundle.findIndex((function (itm) {
                    return itm.name === this.data.name && itm.value === this.data.value;
                }).bind(this));
            if (itmIndex > -1) {
                fT.dialog('Do you really want to delete the bundle ' + nameInput.value + '?', [
                    {
                        caption: 'Yes',
                        value: true
                    },
                    {
                        caption: 'No',
                        value: false,
                        default: true
                    }
                ]).then((function (response) {
                    if (response === true) {
                        tagbundle.splice(itmIndex, 1);
                        fT.setPrefs({tagbundle: tagbundle}).then((function () {
                            this.bundleContainer.parentElement.removeChild(this.bundleContainer);
                            saveLabel.style.visibility = 'visible';
                            saveLabel.innerText = 'Deleted';
                            setTimeout(() => saveLabel.style.visibility = 'hidden', 3000);
                        }).bind(this));
                    }
                    this.closeEdit();
                }).bind(this));
            }
        };

        BundleEditor.prototype.destroy = function() {
            this.bundleContainer.parentElement.removeChild(this.bundleContainer);
            this.data = null;
            this.bundleContainer = null;
        };

        return BundleEditor;
    }());

    function startup() {
        let formDiv = document.getElementById('form');
        bundleArray.forEach(function (el) {
            if (el instanceof BundleEditor) {
                el.destroy();
                el = null;
            }
        });
        bundleArray = [];
        bundleArray.push(new BundleEditor(formDiv));
        fT.getPrefs('tagbundle').then(function (response) {
            tagbundle = response.tagbundle || [];
            if (tagbundle.length) {
                tagbundle.forEach((itm) => bundleArray.push(new BundleEditor(formDiv, itm)));
            }
        });
    }

    startup();
}());
