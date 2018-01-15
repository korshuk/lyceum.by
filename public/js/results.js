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
var requestCaptcha;
var signInCaptcha;

function onloadCallback() {
    if (document.getElementById('signInCaptcha')) {
        window.signInCaptcha = grecaptcha.render('signInCaptcha', {'sitekey': reSITEKEY, callback: captchaCallbackSI});
    }
    window.requestCaptcha = grecaptcha.render('passCaptcha', {'sitekey': reSITEKEY, callback: captchaCallbackRQ });
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
            login: function () {},
            logout: function () {},
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
                        console.log(auth.data.refreshToken, response.refresh_token);
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
    var settingsDialog = document.getElementById('pupilSettingsDialog');
    var requestDialog = document.getElementById('sendRequestDialog')
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

    function onDataViewReady(event, status) {
        componentHandler.upgradeAllRegistered();
    }

    function RequestPasswordView() {
        var $passRequestView = $('#passRequestView');
        
        var captchaId;

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
                    mail: $('#passEmail').val()
                })
                .done(function(res){
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
                .fail(function(){
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
            var emailContainer = $('#passEmail').parent().removeClass('has-error');
            var email = $('#passEmail').val();

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
        var captchaId;

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
                    username: $('#loginEmailInput').val(),
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

            var emailContainer = $('#registerEmailInput').parent('.form-input-group');
            var email = $('#registerEmailInput').val();

            var passwordContainer = $('#registerPassInput').parent('.form-input-group');
            var password = $('#registerPassInput').val();

            var confirmContainer = $('#registerPassConfirmInput').parent('.form-input-group');
            var confirm = $('#registerPassConfirmInput').val();

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

                captchaValidator(window.signInCaptcha, '#signInCaptcha')

                if ($('#registerForm .has-error').length === 0) {
                    data = {
                        email: email,
                        password: password
                    };
                }
            }
            return data;
        }

        function loginValidation() {
            var errorsFlag = false;
            if (submittedLogin) {
                if ($('#loginEmailInput').val().length === 0) {
                    $('#loginEmailInput').parent('.form-input-group').addClass('has-error');
                    errorsFlag = true;
                } else {
                    $('#loginEmailInput').parent('.form-input-group').removeClass('has-error');
                }
                if ($('#loginPassInput').val().length === 0) {
                    $('#loginPassInput').parent('.form-input-group').addClass('has-error');
                    errorsFlag = true;
                } else {
                    $('#loginPassInput').parent('.form-input-group').removeClass('has-error');
                }

                if (errorsFlag) {
                    $('#loginBtn').attr('disabled', true);
                } else {
                    $('#loginBtn').attr('disabled', false);
                }
            }

            return !errorsFlag;
        }

        function loginKeyUp(e) {
            if (e.keyCode == 13) {
                login();
            } else {
                loginValidation();
            }
        }

        function signinKeyUp(e) {
            if (e.keyCode == 13) {
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
                    401: function (response) {
                        $(document).trigger('lyceum:needReload');
                    },
                    403: function (response) {
                        console.log(response);
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
        settingView = $(e.currentTarget).attr('href')

        if (settingView === 'logout') {
            $(document).trigger('lyceum:logout');
        } else {
            $(document).trigger('lyceum:openSettingsDialog', $pupilSettingsDialogContent.find('#' + settingView).html());
        }
    }
    
    function pupilSettingsValidation() {
        var data = {};
        if (settingView === 'password') {
            var password = $('#pupilPassword').val();
            var confirm = $('#pupilPasswordConfirm').val();
            var passwordContainer = $('#pupilPassword').parent();
            var confirmContainer = $('#pupilPasswordConfirm').parent();

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
        console.log(settingView);
        if (settingView === 'password') {
            console.log(21124)
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
                401: function (response) {
                    $(document).trigger('lyceum:needReload');
                },
                403: function (response) {
                    console.log(response);
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

        $rulesContainer.off( 'scroll');
        $saveRequestBtn.attr('disabled', true);
        $rulesOkLabel.addClass('is-disabled');
        $rulesOkHelp.removeClass('hiddenView').addClass('visibleView');
        $rulesOk.attr('disabled', true);
        document.querySelector('#rulesOkLabel').MaterialCheckbox.uncheck()

        requestDialog.showModal();
        $rulesContainer.animate({
            scrollTop: 0
        }, 0);

        requestDialogTransition = setTimeout(function () {
            $('#sendRequestDialog').addClass('dialog-scale');
        }, 0.5);

        $rulesContainer.on( 'scroll', function(){
            if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
                requestDialog.scrolledToBottom = true;
                $saveRequestBtn.attr('disabled', false);
                $rulesOk.attr('disabled', false);
                $rulesOkLabel.removeClass('is-disabled');
                $rulesOkHelp.removeClass('visibleView').addClass('hiddenView');
                $rulesContainer.off( 'scroll');
            }
        });
    }
    
    function closeDialog(e) {
        dialog.opened = false;
        $('#settingsDialog').removeClass('dialog-scale');
        dialog.close();
        clearTimeout(dialogTransition);
    }

    function closeRequestDialog(e) {
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
        console.log('GLOBAL ERROR');
    }
});