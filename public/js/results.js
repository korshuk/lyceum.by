function ready(fn) {
    if (document.readyState != 'loading'){
        fn();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        document.attachEvent('onreadystatechange', function() {
            if (document.readyState != 'loading')
                fn();
        });
    }
}
/*!
 * =============================================================
 * dropify v0.2.1 - Override your input files with style.
 * https://github.com/JeremyFagis/dropify
 *
 * (c) 2016 - Jeremy FAGIS <jeremy@fagis.fr> (http://fagis.fr)
 * =============================================================
 */
ready(function() {
    var pluginName = "dropify";

    /**
     * Dropify plugin
     *
     * @param {Object} element
     * @param {Array} options
     */
    function Dropify(element, options) {
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            return;
        }

        var defaults = {
            defaultFile: '',
            maxFileSize: 0,
            minWidth: 0,
            maxWidth: 0,
            minHeight: 0,
            maxHeight: 0,
            showRemove: true,
            showLoader: true,
            showErrors: true,
            errorTimeout: 3000,
            errorsPosition: 'overlay',
            imgFileExtensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp'],
            maxFileSizePreview: "20M",
            allowedFormats: ['portrait', 'square', 'landscape'],
            allowedFileExtensions: ['*'],
            messages: {
                'default': 'Кликните тут или перетащите сюда файл',
                'replace': 'Чтобы заменит картинку, кликните тут или перетащите сюда файл',
                'remove':  'Удалить',
                'error':   'Что-то пошло не так)'
            },
            error: {
                'fileSize': 'Слишком большой файл ({{ value }} - максимум).',
                'fileExtension': 'Неподходящий формат файла. Нам подходят только картинки форамта {{ value }}.',
                'minWidth': 'The image width is too small ({{ value }}}px min).',
                'maxWidth': 'The image width is too big ({{ value }}}px max).',
                'minHeight': 'The image height is too small ({{ value }}}px min).',
                'maxHeight': 'The image height is too big ({{ value }}px max).',
                'imageFormat': 'The image format is not allowed ({{ value }} only).'
            },
            tpl: {
                wrap:            '<div class="dropify-wrapper"></div>',
                loader:          '<div class="dropify-loader"></div>',
                message:         '<div class="dropify-message"><span class="file-icon" /> <p>{{ default }}</p></div>',
                preview:         '<div class="dropify-preview"><span class="dropify-render"></span><div class="dropify-infos"><div class="dropify-infos-inner"><p class="dropify-infos-message">{{ replace }}</p></div></div></div>',
                filename:        '<p class="dropify-filename"><span class="file-icon"></span> <span class="dropify-filename-inner"></span></p>',
                clearButton:     '<button type="button" class="dropify-clear">{{ remove }}</button>',
                errorLine:       '<p class="dropify-error">{{ error }}</p>',
                errorsContainer: '<div class="dropify-errors-container"><ul></ul></div>'
            }
        };

        this.element            = element;
        this.input              = $(this.element);
        this.wrapper            = null;
        this.preview            = null;
        this.filenameWrapper    = null;
        this.settings           = $.extend(true, defaults, options, this.input.data());
        this.errorsEvent        = $.Event('dropify.errors');
        this.isDisabled         = false;
        this.isInit             = false;
        this.file               = {
            object: null,
            name: null,
            size: null,
            width: null,
            height: null,
            type: null
        };

        if (!Array.isArray(this.settings.allowedFormats)) {
            this.settings.allowedFormats = this.settings.allowedFormats.split(' ');
        }

        if (!Array.isArray(this.settings.allowedFileExtensions)) {
            this.settings.allowedFileExtensions = this.settings.allowedFileExtensions.split(' ');
        }

        this.onChange     = this.onChange.bind(this);
        this.clearElement = this.clearElement.bind(this);
        this.onFileReady  = this.onFileReady.bind(this);

        this.translateMessages();
        this.createElements();
        this.setContainerSize();

        this.errorsEvent.errors = [];

        this.input.on('change', this.onChange);
    }

    /**
     * On change event
     */
    Dropify.prototype.onChange = function()
    {
        this.resetPreview();
        this.readFile(this.element);
    };

    /**
     * Create dom elements
     */
    Dropify.prototype.createElements = function()
    {
        this.isInit = true;
        this.input.wrap($(this.settings.tpl.wrap));
        this.wrapper = this.input.parent();

        var messageWrapper = $(this.settings.tpl.message).insertBefore(this.input);
        $(this.settings.tpl.errorLine).appendTo(messageWrapper);

        if (this.isTouchDevice() === true) {
            this.wrapper.addClass('touch-fallback');
        }

        if (this.input.attr('disabled')) {
            this.isDisabled = true;
            this.wrapper.addClass('disabled');
        }

        if (this.settings.showLoader === true) {
            this.loader = $(this.settings.tpl.loader);
            this.loader.insertBefore(this.input);
        }

        this.preview = $(this.settings.tpl.preview);
        this.preview.insertAfter(this.input);

        if (this.isDisabled === false && this.settings.showRemove === true) {
            this.clearButton = $(this.settings.tpl.clearButton);
            this.clearButton.insertAfter(this.input);
            this.clearButton.on('click', this.clearElement);
        }

        this.filenameWrapper = $(this.settings.tpl.filename);
        this.filenameWrapper.prependTo(this.preview.find('.dropify-infos-inner'));

        if (this.settings.showErrors === true) {
            this.errorsContainer = $(this.settings.tpl.errorsContainer);

            if (this.settings.errorsPosition === 'outside') {
                this.errorsContainer.insertAfter(this.wrapper);
            } else {
                this.errorsContainer.insertBefore(this.input);
            }
        }

        var defaultFile = this.settings.defaultFile || '';

        if (defaultFile.trim() !== '') {
            this.file.name = this.cleanFilename(defaultFile);
            this.setPreview(this.isImage(), defaultFile);
        }
    };

    /**
     * Read the file using FileReader
     *
     * @param  {Object} input
     */
    Dropify.prototype.readFile = function(input)
    {
        if (input.files && input.files[0]) {
            var reader         = new FileReader();
            var image          = new Image();
            var file           = input.files[0];
            var srcBase64      = null;
            var _this          = this;
            var eventFileReady = $.Event("dropify.fileReady");

            this.clearErrors();
            this.showLoader();
            this.setFileInformations(file);
            this.errorsEvent.errors = [];
            this.checkFileSize();
            this.isFileExtensionAllowed();

            if (this.isImage() && this.file.size < this.sizeToByte(this.settings.maxFileSizePreview)) {
                this.input.on('dropify.fileReady', this.onFileReady);
                reader.readAsDataURL(file);
                reader.onload = function(_file) {
                    srcBase64 = _file.target.result;
                    image.src = _file.target.result;
                    image.onload = function() {
                        _this.setFileDimensions(this.width, this.height);
                        _this.validateImage();
                        _this.input.trigger(eventFileReady, [true, srcBase64]);
                    };

                }.bind(this);
            } else {
                this.onFileReady(false);
            }
        }
    };

    /**
     * On file ready to show
     *
     * @param  {Event} event
     * @param  {Bool} previewable
     * @param  {String} src
     */
    Dropify.prototype.onFileReady = function(event, previewable, src)
    {
        this.input.off('dropify.fileReady', this.onFileReady);

        if (this.errorsEvent.errors.length === 0) {
            this.setPreview(previewable, src);
        } else {
            this.input.trigger(this.errorsEvent, [this]);
            for (var i = this.errorsEvent.errors.length - 1; i >= 0; i--) {
                var errorNamespace = this.errorsEvent.errors[i].namespace;
                var errorKey = errorNamespace.split('.').pop();
                this.showError(errorKey);
            }

            if (typeof this.errorsContainer !== "undefined") {
                this.errorsContainer.addClass('visible');

                var errorsContainer = this.errorsContainer;
                setTimeout(function(){ errorsContainer.removeClass('visible'); }, this.settings.errorTimeout);
            }

            this.wrapper.addClass('has-error');
            this.resetPreview();
            this.clearElement();
        }
    };

    /**
     * Set file informations
     *
     * @param {File} file
     */
    Dropify.prototype.setFileInformations = function(file)
    {
        this.file.object = file;
        this.file.name   = file.name;
        this.file.size   = file.size;
        this.file.type   = file.type;
        this.file.width  = null;
        this.file.height = null;
    };

    /**
     * Set file dimensions
     *
     * @param {Int} width
     * @param {Int} height
     */
    Dropify.prototype.setFileDimensions = function(width, height)
    {
        this.file.width  = width;
        this.file.height = height;
    };

    /**
     * Set the preview and animate it
     *
     * @param {String} src
     */
    Dropify.prototype.setPreview = function(previewable, src)
    {
        this.wrapper.removeClass('has-error').addClass('has-preview');
        this.filenameWrapper.children('.dropify-filename-inner').html(this.file.name);
        var render = this.preview.children('.dropify-render');

        this.hideLoader();

        if (previewable === true) {
            var imgTag = $('<img />').attr('src', src);

            if (this.settings.height) {
                imgTag.css("max-height", this.settings.height);
            }

            imgTag.appendTo(render);
        } else {
            $('<i />').attr('class', 'dropify-font-file').appendTo(render);
            $('<span class="dropify-extension" />').html(this.getFileType()).appendTo(render);
        }
        this.preview.fadeIn();
    };

    /**
     * Reset the preview
     */
    Dropify.prototype.resetPreview = function()
    {
        this.wrapper.removeClass('has-preview');
        var render = this.preview.children('.dropify-render');
        render.find('.dropify-extension').remove();
        render.find('i').remove();
        render.find('img').remove();
        this.preview.hide();
        this.hideLoader();
    };

    /**
     * Clean the src and get the filename
     *
     * @param  {String} src
     *
     * @return {String} filename
     */
    Dropify.prototype.cleanFilename = function(src)
    {
        var filename = src.split('\\').pop();
        if (filename == src) {
            filename = src.split('/').pop();
        }

        return src !== "" ? filename : '';
    };

    /**
     * Clear the element, events are available
     */
    Dropify.prototype.clearElement = function()
    {
        if (this.errorsEvent.errors.length === 0) {
            var eventBefore = $.Event("dropify.beforeClear");
            this.input.trigger(eventBefore, [this]);

            if (eventBefore.result !== false) {
                this.resetFile();
                this.input.val('');
                this.resetPreview();

                this.input.trigger($.Event("dropify.afterClear"), [this]);
            }
        } else {
            this.resetFile();
            this.input.val('');
            this.resetPreview();
        }
    };

    /**
     * Reset file informations
     */
    Dropify.prototype.resetFile = function()
    {
        this.file.object = null;
        this.file.name   = null;
        this.file.size   = null;
        this.file.type   = null;
        this.file.width  = null;
        this.file.height = null;
    };

    /**
     * Set the container height
     */
    Dropify.prototype.setContainerSize = function()
    {
        if (this.settings.height) {
            this.wrapper.height(this.settings.height);
        }
    };

    /**
     * Test if it's touch screen
     *
     * @return {Boolean}
     */
    Dropify.prototype.isTouchDevice = function()
    {
        return (('ontouchstart' in window) ||
        (navigator.MaxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
    };

    /**
     * Get the file type.
     *
     * @return {String}
     */
    Dropify.prototype.getFileType = function()
    {
        return this.file.name.split('.').pop().toLowerCase();
    };

    /**
     * Test if the file is an image
     *
     * @return {Boolean}
     */
    Dropify.prototype.isImage = function()
    {
        if (this.settings.imgFileExtensions.indexOf(this.getFileType()) != "-1") {
            return true;
        }

        return false;
    };

    /**
     * Test if the file extension is allowed
     *
     * @return {Boolean}
     */
    Dropify.prototype.isFileExtensionAllowed = function () {

        if (this.settings.allowedFileExtensions.indexOf('*') != "-1" ||
            this.settings.allowedFileExtensions.indexOf(this.getFileType()) != "-1") {
            return true;
        }
        this.pushError("fileExtension");

        return false;
    };

    /**
     * Translate messages if needed.
     */
    Dropify.prototype.translateMessages = function()
    {
        for (var name in this.settings.tpl) {
            for (var key in this.settings.messages) {
                this.settings.tpl[name] = this.settings.tpl[name].replace('{{ ' + key + ' }}', this.settings.messages[key]);
            }
        }
    };

    /**
     * Check the limit filesize.
     */
    Dropify.prototype.checkFileSize = function()
    {
        if (this.sizeToByte(this.settings.maxFileSize) !== 0 && this.file.size > this.sizeToByte(this.settings.maxFileSize)) {
            this.pushError("fileSize");
        }
    };

    /**
     * Convert filesize to byte.
     *
     * @return {Int} value
     */
    Dropify.prototype.sizeToByte = function(size)
    {
        var value = 0;

        if (size !== 0) {
            var unit  = size.slice(-1).toUpperCase(),
                kb    = 1024,
                mb    = kb * 1024,
                gb    = mb * 1024;

            if (unit === 'K') {
                value = parseFloat(size) * kb;
            } else if (unit === 'M') {
                value = parseFloat(size) * mb;
            } else if (unit === 'G') {
                value = parseFloat(size) * gb;
            }
        }

        return value;
    };

    /**
     * Validate image dimensions and format
     */
    Dropify.prototype.validateImage = function()
    {
        if (this.settings.minWidth !== 0 && this.settings.minWidth >= this.file.width) {
            this.pushError("minWidth");
        }

        if (this.settings.maxWidth !== 0 && this.settings.maxWidth <= this.file.width) {
            this.pushError("maxWidth");
        }

        if (this.settings.minHeight !== 0 && this.settings.minHeight >= this.file.height) {
            this.pushError("minHeight");
        }

        if (this.settings.maxHeight !== 0 && this.settings.maxHeight <= this.file.height) {
            this.pushError("maxHeight");
        }

        if (this.settings.allowedFormats.indexOf(this.getImageFormat()) == "-1") {
            this.pushError("imageFormat");
        }
    };

    /**
     * Get image format.
     *
     * @return {String}
     */
    Dropify.prototype.getImageFormat = function()
    {
        if (this.file.width == this.file.height) {
            return "square";
        }

        if (this.file.width < this.file.height) {
            return "portrait";
        }

        if (this.file.width > this.file.height) {
            return "landscape";
        }
    };

    /**
     * Push error
     *
     * @param {String} errorKey
     */
    Dropify.prototype.pushError = function(errorKey) {
        var e = $.Event("dropify.error." + errorKey);
        this.errorsEvent.errors.push(e);
        this.input.trigger(e, [this]);
    };

    /**
     * Clear errors
     */
    Dropify.prototype.clearErrors = function()
    {
        if (typeof this.errorsContainer !== "undefined") {
            this.errorsContainer.children('ul').html('');
        }
    };

    /**
     * Show error in DOM
     *
     * @param  {String} errorKey
     */
    Dropify.prototype.showError = function(errorKey)
    {
        if (typeof this.errorsContainer !== "undefined") {
            this.errorsContainer.children('ul').append('<li>' + this.getError(errorKey) + '</li>');
        }
    };

    /**
     * Get error message
     *
     * @return  {String} message
     */
    Dropify.prototype.getError = function(errorKey)
    {
        var error = this.settings.error[errorKey],
            value = '';

        if (errorKey === 'fileSize') {
            value = this.settings.maxFileSize;
        } else if (errorKey === 'minWidth') {
            value = this.settings.minWidth;
        } else if (errorKey === 'maxWidth') {
            value = this.settings.maxWidth;
        } else if (errorKey === 'minHeight') {
            value = this.settings.minHeight;
        } else if (errorKey === 'maxHeight') {
            value = this.settings.maxHeight;
        } else if (errorKey === 'imageFormat') {
            value = this.settings.allowedFormats.join(', ');
        } else if (errorKey === 'fileExtension') {
            value = this.settings.allowedFileExtensions.join(', ');
        }

        if (value !== '') {
            return error.replace('{{ value }}', value);
        }

        return error;
    };

    /**
     * Show the loader
     */
    Dropify.prototype.showLoader = function()
    {
        if (typeof this.loader !== "undefined") {
            this.loader.show();
        }
    };

    /**
     * Hide the loader
     */
    Dropify.prototype.hideLoader = function()
    {
        if (typeof this.loader !== "undefined") {
            this.loader.hide();
        }
    };

    /**
     * Destroy dropify
     */
    Dropify.prototype.destroy = function()
    {
        this.input.siblings().remove();
        this.input.unwrap();
        this.isInit = false;
    };

    /**
     * Init dropify
     */
    Dropify.prototype.init = function()
    {
        this.createElements();
    };

    /**
     * Test if element is init
     */
    Dropify.prototype.isDropified = function()
    {
        return this.isInit;
    };

    $.fn[pluginName] = function(options) {
        this.each(function() {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new Dropify(this, options));
            }
        });

        return this;
    };

    return Dropify;
});
var componentHandler = {

    /**
     * Searches existing DOM for elements of our component type and upgrades them
     * if they have not already been upgraded.
     *
     * @param {string=} optJsClass the programatic name of the element class we
     * need to create a new instance of.
     * @param {string=} optCssClass the name of the CSS class elements of this
     * type will have.
     */
    upgradeDom: function(optJsClass, optCssClass) {}, // eslint-disable-line
    /**
     * Upgrades a specific element rather than all in the DOM.
     *
     * @param {!Element} element The element we wish to upgrade.
     * @param {string=} optJsClass Optional name of the class we want to upgrade
     * the element to.
     */
    upgradeElement: function(element, optJsClass) {}, // eslint-disable-line
    /**
     * Upgrades a specific list of elements rather than all in the DOM.
     *
     * @param {!Element|!Array<!Element>|!NodeList|!HTMLCollection} elements
     * The elements we wish to upgrade.
     */
    upgradeElements: function(elements) {}, // eslint-disable-line
    /**
     * Upgrades all registered components found in the current DOM. This is
     * automatically called on window load.
     */
    upgradeAllRegistered: function() {},
    /**
     * Allows user to be alerted to any upgrades that are performed for a given
     * component type
     *
     * @param {string} jsClass The class name of the MDL component we wish
     * to hook into for any upgrades performed.
     * @param {function(!HTMLElement)} callback The function to call upon an
     * upgrade. This function should expect 1 parameter - the HTMLElement which
     * got upgraded.
     */
    registerUpgradedCallback: function(jsClass, callback) {}, // eslint-disable-line
    /**
     * Registers a class for future use and attempts to upgrade existing DOM.
     *
     * @param {componentHandler.ComponentConfigPublic} config the registration configuration
     */
    register: function(config) {}, // eslint-disable-line
    /**
     * Downgrade either a given node, an array of nodes, or a NodeList.
     *
     * @param {!Node|!Array<!Node>|!NodeList} nodes The list of nodes.
     */
    downgradeElements: function(nodes) {} // eslint-disable-line
};

componentHandler = (function() {
    'use strict';

    /** @type {!Array<componentHandler.ComponentConfig>} */
    var registeredComponents_ = [];

    /** @type {!Array<componentHandler.Component>} */
    var createdComponents_ = [];

    var componentConfigProperty_ = 'mdlComponentConfigInternal_';

    /**
     * Searches registered components for a class we are interested in using.
     * Optionally replaces a match with passed object if specified.
     *
     * @param {string} name The name of a class we want to use.
     * @param {componentHandler.ComponentConfig=} optReplace Optional object to replace match with.
     * @return {!Object|boolean} Registered components.
     * @private
     */
    function findRegisteredClass_(name, optReplace) {
        for (var i = 0; i < registeredComponents_.length; i++) {
            if (registeredComponents_[i].className === name) {
                if (typeof optReplace !== 'undefined') {
                    registeredComponents_[i] = optReplace;
                }
                return registeredComponents_[i];
            }
        }
        return false;
    }

    /**
     * Returns an array of the classNames of the upgraded classes on the element.
     *
     * @param {!Element} element The element to fetch data from.
     * @return {!Array<string>} Array of classNames.
     * @private
     */
    function getUpgradedListOfElement_(element) {
        var dataUpgraded = element.getAttribute('data-upgraded');
        // Use `['']` as default value to conform the `,name,name...` style.
        return dataUpgraded === null ? [''] : dataUpgraded.split(',');
    }

    /**
     * Returns true if the given element has already been upgraded for the given
     * class.
     *
     * @param {!Element} element The element we want to check.
     * @param {string} jsClass The class to check for.
     * @return {boolean} Whether the element is upgraded.
     * @private
     */
    function isElementUpgraded_(element, jsClass) {
        var upgradedList = getUpgradedListOfElement_(element);
        return upgradedList.indexOf(jsClass) !== -1;
    }

    /**
     * Searches existing DOM for elements of our component type and upgrades them
     * if they have not already been upgraded.
     *
     * @param {string=} optJsClass the programatic name of the element class we
     * need to create a new instance of.
     * @param {string=} optCssClass the name of the CSS class elements of this
     * type will have.
     */
    function upgradeDomInternal(optJsClass, optCssClass) {
        if (typeof optJsClass === 'undefined' &&
            typeof optCssClass === 'undefined') {
            for (var i = 0; i < registeredComponents_.length; i++) {
                upgradeDomInternal(registeredComponents_[i].className,
                    registeredComponents_[i].cssClass);
            }
        } else {
            var jsClass = /** @type {string} */ (optJsClass);
            if (typeof optCssClass === 'undefined') {
                var registeredClass = findRegisteredClass_(jsClass);
                if (registeredClass) {
                    optCssClass = registeredClass.cssClass;
                }
            }

            var elements = document.querySelectorAll('.' + optCssClass);
            for (var n = 0; n < elements.length; n++) {
                upgradeElementInternal(elements[n], jsClass);
            }
        }
    }

    /**
     * Upgrades a specific element rather than all in the DOM.
     *
     * @param {!Element} element The element we wish to upgrade.
     * @param {string=} optJsClass Optional name of the class we want to upgrade
     * the element to.
     */
    function upgradeElementInternal(element, optJsClass) {
        // Verify argument type.
        if (!(typeof element === 'object' && element instanceof Element)) {
            throw new Error('Invalid argument provided to upgrade MDL element.');
        }
        var upgradedList = getUpgradedListOfElement_(element);
        var classesToUpgrade = [];
        // If jsClass is not provided scan the registered components to find the
        // ones matching the element's CSS classList.
        if (!optJsClass) {
            var classList = element.classList;
            registeredComponents_.forEach(function(component) {
                // Match CSS & Not to be upgraded & Not upgraded.
                if (classList.contains(component.cssClass) &&
                    classesToUpgrade.indexOf(component) === -1 &&
                    !isElementUpgraded_(element, component.className)) {
                    classesToUpgrade.push(component);
                }
            });
        } else if (!isElementUpgraded_(element, optJsClass)) {
            classesToUpgrade.push(findRegisteredClass_(optJsClass));
        }

        // Upgrade the element for each classes.
        for (var i = 0, n = classesToUpgrade.length, registeredClass; i < n; i++) {
            registeredClass = classesToUpgrade[i];
            if (registeredClass) {
                // Mark element as upgraded.
                upgradedList.push(registeredClass.className);
                element.setAttribute('data-upgraded', upgradedList.join(','));
                var instance = new registeredClass.classConstructor(element); // eslint-disable-line
                instance[componentConfigProperty_] = registeredClass;
                createdComponents_.push(instance);
                // Call any callbacks the user has registered with this component type.
                for (var j = 0, m = registeredClass.callbacks.length; j < m; j++) {
                    registeredClass.callbacks[j](element);
                }

                if (registeredClass.widget) {
                    // Assign per element instance for control over API
                    element[registeredClass.className] = instance;
                }
            } else {
                throw new Error(
                    'Unable to find a registered component for the given class.');
            }

            var ev = document.createEvent('Events');
            ev.initEvent('mdl-componentupgraded', true, true);
            element.dispatchEvent(ev);
        }
    }

    /**
     * Upgrades a specific list of elements rather than all in the DOM.
     *
     * @param {!Element|!Array<!Element>|!NodeList|!HTMLCollection} elements
     * The elements we wish to upgrade.
     */
    function upgradeElementsInternal(elements) {
        if (!Array.isArray(elements)) {
            if (typeof elements.item === 'function') {
                elements = Array.prototype.slice.call(/** @type {Array} */ (elements));
            } else {
                elements = [elements];
            }
        }
        for (var i = 0, n = elements.length, element; i < n; i++) {
            element = elements[i];
            if (element instanceof HTMLElement) {
                upgradeElementInternal(element);
                if (element.children.length > 0) {
                    upgradeElementsInternal(element.children);
                }
            }
        }
    }

    /**
     * Registers a class for future use and attempts to upgrade existing DOM.
     *
     * @param {componentHandler.ComponentConfigPublic} config The configuration.
     */
    function registerInternal(config) {
        // In order to support both Closure-compiled and uncompiled code accessing
        // this method, we need to allow for both the dot and array syntax for
        // property access. You'll therefore see the `foo.bar || foo['bar']`
        // pattern repeated across this method.
        var widgetMissing = (typeof config.widget === 'undefined' &&
        typeof config['widget'] === 'undefined');
        var widget = true;

        if (!widgetMissing) {
            widget = config.widget || config['widget'];
        }

        var newConfig = /** @type {componentHandler.ComponentConfig} */ ({
            classConstructor: config.constructor || config['constructor'],
            className: config.classAsString || config['classAsString'],
            cssClass: config.cssClass || config['cssClass'],
            widget: widget,
            callbacks: []
        });

        registeredComponents_.forEach(function(item) {
            if (item.cssClass === newConfig.cssClass) {
                throw new Error('The provided cssClass has already been registered: ' +
                    item.cssClass);
            }
            if (item.className === newConfig.className) {
                throw new Error('The provided className has already been registered');
            }
        });

        if (config.constructor.prototype
                .hasOwnProperty(componentConfigProperty_)) {
            throw new Error(
                'MDL component classes must not have ' + componentConfigProperty_ +
                ' defined as a property.');
        }

        var found = findRegisteredClass_(config.classAsString, newConfig);

        if (!found) {
            registeredComponents_.push(newConfig);
        }
    }

    /**
     * Allows user to be alerted to any upgrades that are performed for a given
     * component type
     *
     * @param {string} jsClass The class name of the MDL component we wish
     * to hook into for any upgrades performed.
     * @param {function(!HTMLElement)} callback The function to call upon an
     * upgrade. This function should expect 1 parameter - the HTMLElement which
     * got upgraded.
     */
    function registerUpgradedCallbackInternal(jsClass, callback) {
        var regClass = findRegisteredClass_(jsClass);
        if (regClass) {
            regClass.callbacks.push(callback);
        }
    }

    /**
     * Upgrades all registered components found in the current DOM. This is
     * automatically called on window load.
     */
    function upgradeAllRegisteredInternal() {
        for (var n = 0; n < registeredComponents_.length; n++) {
            upgradeDomInternal(registeredComponents_[n].className);
        }
    }

    /**
     * Check the component for the downgrade method.
     * Execute if found.
     * Remove component from createdComponents list.
     *
     * @param {?componentHandler.Component} component The component to downgrade.
     */
    function deconstructComponentInternal(component) {
        if (component) {
            var componentIndex = createdComponents_.indexOf(component);
            createdComponents_.splice(componentIndex, 1);

            var upgrades =
                component.element_.getAttribute('data-upgraded').split(',');
            var componentPlace =
                upgrades.indexOf(component[componentConfigProperty_].classAsString);
            upgrades.splice(componentPlace, 1);
            component.element_.setAttribute('data-upgraded', upgrades.join(','));

            var ev = document.createEvent('Events');
            ev.initEvent('mdl-componentdowngraded', true, true);
            component.element_.dispatchEvent(ev);
        }
    }

    /**
     * Downgrade either a given node, an array of nodes, or a NodeList.
     *
     * @param {!Node|!Array<!Node>|!NodeList} nodes The list of nodes.
     */
    function downgradeNodesInternal(nodes) {
        /**
         * Auxiliary function to downgrade a single node.
         * @param  {!Node} node the node to be downgraded
         */
        var downgradeNode = function(node) {
            createdComponents_.filter(function(item) {
                return item.element_ === node;
            }).forEach(deconstructComponentInternal);
        };
        if (nodes instanceof Array || nodes instanceof NodeList) {
            for (var n = 0; n < nodes.length; n++) {
                downgradeNode(nodes[n]);
            }
        } else if (nodes instanceof Node) {
            downgradeNode(nodes);
        } else {
            throw new Error('Invalid argument provided to downgrade MDL nodes.');
        }
    }

    // Now return the functions that should be made public with their publicly
    // facing names...
    return {
        upgradeDom: upgradeDomInternal,
        upgradeElement: upgradeElementInternal,
        upgradeElements: upgradeElementsInternal,
        upgradeAllRegistered: upgradeAllRegisteredInternal,
        registerUpgradedCallback: registerUpgradedCallbackInternal,
        register: registerInternal,
        downgradeElements: downgradeNodesInternal
    };
})();

/**
 * Describes the type of a registered component type managed by
 * componentHandler. Provided for benefit of the Closure compiler.
 *
 * @typedef {{
 *   constructor: Function,
 *   classAsString: string,
 *   cssClass: string,
 *   widget: (string|boolean|undefined)
 * }}
 */
componentHandler.ComponentConfigPublic; // eslint-disable-line

/**
 * Describes the type of a registered component type managed by
 * componentHandler. Provided for benefit of the Closure compiler.
 *
 * @typedef {{
 *   constructor: !Function,
 *   className: string,
 *   cssClass: string,
 *   widget: (string|boolean),
 *   callbacks: !Array<function(!HTMLElement)>
 * }}
 */
componentHandler.ComponentConfig; // eslint-disable-line

/**
 * Created component (i.e., upgraded element) type as managed by
 * componentHandler. Provided for benefit of the Closure compiler.
 *
 * @typedef {{
 *   element_: !HTMLElement,
 *   className: string,
 *   classAsString: string,
 *   cssClass: string,
 *   widget: string
 * }}
 */
componentHandler.Component; // eslint-disable-line

// Export all symbols, for the benefit of Closure compiler.
// No effect on uncompiled code.
componentHandler['upgradeDom'] = componentHandler.upgradeDom;
componentHandler['upgradeElement'] = componentHandler.upgradeElement;
componentHandler['upgradeElements'] = componentHandler.upgradeElements;
componentHandler['upgradeAllRegistered'] =  componentHandler.upgradeAllRegistered;
componentHandler['registerUpgradedCallback'] =  componentHandler.registerUpgradedCallback;
componentHandler['register'] = componentHandler.register;
componentHandler['downgradeElements'] = componentHandler.downgradeElements;
window.componentHandler = componentHandler;
window['componentHandler'] = componentHandler;

ready(function() {
    'use strict';

    /**
     * Performs a "Cutting the mustard" test. If the browser supports the features
     * tested, adds a mdl-js class to the <html> element. It then upgrades all MDL
     * components requiring JavaScript.
     */
    if (
        'classList' in document.documentElement &&
        'querySelector' in document &&
        'addEventListener' in window &&
        'forEach' in Array.prototype) {
        document.documentElement.classList.add('mdl-js');
        componentHandler.upgradeAllRegistered();
    } else {
        /**
         * Dummy function to avoid JS errors.
         */
        componentHandler.upgradeElement = function() {};
        /**
         * Dummy function to avoid JS errors.
         */
        componentHandler.register = function() {};
    }
});

(function() {
    'use strict';

    /**
     * Class constructor for Button MDL component.
     * Implements MDL component design pattern defined at:
     * https://github.com/jasonmayes/mdl-component-design-pattern
     *
     * @param {HTMLElement} element The element that will be upgraded.
     */
    var MaterialButton = function MaterialButton(element) {
        this.element_ = element;

        // Initialize instance.
        this.init();
    };
    window['MaterialButton'] = MaterialButton;

    /**
     * Store constants in one place so they can be updated easily.
     *
     * @enum {string | number}
     * @private
     */
    MaterialButton.prototype.Constant_ = {
        // None for now.
    };

    /**
     * Store strings for class names defined by this component that are used in
     * JavaScript. This allows us to simply change it in one place should we
     * decide to modify at a later date.
     *
     * @enum {string}
     * @private
     */
    MaterialButton.prototype.CssClasses_ = {
        RIPPLE_EFFECT: 'mdl-js-ripple-effect',
        RIPPLE_CONTAINER: 'mdl-button__ripple-container',
        RIPPLE: 'mdl-ripple'
    };

    /**
     * Handle blur of element.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialButton.prototype.blurHandler_ = function(event) {
        if (event) {
            this.element_.blur();
        }
    };

    // Public methods.

    /**
     * Disable button.
     *
     * @public
     */
    MaterialButton.prototype.disable = function() {
        this.element_.disabled = true;
    };
    MaterialButton.prototype['disable'] = MaterialButton.prototype.disable;

    /**
     * Enable button.
     *
     * @public
     */
    MaterialButton.prototype.enable = function() {
        this.element_.disabled = false;
    };
    MaterialButton.prototype['enable'] = MaterialButton.prototype.enable;

    /**
     * Initialize element.
     */
    MaterialButton.prototype.init = function() {
        if (this.element_) {
            if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
                var rippleContainer = document.createElement('span');
                rippleContainer.classList.add(this.CssClasses_.RIPPLE_CONTAINER);
                this.rippleElement_ = document.createElement('span');
                this.rippleElement_.classList.add(this.CssClasses_.RIPPLE);
                rippleContainer.appendChild(this.rippleElement_);
                this.boundRippleBlurHandler = this.blurHandler_.bind(this);
                this.rippleElement_.addEventListener(
                    'mouseup', this.boundRippleBlurHandler);
                this.element_.appendChild(rippleContainer);
            }
            this.boundButtonBlurHandler = this.blurHandler_.bind(this);
            this.element_.addEventListener('mouseup', this.boundButtonBlurHandler);
            this.element_.addEventListener('mouseleave', this.boundButtonBlurHandler);
        }
    };

    // The component registers itself. It can assume componentHandler is available
    // in the global scope.
    componentHandler.register({
        constructor: MaterialButton,
        classAsString: 'MaterialButton',
        cssClass: 'mdl-js-button',
        widget: true
    });
})();

(function() {
    'use strict';

    /**
     * Class constructor for Tabs MDL component.
     * Implements MDL component design pattern defined at:
     * https://github.com/jasonmayes/mdl-component-design-pattern
     *
     * @constructor
     * @param {Element} element The element that will be upgraded.
     */
    var MaterialTabs = function MaterialTabs(element) {
        // Stores the HTML element.
        this.element_ = element;

        // Initialize instance.
        this.init();
    };
    window['MaterialTabs'] = MaterialTabs;

    /**
     * Store constants in one place so they can be updated easily.
     *
     * @enum {string}
     * @private
     */
    MaterialTabs.prototype.Constant_ = {
        // None at the moment.
    };

    /**
     * Store strings for class names defined by this component that are used in
     * JavaScript. This allows us to simply change it in one place should we
     * decide to modify at a later date.
     *
     * @enum {string}
     * @private
     */
    MaterialTabs.prototype.CssClasses_ = {
        TAB_CLASS: 'mdl-tabs__tab',
        PANEL_CLASS: 'mdl-tabs__panel',
        ACTIVE_CLASS: 'is-active',
        UPGRADED_CLASS: 'is-upgraded',

        MDL_JS_RIPPLE_EFFECT: 'mdl-js-ripple-effect',
        MDL_RIPPLE_CONTAINER: 'mdl-tabs__ripple-container',
        MDL_RIPPLE: 'mdl-ripple',
        MDL_JS_RIPPLE_EFFECT_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events'
    };

    /**
     * Handle clicks to a tabs component
     *
     * @private
     */
    MaterialTabs.prototype.initTabs_ = function() {
        if (this.element_.classList.contains(this.CssClasses_.MDL_JS_RIPPLE_EFFECT)) {
            this.element_.classList.add(
                this.CssClasses_.MDL_JS_RIPPLE_EFFECT_IGNORE_EVENTS);
        }

        // Select element tabs, document panels
        this.tabs_ = this.element_.querySelectorAll('.' + this.CssClasses_.TAB_CLASS);
        this.panels_ =
            this.element_.querySelectorAll('.' + this.CssClasses_.PANEL_CLASS);

        // Create new tabs for each tab element
        for (var i = 0; i < this.tabs_.length; i++) {
            new MaterialTab(this.tabs_[i], this);
        }

        this.element_.classList.add(this.CssClasses_.UPGRADED_CLASS);
    };

    /**
     * Reset tab state, dropping active classes
     *
     * @private
     */
    MaterialTabs.prototype.resetTabState_ = function() {
        for (var k = 0; k < this.tabs_.length; k++) {
            this.tabs_[k].classList.remove(this.CssClasses_.ACTIVE_CLASS);
        }
    };

    /**
     * Reset panel state, droping active classes
     *
     * @private
     */
    MaterialTabs.prototype.resetPanelState_ = function() {
        for (var j = 0; j < this.panels_.length; j++) {
            this.panels_[j].classList.remove(this.CssClasses_.ACTIVE_CLASS);
        }
    };

    /**
     * Initialize element.
     */
    MaterialTabs.prototype.init = function() {
        if (this.element_) {
            this.initTabs_();
        }
    };

    /**
     * Constructor for an individual tab.
     *
     * @constructor
     * @param {Element} tab The HTML element for the tab.
     * @param {MaterialTabs} ctx The MaterialTabs object that owns the tab.
     */
    function MaterialTab(tab, ctx) {
        if (tab) {
            if (ctx.element_.classList.contains(ctx.CssClasses_.MDL_JS_RIPPLE_EFFECT)) {
                var rippleContainer = document.createElement('span');
                rippleContainer.classList.add(ctx.CssClasses_.MDL_RIPPLE_CONTAINER);
                rippleContainer.classList.add(ctx.CssClasses_.MDL_JS_RIPPLE_EFFECT);
                var ripple = document.createElement('span');
                ripple.classList.add(ctx.CssClasses_.MDL_RIPPLE);
                rippleContainer.appendChild(ripple);
                tab.appendChild(rippleContainer);
            }

            tab.addEventListener('click', function(e) {
                if (tab.getAttribute('href').charAt(0) === '#') {
                    e.preventDefault();
                    var href = tab.getAttribute('href').split('#')[1];
                    var panel = ctx.element_.querySelector('#' + href);
                    ctx.resetTabState_();
                    ctx.resetPanelState_();
                    tab.classList.add(ctx.CssClasses_.ACTIVE_CLASS);
                    panel.classList.add(ctx.CssClasses_.ACTIVE_CLASS);
                }
            });

        }
    }

    // The component registers itself. It can assume componentHandler is available
    // in the global scope.
    componentHandler.register({
        constructor: MaterialTabs,
        classAsString: 'MaterialTabs',
        cssClass: 'mdl-js-tabs'
    });
})();

