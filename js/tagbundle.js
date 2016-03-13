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
            let form  = document.createElement('form'),
                leftDiv = document.createElement('div'),
                middleDiv = document.createElement('div'),
                rightDiv = document.createElement('div'),
                editButton = document.createElement('button'),
                deleteButton = document.createElement('button'),
                cancelButton = document.createElement('button'),
                confirmButton = document.createElement('button'),
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

            editButton.type = 'button';
            deleteButton.type = 'button';
            cancelButton.type = 'button';
            confirmButton.type = 'button';

            editButton.style.display = 'inline-block';
            deleteButton.style.display = 'none';
            cancelButton.style.display = 'inline-block';
            confirmButton.style.display = 'inline-block';
            rightDiv.style.display = 'none';

            nameInput.value = this.data.name;
            valueInput.value = this.data.value;
            nameInput.disabled = true;
            valueInput.disabled = true;
            nameInput.maxlength = 20;

            leftDiv.classList.add('leftDiv');
            rightDiv.classList.add('rightDiv');
            middleDiv.classList.add('middleDiv');

            editButton.classList.add('edit');
            deleteButton.classList.add('delete');
            cancelButton.classList.add('cancel');
            confirmButton.classList.add('confirm');
            nameInput.classList.add('nameInput');
            valueInput.classList.add('valueInput');

            editButton.name = 'edit';
            deleteButton.name = 'delete';
            cancelButton.name = 'cancel';
            confirmButton.name = 'confirm';
            nameInput.name = 'nameInput';
            valueInput.name = 'valueInput';

            leftDiv.appendChild(editButton);
            leftDiv.appendChild(deleteButton);
            rightDiv.appendChild(cancelButton);
            rightDiv.appendChild(confirmButton);
            middleDiv.appendChild(nameInput);
            middleDiv.appendChild(valueInput);
            form.appendChild(leftDiv);
            form.appendChild(middleDiv);
            form.appendChild(rightDiv);
            this.bundleContainer.appendChild(form);

            if (this.blankMode) {
                let newBundle = document.createElement('button');
                newBundle.classList.add('newBundle');
                newBundle.innerText = '\uf055';
                newBundle.type = 'button';
                newBundle.name = 'newBundle';
                newBundle.addEventListener('click', this.openEdit.bind(this), false);
                editButton.style.display = 'none';
                this.bundleContainer.classList.add('blank');
                form.appendChild(newBundle);
            }

            parentEl.appendChild(this.bundleContainer);

            return this;
        }

        BundleEditor.prototype.openEdit = function () {
            let form = this.bundleContainer.getElementsByTagName('form')[0],
                editButton = form.elements.edit,
                deleteButton = form.elements.delete,
                rightDiv = this.bundleContainer.getElementsByClassName('rightDiv')[0],
                nameInput = form.elements.nameInput,
                valueInput = form.elements.valueInput;

            if (this.blankMode) {
                let newBundle = form.elements.newBundle;
                deleteButton.style.visibility = 'hidden';
                newBundle.style.display = 'none';
            }

            editButton.style.display = 'none';
            deleteButton.style.display = 'inline-block';
            rightDiv.style.display = 'flex';
            nameInput.disabled = false;
            valueInput.disabled = false;
            nameInput.placeholder = 'Enter a name for this bundle';
            valueInput.placeholder = 'Enter a comma-separated list of tags';
            this.bundleContainer.classList.add('in-edit');
            nameInput.focus();
        };

        BundleEditor.prototype.closeEdit = function () {
            let form = this.bundleContainer.getElementsByTagName('form')[0],
                editButton = form.elements.edit,
                deleteButton = form.elements.delete,
                rightDiv = this.bundleContainer.getElementsByClassName('rightDiv')[0],
                nameInput = form.elements.nameInput,
                valueInput = form.elements.valueInput;

            if (this.blankMode) {
                let newBundle = form.elements.newBundle;
                deleteButton.style.visibility = 'visible';
                newBundle.style.display = 'flex';
            }

            editButton.style.display = 'inline-block';
            deleteButton.style.display = 'none';
            rightDiv.style.display = 'none';
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
                form = this.bundleContainer.getElementsByTagName('form')[0],
                nameInput = form.elements.nameInput,
                valueInput = form.elements.valueInput,
                itmIndex = tagbundle.findIndex((function (itm) {
                    return itm.name === this.data.name && itm.value === this.data.value;
                }).bind(this));
            if (!nameInput.value.trim().length || !valueInput.value.trim().length) {
                fT.dialog('You must provide a name and tags.');
                return;
            }

            saveLabel.innerText = 'Saving…';
            saveLabel.style.visibility = 'visible';
            if (itmIndex > -1) {
                this.data = {
                    name: nameInput.value.trim(),
                    value: valueInput.value.trim()
                };
                tagbundle[itmIndex] = this.data;
            } else {
                tagbundle.push({
                    name: nameInput.value.trim(),
                    value: valueInput.value.trim()
                });
            }
            tagbundle.sort(function (a, b) {
                if (a.name.toLowerCase() > b.name.toLowerCase()) {
                    return 1;
                }
                if (a.name.toLowerCase() < b.name.toLowerCase()) {
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
                form = this.bundleContainer.getElementsByTagName('form')[0],
                nameInput = form.elements.nameInput,
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
        let middleDiv = document.getElementById('content');
        bundleArray.forEach(function (el) {
            if (el instanceof BundleEditor) {
                el.destroy();
                el = null;
            }
        });
        bundleArray = [];
        bundleArray.push(new BundleEditor(middleDiv));
        fT.getPrefs('tagbundle').then(function (response) {
            tagbundle = response.tagbundle || [];
            if (tagbundle.length) {
                tagbundle.forEach((itm) => bundleArray.push(new BundleEditor(middleDiv, itm)));
            }
        });
    }

    startup();
}());
