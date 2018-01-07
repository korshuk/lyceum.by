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
$(function(){var e=1,f=1,g=1,b=$("#menu"),h=b.offset().top,d=$("footer").offset().top-b.height();$("#flash").on("click",".close",function(a){a.preventDefault();$("#flash").css({opacity:1}).animate({opacity:0},500,"linear",function(){$("#flash").hide();h=b.offset().top;d=$("footer").offset().top-b.height()})});$(window).on("scroll",function(a){a=$(window).scrollTop();var c=b.offset().top;d=$("footer").offset().top-b.height();b.hasClass("fixed")?(c<h&&b.removeClass("fixed"),a<=d&&b.removeClass("bottom"),
c>d&&b.addClass("bottom")):c<=a&&b.addClass("fixed")});$("#news.more-link").click(function(a){a.preventDefault();if(0===$(".style-blue").find(".nomore").length){var c=this;$(this).addClass("loading-start");$.get($(this).attr("href")+e,function(a){e++;$(".style-blue .section-bottom").before($(a));$(".ajax").animate({opacity:1},function(){$(".ajax").removeClass("ajax");$(c).removeClass("loading-start");d=$("footer").offset().top-b.height()})})}});$("#congratulations.more-link").click(function(a){a.preventDefault();
if(0===$(".style-green").find(".nomore").length){var c=this;$(this).addClass("loading-start");$.get($(this).attr("href")+f,function(a){f++;$(".style-green .section-bottom").before($(a));$(".ajax").animate({opacity:1},function(){$(".ajax").removeClass("ajax");$(c).removeClass("loading-start");d=$("footer").offset().top-b.height()})})}});$("#media.more-link").click(function(a){a.preventDefault();if(0===$(".style-yellow").find(".nomore").length){var c=this;$(this).addClass("loading-start");$.get($(this).attr("href")+
g,function(a){g++;$(".style-yellow .section-bottom").before($(a));$(".ajax").animate({opacity:1},function(){$(".ajax").removeClass("ajax");$(c).removeClass("loading-start");d=$("footer").offset().top-b.height()})})}});$("aside .small").on("click","#fb-like a, #vk-like a",function(a){a.preventDefault();window.open(this.href,"","menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=300,width=600,top="+(screen.height/2-150)+",left="+(screen.width/2-300))});});