(function() {
    'use strict';

    /**
     * Class constructor for Spinner MDL component.
     * Implements MDL component design pattern defined at:
     * https://github.com/jasonmayes/mdl-component-design-pattern
     *
     * @param {HTMLElement} element The element that will be upgraded.
     * @constructor
     */
    var MaterialSpinner = function MaterialSpinner(element) {
        this.element_ = element;

        // Initialize instance.
        this.init();
    };
    window['MaterialSpinner'] = MaterialSpinner;

    /**
     * Store constants in one place so they can be updated easily.
     *
     * @enum {string | number}
     * @private
     */
    MaterialSpinner.prototype.Constant_ = {
        MDL_SPINNER_LAYER_COUNT: 4
    };

    /**
     * Store strings for class names defined by this component that are used in
     * JavaScript. This allows us to simply change it in one place should we
     * decide to modify at a later date.
     *
     * @enum {string}
     * @private
     */
    MaterialSpinner.prototype.CssClasses_ = {
        MDL_SPINNER_LAYER: 'mdl-spinner__layer',
        MDL_SPINNER_CIRCLE_CLIPPER: 'mdl-spinner__circle-clipper',
        MDL_SPINNER_CIRCLE: 'mdl-spinner__circle',
        MDL_SPINNER_GAP_PATCH: 'mdl-spinner__gap-patch',
        MDL_SPINNER_LEFT: 'mdl-spinner__left',
        MDL_SPINNER_RIGHT: 'mdl-spinner__right'
    };

    /**
     * Auxiliary method to create a spinner layer.
     *
     * @param {number} index Index of the layer to be created.
     * @public
     */
    MaterialSpinner.prototype.createLayer = function(index) {
        var layer = document.createElement('div');
        layer.classList.add(this.CssClasses_.MDL_SPINNER_LAYER);
        layer.classList.add(this.CssClasses_.MDL_SPINNER_LAYER + '-' + index);

        var leftClipper = document.createElement('div');
        leftClipper.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE_CLIPPER);
        leftClipper.classList.add(this.CssClasses_.MDL_SPINNER_LEFT);

        var gapPatch = document.createElement('div');
        gapPatch.classList.add(this.CssClasses_.MDL_SPINNER_GAP_PATCH);

        var rightClipper = document.createElement('div');
        rightClipper.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE_CLIPPER);
        rightClipper.classList.add(this.CssClasses_.MDL_SPINNER_RIGHT);

        var circleOwners = [leftClipper, gapPatch, rightClipper];

        for (var i = 0; i < circleOwners.length; i++) {
            var circle = document.createElement('div');
            circle.classList.add(this.CssClasses_.MDL_SPINNER_CIRCLE);
            circleOwners[i].appendChild(circle);
        }

        layer.appendChild(leftClipper);
        layer.appendChild(gapPatch);
        layer.appendChild(rightClipper);

        this.element_.appendChild(layer);
    };
    MaterialSpinner.prototype['createLayer'] =
        MaterialSpinner.prototype.createLayer;

    /**
     * Stops the spinner animation.
     * Public method for users who need to stop the spinner for any reason.
     *
     * @public
     */
    MaterialSpinner.prototype.stop = function() {
        this.element_.classList.remove('is-active');
    };
    MaterialSpinner.prototype['stop'] = MaterialSpinner.prototype.stop;

    /**
     * Starts the spinner animation.
     * Public method for users who need to manually start the spinner for any reason
     * (instead of just adding the 'is-active' class to their markup).
     *
     * @public
     */
    MaterialSpinner.prototype.start = function() {
        this.element_.classList.add('is-active');
    };
    MaterialSpinner.prototype['start'] = MaterialSpinner.prototype.start;

    /**
     * Initialize element.
     */
    MaterialSpinner.prototype.init = function() {
        if (this.element_) {
            for (var i = 1; i <= this.Constant_.MDL_SPINNER_LAYER_COUNT; i++) {
                this.createLayer(i);
            }

            this.element_.classList.add('is-upgraded');
        }
    };

    // The component registers itself. It can assume componentHandler is available
    // in the global scope.
    componentHandler.register({
        constructor: MaterialSpinner,
        classAsString: 'MaterialSpinner',
        cssClass: 'mdl-js-spinner',
        widget: true
    });
})();

(function() {
    'use strict';

    /**
     * Class constructor for Textfield MDL component.
     * Implements MDL component design pattern defined at:
     * https://github.com/jasonmayes/mdl-component-design-pattern
     *
     * @constructor
     * @param {HTMLElement} element The element that will be upgraded.
     */
    var MaterialTextfield = function MaterialTextfield(element) {
        this.element_ = element;
        this.maxRows = this.Constant_.NO_MAX_ROWS;
        // Initialize instance.
        this.init();
    };
    window['MaterialTextfield'] = MaterialTextfield;

    /**
     * Store constants in one place so they can be updated easily.
     *
     * @enum {string | number}
     * @private
     */
    MaterialTextfield.prototype.Constant_ = {
        NO_MAX_ROWS: -1,
        MAX_ROWS_ATTRIBUTE: 'maxrows'
    };

    /**
     * Store strings for class names defined by this component that are used in
     * JavaScript. This allows us to simply change it in one place should we
     * decide to modify at a later date.
     *
     * @enum {string}
     * @private
     */
    MaterialTextfield.prototype.CssClasses_ = {
        LABEL: 'mdl-textfield__label',
        INPUT: 'mdl-textfield__input',
        IS_DIRTY: 'is-dirty',
        IS_FOCUSED: 'is-focused',
        IS_DISABLED: 'is-disabled',
        IS_INVALID: 'is-invalid',
        IS_UPGRADED: 'is-upgraded',
        HAS_PLACEHOLDER: 'has-placeholder'
    };

    /**
     * Handle input being entered.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialTextfield.prototype.onKeyDown_ = function(event) {
        var currentRowCount = event.target.value.split('\n').length;
        if (event.keyCode === 13) {
            if (currentRowCount >= this.maxRows) {
                event.preventDefault();
            }
        }
    };

    /**
     * Handle focus.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialTextfield.prototype.onFocus_ = function(event) {
        this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
    };

    /**
     * Handle lost focus.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialTextfield.prototype.onBlur_ = function(event) {
        this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
    };

    /**
     * Handle reset event from out side.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialTextfield.prototype.onReset_ = function(event) {
        this.updateClasses_();
    };

    /**
     * Handle class updates.
     *
     * @private
     */
    MaterialTextfield.prototype.updateClasses_ = function() {
        this.checkDisabled();
        this.checkValidity();
        this.checkDirty();
        this.checkFocus();
    };

    // Public methods.

    /**
     * Check the disabled state and update field accordingly.
     *
     * @public
     */
    MaterialTextfield.prototype.checkDisabled = function() {
        if (this.input_.disabled) {
            this.element_.classList.add(this.CssClasses_.IS_DISABLED);
        } else {
            this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
        }
    };
    MaterialTextfield.prototype['checkDisabled'] =
        MaterialTextfield.prototype.checkDisabled;

    /**
     * Check the focus state and update field accordingly.
     *
     * @public
     */
    MaterialTextfield.prototype.checkFocus = function() {
        if (Boolean(this.element_.querySelector(':focus'))) {
            this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
        } else {
            this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
        }
    };
    MaterialTextfield.prototype['checkFocus'] =
        MaterialTextfield.prototype.checkFocus;

    /**
     * Check the validity state and update field accordingly.
     *
     * @public
     */
    MaterialTextfield.prototype.checkValidity = function() {
        if (this.input_.validity) {
            if (this.input_.validity.valid) {
                this.element_.classList.remove(this.CssClasses_.IS_INVALID);
            } else {
                this.element_.classList.add(this.CssClasses_.IS_INVALID);
            }
        }
    };
    MaterialTextfield.prototype['checkValidity'] =
        MaterialTextfield.prototype.checkValidity;

    /**
     * Check the dirty state and update field accordingly.
     *
     * @public
     */
    MaterialTextfield.prototype.checkDirty = function() {
        if (this.input_.value && this.input_.value.length > 0) {
            this.element_.classList.add(this.CssClasses_.IS_DIRTY);
        } else {
            this.element_.classList.remove(this.CssClasses_.IS_DIRTY);
        }
    };
    MaterialTextfield.prototype['checkDirty'] =
        MaterialTextfield.prototype.checkDirty;

    /**
     * Disable text field.
     *
     * @public
     */
    MaterialTextfield.prototype.disable = function() {
        this.input_.disabled = true;
        this.updateClasses_();
    };
    MaterialTextfield.prototype['disable'] = MaterialTextfield.prototype.disable;

    /**
     * Enable text field.
     *
     * @public
     */
    MaterialTextfield.prototype.enable = function() {
        this.input_.disabled = false;
        this.updateClasses_();
    };
    MaterialTextfield.prototype['enable'] = MaterialTextfield.prototype.enable;

    /**
     * Update text field value.
     *
     * @param {string} value The value to which to set the control (optional).
     * @public
     */
    MaterialTextfield.prototype.change = function(value) {

        this.input_.value = value || '';
        this.updateClasses_();
    };
    MaterialTextfield.prototype['change'] = MaterialTextfield.prototype.change;

    /**
     * Initialize element.
     */
    MaterialTextfield.prototype.init = function() {

        if (this.element_) {
            this.label_ = this.element_.querySelector('.' + this.CssClasses_.LABEL);
            this.input_ = this.element_.querySelector('.' + this.CssClasses_.INPUT);

            if (this.input_) {
                if (this.input_.hasAttribute(
                        /** @type {string} */ (this.Constant_.MAX_ROWS_ATTRIBUTE))) {
                    this.maxRows = parseInt(this.input_.getAttribute(
                        /** @type {string} */ (this.Constant_.MAX_ROWS_ATTRIBUTE)), 10);
                    if (isNaN(this.maxRows)) {
                        this.maxRows = this.Constant_.NO_MAX_ROWS;
                    }
                }

                if (this.input_.hasAttribute('placeholder')) {
                    this.element_.classList.add(this.CssClasses_.HAS_PLACEHOLDER);
                }

                this.boundUpdateClassesHandler = this.updateClasses_.bind(this);
                this.boundFocusHandler = this.onFocus_.bind(this);
                this.boundBlurHandler = this.onBlur_.bind(this);
                this.boundResetHandler = this.onReset_.bind(this);
                this.input_.addEventListener('input', this.boundUpdateClassesHandler);
                this.input_.addEventListener('focus', this.boundFocusHandler);
                this.input_.addEventListener('blur', this.boundBlurHandler);
                this.input_.addEventListener('reset', this.boundResetHandler);

                if (this.maxRows !== this.Constant_.NO_MAX_ROWS) {
                    // TODO: This should handle pasting multi line text.
                    // Currently doesn't.
                    this.boundKeyDownHandler = this.onKeyDown_.bind(this);
                    this.input_.addEventListener('keydown', this.boundKeyDownHandler);
                }
                var invalid = this.element_.classList
                    .contains(this.CssClasses_.IS_INVALID);
                this.updateClasses_();
                this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
                if (invalid) {
                    this.element_.classList.add(this.CssClasses_.IS_INVALID);
                }
                if (this.input_.hasAttribute('autofocus')) {
                    this.element_.focus();
                    this.checkFocus();
                }
            }
        }
    };

    // The component registers itself. It can assume componentHandler is available
    // in the global scope.
    componentHandler.register({
        constructor: MaterialTextfield,
        classAsString: 'MaterialTextfield',
        cssClass: 'mdl-js-textfield',
        widget: true
    });
})();

(function() {
    'use strict';

    /**
     * Class constructor for dropdown MDL component.
     * Implements MDL component design pattern defined at:
     * https://github.com/jasonmayes/mdl-component-design-pattern
     *
     * @constructor
     * @param {HTMLElement} element The element that will be upgraded.
     */
    var MaterialMenu = function MaterialMenu(element) {
        this.element_ = element;

        // Initialize instance.
        this.init();
    };
    window['MaterialMenu'] = MaterialMenu;

    /**
     * Store constants in one place so they can be updated easily.
     *
     * @enum {string | number}
     * @private
     */
    MaterialMenu.prototype.Constant_ = {
        // Total duration of the menu animation.
        TRANSITION_DURATION_SECONDS: 0.3,
        // The fraction of the total duration we want to use for menu item animations.
        TRANSITION_DURATION_FRACTION: 0.8,
        // How long the menu stays open after choosing an option (so the user can see
        // the ripple).
        CLOSE_TIMEOUT: 150
    };

    /**
     * Keycodes, for code readability.
     *
     * @enum {number}
     * @private
     */
    MaterialMenu.prototype.Keycodes_ = {
        ENTER: 13,
        ESCAPE: 27,
        SPACE: 32,
        UP_ARROW: 38,
        DOWN_ARROW: 40
    };

    /**
     * Store strings for class names defined by this component that are used in
     * JavaScript. This allows us to simply change it in one place should we
     * decide to modify at a later date.
     *
     * @enum {string}
     * @private
     */
    MaterialMenu.prototype.CssClasses_ = {
        CONTAINER: 'mdl-menu__container',
        OUTLINE: 'mdl-menu__outline',
        ITEM: 'mdl-menu__item',
        ITEM_RIPPLE_CONTAINER: 'mdl-menu__item-ripple-container',
        RIPPLE_EFFECT: 'mdl-js-ripple-effect',
        RIPPLE_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
        RIPPLE: 'mdl-ripple',
        // Statuses
        IS_UPGRADED: 'is-upgraded',
        IS_VISIBLE: 'is-visible',
        IS_ANIMATING: 'is-animating',
        // Alignment options
        BOTTOM_LEFT: 'mdl-menu--bottom-left',  // This is the default.
        BOTTOM_RIGHT: 'mdl-menu--bottom-right',
        TOP_LEFT: 'mdl-menu--top-left',
        TOP_RIGHT: 'mdl-menu--top-right',
        UNALIGNED: 'mdl-menu--unaligned'
    };

    /**
     * Initialize element.
     */
    MaterialMenu.prototype.init = function() {
        if (this.element_) {
            // Create container for the menu.
            var container = document.createElement('div');
            container.classList.add(this.CssClasses_.CONTAINER);
            this.element_.parentElement.insertBefore(container, this.element_);
            this.element_.parentElement.removeChild(this.element_);
            container.appendChild(this.element_);
            this.container_ = container;

            // Create outline for the menu (shadow and background).
            var outline = document.createElement('div');
            outline.classList.add(this.CssClasses_.OUTLINE);
            this.outline_ = outline;
            container.insertBefore(outline, this.element_);

            // Find the "for" element and bind events to it.
            var forElId = this.element_.getAttribute('for') ||
                this.element_.getAttribute('data-mdl-for');
            var forEl = null;
            if (forElId) {
                forEl = document.getElementById(forElId);
                if (forEl) {
                    this.forElement_ = forEl;
                    forEl.addEventListener('click', this.handleForClick_.bind(this));
                    forEl.addEventListener('keydown',
                        this.handleForKeyboardEvent_.bind(this));
                }
            }

            var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM);
            this.boundItemKeydown_ = this.handleItemKeyboardEvent_.bind(this);
            this.boundItemClick_ = this.handleItemClick_.bind(this);
            for (var i = 0; i < items.length; i++) {
                // Add a listener to each menu item.
                items[i].addEventListener('click', this.boundItemClick_);
                // Add a tab index to each menu item.
                items[i].tabIndex = '-1';
                // Add a keyboard listener to each menu item.
                items[i].addEventListener('keydown', this.boundItemKeydown_);
            }

            // Add ripple classes to each item, if the user has enabled ripples.
            if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
                this.element_.classList.add(this.CssClasses_.RIPPLE_IGNORE_EVENTS);

                for (i = 0; i < items.length; i++) {
                    var item = items[i];

                    var rippleContainer = document.createElement('span');
                    rippleContainer.classList.add(this.CssClasses_.ITEM_RIPPLE_CONTAINER);

                    var ripple = document.createElement('span');
                    ripple.classList.add(this.CssClasses_.RIPPLE);
                    rippleContainer.appendChild(ripple);

                    item.appendChild(rippleContainer);
                    item.classList.add(this.CssClasses_.RIPPLE_EFFECT);
                }
            }

            // Copy alignment classes to the container, so the outline can use them.
            if (this.element_.classList.contains(this.CssClasses_.BOTTOM_LEFT)) {
                this.outline_.classList.add(this.CssClasses_.BOTTOM_LEFT);
            }
            if (this.element_.classList.contains(this.CssClasses_.BOTTOM_RIGHT)) {
                this.outline_.classList.add(this.CssClasses_.BOTTOM_RIGHT);
            }
            if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT)) {
                this.outline_.classList.add(this.CssClasses_.TOP_LEFT);
            }
            if (this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
                this.outline_.classList.add(this.CssClasses_.TOP_RIGHT);
            }
            if (this.element_.classList.contains(this.CssClasses_.UNALIGNED)) {
                this.outline_.classList.add(this.CssClasses_.UNALIGNED);
            }

            container.classList.add(this.CssClasses_.IS_UPGRADED);
        }
    };

    /**
     * Handles a click on the "for" element, by positioning the menu and then
     * toggling it.
     *
     * @param {Event} evt The event that fired.
     * @private
     */
    MaterialMenu.prototype.handleForClick_ = function(evt) {
        if (this.element_ && this.forElement_) {
            var rect = this.forElement_.getBoundingClientRect();
            var forRect = this.forElement_.parentElement.getBoundingClientRect();

            if (this.element_.classList.contains(this.CssClasses_.UNALIGNED)) {
                // Do not position the menu automatically. Requires the developer to
                // manually specify position.
            } else if (this.element_.classList.contains(
                    this.CssClasses_.BOTTOM_RIGHT)) {
                // Position below the "for" element, aligned to its right.
                this.container_.style.right = (forRect.right - rect.right) + 'px';
                this.container_.style.top =
                    this.forElement_.offsetTop + this.forElement_.offsetHeight + 'px';
            } else if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT)) {
                // Position above the "for" element, aligned to its left.
                this.container_.style.left = this.forElement_.offsetLeft + 'px';
                this.container_.style.bottom = (forRect.bottom - rect.top) + 'px';
            } else if (this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
                // Position above the "for" element, aligned to its right.
                this.container_.style.right = (forRect.right - rect.right) + 'px';
                this.container_.style.bottom = (forRect.bottom - rect.top) + 'px';
            } else {
                // Default: position below the "for" element, aligned to its left.
                this.container_.style.left = this.forElement_.offsetLeft + 'px';
                this.container_.style.top =
                    this.forElement_.offsetTop + this.forElement_.offsetHeight + 'px';
            }
        }

        this.toggle(evt);
    };

    /**
     * Handles a keyboard event on the "for" element.
     *
     * @param {Event} evt The event that fired.
     * @private
     */
    MaterialMenu.prototype.handleForKeyboardEvent_ = function(evt) {
        if (this.element_ && this.container_ && this.forElement_) {
            var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM +
                ':not([disabled])');

            if (items && items.length > 0 &&
                this.container_.classList.contains(this.CssClasses_.IS_VISIBLE)) {
                if (evt.keyCode === this.Keycodes_.UP_ARROW) {
                    evt.preventDefault();
                    items[items.length - 1].focus();
                } else if (evt.keyCode === this.Keycodes_.DOWN_ARROW) {
                    evt.preventDefault();
                    items[0].focus();
                }
            }
        }
    };

    /**
     * Handles a keyboard event on an item.
     *
     * @param {Event} evt The event that fired.
     * @private
     */
    MaterialMenu.prototype.handleItemKeyboardEvent_ = function(evt) {
        if (this.element_ && this.container_) {
            var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM +
                ':not([disabled])');

            if (items && items.length > 0 &&
                this.container_.classList.contains(this.CssClasses_.IS_VISIBLE)) {
                var currentIndex = Array.prototype.slice.call(items).indexOf(evt.target);

                if (evt.keyCode === this.Keycodes_.UP_ARROW) {
                    evt.preventDefault();
                    if (currentIndex > 0) {
                        items[currentIndex - 1].focus();
                    } else {
                        items[items.length - 1].focus();
                    }
                } else if (evt.keyCode === this.Keycodes_.DOWN_ARROW) {
                    evt.preventDefault();
                    if (items.length > currentIndex + 1) {
                        items[currentIndex + 1].focus();
                    } else {
                        items[0].focus();
                    }
                } else if (evt.keyCode === this.Keycodes_.SPACE ||
                    evt.keyCode === this.Keycodes_.ENTER) {
                    evt.preventDefault();
                    // Send mousedown and mouseup to trigger ripple.
                    var e = new MouseEvent('mousedown');
                    evt.target.dispatchEvent(e);
                    e = new MouseEvent('mouseup');
                    evt.target.dispatchEvent(e);
                    // Send click.
                    evt.target.click();
                } else if (evt.keyCode === this.Keycodes_.ESCAPE) {
                    evt.preventDefault();
                    this.hide();
                }
            }
        }
    };

    /**
     * Handles a click event on an item.
     *
     * @param {Event} evt The event that fired.
     * @private
     */
    MaterialMenu.prototype.handleItemClick_ = function(evt) {
        if (evt.target.hasAttribute('disabled')) {
            evt.stopPropagation();
        } else {
            // Wait some time before closing menu, so the user can see the ripple.
            this.closing_ = true;
            window.setTimeout(function(evt) {
                this.hide();
                this.closing_ = false;
            }.bind(this), /** @type {number} */ (this.Constant_.CLOSE_TIMEOUT));
        }
    };

    /**
     * Calculates the initial clip (for opening the menu) or final clip (for closing
     * it), and applies it. This allows us to animate from or to the correct point,
     * that is, the point it's aligned to in the "for" element.
     *
     * @param {number} height Height of the clip rectangle
     * @param {number} width Width of the clip rectangle
     * @private
     */
    MaterialMenu.prototype.applyClip_ = function(height, width) {
        if (this.element_.classList.contains(this.CssClasses_.UNALIGNED)) {
            // Do not clip.
            this.element_.style.clip = '';
        } else if (this.element_.classList.contains(this.CssClasses_.BOTTOM_RIGHT)) {
            // Clip to the top right corner of the menu.
            this.element_.style.clip =
                'rect(0 ' + width + 'px ' + '0 ' + width + 'px)';
        } else if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT)) {
            // Clip to the bottom left corner of the menu.
            this.element_.style.clip =
                'rect(' + height + 'px 0 ' + height + 'px 0)';
        } else if (this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
            // Clip to the bottom right corner of the menu.
            this.element_.style.clip = 'rect(' + height + 'px ' + width + 'px ' +
                height + 'px ' + width + 'px)';
        } else {
            // Default: do not clip (same as clipping to the top left corner).
            this.element_.style.clip = '';
        }
    };

    /**
     * Cleanup function to remove animation listeners.
     *
     * @param {Event} evt
     * @private
     */

    MaterialMenu.prototype.removeAnimationEndListener_ = function(evt) {
        evt.target.classList.remove(MaterialMenu.prototype.CssClasses_.IS_ANIMATING);
    };

    /**
     * Adds an event listener to clean up after the animation ends.
     *
     * @private
     */
    MaterialMenu.prototype.addAnimationEndListener_ = function() {
        this.element_.addEventListener('transitionend', this.removeAnimationEndListener_);
        this.element_.addEventListener('webkitTransitionEnd', this.removeAnimationEndListener_);
    };

    /**
     * Displays the menu.
     *
     * @public
     */
    MaterialMenu.prototype.show = function(evt) {
        if (this.element_ && this.container_ && this.outline_) {
            // Measure the inner element.
            var height = this.element_.getBoundingClientRect().height;
            var width = this.element_.getBoundingClientRect().width;

            // Apply the inner element's size to the container and outline.
            this.container_.style.width = width + 'px';
            this.container_.style.height = height + 'px';
            this.outline_.style.width = width + 'px';
            this.outline_.style.height = height + 'px';

            var transitionDuration = this.Constant_.TRANSITION_DURATION_SECONDS *
                this.Constant_.TRANSITION_DURATION_FRACTION;

            // Calculate transition delays for individual menu items, so that they fade
            // in one at a time.
            var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM);
            for (var i = 0; i < items.length; i++) {
                var itemDelay = null;
                if (this.element_.classList.contains(this.CssClasses_.TOP_LEFT) ||
                    this.element_.classList.contains(this.CssClasses_.TOP_RIGHT)) {
                    itemDelay = ((height - items[i].offsetTop - items[i].offsetHeight) /
                        height * transitionDuration) + 's';
                } else {
                    itemDelay = (items[i].offsetTop / height * transitionDuration) + 's';
                }
                items[i].style.transitionDelay = itemDelay;
            }

            // Apply the initial clip to the text before we start animating.
            this.applyClip_(height, width);

            // Wait for the next frame, turn on animation, and apply the final clip.
            // Also make it visible. This triggers the transitions.
            window.requestAnimationFrame(function() {
                this.element_.classList.add(this.CssClasses_.IS_ANIMATING);
                this.element_.style.clip = 'rect(0 ' + width + 'px ' + height + 'px 0)';
                this.container_.classList.add(this.CssClasses_.IS_VISIBLE);
            }.bind(this));

            // Clean up after the animation is complete.
            this.addAnimationEndListener_();

            // Add a click listener to the document, to close the menu.
            var callback = function(e) {
                // Check to see if the document is processing the same event that
                // displayed the menu in the first place. If so, do nothing.
                // Also check to see if the menu is in the process of closing itself, and
                // do nothing in that case.
                // Also check if the clicked element is a menu item
                // if so, do nothing.
                if (e !== evt && !this.closing_ && e.target.parentNode !== this.element_) {
                    document.removeEventListener('click', callback);
                    this.hide();
                }
            }.bind(this);
            document.addEventListener('click', callback);
        }
    };
    MaterialMenu.prototype['show'] = MaterialMenu.prototype.show;

    /**
     * Hides the menu.
     *
     * @public
     */
    MaterialMenu.prototype.hide = function() {
        if (this.element_ && this.container_ && this.outline_) {
            var items = this.element_.querySelectorAll('.' + this.CssClasses_.ITEM);

            // Remove all transition delays; menu items fade out concurrently.
            for (var i = 0; i < items.length; i++) {
                items[i].style.removeProperty('transition-delay');
            }

            // Measure the inner element.
            var rect = this.element_.getBoundingClientRect();
            var height = rect.height;
            var width = rect.width;

            // Turn on animation, and apply the final clip. Also make invisible.
            // This triggers the transitions.
            this.element_.classList.add(this.CssClasses_.IS_ANIMATING);
            this.applyClip_(height, width);
            this.container_.classList.remove(this.CssClasses_.IS_VISIBLE);

            // Clean up after the animation is complete.
            this.addAnimationEndListener_();
        }
    };
    MaterialMenu.prototype['hide'] = MaterialMenu.prototype.hide;

    /**
     * Displays or hides the menu, depending on current state.
     *
     * @public
     */
    MaterialMenu.prototype.toggle = function(evt) {
        if (this.container_.classList.contains(this.CssClasses_.IS_VISIBLE)) {
            this.hide();
        } else {
            this.show(evt);
        }
    };
    MaterialMenu.prototype['toggle'] = MaterialMenu.prototype.toggle;

    // The component registers itself. It can assume componentHandler is available
    // in the global scope.
    componentHandler.register({
        constructor: MaterialMenu,
        classAsString: 'MaterialMenu',
        cssClass: 'mdl-js-menu',
        widget: true
    });
})();

(function() {
    'use strict';

    /**
     * Class constructor for Checkbox MDL component.
     * Implements MDL component design pattern defined at:
     * https://github.com/jasonmayes/mdl-component-design-pattern
     *
     * @constructor
     * @param {HTMLElement} element The element that will be upgraded.
     */
    var MaterialCheckbox = function MaterialCheckbox(element) {
        this.element_ = element;

        // Initialize instance.
        this.init();
    };
    window['MaterialCheckbox'] = MaterialCheckbox;

    /**
     * Store constants in one place so they can be updated easily.
     *
     * @enum {string | number}
     * @private
     */
    MaterialCheckbox.prototype.Constant_ = {
        TINY_TIMEOUT: 0.001
    };

    /**
     * Store strings for class names defined by this component that are used in
     * JavaScript. This allows us to simply change it in one place should we
     * decide to modify at a later date.
     *
     * @enum {string}
     * @private
     */
    MaterialCheckbox.prototype.CssClasses_ = {
        INPUT: 'mdl-checkbox__input',
        BOX_OUTLINE: 'mdl-checkbox__box-outline',
        FOCUS_HELPER: 'mdl-checkbox__focus-helper',
        TICK_OUTLINE: 'mdl-checkbox__tick-outline',
        RIPPLE_EFFECT: 'mdl-js-ripple-effect',
        RIPPLE_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
        RIPPLE_CONTAINER: 'mdl-checkbox__ripple-container',
        RIPPLE_CENTER: 'mdl-ripple--center',
        RIPPLE: 'mdl-ripple',
        IS_FOCUSED: 'is-focused',
        IS_DISABLED: 'is-disabled',
        IS_CHECKED: 'is-checked',
        IS_UPGRADED: 'is-upgraded'
    };

    /**
     * Handle change of state.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialCheckbox.prototype.onChange_ = function(event) {
        this.updateClasses_();
    };

    /**
     * Handle focus of element.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialCheckbox.prototype.onFocus_ = function(event) {
        this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
    };

    /**
     * Handle lost focus of element.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialCheckbox.prototype.onBlur_ = function(event) {
        this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
    };

    /**
     * Handle mouseup.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialCheckbox.prototype.onMouseUp_ = function(event) {
        this.blur_();
    };

    /**
     * Handle class updates.
     *
     * @private
     */
    MaterialCheckbox.prototype.updateClasses_ = function() {
        this.checkDisabled();
        this.checkToggleState();
    };

    /**
     * Add blur.
     *
     * @private
     */
    MaterialCheckbox.prototype.blur_ = function() {
        // TODO: figure out why there's a focus event being fired after our blur,
        // so that we can avoid this hack.
        window.setTimeout(function() {
            this.inputElement_.blur();
        }.bind(this), /** @type {number} */ (this.Constant_.TINY_TIMEOUT));
    };

    // Public methods.

    /**
     * Check the inputs toggle state and update display.
     *
     * @public
     */
    MaterialCheckbox.prototype.checkToggleState = function() {
        if (this.inputElement_.checked) {
            this.element_.classList.add(this.CssClasses_.IS_CHECKED);
        } else {
            this.element_.classList.remove(this.CssClasses_.IS_CHECKED);
        }
    };
    MaterialCheckbox.prototype['checkToggleState'] =
        MaterialCheckbox.prototype.checkToggleState;

    /**
     * Check the inputs disabled state and update display.
     *
     * @public
     */
    MaterialCheckbox.prototype.checkDisabled = function() {
        if (this.inputElement_.disabled) {
            this.element_.classList.add(this.CssClasses_.IS_DISABLED);
        } else {
            this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
        }
    };
    MaterialCheckbox.prototype['checkDisabled'] =
        MaterialCheckbox.prototype.checkDisabled;

    /**
     * Disable checkbox.
     *
     * @public
     */
    MaterialCheckbox.prototype.disable = function() {
        this.inputElement_.disabled = true;
        this.updateClasses_();
    };
    MaterialCheckbox.prototype['disable'] = MaterialCheckbox.prototype.disable;

    /**
     * Enable checkbox.
     *
     * @public
     */
    MaterialCheckbox.prototype.enable = function() {
        this.inputElement_.disabled = false;
        this.updateClasses_();
    };
    MaterialCheckbox.prototype['enable'] = MaterialCheckbox.prototype.enable;

    /**
     * Check checkbox.
     *
     * @public
     */
    MaterialCheckbox.prototype.check = function() {
        this.inputElement_.checked = true;
        this.updateClasses_();
    };
    MaterialCheckbox.prototype['check'] = MaterialCheckbox.prototype.check;

    /**
     * Uncheck checkbox.
     *
     * @public
     */
    MaterialCheckbox.prototype.uncheck = function() {
        this.inputElement_.checked = false;
        this.updateClasses_();
    };
    MaterialCheckbox.prototype['uncheck'] = MaterialCheckbox.prototype.uncheck;

    /**
     * Initialize element.
     */
    MaterialCheckbox.prototype.init = function() {
        if (this.element_) {
            this.inputElement_ = this.element_.querySelector('.' +
                this.CssClasses_.INPUT);

            var boxOutline = document.createElement('span');
            boxOutline.classList.add(this.CssClasses_.BOX_OUTLINE);

            var tickContainer = document.createElement('span');
            tickContainer.classList.add(this.CssClasses_.FOCUS_HELPER);

            var tickOutline = document.createElement('span');
            tickOutline.classList.add(this.CssClasses_.TICK_OUTLINE);

            boxOutline.appendChild(tickOutline);

            this.element_.appendChild(tickContainer);
            this.element_.appendChild(boxOutline);

            if (this.element_.classList.contains(this.CssClasses_.RIPPLE_EFFECT)) {
                this.element_.classList.add(this.CssClasses_.RIPPLE_IGNORE_EVENTS);
                this.rippleContainerElement_ = document.createElement('span');
                this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_CONTAINER);
                this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_EFFECT);
                this.rippleContainerElement_.classList.add(this.CssClasses_.RIPPLE_CENTER);
                this.boundRippleMouseUp = this.onMouseUp_.bind(this);
                this.rippleContainerElement_.addEventListener('mouseup', this.boundRippleMouseUp);

                var ripple = document.createElement('span');
                ripple.classList.add(this.CssClasses_.RIPPLE);

                this.rippleContainerElement_.appendChild(ripple);
                this.element_.appendChild(this.rippleContainerElement_);
            }
            this.boundInputOnChange = this.onChange_.bind(this);
            this.boundInputOnFocus = this.onFocus_.bind(this);
            this.boundInputOnBlur = this.onBlur_.bind(this);
            this.boundElementMouseUp = this.onMouseUp_.bind(this);
            this.inputElement_.addEventListener('change', this.boundInputOnChange);
            this.inputElement_.addEventListener('focus', this.boundInputOnFocus);
            this.inputElement_.addEventListener('blur', this.boundInputOnBlur);
            this.element_.addEventListener('mouseup', this.boundElementMouseUp);

            this.updateClasses_();
            this.element_.classList.add(this.CssClasses_.IS_UPGRADED);
        }
    };

    // The component registers itself. It can assume componentHandler is available
    // in the global scope.
    componentHandler.register({
        constructor: MaterialCheckbox,
        classAsString: 'MaterialCheckbox',
        cssClass: 'mdl-js-checkbox',
        widget: true
    });
})();

(function () {
    'use strict';

    var MaterialSelectfield = function MaterialSelectfield(element) {
        this.element_ = element;
        this.setDefaults_();
        // Initialize instance.
        this.init();
    };
    window['MaterialSelectfield'] = MaterialSelectfield;

    MaterialSelectfield.prototype.CssClasses_ = {
        LABEL: 'mdl-selectfield__label',
        SELECT: 'mdl-selectfield__select',
        SELECTED_BOX: 'mdl-selectfield__box',
        SELECTED_BOX_VALUE: 'mdl-selectfield__box-value',
        LIST_OPTION_BOX: 'mdl-selectfield__list-option-box',
        IS_DIRTY: 'is-dirty',
        IS_FOCUSED: 'is-focused',
        IS_DISABLED: 'is-disabled',
        IS_INVALID: 'is-invalid',
        IS_UPGRADED: 'is-upgraded',
        IS_SELECTED: 'is-selected'
    };

    MaterialSelectfield.prototype.Keycodes_ = {
        ENTER: 13,
        ESCAPE: 27,
        SPACE: 32,
        UP_ARROW: 38,
        DOWN_ARROW: 40
    };

    MaterialSelectfield.prototype.setDefaults_ = function () {
        this.options_ = [];
        this.optionsMap_ = {};
        this.optionsArr_ = [];
        this.closing_ = true;
        this.keyDownTimerId_ = null;
        this.observer_ = null;
    };

    MaterialSelectfield.prototype.onFocus_ = function (event) {
        this.closing_ && this.show_(event);
    };

    MaterialSelectfield.prototype.onBlur_ = function (event) {
        !this.closing_ && this.hide_();
    };

    MaterialSelectfield.prototype.onSelected_ = function (event) {
        if(event.target && event.target.nodeName == "LI") {
            var option = this.options_[event.target.getAttribute('data-value')];

            if(option.disabled) {
                event.stopPropagation();
                return false;
            }

            this.selectedOptionValue_.textContent = option.textContent;
            option.selected = true;

            //fire event change
            var evt;
            if(typeof window.Event == "function") {
                evt = new Event('change', {
                    bubbles: true
                    ,cancelable: true
                });
            }
            else if(typeof document.createEvent == "function") {
                evt = document.createEvent("HTMLEvents");
                evt.initEvent("change", true, true);
            }
            evt && this.select_.dispatchEvent(evt);

            if(option.textContent !== "") {
                this.element_.classList.add(this.CssClasses_.IS_DIRTY);
                var selectedItem = this.listOptionBox_.querySelector('.' + this.CssClasses_.IS_SELECTED);
                selectedItem && selectedItem.classList.remove(this.CssClasses_.IS_SELECTED);
                event.target.classList.add(this.CssClasses_.IS_SELECTED);
            }
            else {
                this.element_.classList.remove(this.CssClasses_.IS_DIRTY);
                var selectedItem = this.listOptionBox_.querySelector('.' + this.CssClasses_.IS_SELECTED);
                selectedItem && selectedItem.classList.remove(this.CssClasses_.IS_SELECTED);
            }
        }
    };

    MaterialSelectfield.prototype.onClick_ = function (event) {
        this.toggle(event);
    };

    MaterialSelectfield.prototype.update_ = function () {
        var itemSelected;

        if(this.options_ && this.options_.length > 0) {
            for (var i = 0; i < this.options_.length; i++) {
                var item = this.options_[i];
                if (item.selected && item.value !== "") {
                    var itemSelected = true;
                    this.element_.classList.add(this.CssClasses_.IS_DIRTY);
                    this.listOptionBox_.querySelector('.' + this.CssClasses_.IS_SELECTED).classList.remove(this.CssClasses_.IS_SELECTED);
                    this.listOptionBox_.querySelectorAll('LI')[i].classList.add(this.CssClasses_.IS_SELECTED);
                }
            }
        }

        if(!itemSelected) {
            this.element_.classList.remove(this.CssClasses_.IS_DIRTY);
        }

        this.checkDisabled();
        this.checkValidity();
    };

    MaterialSelectfield.prototype.checkValidity = function() {
        if (this.select_.validity) {
            if (this.select_.validity.valid) {
                this.element_.classList.remove(this.CssClasses_.IS_INVALID);
            } else {
                this.element_.classList.add(this.CssClasses_.IS_INVALID);
            }
        }
    };
    MaterialSelectfield.prototype['checkValidity'] =
        MaterialSelectfield.prototype.checkValidity;

    MaterialSelectfield.prototype.checkDisabled = function() {
        if (this.select_.disabled) {
            this.element_.classList.add(this.CssClasses_.IS_DISABLED);
        } else {
            this.element_.classList.remove(this.CssClasses_.IS_DISABLED);
        }
    };
    MaterialSelectfield.prototype['checkDisabled'] =
        MaterialSelectfield.prototype.checkDisabled;

    /**
     * Disable select field.
     *
     * @public
     */
    MaterialSelectfield.prototype.disable = function() {
        this.select_.disabled = true;
        this.update_();
    };
    MaterialSelectfield.prototype['disable'] = MaterialSelectfield.prototype.disable;

    /**
     * Enable select field.
     *
     * @public
     */
    MaterialSelectfield.prototype.enable = function() {
        this.select_.disabled = false;
        this.update_();
    };
    MaterialSelectfield.prototype['enable'] = MaterialSelectfield.prototype.enable;

    MaterialSelectfield.prototype.isDescendant_ = function (parent, child) {
        var node = child.parentNode;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    };

    MaterialSelectfield.prototype.toggle = function (event) {
        if(!this.element_.classList.contains(this.CssClasses_.IS_FOCUSED)) {
            this.show_(event)
        }
        else if(event.target && event.target.nodeName == "LI" && this.isDescendant_(this.listOptionBox_, event.target)) {
            this.onSelected_(event)
        }
        else {
            this.hide_()
        }
    };

    MaterialSelectfield.prototype.show_ = function(event) {
        this.checkDisabled();
        if(this.element_.classList.contains(this.CssClasses_.IS_DISABLED)) return;

        this.element_.classList.add(this.CssClasses_.IS_FOCUSED);
        this.closing_ = false;
        this.strSearch_ = "";

        var selectedItem = this.listOptionBox_ && this.listOptionBox_.querySelector('.' + this.CssClasses_.IS_SELECTED);
        if(selectedItem) selectedItem.parentElement.parentElement.scrollTop = selectedItem.offsetTop;

        this.boundKeyDownHandler_ = this.onKeyDown_.bind(this);
        this.boundClickDocHandler_ = function(e) {
            if (e !== event && !this.closing_ && !(e.target.parentNode === this.element_ || e.target.parentNode === this.selectedOption_) ) {
                this.hide_();
            }
        }.bind(this);

        document.addEventListener('keydown', this.boundKeyDownHandler_);
        document.addEventListener('click', this.boundClickDocHandler_);
    };

    MaterialSelectfield.prototype.onKeyDown_ = function(evt) {
        var items = this.listOptionBox_.querySelectorAll('li:not([disabled])');

        if (items && items.length > 0 && !this.closing_) {
            var currentIndex = Array.prototype.slice.call(items).indexOf(this.listOptionBox_.querySelectorAll('.' + this.CssClasses_.IS_SELECTED)[0]);
            var selectedItem;

            if(evt.keyCode === this.Keycodes_.UP_ARROW || evt.keyCode === this.Keycodes_.DOWN_ARROW) {
                if(currentIndex != -1) {
                    items[currentIndex].classList.remove(this.CssClasses_.IS_SELECTED);
                }

                if (evt.keyCode === this.Keycodes_.UP_ARROW) {
                    evt.preventDefault();
                    if (currentIndex > 0) {
                        selectedItem = items[currentIndex - 1];
                    } else {
                        selectedItem = items[items.length - 1];
                    }
                } else {
                    evt.preventDefault();
                    if (items.length > currentIndex + 1) {
                        selectedItem = items[currentIndex + 1];
                    } else {
                        selectedItem = items[0];
                    }
                }

                if(selectedItem) {
                    selectedItem.classList.add(this.CssClasses_.IS_SELECTED);
                    this.listOptionBox_.scrollTop = selectedItem.offsetTop;
                    this.lastSelectedItem_ = selectedItem;
                }
            }
            else if ((evt.keyCode === this.Keycodes_.SPACE || evt.keyCode === this.Keycodes_.ENTER) && this.lastSelectedItem_) {
                evt.preventDefault();
                // Send mousedown and mouseup to trigger ripple.
                var ev;

                if(document.createEvent) {
                    ev = document.createEvent("MouseEvent");
                    ev.initMouseEvent("click",true,true,window,0,0,0,0,0,false,false,false,false,0,null);
                }
                else {
                    ev = new MouseEvent("mousedown");
                }
                this.lastSelectedItem_.dispatchEvent(ev);
                if(!document.createEvent) {
                    ev = new MouseEvent('mouseup');
                    this.lastSelectedItem_.dispatchEvent(ev);
                }
                // Send click.
                //this.lastSelectedItem_.click();
            }
            else if (evt.keyCode === this.Keycodes_.ESCAPE) {
                evt.preventDefault();
                var ev;

                if(document.createEvent) {
                    ev = document.createEvent("MouseEvent");
                    ev.initMouseEvent("click",true,true,window,0,0,0,0,0,false,false,false,false,0,null);
                }
                else {
                    ev = new MouseEvent("mousedown");
                }
                document.body.dispatchEvent(ev);
                if(!document.createEvent) {
                    ev = new MouseEvent('mouseup');
                    document.body.dispatchEvent(ev);
                }
                document.body.click();
            }
            else if (this.validKeyCode_(evt.keyCode)) {
                var charCode = evt.which || evt.keyCode;

                this.strSearch_ += String.fromCharCode(charCode);

                if(this.keyDownTimerId_) clearTimeout(this.keyDownTimerId_);

                this.keyDownTimerId_ = setTimeout((function() {
                    this.keyDownTimerId_ = null;
                    this.strSearch_ = "";
                }).bind(this), 300);

                var ind = this.searchByStrIndex_(0);

                if (ind > -1) {
                    if(currentIndex != -1) {
                        items[currentIndex].classList.remove(this.CssClasses_.IS_SELECTED);
                    }
                    selectedItem = items[ind];
                    selectedItem.classList.add(this.CssClasses_.IS_SELECTED);
                    this.listOptionBox_.scrollTop = selectedItem.offsetTop;
                    this.lastSelectedItem_ = selectedItem;
                }
            }
        }
    };

    MaterialSelectfield.prototype.searchByStrIndex_ = function(key) {
        var srchStr = this.strSearch_;
        var isPresent = new RegExp('^' + srchStr +'.');
        var indx = -1;
        var arr = this.optionsArr_;

        for(var i = 0; i < arr.length; i++) {
            if(isPresent.test(arr[i])) {
                indx = i;
                break;
            }
        }

        return indx != -1 ? this.optionsMap_[this.optionsArr_[indx]] : -1;
    };

    MaterialSelectfield.prototype.validKeyCode_ = function(keycode) {
        return (keycode > 47 && keycode < 58)   || // number keys
            keycode == 32 || keycode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
            (keycode > 64 && keycode < 91)   || // letter keys
            (keycode > 95 && keycode < 112)  || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode > 218 && keycode < 223);   // [\]' (in order)
    };

    MaterialSelectfield.prototype.hide_ = function() {
        this.element_.classList.remove(this.CssClasses_.IS_FOCUSED);
        this.closing_ = true;
        this.strSearch_ = "";
        this.boundClickDocHandler_ && document.removeEventListener('click', this.boundClickDocHandler_);
        this.boundKeyDownHandler_ && document.removeEventListener('keydown', this.boundKeyDownHandler_);
        this.update_();
    };

    MaterialSelectfield.prototype.init = function () {
        if (this.element_) {
            this.element_.classList.remove(this.CssClasses_.IS_DIRTY);
            this.lastSelectedItem_ = null;
            this.label_ = this.element_.querySelector('.' + this.CssClasses_.LABEL);
            this.select_ = this.element_.querySelector('.' + this.CssClasses_.SELECT);
            var selectedOption = document.createElement('div');
            selectedOption.classList.add(this.CssClasses_.SELECTED_BOX);
            selectedOption.tabIndex = 1;
            this.selectedOption_ = selectedOption;
            var icon = document.createElement('i');
            icon.classList.add('material-icons');
            icon.tabIndex = -1;
            icon.textContent = 'arrow_drop_down';
            selectedOption.appendChild(icon);
            var value = document.createElement('span');
            value.classList.add(this.CssClasses_.SELECTED_BOX_VALUE);
            value.tabIndex = -1;
            selectedOption.appendChild(value);
            this.selectedOptionValue_ = value;
            this.element_.appendChild(this.selectedOption_);

            var invalid = this.element_.classList.contains(this.CssClasses_.IS_INVALID);

            this.makeElements_();

            this.boundClickHandler = this.onClick_.bind(this);
            this.boundFocusHandler = this.onFocus_.bind(this);
            this.boundBlurHandler = this.onBlur_.bind(this);
            this.element_.addEventListener('click', this.boundClickHandler);
            this.select_.addEventListener('focus', this.boundFocusHandler);
            this.select_.addEventListener('blur', this.boundBlurHandler);
            if (invalid) {
                this.element_.classList.add(this.CssClasses_.IS_INVALID);
            }
            this.checkDisabled();
        }
    };

    MaterialSelectfield.prototype.refreshOptions = function () {
        this.mdlDowngrade_();
        this.setDefaults_();
        this.init();
    };

    MaterialSelectfield.prototype.clearElements_ = function () {

    };

    MaterialSelectfield.prototype.makeElements_ = function () {
        if (this.select_) {
            this.options_ = this.select_.querySelectorAll('option');
            this.select_.style.opacity = "0";
            this.select_.style.zIndex = "-1";

            if(this.options_.length == 0) {
                this.options_ = [document.createElement('option')]
            }

            if (this.options_.length) {
                var listOptionBox = document.createElement('div')
                    ,ul = '<ul tabindex="-1">'
                    ,liHTML = ''
                    ;

                listOptionBox.classList.add(this.CssClasses_.LIST_OPTION_BOX);
                listOptionBox.tabIndex = '-1';

                for (var i = 0; i < this.options_.length; i++) {
                    var item = this.options_[i]
                        ,itemText = (item.textContent || '').toUpperCase().replace(/( )|(\n)/g, "")
                        ,liClass = ''
                        ;

                    this.optionsMap_[itemText] = i;
                    this.optionsArr_.push(itemText);

                    if(item.selected && item.textContent !== "") {
                        this.element_.classList.add(this.CssClasses_.IS_DIRTY);
                        this.selectedOptionValue_.textContent = item.textContent;
                        liClass += this.CssClasses_.IS_SELECTED;
                    }

                    if(item.disabled) {
                        liClass += liClass != '' ? ' ' + this.CssClasses_.IS_DISABLED : this.CssClasses_.IS_DISABLED
                    }

                    liHTML += '<li class="' + liClass + '" data-value="'+ i +'" tabindex="-1">' + item.textContent + '</li>';
                }

                ul += liHTML + '</ul>';

                listOptionBox.innerHTML = ul;
                this.element_.appendChild(listOptionBox);
                this.listOptionBox_ = listOptionBox;

                if(window.MutationObserver) {
                    this.observer_ = new MutationObserver(function (mutations) {
                        mutations.forEach(function (mutation) {
                            if (mutation.type == 'childList') {
                                this.refreshOptions()
                            }
                        }.bind(this));
                    }.bind(this));
                    this.observer_.observe(this.select_, {attributes: true, childList: true, characterData: true})
                }
            }
        }
    };

    MaterialSelectfield.prototype.mdlDowngrade_ = function() {
        this.element_.removeEventListener('click', this.boundClickHandler);
        this.select_.removeEventListener('focus', this.boundFocusHandler);
        this.select_.removeEventListener('blur', this.boundBlurHandler);
        this.listOptionBox_ && this.element_.removeChild(this.listOptionBox_);
        this.selectedOption_ && this.element_.removeChild(this.selectedOption_);
        this.element_.removeAttribute('data-upgraded');
        this.select_.style.opacity = "1";
        this.select_.style.zIndex = "inherit";
        this.observer_ && this.observer_.disconnect();
    };

    /**
     * Public alias for the downgrade method.
     *
     * @public
     */
    MaterialSelectfield.prototype.mdlDowngrade =
        MaterialSelectfield.prototype.mdlDowngrade_;

    MaterialSelectfield.prototype['mdlDowngrade'] =
        MaterialSelectfield.prototype.mdlDowngrade;

    componentHandler.register({
        constructor: MaterialSelectfield,
        classAsString: 'MaterialSelectfield',
        cssClass: 'mdl-js-selectfield',
        widget: true
    });
})();

(function() {
    'use strict';

    /**
     * Class constructor for Ripple MDL component.
     * Implements MDL component design pattern defined at:
     * https://github.com/jasonmayes/mdl-component-design-pattern
     *
     * @constructor
     * @param {HTMLElement} element The element that will be upgraded.
     */
    var MaterialRipple = function MaterialRipple(element) {
        this.element_ = element;

        // Initialize instance.
        this.init();
    };
    window['MaterialRipple'] = MaterialRipple;

    /**
     * Store constants in one place so they can be updated easily.
     *
     * @enum {string | number}
     * @private
     */
    MaterialRipple.prototype.Constant_ = {
        INITIAL_SCALE: 'scale(0.0001, 0.0001)',
        INITIAL_SIZE: '1px',
        INITIAL_OPACITY: '0.4',
        FINAL_OPACITY: '0',
        FINAL_SCALE: ''
    };

    /**
     * Store strings for class names defined by this component that are used in
     * JavaScript. This allows us to simply change it in one place should we
     * decide to modify at a later date.
     *
     * @enum {string}
     * @private
     */
    MaterialRipple.prototype.CssClasses_ = {
        RIPPLE_CENTER: 'mdl-ripple--center',
        RIPPLE_EFFECT_IGNORE_EVENTS: 'mdl-js-ripple-effect--ignore-events',
        RIPPLE: 'mdl-ripple',
        IS_ANIMATING: 'is-animating',
        IS_VISIBLE: 'is-visible'
    };

    /**
     * Handle mouse / finger down on element.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialRipple.prototype.downHandler_ = function(event) {
        if (!this.rippleElement_.style.width && !this.rippleElement_.style.height) {
            var rect = this.element_.getBoundingClientRect();
            this.boundHeight = rect.height;
            this.boundWidth = rect.width;
            this.rippleSize_ = Math.sqrt(rect.width * rect.width +
                    rect.height * rect.height) * 2 + 2;
            this.rippleElement_.style.width = this.rippleSize_ + 'px';
            this.rippleElement_.style.height = this.rippleSize_ + 'px';
        }

        this.rippleElement_.classList.add(this.CssClasses_.IS_VISIBLE);

        if (event.type === 'mousedown' && this.ignoringMouseDown_) {
            this.ignoringMouseDown_ = false;
        } else {
            if (event.type === 'touchstart') {
                this.ignoringMouseDown_ = true;
            }
            var frameCount = this.getFrameCount();
            if (frameCount > 0) {
                return;
            }
            this.setFrameCount(1);
            var bound = event.currentTarget.getBoundingClientRect();
            var x;
            var y;
            // Check if we are handling a keyboard click.
            if (event.clientX === 0 && event.clientY === 0) {
                x = Math.round(bound.width / 2);
                y = Math.round(bound.height / 2);
            } else {
                var clientX = event.clientX ? event.clientX : event.touches[0].clientX;
                var clientY = event.clientY ? event.clientY : event.touches[0].clientY;
                x = Math.round(clientX - bound.left);
                y = Math.round(clientY - bound.top);
            }
            this.setRippleXY(x, y);
            this.setRippleStyles(true);
            requestAnimationFrame(this.animFrameHandler.bind(this));
        }
    };

    /**
     * Handle mouse / finger up on element.
     *
     * @param {Event} event The event that fired.
     * @private
     */
    MaterialRipple.prototype.upHandler_ = function(event) {
        // Don't fire for the artificial "mouseup" generated by a double-click.
        if (event && event.detail !== 2) {
            // Allow a repaint to occur before removing this class, so the animation
            // shows for tap events, which seem to trigger a mouseup too soon after
            // mousedown.
            window.setTimeout(function() {
                this.rippleElement_.classList.remove(this.CssClasses_.IS_VISIBLE);
            }.bind(this), 0);
        }
    };

    /**
     * Initialize element.
     */
    MaterialRipple.prototype.init = function() {
        if (this.element_) {
            var recentering =
                this.element_.classList.contains(this.CssClasses_.RIPPLE_CENTER);
            if (!this.element_.classList.contains(
                    this.CssClasses_.RIPPLE_EFFECT_IGNORE_EVENTS)) {
                this.rippleElement_ = this.element_.querySelector('.' +
                    this.CssClasses_.RIPPLE);
                this.frameCount_ = 0;
                this.rippleSize_ = 0;
                this.x_ = 0;
                this.y_ = 0;

                // Touch start produces a compat mouse down event, which would cause a
                // second ripples. To avoid that, we use this property to ignore the first
                // mouse down after a touch start.
                this.ignoringMouseDown_ = false;

                this.boundDownHandler = this.downHandler_.bind(this);
                this.element_.addEventListener('mousedown',
                    this.boundDownHandler);
                this.element_.addEventListener('touchstart',
                    this.boundDownHandler);

                this.boundUpHandler = this.upHandler_.bind(this);
                this.element_.addEventListener('mouseup', this.boundUpHandler);
                this.element_.addEventListener('mouseleave', this.boundUpHandler);
                this.element_.addEventListener('touchend', this.boundUpHandler);
                this.element_.addEventListener('blur', this.boundUpHandler);

                /**
                 * Getter for frameCount_.
                 * @return {number} the frame count.
                 */
                this.getFrameCount = function() {
                    return this.frameCount_;
                };

                /**
                 * Setter for frameCount_.
                 * @param {number} fC the frame count.
                 */
                this.setFrameCount = function(fC) {
                    this.frameCount_ = fC;
                };

                /**
                 * Getter for rippleElement_.
                 * @return {Element} the ripple element.
                 */
                this.getRippleElement = function() {
                    return this.rippleElement_;
                };

                /**
                 * Sets the ripple X and Y coordinates.
                 * @param  {number} newX the new X coordinate
                 * @param  {number} newY the new Y coordinate
                 */
                this.setRippleXY = function(newX, newY) {
                    this.x_ = newX;
                    this.y_ = newY;
                };

                /**
                 * Sets the ripple styles.
                 * @param  {boolean} start whether or not this is the start frame.
                 */
                this.setRippleStyles = function(start) {
                    if (this.rippleElement_ !== null) {
                        var transformString;
                        var scale;
                        var offset = 'translate(' + this.x_ + 'px, ' + this.y_ + 'px)';

                        if (start) {
                            scale = this.Constant_.INITIAL_SCALE;
                        } else {
                            scale = this.Constant_.FINAL_SCALE;
                            if (recentering) {
                                offset = 'translate(' + this.boundWidth / 2 + 'px, ' +
                                    this.boundHeight / 2 + 'px)';
                            }
                        }

                        transformString = 'translate(-50%, -50%) ' + offset + scale;

                        this.rippleElement_.style.webkitTransform = transformString;
                        this.rippleElement_.style.msTransform = transformString;
                        this.rippleElement_.style.transform = transformString;

                        if (start) {
                            this.rippleElement_.classList.remove(
                                this.CssClasses_.IS_ANIMATING);
                        } else {
                            this.rippleElement_.classList.add(this.CssClasses_.IS_ANIMATING);
                        }
                    }
                };

                /**
                 * Handles an animation frame.
                 */
                this.animFrameHandler = function() {
                    if (this.frameCount_-- > 0) {
                        requestAnimationFrame(this.animFrameHandler.bind(this));
                    } else {
                        this.setRippleStyles(false);
                    }
                };
            }
        }
    };

    // The component registers itself. It can assume componentHandler is available
    // in the global scope.
    componentHandler.register({
        constructor: MaterialRipple,
        classAsString: 'MaterialRipple',
        cssClass: 'mdl-js-ripple-effect',
        widget: false
    });
})();

(function() {
    'use strict';

    /**
     * Class constructor for Snackbar MDL component.
     * Implements MDL component design pattern defined at:
     * https://github.com/jasonmayes/mdl-component-design-pattern
     *
     * @constructor
     * @param {HTMLElement} element The element that will be upgraded.
     */
    var MaterialSnackbar = function MaterialSnackbar(element) {
        this.element_ = element;
        this.textElement_ = this.element_.querySelector('.' + this.cssClasses_.MESSAGE);
        this.actionElement_ = this.element_.querySelector('.' + this.cssClasses_.ACTION);
        if (!this.textElement_) {
            throw new Error('There must be a message element for a snackbar.');
        }
        if (!this.actionElement_) {
            throw new Error('There must be an action element for a snackbar.');
        }
        this.active = false;
        this.actionHandler_ = undefined;
        this.message_ = undefined;
        this.actionText_ = undefined;
        this.timeoutID_ = undefined;
        this.queuedNotifications_ = [];
        this.setActionHidden_(true);
    };
    window['MaterialSnackbar'] = MaterialSnackbar;

    /**
     * Store constants in one place so they can be updated easily.
     *
     * @enum {string | number}
     * @private
     */
    MaterialSnackbar.prototype.Constant_ = {
        // The duration of the snackbar show/hide animation, in ms.
        ANIMATION_LENGTH: 250
    };

    /**
     * Store strings for class names defined by this component that are used in
     * JavaScript. This allows us to simply change it in one place should we
     * decide to modify at a later date.
     *
     * @enum {string}
     * @private
     */
    MaterialSnackbar.prototype.cssClasses_ = {
        SNACKBAR: 'mdl-snackbar',
        MESSAGE: 'mdl-snackbar__text',
        ACTION: 'mdl-snackbar__action',
        ACTIVE: 'mdl-snackbar--active'
    };

    /**
     * Display the snackbar.
     *
     * @private
     */
    MaterialSnackbar.prototype.displaySnackbar_ = function() {
        this.element_.setAttribute('aria-hidden', 'true');

        if (this.actionHandler_) {
            this.actionElement_.textContent = this.actionText_;
            this.actionElement_.addEventListener('click', this.actionHandler_);
            this.setActionHidden_(false);
        }

        this.textElement_.textContent = this.message_;
        this.element_.classList.add(this.cssClasses_.ACTIVE);
        this.element_.setAttribute('aria-hidden', 'false');
        this.timeoutID_ = setTimeout(this.cleanup_.bind(this), this.timeout_);

    };

    /**
     * Show the snackbar.
     *
     * @param {Object} data The data for the notification.
     * @public
     */
    MaterialSnackbar.prototype.showSnackbar = function(data) {
        if (data === undefined) {
            throw new Error(
                'Please provide a data object with at least a message to display.');
        }
        if (data['message'] === undefined) {
            throw new Error('Please provide a message to be displayed.');
        }
        if (data['actionHandler'] && !data['actionText']) {
            throw new Error('Please provide action text with the handler.');
        }
        if (this.active) {
            this.queuedNotifications_.push(data);
        } else {
            this.active = true;
            this.message_ = data['message'];
            if (data['timeout']) {
                this.timeout_ = data['timeout'];
            } else {
                this.timeout_ = 2750;
            }
            if (data['actionHandler']) {
                this.actionHandler_ = data['actionHandler'];
            }
            if (data['actionText']) {
                this.actionText_ = data['actionText'];
            }
            this.displaySnackbar_();
        }
    };
    MaterialSnackbar.prototype['showSnackbar'] = MaterialSnackbar.prototype.showSnackbar;
    /**
     * Hide the snackbar.
     *
     * @public
     */
    MaterialSnackbar.prototype.hideSnackbar = function() {
        if (!this.active) {
            return;
        }
        if (typeof this.timeoutID_ === 'number') {
            clearTimeout(this.timeoutID_);
            this.cleanup_();
        }
    };
    MaterialSnackbar.prototype['hideSnackbar'] = MaterialSnackbar.prototype.hideSnackbar;
    /**
     * Check if the queue has items within it.
     * If it does, display the next entry.
     *
     * @private
     */
    MaterialSnackbar.prototype.checkQueue_ = function() {
        if (this.queuedNotifications_.length > 0) {
            this.showSnackbar(this.queuedNotifications_.shift());
        }
    };

    /**
     * Cleanup the snackbar event listeners and accessiblity attributes.
     *
     * @private
     */
    MaterialSnackbar.prototype.cleanup_ = function() {
        this.element_.classList.remove(this.cssClasses_.ACTIVE);
        setTimeout(function() {
            this.element_.setAttribute('aria-hidden', 'true');
            this.textElement_.textContent = '';
            if (!Boolean(this.actionElement_.getAttribute('aria-hidden'))) {
                this.setActionHidden_(true);
                this.actionElement_.textContent = '';
                this.actionElement_.removeEventListener('click', this.actionHandler_);
            }
            this.actionHandler_ = undefined;
            this.message_ = undefined;
            this.actionText_ = undefined;
            this.timeoutID_ = undefined;
            this.active = false;
            this.checkQueue_();
        }.bind(this), /** @type {number} */ (this.Constant_.ANIMATION_LENGTH));
    };

    /**
     * Set the action handler hidden state.
     *
     * @param {boolean} value
     * @private
     */
    MaterialSnackbar.prototype.setActionHidden_ = function(value) {
        if (value) {
            this.actionElement_.setAttribute('aria-hidden', 'true');
        } else {
            this.actionElement_.removeAttribute('aria-hidden');
        }
    };

    // The component registers itself. It can assume componentHandler is available
    // in the global scope.
    componentHandler.register({
        constructor: MaterialSnackbar,
        classAsString: 'MaterialSnackbar',
        cssClass: 'mdl-js-snackbar',
        widget: true
    });

})();
/* Copyright (c) 2010-2016 Marcus Westin */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.store = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
    (function (global){
        "use strict";module.exports=function(){function e(){try{return o in n&&n[o]}catch(e){return!1}}var t,r={},n="undefined"!=typeof window?window:global,i=n.document,o="localStorage",a="script";if(r.disabled=!1,r.version="1.3.20",r.set=function(e,t){},r.get=function(e,t){},r.has=function(e){return void 0!==r.get(e)},r.remove=function(e){},r.clear=function(){},r.transact=function(e,t,n){null==n&&(n=t,t=null),null==t&&(t={});var i=r.get(e,t);n(i),r.set(e,i)},r.getAll=function(){},r.forEach=function(){},r.serialize=function(e){return JSON.stringify(e)},r.deserialize=function(e){if("string"==typeof e)try{return JSON.parse(e)}catch(t){return e||void 0}},e())t=n[o],r.set=function(e,n){return void 0===n?r.remove(e):(t.setItem(e,r.serialize(n)),n)},r.get=function(e,n){var i=r.deserialize(t.getItem(e));return void 0===i?n:i},r.remove=function(e){t.removeItem(e)},r.clear=function(){t.clear()},r.getAll=function(){var e={};return r.forEach(function(t,r){e[t]=r}),e},r.forEach=function(e){for(var n=0;n<t.length;n++){var i=t.key(n);e(i,r.get(i))}};else if(i&&i.documentElement.addBehavior){var c,u;try{u=new ActiveXObject("htmlfile"),u.open(),u.write("<"+a+">document.w=window</"+a+'><iframe src="/favicon.ico"></iframe>'),u.close(),c=u.w.frames[0].document,t=c.createElement("div")}catch(l){t=i.createElement("div"),c=i.body}var f=function(e){return function(){var n=Array.prototype.slice.call(arguments,0);n.unshift(t),c.appendChild(t),t.addBehavior("#default#userData"),t.load(o);var i=e.apply(r,n);return c.removeChild(t),i}},d=new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]","g"),s=function(e){return e.replace(/^d/,"___$&").replace(d,"___")};r.set=f(function(e,t,n){return t=s(t),void 0===n?r.remove(t):(e.setAttribute(t,r.serialize(n)),e.save(o),n)}),r.get=f(function(e,t,n){t=s(t);var i=r.deserialize(e.getAttribute(t));return void 0===i?n:i}),r.remove=f(function(e,t){t=s(t),e.removeAttribute(t),e.save(o)}),r.clear=f(function(e){var t=e.XMLDocument.documentElement.attributes;e.load(o);for(var r=t.length-1;r>=0;r--)e.removeAttribute(t[r].name);e.save(o)}),r.getAll=function(e){var t={};return r.forEach(function(e,r){t[e]=r}),t},r.forEach=f(function(e,t){for(var n,i=e.XMLDocument.documentElement.attributes,o=0;n=i[o];++o)t(n.name,r.deserialize(e.getAttribute(n.name)))})}try{var v="__storejs__";r.set(v,v),r.get(v)!=v&&(r.disabled=!0),r.remove(v)}catch(l){r.disabled=!0}return r.enabled=!r.disabled,r}();
    }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});
var jqOAuth = function jqOAuth(options) {
    this.options = {};
    this.data = {};
    this.intercept = false;
    this.refreshing = false;
    this.buffer = [];
    this.currentRequests = [];

    this._resetOptions();
    this._setupInterceptor();

    $.extend(this.options, options);

    if (this._hasStoredData()) {
        this._getStoredData();

        if (this.hasAccessToken()) {
            this.login(this.data.accessToken, this.data.refreshToken);
        }
    } else {
        this._resetData();
        this._updateStorage();
    }

    if (options.csrfToken !== null) {
        this._setCsrfHeader();
    }
}

// Public methods

jqOAuth.prototype.getAccessToken = function getAccessToken() {
    return this.data.accessToken;
};

jqOAuth.prototype.hasAccessToken = function hasAccessToken() {
    return this.data.accessToken !== null;
};

jqOAuth.prototype.logout = function logout() {
    this._resetData();
    this._updateStorage();
    this._deactivateInterceptor();
    this._removeAjaxHeader("Authorization");
    this._fireEvent("logout");
};

jqOAuth.prototype.login = function login(accessToken, refreshToken) {
    this.setAccessToken(accessToken, refreshToken);

    this._activateInterceptor();
    this._fireEvent("login");
};

jqOAuth.prototype.setAccessToken = function setAccessToken(accessToken, refreshToken) {
    this.data.accessToken = accessToken;
    this.data.refreshToken = refreshToken;

    this._setAuthorizationHeader();
    this._updateStorage();
};

jqOAuth.prototype.setCsrfToken = function setCsrfToken(csrfToken) {
    this.options.csrfToken = csrfToken;

    this._setCsrfHeader();
};

// Private methods

jqOAuth.prototype._activateInterceptor = function _activateInterceptor() {
    this.intercept = true;
};

jqOAuth.prototype._addToBuffer = function _addToBuffer(settings, deferred) {
    this.buffer.push({
        deferred: deferred,
        settings: settings
    });
};

jqOAuth.prototype._clearBuffer = function _clearBuffer() {
    this.buffer = [];
};

jqOAuth.prototype._deactivateInterceptor = function _deactivateInterceptor() {
    this.intercept = false;
};

jqOAuth.prototype._fireBuffer = function _fireBuffer() {
    var self = this;
    var deferred;
    var promises = [];

    for(var i in this.buffer) {
        deferred = this.buffer[i].deferred;

        this.buffer[i].settings.refreshRetry = true;
        this.buffer[i].settings.headers["Authorization"] = $.ajaxSettings.headers["Authorization"];

        promises.push($.ajax(this.buffer[i].settings).then(deferred.resolve, deferred.reject));
    }

    this._clearBuffer();

    $.when.apply($, promises)
        .done(function() {
            self._setRefreshingFlag(false);
        })
        .fail(function(){
            self._setRefreshingFlag(false);
            self.logout();
        });
};

jqOAuth.prototype._fireEvent = function _fireEvent(eventType) {
    if (this._hasEvent(eventType)) {
        return this.options.events[eventType]();
    }
};

jqOAuth.prototype._getStoredData = function _getStoredData() {
    $.extend(this.data, store.get(this.options.tokenName));
};

jqOAuth.prototype._hasEvent = function _hasEvent(eventType) {
    return this.options.events[eventType] !== undefined && typeof this.options.events[eventType] === "function";
};

jqOAuth.prototype._hasStoredData = function _hasStoredData() {
    return store.get(this.options.tokenName) !== undefined;
};

jqOAuth.prototype._isAjaxHeadersInitialized = function _isAjaxHeadersInitialized() {
    return $.ajaxSettings.headers !== undefined;
};

jqOAuth.prototype._removeAjaxHeader = function _removeAjaxHeader(header) {
    if (!this._isAjaxHeadersInitialized()) {
        return true;
    }
    $.ajaxSettings.headers[header] = undefined;
};

jqOAuth.prototype._removeAllAjaxHeaders = function _removeAllAjaxHeaders() {
    this._removeAjaxHeader("Authorization");
    this._removeAjaxHeader("X-CSRF-Token");
};

jqOAuth.prototype._resetData = function _resetData() {
    this.data = {
        accessToken: null
    };
};

jqOAuth.prototype._resetOptions = function _resetOptions() {
    this.options = {
        bufferInterval: 25,
        bufferWaitLimit: 500,
        csrfToken: null,
        events: {},
        tokenName: 'jquery.oauth'
    };

    this._removeAllAjaxHeaders();
};

jqOAuth.prototype._setAjaxHeader = function _setAjaxHeader(header, value) {
    if (!this._isAjaxHeadersInitialized()) {
        $.ajaxSettings.headers = {};
    }

    $.ajaxSettings.headers[header] = value;
};

jqOAuth.prototype._setAuthorizationHeader = function _setAuthorizationHeader() {
    this._setAjaxHeader("Authorization", "Bearer " + this.data.accessToken);
};

jqOAuth.prototype._setCsrfHeader = function _setCsrfHeader() {
    this._setAjaxHeader("X-CSRF-Token", this.options.csrfToken);
};

jqOAuth.prototype._setRefreshingFlag = function _setRefreshingFlag(newFlag) {
    this.refreshing = newFlag;
};

jqOAuth.prototype._setupInterceptor = function _setupInterceptor() {
    var self = this;

    // Credits to gnarf @ http://stackoverflow.com/a/12446363/602488
    $.ajaxPrefilter(function(options, originalOptions, jqxhr) {
      //  options.data = $.extend(originalOptions.data, { client_id: 'mobileV1', client_secret: 'abc123456' });
   //     options.data = options.data + '&client_id=mobileV1&client_secret=abc123456';

        if (options.refreshRetry === true) {
            return;
        }

        var data = originalOptions.data;
        if (originalOptions.data !== undefined) {
            if (Object.prototype.toString.call(originalOptions.data) === '[object String]') {
                data = $.deparam(originalOptions.data); // see http://benalman.com/code/projects/jquery-bbq/examples/deparam/
            }
        } else {
            data = {};
        }

        if (options.url !== '/api/pupils/request' && options.url !== '/api/pupils/diplom') {
            options.data = $.param($.extend(data, {client_id: 'mobileV1', client_secret: 'abc123456'}));
        }

        var deferred = $.Deferred();

        self.currentRequests.push(options.url);
        jqxhr.always(function(){
            self.currentRequests.splice($.inArray(options.url, self.currentRequests), 1);
        });
        jqxhr.done(deferred.resolve);
        jqxhr.fail(function() {
            var args = Array.prototype.slice.call(arguments);

            if (self.intercept && jqxhr.status === 401 && self._hasEvent("tokenExpiration")) {
                self._addToBuffer(options, deferred);

                if (!self.refreshing) {
                    self._setRefreshingFlag(true);
                    self._fireEvent("tokenExpiration")
                        .success(function () {
                            // Setup buffer interval that waits for all sent requests to return
                            var waited   = 0;
                            self.interval = setInterval(function(){
                                waited += self.options.bufferInterval;

                                // All requests have returned 401 and have been buffered
                                if (self.currentRequests.length === 0 || waited >= self.options.bufferWaitLimit) {
                                    clearInterval(self.interval);
                                    self._fireBuffer();
                                }
                            }, self.options.bufferInterval);
                        })
                        .fail(function () {
                            self.logout();
                        });
                }
            } else {
                deferred.rejectWith(jqxhr, args);
            }
        });

        return deferred.promise(jqxhr);
    });
};

jqOAuth.prototype._updateStorage = function _updateStorage() {
    store.set(this.options.tokenName, this.data);
};
(function() {

    // nb. This is for IE10 and lower _only_.
    var supportCustomEvent = window.CustomEvent;
    if (!supportCustomEvent || typeof supportCustomEvent == 'object') {
        supportCustomEvent = function CustomEvent(event, x) {
            x = x || {};
            var ev = document.createEvent('CustomEvent');
            ev.initCustomEvent(event, !!x.bubbles, !!x.cancelable, x.detail || null);
            return ev;
        };
        supportCustomEvent.prototype = window.Event.prototype;
    }

    /**
     * @param {Element} el to check for stacking context
     * @return {boolean} whether this el or its parents creates a stacking context
     */
    function createsStackingContext(el) {
        while (el && el !== document.body) {
            var s = window.getComputedStyle(el);
            var invalid = function(k, ok) {
                return !(s[k] === undefined || s[k] === ok);
            }
            if (s.opacity < 1 ||
                invalid('zIndex', 'auto') ||
                invalid('transform', 'none') ||
                invalid('mixBlendMode', 'normal') ||
                invalid('filter', 'none') ||
                invalid('perspective', 'none') ||
                s['isolation'] === 'isolate' ||
                s.position === 'fixed' ||
                s.webkitOverflowScrolling === 'touch') {
                return true;
            }
            el = el.parentElement;
        }
        return false;
    }

    /**
     * Finds the nearest <dialog> from the passed element.
     *
     * @param {Element} el to search from
     * @return {HTMLDialogElement} dialog found
     */
    function findNearestDialog(el) {
        while (el) {
            if (el.localName === 'dialog') {
                return /** @type {HTMLDialogElement} */ (el);
            }
            el = el.parentElement;
        }
        return null;
    }

    /**
     * Blur the specified element, as long as it's not the HTML body element.
     * This works around an IE9/10 bug - blurring the body causes Windows to
     * blur the whole application.
     *
     * @param {Element} el to blur
     */
    function safeBlur(el) {
        if (el && el.blur && el != document.body) {
            el.blur();
        }
    }

    /**
     * @param {!NodeList} nodeList to search
     * @param {Node} node to find
     * @return {boolean} whether node is inside nodeList
     */
    function inNodeList(nodeList, node) {
        for (var i = 0; i < nodeList.length; ++i) {
            if (nodeList[i] == node) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param {!HTMLDialogElement} dialog to upgrade
     * @constructor
     */
    function dialogPolyfillInfo(dialog) {
        this.dialog_ = dialog;
        this.replacedStyleTop_ = false;
        this.openAsModal_ = false;

        // Set a11y role. Browsers that support dialog implicitly know this already.
        if (!dialog.hasAttribute('role')) {
            dialog.setAttribute('role', 'dialog');
        }

        dialog.show = this.show.bind(this);
        dialog.showModal = this.showModal.bind(this);
        dialog.close = this.close.bind(this);

        if (!('returnValue' in dialog)) {
            dialog.returnValue = '';
        }

        if ('MutationObserver' in window) {
            var mo = new MutationObserver(this.maybeHideModal.bind(this));
            mo.observe(dialog, {attributes: true, attributeFilter: ['open']});
        } else {
            // IE10 and below support. Note that DOMNodeRemoved etc fire _before_ removal. They also
            // seem to fire even if the element was removed as part of a parent removal. Use the removed
            // events to force downgrade (useful if removed/immediately added).
            var removed = false;
            var cb = function() {
                removed ? this.downgradeModal() : this.maybeHideModal();
                removed = false;
            }.bind(this);
            var timeout;
            var delayModel = function(ev) {
                var cand = 'DOMNodeRemoved';
                removed |= (ev.type.substr(0, cand.length) === cand);
                window.clearTimeout(timeout);
                timeout = window.setTimeout(cb, 0);
            };
            ['DOMAttrModified', 'DOMNodeRemoved', 'DOMNodeRemovedFromDocument'].forEach(function(name) {
                dialog.addEventListener(name, delayModel);
            });
        }
        // Note that the DOM is observed inside DialogManager while any dialog
        // is being displayed as a modal, to catch modal removal from the DOM.

        Object.defineProperty(dialog, 'open', {
            set: this.setOpen.bind(this),
            get: dialog.hasAttribute.bind(dialog, 'open')
        });

        this.backdrop_ = document.createElement('div');
        this.backdrop_.className = 'backdrop';
        this.backdrop_.addEventListener('click', this.backdropClick_.bind(this));
    }

    dialogPolyfillInfo.prototype = {

        get dialog() {
            return this.dialog_;
        },

        /**
         * Maybe remove this dialog from the modal top layer. This is called when
         * a modal dialog may no longer be tenable, e.g., when the dialog is no
         * longer open or is no longer part of the DOM.
         */
        maybeHideModal: function() {
            if (this.dialog_.hasAttribute('open') && document.body.contains(this.dialog_)) { return; }
            this.downgradeModal();
        },

        /**
         * Remove this dialog from the modal top layer, leaving it as a non-modal.
         */
        downgradeModal: function() {
            if (!this.openAsModal_) { return; }
            this.openAsModal_ = false;
            this.dialog_.style.zIndex = '';

            // This won't match the native <dialog> exactly because if the user set top on a centered
            // polyfill dialog, that top gets thrown away when the dialog is closed. Not sure it's
            // possible to polyfill this perfectly.
            if (this.replacedStyleTop_) {
                this.dialog_.style.top = '';
                this.replacedStyleTop_ = false;
            }

            // Clear the backdrop and remove from the manager.
            this.backdrop_.parentNode && this.backdrop_.parentNode.removeChild(this.backdrop_);
            dialogPolyfill.dm.removeDialog(this);
        },

        /**
         * @param {boolean} value whether to open or close this dialog
         */
        setOpen: function(value) {
            if (value) {
                this.dialog_.hasAttribute('open') || this.dialog_.setAttribute('open', '');
            } else {
                this.dialog_.removeAttribute('open');
                this.maybeHideModal();  // nb. redundant with MutationObserver
            }
        },

        /**
         * Handles clicks on the fake .backdrop element, redirecting them as if
         * they were on the dialog itself.
         *
         * @param {!Event} e to redirect
         */
        backdropClick_: function(e) {
            if (!this.dialog_.hasAttribute('tabindex')) {
                // Clicking on the backdrop should move the implicit cursor, even if dialog cannot be
                // focused. Create a fake thing to focus on. If the backdrop was _before_ the dialog, this
                // would not be needed - clicks would move the implicit cursor there.
                var fake = document.createElement('div');
                this.dialog_.insertBefore(fake, this.dialog_.firstChild);
                fake.tabIndex = -1;
                fake.focus();
                this.dialog_.removeChild(fake);
            } else {
                this.dialog_.focus();
            }

            var redirectedEvent = document.createEvent('MouseEvents');
            redirectedEvent.initMouseEvent(e.type, e.bubbles, e.cancelable, window,
                e.detail, e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey,
                e.altKey, e.shiftKey, e.metaKey, e.button, e.relatedTarget);
            this.dialog_.dispatchEvent(redirectedEvent);
            e.stopPropagation();
        },

        /**
         * Focuses on the first focusable element within the dialog. This will always blur the current
         * focus, even if nothing within the dialog is found.
         */
        focus_: function() {
            // Find element with `autofocus` attribute, or fall back to the first form/tabindex control.
            var target = this.dialog_.querySelector('[autofocus]:not([disabled])');
            if (!target && this.dialog_.tabIndex >= 0) {
                target = this.dialog_;
            }
            if (!target) {
                // Note that this is 'any focusable area'. This list is probably not exhaustive, but the
                // alternative involves stepping through and trying to focus everything.
                var opts = ['button', 'input', 'keygen', 'select', 'textarea'];
                var query = opts.map(function(el) {
                    return el + ':not([disabled])';
                });
                // TODO(samthor): tabindex values that are not numeric are not focusable.
                query.push('[tabindex]:not([disabled]):not([tabindex=""])');  // tabindex != "", not disabled
                target = this.dialog_.querySelector(query.join(', '));
            }
            safeBlur(document.activeElement);
            target && target.focus();
        },

        /**
         * Sets the zIndex for the backdrop and dialog.
         *
         * @param {number} dialogZ
         * @param {number} backdropZ
         */
        updateZIndex: function(dialogZ, backdropZ) {
            if (dialogZ < backdropZ) {
                throw new Error('dialogZ should never be < backdropZ');
            }
            this.dialog_.style.zIndex = dialogZ;
            this.backdrop_.style.zIndex = backdropZ;
        },

        /**
         * Shows the dialog. If the dialog is already open, this does nothing.
         */
        show: function() {
            if (!this.dialog_.open) {
                this.setOpen(true);
                this.focus_();
            }
        },

        /**
         * Show this dialog modally.
         */
        showModal: function() {
            if (this.dialog_.hasAttribute('open')) {
                throw new Error('Failed to execute \'showModal\' on dialog: The element is already open, and therefore cannot be opened modally.');
            }
            if (!document.body.contains(this.dialog_)) {
                throw new Error('Failed to execute \'showModal\' on dialog: The element is not in a Document.');
            }
            if (!dialogPolyfill.dm.pushDialog(this)) {
                throw new Error('Failed to execute \'showModal\' on dialog: There are too many open modal dialogs.');
            }

            if (createsStackingContext(this.dialog_.parentElement)) {
                console.warn('A dialog is being shown inside a stacking context. ' +
                    'This may cause it to be unusable. For more information, see this link: ' +
                    'https://github.com/GoogleChrome/dialog-polyfill/#stacking-context');
            }

            this.setOpen(true);
            this.openAsModal_ = true;

            // Optionally center vertically, relative to the current viewport.
            if (dialogPolyfill.needsCentering(this.dialog_)) {
                dialogPolyfill.reposition(this.dialog_);
                this.replacedStyleTop_ = true;
            } else {
                this.replacedStyleTop_ = false;
            }

            // Insert backdrop.
            this.dialog_.parentNode.insertBefore(this.backdrop_, this.dialog_.nextSibling);

            // Focus on whatever inside the dialog.
            this.focus_();
        },

        /**
         * Closes this HTMLDialogElement. This is optional vs clearing the open
         * attribute, however this fires a 'close' event.
         *
         * @param {string=} opt_returnValue to use as the returnValue
         */
        close: function(opt_returnValue) {
            if (!this.dialog_.hasAttribute('open')) {
                throw new Error('Failed to execute \'close\' on dialog: The element does not have an \'open\' attribute, and therefore cannot be closed.');
            }
            this.setOpen(false);

            // Leave returnValue untouched in case it was set directly on the element
            if (opt_returnValue !== undefined) {
                this.dialog_.returnValue = opt_returnValue;
            }

            // Triggering "close" event for any attached listeners on the <dialog>.
            var closeEvent = new supportCustomEvent('close', {
                bubbles: false,
                cancelable: false
            });
            this.dialog_.dispatchEvent(closeEvent);
        }

    };

    var dialogPolyfill = {};

    dialogPolyfill.reposition = function(element) {
        var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
        var topValue = scrollTop + (window.innerHeight - element.offsetHeight) / 2;
        element.style.top = Math.max(scrollTop, topValue) + 'px';
    };

    dialogPolyfill.isInlinePositionSetByStylesheet = function(element) {
        for (var i = 0; i < document.styleSheets.length; ++i) {
            var styleSheet = document.styleSheets[i];
            var cssRules = null;
            // Some browsers throw on cssRules.
            try {
                cssRules = styleSheet.cssRules;
            } catch (e) {}
            if (!cssRules) { continue; }
            for (var j = 0; j < cssRules.length; ++j) {
                var rule = cssRules[j];
                var selectedNodes = null;
                // Ignore errors on invalid selector texts.
                try {
                    selectedNodes = document.querySelectorAll(rule.selectorText);
                } catch(e) {}
                if (!selectedNodes || !inNodeList(selectedNodes, element)) {
                    continue;
                }
                var cssTop = rule.style.getPropertyValue('top');
                var cssBottom = rule.style.getPropertyValue('bottom');
                if ((cssTop && cssTop != 'auto') || (cssBottom && cssBottom != 'auto')) {
                    return true;
                }
            }
        }
        return false;
    };

    dialogPolyfill.needsCentering = function(dialog) {
        var computedStyle = window.getComputedStyle(dialog);
        if (computedStyle.position != 'absolute') {
            return false;
        }

        // We must determine whether the top/bottom specified value is non-auto.  In
        // WebKit/Blink, checking computedStyle.top == 'auto' is sufficient, but
        // Firefox returns the used value. So we do this crazy thing instead: check
        // the inline style and then go through CSS rules.
        if ((dialog.style.top != 'auto' && dialog.style.top != '') ||
            (dialog.style.bottom != 'auto' && dialog.style.bottom != ''))
            return false;
        return !dialogPolyfill.isInlinePositionSetByStylesheet(dialog);
    };

    /**
     * @param {!Element} element to force upgrade
     */
    dialogPolyfill.forceRegisterDialog = function(element) {
        if (element.showModal) {
            console.warn('This browser already supports <dialog>, the polyfill ' +
                'may not work correctly', element);
        }
        if (element.localName !== 'dialog') {
            throw new Error('Failed to register dialog: The element is not a dialog.');
        }
        new dialogPolyfillInfo(/** @type {!HTMLDialogElement} */ (element));
    };

    /**
     * @param {!Element} element to upgrade, if necessary
     */
    dialogPolyfill.registerDialog = function(element) {
        if (!element.showModal) {
            dialogPolyfill.forceRegisterDialog(element);
        }
    };

    /**
     * @constructor
     */
    dialogPolyfill.DialogManager = function() {
        /** @type {!Array<!dialogPolyfillInfo>} */
        this.pendingDialogStack = [];

        var checkDOM = this.checkDOM_.bind(this);

        // The overlay is used to simulate how a modal dialog blocks the document.
        // The blocking dialog is positioned on top of the overlay, and the rest of
        // the dialogs on the pending dialog stack are positioned below it. In the
        // actual implementation, the modal dialog stacking is controlled by the
        // top layer, where z-index has no effect.
        this.overlay = document.createElement('div');
        this.overlay.className = '_dialog_overlay';
        this.overlay.addEventListener('click', function(e) {
            this.forwardTab_ = undefined;
            e.stopPropagation();
            checkDOM([]);  // sanity-check DOM
        }.bind(this));

        this.handleKey_ = this.handleKey_.bind(this);
        this.handleFocus_ = this.handleFocus_.bind(this);

        this.zIndexLow_ = 100000;
        this.zIndexHigh_ = 100000 + 150;

        this.forwardTab_ = undefined;

        if ('MutationObserver' in window) {
            this.mo_ = new MutationObserver(function(records) {
                var removed = [];
                records.forEach(function(rec) {
                    for (var i = 0, c; c = rec.removedNodes[i]; ++i) {
                        if (!(c instanceof Element)) {
                            continue;
                        } else if (c.localName === 'dialog') {
                            removed.push(c);
                        } else {
                            var q = c.querySelector('dialog');
                            q && removed.push(q);
                        }
                    }
                });
                removed.length && checkDOM(removed);
            });
        }
    };

    /**
     * Called on the first modal dialog being shown. Adds the overlay and related
     * handlers.
     */
    dialogPolyfill.DialogManager.prototype.blockDocument = function() {
        document.documentElement.addEventListener('focus', this.handleFocus_, true);
        document.addEventListener('keydown', this.handleKey_);
        this.mo_ && this.mo_.observe(document, {childList: true, subtree: true});
    };

    /**
     * Called on the first modal dialog being removed, i.e., when no more modal
     * dialogs are visible.
     */
    dialogPolyfill.DialogManager.prototype.unblockDocument = function() {
        document.documentElement.removeEventListener('focus', this.handleFocus_, true);
        document.removeEventListener('keydown', this.handleKey_);
        this.mo_ && this.mo_.disconnect();
    };

    /**
     * Updates the stacking of all known dialogs.
     */
    dialogPolyfill.DialogManager.prototype.updateStacking = function() {
        var zIndex = this.zIndexHigh_;

        for (var i = 0, dpi; dpi = this.pendingDialogStack[i]; ++i) {
            dpi.updateZIndex(--zIndex, --zIndex);
            if (i === 0) {
                this.overlay.style.zIndex = --zIndex;
            }
        }

        // Make the overlay a sibling of the dialog itself.
        var last = this.pendingDialogStack[0];
        if (last) {
            var p = last.dialog.parentNode || document.body;
            p.appendChild(this.overlay);
        } else if (this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
    };

    /**
     * @param {Element} candidate to check if contained or is the top-most modal dialog
     * @return {boolean} whether candidate is contained in top dialog
     */
    dialogPolyfill.DialogManager.prototype.containedByTopDialog_ = function(candidate) {
        while (candidate = findNearestDialog(candidate)) {
            for (var i = 0, dpi; dpi = this.pendingDialogStack[i]; ++i) {
                if (dpi.dialog === candidate) {
                    return i === 0;  // only valid if top-most
                }
            }
            candidate = candidate.parentElement;
        }
        return false;
    };

    dialogPolyfill.DialogManager.prototype.handleFocus_ = function(event) {
        if (this.containedByTopDialog_(event.target)) { return; }

        event.preventDefault();
        event.stopPropagation();
        safeBlur(/** @type {Element} */ (event.target));

        if (this.forwardTab_ === undefined) { return; }  // move focus only from a tab key

        var dpi = this.pendingDialogStack[0];
        var dialog = dpi.dialog;
        var position = dialog.compareDocumentPosition(event.target);
        if (position & Node.DOCUMENT_POSITION_PRECEDING) {
            if (this.forwardTab_) {  // forward
                dpi.focus_();
            } else {  // backwards
                document.documentElement.focus();
            }
        } else {
            // TODO: Focus after the dialog, is ignored.
        }

        return false;
    };

    dialogPolyfill.DialogManager.prototype.handleKey_ = function(event) {
        this.forwardTab_ = undefined;
        if (event.keyCode === 27) {
            event.preventDefault();
            event.stopPropagation();
            var cancelEvent = new supportCustomEvent('cancel', {
                bubbles: false,
                cancelable: true
            });
            var dpi = this.pendingDialogStack[0];
            if (dpi && dpi.dialog.dispatchEvent(cancelEvent)) {
                dpi.dialog.close();
            }
        } else if (event.keyCode === 9) {
            this.forwardTab_ = !event.shiftKey;
        }
    };

    /**
     * Finds and downgrades any known modal dialogs that are no longer displayed. Dialogs that are
     * removed and immediately readded don't stay modal, they become normal.
     *
     * @param {!Array<!HTMLDialogElement>} removed that have definitely been removed
     */
    dialogPolyfill.DialogManager.prototype.checkDOM_ = function(removed) {
        // This operates on a clone because it may cause it to change. Each change also calls
        // updateStacking, which only actually needs to happen once. But who removes many modal dialogs
        // at a time?!
        var clone = this.pendingDialogStack.slice();
        clone.forEach(function(dpi) {
            if (removed.indexOf(dpi.dialog) !== -1) {
                dpi.downgradeModal();
            } else {
                dpi.maybeHideModal();
            }
        });
    };

    /**
     * @param {!dialogPolyfillInfo} dpi
     * @return {boolean} whether the dialog was allowed
     */
    dialogPolyfill.DialogManager.prototype.pushDialog = function(dpi) {
        var allowed = (this.zIndexHigh_ - this.zIndexLow_) / 2 - 1;
        if (this.pendingDialogStack.length >= allowed) {
            return false;
        }
        if (this.pendingDialogStack.unshift(dpi) === 1) {
            this.blockDocument();
        }
        this.updateStacking();
        return true;
    };

    /**
     * @param {!dialogPolyfillInfo} dpi
     */
    dialogPolyfill.DialogManager.prototype.removeDialog = function(dpi) {
        var index = this.pendingDialogStack.indexOf(dpi);
        if (index == -1) { return; }

        this.pendingDialogStack.splice(index, 1);
        if (this.pendingDialogStack.length === 0) {
            this.unblockDocument();
        }
        this.updateStacking();
    };

    dialogPolyfill.dm = new dialogPolyfill.DialogManager();

    /**
     * Global form 'dialog' method handler. Closes a dialog correctly on submit
     * and possibly sets its return value.
     */
    document.addEventListener('submit', function(ev) {
        var target = ev.target;
        if (!target || !target.hasAttribute('method')) { return; }
        if (target.getAttribute('method').toLowerCase() !== 'dialog') { return; }
        ev.preventDefault();

        var dialog = findNearestDialog(/** @type {Element} */ (ev.target));
        if (!dialog) { return; }

        // FIXME: The original event doesn't contain the element used to submit the
        // form (if any). Look in some possible places.
        var returnValue;
        var cands = [document.activeElement, ev.explicitOriginalTarget];
        var els = ['BUTTON', 'INPUT'];
        cands.some(function(cand) {
            if (cand && cand.form == ev.target && els.indexOf(cand.nodeName.toUpperCase()) != -1) {
                returnValue = cand.value;
                return true;
            }
        });
        dialog.close(returnValue);
    }, true);

    dialogPolyfill['forceRegisterDialog'] = dialogPolyfill.forceRegisterDialog;
    dialogPolyfill['registerDialog'] = dialogPolyfill.registerDialog;

    if (typeof define === 'function' && 'amd' in define) {
        // AMD support
        define(function() { return dialogPolyfill; });
    } else if (typeof module === 'object' && typeof module['exports'] === 'object') {
        // CommonJS support
        module['exports'] = dialogPolyfill;
    } else {
        // all others
        window['dialogPolyfill'] = dialogPolyfill;
    }
})();
/*!
* jquery.inputmask.bundle.js
* https://github.com/RobinHerbots/Inputmask
* Copyright (c) 2010 - 2018 Robin Herbots
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
* Version: 4.0.0-beta.29
*/
ready(function () {
    !function (modules) {
        var installedModules = {};

        function __webpack_require__(moduleId) {
            if (installedModules[moduleId]) return installedModules[moduleId].exports;
            var module = installedModules[moduleId] = {
                i: moduleId,
                l: !1,
                exports: {}
            };
            return modules[moduleId].call(module.exports, module, module.exports, __webpack_require__),
                module.l = !0, module.exports;
        }

        __webpack_require__.m = modules, __webpack_require__.c = installedModules, __webpack_require__.d = function (exports, name, getter) {
            __webpack_require__.o(exports, name) || Object.defineProperty(exports, name, {
                configurable: !1,
                enumerable: !0,
                get: getter
            });
        }, __webpack_require__.n = function (module) {
            var getter = module && module.__esModule ? function () {
                return module.default;
            } : function () {
                return module;
            };
            return __webpack_require__.d(getter, "a", getter), getter;
        }, __webpack_require__.o = function (object, property) {
            return Object.prototype.hasOwnProperty.call(object, property);
        }, __webpack_require__.p = "", __webpack_require__(__webpack_require__.s = 3);
    }([function (module, exports, __webpack_require__) {
        "use strict";
        var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
        "function" == typeof Symbol && Symbol.iterator;
        factory = function ($) {
            return $;
        }, __WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
    }, function (module, exports, __webpack_require__) {
        "use strict";
        var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory,
            _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
                return typeof obj;
            } : function (obj) {
                return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
        factory = function ($, window, document, undefined) {
            var ua = navigator.userAgent, mobile = isInputEventSupported("touchstart"), iemobile = /iemobile/i.test(ua),
                iphone = /iphone/i.test(ua) && !iemobile;

            function Inputmask(alias, options, internal) {
                if (!(this instanceof Inputmask)) return new Inputmask(alias, options, internal);
                this.el = undefined, this.events = {}, this.maskset = undefined, this.refreshValue = !1,
                !0 !== internal && ($.isPlainObject(alias) ? options = alias : (options = options || {},
                alias && (options.alias = alias)), this.opts = $.extend(!0, {}, this.defaults, options),
                    this.noMasksCache = options && options.definitions !== undefined, this.userOptions = options || {},
                    this.isRTL = this.opts.numericInput, resolveAlias(this.opts.alias, options, this.opts));
            }

            function resolveAlias(aliasStr, options, opts) {
                var aliasDefinition = Inputmask.prototype.aliases[aliasStr];
                return aliasDefinition ? (aliasDefinition.alias && resolveAlias(aliasDefinition.alias, undefined, opts),
                    $.extend(!0, opts, aliasDefinition), $.extend(!0, opts, options), !0) : (null === opts.mask && (opts.mask = aliasStr),
                    !1);
            }

            function generateMaskSet(opts, nocache) {
                function generateMask(mask, metadata, opts) {
                    var regexMask = !1;
                    if (null !== mask && "" !== mask || ((regexMask = null !== opts.regex) ? mask = (mask = opts.regex).replace(/^(\^)(.*)(\$)$/, "$2") : (regexMask = !0,
                            mask = ".*")), 1 === mask.length && !1 === opts.greedy && 0 !== opts.repeat && (opts.placeholder = ""),
                        opts.repeat > 0 || "*" === opts.repeat || "+" === opts.repeat) {
                        var repeatStart = "*" === opts.repeat ? 0 : "+" === opts.repeat ? 1 : opts.repeat;
                        mask = opts.groupmarker[0] + mask + opts.groupmarker[1] + opts.quantifiermarker[0] + repeatStart + "," + opts.repeat + opts.quantifiermarker[1];
                    }
                    var masksetDefinition,
                        maskdefKey = regexMask ? "regex_" + opts.regex : opts.numericInput ? mask.split("").reverse().join("") : mask;
                    return Inputmask.prototype.masksCache[maskdefKey] === undefined || !0 === nocache ? (masksetDefinition = {
                        mask: mask,
                        maskToken: Inputmask.prototype.analyseMask(mask, regexMask, opts),
                        validPositions: {},
                        _buffer: undefined,
                        buffer: undefined,
                        tests: {},
                        excludes: {},
                        metadata: metadata,
                        maskLength: undefined
                    }, !0 !== nocache && (Inputmask.prototype.masksCache[maskdefKey] = masksetDefinition,
                        masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[maskdefKey]))) : masksetDefinition = $.extend(!0, {}, Inputmask.prototype.masksCache[maskdefKey]),
                        masksetDefinition;
                }

                if ($.isFunction(opts.mask) && (opts.mask = opts.mask(opts)), $.isArray(opts.mask)) {
                    if (opts.mask.length > 1) {
                        if (null === opts.keepStatic) {
                            opts.keepStatic = "auto";
                            for (var i = 0; i < opts.mask.length; i++) if (opts.mask[i].charAt(0) !== opts.mask[0].charAt(0)) {
                                opts.keepStatic = !0;
                                break;
                            }
                        }
                        var altMask = opts.groupmarker[0];
                        return $.each(opts.isRTL ? opts.mask.reverse() : opts.mask, function (ndx, msk) {
                            altMask.length > 1 && (altMask += opts.groupmarker[1] + opts.alternatormarker + opts.groupmarker[0]),
                                msk.mask === undefined || $.isFunction(msk.mask) ? altMask += msk : altMask += msk.mask;
                        }), generateMask(altMask += opts.groupmarker[1], opts.mask, opts);
                    }
                    opts.mask = opts.mask.pop();
                }
                return opts.mask && opts.mask.mask !== undefined && !$.isFunction(opts.mask.mask) ? generateMask(opts.mask.mask, opts.mask, opts) : generateMask(opts.mask, opts.mask, opts);
            }

            function isInputEventSupported(eventName) {
                var el = document.createElement("input"), evName = "on" + eventName, isSupported = evName in el;
                return isSupported || (el.setAttribute(evName, "return;"), isSupported = "function" == typeof el[evName]),
                    el = null, isSupported;
            }

            function maskScope(actionObj, maskset, opts) {
                maskset = maskset || this.maskset, opts = opts || this.opts;
                var undoValue, $el, maxLength, colorMask, inputmask = this, el = this.el, isRTL = this.isRTL,
                    skipKeyPressEvent = !1, skipInputEvent = !1, ignorable = !1, mouseEnter = !1, trackCaret = !1;

                function getMaskTemplate(baseOnInput, minimalPos, includeMode) {
                    minimalPos = minimalPos || 0;
                    var ndxIntlzr, test, testPos, maskTemplate = [], pos = 0, lvp = getLastValidPosition();
                    do {
                        if (!0 === baseOnInput && getMaskSet().validPositions[pos]) test = (testPos = getMaskSet().validPositions[pos]).match,
                            ndxIntlzr = testPos.locator.slice(), maskTemplate.push(!0 === includeMode ? testPos.input : !1 === includeMode ? test.nativeDef : getPlaceholder(pos, test)); else {
                            test = (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1)).match, ndxIntlzr = testPos.locator.slice();
                            var jitMasking = !1 !== opts.jitMasking ? opts.jitMasking : test.jit;
                            (!1 === jitMasking || jitMasking === undefined || pos < lvp || "number" == typeof jitMasking && isFinite(jitMasking) && jitMasking > pos) && maskTemplate.push(!1 === includeMode ? test.nativeDef : getPlaceholder(pos, test));
                        }
                        "auto" === opts.keepStatic && test.newBlockMarker && null !== test.fn && (opts.keepStatic = pos - 1),
                            pos++;
                    } while ((maxLength === undefined || pos < maxLength) && (null !== test.fn || "" !== test.def) || minimalPos > pos);
                    return "" === maskTemplate[maskTemplate.length - 1] && maskTemplate.pop(), !1 === includeMode && getMaskSet().maskLength !== undefined || (getMaskSet().maskLength = pos - 1),
                        maskTemplate;
                }

                function getMaskSet() {
                    return maskset;
                }

                function resetMaskSet(soft) {
                    var maskset = getMaskSet();
                    maskset.buffer = undefined, !0 !== soft && (maskset.validPositions = {}, maskset.p = 0);
                }

                function getLastValidPosition(closestTo, strict, validPositions) {
                    var before = -1, after = -1, valids = validPositions || getMaskSet().validPositions;
                    for (var posNdx in closestTo === undefined && (closestTo = -1), valids) {
                        var psNdx = parseInt(posNdx);
                        valids[psNdx] && (strict || !0 !== valids[psNdx].generatedInput) && (psNdx <= closestTo && (before = psNdx),
                        psNdx >= closestTo && (after = psNdx));
                    }
                    return -1 === before || before == closestTo ? after : -1 == after ? before : closestTo - before < after - closestTo ? before : after;
                }

                function determineTestTemplate(pos, tests, guessNextBest) {
                    for (var testPos, altTest = getTest(pos = pos > 0 ? pos - 1 : 0, tests), altArr = altTest.alternation !== undefined ? altTest.locator[altTest.alternation].toString().split(",") : [], ndx = 0; ndx < tests.length && (!((testPos = tests[ndx]).match && (opts.greedy && !0 !== testPos.match.optionalQuantifier || (!1 === testPos.match.optionality || !1 === testPos.match.newBlockMarker) && !0 !== testPos.match.optionalQuantifier) && (altTest.alternation === undefined || altTest.alternation !== testPos.alternation || testPos.locator[altTest.alternation] !== undefined && checkAlternationMatch(testPos.locator[altTest.alternation].toString().split(","), altArr))) || !0 === guessNextBest && (null !== testPos.match.fn || /[0-9a-bA-Z]/.test(testPos.match.def))); ndx++) ;
                    return testPos;
                }

                function getDecisionTaker(tst) {
                    var decisionTaker = tst.locator[tst.alternation];
                    return "string" == typeof decisionTaker && decisionTaker.length > 0 && (decisionTaker = decisionTaker.split(",")[0]),
                        decisionTaker !== undefined ? decisionTaker.toString() : "";
                }

                function getLocator(tst, align) {
                    for (var locator = (tst.alternation != undefined ? tst.mloc[getDecisionTaker(tst)] : tst.locator).join(""); locator.length < align;) locator += "0";
                    return locator;
                }

                function getTestTemplate(pos, ndxIntlzr, tstPs) {
                    return getMaskSet().validPositions[pos] || determineTestTemplate(pos, getTests(pos, ndxIntlzr ? ndxIntlzr.slice() : ndxIntlzr, tstPs));
                }

                function getTest(pos, tests) {
                    return getMaskSet().validPositions[pos] ? getMaskSet().validPositions[pos] : (tests || getTests(pos))[0];
                }

                function positionCanMatchDefinition(pos, def) {
                    for (var valid = !1, tests = getTests(pos), tndx = 0; tndx < tests.length; tndx++) if (tests[tndx].match && tests[tndx].match.def === def) {
                        valid = !0;
                        break;
                    }
                    return valid;
                }

                function getTests(pos, ndxIntlzr, tstPs) {
                    var latestMatch, maskTokens = getMaskSet().maskToken, testPos = ndxIntlzr ? tstPs : 0,
                        ndxInitializer = ndxIntlzr ? ndxIntlzr.slice() : [0], matches = [], insertStop = !1,
                        cacheDependency = ndxIntlzr ? ndxIntlzr.join("") : "";

                    function resolveTestFromToken(maskToken, ndxInitializer, loopNdx, quantifierRecurse) {
                        function handleMatch(match, loopNdx, quantifierRecurse) {
                            function isFirstMatch(latestMatch, tokenGroup) {
                                var firstMatch = 0 === $.inArray(latestMatch, tokenGroup.matches);
                                return firstMatch || $.each(tokenGroup.matches, function (ndx, match) {
                                    if (!0 === match.isQuantifier ? firstMatch = isFirstMatch(latestMatch, tokenGroup.matches[ndx - 1]) : !0 === match.isOptional ? firstMatch = isFirstMatch(latestMatch, match) : !0 === match.isAlternate && (firstMatch = isFirstMatch(latestMatch, match)),
                                            firstMatch) return !1;
                                }), firstMatch;
                            }

                            function resolveNdxInitializer(pos, alternateNdx, targetAlternation) {
                                var bestMatch, indexPos;
                                if ((getMaskSet().tests[pos] || getMaskSet().validPositions[pos]) && $.each(getMaskSet().tests[pos] || [getMaskSet().validPositions[pos]], function (ndx, lmnt) {
                                        if (lmnt.mloc[alternateNdx]) return bestMatch = lmnt, !1;
                                        var alternation = targetAlternation !== undefined ? targetAlternation : lmnt.alternation,
                                            ndxPos = lmnt.locator[alternation] !== undefined ? lmnt.locator[alternation].toString().indexOf(alternateNdx) : -1;
                                        (indexPos === undefined || ndxPos < indexPos) && -1 !== ndxPos && (bestMatch = lmnt,
                                            indexPos = ndxPos);
                                    }), bestMatch) {
                                    var bestMatchAltIndex = bestMatch.locator[bestMatch.alternation];
                                    return (bestMatch.mloc[alternateNdx] || bestMatch.mloc[bestMatchAltIndex] || bestMatch.locator).slice((targetAlternation !== undefined ? targetAlternation : bestMatch.alternation) + 1);
                                }
                                return targetAlternation !== undefined ? resolveNdxInitializer(pos, alternateNdx) : undefined;
                            }

                            function isSubsetOf(source, target) {
                                function expand(pattern) {
                                    for (var start, end, expanded = [], i = 0, l = pattern.length; i < l; i++) if ("-" === pattern.charAt(i)) for (end = pattern.charCodeAt(i + 1); ++start < end;) expanded.push(String.fromCharCode(start)); else start = pattern.charCodeAt(i),
                                        expanded.push(pattern.charAt(i));
                                    return expanded.join("");
                                }

                                return opts.regex && null !== source.match.fn && null !== target.match.fn ? -1 !== expand(target.match.def.replace(/[\[\]]/g, "")).indexOf(expand(source.match.def.replace(/[\[\]]/g, ""))) : source.match.def === target.match.nativeDef;
                            }

                            function setMergeLocators(targetMatch, altMatch) {
                                if (altMatch === undefined || targetMatch.alternation === altMatch.alternation && -1 === targetMatch.locator[targetMatch.alternation].toString().indexOf(altMatch.locator[altMatch.alternation])) {
                                    targetMatch.mloc = targetMatch.mloc || {};
                                    var locNdx = targetMatch.locator[targetMatch.alternation];
                                    if (locNdx !== undefined) {
                                        if ("string" == typeof locNdx && (locNdx = locNdx.split(",")[0]), targetMatch.mloc[locNdx] === undefined && (targetMatch.mloc[locNdx] = targetMatch.locator.slice()),
                                            altMatch !== undefined) {
                                            for (var ndx in altMatch.mloc) "string" == typeof ndx && (ndx = ndx.split(",")[0]),
                                            targetMatch.mloc[ndx] === undefined && (targetMatch.mloc[ndx] = altMatch.mloc[ndx]);
                                            targetMatch.locator[targetMatch.alternation] = Object.keys(targetMatch.mloc).join(",");
                                        }
                                        return !0;
                                    }
                                    targetMatch.alternation = undefined;
                                }
                                return !1;
                            }

                            if (testPos > 5e3) throw "Inputmask: There is probably an error in your mask definition or in the code. Create an issue on github with an example of the mask you are using. " + getMaskSet().mask;
                            if (testPos === pos && match.matches === undefined) return matches.push({
                                match: match,
                                locator: loopNdx.reverse(),
                                cd: cacheDependency,
                                mloc: {}
                            }), !0;
                            if (match.matches !== undefined) {
                                if (match.isGroup && quantifierRecurse !== match) {
                                    if (match = handleMatch(maskToken.matches[$.inArray(match, maskToken.matches) + 1], loopNdx)) return !0;
                                } else if (match.isOptional) {
                                    var optionalToken = match;
                                    if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) {
                                        if (latestMatch = matches[matches.length - 1].match, quantifierRecurse !== undefined || !isFirstMatch(latestMatch, optionalToken)) return !0;
                                        insertStop = !0, testPos = pos;
                                    }
                                } else if (match.isAlternator) {
                                    var maltMatches, alternateToken = match, malternateMatches = [],
                                        currentMatches = matches.slice(), loopNdxCnt = loopNdx.length,
                                        altIndex = ndxInitializer.length > 0 ? ndxInitializer.shift() : -1;
                                    if (-1 === altIndex || "string" == typeof altIndex) {
                                        var amndx, currentPos = testPos, ndxInitializerClone = ndxInitializer.slice(),
                                            altIndexArr = [];
                                        if ("string" == typeof altIndex) altIndexArr = altIndex.split(","); else for (amndx = 0; amndx < alternateToken.matches.length; amndx++) altIndexArr.push(amndx.toString());
                                        if (getMaskSet().excludes[pos]) {
                                            for (var altIndexArrClone = altIndexArr.slice(), i = 0, el = getMaskSet().excludes[pos].length; i < el; i++) altIndexArr.splice(altIndexArr.indexOf(getMaskSet().excludes[pos][i].toString()), 1);
                                            0 === altIndexArr.length && (getMaskSet().excludes[pos] = undefined, altIndexArr = altIndexArrClone);
                                        }
                                        (!0 === opts.keepStatic || isFinite(parseInt(opts.keepStatic)) && currentPos >= opts.keepStatic) && (altIndexArr = altIndexArr.slice(0, 1));
                                        for (var ndx = 0; ndx < altIndexArr.length; ndx++) {
                                            amndx = parseInt(altIndexArr[ndx]), matches = [], ndxInitializer = resolveNdxInitializer(testPos, amndx, loopNdxCnt) || ndxInitializerClone.slice(),
                                            alternateToken.matches[amndx] && handleMatch(alternateToken.matches[amndx], [amndx].concat(loopNdx), quantifierRecurse) && (match = !0),
                                                maltMatches = matches.slice(), testPos = currentPos, matches = [];
                                            for (var ndx1 = 0; ndx1 < maltMatches.length; ndx1++) {
                                                var altMatch = maltMatches[ndx1], dropMatch = !1;
                                                altMatch.alternation = altMatch.alternation || loopNdxCnt, setMergeLocators(altMatch);
                                                for (var ndx2 = 0; ndx2 < malternateMatches.length; ndx2++) {
                                                    var altMatch2 = malternateMatches[ndx2];
                                                    if ("string" != typeof altIndex || altMatch.alternation !== undefined && -1 !== $.inArray(altMatch.locator[altMatch.alternation].toString(), altIndexArr)) {
                                                        if (altMatch.match.nativeDef === altMatch2.match.nativeDef) {
                                                            dropMatch = !0, setMergeLocators(altMatch2, altMatch);
                                                            break;
                                                        }
                                                        if (isSubsetOf(altMatch, altMatch2)) {
                                                            setMergeLocators(altMatch, altMatch2) && (dropMatch = !0, malternateMatches.splice(malternateMatches.indexOf(altMatch2), 0, altMatch));
                                                            break;
                                                        }
                                                        if (isSubsetOf(altMatch2, altMatch)) {
                                                            setMergeLocators(altMatch2, altMatch);
                                                            break;
                                                        }
                                                        if (target = altMatch2, null === (source = altMatch).match.fn && null !== target.match.fn && target.match.fn.test(source.match.def, getMaskSet(), pos, !1, opts, !1)) {
                                                            setMergeLocators(altMatch, altMatch2) && (dropMatch = !0, malternateMatches.splice(malternateMatches.indexOf(altMatch2), 0, altMatch));
                                                            break;
                                                        }
                                                    }
                                                }
                                                dropMatch || malternateMatches.push(altMatch);
                                            }
                                        }
                                        matches = currentMatches.concat(malternateMatches), testPos = pos, insertStop = matches.length > 0,
                                            match = malternateMatches.length > 0, ndxInitializer = ndxInitializerClone.slice();
                                    } else match = handleMatch(alternateToken.matches[altIndex] || maskToken.matches[altIndex], [altIndex].concat(loopNdx), quantifierRecurse);
                                    if (match) return !0;
                                } else if (match.isQuantifier && quantifierRecurse !== maskToken.matches[$.inArray(match, maskToken.matches) - 1]) for (var qt = match, qndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; qndx < (isNaN(qt.quantifier.max) ? qndx + 1 : qt.quantifier.max) && testPos <= pos; qndx++) {
                                    var tokenGroup = maskToken.matches[$.inArray(qt, maskToken.matches) - 1];
                                    if (match = handleMatch(tokenGroup, [qndx].concat(loopNdx), tokenGroup)) {
                                        if ((latestMatch = matches[matches.length - 1].match).optionalQuantifier = qndx > qt.quantifier.min - 1,
                                                latestMatch.jit = qndx + tokenGroup.matches.indexOf(latestMatch) >= qt.quantifier.jit,
                                            isFirstMatch(latestMatch, tokenGroup) && qndx > qt.quantifier.min - 1) {
                                            insertStop = !0, testPos = pos;
                                            break;
                                        }
                                        if (qt.quantifier.jit !== undefined && isNaN(qt.quantifier.max) && latestMatch.optionalQuantifier && getMaskSet().validPositions[pos - 1] === undefined) {
                                            matches.pop(), insertStop = !0, testPos = pos, cacheDependency = undefined;
                                            break;
                                        }
                                        return !0;
                                    }
                                } else if (match = resolveTestFromToken(match, ndxInitializer, loopNdx, quantifierRecurse)) return !0;
                            } else testPos++;
                            var source, target;
                        }

                        for (var tndx = ndxInitializer.length > 0 ? ndxInitializer.shift() : 0; tndx < maskToken.matches.length; tndx++) if (!0 !== maskToken.matches[tndx].isQuantifier) {
                            var match = handleMatch(maskToken.matches[tndx], [tndx].concat(loopNdx), quantifierRecurse);
                            if (match && testPos === pos) return match;
                            if (testPos > pos) break;
                        }
                    }

                    if (pos > -1) {
                        if (ndxIntlzr === undefined) {
                            for (var test, previousPos = pos - 1; (test = getMaskSet().validPositions[previousPos] || getMaskSet().tests[previousPos]) === undefined && previousPos > -1;) previousPos--;
                            test !== undefined && previousPos > -1 && (ndxInitializer = function (pos, tests) {
                                var locator = [];
                                return $.isArray(tests) || (tests = [tests]), tests.length > 0 && (tests[0].alternation === undefined ? 0 === (locator = determineTestTemplate(pos, tests.slice()).locator.slice()).length && (locator = tests[0].locator.slice()) : $.each(tests, function (ndx, tst) {
                                    if ("" !== tst.def) if (0 === locator.length) locator = tst.locator.slice(); else for (var i = 0; i < locator.length; i++) tst.locator[i] && -1 === locator[i].toString().indexOf(tst.locator[i]) && (locator[i] += "," + tst.locator[i]);
                                })), locator;
                            }(previousPos, test), cacheDependency = ndxInitializer.join(""), testPos = previousPos);
                        }
                        if (getMaskSet().tests[pos] && getMaskSet().tests[pos][0].cd === cacheDependency) return getMaskSet().tests[pos];
                        for (var mtndx = ndxInitializer.shift(); mtndx < maskTokens.length; mtndx++) {
                            if (resolveTestFromToken(maskTokens[mtndx], ndxInitializer, [mtndx]) && testPos === pos || testPos > pos) break;
                        }
                    }
                    return (0 === matches.length || insertStop) && matches.push({
                        match: {
                            fn: null,
                            optionality: !0,
                            casing: null,
                            def: "",
                            placeholder: ""
                        },
                        locator: [],
                        mloc: {},
                        cd: cacheDependency
                    }), ndxIntlzr !== undefined && getMaskSet().tests[pos] ? $.extend(!0, [], matches) : (getMaskSet().tests[pos] = $.extend(!0, [], matches),
                        getMaskSet().tests[pos]);
                }

                function getBufferTemplate() {
                    return getMaskSet()._buffer === undefined && (getMaskSet()._buffer = getMaskTemplate(!1, 1),
                    getMaskSet().buffer === undefined && (getMaskSet().buffer = getMaskSet()._buffer.slice())),
                        getMaskSet()._buffer;
                }

                function getBuffer(noCache) {
                    return getMaskSet().buffer !== undefined && !0 !== noCache || (getMaskSet().buffer = getMaskTemplate(!0, getLastValidPosition(), !0)),
                        getMaskSet().buffer;
                }

                function refreshFromBuffer(start, end, buffer) {
                    var i, p;
                    if (!0 === start) resetMaskSet(), start = 0, end = buffer.length; else for (i = start; i < end; i++) delete getMaskSet().validPositions[i];
                    for (p = start, i = start; i < end; i++) if (resetMaskSet(!0), buffer[i] !== opts.skipOptionalPartCharacter) {
                        var valResult = isValid(p, buffer[i], !0, !0);
                        !1 !== valResult && (resetMaskSet(!0), p = valResult.caret !== undefined ? valResult.caret : valResult.pos + 1);
                    }
                }

                function checkAlternationMatch(altArr1, altArr2, na) {
                    for (var naNdx, altArrC = opts.greedy ? altArr2 : altArr2.slice(0, 1), isMatch = !1, naArr = na !== undefined ? na.split(",") : [], i = 0; i < naArr.length; i++) -1 !== (naNdx = altArr1.indexOf(naArr[i])) && altArr1.splice(naNdx, 1);
                    for (var alndx = 0; alndx < altArr1.length; alndx++) if (-1 !== $.inArray(altArr1[alndx], altArrC)) {
                        isMatch = !0;
                        break;
                    }
                    return isMatch;
                }

                function alternate(pos, c, strict, fromSetValid, rAltPos) {
                    var lastAlt, alternation, altPos, prevAltPos, i, validPos, decisionPos,
                        validPsClone = $.extend(!0, {}, getMaskSet().validPositions), isValidRslt = !1,
                        lAltPos = rAltPos !== undefined ? rAltPos : getLastValidPosition();
                    if (-1 === lAltPos && rAltPos === undefined) alternation = (prevAltPos = getTest(lastAlt = 0)).alternation; else for (; lAltPos >= 0; lAltPos--) if ((altPos = getMaskSet().validPositions[lAltPos]) && altPos.alternation !== undefined) {
                        if (prevAltPos && prevAltPos.locator[altPos.alternation] !== altPos.locator[altPos.alternation]) break;
                        lastAlt = lAltPos, alternation = getMaskSet().validPositions[lastAlt].alternation,
                            prevAltPos = altPos;
                    }
                    if (alternation !== undefined) {
                        decisionPos = parseInt(lastAlt), getMaskSet().excludes[decisionPos] = getMaskSet().excludes[decisionPos] || [],
                        !0 !== pos && getMaskSet().excludes[decisionPos].push(getDecisionTaker(prevAltPos));
                        var validInputsClone = [], staticInputsBeforePos = 0;
                        for (i = decisionPos; i < getLastValidPosition(undefined, !0) + 1; i++) (validPos = getMaskSet().validPositions[i]) && !0 !== validPos.generatedInput && /[0-9a-bA-Z]/.test(validPos.input) ? validInputsClone.push(validPos.input) : i < pos && staticInputsBeforePos++,
                            delete getMaskSet().validPositions[i];
                        for (; getMaskSet().excludes[decisionPos] && getMaskSet().excludes[decisionPos].length < 10;) {
                            var posOffset = -1 * staticInputsBeforePos, validInputs = validInputsClone.slice();
                            for (getMaskSet().tests[decisionPos] = undefined, resetMaskSet(!0), isValidRslt = !0; validInputs.length > 0;) {
                                var input = validInputs.shift();
                                if (input !== opts.skipOptionalPartCharacter && !(isValidRslt = isValid(getLastValidPosition(undefined, !0) + 1, input, !1, fromSetValid, !0))) break;
                            }
                            if (isValidRslt && c !== undefined) {
                                var targetLvp = getLastValidPosition(pos) + 1;
                                for (i = decisionPos; i < getLastValidPosition() + 1; i++) ((validPos = getMaskSet().validPositions[i]) === undefined || null == validPos.match.fn) && i < pos + posOffset && posOffset++;
                                isValidRslt = isValid((pos += posOffset) > targetLvp ? targetLvp : pos, c, strict, fromSetValid, !0);
                            }
                            if (isValidRslt) break;
                            if (resetMaskSet(), prevAltPos = getTest(decisionPos), getMaskSet().validPositions = $.extend(!0, {}, validPsClone),
                                    !getMaskSet().excludes[decisionPos]) {
                                isValidRslt = alternate(pos, c, strict, fromSetValid, decisionPos - 1);
                                break;
                            }
                            var decisionTaker = getDecisionTaker(prevAltPos);
                            if (-1 !== getMaskSet().excludes[decisionPos].indexOf(decisionTaker)) {
                                isValidRslt = alternate(pos, c, strict, fromSetValid, decisionPos - 1);
                                break;
                            }
                            for (getMaskSet().excludes[decisionPos].push(decisionTaker), i = decisionPos; i < getLastValidPosition(undefined, !0) + 1; i++) delete getMaskSet().validPositions[i];
                        }
                    }
                    return getMaskSet().excludes[decisionPos] = undefined, isValidRslt;
                }

                function isValid(pos, c, strict, fromSetValid, fromAlternate, validateOnly) {
                    function isSelection(posObj) {
                        return isRTL ? posObj.begin - posObj.end > 1 || posObj.begin - posObj.end == 1 : posObj.end - posObj.begin > 1 || posObj.end - posObj.begin == 1;
                    }

                    strict = !0 === strict;
                    var maskPos = pos;

                    function _isValid(position, c, strict) {
                        var rslt = !1;
                        return $.each(getTests(position), function (ndx, tst) {
                            var test = tst.match;
                            if (getBuffer(!0), !1 !== (rslt = null != test.fn ? test.fn.test(c, getMaskSet(), position, strict, opts, isSelection(pos)) : (c === test.def || c === opts.skipOptionalPartCharacter) && "" !== test.def && {
                                    c: getPlaceholder(position, test, !0) || test.def,
                                    pos: position
                                })) {
                                var elem = rslt.c !== undefined ? rslt.c : c, validatedPos = position;
                                return elem = elem === opts.skipOptionalPartCharacter && null === test.fn ? getPlaceholder(position, test, !0) || test.def : elem,
                                rslt.remove !== undefined && ($.isArray(rslt.remove) || (rslt.remove = [rslt.remove]),
                                    $.each(rslt.remove.sort(function (a, b) {
                                        return b - a;
                                    }), function (ndx, lmnt) {
                                        revalidateMask({
                                            begin: lmnt,
                                            end: lmnt + 1
                                        });
                                    })), rslt.insert !== undefined && ($.isArray(rslt.insert) || (rslt.insert = [rslt.insert]),
                                    $.each(rslt.insert.sort(function (a, b) {
                                        return a - b;
                                    }), function (ndx, lmnt) {
                                        isValid(lmnt.pos, lmnt.c, !0, fromSetValid);
                                    })), !0 !== rslt && rslt.pos !== undefined && rslt.pos !== position && (validatedPos = rslt.pos),
                                    !0 !== rslt && rslt.pos === undefined && rslt.c === undefined ? !1 : (ndx > 0 && resetMaskSet(!0),
                                    revalidateMask(pos, $.extend({}, tst, {
                                        input: function (elem, test, pos) {
                                            switch (opts.casing || test.casing) {
                                                case "upper":
                                                    elem = elem.toUpperCase();
                                                    break;

                                                case "lower":
                                                    elem = elem.toLowerCase();
                                                    break;

                                                case "title":
                                                    var posBefore = getMaskSet().validPositions[pos - 1];
                                                    elem = 0 === pos || posBefore && posBefore.input === String.fromCharCode(Inputmask.keyCode.SPACE) ? elem.toUpperCase() : elem.toLowerCase();
                                                    break;

                                                default:
                                                    if ($.isFunction(opts.casing)) {
                                                        var args = Array.prototype.slice.call(arguments);
                                                        args.push(getMaskSet().validPositions), elem = opts.casing.apply(this, args);
                                                    }
                                            }
                                            return elem;
                                        }(elem, test, validatedPos)
                                    }), fromSetValid, validatedPos) || (rslt = !1), !1);
                            }
                        }), rslt;
                    }

                    pos.begin !== undefined && (maskPos = isRTL ? pos.end : pos.begin);
                    var result = !0, positionsClone = $.extend(!0, {}, getMaskSet().validPositions);
                    if ($.isFunction(opts.preValidation) && !strict && !0 !== fromSetValid && !0 !== validateOnly && (result = opts.preValidation(getBuffer(), maskPos, c, isSelection(pos), opts, getMaskSet())),
                        !0 === result) {
                        if (trackbackPositions(undefined, maskPos, !0), (maxLength === undefined || maskPos < maxLength) && (result = _isValid(maskPos, c, strict),
                            (!strict || !0 === fromSetValid) && !1 === result && !0 !== validateOnly)) {
                            var currentPosValid = getMaskSet().validPositions[maskPos];
                            if (!currentPosValid || null !== currentPosValid.match.fn || currentPosValid.match.def !== c && c !== opts.skipOptionalPartCharacter) {
                                if ((opts.insertMode || getMaskSet().validPositions[seekNext(maskPos)] === undefined) && !isMask(maskPos, !0)) for (var nPos = maskPos + 1, snPos = seekNext(maskPos); nPos <= snPos; nPos++) if (!1 !== (result = _isValid(nPos, c, strict))) {
                                    result = trackbackPositions(maskPos, result.pos !== undefined ? result.pos : nPos) || result,
                                        maskPos = nPos;
                                    break;
                                }
                            } else result = {
                                caret: seekNext(maskPos)
                            };
                        }
                        !1 !== result || null === opts.keepStatic || !1 === opts.keepStatic || strict || !0 === fromAlternate || (result = alternate(maskPos, c, strict, fromSetValid)),
                        !0 === result && (result = {
                            pos: maskPos
                        });
                    }
                    if ($.isFunction(opts.postValidation) && !1 !== result && !strict && !0 !== fromSetValid && !0 !== validateOnly) {
                        var postResult = opts.postValidation(getBuffer(!0), result, opts);
                        if (postResult !== undefined) {
                            if (postResult.refreshFromBuffer && postResult.buffer) {
                                var refresh = postResult.refreshFromBuffer;
                                refreshFromBuffer(!0 === refresh ? refresh : refresh.start, refresh.end, postResult.buffer);
                            }
                            result = !0 === postResult ? result : postResult;
                        }
                    }
                    return result && result.pos === undefined && (result.pos = maskPos), !1 !== result && !0 !== validateOnly || (resetMaskSet(!0),
                        getMaskSet().validPositions = $.extend(!0, {}, positionsClone)), result;
                }

                function trackbackPositions(originalPos, newPos, fillOnly) {
                    var result;
                    if (originalPos === undefined) for (originalPos = newPos - 1; originalPos > 0 && !getMaskSet().validPositions[originalPos]; originalPos--) ;
                    for (var ps = originalPos; ps < newPos; ps++) if (getMaskSet().validPositions[ps] === undefined && !isMask(ps, !0)) {
                        var vp = 0 == ps ? getTest(ps) : getMaskSet().validPositions[ps - 1];
                        if (vp) {
                            var tstLocator, targetLocator = getLocator(vp), tests = getTests(ps).slice(),
                                closest = undefined, bestMatch = getTest(ps);
                            if ("" === tests[tests.length - 1].match.def && tests.pop(), $.each(tests, function (ndx, tst) {
                                    tstLocator = getLocator(tst, targetLocator.length);
                                    var distance = Math.abs(tstLocator - targetLocator);
                                    (closest === undefined || distance < closest) && null === tst.match.fn && !0 !== tst.match.optionality && !0 !== tst.match.optionalQuantifier && (closest = distance,
                                        bestMatch = tst);
                                }), (bestMatch = $.extend({}, bestMatch, {
                                    input: getPlaceholder(ps, bestMatch.match, !0) || bestMatch.match.def
                                })).generatedInput = !0, revalidateMask(ps, bestMatch, !0), !0 !== fillOnly) {
                                var cvpInput = getMaskSet().validPositions[newPos].input;
                                getMaskSet().validPositions[newPos] = undefined, result = isValid(newPos, cvpInput, !0, !0);
                            }
                        }
                    }
                    return result;
                }

                function revalidateMask(pos, validTest, fromSetValid, validatedPos) {
                    function IsEnclosedStatic(pos, valids, selection) {
                        var posMatch = valids[pos];
                        if (posMatch !== undefined && (null === posMatch.match.fn && !0 !== posMatch.match.optionality || posMatch.input === opts.radixPoint)) {
                            var prevMatch = selection.begin <= pos - 1 ? valids[pos - 1] && null === valids[pos - 1].match.fn && valids[pos - 1] : valids[pos - 1],
                                nextMatch = selection.end > pos + 1 ? valids[pos + 1] && null === valids[pos + 1].match.fn && valids[pos + 1] : valids[pos + 1];
                            return prevMatch && nextMatch;
                        }
                        return !1;
                    }

                    var begin = pos.begin !== undefined ? pos.begin : pos, end = pos.end !== undefined ? pos.end : pos;
                    if (pos.begin > pos.end && (begin = pos.end, end = pos.begin), validatedPos = validatedPos !== undefined ? validatedPos : begin,
                        begin !== end || opts.insertMode && getMaskSet().validPositions[validatedPos] !== undefined && fromSetValid === undefined) {
                        var positionsClone = $.extend(!0, {}, getMaskSet().validPositions),
                            lvp = getLastValidPosition(undefined, !0);
                        for (getMaskSet().p = begin, i = lvp; i >= begin; i--) getMaskSet().validPositions[i] && "+" === getMaskSet().validPositions[i].match.nativeDef && (opts.isNegative = !1),
                            delete getMaskSet().validPositions[i];
                        var valid = !0, j = validatedPos, needsValidation = (getMaskSet().validPositions,
                            !1), posMatch = j, i = j;
                        for (validTest && (getMaskSet().validPositions[validatedPos] = $.extend(!0, {}, validTest),
                            posMatch++, j++, begin < end && i++); i <= lvp; i++) {
                            var t = positionsClone[i];
                            if (t !== undefined && (i >= end || i >= begin && !0 !== t.generatedInput && IsEnclosedStatic(i, positionsClone, {
                                    begin: begin,
                                    end: end
                                }))) {
                                for (; "" !== getTest(posMatch).match.def;) {
                                    if (!1 === needsValidation && positionsClone[posMatch] && positionsClone[posMatch].match.nativeDef === t.match.nativeDef) getMaskSet().validPositions[posMatch] = $.extend(!0, {}, positionsClone[posMatch]),
                                        getMaskSet().validPositions[posMatch].input = t.input, trackbackPositions(undefined, posMatch, !0),
                                        j = posMatch + 1, valid = !0; else if (positionCanMatchDefinition(posMatch, t.match.def)) {
                                        var result = isValid(posMatch, t.input, !0, !0);
                                        valid = !1 !== result, j = result.caret || result.insert ? getLastValidPosition() : posMatch + 1,
                                            needsValidation = !0;
                                    } else if (!(valid = !0 === t.generatedInput || t.input == opts.radixPoint) && "" === getTest(posMatch).match.def) break;
                                    if (valid) break;
                                    posMatch++;
                                }
                                "" == getTest(posMatch).match.def && (valid = !1), posMatch = j;
                            }
                            if (!valid) break;
                        }
                        if (!valid) return getMaskSet().validPositions = $.extend(!0, {}, positionsClone),
                            resetMaskSet(!0), !1;
                    } else getMaskSet().validPositions[validatedPos] = $.extend(!0, {}, validTest);
                    return resetMaskSet(!0), !0;
                }

                function isMask(pos, strict) {
                    var test = getTestTemplate(pos).match;
                    if ("" === test.def && (test = getTest(pos).match), null != test.fn) return test.fn;
                    if (!0 !== strict && pos > -1) {
                        var tests = getTests(pos);
                        return tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0);
                    }
                    return !1;
                }

                function seekNext(pos, newBlock) {
                    for (var position = pos + 1; "" !== getTest(position).match.def && (!0 === newBlock && (!0 !== getTest(position).match.newBlockMarker || !isMask(position)) || !0 !== newBlock && !isMask(position));) position++;
                    return position;
                }

                function seekPrevious(pos, newBlock) {
                    var tests, position = pos;
                    if (position <= 0) return 0;
                    for (; --position > 0 && (!0 === newBlock && !0 !== getTest(position).match.newBlockMarker || !0 !== newBlock && !isMask(position) && ((tests = getTests(position)).length < 2 || 2 === tests.length && "" === tests[1].match.def));) ;
                    return position;
                }

                function writeBuffer(input, buffer, caretPos, event, triggerInputEvent) {
                    if (event && $.isFunction(opts.onBeforeWrite)) {
                        var result = opts.onBeforeWrite.call(inputmask, event, buffer, caretPos, opts);
                        if (result) {
                            if (result.refreshFromBuffer) {
                                var refresh = result.refreshFromBuffer;
                                refreshFromBuffer(!0 === refresh ? refresh : refresh.start, refresh.end, result.buffer || buffer),
                                    buffer = getBuffer(!0);
                            }
                            caretPos !== undefined && (caretPos = result.caret !== undefined ? result.caret : caretPos);
                        }
                    }
                    input !== undefined && (input.inputmask._valueSet(buffer.join("")), caretPos === undefined || event !== undefined && "blur" === event.type ? renderColorMask(input, caretPos, 0 === buffer.length) : caret(input, caretPos),
                    !0 === triggerInputEvent && (skipInputEvent = !0, $(input).trigger("input")));
                }

                function getPlaceholder(pos, test, returnPL) {
                    if ((test = test || getTest(pos).match).placeholder !== undefined || !0 === returnPL) return $.isFunction(test.placeholder) ? test.placeholder(opts) : test.placeholder;
                    if (null === test.fn) {
                        if (pos > -1 && getMaskSet().validPositions[pos] === undefined) {
                            var prevTest, tests = getTests(pos), staticAlternations = [];
                            if (tests.length > 1 + ("" === tests[tests.length - 1].match.def ? 1 : 0)) for (var i = 0; i < tests.length; i++) if (!0 !== tests[i].match.optionality && !0 !== tests[i].match.optionalQuantifier && (null === tests[i].match.fn || prevTest === undefined || !1 !== tests[i].match.fn.test(prevTest.match.def, getMaskSet(), pos, !0, opts)) && (staticAlternations.push(tests[i]),
                                null === tests[i].match.fn && (prevTest = tests[i]), staticAlternations.length > 1 && /[0-9a-bA-Z]/.test(staticAlternations[0].match.def))) return opts.placeholder.charAt(pos % opts.placeholder.length);
                        }
                        return test.def;
                    }
                    return opts.placeholder.charAt(pos % opts.placeholder.length);
                }

                var valueBuffer, EventRuler = {
                    on: function (input, eventName, eventHandler) {
                        var ev = function (e) {
                            var that = this;
                            if (that.inputmask === undefined && "FORM" !== this.nodeName) {
                                var imOpts = $.data(that, "_inputmask_opts");
                                imOpts ? new Inputmask(imOpts).mask(that) : EventRuler.off(that);
                            } else {
                                if ("setvalue" === e.type || "FORM" === this.nodeName || !(that.disabled || that.readOnly && !("keydown" === e.type && e.ctrlKey && 67 === e.keyCode || !1 === opts.tabThrough && e.keyCode === Inputmask.keyCode.TAB))) {
                                    switch (e.type) {
                                        case "input":
                                            if (!0 === skipInputEvent) return skipInputEvent = !1, e.preventDefault();
                                            mobile && (trackCaret = !0);
                                            break;

                                        case "keydown":
                                            skipKeyPressEvent = !1, skipInputEvent = !1;
                                            break;

                                        case "keypress":
                                            if (!0 === skipKeyPressEvent) return e.preventDefault();
                                            skipKeyPressEvent = !0;
                                            break;

                                        case "click":
                                            if (iemobile || iphone) {
                                                var args = arguments;
                                                return setTimeout(function () {
                                                    eventHandler.apply(that, args);
                                                }, 0), !1;
                                            }
                                    }
                                    var returnVal = eventHandler.apply(that, arguments);
                                    return trackCaret && (trackCaret = !1, setTimeout(function () {
                                        caret(that, that.inputmask.caretPos, undefined, !0);
                                    })), !1 === returnVal && (e.preventDefault(), e.stopPropagation()), returnVal;
                                }
                                e.preventDefault();
                            }
                        };
                        input.inputmask.events[eventName] = input.inputmask.events[eventName] || [], input.inputmask.events[eventName].push(ev),
                            -1 !== $.inArray(eventName, ["submit", "reset"]) ? null !== input.form && $(input.form).on(eventName, ev) : $(input).on(eventName, ev);
                    },
                    off: function (input, event) {
                        var events;
                        input.inputmask && input.inputmask.events && (event ? (events = [])[event] = input.inputmask.events[event] : events = input.inputmask.events,
                            $.each(events, function (eventName, evArr) {
                                for (; evArr.length > 0;) {
                                    var ev = evArr.pop();
                                    -1 !== $.inArray(eventName, ["submit", "reset"]) ? null !== input.form && $(input.form).off(eventName, ev) : $(input).off(eventName, ev);
                                }
                                delete input.inputmask.events[eventName];
                            }));
                    }
                }, EventHandlers = {
                    keydownEvent: function (e) {
                        var input = this, $input = $(input), k = e.keyCode, pos = caret(input);
                        if (k === Inputmask.keyCode.BACKSPACE || k === Inputmask.keyCode.DELETE || iphone && k === Inputmask.keyCode.BACKSPACE_SAFARI || e.ctrlKey && k === Inputmask.keyCode.X && !isInputEventSupported("cut")) e.preventDefault(),
                            handleRemove(input, k, pos), writeBuffer(input, getBuffer(!0), getMaskSet().p, e, input.inputmask._valueGet() !== getBuffer().join("")),
                            input.inputmask._valueGet() === getBufferTemplate().join("") ? $input.trigger("cleared") : !0 === isComplete(getBuffer()) && $input.trigger("complete"); else if (k === Inputmask.keyCode.END || k === Inputmask.keyCode.PAGE_DOWN) {
                            e.preventDefault();
                            var caretPos = seekNext(getLastValidPosition());
                            opts.insertMode || caretPos !== getMaskSet().maskLength || e.shiftKey || caretPos--,
                                caret(input, e.shiftKey ? pos.begin : caretPos, caretPos, !0);
                        } else k === Inputmask.keyCode.HOME && !e.shiftKey || k === Inputmask.keyCode.PAGE_UP ? (e.preventDefault(),
                            caret(input, 0, e.shiftKey ? pos.begin : 0, !0)) : (opts.undoOnEscape && k === Inputmask.keyCode.ESCAPE || 90 === k && e.ctrlKey) && !0 !== e.altKey ? (checkVal(input, !0, !1, undoValue.split("")),
                            $input.trigger("click")) : k !== Inputmask.keyCode.INSERT || e.shiftKey || e.ctrlKey ? !0 === opts.tabThrough && k === Inputmask.keyCode.TAB ? (!0 === e.shiftKey ? (null === getTest(pos.begin).match.fn && (pos.begin = seekNext(pos.begin)),
                            pos.end = seekPrevious(pos.begin, !0), pos.begin = seekPrevious(pos.end, !0)) : (pos.begin = seekNext(pos.begin, !0),
                            pos.end = seekNext(pos.begin, !0), pos.end < getMaskSet().maskLength && pos.end--),
                        pos.begin < getMaskSet().maskLength && (e.preventDefault(), caret(input, pos.begin, pos.end))) : e.shiftKey || !1 === opts.insertMode && (k === Inputmask.keyCode.RIGHT ? setTimeout(function () {
                            var caretPos = caret(input);
                            caret(input, caretPos.begin);
                        }, 0) : k === Inputmask.keyCode.LEFT && setTimeout(function () {
                            var caretPos = caret(input);
                            caret(input, isRTL ? caretPos.begin + 1 : caretPos.begin - 1);
                        }, 0)) : (opts.insertMode = !opts.insertMode, caret(input, opts.insertMode || pos.begin !== getMaskSet().maskLength ? pos.begin : pos.begin - 1));
                        opts.onKeyDown.call(this, e, getBuffer(), caret(input).begin, opts), ignorable = -1 !== $.inArray(k, opts.ignorables);
                    },
                    keypressEvent: function (e, checkval, writeOut, strict, ndx) {
                        var input = this, $input = $(input), k = e.which || e.charCode || e.keyCode;
                        if (!(!0 === checkval || e.ctrlKey && e.altKey) && (e.ctrlKey || e.metaKey || ignorable)) return k === Inputmask.keyCode.ENTER && undoValue !== getBuffer().join("") && (undoValue = getBuffer().join(""),
                            setTimeout(function () {
                                $input.trigger("change");
                            }, 0)), !0;
                        if (k) {
                            46 === k && !1 === e.shiftKey && "" !== opts.radixPoint && (k = opts.radixPoint.charCodeAt(0));
                            var forwardPosition, pos = checkval ? {
                                begin: ndx,
                                end: ndx
                            } : caret(input), c = String.fromCharCode(k), offset = 0;
                            if (opts._radixDance && opts.numericInput) {
                                var caretPos = getBuffer().indexOf(opts.radixPoint.charAt(0)) + 1;
                                pos.begin <= caretPos && (k === opts.radixPoint.charCodeAt(0) && (offset = 1), pos.begin -= 1,
                                    pos.end -= 1);
                            }
                            getMaskSet().writeOutBuffer = !0;
                            var valResult = isValid(pos, c, strict);
                            if (!1 !== valResult && (resetMaskSet(!0), forwardPosition = valResult.caret !== undefined ? valResult.caret : seekNext(valResult.pos.begin ? valResult.pos.begin : valResult.pos),
                                    getMaskSet().p = forwardPosition), forwardPosition = (opts.numericInput && valResult.caret === undefined ? seekPrevious(forwardPosition) : forwardPosition) + offset,
                                !1 !== writeOut && (setTimeout(function () {
                                    opts.onKeyValidation.call(input, k, valResult, opts);
                                }, 0), getMaskSet().writeOutBuffer && !1 !== valResult)) {
                                var buffer = getBuffer();
                                writeBuffer(input, buffer, forwardPosition, e, !0 !== checkval), !0 !== checkval && setTimeout(function () {
                                    !0 === isComplete(buffer) && $input.trigger("complete");
                                }, 0);
                            }
                            if (e.preventDefault(), checkval) return !1 !== valResult && (valResult.forwardPosition = forwardPosition),
                                valResult;
                        }
                    },
                    pasteEvent: function (e) {
                        var tempValue, ev = e.originalEvent || e, $input = $(this),
                            inputValue = this.inputmask._valueGet(!0), caretPos = caret(this);
                        isRTL && (tempValue = caretPos.end, caretPos.end = caretPos.begin, caretPos.begin = tempValue);
                        var valueBeforeCaret = inputValue.substr(0, caretPos.begin),
                            valueAfterCaret = inputValue.substr(caretPos.end, inputValue.length);
                        if (valueBeforeCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(0, caretPos.begin).join("") && (valueBeforeCaret = ""),
                            valueAfterCaret === (isRTL ? getBufferTemplate().reverse() : getBufferTemplate()).slice(caretPos.end).join("") && (valueAfterCaret = ""),
                            isRTL && (tempValue = valueBeforeCaret, valueBeforeCaret = valueAfterCaret, valueAfterCaret = tempValue),
                            window.clipboardData && window.clipboardData.getData) inputValue = valueBeforeCaret + window.clipboardData.getData("Text") + valueAfterCaret; else {
                            if (!ev.clipboardData || !ev.clipboardData.getData) return !0;
                            inputValue = valueBeforeCaret + ev.clipboardData.getData("text/plain") + valueAfterCaret;
                        }
                        var pasteValue = inputValue;
                        if ($.isFunction(opts.onBeforePaste)) {
                            if (!1 === (pasteValue = opts.onBeforePaste.call(inputmask, inputValue, opts))) return e.preventDefault();
                            pasteValue || (pasteValue = inputValue);
                        }
                        return checkVal(this, !1, !1, isRTL ? pasteValue.split("").reverse() : pasteValue.toString().split("")),
                            writeBuffer(this, getBuffer(), seekNext(getLastValidPosition()), e, undoValue !== getBuffer().join("")),
                        !0 === isComplete(getBuffer()) && $input.trigger("complete"), e.preventDefault();
                    },
                    inputFallBackEvent: function (e) {
                        var input = this, inputValue = input.inputmask._valueGet();
                        if (getBuffer().join("") !== inputValue) {
                            var caretPos = caret(input);
                            if (inputValue = function (input, inputValue, caretPos) {
                                    if (iemobile) {
                                        var inputChar = inputValue.replace(getBuffer().join(""), "");
                                        if (1 === inputChar.length) {
                                            var iv = inputValue.split("");
                                            iv.splice(caretPos.begin, 0, inputChar), inputValue = iv.join("");
                                        }
                                    }
                                    return inputValue;
                                }(0, inputValue = function (input, inputValue, caretPos) {
                                    return "." === inputValue.charAt(caretPos.begin - 1) && "" !== opts.radixPoint && ((inputValue = inputValue.split(""))[caretPos.begin - 1] = opts.radixPoint.charAt(0),
                                        inputValue = inputValue.join("")), inputValue;
                                }(0, inputValue, caretPos), caretPos), getBuffer().join("") !== inputValue) {
                                var buffer = getBuffer().join(""),
                                    offset = !opts.numericInput && inputValue.length > buffer.length ? -1 : 0,
                                    frontPart = inputValue.substr(0, caretPos.begin),
                                    backPart = inputValue.substr(caretPos.begin),
                                    frontBufferPart = buffer.substr(0, caretPos.begin + offset),
                                    backBufferPart = buffer.substr(caretPos.begin + offset), selection = caretPos,
                                    entries = "", isEntry = !1;
                                if (frontPart !== frontBufferPart) {
                                    for (var fpl = (isEntry = frontPart.length >= frontBufferPart.length) ? frontPart.length : frontBufferPart.length, i = 0; frontPart.charAt(i) === frontBufferPart.charAt(i) && i < fpl; i++) ;
                                    isEntry && (0 === offset && (selection.begin = i), entries += frontPart.slice(i, selection.end));
                                }
                                if (backPart !== backBufferPart && (backPart.length > backBufferPart.length ? entries += backPart.slice(0, 1) : backPart.length < backBufferPart.length && (selection.end += backBufferPart.length - backPart.length,
                                    isEntry || "" === opts.radixPoint || "" !== backPart || frontPart.charAt(selection.begin + offset - 1) !== opts.radixPoint || (selection.begin--,
                                        entries = opts.radixPoint))), writeBuffer(input, getBuffer(), {
                                        begin: selection.begin + offset,
                                        end: selection.end + offset
                                    }), entries.length > 0) $.each(entries.split(""), function (ndx, entry) {
                                    var keypress = new $.Event("keypress");
                                    keypress.which = entry.charCodeAt(0), ignorable = !1, EventHandlers.keypressEvent.call(input, keypress);
                                }); else {
                                    selection.begin === selection.end - 1 && (selection.begin = seekPrevious(selection.begin + 1),
                                        selection.begin === selection.end - 1 ? caret(input, selection.begin) : caret(input, selection.begin, selection.end));
                                    var keydown = new $.Event("keydown");
                                    keydown.keyCode = opts.numericInput ? Inputmask.keyCode.BACKSPACE : Inputmask.keyCode.DELETE,
                                        EventHandlers.keydownEvent.call(input, keydown), !1 === opts.insertMode && caret(input, caret(input).begin - 1);
                                }
                                e.preventDefault();
                            }
                        }
                    },
                    setValueEvent: function (e) {
                        this.inputmask.refreshValue = !1;
                        var value = (value = e && e.detail ? e.detail[0] : arguments[1]) || this.inputmask._valueGet(!0);
                        $.isFunction(opts.onBeforeMask) && (value = opts.onBeforeMask.call(inputmask, value, opts) || value),
                            value = value.split(""), checkVal(this, !0, !1, isRTL ? value.reverse() : value),
                            undoValue = getBuffer().join(""), (opts.clearMaskOnLostFocus || opts.clearIncomplete) && this.inputmask._valueGet() === getBufferTemplate().join("") && this.inputmask._valueSet("");
                    },
                    focusEvent: function (e) {
                        var nptValue = this.inputmask._valueGet();
                        opts.showMaskOnFocus && (!opts.showMaskOnHover || opts.showMaskOnHover && "" === nptValue) && (this.inputmask._valueGet() !== getBuffer().join("") ? writeBuffer(this, getBuffer(), seekNext(getLastValidPosition())) : !1 === mouseEnter && caret(this, seekNext(getLastValidPosition()))),
                        !0 === opts.positionCaretOnTab && !1 === mouseEnter && EventHandlers.clickEvent.apply(this, [e, !0]),
                            undoValue = getBuffer().join("");
                    },
                    mouseleaveEvent: function (e) {
                        if (mouseEnter = !1, opts.clearMaskOnLostFocus && document.activeElement !== this) {
                            var buffer = getBuffer().slice(), nptValue = this.inputmask._valueGet();
                            nptValue !== this.getAttribute("placeholder") && "" !== nptValue && (-1 === getLastValidPosition() && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer),
                                writeBuffer(this, buffer));
                        }
                    },
                    clickEvent: function (e, tabbed) {
                        var input = this;
                        setTimeout(function () {
                            if (document.activeElement === input) {
                                var selectedCaret = caret(input);
                                if (tabbed && (isRTL ? selectedCaret.end = selectedCaret.begin : selectedCaret.begin = selectedCaret.end),
                                    selectedCaret.begin === selectedCaret.end) switch (opts.positionCaretOnClick) {
                                    case "none":
                                        break;

                                    case "select":
                                        caret(input, 0, getBuffer().length);
                                        break;

                                    case "radixFocus":
                                        if (function (clickPos) {
                                                if ("" !== opts.radixPoint) {
                                                    var vps = getMaskSet().validPositions;
                                                    if (vps[clickPos] === undefined || vps[clickPos].input === getPlaceholder(clickPos)) {
                                                        if (clickPos < seekNext(-1)) return !0;
                                                        var radixPos = $.inArray(opts.radixPoint, getBuffer());
                                                        if (-1 !== radixPos) {
                                                            for (var vp in vps) if (radixPos < vp && vps[vp].input !== getPlaceholder(vp)) return !1;
                                                            return !0;
                                                        }
                                                    }
                                                }
                                                return !1;
                                            }(selectedCaret.begin)) {
                                            var radixPos = getBuffer().join("").indexOf(opts.radixPoint);
                                            caret(input, opts.numericInput ? seekNext(radixPos) : radixPos);
                                            break;
                                        }

                                    default:
                                        var clickPosition = selectedCaret.begin,
                                            lvclickPosition = getLastValidPosition(clickPosition, !0),
                                            lastPosition = seekNext(lvclickPosition);
                                        if (clickPosition < lastPosition) caret(input, isMask(clickPosition, !0) || isMask(clickPosition - 1, !0) ? clickPosition : seekNext(clickPosition)); else {
                                            var lvp = getMaskSet().validPositions[lvclickPosition],
                                                tt = getTestTemplate(lastPosition, lvp ? lvp.match.locator : undefined, lvp),
                                                placeholder = getPlaceholder(lastPosition, tt.match);
                                            if ("" !== placeholder && getBuffer()[lastPosition] !== placeholder && !0 !== tt.match.optionalQuantifier && !0 !== tt.match.newBlockMarker || !isMask(lastPosition, !0) && tt.match.def === placeholder) {
                                                var newPos = seekNext(lastPosition);
                                                (clickPosition >= newPos || clickPosition === lastPosition) && (lastPosition = newPos);
                                            }
                                            caret(input, lastPosition);
                                        }
                                }
                            }
                        }, 0);
                    },
                    dblclickEvent: function (e) {
                        var input = this;
                        setTimeout(function () {
                            caret(input, 0, seekNext(getLastValidPosition()));
                        }, 0);
                    },
                    cutEvent: function (e) {
                        var $input = $(this), pos = caret(this), ev = e.originalEvent || e,
                            clipboardData = window.clipboardData || ev.clipboardData,
                            clipData = isRTL ? getBuffer().slice(pos.end, pos.begin) : getBuffer().slice(pos.begin, pos.end);
                        clipboardData.setData("text", isRTL ? clipData.reverse().join("") : clipData.join("")),
                        document.execCommand && document.execCommand("copy"), handleRemove(this, Inputmask.keyCode.DELETE, pos),
                            writeBuffer(this, getBuffer(), getMaskSet().p, e, undoValue !== getBuffer().join("")),
                        this.inputmask._valueGet() === getBufferTemplate().join("") && $input.trigger("cleared");
                    },
                    blurEvent: function (e) {
                        var $input = $(this);
                        if (this.inputmask) {
                            var nptValue = this.inputmask._valueGet(), buffer = getBuffer().slice();
                            "" === nptValue && colorMask === undefined || (opts.clearMaskOnLostFocus && (-1 === getLastValidPosition() && nptValue === getBufferTemplate().join("") ? buffer = [] : clearOptionalTail(buffer)),
                            !1 === isComplete(buffer) && (setTimeout(function () {
                                $input.trigger("incomplete");
                            }, 0), opts.clearIncomplete && (resetMaskSet(), buffer = opts.clearMaskOnLostFocus ? [] : getBufferTemplate().slice())),
                                writeBuffer(this, buffer, undefined, e)), undoValue !== getBuffer().join("") && (undoValue = buffer.join(""),
                                $input.trigger("change"));
                        }
                    },
                    mouseenterEvent: function (e) {
                        mouseEnter = !0, document.activeElement !== this && opts.showMaskOnHover && this.inputmask._valueGet() !== getBuffer().join("") && writeBuffer(this, getBuffer());
                    },
                    submitEvent: function (e) {
                        undoValue !== getBuffer().join("") && $el.trigger("change"), opts.clearMaskOnLostFocus && -1 === getLastValidPosition() && el.inputmask._valueGet && el.inputmask._valueGet() === getBufferTemplate().join("") && el.inputmask._valueSet(""),
                        opts.clearIncomplete && !1 === isComplete(getBuffer()) && el.inputmask._valueSet(""),
                        opts.removeMaskOnSubmit && (el.inputmask._valueSet(el.inputmask.unmaskedvalue(), !0),
                            setTimeout(function () {
                                writeBuffer(el, getBuffer());
                            }, 0));
                    },
                    resetEvent: function (e) {
                        el.inputmask.refreshValue = !0, setTimeout(function () {
                            $el.trigger("setvalue");
                        }, 0);
                    }
                };

                function checkVal(input, writeOut, strict, nptvl, initiatingEvent) {
                    var inputValue = nptvl.slice(), charCodes = "", initialNdx = -1, result = undefined;
                    if (resetMaskSet(), strict || !0 === opts.autoUnmask) initialNdx = seekNext(initialNdx); else {
                        var staticInput = getBufferTemplate().slice(0, seekNext(-1)).join(""),
                            matches = inputValue.join("").match(new RegExp("^" + Inputmask.escapeRegex(staticInput), "g"));
                        matches && matches.length > 0 && (inputValue.splice(0, matches.length * staticInput.length),
                            initialNdx = seekNext(initialNdx));
                    }
                    -1 === initialNdx ? (getMaskSet().p = seekNext(initialNdx), initialNdx = 0) : getMaskSet().p = initialNdx,
                        $.each(inputValue, function (ndx, charCode) {
                            if (charCode !== undefined) if (getMaskSet().validPositions[ndx] === undefined && inputValue[ndx] === getPlaceholder(ndx) && isMask(ndx, !0) && !1 === isValid(ndx, inputValue[ndx], !0, undefined, undefined, !0)) getMaskSet().p++; else {
                                var keypress = new $.Event("_checkval");
                                keypress.which = charCode.charCodeAt(0), charCodes += charCode;
                                var lvp = getLastValidPosition(undefined, !0), prevTest = getTest(lvp),
                                    nextTest = getTestTemplate(lvp + 1, prevTest ? prevTest.locator.slice() : undefined, lvp);
                                if (!function (ndx, charCodes) {
                                        return -1 !== getMaskTemplate(!0, 0, !1).slice(ndx, seekNext(ndx)).join("").indexOf(charCodes) && !isMask(ndx) && (getTest(ndx).match.nativeDef === charCodes.charAt(0) || " " === getTest(ndx).match.nativeDef && getTest(ndx + 1).match.nativeDef === charCodes.charAt(0));
                                    }(initialNdx, charCodes) || strict || opts.autoUnmask) {
                                    var pos = strict ? ndx : null == nextTest.match.fn && nextTest.match.optionality && lvp + 1 < getMaskSet().p ? lvp + 1 : getMaskSet().p;
                                    (result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, strict, pos)) && (initialNdx = pos + 1,
                                        charCodes = "");
                                } else result = EventHandlers.keypressEvent.call(input, keypress, !0, !1, !0, lvp + 1);
                                writeBuffer(undefined, getBuffer(), result.forwardPosition, keypress, !1);
                            }
                        }), writeOut && writeBuffer(input, getBuffer(), result ? result.forwardPosition : undefined, initiatingEvent || new $.Event("checkval"), initiatingEvent && "input" === initiatingEvent.type);
                }

                function unmaskedvalue(input) {
                    if (input) {
                        if (input.inputmask === undefined) return input.value;
                        input.inputmask && input.inputmask.refreshValue && EventHandlers.setValueEvent.call(input);
                    }
                    var umValue = [], vps = getMaskSet().validPositions;
                    for (var pndx in vps) vps[pndx].match && null != vps[pndx].match.fn && umValue.push(vps[pndx].input);
                    var unmaskedValue = 0 === umValue.length ? "" : (isRTL ? umValue.reverse() : umValue).join("");
                    if ($.isFunction(opts.onUnMask)) {
                        var bufferValue = (isRTL ? getBuffer().slice().reverse() : getBuffer()).join("");
                        unmaskedValue = opts.onUnMask.call(inputmask, bufferValue, unmaskedValue, opts);
                    }
                    return unmaskedValue;
                }

                function translatePosition(pos) {
                    return !isRTL || "number" != typeof pos || opts.greedy && "" === opts.placeholder || (pos = el.inputmask._valueGet().length - pos),
                        pos;
                }

                function caret(input, begin, end, notranslate) {
                    var range;
                    if (begin === undefined) return input.setSelectionRange ? (begin = input.selectionStart,
                        end = input.selectionEnd) : window.getSelection ? (range = window.getSelection().getRangeAt(0)).commonAncestorContainer.parentNode !== input && range.commonAncestorContainer !== input || (begin = range.startOffset,
                        end = range.endOffset) : document.selection && document.selection.createRange && (end = (begin = 0 - (range = document.selection.createRange()).duplicate().moveStart("character", -input.inputmask._valueGet().length)) + range.text.length),
                        {
                            begin: notranslate ? begin : translatePosition(begin),
                            end: notranslate ? end : translatePosition(end)
                        };
                    if ($.isArray(begin) && (end = isRTL ? begin[0] : begin[1], begin = isRTL ? begin[1] : begin[0]),
                        begin.begin !== undefined && (end = isRTL ? begin.begin : begin.end, begin = isRTL ? begin.end : begin.begin),
                        "number" == typeof begin) {
                        begin = notranslate ? begin : translatePosition(begin), end = "number" == typeof (end = notranslate ? end : translatePosition(end)) ? end : begin;
                        var scrollCalc = parseInt(((input.ownerDocument.defaultView || window).getComputedStyle ? (input.ownerDocument.defaultView || window).getComputedStyle(input, null) : input.currentStyle).fontSize) * end;
                        if (input.scrollLeft = scrollCalc > input.scrollWidth ? scrollCalc : 0, iphone || !1 !== opts.insertMode || begin !== end || end++,
                                input.inputmask.caretPos = {
                                    begin: begin,
                                    end: end
                                }, input.setSelectionRange) input.selectionStart = begin, input.selectionEnd = end; else if (window.getSelection) {
                            if (range = document.createRange(), input.firstChild === undefined || null === input.firstChild) {
                                var textNode = document.createTextNode("");
                                input.appendChild(textNode);
                            }
                            range.setStart(input.firstChild, begin < input.inputmask._valueGet().length ? begin : input.inputmask._valueGet().length),
                                range.setEnd(input.firstChild, end < input.inputmask._valueGet().length ? end : input.inputmask._valueGet().length),
                                range.collapse(!0);
                            var sel = window.getSelection();
                            sel.removeAllRanges(), sel.addRange(range);
                        } else input.createTextRange && ((range = input.createTextRange()).collapse(!0),
                            range.moveEnd("character", end), range.moveStart("character", begin), range.select());
                        renderColorMask(input, {
                            begin: begin,
                            end: end
                        });
                    }
                }

                function determineLastRequiredPosition(returnDefinition) {
                    var pos, testPos, buffer = getBuffer(), bl = buffer.length, lvp = getLastValidPosition(),
                        positions = {}, lvTest = getMaskSet().validPositions[lvp],
                        ndxIntlzr = lvTest !== undefined ? lvTest.locator.slice() : undefined;
                    for (pos = lvp + 1; pos < buffer.length; pos++) ndxIntlzr = (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1)).locator.slice(),
                        positions[pos] = $.extend(!0, {}, testPos);
                    var lvTestAlt = lvTest && lvTest.alternation !== undefined ? lvTest.locator[lvTest.alternation] : undefined;
                    for (pos = bl - 1; pos > lvp && (((testPos = positions[pos]).match.optionality || testPos.match.optionalQuantifier && testPos.match.newBlockMarker || lvTestAlt && (lvTestAlt !== positions[pos].locator[lvTest.alternation] && null != testPos.match.fn || null === testPos.match.fn && testPos.locator[lvTest.alternation] && checkAlternationMatch(testPos.locator[lvTest.alternation].toString().split(","), lvTestAlt.toString().split(",")) && "" !== getTests(pos)[0].def)) && buffer[pos] === getPlaceholder(pos, testPos.match)); pos--) bl--;
                    return returnDefinition ? {
                        l: bl,
                        def: positions[bl] ? positions[bl].match : undefined
                    } : bl;
                }

                function clearOptionalTail(buffer) {
                    for (var validPos, rl = determineLastRequiredPosition(), bl = buffer.length, lv = getMaskSet().validPositions[getLastValidPosition()]; rl < bl && !isMask(rl, !0) && (validPos = lv !== undefined ? getTestTemplate(rl, lv.locator.slice(""), lv) : getTest(rl)) && !0 !== validPos.match.optionality && (!0 !== validPos.match.optionalQuantifier && !0 !== validPos.match.newBlockMarker || rl + 1 === bl && "" === (lv !== undefined ? getTestTemplate(rl + 1, lv.locator.slice(""), lv) : getTest(rl + 1)).match.def);) rl++;
                    for (; (validPos = getMaskSet().validPositions[rl - 1]) && validPos && validPos.match.optionality && validPos.input === opts.skipOptionalPartCharacter;) rl--;
                    return buffer.splice(rl), buffer;
                }

                function isComplete(buffer) {
                    if ($.isFunction(opts.isComplete)) return opts.isComplete(buffer, opts);
                    if ("*" === opts.repeat) return undefined;
                    var complete = !1, lrp = determineLastRequiredPosition(!0), aml = seekPrevious(lrp.l);
                    if (lrp.def === undefined || lrp.def.newBlockMarker || lrp.def.optionality || lrp.def.optionalQuantifier) {
                        complete = !0;
                        for (var i = 0; i <= aml; i++) {
                            var test = getTestTemplate(i).match;
                            if (null !== test.fn && getMaskSet().validPositions[i] === undefined && !0 !== test.optionality && !0 !== test.optionalQuantifier || null === test.fn && buffer[i] !== getPlaceholder(i, test)) {
                                complete = !1;
                                break;
                            }
                        }
                    }
                    return complete;
                }

                function handleRemove(input, k, pos, strict, fromIsValid) {
                    if ((opts.numericInput || isRTL) && (k === Inputmask.keyCode.BACKSPACE ? k = Inputmask.keyCode.DELETE : k === Inputmask.keyCode.DELETE && (k = Inputmask.keyCode.BACKSPACE),
                            isRTL)) {
                        var pend = pos.end;
                        pos.end = pos.begin, pos.begin = pend;
                    }
                    if (k === Inputmask.keyCode.BACKSPACE && (pos.end - pos.begin < 1 || !1 === opts.insertMode) ? (pos.begin = seekPrevious(pos.begin),
                        getMaskSet().validPositions[pos.begin] !== undefined && getMaskSet().validPositions[pos.begin].input === opts.groupSeparator && pos.begin--,
                        !1 === opts.insertMode && pos.end !== getMaskSet().maskLength && pos.end--) : k === Inputmask.keyCode.DELETE && pos.begin === pos.end && (pos.end = isMask(pos.end, !0) && getMaskSet().validPositions[pos.end] && getMaskSet().validPositions[pos.end].input !== opts.radixPoint ? pos.end + 1 : seekNext(pos.end) + 1,
                        getMaskSet().validPositions[pos.begin] !== undefined && getMaskSet().validPositions[pos.begin].input === opts.groupSeparator && pos.end++),
                            revalidateMask(pos), !0 !== strict && null !== opts.keepStatic && !1 !== opts.keepStatic) {
                        var result = alternate(!0);
                        result && (pos.begin = result.caret !== undefined ? result.caret : result.pos ? seekNext(result.pos.begin ? result.pos.begin : result.pos) : getLastValidPosition(-1, !0));
                    }
                    var lvp = getLastValidPosition(pos.begin, !0);
                    if (lvp < pos.begin || -1 === pos.begin) getMaskSet().p = seekNext(lvp); else if (!0 !== strict && (getMaskSet().p = pos.begin,
                        !0 !== fromIsValid)) for (; getMaskSet().p < lvp && getMaskSet().validPositions[getMaskSet().p] === undefined;) getMaskSet().p++;
                }

                function initializeColorMask(input) {
                    var computedStyle = (input.ownerDocument.defaultView || window).getComputedStyle(input, null);
                    var template = document.createElement("div");
                    template.style.width = computedStyle.width, template.style.textAlign = computedStyle.textAlign,
                        colorMask = document.createElement("div"), input.inputmask.colorMask = colorMask,
                        colorMask.className = "im-colormask", input.parentNode.insertBefore(colorMask, input),
                        input.parentNode.removeChild(input), colorMask.appendChild(input), colorMask.appendChild(template),
                        input.style.left = template.offsetLeft + "px", $(colorMask).on("mouseleave", function (e) {
                        return EventHandlers.mouseleaveEvent.call(input, [e]);
                    }), $(colorMask).on("mouseenter", function (e) {
                        return EventHandlers.mouseenterEvent.call(input, [e]);
                    }), $(colorMask).on("click", function (e) {
                        return caret(input, function (clientx) {
                            var caretPos, e = document.createElement("span");
                            for (var style in computedStyle) isNaN(style) && -1 !== style.indexOf("font") && (e.style[style] = computedStyle[style]);
                            e.style.textTransform = computedStyle.textTransform, e.style.letterSpacing = computedStyle.letterSpacing,
                                e.style.position = "absolute", e.style.height = "auto", e.style.width = "auto",
                                e.style.visibility = "hidden", e.style.whiteSpace = "nowrap", document.body.appendChild(e);
                            var itl, inputText = input.inputmask._valueGet(), previousWidth = 0;
                            for (caretPos = 0, itl = inputText.length; caretPos <= itl; caretPos++) {
                                if (e.innerHTML += inputText.charAt(caretPos) || "_", e.offsetWidth >= clientx) {
                                    var offset1 = clientx - previousWidth, offset2 = e.offsetWidth - clientx;
                                    e.innerHTML = inputText.charAt(caretPos), caretPos = (offset1 -= e.offsetWidth / 3) < offset2 ? caretPos - 1 : caretPos;
                                    break;
                                }
                                previousWidth = e.offsetWidth;
                            }
                            return document.body.removeChild(e), caretPos;
                        }(e.clientX)), EventHandlers.clickEvent.call(input, [e]);
                    }), $(input).on("keydown", function (e) {
                        e.shiftKey || !1 === opts.insertMode || setTimeout(function () {
                            renderColorMask(input);
                        }, 0);
                    });
                }

                function renderColorMask(input, caretPos, clear) {
                    var test, testPos, ndxIntlzr, maskTemplate = [], isStatic = !1, pos = 0;

                    function setEntry(entry) {
                        if (entry === undefined && (entry = ""), isStatic || null !== test.fn && testPos.input !== undefined) if (isStatic && (null !== test.fn && testPos.input !== undefined || "" === test.def)) {
                            isStatic = !1;
                            var mtl = maskTemplate.length;
                            maskTemplate[mtl - 1] = maskTemplate[mtl - 1] + "</span>", maskTemplate.push(entry);
                        } else maskTemplate.push(entry); else isStatic = !0, maskTemplate.push("<span class='im-static'>" + entry);
                    }

                    if (colorMask !== undefined) {
                        var buffer = getBuffer();
                        if (caretPos === undefined ? caretPos = caret(input) : caretPos.begin === undefined && (caretPos = {
                                begin: caretPos,
                                end: caretPos
                            }), !0 !== clear) {
                            var lvp = getLastValidPosition();
                            do {
                                getMaskSet().validPositions[pos] ? (testPos = getMaskSet().validPositions[pos],
                                    test = testPos.match, ndxIntlzr = testPos.locator.slice(), setEntry(buffer[pos])) : (testPos = getTestTemplate(pos, ndxIntlzr, pos - 1),
                                    test = testPos.match, ndxIntlzr = testPos.locator.slice(), (!1 === opts.jitMasking || pos < lvp || "number" == typeof opts.jitMasking && isFinite(opts.jitMasking) && opts.jitMasking > pos) && setEntry(getPlaceholder(pos, test))),
                                    pos++;
                            } while ((maxLength === undefined || pos < maxLength) && (null !== test.fn || "" !== test.def) || lvp > pos || isStatic);
                            isStatic && setEntry(), document.activeElement === input && (maskTemplate.splice(caretPos.begin, 0, caretPos.begin === caretPos.end || caretPos.end > getMaskSet().maskLength ? '<mark class="im-caret" style="border-right-width: 1px;border-right-style: solid;">' : '<mark class="im-caret-select">'),
                                maskTemplate.splice(caretPos.end + 1, 0, "</mark>"));
                        }
                        var template = colorMask.getElementsByTagName("div")[0];
                        template.innerHTML = maskTemplate.join(""), input.inputmask.positionColorMask(input, template);
                    }
                }

                if (Inputmask.prototype.positionColorMask = function (input, template) {
                        input.style.left = template.offsetLeft + "px";
                    }, actionObj !== undefined) switch (actionObj.action) {
                    case "isComplete":
                        return el = actionObj.el, isComplete(getBuffer());

                    case "unmaskedvalue":
                        return el !== undefined && actionObj.value === undefined || (valueBuffer = actionObj.value,
                            valueBuffer = ($.isFunction(opts.onBeforeMask) && opts.onBeforeMask.call(inputmask, valueBuffer, opts) || valueBuffer).split(""),
                            checkVal(undefined, !1, !1, isRTL ? valueBuffer.reverse() : valueBuffer), $.isFunction(opts.onBeforeWrite) && opts.onBeforeWrite.call(inputmask, undefined, getBuffer(), 0, opts)),
                            unmaskedvalue(el);

                    case "mask":
                        !function (elem) {
                            EventRuler.off(elem);
                            var isSupported = function (input, opts) {
                                var elementType = input.getAttribute("type"),
                                    isSupported = "INPUT" === input.tagName && -1 !== $.inArray(elementType, opts.supportsInputType) || input.isContentEditable || "TEXTAREA" === input.tagName;
                                if (!isSupported) if ("INPUT" === input.tagName) {
                                    var el = document.createElement("input");
                                    el.setAttribute("type", elementType), isSupported = "text" === el.type, el = null;
                                } else isSupported = "partial";
                                return !1 !== isSupported ? function (npt) {
                                    var valueGet, valueSet;

                                    function getter() {
                                        return this.inputmask ? this.inputmask.opts.autoUnmask ? this.inputmask.unmaskedvalue() : -1 !== getLastValidPosition() || !0 !== opts.nullable ? document.activeElement === this && opts.clearMaskOnLostFocus ? (isRTL ? clearOptionalTail(getBuffer().slice()).reverse() : clearOptionalTail(getBuffer().slice())).join("") : valueGet.call(this) : "" : valueGet.call(this);
                                    }

                                    function setter(value) {
                                        valueSet.call(this, value), this.inputmask && $(this).trigger("setvalue", [value]);
                                    }

                                    if (!npt.inputmask.__valueGet) {
                                        if (!0 !== opts.noValuePatching) {
                                            if (Object.getOwnPropertyDescriptor) {
                                                "function" != typeof Object.getPrototypeOf && (Object.getPrototypeOf = "object" === _typeof("test".__proto__) ? function (object) {
                                                    return object.__proto__;
                                                } : function (object) {
                                                    return object.constructor.prototype;
                                                });
                                                var valueProperty = Object.getPrototypeOf ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(npt), "value") : undefined;
                                                valueProperty && valueProperty.get && valueProperty.set ? (valueGet = valueProperty.get,
                                                    valueSet = valueProperty.set, Object.defineProperty(npt, "value", {
                                                    get: getter,
                                                    set: setter,
                                                    configurable: !0
                                                })) : "INPUT" !== npt.tagName && (valueGet = function () {
                                                    return this.textContent;
                                                }, valueSet = function (value) {
                                                    this.textContent = value;
                                                }, Object.defineProperty(npt, "value", {
                                                    get: getter,
                                                    set: setter,
                                                    configurable: !0
                                                }));
                                            } else document.__lookupGetter__ && npt.__lookupGetter__("value") && (valueGet = npt.__lookupGetter__("value"),
                                                valueSet = npt.__lookupSetter__("value"), npt.__defineGetter__("value", getter),
                                                npt.__defineSetter__("value", setter));
                                            npt.inputmask.__valueGet = valueGet, npt.inputmask.__valueSet = valueSet;
                                        }
                                        npt.inputmask._valueGet = function (overruleRTL) {
                                            return isRTL && !0 !== overruleRTL ? valueGet.call(this.el).split("").reverse().join("") : valueGet.call(this.el);
                                        }, npt.inputmask._valueSet = function (value, overruleRTL) {
                                            valueSet.call(this.el, null === value || value === undefined ? "" : !0 !== overruleRTL && isRTL ? value.split("").reverse().join("") : value);
                                        }, valueGet === undefined && (valueGet = function () {
                                            return this.value;
                                        }, valueSet = function (value) {
                                            this.value = value;
                                        }, function (type) {
                                            if ($.valHooks && ($.valHooks[type] === undefined || !0 !== $.valHooks[type].inputmaskpatch)) {
                                                var valhookGet = $.valHooks[type] && $.valHooks[type].get ? $.valHooks[type].get : function (elem) {
                                                        return elem.value;
                                                    },
                                                    valhookSet = $.valHooks[type] && $.valHooks[type].set ? $.valHooks[type].set : function (elem, value) {
                                                        return elem.value = value, elem;
                                                    };
                                                $.valHooks[type] = {
                                                    get: function (elem) {
                                                        if (elem.inputmask) {
                                                            if (elem.inputmask.opts.autoUnmask) return elem.inputmask.unmaskedvalue();
                                                            var result = valhookGet(elem);
                                                            return -1 !== getLastValidPosition(undefined, undefined, elem.inputmask.maskset.validPositions) || !0 !== opts.nullable ? result : "";
                                                        }
                                                        return valhookGet(elem);
                                                    },
                                                    set: function (elem, value) {
                                                        var result, $elem = $(elem);
                                                        return result = valhookSet(elem, value), elem.inputmask && $elem.trigger("setvalue", [value]),
                                                            result;
                                                    },
                                                    inputmaskpatch: !0
                                                };
                                            }
                                        }(npt.type), function (npt) {
                                            EventRuler.on(npt, "mouseenter", function (event) {
                                                var $input = $(this);
                                                this.inputmask._valueGet() !== getBuffer().join("") && $input.trigger("setvalue");
                                            });
                                        }(npt));
                                    }
                                }(input) : input.inputmask = undefined, isSupported;
                            }(elem, opts);
                            if (!1 !== isSupported && ($el = $(el = elem), -1 === (maxLength = el !== undefined ? el.maxLength : undefined) && (maxLength = undefined),
                                !0 === opts.colorMask && initializeColorMask(el), mobile && ("inputmode" in el && (el.inputmode = opts.inputmode,
                                    el.setAttribute("inputmode", opts.inputmode)), !0 === opts.disablePredictiveText && ("autocorrect" in el ? el.autocorrect = !1 : (!0 !== opts.colorMask && initializeColorMask(el),
                                    el.type = "password"))), !0 === isSupported && (EventRuler.on(el, "submit", EventHandlers.submitEvent),
                                    EventRuler.on(el, "reset", EventHandlers.resetEvent), EventRuler.on(el, "blur", EventHandlers.blurEvent),
                                    EventRuler.on(el, "focus", EventHandlers.focusEvent), !0 !== opts.colorMask && (EventRuler.on(el, "click", EventHandlers.clickEvent),
                                    EventRuler.on(el, "mouseleave", EventHandlers.mouseleaveEvent), EventRuler.on(el, "mouseenter", EventHandlers.mouseenterEvent)),
                                    EventRuler.on(el, "dblclick", EventHandlers.dblclickEvent), EventRuler.on(el, "paste", EventHandlers.pasteEvent),
                                    EventRuler.on(el, "dragdrop", EventHandlers.pasteEvent), EventRuler.on(el, "drop", EventHandlers.pasteEvent),
                                    EventRuler.on(el, "cut", EventHandlers.cutEvent), EventRuler.on(el, "complete", opts.oncomplete),
                                    EventRuler.on(el, "incomplete", opts.onincomplete), EventRuler.on(el, "cleared", opts.oncleared),
                                    mobile || !0 === opts.inputEventOnly ? el.removeAttribute("maxLength") : (EventRuler.on(el, "keydown", EventHandlers.keydownEvent),
                                        EventRuler.on(el, "keypress", EventHandlers.keypressEvent)), EventRuler.on(el, "compositionstart", $.noop),
                                    EventRuler.on(el, "compositionupdate", $.noop), EventRuler.on(el, "compositionend", $.noop),
                                    EventRuler.on(el, "keyup", $.noop), EventRuler.on(el, "input", EventHandlers.inputFallBackEvent),
                                    EventRuler.on(el, "beforeinput", $.noop)), EventRuler.on(el, "setvalue", EventHandlers.setValueEvent),
                                    undoValue = getBufferTemplate().join(""), "" !== el.inputmask._valueGet(!0) || !1 === opts.clearMaskOnLostFocus || document.activeElement === el)) {
                                var initialValue = $.isFunction(opts.onBeforeMask) && opts.onBeforeMask.call(inputmask, el.inputmask._valueGet(!0), opts) || el.inputmask._valueGet(!0);
                                "" !== initialValue && checkVal(el, !0, !1, isRTL ? initialValue.split("").reverse() : initialValue.split(""));
                                var buffer = getBuffer().slice();
                                undoValue = buffer.join(""), !1 === isComplete(buffer) && opts.clearIncomplete && resetMaskSet(),
                                opts.clearMaskOnLostFocus && document.activeElement !== el && (-1 === getLastValidPosition() ? buffer = [] : clearOptionalTail(buffer)),
                                    writeBuffer(el, buffer), document.activeElement === el && caret(el, seekNext(getLastValidPosition()));
                            }
                        }(el);
                        break;

                    case "format":
                        return valueBuffer = ($.isFunction(opts.onBeforeMask) && opts.onBeforeMask.call(inputmask, actionObj.value, opts) || actionObj.value).split(""),
                            checkVal(undefined, !0, !1, isRTL ? valueBuffer.reverse() : valueBuffer), actionObj.metadata ? {
                            value: isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join(""),
                            metadata: maskScope.call(this, {
                                action: "getmetadata"
                            }, maskset, opts)
                        } : isRTL ? getBuffer().slice().reverse().join("") : getBuffer().join("");

                    case "isValid":
                        actionObj.value ? (valueBuffer = actionObj.value.split(""), checkVal(undefined, !0, !0, isRTL ? valueBuffer.reverse() : valueBuffer)) : actionObj.value = getBuffer().join("");
                        for (var buffer = getBuffer(), rl = determineLastRequiredPosition(), lmib = buffer.length - 1; lmib > rl && !isMask(lmib); lmib--) ;
                        return buffer.splice(rl, lmib + 1 - rl), isComplete(buffer) && actionObj.value === getBuffer().join("");

                    case "getemptymask":
                        return getBufferTemplate().join("");

                    case "remove":
                        if (el && el.inputmask) $.data(el, "_inputmask_opts", null), $el = $(el), el.inputmask._valueSet(opts.autoUnmask ? unmaskedvalue(el) : el.inputmask._valueGet(!0)),
                            EventRuler.off(el), el.inputmask.colorMask && ((colorMask = el.inputmask.colorMask).removeChild(el),
                            colorMask.parentNode.insertBefore(el, colorMask), colorMask.parentNode.removeChild(colorMask)),
                            Object.getOwnPropertyDescriptor && Object.getPrototypeOf ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value") && el.inputmask.__valueGet && Object.defineProperty(el, "value", {
                                get: el.inputmask.__valueGet,
                                set: el.inputmask.__valueSet,
                                configurable: !0
                            }) : document.__lookupGetter__ && el.__lookupGetter__("value") && el.inputmask.__valueGet && (el.__defineGetter__("value", el.inputmask.__valueGet),
                                el.__defineSetter__("value", el.inputmask.__valueSet)), el.inputmask = undefined;
                        return el;

                    case "getmetadata":
                        if ($.isArray(maskset.metadata)) {
                            var maskTarget = getMaskTemplate(!0, 0, !1).join("");
                            return $.each(maskset.metadata, function (ndx, mtdt) {
                                if (mtdt.mask === maskTarget) return maskTarget = mtdt, !1;
                            }), maskTarget;
                        }
                        return maskset.metadata;
                }
            }

            return Inputmask.prototype = {
                dataAttribute: "data-inputmask",
                defaults: {
                    placeholder: "_",
                    optionalmarker: ["[", "]"],
                    quantifiermarker: ["{", "}"],
                    groupmarker: ["(", ")"],
                    alternatormarker: "|",
                    escapeChar: "\\",
                    mask: null,
                    regex: null,
                    oncomplete: $.noop,
                    onincomplete: $.noop,
                    oncleared: $.noop,
                    repeat: 0,
                    greedy: !0,
                    autoUnmask: !1,
                    removeMaskOnSubmit: !1,
                    clearMaskOnLostFocus: !0,
                    insertMode: !0,
                    clearIncomplete: !1,
                    alias: null,
                    onKeyDown: $.noop,
                    onBeforeMask: null,
                    onBeforePaste: function (pastedValue, opts) {
                        return $.isFunction(opts.onBeforeMask) ? opts.onBeforeMask.call(this, pastedValue, opts) : pastedValue;
                    },
                    onBeforeWrite: null,
                    onUnMask: null,
                    showMaskOnFocus: !0,
                    showMaskOnHover: !0,
                    onKeyValidation: $.noop,
                    skipOptionalPartCharacter: " ",
                    numericInput: !1,
                    rightAlign: !1,
                    undoOnEscape: !0,
                    radixPoint: "",
                    _radixDance: !1,
                    groupSeparator: "",
                    keepStatic: null,
                    positionCaretOnTab: !0,
                    tabThrough: !1,
                    supportsInputType: ["text", "tel", "password", "search"],
                    ignorables: [8, 9, 13, 19, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 93, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 0, 229],
                    isComplete: null,
                    preValidation: null,
                    postValidation: null,
                    staticDefinitionSymbol: undefined,
                    jitMasking: !1,
                    nullable: !0,
                    inputEventOnly: !1,
                    noValuePatching: !1,
                    positionCaretOnClick: "lvp",
                    casing: null,
                    inputmode: "verbatim",
                    colorMask: !1,
                    disablePredictiveText: !1,
                    importDataAttributes: !0
                },
                definitions: {
                    9: {
                        validator: "[0-9１-９]",
                        definitionSymbol: "*"
                    },
                    a: {
                        validator: "[A-Za-zА-яЁёÀ-ÿµ]",
                        definitionSymbol: "*"
                    },
                    "*": {
                        validator: "[0-9１-９A-Za-zА-яЁёÀ-ÿµ]"
                    }
                },
                aliases: {},
                masksCache: {},
                mask: function (elems) {
                    var that = this;
                    return "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)),
                        elems = elems.nodeName ? [elems] : elems, $.each(elems, function (ndx, el) {
                        var scopedOpts = $.extend(!0, {}, that.opts);
                        if (function (npt, opts, userOptions, dataAttribute) {
                                if (!0 === opts.importDataAttributes) {
                                    var option, dataoptions, optionData, p,
                                        importOption = function (option, optionData) {
                                            null !== (optionData = optionData !== undefined ? optionData : npt.getAttribute(dataAttribute + "-" + option)) && ("string" == typeof optionData && (0 === option.indexOf("on") ? optionData = window[optionData] : "false" === optionData ? optionData = !1 : "true" === optionData && (optionData = !0)),
                                                userOptions[option] = optionData);
                                        }, attrOptions = npt.getAttribute(dataAttribute);
                                    if (attrOptions && "" !== attrOptions && (attrOptions = attrOptions.replace(/'/g, '"'),
                                            dataoptions = JSON.parse("{" + attrOptions + "}")), dataoptions) for (p in optionData = undefined,
                                        dataoptions) if ("alias" === p.toLowerCase()) {
                                        optionData = dataoptions[p];
                                        break;
                                    }
                                    for (option in importOption("alias", optionData), userOptions.alias && resolveAlias(userOptions.alias, userOptions, opts),
                                        opts) {
                                        if (dataoptions) for (p in optionData = undefined, dataoptions) if (p.toLowerCase() === option.toLowerCase()) {
                                            optionData = dataoptions[p];
                                            break;
                                        }
                                        importOption(option, optionData);
                                    }
                                }
                                return $.extend(!0, opts, userOptions), ("rtl" === npt.dir || opts.rightAlign) && (npt.style.textAlign = "right"),
                                ("rtl" === npt.dir || opts.numericInput) && (npt.dir = "ltr", npt.removeAttribute("dir"),
                                    opts.isRTL = !0), Object.keys(userOptions).length;
                            }(el, scopedOpts, $.extend(!0, {}, that.userOptions), that.dataAttribute)) {
                            var maskset = generateMaskSet(scopedOpts, that.noMasksCache);
                            maskset !== undefined && (el.inputmask !== undefined && (el.inputmask.opts.autoUnmask = !0,
                                el.inputmask.remove()), el.inputmask = new Inputmask(undefined, undefined, !0),
                                el.inputmask.opts = scopedOpts, el.inputmask.noMasksCache = that.noMasksCache, el.inputmask.userOptions = $.extend(!0, {}, that.userOptions),
                                el.inputmask.isRTL = scopedOpts.isRTL || scopedOpts.numericInput, el.inputmask.el = el,
                                el.inputmask.maskset = maskset, $.data(el, "_inputmask_opts", scopedOpts), maskScope.call(el.inputmask, {
                                action: "mask"
                            }));
                        }
                    }), elems && elems[0] && elems[0].inputmask || this;
                },
                option: function (options, noremask) {
                    return "string" == typeof options ? this.opts[options] : "object" === (void 0 === options ? "undefined" : _typeof(options)) ? ($.extend(this.userOptions, options),
                    this.el && !0 !== noremask && this.mask(this.el), this) : void 0;
                },
                unmaskedvalue: function (value) {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                        maskScope.call(this, {
                            action: "unmaskedvalue",
                            value: value
                        });
                },
                remove: function () {
                    return maskScope.call(this, {
                        action: "remove"
                    });
                },
                getemptymask: function () {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                        maskScope.call(this, {
                            action: "getemptymask"
                        });
                },
                hasMaskedValue: function () {
                    return !this.opts.autoUnmask;
                },
                isComplete: function () {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                        maskScope.call(this, {
                            action: "isComplete"
                        });
                },
                getmetadata: function () {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                        maskScope.call(this, {
                            action: "getmetadata"
                        });
                },
                isValid: function (value) {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                        maskScope.call(this, {
                            action: "isValid",
                            value: value
                        });
                },
                format: function (value, metadata) {
                    return this.maskset = this.maskset || generateMaskSet(this.opts, this.noMasksCache),
                        maskScope.call(this, {
                            action: "format",
                            value: value,
                            metadata: metadata
                        });
                },
                setValue: function (value) {
                    this.el && $(this.el).trigger("setvalue", [value]);
                },
                analyseMask: function (mask, regexMask, opts) {
                    var match, m, openingToken, currentOpeningToken, alternator, lastMatch, groupToken,
                        tokenizer = /(?:[?*+]|\{[0-9\+\*]+(?:,[0-9\+\*]*)?(?:\|[0-9\+\*]*)?\})|[^.?*+^${[]()|\\]+|./g,
                        regexTokenizer = /\[\^?]?(?:[^\\\]]+|\\[\S\s]?)*]?|\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9][0-9]*|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|c[A-Za-z]|[\S\s]?)|\((?:\?[:=!]?)?|(?:[?*+]|\{[0-9]+(?:,[0-9]*)?\})\??|[^.?*+^${[()|\\]+|./g,
                        escaped = !1, currentToken = new MaskToken(), openenings = [], maskTokens = [];

                    function MaskToken(isGroup, isOptional, isQuantifier, isAlternator) {
                        this.matches = [], this.openGroup = isGroup || !1, this.alternatorGroup = !1, this.isGroup = isGroup || !1,
                            this.isOptional = isOptional || !1, this.isQuantifier = isQuantifier || !1, this.isAlternator = isAlternator || !1,
                            this.quantifier = {
                                min: 1,
                                max: 1
                            };
                    }

                    function insertTestDefinition(mtoken, element, position) {
                        position = position !== undefined ? position : mtoken.matches.length;
                        var prevMatch = mtoken.matches[position - 1];
                        if (regexMask) 0 === element.indexOf("[") || escaped && /\\d|\\s|\\w]/i.test(element) || "." === element ? mtoken.matches.splice(position++, 0, {
                            fn: new RegExp(element, opts.casing ? "i" : ""),
                            optionality: mtoken.isOptional,
                            newBlockMarker: prevMatch === undefined || prevMatch.def !== element,
                            casing: null,
                            def: element,
                            placeholder: undefined,
                            nativeDef: element
                        }) : (escaped && (element = element[element.length - 1]), $.each(element.split(""), function (ndx, lmnt) {
                            prevMatch = mtoken.matches[position - 1], mtoken.matches.splice(position++, 0, {
                                fn: null,
                                optionality: mtoken.isOptional,
                                newBlockMarker: prevMatch === undefined || prevMatch.def !== lmnt && null !== prevMatch.fn,
                                casing: null,
                                def: opts.staticDefinitionSymbol || lmnt,
                                placeholder: opts.staticDefinitionSymbol !== undefined ? lmnt : undefined,
                                nativeDef: lmnt
                            });
                        })), escaped = !1; else {
                            var maskdef = (opts.definitions ? opts.definitions[element] : undefined) || Inputmask.prototype.definitions[element];
                            maskdef && !escaped ? mtoken.matches.splice(position++, 0, {
                                fn: maskdef.validator ? "string" == typeof maskdef.validator ? new RegExp(maskdef.validator, opts.casing ? "i" : "") : new function () {
                                    this.test = maskdef.validator;
                                }() : new RegExp("."),
                                optionality: mtoken.isOptional,
                                newBlockMarker: prevMatch === undefined || prevMatch.def !== (maskdef.definitionSymbol || element),
                                casing: maskdef.casing,
                                def: maskdef.definitionSymbol || element,
                                placeholder: maskdef.placeholder,
                                nativeDef: element
                            }) : (mtoken.matches.splice(position++, 0, {
                                fn: null,
                                optionality: mtoken.isOptional,
                                newBlockMarker: prevMatch === undefined || prevMatch.def !== element && null !== prevMatch.fn,
                                casing: null,
                                def: opts.staticDefinitionSymbol || element,
                                placeholder: opts.staticDefinitionSymbol !== undefined ? element : undefined,
                                nativeDef: element
                            }), escaped = !1);
                        }
                    }

                    function defaultCase() {
                        if (openenings.length > 0) {
                            if (insertTestDefinition(currentOpeningToken = openenings[openenings.length - 1], m),
                                    currentOpeningToken.isAlternator) {
                                alternator = openenings.pop();
                                for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1;
                                openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1]).matches.push(alternator) : currentToken.matches.push(alternator);
                            }
                        } else insertTestDefinition(currentToken, m);
                    }

                    for (regexMask && (opts.optionalmarker[0] = undefined, opts.optionalmarker[1] = undefined); match = regexMask ? regexTokenizer.exec(mask) : tokenizer.exec(mask);) {
                        if (m = match[0], regexMask) switch (m.charAt(0)) {
                            case "?":
                                m = "{0,1}";
                                break;

                            case "+":
                            case "*":
                                m = "{" + m + "}";
                        }
                        if (escaped) defaultCase(); else switch (m.charAt(0)) {
                            case opts.escapeChar:
                                escaped = !0, regexMask && defaultCase();
                                break;

                            case opts.optionalmarker[1]:
                            case opts.groupmarker[1]:
                                if ((openingToken = openenings.pop()).openGroup = !1, openingToken !== undefined) if (openenings.length > 0) {
                                    if ((currentOpeningToken = openenings[openenings.length - 1]).matches.push(openingToken),
                                            currentOpeningToken.isAlternator) {
                                        alternator = openenings.pop();
                                        for (var mndx = 0; mndx < alternator.matches.length; mndx++) alternator.matches[mndx].isGroup = !1,
                                            alternator.matches[mndx].alternatorGroup = !1;
                                        openenings.length > 0 ? (currentOpeningToken = openenings[openenings.length - 1]).matches.push(alternator) : currentToken.matches.push(alternator);
                                    }
                                } else currentToken.matches.push(openingToken); else defaultCase();
                                break;

                            case opts.optionalmarker[0]:
                                openenings.push(new MaskToken(!1, !0));
                                break;

                            case opts.groupmarker[0]:
                                openenings.push(new MaskToken(!0));
                                break;

                            case opts.quantifiermarker[0]:
                                var quantifier = new MaskToken(!1, !1, !0),
                                    mqj = (m = m.replace(/[{}]/g, "")).split("|"), mq = mqj[0].split(","),
                                    mq0 = isNaN(mq[0]) ? mq[0] : parseInt(mq[0]),
                                    mq1 = 1 === mq.length ? mq0 : isNaN(mq[1]) ? mq[1] : parseInt(mq[1]);
                                if ("*" !== mq1 && "+" !== mq1 || (mq0 = "*" === mq1 ? 0 : 1), quantifier.quantifier = {
                                        min: mq0,
                                        max: mq1,
                                        jit: mqj[1]
                                    }, openenings.length > 0) {
                                    var matches = openenings[openenings.length - 1].matches;
                                    (match = matches.pop()).isGroup || ((groupToken = new MaskToken(!0)).matches.push(match),
                                        match = groupToken), matches.push(match), matches.push(quantifier);
                                } else (match = currentToken.matches.pop()).isGroup || (regexMask && null === match.fn && "." === match.def && (match.fn = new RegExp(match.def, opts.casing ? "i" : "")),
                                    (groupToken = new MaskToken(!0)).matches.push(match), match = groupToken), currentToken.matches.push(match),
                                    currentToken.matches.push(quantifier);
                                break;

                            case opts.alternatormarker:
                                if (openenings.length > 0) {
                                    var subToken = (currentOpeningToken = openenings[openenings.length - 1]).matches[currentOpeningToken.matches.length - 1];
                                    lastMatch = currentOpeningToken.openGroup && (subToken.matches === undefined || !1 === subToken.isGroup && !1 === subToken.isAlternator) ? openenings.pop() : currentOpeningToken.matches.pop();
                                } else lastMatch = currentToken.matches.pop();
                                if (lastMatch.isAlternator) openenings.push(lastMatch); else if (lastMatch.alternatorGroup ? (alternator = openenings.pop(),
                                        lastMatch.alternatorGroup = !1) : alternator = new MaskToken(!1, !1, !1, !0), alternator.matches.push(lastMatch),
                                        openenings.push(alternator), lastMatch.openGroup) {
                                    lastMatch.openGroup = !1;
                                    var alternatorGroup = new MaskToken(!0);
                                    alternatorGroup.alternatorGroup = !0, openenings.push(alternatorGroup);
                                }
                                break;

                            default:
                                defaultCase();
                        }
                    }
                    for (; openenings.length > 0;) openingToken = openenings.pop(), currentToken.matches.push(openingToken);
                    return currentToken.matches.length > 0 && (!function verifyGroupMarker(maskToken) {
                        maskToken && maskToken.matches && $.each(maskToken.matches, function (ndx, token) {
                            var nextToken = maskToken.matches[ndx + 1];
                            (nextToken === undefined || nextToken.matches === undefined || !1 === nextToken.isQuantifier) && token && token.isGroup && (token.isGroup = !1,
                            regexMask || (insertTestDefinition(token, opts.groupmarker[0], 0), !0 !== token.openGroup && insertTestDefinition(token, opts.groupmarker[1]))),
                                verifyGroupMarker(token);
                        });
                    }(currentToken), maskTokens.push(currentToken)), (opts.numericInput || opts.isRTL) && function reverseTokens(maskToken) {
                        for (var match in maskToken.matches = maskToken.matches.reverse(), maskToken.matches) if (maskToken.matches.hasOwnProperty(match)) {
                            var intMatch = parseInt(match);
                            if (maskToken.matches[match].isQuantifier && maskToken.matches[intMatch + 1] && maskToken.matches[intMatch + 1].isGroup) {
                                var qt = maskToken.matches[match];
                                maskToken.matches.splice(match, 1), maskToken.matches.splice(intMatch + 1, 0, qt);
                            }
                            maskToken.matches[match].matches !== undefined ? maskToken.matches[match] = reverseTokens(maskToken.matches[match]) : maskToken.matches[match] = ((st = maskToken.matches[match]) === opts.optionalmarker[0] ? st = opts.optionalmarker[1] : st === opts.optionalmarker[1] ? st = opts.optionalmarker[0] : st === opts.groupmarker[0] ? st = opts.groupmarker[1] : st === opts.groupmarker[1] && (st = opts.groupmarker[0]),
                                st);
                        }
                        var st;
                        return maskToken;
                    }(maskTokens[0]), maskTokens;
                }
            }, Inputmask.extendDefaults = function (options) {
                $.extend(!0, Inputmask.prototype.defaults, options);
            }, Inputmask.extendDefinitions = function (definition) {
                $.extend(!0, Inputmask.prototype.definitions, definition);
            }, Inputmask.extendAliases = function (alias) {
                $.extend(!0, Inputmask.prototype.aliases, alias);
            }, Inputmask.format = function (value, options, metadata) {
                return Inputmask(options).format(value, metadata);
            }, Inputmask.unmask = function (value, options) {
                return Inputmask(options).unmaskedvalue(value);
            }, Inputmask.isValid = function (value, options) {
                return Inputmask(options).isValid(value);
            }, Inputmask.remove = function (elems) {
                "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)),
                    elems = elems.nodeName ? [elems] : elems, $.each(elems, function (ndx, el) {
                    el.inputmask && el.inputmask.remove();
                });
            }, Inputmask.setValue = function (elems, value) {
                "string" == typeof elems && (elems = document.getElementById(elems) || document.querySelectorAll(elems)),
                    elems = elems.nodeName ? [elems] : elems, $.each(elems, function (ndx, el) {
                    el.inputmask ? el.inputmask.setValue(value) : $(el).trigger("setvalue", [value]);
                });
            }, Inputmask.escapeRegex = function (str) {
                return str.replace(new RegExp("(\\" + ["/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\", "$", "^"].join("|\\") + ")", "gim"), "\\$1");
            }, Inputmask.keyCode = {
                BACKSPACE: 8,
                BACKSPACE_SAFARI: 127,
                DELETE: 46,
                DOWN: 40,
                END: 35,
                ENTER: 13,
                ESCAPE: 27,
                HOME: 36,
                INSERT: 45,
                LEFT: 37,
                PAGE_DOWN: 34,
                PAGE_UP: 33,
                RIGHT: 39,
                SPACE: 32,
                TAB: 9,
                UP: 38,
                X: 88,
                CONTROL: 17
            }, Inputmask;
        }, __WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(5), __webpack_require__(6)],
        void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
    }, function (module, exports) {
        module.exports = jQuery;
    }, function (module, exports, __webpack_require__) {
        "use strict";
        __webpack_require__(4), __webpack_require__(7), __webpack_require__(8), __webpack_require__(9);
        var _inputmask2 = _interopRequireDefault(__webpack_require__(1)),
            _inputmask4 = _interopRequireDefault(__webpack_require__(0)),
            _jquery2 = _interopRequireDefault(__webpack_require__(2));

        function _interopRequireDefault(obj) {
            return obj && obj.__esModule ? obj : {
                default: obj
            };
        }

        _inputmask4.default === _jquery2.default && __webpack_require__(10), window.Inputmask = _inputmask2.default;
    }, function (module, exports, __webpack_require__) {
        "use strict";
        var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
        "function" == typeof Symbol && Symbol.iterator;
        factory = function ($, Inputmask) {
            var formatCode = {
                d: ["[1-9]|[12][0-9]|3[01]", Date.prototype.setDate, "day", Date.prototype.getDate],
                dd: ["0[1-9]|[12][0-9]|3[01]", Date.prototype.setDate, "day", function () {
                    return pad(Date.prototype.getDate.call(this), 2);
                }],
                ddd: [""],
                dddd: [""],
                m: ["[1-9]|1[012]", Date.prototype.setMonth, "month", function () {
                    return Date.prototype.getMonth.call(this) + 1;
                }],
                mm: ["0[1-9]|1[012]", Date.prototype.setMonth, "month", function () {
                    return pad(Date.prototype.getMonth.call(this) + 1, 2);
                }],
                mmm: [""],
                mmmm: [""],
                yy: ["[0-9]{2}", Date.prototype.setFullYear, "year", function () {
                    return pad(Date.prototype.getFullYear.call(this), 2);
                }],
                yyyy: ["[0-9]{4}", Date.prototype.setFullYear, "year", function () {
                    return pad(Date.prototype.getFullYear.call(this), 4);
                }],
                h: ["[1-9]|1[0-2]", Date.prototype.setHours, "hours", Date.prototype.getHours],
                hh: ["0[1-9]|1[0-2]", Date.prototype.setHours, "hours", function () {
                    return pad(Date.prototype.getHours.call(this), 2);
                }],
                hhh: ["[0-9]+", Date.prototype.setHours, "hours", Date.prototype.getHours],
                H: ["1?[0-9]|2[0-3]", Date.prototype.setHours, "hours", Date.prototype.getHours],
                HH: ["[01][0-9]|2[0-3]", Date.prototype.setHours, "hours", function () {
                    return pad(Date.prototype.getHours.call(this), 2);
                }],
                HHH: ["[0-9]+", Date.prototype.setHours, "hours", Date.prototype.getHours],
                M: ["[1-5]?[0-9]", Date.prototype.setMinutes, "minutes", Date.prototype.getMinutes],
                MM: ["[0-5][0-9]", Date.prototype.setMinutes, "minutes", function () {
                    return pad(Date.prototype.getMinutes.call(this), 2);
                }],
                s: ["[1-5]?[0-9]", Date.prototype.setSeconds, "seconds", Date.prototype.getSeconds],
                ss: ["[0-5][0-9]", Date.prototype.setSeconds, "seconds", function () {
                    return pad(Date.prototype.getSeconds.call(this), 2);
                }],
                l: ["[0-9]{3}", Date.prototype.setMilliseconds, "milliseconds", function () {
                    return pad(Date.prototype.getMilliseconds.call(this), 3);
                }],
                L: ["[0-9]{2}", Date.prototype.setMilliseconds, "milliseconds", function () {
                    return pad(Date.prototype.getMilliseconds.call(this), 2);
                }],
                t: ["[ap]"],
                tt: ["[ap]m"],
                T: ["[AP]"],
                TT: ["[AP]M"],
                Z: [""],
                o: [""],
                S: [""]
            }, formatAlias = {
                isoDate: "yyyy-mm-dd",
                isoTime: "HH:MM:ss",
                isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
                isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
            };

            function getTokenizer(opts) {
                if (!opts.tokenizer) {
                    var tokens = [];
                    for (var ndx in formatCode) -1 === tokens.indexOf(ndx[0]) && tokens.push(ndx[0]);
                    opts.tokenizer = "(" + tokens.join("+|") + ")+?|.", opts.tokenizer = new RegExp(opts.tokenizer, "g");
                }
                return opts.tokenizer;
            }

            function parse(format, dateObjValue, opts) {
                for (var match, mask = ""; match = getTokenizer(opts).exec(format);) {
                    if (void 0 === dateObjValue) mask += formatCode[match[0]] ? "(" + formatCode[match[0]][0] + ")" : Inputmask.escapeRegex(match[0]); else if (formatCode[match[0]]) mask += formatCode[match[0]][3].call(dateObjValue.date); else mask += match[0];
                }
                return mask;
            }

            function pad(val, len) {
                for (val = String(val), len = len || 2; val.length < len;) val = "0" + val;
                return val;
            }

            function analyseMask(maskString, format, opts) {
                var targetProp, match, dateOperation, dateObj = {
                    date: new Date(1, 0, 1)
                }, mask = maskString;

                function extendYear(year) {
                    var correctedyear = 4 === year.length ? year : new Date().getFullYear().toString().substr(0, 4 - year.length) + year;
                    return opts.min && opts.min.year && opts.max && opts.max.year ? (correctedyear = correctedyear.replace(/[^0-9]/g, ""),
                        correctedyear += opts.min.year == opts.max.year ? opts.min.year.substr(correctedyear.length) : ("" !== correctedyear && 0 == opts.max.year.indexOf(correctedyear) ? parseInt(opts.max.year) - 1 : parseInt(opts.min.year) + 1).toString().substr(correctedyear.length)) : correctedyear = correctedyear.replace(/[^0-9]/g, "0"),
                        correctedyear;
                }

                function setValue(dateObj, value, opts) {
                    "year" === targetProp ? (dateObj[targetProp] = extendYear(value), dateObj["raw" + targetProp] = value) : dateObj[targetProp] = opts.min && value.match(/[^0-9]/) ? opts.min[targetProp] : value,
                    void 0 !== dateOperation && dateOperation.call(dateObj.date, "month" == targetProp ? parseInt(dateObj[targetProp]) - 1 : dateObj[targetProp]);
                }

                if ("string" == typeof mask) {
                    for (; match = getTokenizer(opts).exec(format);) {
                        var value = mask.slice(0, match[0].length);
                        formatCode.hasOwnProperty(match[0]) && (targetProp = formatCode[match[0]][2], dateOperation = formatCode[match[0]][1],
                            setValue(dateObj, value, opts)), mask = mask.slice(value.length);
                    }
                    return dateObj;
                }
            }

            return Inputmask.extendAliases({
                datetime: {
                    mask: function (opts) {
                        return formatCode.S = opts.i18n.ordinalSuffix.join("|"), opts.inputFormat = formatAlias[opts.inputFormat] || opts.inputFormat,
                            opts.displayFormat = formatAlias[opts.displayFormat] || opts.displayFormat || opts.inputFormat,
                            opts.outputFormat = formatAlias[opts.outputFormat] || opts.outputFormat || opts.inputFormat,
                            opts.placeholder = "" !== opts.placeholder ? opts.placeholder : opts.inputFormat,
                            opts.min = analyseMask(opts.min, opts.inputFormat, opts), opts.max = analyseMask(opts.max, opts.inputFormat, opts),
                            opts.regex = parse(opts.inputFormat, void 0, opts), null;
                    },
                    placeholder: "",
                    inputFormat: "isoDateTime",
                    displayFormat: void 0,
                    outputFormat: void 0,
                    min: null,
                    max: null,
                    i18n: {
                        dayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                        monthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                        ordinalSuffix: ["st", "nd", "rd", "th"]
                    },
                    postValidation: function (buffer, currentResult, opts) {
                        var result = currentResult, dateParts = analyseMask(buffer.join(""), opts.inputFormat, opts);
                        return result && dateParts.date.getTime() == dateParts.date.getTime() && (result = (result = function (dateParts, currentResult) {
                            return (!isFinite(dateParts.day) || "29" == dateParts.day && !isFinite(dateParts.rawyear) || new Date(dateParts.date.getFullYear(), isFinite(dateParts.month) ? dateParts.month : dateParts.date.getMonth() + 1, 0).getDate() >= dateParts.day) && currentResult;
                        }(dateParts, result)) && function (dateParts, opts) {
                            var result = !0;
                            return opts.min && opts.min.date.getTime() == opts.min.date.getTime() && (result = opts.min.date.getTime() <= dateParts.date.getTime()),
                            result && opts.max && opts.max.date.getTime() == opts.max.date.getTime() && (result = opts.max.date.getTime() >= dateParts.date.getTime()),
                                result;
                        }(dateParts, opts)), result;
                    },
                    onKeyDown: function (e, buffer, caretPos, opts) {
                        if (e.ctrlKey && e.keyCode === Inputmask.keyCode.RIGHT) {
                            for (var match, today = new Date(), date = ""; match = getTokenizer(opts).exec(opts.inputFormat);) "d" === match[0].charAt(0) ? date += pad(today.getDate(), match[0].length) : "m" === match[0].charAt(0) ? date += pad(today.getMonth() + 1, match[0].length) : "yyyy" === match[0] ? date += today.getFullYear().toString() : "y" === match[0].charAt(0) && (date += pad(today.getYear(), match[0].length));
                            this.inputmask._valueSet(date), $(this).trigger("setvalue");
                        }
                    },
                    onUnMask: function (maskedValue, unmaskedValue, opts) {
                        return parse(opts.outputFormat, analyseMask(maskedValue, opts.inputFormat, opts), opts);
                    },
                    casing: function (elem, test, pos, validPositions) {
                        return 0 == test.nativeDef.indexOf("[ap]") ? elem.toLowerCase() : 0 == test.nativeDef.indexOf("[AP]") ? elem.toUpperCase() : elem;
                    },
                    insertMode: !1
                }
            }), Inputmask;
        }, __WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(1)],
        void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
    }, function (module, exports, __webpack_require__) {
        "use strict";
        var __WEBPACK_AMD_DEFINE_RESULT__;
        "function" == typeof Symbol && Symbol.iterator;
        void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = function () {
            return window;
        }.call(exports, __webpack_require__, exports, module)) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
    }, function (module, exports, __webpack_require__) {
        "use strict";
        var __WEBPACK_AMD_DEFINE_RESULT__;
        "function" == typeof Symbol && Symbol.iterator;
        void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = function () {
            return document;
        }.call(exports, __webpack_require__, exports, module)) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
    }, function (module, exports, __webpack_require__) {
        "use strict";
        var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
        "function" == typeof Symbol && Symbol.iterator;
        factory = function ($, Inputmask) {
            return Inputmask.extendDefinitions({
                A: {
                    validator: "[A-Za-zА-яЁёÀ-ÿµ]",
                    casing: "upper"
                },
                "&": {
                    validator: "[0-9A-Za-zА-яЁёÀ-ÿµ]",
                    casing: "upper"
                },
                "#": {
                    validator: "[0-9A-Fa-f]",
                    casing: "upper"
                }
            }), Inputmask.extendAliases({
                url: {
                    definitions: {
                        i: {
                            validator: "."
                        }
                    },
                    mask: "(\\http://)|(\\http\\s://)|(ftp://)|(ftp\\s://)i{+}",
                    insertMode: !1,
                    autoUnmask: !1,
                    inputmode: "url"
                },
                ip: {
                    mask: "i[i[i]].i[i[i]].i[i[i]].i[i[i]]",
                    definitions: {
                        i: {
                            validator: function (chrs, maskset, pos, strict, opts) {
                                return pos - 1 > -1 && "." !== maskset.buffer[pos - 1] ? (chrs = maskset.buffer[pos - 1] + chrs,
                                    chrs = pos - 2 > -1 && "." !== maskset.buffer[pos - 2] ? maskset.buffer[pos - 2] + chrs : "0" + chrs) : chrs = "00" + chrs,
                                    new RegExp("25[0-5]|2[0-4][0-9]|[01][0-9][0-9]").test(chrs);
                            }
                        }
                    },
                    onUnMask: function (maskedValue, unmaskedValue, opts) {
                        return maskedValue;
                    },
                    inputmode: "numeric"
                },
                email: {
                    mask: "*{1,64}[.*{1,64}][.*{1,64}][.*{1,63}]@-{1,63}.-{1,63}[.-{1,63}][.-{1,63}]",
                    greedy: !1,
                    casing: "lower",
                    onBeforePaste: function (pastedValue, opts) {
                        return (pastedValue = pastedValue.toLowerCase()).replace("mailto:", "");
                    },
                    definitions: {
                        "*": {
                            validator: "[0-9１-９A-Za-zА-яЁёÀ-ÿµ!#$%&'*+/=?^_`{|}~-]"
                        },
                        "-": {
                            validator: "[0-9A-Za-z-]"
                        }
                    },
                    onUnMask: function (maskedValue, unmaskedValue, opts) {
                        return maskedValue;
                    },
                    inputmode: "email"
                },
                mac: {
                    mask: "##:##:##:##:##:##"
                },
                vin: {
                    mask: "V{13}9{4}",
                    definitions: {
                        V: {
                            validator: "[A-HJ-NPR-Za-hj-npr-z\\d]",
                            casing: "upper"
                        }
                    },
                    clearIncomplete: !0,
                    autoUnmask: !0
                }
            }), Inputmask;
        }, __WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(1)],
        void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
    }, function (module, exports, __webpack_require__) {
        "use strict";
        var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
        "function" == typeof Symbol && Symbol.iterator;
        factory = function ($, Inputmask, undefined) {
            function autoEscape(txt, opts) {
                for (var escapedTxt = "", i = 0; i < txt.length; i++) Inputmask.prototype.definitions[txt.charAt(i)] || opts.definitions[txt.charAt(i)] || opts.optionalmarker.start === txt.charAt(i) || opts.optionalmarker.end === txt.charAt(i) || opts.quantifiermarker.start === txt.charAt(i) || opts.quantifiermarker.end === txt.charAt(i) || opts.groupmarker.start === txt.charAt(i) || opts.groupmarker.end === txt.charAt(i) || opts.alternatormarker === txt.charAt(i) ? escapedTxt += "\\" + txt.charAt(i) : escapedTxt += txt.charAt(i);
                return escapedTxt;
            }

            return Inputmask.extendAliases({
                numeric: {
                    mask: function (opts) {
                        if (0 !== opts.repeat && isNaN(opts.integerDigits) && (opts.integerDigits = opts.repeat),
                                opts.repeat = 0, opts.groupSeparator === opts.radixPoint && opts.digits && "0" !== opts.digits && ("." === opts.radixPoint ? opts.groupSeparator = "," : "," === opts.radixPoint ? opts.groupSeparator = "." : opts.groupSeparator = ""),
                            " " === opts.groupSeparator && (opts.skipOptionalPartCharacter = undefined), opts.autoGroup = opts.autoGroup && "" !== opts.groupSeparator,
                            opts.autoGroup && ("string" == typeof opts.groupSize && isFinite(opts.groupSize) && (opts.groupSize = parseInt(opts.groupSize)),
                                isFinite(opts.integerDigits))) {
                            var seps = Math.floor(opts.integerDigits / opts.groupSize),
                                mod = opts.integerDigits % opts.groupSize;
                            opts.integerDigits = parseInt(opts.integerDigits) + (0 === mod ? seps - 1 : seps),
                            opts.integerDigits < 1 && (opts.integerDigits = "*");
                        }
                        opts.placeholder.length > 1 && (opts.placeholder = opts.placeholder.charAt(0)),
                        "radixFocus" === opts.positionCaretOnClick && "" === opts.placeholder && !1 === opts.integerOptional && (opts.positionCaretOnClick = "lvp"),
                            opts.definitions[";"] = opts.definitions["~"], opts.definitions[";"].definitionSymbol = "~",
                        !0 === opts.numericInput && (opts.positionCaretOnClick = "radixFocus" === opts.positionCaretOnClick ? "lvp" : opts.positionCaretOnClick,
                            opts.digitsOptional = !1, isNaN(opts.digits) && (opts.digits = 2), opts.decimalProtect = !1);
                        var mask = "[+]";
                        if (mask += autoEscape(opts.prefix, opts), !0 === opts.integerOptional ? mask += "~{1," + opts.integerDigits + "}" : mask += "~{" + opts.integerDigits + "}",
                            opts.digits !== undefined) {
                            var radixDef = opts.decimalProtect ? ":" : opts.radixPoint,
                                dq = opts.digits.toString().split(",");
                            isFinite(dq[0]) && dq[1] && isFinite(dq[1]) ? mask += radixDef + ";{" + opts.digits + "}" : (isNaN(opts.digits) || parseInt(opts.digits) > 0) && (opts.digitsOptional ? mask += "[" + radixDef + ";{1," + opts.digits + "}]" : mask += radixDef + ";{" + opts.digits + "}");
                        }
                        return mask += autoEscape(opts.suffix, opts), mask += "[-]", opts.greedy = !1, mask;
                    },
                    placeholder: "",
                    greedy: !1,
                    digits: "*",
                    digitsOptional: !0,
                    enforceDigitsOnBlur: !1,
                    radixPoint: ".",
                    positionCaretOnClick: "radixFocus",
                    groupSize: 3,
                    groupSeparator: "",
                    autoGroup: !1,
                    allowMinus: !0,
                    negationSymbol: {
                        front: "-",
                        back: ""
                    },
                    integerDigits: "+",
                    integerOptional: !0,
                    prefix: "",
                    suffix: "",
                    rightAlign: !0,
                    decimalProtect: !0,
                    min: null,
                    max: null,
                    step: 1,
                    insertMode: !0,
                    autoUnmask: !1,
                    unmaskAsNumber: !1,
                    inputmode: "numeric",
                    preValidation: function (buffer, pos, c, isSelection, opts, maskset) {
                        if ("-" === c || c === opts.negationSymbol.front) return !0 === opts.allowMinus && (opts.isNegative = opts.isNegative === undefined || !opts.isNegative,
                        "" === buffer.join("") || {
                            caret: pos,
                            dopost: !0
                        });
                        if (!1 === isSelection && c === opts.radixPoint && opts.digits !== undefined && (isNaN(opts.digits) || parseInt(opts.digits) > 0)) {
                            var radixPos = $.inArray(opts.radixPoint, buffer);
                            if (-1 !== radixPos && maskset.validPositions[radixPos] !== undefined) return !0 === opts.numericInput ? pos === radixPos : {
                                caret: radixPos + 1
                            };
                        }
                        return !0;
                    },
                    postValidation: function (buffer, currentResult, opts) {
                        var suffix = opts.suffix.split(""), prefix = opts.prefix.split("");
                        if (currentResult.pos === undefined && currentResult.caret !== undefined && !0 !== currentResult.dopost) return currentResult;
                        var caretPos = currentResult.caret !== undefined ? currentResult.caret : currentResult.pos,
                            maskedValue = buffer.slice();
                        opts.numericInput && (caretPos = maskedValue.length - caretPos - 1, maskedValue = maskedValue.reverse());
                        var charAtPos = maskedValue[caretPos];
                        if (charAtPos === opts.groupSeparator && (charAtPos = maskedValue[caretPos += 1]),
                            caretPos === maskedValue.length - opts.suffix.length - 1 && charAtPos === opts.radixPoint) return currentResult;
                        charAtPos !== undefined && charAtPos !== opts.radixPoint && charAtPos !== opts.negationSymbol.front && charAtPos !== opts.negationSymbol.back && (maskedValue[caretPos] = "?",
                            opts.prefix.length > 0 && caretPos >= (!1 === opts.isNegative ? 1 : 0) && caretPos < opts.prefix.length - 1 + (!1 === opts.isNegative ? 1 : 0) ? prefix[caretPos - (!1 === opts.isNegative ? 1 : 0)] = "?" : opts.suffix.length > 0 && caretPos >= maskedValue.length - opts.suffix.length - (!1 === opts.isNegative ? 1 : 0) && (suffix[caretPos - (maskedValue.length - opts.suffix.length - (!1 === opts.isNegative ? 1 : 0))] = "?")),
                            prefix = prefix.join(""), suffix = suffix.join("");
                        var processValue = maskedValue.join("").replace(prefix, "");
                        if (processValue = (processValue = (processValue = (processValue = processValue.replace(suffix, "")).replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), "")).replace(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"), "")).replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), ""),
                            isNaN(opts.placeholder) && (processValue = processValue.replace(new RegExp(Inputmask.escapeRegex(opts.placeholder), "g"), "")),
                            processValue.length > 1 && 1 !== processValue.indexOf(opts.radixPoint) && ("0" === charAtPos && (processValue = processValue.replace(/^\?/g, "")),
                                processValue = processValue.replace(/^0/g, "")), processValue.charAt(0) === opts.radixPoint && "" !== opts.radixPoint && !0 !== opts.numericInput && (processValue = "0" + processValue),
                            "" !== processValue) {
                            if (processValue = processValue.split(""), (!opts.digitsOptional || opts.enforceDigitsOnBlur && "blur" === currentResult.event) && isFinite(opts.digits)) {
                                var radixPosition = $.inArray(opts.radixPoint, processValue),
                                    rpb = $.inArray(opts.radixPoint, maskedValue);
                                -1 === radixPosition && (processValue.push(opts.radixPoint), radixPosition = processValue.length - 1);
                                for (var i = 1; i <= opts.digits; i++) opts.digitsOptional && (!opts.enforceDigitsOnBlur || "blur" !== currentResult.event) || processValue[radixPosition + i] !== undefined && processValue[radixPosition + i] !== opts.placeholder.charAt(0) ? -1 !== rpb && maskedValue[rpb + i] !== undefined && (processValue[radixPosition + i] = processValue[radixPosition + i] || maskedValue[rpb + i]) : processValue[radixPosition + i] = currentResult.placeholder || opts.placeholder.charAt(0);
                            }
                            if (!0 !== opts.autoGroup || "" === opts.groupSeparator || charAtPos === opts.radixPoint && currentResult.pos === undefined && !currentResult.dopost) processValue = processValue.join(""); else {
                                var addRadix = processValue[processValue.length - 1] === opts.radixPoint && currentResult.c === opts.radixPoint;
                                processValue = Inputmask(function (buffer, opts) {
                                    var postMask = "";
                                    if (postMask += "(" + opts.groupSeparator + "*{" + opts.groupSize + "}){*}", "" !== opts.radixPoint) {
                                        var radixSplit = buffer.join("").split(opts.radixPoint);
                                        radixSplit[1] && (postMask += opts.radixPoint + "*{" + radixSplit[1].match(/^\d*\??\d*/)[0].length + "}");
                                    }
                                    return postMask;
                                }(processValue, opts), {
                                    numericInput: !0,
                                    jitMasking: !0,
                                    definitions: {
                                        "*": {
                                            validator: "[0-9?]",
                                            cardinality: 1
                                        }
                                    }
                                }).format(processValue.join("")), addRadix && (processValue += opts.radixPoint),
                                processValue.charAt(0) === opts.groupSeparator && processValue.substr(1);
                            }
                        }
                        if (opts.isNegative && "blur" === currentResult.event && (opts.isNegative = "0" !== processValue),
                                processValue = prefix + processValue, processValue += suffix, opts.isNegative && (processValue = opts.negationSymbol.front + processValue,
                                processValue += opts.negationSymbol.back), processValue = processValue.split(""),
                            charAtPos !== undefined) if (charAtPos !== opts.radixPoint && charAtPos !== opts.negationSymbol.front && charAtPos !== opts.negationSymbol.back) (caretPos = $.inArray("?", processValue)) > -1 ? processValue[caretPos] = charAtPos : caretPos = currentResult.caret || 0; else if (charAtPos === opts.radixPoint || charAtPos === opts.negationSymbol.front || charAtPos === opts.negationSymbol.back) {
                            var newCaretPos = $.inArray(charAtPos, processValue);
                            -1 !== newCaretPos && (caretPos = newCaretPos);
                        }
                        opts.numericInput && (caretPos = processValue.length - caretPos - 1, processValue = processValue.reverse());
                        var rslt = {
                            caret: charAtPos === undefined || currentResult.pos !== undefined ? caretPos + (opts.numericInput ? -1 : 1) : caretPos,
                            buffer: processValue,
                            refreshFromBuffer: currentResult.dopost || buffer.join("") !== processValue.join("")
                        };
                        return rslt.refreshFromBuffer ? rslt : currentResult;
                    },
                    onBeforeWrite: function (e, buffer, caretPos, opts) {
                        if (e) switch (e.type) {
                            case "keydown":
                                return opts.postValidation(buffer, {
                                    caret: caretPos,
                                    dopost: !0
                                }, opts);

                            case "blur":
                            case "checkval":
                                var unmasked;
                                if (function (opts) {
                                        opts.parseMinMaxOptions === undefined && (null !== opts.min && (opts.min = opts.min.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
                                        "," === opts.radixPoint && (opts.min = opts.min.replace(opts.radixPoint, ".")),
                                            opts.min = isFinite(opts.min) ? parseFloat(opts.min) : NaN, isNaN(opts.min) && (opts.min = Number.MIN_VALUE)),
                                        null !== opts.max && (opts.max = opts.max.toString().replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
                                        "," === opts.radixPoint && (opts.max = opts.max.replace(opts.radixPoint, ".")),
                                            opts.max = isFinite(opts.max) ? parseFloat(opts.max) : NaN, isNaN(opts.max) && (opts.max = Number.MAX_VALUE)),
                                            opts.parseMinMaxOptions = "done");
                                    }(opts), null !== opts.min || null !== opts.max) {
                                    if (unmasked = opts.onUnMask(buffer.join(""), undefined, $.extend({}, opts, {
                                            unmaskAsNumber: !0
                                        })), null !== opts.min && unmasked < opts.min) return opts.isNegative = opts.min < 0,
                                        opts.postValidation(opts.min.toString().replace(".", opts.radixPoint).split(""), {
                                            caret: caretPos,
                                            dopost: !0,
                                            placeholder: "0"
                                        }, opts);
                                    if (null !== opts.max && unmasked > opts.max) return opts.isNegative = opts.max < 0,
                                        opts.postValidation(opts.max.toString().replace(".", opts.radixPoint).split(""), {
                                            caret: caretPos,
                                            dopost: !0,
                                            placeholder: "0"
                                        }, opts);
                                }
                                return opts.postValidation(buffer, {
                                    caret: caretPos,
                                    placeholder: "0",
                                    event: "blur"
                                }, opts);

                            case "_checkval":
                                return {
                                    caret: caretPos
                                };
                        }
                    },
                    regex: {
                        integerPart: function (opts, emptyCheck) {
                            return emptyCheck ? new RegExp("[" + Inputmask.escapeRegex(opts.negationSymbol.front) + "+]?") : new RegExp("[" + Inputmask.escapeRegex(opts.negationSymbol.front) + "+]?\\d+");
                        },
                        integerNPart: function (opts) {
                            return new RegExp("[\\d" + Inputmask.escapeRegex(opts.groupSeparator) + Inputmask.escapeRegex(opts.placeholder.charAt(0)) + "]+");
                        }
                    },
                    definitions: {
                        "~": {
                            validator: function (chrs, maskset, pos, strict, opts, isSelection) {
                                var isValid = strict ? new RegExp("[0-9" + Inputmask.escapeRegex(opts.groupSeparator) + "]").test(chrs) : new RegExp("[0-9]").test(chrs);
                                if (!0 === isValid) {
                                    if (!0 !== opts.numericInput && maskset.validPositions[pos] !== undefined && "~" === maskset.validPositions[pos].match.def && !isSelection) {
                                        var processValue = maskset.buffer.join(""),
                                            pvRadixSplit = (processValue = (processValue = processValue.replace(new RegExp("[-" + Inputmask.escapeRegex(opts.negationSymbol.front) + "]", "g"), "")).replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), "")).split(opts.radixPoint);
                                        pvRadixSplit.length > 1 && (pvRadixSplit[1] = pvRadixSplit[1].replace(/0/g, opts.placeholder.charAt(0))),
                                        "0" === pvRadixSplit[0] && (pvRadixSplit[0] = pvRadixSplit[0].replace(/0/g, opts.placeholder.charAt(0))),
                                            processValue = pvRadixSplit[0] + opts.radixPoint + pvRadixSplit[1] || "";
                                        var bufferTemplate = maskset._buffer.join("");
                                        for (processValue === opts.radixPoint && (processValue = bufferTemplate); null === processValue.match(Inputmask.escapeRegex(bufferTemplate) + "$");) bufferTemplate = bufferTemplate.slice(1);
                                        isValid = (processValue = (processValue = processValue.replace(bufferTemplate, "")).split(""))[pos] === undefined ? {
                                            pos: pos,
                                            remove: pos
                                        } : {
                                            pos: pos
                                        };
                                    }
                                } else strict || chrs !== opts.radixPoint || maskset.validPositions[pos - 1] !== undefined || (isValid = {
                                    insert: {
                                        pos: pos,
                                        c: 0
                                    },
                                    pos: pos + 1
                                });
                                return isValid;
                            },
                            cardinality: 1
                        },
                        "+": {
                            validator: function (chrs, maskset, pos, strict, opts) {
                                return opts.allowMinus && ("-" === chrs || chrs === opts.negationSymbol.front);
                            },
                            cardinality: 1,
                            placeholder: ""
                        },
                        "-": {
                            validator: function (chrs, maskset, pos, strict, opts) {
                                return opts.allowMinus && chrs === opts.negationSymbol.back;
                            },
                            cardinality: 1,
                            placeholder: ""
                        },
                        ":": {
                            validator: function (chrs, maskset, pos, strict, opts) {
                                var radix = "[" + Inputmask.escapeRegex(opts.radixPoint) + "]",
                                    isValid = new RegExp(radix).test(chrs);
                                return isValid && maskset.validPositions[pos] && maskset.validPositions[pos].match.placeholder === opts.radixPoint && (isValid = {
                                    caret: pos + 1
                                }), isValid;
                            },
                            cardinality: 1,
                            placeholder: function (opts) {
                                return opts.radixPoint;
                            }
                        }
                    },
                    onUnMask: function (maskedValue, unmaskedValue, opts) {
                        if ("" === unmaskedValue && !0 === opts.nullable) return unmaskedValue;
                        var processValue = maskedValue.replace(opts.prefix, "");
                        return processValue = (processValue = processValue.replace(opts.suffix, "")).replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
                        "" !== opts.placeholder.charAt(0) && (processValue = processValue.replace(new RegExp(opts.placeholder.charAt(0), "g"), "0")),
                            opts.unmaskAsNumber ? ("" !== opts.radixPoint && -1 !== processValue.indexOf(opts.radixPoint) && (processValue = processValue.replace(Inputmask.escapeRegex.call(this, opts.radixPoint), ".")),
                                processValue = (processValue = processValue.replace(new RegExp("^" + Inputmask.escapeRegex(opts.negationSymbol.front)), "-")).replace(new RegExp(Inputmask.escapeRegex(opts.negationSymbol.back) + "$"), ""),
                                Number(processValue)) : processValue;
                    },
                    isComplete: function (buffer, opts) {
                        var maskedValue = buffer.join("");
                        if (buffer.slice().join("") !== maskedValue) return !1;
                        var processValue = maskedValue.replace(opts.prefix, "");
                        return processValue = (processValue = processValue.replace(opts.suffix, "")).replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator) + "([0-9]{3})", "g"), "$1"),
                        "," === opts.radixPoint && (processValue = processValue.replace(Inputmask.escapeRegex(opts.radixPoint), ".")),
                            isFinite(processValue);
                    },
                    onBeforeMask: function (initialValue, opts) {
                        if (opts.isNegative = undefined, "number" == typeof initialValue && "" !== opts.radixPoint && (initialValue = initialValue.toString().replace(".", opts.radixPoint)),
                                initialValue = initialValue.toString().charAt(initialValue.length - 1) === opts.radixPoint ? initialValue.toString().substr(0, initialValue.length - 1) : initialValue.toString(),
                            "" !== opts.radixPoint && isFinite(initialValue)) {
                            var vs = initialValue.split("."),
                                groupSize = "" !== opts.groupSeparator ? parseInt(opts.groupSize) : 0;
                            2 === vs.length && (vs[0].length > groupSize || vs[1].length > groupSize || vs[0].length <= groupSize && vs[1].length < groupSize) && (initialValue = initialValue.replace(".", opts.radixPoint));
                        }
                        var kommaMatches = initialValue.match(/,/g), dotMatches = initialValue.match(/\./g);
                        if (initialValue = dotMatches && kommaMatches ? dotMatches.length > kommaMatches.length ? (initialValue = initialValue.replace(/\./g, "")).replace(",", opts.radixPoint) : kommaMatches.length > dotMatches.length ? (initialValue = initialValue.replace(/,/g, "")).replace(".", opts.radixPoint) : initialValue.indexOf(".") < initialValue.indexOf(",") ? initialValue.replace(/\./g, "") : initialValue.replace(/,/g, "") : initialValue.replace(new RegExp(Inputmask.escapeRegex(opts.groupSeparator), "g"), ""),
                            0 === opts.digits && (-1 !== initialValue.indexOf(".") ? initialValue = initialValue.substring(0, initialValue.indexOf(".")) : -1 !== initialValue.indexOf(",") && (initialValue = initialValue.substring(0, initialValue.indexOf(",")))),
                            "" !== opts.radixPoint && isFinite(opts.digits) && -1 !== initialValue.indexOf(opts.radixPoint)) {
                            var decPart = initialValue.split(opts.radixPoint)[1].match(new RegExp("\\d*"))[0];
                            if (parseInt(opts.digits) < decPart.toString().length) {
                                var digitsFactor = Math.pow(10, parseInt(opts.digits));
                                initialValue = initialValue.replace(Inputmask.escapeRegex(opts.radixPoint), "."),
                                    initialValue = (initialValue = Math.round(parseFloat(initialValue) * digitsFactor) / digitsFactor).toString().replace(".", opts.radixPoint);
                            }
                        }
                        return initialValue;
                    },
                    onKeyDown: function (e, buffer, caretPos, opts) {
                        var $input = $(this);
                        if (e.ctrlKey) switch (e.keyCode) {
                            case Inputmask.keyCode.UP:
                                $input.val(parseFloat(this.inputmask.unmaskedvalue()) + parseInt(opts.step)), $input.trigger("setvalue");
                                break;

                            case Inputmask.keyCode.DOWN:
                                $input.val(parseFloat(this.inputmask.unmaskedvalue()) - parseInt(opts.step)), $input.trigger("setvalue");
                        }
                    }
                },
                currency: {
                    prefix: "$ ",
                    groupSeparator: ",",
                    alias: "numeric",
                    placeholder: "0",
                    autoGroup: !0,
                    digits: 2,
                    digitsOptional: !1,
                    clearMaskOnLostFocus: !1
                },
                decimal: {
                    alias: "numeric"
                },
                integer: {
                    alias: "numeric",
                    digits: 0,
                    radixPoint: ""
                },
                percentage: {
                    alias: "numeric",
                    digits: 2,
                    digitsOptional: !0,
                    radixPoint: ".",
                    placeholder: "0",
                    autoGroup: !1,
                    min: 0,
                    max: 100,
                    suffix: " %",
                    allowMinus: !1
                }
            }), Inputmask;
        }, __WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(1)],
        void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
    }, function (module, exports, __webpack_require__) {
        "use strict";
        var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory;
        "function" == typeof Symbol && Symbol.iterator;
        factory = function ($, Inputmask) {
            function maskSort(a, b) {
                var maska = (a.mask || a).replace(/#/g, "0").replace(/\)/, "0").replace(/[+()#-]/g, ""),
                    maskb = (b.mask || b).replace(/#/g, "0").replace(/\)/, "0").replace(/[+()#-]/g, "");
                return maska.localeCompare(maskb);
            }

            var analyseMaskBase = Inputmask.prototype.analyseMask;
            return Inputmask.prototype.analyseMask = function (mask, regexMask, opts) {
                var maskGroups = {};
                return opts.phoneCodes && (opts.phoneCodes && opts.phoneCodes.length > 1e3 && (function reduceVariations(masks, previousVariation, previousmaskGroup) {
                    previousVariation = previousVariation || "", previousmaskGroup = previousmaskGroup || maskGroups,
                    "" !== previousVariation && (previousmaskGroup[previousVariation] = {});
                    for (var variation = "", maskGroup = previousmaskGroup[previousVariation] || previousmaskGroup, i = masks.length - 1; i >= 0; i--) maskGroup[variation = (mask = masks[i].mask || masks[i]).substr(0, 1)] = maskGroup[variation] || [],
                        maskGroup[variation].unshift(mask.substr(1)), masks.splice(i, 1);
                    for (var ndx in maskGroup) maskGroup[ndx].length > 500 && reduceVariations(maskGroup[ndx].slice(), ndx, maskGroup);
                }((mask = mask.substr(1, mask.length - 2)).split(opts.groupmarker[1] + opts.alternatormarker + opts.groupmarker[0])),
                    mask = function rebuild(maskGroup) {
                        var mask = "", submasks = [];
                        for (var ndx in maskGroup) $.isArray(maskGroup[ndx]) ? 1 === maskGroup[ndx].length ? submasks.push(ndx + maskGroup[ndx]) : submasks.push(ndx + opts.groupmarker[0] + maskGroup[ndx].join(opts.groupmarker[1] + opts.alternatormarker + opts.groupmarker[0]) + opts.groupmarker[1]) : submasks.push(ndx + rebuild(maskGroup[ndx]));
                        return 1 === submasks.length ? mask += submasks[0] : mask += opts.groupmarker[0] + submasks.join(opts.groupmarker[1] + opts.alternatormarker + opts.groupmarker[0]) + opts.groupmarker[1],
                            mask;
                    }(maskGroups)), mask = mask.replace(/9/g, "\\9")), analyseMaskBase.call(this, mask, regexMask, opts);
            }, Inputmask.extendAliases({
                abstractphone: {
                    groupmarker: ["<", ">"],
                    countrycode: "",
                    phoneCodes: [],
                    keepStatic: "auto",
                    mask: function (opts) {
                        return opts.definitions = {
                            "#": Inputmask.prototype.definitions[9]
                        }, opts.phoneCodes.sort(maskSort);
                    },
                    onBeforeMask: function (value, opts) {
                        var processedValue = value.replace(/^0{1,2}/, "").replace(/[\s]/g, "");
                        return (processedValue.indexOf(opts.countrycode) > 1 || -1 === processedValue.indexOf(opts.countrycode)) && (processedValue = "+" + opts.countrycode + processedValue),
                            processedValue;
                    },
                    onUnMask: function (maskedValue, unmaskedValue, opts) {
                        return maskedValue.replace(/[()#-]/g, "");
                    },
                    inputmode: "tel"
                }
            }), Inputmask;
        }, __WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(0), __webpack_require__(1)],
        void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
    }, function (module, exports, __webpack_require__) {
        "use strict";
        var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__, factory,
            _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
                return typeof obj;
            } : function (obj) {
                return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
        factory = function ($, Inputmask) {
            return void 0 === $.fn.inputmask && ($.fn.inputmask = function (fn, options) {
                var nptmask, input = this[0];
                if (void 0 === options && (options = {}), "string" == typeof fn) switch (fn) {
                    case "unmaskedvalue":
                        return input && input.inputmask ? input.inputmask.unmaskedvalue() : $(input).val();

                    case "remove":
                        return this.each(function () {
                            this.inputmask && this.inputmask.remove();
                        });

                    case "getemptymask":
                        return input && input.inputmask ? input.inputmask.getemptymask() : "";

                    case "hasMaskedValue":
                        return !(!input || !input.inputmask) && input.inputmask.hasMaskedValue();

                    case "isComplete":
                        return !input || !input.inputmask || input.inputmask.isComplete();

                    case "getmetadata":
                        return input && input.inputmask ? input.inputmask.getmetadata() : void 0;

                    case "setvalue":
                        Inputmask.setValue(input, options);
                        break;

                    case "option":
                        if ("string" != typeof options) return this.each(function () {
                            if (void 0 !== this.inputmask) return this.inputmask.option(options);
                        });
                        if (input && void 0 !== input.inputmask) return input.inputmask.option(options);
                        break;

                    default:
                        return options.alias = fn, nptmask = new Inputmask(options), this.each(function () {
                            nptmask.mask(this);
                        });
                } else {
                    if ("object" == (void 0 === fn ? "undefined" : _typeof(fn))) return nptmask = new Inputmask(fn),
                        void 0 === fn.mask && void 0 === fn.alias ? this.each(function () {
                            if (void 0 !== this.inputmask) return this.inputmask.option(fn);
                            nptmask.mask(this);
                        }) : this.each(function () {
                            nptmask.mask(this);
                        });
                    if (void 0 === fn) return this.each(function () {
                        (nptmask = new Inputmask(options)).mask(this);
                    });
                }
            }), $.fn.inputmask;
        }, __WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(1)],
        void 0 === (__WEBPACK_AMD_DEFINE_RESULT__ = "function" == typeof (__WEBPACK_AMD_DEFINE_FACTORY__ = factory) ? __WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__) : __WEBPACK_AMD_DEFINE_FACTORY__) || (module.exports = __WEBPACK_AMD_DEFINE_RESULT__);
    }]);


/*!
* phone-codes/phone.js
* https://github.com/RobinHerbots/Inputmask
* Copyright (c) 2010 - 2018 Robin Herbots
* Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php)
* Version: 4.0.0-beta.29
*/

!function(factory) {
    "function" == typeof define && define.amd ? define([ "../inputmask" ], factory) : "object" == typeof exports ? module.exports = factory(require("../inputmask")) : factory(window.Inputmask);
}(function(Inputmask) {
    return Inputmask.extendAliases({
        phone: {
            alias: "abstractphone",
            phoneCodes: [
                {
                    mask: "+375(##)###-##-##",
                    cc: "BY",
                    cd: "Belarus",
                    desc_en: "",
                    name_ru: "Беларусь (Белоруссия)",
                    desc_ru: ""
                },
                {
                    mask: "+7(###)###-##-##",
                    cc: "RU",
                    cd: "Russia",
                    desc_en: "",
                    name_ru: "Россия",
                    desc_ru: ""
                }]
        }
    }), Inputmask;
});

});
var requestCaptcha;
var signInCaptcha;

function onloadCallback() {
    if (document.getElementById('signInCaptcha')) {
        window.signInCaptcha = grecaptcha.render('signInCaptcha', {'sitekey': reSITEKEY, callback: captchaCallbackSI});
    }
    window.requestCaptcha = grecaptcha.render('passCaptcha', {'sitekey': reSITEKEY, callback: captchaCallbackRQ});
}

function captchaCallbackSI() {
    captchaValidator(window.signInCaptcha, '#signInCaptcha');
}

function captchaCallbackRQ() {
    captchaValidator(window.requestCaptcha, '#passCaptcha');
}

function captchaValidator(captchaId, element) {
    var captchaValid = captchaValidation(captchaId);
    var $element = $(element);
    $element.parent().removeClass('has-error error-required');
    if (!captchaValid) {
        $element.parent().addClass('has-error error-required');
    }
    return captchaValid;
}

function captchaValidation(captchaId) {
    var res = grecaptcha.getResponse(captchaId);
    return res.length > 0;
}

ready(function () {
    var TOKEN_URL = '/api/oauth/token';
    var REGISTER_URL = '/api/pupils/register';
    var RESETPASS_URL = '/api/oauth/requestPassword';
    var REGEMAIL = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    var signInView = new SignInView();
    var requestPasswordView = new RequestPasswordView();
    var userView = new UserView();
    var settingView;
    var $pupilSettingsDialogContent;

    window.pupilViews = {};

    window.loadingStart = loadingStart;
    window.loadingEnd = loadingEnd;

    var auth = new jqOAuth({
        events: {
            login: function () {
            },
            logout: function () {
            },
            tokenExpiration: function () {
                // this event is fired when 401 calls are
                // received from the server. Has to return
                // an ajax promise.
                // New tokens are set with auth.setAccessToken()

                return $.post(TOKEN_URL, {
                    grant_type: 'refresh_token',
                    refresh_token: auth.data.refreshToken
                })
                    .done(function (response) {
                        auth.setAccessToken(response.access_token, response.refresh_token);
                    })
                    .fail(function () {
                        signInView.show();
                        userView.hide();
                    });
            }
        }
    });
    var dialog = document.getElementById('settingsDialog');
    var snackbarContainer  = document.getElementById('snackbar');
    var settingsDialog = document.getElementById('pupilSettingsDialog');
    var requestDialog = document.getElementById('sendRequestDialog');
    var dialogTransition;
    var settingsDialogTransition;
    var requestDialogTransition;

    $(document).on('lyceum:dataready', onDataViewReady);
    $(document).on('lyceum:needReload', getUser);
    $(document).on('lyceum:logout', logout);
    $(document).on('lyceum:globalError', globalError);

    $(document).on('lyceum:openDialog', openDialog);
    $(document).on('lyceum:openRequestDialog', openRequestDialog);
    $(document).on('lyceum:openSettingsDialog', openSettingsDialog);

    $(document).on('lyceum:showNotification', showNotification);

    $(document).on('click', '#settingsDialog .close-dialog', closeDialog);
    $(document).on('click', '#sendRequestDialog .close-dialog', closeRequestDialog);
    $(document).on('click', '#pupilSettingsDialog .close-dialog', closeSettingsDialog);

    $(document).on('click', '#savePupilSettings', savePupilSettings);
    $(document).on('click', '.settings-list-item.pupil-settingd', openPupilSettingsDialog);
    $(document).on('keyup', '#pupilSettingsDialog .form-input', pupilSettingsValidation);

    createDialog();
    getUser();

    function getUser() {
        if (dialog.opened) {
            closeDialog();
        }
        if (requestDialog.opened) {
            closeRequestDialog();
        }
        if (settingsDialog.opened) {
            closeSettingsDialog();
        }
        $.get('/api/pupils/userInfo')
            .done(function (response) {
                signInView.hide();
                userView.show(response);
                $pupilSettingsDialogContent = $('#pupilSettingsDialogContent').detach();
            })
            .fail(function () {
                signInView.show();
                userView.hide();
            });
    }

    function onDataViewReady() {
        componentHandler.upgradeAllRegistered();
    }

    function RequestPasswordView() {
        var $passRequestView = $('#passRequestView');

        this.show = show;
        this.hide = hide;

        $(document).on('click', '#requestPassBtn', requestPass);
        $(document).on('click', '#requestCancelBtn', requestCancel);
        $(document).on('click', '#returnToLogin', returnToLogin);
        $(document).on('keyup', '#passEmail', emailValidator);

        function show() {
            if (window.requestCaptcha && window.grecaptcha) {
                grecaptcha.reset(requestCaptcha);
            }

            $passRequestView
                .removeClass('hiddenView')
                .addClass('visibleView');
            $('#passReqNotFoundError')
                .removeClass('visibleView')
                .addClass('hiddenView');
            $('#passReqFound')
                .removeClass('visibleView')
                .addClass('hiddenView');
            $('#passReqForm')
                .removeClass('hiddenView')
                .addClass('visibleView');
            $('#passEmail').val('');
        }

        function hide() {
            $passRequestView
                .removeClass('visibleView')
                .addClass('hiddenView');
        }

        function requestPass() {
            var captchaValid = captchaValidator(window.requestCaptcha, '#passCaptcha'),
                emailValid = emailValidator();
            $('#passReqNotFoundError')
                .removeClass('visibleView')
                .addClass('hiddenView');

            if (captchaValid && emailValid) {
                loadingStart();
                $.post(RESETPASS_URL, {
                    mail: $('#passEmail').val().toLowerCase()
                })
                    .done(function (res) {
                        if (res.error && res.error === "user not found") {
                            $('#passReqNotFoundError')
                                .removeClass('hiddenView')
                                .addClass('visibleView');
                        }
                        if (res.error && res.error === "error") {
                            $(document).trigger('lyceum:globalError');
                        }
                        if (res === "Email Sent") {
                            $('#passReqFound')
                                .removeClass('hiddenView')
                                .addClass('visibleView');
                            $('#passReqForm')
                                .removeClass('visibleView')
                                .addClass('hiddenView');
                        }
                        loadingEnd();
                    })
                    .fail(function () {
                        $(document).trigger('lyceum:globalError');
                        loadingEnd();
                    });
            }
        }

        function requestCancel() {
            signInView.show();
            requestPasswordView.hide();
        }

        function returnToLogin(e) {
            e.preventDefault();
            signInView.show();
            requestPasswordView.hide();
        }

        function emailValidator() {
            var $passEmail = $('#passEmail');
            var emailContainer = $passEmail.parent().removeClass('has-error');
            var email = $passEmail.val();

            if (email.length === 0) {
                emailContainer.addClass('has-error').addClass('error-required');
            } else {
                emailContainer.removeClass('error-required');
            }

            if (email.length > 100) {
                emailContainer.addClass('has-error').addClass('error-maxlength');
            } else {
                emailContainer.removeClass('error-maxlength');
            }

            if (email.length > 0 && email.length < 100 && !REGEMAIL.test(email)) {
                emailContainer.addClass('has-error').addClass('error-characters');
            } else {
                emailContainer.removeClass('error-characters');
            }
            return !emailContainer.hasClass('has-error');
        }

    }

    function SignInView() {
        var $signInView = $('#signInView');

        var submittedLogin = false;
        var submittedSignIn = false;

        this.show = show;
        this.hide = hide;

        $(document).on('click', '#loginBtn', login);
        $(document).on('click', '#registerBtn', signIn);

        $(document).on('keyup', '#loginForm .form-input', loginKeyUp);
        $(document).on('keyup', '#registerForm .form-input', signinKeyUp);

        $(document).on('click', '.requestPasswordView', goToRequestPassword);

        function goToRequestPassword(e) {
            e.preventDefault();
            signInView.hide();
            requestPasswordView.show();
        }

        function login() {
            var data = {};
            submittedLogin = true;

            if (loginValidation()) {
                hideUserNotFoundError();
                data = {
                    grant_type: 'password',
                    username: $('#loginEmailInput').val().toLowerCase(),
                    password: $('#loginPassInput').val()
                };
                postData(TOKEN_URL, data);
            }
        }

        function signIn() {
            var data;
            submittedSignIn = true;
            data = signinValidation();
            if (data.email) {
                postData(REGISTER_URL, data);
            }
        }

        function signinValidation() {
            var data = {};

            var $registerEmailInput = $('#registerEmailInput');
            var emailContainer = $registerEmailInput.parent('.form-input-group');
            var email = $registerEmailInput.val();

            var $registerPassInput = $('#registerPassInput');
            var passwordContainer = $registerPassInput.parent('.form-input-group');
            var password = $registerPassInput.val();

            var $registerPassConfirmInput =  $('#registerPassConfirmInput');
            var confirmContainer = $registerPassConfirmInput.parent('.form-input-group');
            var confirm = $registerPassConfirmInput.val();

            if (submittedSignIn) {
                emailContainer.removeClass('has-error');
                passwordContainer.removeClass('has-error');
                confirmContainer.removeClass('has-error');

                if (password.length === 0) {
                    passwordContainer.addClass('has-error').addClass('error-required');
                } else {
                    passwordContainer.removeClass('error-required');
                }

                if (password.length !== 0 && password.length < 8) {
                    passwordContainer.addClass('has-error').addClass('error-minlength');
                } else {
                    passwordContainer.removeClass('error-minlength');
                }

                if (password.length > 100) {
                    passwordContainer.addClass('has-error').addClass('error-maxlength');
                } else {
                    passwordContainer.removeClass('error-maxlength');
                }

                if (confirm.length === 0) {
                    confirmContainer.addClass('has-error').addClass('error-required');
                } else {
                    confirmContainer.removeClass('error-required');
                }

                if (confirm.length > 0 && password.length > 0 && confirm !== password) {
                    confirmContainer.addClass('has-error').addClass('error-characters');
                } else {
                    confirmContainer.removeClass('error-characters');
                }

                if (email.length === 0) {
                    emailContainer.addClass('has-error').addClass('error-required');
                } else {
                    emailContainer.removeClass('error-required');
                }

                if (email.length > 100) {
                    emailContainer.addClass('has-error').addClass('error-maxlength');
                } else {
                    emailContainer.removeClass('error-maxlength');
                }

                if (email.length > 0 && email.length < 100 && !REGEMAIL.test(email)) {
                    emailContainer.addClass('has-error').addClass('error-characters');
                } else {
                    emailContainer.removeClass('error-characters');
                }

                captchaValidator(window.signInCaptcha, '#signInCaptcha');

                if ($('#registerForm .has-error').length === 0) {
                    data = {
                        email: email.toLowerCase(),
                        password: password
                    };
                }
            }
            return data;
        }

        function loginValidation() {
            var errorsFlag = false;
            if (submittedLogin) {
                var $loginEmailInput = $('#loginEmailInput');
                if ($loginEmailInput.val().length === 0) {
                    $loginEmailInput.parent('.form-input-group').addClass('has-error');
                    errorsFlag = true;
                } else {
                    $loginEmailInput.parent('.form-input-group').removeClass('has-error');
                }

                var $loginPassInput = $('#loginPassInput');
                if ($loginPassInput.val().length === 0) {
                    $loginPassInput.parent('.form-input-group').addClass('has-error');
                    errorsFlag = true;
                } else {
                    $loginPassInput.parent('.form-input-group').removeClass('has-error');
                }

                var $loginBtn = $('#loginBtn');
                if (errorsFlag) {
                    $loginBtn.attr('disabled', true);
                } else {
                    $loginBtn.attr('disabled', false);
                }
            }

            return !errorsFlag;
        }

        function loginKeyUp(e) {
            if (e.keyCode === 13) {
                login();
            } else {
                loginValidation();
            }
        }

        function signinKeyUp(e) {
            if (e.keyCode === 13) {
                signIn();
            } else {
                signinValidation();
            }
        }

        function show() {
            $signInView
                .removeClass('hiddenView')
                .addClass('visibleView');
            if (window.signInCaptcha && window.grecaptcha) {
                grecaptcha.reset(signInCaptcha);
            }
            loadingEnd();
        }

        function hide() {
            $signInView
                .removeClass('visibleView')
                .addClass('hiddenView');
            $('#userExistsError')
                .removeClass('visibleView')
                .addClass('hiddenView');
            loadingEnd();
        }

        function postData(url, data) {
            $('#userExistsError')
                .removeClass('visibleView')
                .addClass('hiddenView');
            loadingStart();
            $.ajax({
                url: url,
                method: 'POST',
                data: data,
                statusCode: {
                    200: function (response) {
                        if (response.message === 'registered') {
                            loadingEnd();
                            showRegisteredMessage(data.email);
                        } else {
                            auth.login(response.access_token, response.refresh_token);
                            signInView.hide();
                            getUser();
                        }
                    },
                    401: function () {
                        $(document).trigger('lyceum:needReload');
                    },
                    403: function (response) {
                        if (response.responseText === '{"error":"invalid_grant","error_description":"Invalid resource owner credentials"}') {
                            loadingEnd();
                            $('#loginPassInput').val('');
                            showUserNotFoundError();
                        }
                        if (response.responseJSON.message === 'email exists') {
                            loadingEnd();
                            showNameExistsError();
                        }
                    }
                }
            });
        }

        function showUserNotFoundError() {
            $('#userNotFoundError')
                .removeClass('hiddenView')
                .addClass('visibleView');
        }

        function hideUserNotFoundError() {
            $('#userNotFoundError')
                .removeClass('visibleView')
                .addClass('hiddenView');
        }

        function showNameExistsError() {
            $('#userExistsError')
                .removeClass('hiddenView')
                .addClass('visibleView');
        }

        function showRegisteredMessage(email) {
            $('#registeredMessage')
                .removeClass('hiddenView')
                .addClass('visibleView');
            $('#userMail').text(email);
            $('#registerInputs')
                .removeClass('visibleView')
                .addClass('hiddenView');
        }
    }

    function UserView() {
        var $userView = $('#userView');

        this.show = show;
        this.hide = hide;

        function show(html) {
            $userView
                .html(html)
                .removeClass('hiddenView')
                .addClass('visibleView');
            loadingEnd();
        }

        function hide() {
            $userView
                .removeClass('visibleView')
                .addClass('hiddenView');
            loadingEnd();
        }
    }

    function openPupilSettingsDialog(e) {
        e.preventDefault();
        e.stopPropagation();
        settingView = $(e.currentTarget).attr('href');

        if (settingView === 'logout') {
            $(document).trigger('lyceum:logout');
        } else {
            $(document).trigger('lyceum:openSettingsDialog', $pupilSettingsDialogContent.find('#' + settingView).html());
        }
    }

    function pupilSettingsValidation() {
        var data = {};
        if (settingView === 'password') {
            var $pupilPassword =  $('#pupilPassword');
            var $pupilPasswordConfirm = $('#pupilPasswordConfirm');

            var password = $pupilPassword.val();
            var confirm = $pupilPasswordConfirm.val();
            var passwordContainer = $pupilPassword.parent();
            var confirmContainer = $pupilPasswordConfirm.parent();

            passwordContainer.removeClass('has-error');
            confirmContainer.removeClass('has-error');

            if (password.length === 0) {
                passwordContainer.addClass('has-error').addClass('error-required');
            } else {
                passwordContainer.removeClass('error-required');
            }

            if (password.length !== 0 && password.length < 8) {
                passwordContainer.addClass('has-error').addClass('error-minlength');
            } else {
                passwordContainer.removeClass('error-minlength');
            }

            if (password.length > 100) {
                passwordContainer.addClass('has-error').addClass('error-maxlength');
            } else {
                passwordContainer.removeClass('error-maxlength');
            }

            if (confirm.length === 0) {
                confirmContainer.addClass('has-error').addClass('error-required');
            } else {
                confirmContainer.removeClass('error-required');
            }

            if (confirm.length > 0 && password.length > 0 && confirm !== password) {
                confirmContainer.addClass('has-error').addClass('error-characters');
            } else {
                confirmContainer.removeClass('error-characters');
            }

            if ($('#pupilSettingsDialog .has-error').length === 0) {
                data = {
                    password: password
                };
            }
        }
        return data;
    }

    function savePupilSettings() {
        if (settingView === 'password') {
            var data = pupilSettingsValidation();
            if (data.password) {
                updatePassword(data);
            }
        }
    }

    function updatePassword(data) {
        $.ajax({
            url: '/api/pupils/password',
            method: 'POST',
            data: data,
            statusCode: {
                200: function (response) {
                    if (response.message === 'ok') {
                        $(document).trigger('lyceum:needReload');
                    } else {
                        //  auth.login(response.access_token, response.refresh_token);
                        // signInView.hide();
                        //  getUser();
                    }
                },
                401: function () {
                    $(document).trigger('lyceum:needReload');
                },
                403: function (response) {
                    //TODO Error handle
                    if (response.responseText === '{"error":"invalid_grant","error_description":"Invalid resource owner credentials"}') {
                        loadingEnd();
                        $('#loginPassInput').val('');
                        showUserNotFoundError();
                    }
                    if (response.responseJSON.message === 'email exists') {
                        loadingEnd();
                        showNameExistsError();
                    }
                }
            }
        });
    }

    function loadingStart() {
        if (dialog.opened || settingsDialog.opened || requestDialog.opened) {
            $('.cs-loader').not('.page-loader').addClass('loading-start');
        } else {
            $('.cs-loader').addClass('loading-start');
        }
    }

    function loadingEnd() {
        $('.cs-loader').removeClass('loading-start');
    }

    function logout() {
        auth.logout();
        window.location.reload();
    }

    function createDialog() {
        //TODO add polifil
        dialog.opened = false;
        if (!dialog.showModal) {
            dialogPolyfill.registerDialog(dialog);
        }

        requestDialog.opened = false;
        if (!requestDialog.showModal) {
            dialogPolyfill.registerDialog(requestDialog);
        }

        settingsDialog.opened = false;
        if (!settingsDialog.showModal) {
            dialogPolyfill.registerDialog(settingsDialog);
        }

    }

    function openDialog(e, html) {
        dialog.opened = true;
        $('.modal-settings-container').html(html);
        $('.dropify').dropify();
        dialog.showModal();
        dialogTransition = setTimeout(function () {
            $('#settingsDialog').addClass('dialog-scale');
            componentHandler.upgradeAllRegistered();
        }, 0.5);
    }

    function openSettingsDialog(e, html) {
        settingsDialog.opened = true;
        $('.modal-pupil-settings-container').html(html);

        settingsDialog.showModal();
        settingsDialogTransition = setTimeout(function () {
            $('#pupilSettingsDialog').addClass('dialog-scale');
            componentHandler.upgradeAllRegistered();
        }, 0.5);
    }

    function openRequestDialog() {
        var $rulesContainer = $("#rulesContainer");
        var $saveRequestBtn = $("#saveRequest");
        var $rulesOk = $('#rulesOk');
        var $rulesOkLabel = $("#rulesOkLabel");
        var $rulesOkHelp = $("#rulesOkHelp");

        requestDialog.opened = true;
        requestDialog.scrolledToBottom = false;

        $rulesContainer.off('scroll');
        $saveRequestBtn.attr('disabled', true);
        $rulesOkLabel.addClass('is-disabled');
        $rulesOkHelp.removeClass('hiddenView').addClass('visibleView');
        $rulesOk.attr('disabled', true);
        document.querySelector('#rulesOkLabel').MaterialCheckbox.uncheck();

        requestDialog.showModal();
        $rulesContainer.animate({
            scrollTop: 0
        }, 0);

        requestDialogTransition = setTimeout(function () {
            $('#sendRequestDialog').addClass('dialog-scale');
        }, 0.5);

        $rulesContainer.on('scroll', onRelseScroll);


        function onRelseScroll() {
            if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                requestDialog.scrolledToBottom = true;
                $saveRequestBtn.attr('disabled', false);
                $rulesOk.attr('disabled', false);
                $rulesOkLabel.removeClass('is-disabled');
                $rulesOkHelp.removeClass('visibleView').addClass('hiddenView');
                $rulesContainer.off('scroll');
            }
        }
    }

    function closeDialog() {
        dialog.opened = false;
        $('#settingsDialog').removeClass('dialog-scale');
        dialog.close();
        clearTimeout(dialogTransition);
    }

    function closeRequestDialog() {
        requestDialog.opened = false;
        $('#sendRequestDialog').removeClass('dialog-scale');
        requestDialog.close();
        clearTimeout(requestDialogTransition);
    }

    function closeSettingsDialog() {
        settingsDialog.opened = false;
        $('#pupilSettingsDialog').removeClass('dialog-scale');
        settingsDialog.close();
        clearTimeout(settingsDialogTransition);
    }

    function globalError() {
        //TODO handle it
        $(document).trigger('lyceum:showNotification', 'Произошла ошибка. Что-то пошло не так!');
        console.log('GLOBAL ERROR');
    }

    function showNotification(event, message) {
        var data = {
            message: message,
            timeout: 2000
        };
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
    }
});