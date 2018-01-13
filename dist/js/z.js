//     Zepto.js
//     (c) 2010-2017 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function () {
    var undefined, key, $, classList, emptyArray = [],
        concat = emptyArray.concat,
        filter = emptyArray.filter,
        slice = emptyArray.slice,
        document = window.document,
        elementDisplay = {},
        classCache = {},
        cssNumber = {
            'column-count': 1,
            'columns': 1,
            'font-weight': 1,
            'line-height': 1,
            'opacity': 1,
            'z-index': 1,
            'zoom': 1
        },
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
        singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
        rootNodeRE = /^(?:body|html)$/i,
        capitalRE = /([A-Z])/g,

        // special attributes that should be get/set via method calls
        methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

        adjacencyOperators = ['after', 'prepend', 'before', 'append'],
        table = document.createElement('table'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': document.createElement('tbody'),
            'tbody': table,
            'thead': table,
            'tfoot': table,
            'td': tableRow,
            'th': tableRow,
            '*': document.createElement('div')
        },
        simpleSelectorRE = /^[\w-]*$/,
        class2type = {},
        toString = class2type.toString,
        zepto = {},
        camelize, uniq,
        tempParent = document.createElement('div'),
        propMap = {
            'tabindex': 'tabIndex',
            'readonly': 'readOnly',
            'for': 'htmlFor',
            'class': 'className',
            'maxlength': 'maxLength',
            'cellspacing': 'cellSpacing',
            'cellpadding': 'cellPadding',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'usemap': 'useMap',
            'frameborder': 'frameBorder',
            'contenteditable': 'contentEditable'
        },
        isArray = Array.isArray ||
        function (object) {
            return object instanceof Array
        }

    zepto.matches = function (element, selector) {
        if (!selector || !element || element.nodeType !== 1) return false
        var matchesSelector = element.matches || element.webkitMatchesSelector ||
            element.mozMatchesSelector || element.oMatchesSelector ||
            element.matchesSelector
        if (matchesSelector) return matchesSelector.call(element, selector)
        // fall back to performing a selector:
        var match, parent = element.parentNode,
            temp = !parent
        if (temp)(parent = tempParent).appendChild(element)
        match = ~zepto.qsa(parent, selector).indexOf(element)
        temp && tempParent.removeChild(element)
        return match
    }

    function type(obj) {
        return obj == null ? String(obj) :
            class2type[toString.call(obj)] || "object"
    }

    function isFunction(value) {
        return type(value) == "function"
    }

    function isWindow(obj) {
        return obj != null && obj == obj.window
    }

    function isDocument(obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }

    function isObject(obj) {
        return type(obj) == "object"
    }

    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }

    function likeArray(obj) {
        var length = !!obj && 'length' in obj && obj.length,
            type = $.type(obj)

        return 'function' != type && !isWindow(obj) && (
            'array' == type || length === 0 ||
            (typeof length == 'number' && length > 0 && (length - 1) in obj)
        )
    }

    function compact(array) {
        return filter.call(array, function (item) {
            return item != null
        })
    }

    function flatten(array) {
        return array.length > 0 ? $.fn.concat.apply([], array) : array
    }
    camelize = function (str) {
        return str.replace(/-+(.)?/g, function (match, chr) {
            return chr ? chr.toUpperCase() : ''
        })
    }

    function dasherize(str) {
        return str.replace(/::/g, '/')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .replace(/_/g, '-')
            .toLowerCase()
    }
    uniq = function (array) {
        return filter.call(array, function (item, idx) {
            return array.indexOf(item) == idx
        })
    }

    function classRE(name) {
        return name in classCache ?
            classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }

    function maybeAddPx(name, value) {
        return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }

    function defaultDisplay(nodeName) {
        var element, display
        if (!elementDisplay[nodeName]) {
            element = document.createElement(nodeName)
            document.body.appendChild(element)
            display = getComputedStyle(element, '').getPropertyValue("display")
            element.parentNode.removeChild(element)
            display == "none" && (display = "block")
            elementDisplay[nodeName] = display
        }
        return elementDisplay[nodeName]
    }

    function children(element) {
        return 'children' in element ?
            slice.call(element.children) :
            $.map(element.childNodes, function (node) {
                if (node.nodeType == 1) return node
            })
    }

    function Z(dom, selector) {
        var i, len = dom ? dom.length : 0
        for (i = 0; i < len; i++) this[i] = dom[i]
        this.length = len
        this.selector = selector || ''
    }

    // `$.zepto.fragment` takes a html string and an optional tag name
    // to generate DOM nodes from the given html string.
    // The generated DOM nodes are returned as an array.
    // This function can be overridden in plugins for example to make
    // it compatible with browsers that don't support the DOM fully.
    zepto.fragment = function (html, name, properties) {
        var dom, nodes, container

        // A special case optimization for a single tag
        if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

        if (!dom) {
            if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
            if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
            if (!(name in containers)) name = '*'

            container = containers[name]
            container.innerHTML = '' + html
            dom = $.each(slice.call(container.childNodes), function () {
                container.removeChild(this)
            })
        }

        if (isPlainObject(properties)) {
            nodes = $(dom)
            $.each(properties, function (key, value) {
                if (methodAttributes.indexOf(key) > -1) nodes[key](value)
                else nodes.attr(key, value)
            })
        }

        return dom
    }

    // `$.zepto.Z` swaps out the prototype of the given `dom` array
    // of nodes with `$.fn` and thus supplying all the Zepto functions
    // to the array. This method can be overridden in plugins.
    zepto.Z = function (dom, selector) {
        return new Z(dom, selector)
    }

    // `$.zepto.isZ` should return `true` if the given object is a Zepto
    // collection. This method can be overridden in plugins.
    zepto.isZ = function (object) {
        return object instanceof zepto.Z
    }

    // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
    // takes a CSS selector and an optional context (and handles various
    // special cases).
    // This method can be overridden in plugins.
    zepto.init = function (selector, context) {
        var dom
        // If nothing given, return an empty Zepto collection
        if (!selector) return zepto.Z()
        // Optimize for string selectors
        else if (typeof selector == 'string') {
            selector = selector.trim()
            // If it's a html fragment, create nodes from it
            // Note: In both Chrome 21 and Firefox 15, DOM error 12
            // is thrown if the fragment doesn't begin with <
            if (selector[0] == '<' && fragmentRE.test(selector))
                dom = zepto.fragment(selector, RegExp.$1, context), selector = null
            // If there's a context, create a collection on that context first, and select
            // nodes from there
            else if (context !== undefined) return $(context).find(selector)
            // If it's a CSS selector, use it to select nodes.
            else dom = zepto.qsa(document, selector)
        }
        // If a function is given, call it when the DOM is ready
        else if (isFunction(selector)) return $.ready(selector)
        // If a Zepto collection is given, just return it
        else if (zepto.isZ(selector)) return selector
        else {
            // normalize array if an array of nodes is given
            if (isArray(selector)) dom = compact(selector)
            // Wrap DOM nodes.
            else if (isObject(selector))
                dom = [selector], selector = null
            // If it's a html fragment, create nodes from it
            else if (fragmentRE.test(selector))
                dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
            // If there's a context, create a collection on that context first, and select
            // nodes from there
            else if (context !== undefined) return $(context).find(selector)
            // And last but no least, if it's a CSS selector, use it to select nodes.
            else dom = zepto.qsa(document, selector)
        }
        // create a new Zepto collection from the nodes found
        return zepto.Z(dom, selector)
    }

    // `$` will be the base `Zepto` object. When calling this
    // function just call `$.zepto.init, which makes the implementation
    // details of selecting nodes and creating Zepto collections
    // patchable in plugins.
    $ = function (selector, context) {
        return zepto.init(selector, context)
    }

    function extend(target, source, deep) {
        for (key in source)
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key]))
                    target[key] = {}
                if (isArray(source[key]) && !isArray(target[key]))
                    target[key] = []
                extend(target[key], source[key], deep)
            }
        else if (source[key] !== undefined) target[key] = source[key]
    }

    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    $.extend = function (target) {
        var deep, args = slice.call(arguments, 1)
        if (typeof target == 'boolean') {
            deep = target
            target = args.shift()
        }
        args.forEach(function (arg) {
            extend(target, arg, deep)
        })
        return target
    }

    // `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
    // This method can be overridden in plugins.
    zepto.qsa = function (element, selector) {
        var found,
            maybeID = selector[0] == '#',
            maybeClass = !maybeID && selector[0] == '.',
            nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
            isSimple = simpleSelectorRE.test(nameOnly)
        return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
            ((found = element.getElementById(nameOnly)) ? [found] : []) :
            (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
            slice.call(
                isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
                maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
                element.getElementsByTagName(selector) : // Or a tag
                element.querySelectorAll(selector) // Or it's not simple, and we need to query all
            )
    }

    function filtered(nodes, selector) {
        return selector == null ? $(nodes) : $(nodes).filter(selector)
    }

    $.contains = document.documentElement.contains ?
        function (parent, node) {
            return parent !== node && parent.contains(node)
        } :
        function (parent, node) {
            while (node && (node = node.parentNode))
                if (node === parent) return true
            return false
        }

    function funcArg(context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    function setAttribute(node, name, value) {
        value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    // access className property while respecting SVGAnimatedString
    function className(node, value) {
        var klass = node.className || '',
            svg = klass && klass.baseVal !== undefined

        if (value === undefined) return svg ? klass.baseVal : klass
        svg ? (klass.baseVal = value) : (node.className = value)
    }

    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // "08"    => "08"
    // JSON    => parse if valid
    // String  => self
    function deserializeValue(value) {
        try {
            return value ?
                value == "true" ||
                (value == "false" ? false :
                    value == "null" ? null :
                    +value + "" == value ? +value :
                    /^[\[\{]/.test(value) ? $.parseJSON(value) :
                    value) :
                value
        } catch (e) {
            return value
        }
    }

    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject

    $.isEmptyObject = function (obj) {
        var name
        for (name in obj) return false
        return true
    }

    $.isNumeric = function (val) {
        var num = Number(val),
            type = typeof val
        return val != null && type != 'boolean' &&
            (type != 'string' || val.length) &&
            !isNaN(num) && isFinite(num) || false
    }

    $.inArray = function (elem, array, i) {
        return emptyArray.indexOf.call(array, elem, i)
    }

    $.camelCase = camelize
    $.trim = function (str) {
        return str == null ? "" : String.prototype.trim.call(str)
    }

    // plugin compatibility
    $.uuid = 0
    $.support = {}
    $.expr = {}
    $.noop = function () {}

    $.map = function (elements, callback) {
        var value, values = [],
            i, key
        if (likeArray(elements))
            for (i = 0; i < elements.length; i++) {
                value = callback(elements[i], i)
                if (value != null) values.push(value)
            }
        else
            for (key in elements) {
                value = callback(elements[key], key)
                if (value != null) values.push(value)
            }
        return flatten(values)
    }

    $.each = function (elements, callback) {
        var i, key
        if (likeArray(elements)) {
            for (i = 0; i < elements.length; i++)
                if (callback.call(elements[i], i, elements[i]) === false) return elements
        } else {
            for (key in elements)
                if (callback.call(elements[key], key, elements[key]) === false) return elements
        }

        return elements
    }

    $.grep = function (elements, callback) {
        return filter.call(elements, callback)
    }

    if (window.JSON) $.parseJSON = JSON.parse

    // Populate the class2type map
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })

    $.domReady = function (callback) {
        // don't use "interactive" on IE <= 10 (it can fired premature)
        if (document.readyState === "complete" ||
            (document.readyState !== "loading" && !document.documentElement.doScroll))
            setTimeout(function () {
                callback($)
            }, 0)
        else {
            var handler = function () {
                document.removeEventListener("DOMContentLoaded", handler, false)
                window.removeEventListener("load", handler, false)
                callback($)
            }
            document.addEventListener("DOMContentLoaded", handler, false)
            window.addEventListener("load", handler, false)
        }
    }

    /**
     * plusReady
     * @param {type} callback
     * @returns {_L6.$}
     */
    $.plusReady = function (callback) {
        if (window.plus) {
            setTimeout(function () { //解决callback与plusready事件的执行时机问题(典型案例:showWaiting,closeWaiting)
                callback();
            }, 0);
        } else {
            document.addEventListener("plusready", function () {
                callback();
            }, false);
        }
        return this;
    };

    $.ready = function (callback) {
        if ($.os.plus) {
            $.plusReady(callback)
        } else {
            $.domReady(callback)
        }
    }

    // 获取APP版本号
    $.appVersion = function (cb) {
        plus.runtime.getProperty(plus.runtime.appid, function (data) {
            cb(data.version)
        })
    }

    // 匹配json字符串
    $.likeObject = function (str) {
        if ($.type(str) !== 'string') return false
        str = str.replace(/\s/g, '').replace(/\n|\r/, '')
        if (/^\{(.*?)\}$/.test(str)) return /"(.*?)":(.*?)/g.test(str)
        return false;
    }

    // 判断数组中是否包含元素
    $.inArray = function (sArr, tArr) {
        if ($.type(sArr) !== 'array') sArr = [sArr]
        for (var i = 0; i < sArr.length; i++) {
            for (var j = 0; j < tArr.length; j++) {
                if (sArr[i] == tArr[j]) return true
            }
        }
        return false
    }

    // Define methods that will be available on all
    // Zepto collections
    $.fn = {
        constructor: zepto.Z,
        length: 0,

        // Because a collection acts like an array
        // copy over these useful array functions.
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        sort: emptyArray.sort,
        splice: emptyArray.splice,
        indexOf: emptyArray.indexOf,
        concat: function () {
            var i, value, args = []
            for (i = 0; i < arguments.length; i++) {
                value = arguments[i]
                args[i] = zepto.isZ(value) ? value.toArray() : value
            }
            return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
        },

        // `map` and `slice` in the jQuery API work differently
        // from their array counterparts
        map: function (fn) {
            return $($.map(this, function (el, i) {
                return fn.call(el, i, el)
            }))
        },
        slice: function () {
            return $(slice.apply(this, arguments))
        },

        ready: $.domReady,
        get: function (idx) {
            return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
        },
        toArray: function () {
            return this.get()
        },
        size: function () {
            return this.length
        },
        remove: function () {
            return this.each(function () {
                if (this.parentNode != null)
                    this.parentNode.removeChild(this)
            })
        },
        each: function (callback) {
            emptyArray.every.call(this, function (el, idx) {
                return callback.call(el, idx, el) !== false
            })
            return this
        },
        filter: function (selector) {
            if (isFunction(selector)) return this.not(this.not(selector))
            return $(filter.call(this, function (element) {
                return zepto.matches(element, selector)
            }))
        },
        add: function (selector, context) {
            return $(uniq(this.concat($(selector, context))))
        },
        is: function (selector) {
            return typeof selector == 'string' ? this.length > 0 && zepto.matches(this[0], selector) :
                selector && this.selector == selector.selector
        },
        not: function (selector) {
            var nodes = []
            if (isFunction(selector) && selector.call !== undefined)
                this.each(function (idx) {
                    if (!selector.call(this, idx)) nodes.push(this)
                })
            else {
                var excludes = typeof selector == 'string' ? this.filter(selector) :
                    (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
                this.forEach(function (el) {
                    if (excludes.indexOf(el) < 0) nodes.push(el)
                })
            }
            return $(nodes)
        },
        has: function (selector) {
            return this.filter(function () {
                return isObject(selector) ?
                    $.contains(this, selector) :
                    $(this).find(selector).size()
            })
        },
        eq: function (idx) {
            return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
        },
        first: function () {
            var el = this[0]
            return el && !isObject(el) ? el : $(el)
        },
        last: function () {
            var el = this[this.length - 1]
            return el && !isObject(el) ? el : $(el)
        },
        find: function (selector) {
            var result, $this = this
            if (!selector) result = $()
            else if (typeof selector == 'object')
                result = $(selector).filter(function () {
                    var node = this
                    return emptyArray.some.call($this, function (parent) {
                        return $.contains(parent, node)
                    })
                })
            else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
            else result = this.map(function () {
                return zepto.qsa(this, selector)
            })
            return result
        },
        closest: function (selector, context) {
            var nodes = [],
                collection = typeof selector == 'object' && $(selector)
            this.each(function (_, node) {
                while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
                    node = node !== context && !isDocument(node) && node.parentNode
                if (node && nodes.indexOf(node) < 0) nodes.push(node)
            })
            return $(nodes)
        },
        parents: function (selector) {
            var ancestors = [],
                nodes = this
            while (nodes.length > 0)
                nodes = $.map(nodes, function (node) {
                    if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
                        ancestors.push(node)
                        return node
                    }
                })
            return filtered(ancestors, selector)
        },
        parent: function (selector) {
            return filtered(uniq(this.pluck('parentNode')), selector)
        },
        children: function (selector) {
            return filtered(this.map(function () {
                return children(this)
            }), selector)
        },
        contents: function () {
            return this.map(function () {
                return this.contentDocument || slice.call(this.childNodes)
            })
        },
        siblings: function (selector) {
            return filtered(this.map(function (i, el) {
                return filter.call(children(el.parentNode), function (child) {
                    return child !== el
                })
            }), selector)
        },
        empty: function () {
            return this.each(function () {
                this.innerHTML = ''
            })
        },
        // `pluck` is borrowed from Prototype.js
        pluck: function (property) {
            return $.map(this, function (el) {
                return el[property]
            })
        },
        show: function () {
            return this.each(function () {
                this.style.display == "none" && (this.style.display = '')
                if (getComputedStyle(this, '').getPropertyValue("display") == "none")
                    this.style.display = defaultDisplay(this.nodeName)
            })
        },
        replaceWith: function (newContent) {
            return this.before(newContent).remove()
        },
        wrap: function (structure) {
            var func = isFunction(structure)
            if (this[0] && !func)
                var dom = $(structure).get(0),
                    clone = dom.parentNode || this.length > 1

            return this.each(function (index) {
                $(this).wrapAll(
                    func ? structure.call(this, index) :
                    clone ? dom.cloneNode(true) : dom
                )
            })
        },
        wrapAll: function (structure) {
            if (this[0]) {
                $(this[0]).before(structure = $(structure))
                var children
                // drill down to the inmost element
                while ((children = structure.children()).length) structure = children.first()
                $(structure).append(this)
            }
            return this
        },
        wrapInner: function (structure) {
            var func = isFunction(structure)
            return this.each(function (index) {
                var self = $(this),
                    contents = self.contents(),
                    dom = func ? structure.call(this, index) : structure
                contents.length ? contents.wrapAll(dom) : self.append(dom)
            })
        },
        unwrap: function () {
            this.parent().each(function () {
                $(this).replaceWith($(this).children())
            })
            return this
        },
        clone: function () {
            return this.map(function () {
                return this.cloneNode(true)
            })
        },
        hide: function () {
            return this.css("display", "none")
        },
        toggle: function (setting) {
            return this.each(function () {
                var el = $(this);
                (setting === undefined ? el.css("display") == "none" : setting) ? el.show(): el.hide()
            })
        },
        prev: function (selector) {
            return $(this.pluck('previousElementSibling')).filter(selector || '*')
        },
        next: function (selector) {
            return $(this.pluck('nextElementSibling')).filter(selector || '*')
        },
        html: function (html) {
            return 0 in arguments ?
                this.each(function (idx) {
                    var originHtml = this.innerHTML
                    $(this).empty().append(funcArg(this, html, idx, originHtml))
                }) :
                (0 in this ? this[0].innerHTML : null)
        },
        text: function (text) {
            return 0 in arguments ?
                this.each(function (idx) {
                    var newText = funcArg(this, text, idx, this.textContent)
                    this.textContent = newText == null ? '' : '' + newText
                }) :
                (0 in this ? this.pluck('textContent').join("") : null)
        },
        attr: function (name, value) {
            var result
            return (typeof name == 'string' && !(1 in arguments)) ?
                (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
                this.each(function (idx) {
                    if (this.nodeType !== 1) return
                    if (isObject(name))
                        for (key in name) setAttribute(this, key, name[key])
                    else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
                })
        },
        removeAttr: function (name) {
            return this.each(function () {
                this.nodeType === 1 && name.split(' ').forEach(function (attribute) {
                    setAttribute(this, attribute)
                }, this)
            })
        },
        prop: function (name, value) {
            name = propMap[name] || name
            return (typeof name == 'string' && !(1 in arguments)) ?
                (this[0] && this[0][name]) :
                this.each(function (idx) {
                    if (isObject(name))
                        for (key in name) this[propMap[key] || key] = name[key]
                    else this[name] = funcArg(this, value, idx, this[name])
                })
        },
        removeProp: function (name) {
            name = propMap[name] || name
            return this.each(function () {
                delete this[name]
            })
        },
        data: function (name, value) {
            var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

            var data = (1 in arguments) ?
                this.attr(attrName, value) :
                this.attr(attrName)

            return data !== null ? deserializeValue(data) : undefined
        },
        val: function (value) {
            if (0 in arguments) {
                if (value == null) value = ""
                return this.each(function (idx) {
                    this.value = funcArg(this, value, idx, this.value)
                })
            } else {
                return this[0] && (this[0].multiple ?
                    $(this[0]).find('option').filter(function () {
                        return this.selected
                    }).pluck('value') :
                    this[0].value)
            }
        },
        offset: function (coordinates) {
            if (coordinates) return this.each(function (index) {
                var $this = $(this),
                    coords = funcArg(this, coordinates, index, $this.offset()),
                    parentOffset = $this.offsetParent().offset(),
                    props = {
                        top: coords.top - parentOffset.top,
                        left: coords.left - parentOffset.left
                    }

                if ($this.css('position') == 'static') props['position'] = 'relative'
                $this.css(props)
            })
            if (!this.length) return null
            if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
                return {
                    top: 0,
                    left: 0
                }
            var obj = this[0].getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            }
        },
        css: function (property, value) {
            if (arguments.length < 2) {
                var element = this[0]
                if (typeof property == 'string') {
                    if (!element) return
                    return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
                } else if (isArray(property)) {
                    if (!element) return
                    var props = {}
                    var computedStyle = getComputedStyle(element, '')
                    $.each(property, function (_, prop) {
                        props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
                    })
                    return props
                }
            }

            var css = ''
            if (type(property) == 'string') {
                if (!value && value !== 0)
                    this.each(function () {
                        this.style.removeProperty(dasherize(property))
                    })
                else
                    css = dasherize(property) + ":" + maybeAddPx(property, value)
            } else {
                for (key in property)
                    if (!property[key] && property[key] !== 0)
                        this.each(function () {
                            this.style.removeProperty(dasherize(key))
                        })
                else
                    css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
            }

            return this.each(function () {
                this.style.cssText += ';' + css
            })
        },
        index: function (element) {
            return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
        },
        hasClass: function (name) {
            if (!name) return false
            return emptyArray.some.call(this, function (el) {
                return this.test(className(el))
            }, classRE(name))
        },
        addClass: function (name) {
            if (!name) return this
            return this.each(function (idx) {
                if (!('className' in this)) return
                classList = []
                var cls = className(this),
                    newName = funcArg(this, name, idx, cls)
                newName.split(/\s+/g).forEach(function (klass) {
                    if (!$(this).hasClass(klass)) classList.push(klass)
                }, this)
                classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
            })
        },
        removeClass: function (name) {
            return this.each(function (idx) {
                if (!('className' in this)) return
                if (name === undefined) return className(this, '')
                classList = className(this)
                funcArg(this, name, idx, classList).split(/\s+/g).forEach(function (klass) {
                    classList = classList.replace(classRE(klass), " ")
                })
                className(this, classList.trim())
            })
        },
        toggleClass: function (name, when) {
            if (!name) return this
            return this.each(function (idx) {
                var $this = $(this),
                    names = funcArg(this, name, idx, className(this))
                names.split(/\s+/g).forEach(function (klass) {
                    (when === undefined ? !$this.hasClass(klass) : when) ?
                    $this.addClass(klass): $this.removeClass(klass)
                })
            })
        },
        scrollTop: function (value) {
            if (!this.length) return
            var hasScrollTop = 'scrollTop' in this[0]
            if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
            return this.each(hasScrollTop ?
                function () {
                    this.scrollTop = value
                } :
                function () {
                    this.scrollTo(this.scrollX, value)
                })
        },
        scrollLeft: function (value) {
            if (!this.length) return
            var hasScrollLeft = 'scrollLeft' in this[0]
            if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
            return this.each(hasScrollLeft ?
                function () {
                    this.scrollLeft = value
                } :
                function () {
                    this.scrollTo(value, this.scrollY)
                })
        },
        position: function () {
            if (!this.length) return

            var elem = this[0],
                // Get *real* offsetParent
                offsetParent = this.offsetParent(),
                // Get correct offsets
                offset = this.offset(),
                parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
                    top: 0,
                    left: 0
                } : offsetParent.offset()

            // Subtract element margins
            // note: when an element has margin: auto the offsetLeft and marginLeft
            // are the same in Safari causing offset.left to incorrectly be 0
            offset.top -= parseFloat($(elem).css('margin-top')) || 0
            offset.left -= parseFloat($(elem).css('margin-left')) || 0

            // Add offsetParent borders
            parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
            parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

            // Subtract the two offsets
            return {
                top: offset.top - parentOffset.top,
                left: offset.left - parentOffset.left
            }
        },
        offsetParent: function () {
            return this.map(function () {
                var parent = this.offsetParent || document.body
                while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
                    parent = parent.offsetParent
                return parent
            })
        },
        getBackgroundUrl: function (src) {
            if (src) {
                return this.each(function () {
                    this.css('backgroundImage', 'url(' + src + ')')
                })
            } else {
                return this.css('backgroundImage').replace(/url\([\'\"]?(.*?)[\'\"]?\)/g, "$1")
            }
        }
    }

    // for now
    $.fn.detach = $.fn.remove

    // Generate the `width` and `height` functions
    ;
    ['width', 'height'].forEach(function (dimension) {
        var dimensionProperty =
            dimension.replace(/./, function (m) {
                return m[0].toUpperCase()
            })

        $.fn[dimension] = function (value) {
            var offset, el = this[0]
            if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
                isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
                (offset = this.offset()) && offset[dimension]
            else return this.each(function (idx) {
                el = $(this)
                el.css(dimension, funcArg(this, value, idx, el[dimension]()))
            })
        }
    })

    function traverseNode(node, fun) {
        fun(node)
        for (var i = 0, len = node.childNodes.length; i < len; i++)
            traverseNode(node.childNodes[i], fun)
    }

    // Generate the `after`, `prepend`, `before`, `append`,
    // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    adjacencyOperators.forEach(function (operator, operatorIndex) {
        var inside = operatorIndex % 2 //=> prepend, append

        $.fn[operator] = function () {
            // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
            var argType, nodes = $.map(arguments, function (arg) {
                    var arr = []
                    argType = type(arg)
                    if (argType == "array") {
                        arg.forEach(function (el) {
                            if (el.nodeType !== undefined) return arr.push(el)
                            else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
                            arr = arr.concat(zepto.fragment(el))
                        })
                        return arr
                    }
                    return argType == "object" || arg == null ?
                        arg : zepto.fragment(arg)
                }),
                parent, copyByClone = this.length > 1
            if (nodes.length < 1) return this

            return this.each(function (_, target) {
                parent = inside ? target : target.parentNode

                // convert all methods to a "before" operation
                target = operatorIndex == 0 ? target.nextSibling :
                    operatorIndex == 1 ? target.firstChild :
                    operatorIndex == 2 ? target :
                    null

                var parentInDocument = $.contains(document.documentElement, parent)

                nodes.forEach(function (node) {
                    if (copyByClone) node = node.cloneNode(true)
                    else if (!parent) return $(node).remove()

                    parent.insertBefore(node, target)
                    if (parentInDocument) traverseNode(node, function (el) {
                        if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                            (!el.type || el.type === 'text/javascript') && !el.src) {
                            var target = el.ownerDocument ? el.ownerDocument.defaultView : window
                            target['eval'].call(target, el.innerHTML)
                        }
                    })
                })
            })
        }

        // after    => insertAfter
        // prepend  => prependTo
        // before   => insertBefore
        // append   => appendTo
        $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function (html) {
            $(html)[operator](this)
            return this
        }
    })

    zepto.Z.prototype = Z.prototype = $.fn

    // Export internal API functions in the `$.zepto` namespace
    zepto.uniq = uniq
    zepto.deserializeValue = deserializeValue
    $.zepto = zepto

    return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)
// 配置文件
;
(function ($) {
    $.config = {
        swipeBack: false,
        preloadPages: [], //5+ lazyLoad webview
        preloadLimit: 10, //预加载窗口的数量限制(一旦超出，先进先出)
        show: {
            event: "loaded",
            autoShow: false,
            duration: 320,
            aniShow: 'pop-in',
            extras: {},
            delay: 900
        },
        waiting: {
            autoShow: true,
            title: '',
            modal: false
        },
        window: {
            scalable: false,
            bounce: "" //vertical
        },
        keyEventBind: {
            backbutton: true,
            menubutton: true
        },
        titleConfig: {
            height: "44px",
            backgroundColor: "#ffffff", //导航栏背景色
            bottomBorderColor: "#cccccc", //底部边线颜色
            title: { //标题配置
                text: "", //标题文字
                position: {
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%"
                },
                styles: {
                    color: "#000000",
                    align: "center",
                    family: "'Helvetica Neue',Helvetica,sans-serif",
                    size: "17px",
                    style: "normal",
                    weight: "normal",
                    fontSrc: ""
                }
            },
            back: {
                image: {
                    base64Data: '',
                    imgSrc: '',
                    sprite: {
                        top: '0px',
                        left: '0px',
                        width: '100%',
                        height: '100%'
                    },
                    position: {
                        top: "10px",
                        left: "10px",
                        width: "24px",
                        height: "24px"
                    }
                }
            }
        },
        pullrefresh: {
            down: {
                support: true,
                style: 'circle',
                color: '#000000',
                offset: '45px',
                auto: false
            },
            up: {
                nonerText: '没有更多数据了',
                loadingText: '加载中...',
                tipText: '上拉加载更多数据',
                container: document
            }
        },
        date: {
            prefixAgo: '',
            suffixAgo: '后',
            inPast: '快到了',
            seconds: "小于一分钟",
            minute: "一分钟",
            minutes: "%d分钟",
            hour: "一小时",
            hours: "%d小时",
            day: "一天",
            days: "%d天",
            month: "一个月",
            months: "%d月",
            year: "一年",
            years: "%d年",
            wordSeparator: "",
            numbers: ['', "\u4E00", "\u4e24", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u4e03", "\u516b", "\u4e5d", "\u5341"],
            format: 'M月dd日 H:mm',
            coverTime: 24 * 60 * 60 * 1000
        },
        image: {
            width: '700px'
        },
        template: {
            path: '_www/tpl/'
        }
    };
})(Zepto)
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var touch = {},
    touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
    longTapDelay = 750,
    gesture,
    down, up, move,
    eventMap,
    initialized = false

  function swipeDirection(x1, x2, y1, y2) {
    return Math.abs(x1 - x2) >=
      Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
  }

  function longTap() {
    longTapTimeout = null
    if (touch.last) {
      touch.el.trigger('longTap')
      touch = {}
    }
  }

  function cancelLongTap() {
    if (longTapTimeout) clearTimeout(longTapTimeout)
    longTapTimeout = null
  }

  function cancelAll() {
    if (touchTimeout) clearTimeout(touchTimeout)
    if (tapTimeout) clearTimeout(tapTimeout)
    if (swipeTimeout) clearTimeout(swipeTimeout)
    if (longTapTimeout) clearTimeout(longTapTimeout)
    touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
    touch = {}
  }

  function isPrimaryTouch(event){
    return (event.pointerType == 'touch' ||
      event.pointerType == event.MSPOINTER_TYPE_TOUCH)
      && event.isPrimary
  }

  function isPointerEventType(e, type){
    return (e.type == 'pointer'+type ||
      e.type.toLowerCase() == 'mspointer'+type)
  }

  // helper function for tests, so they check for different APIs
  function unregisterTouchEvents(){
    if (!initialized) return
    $(document).off(eventMap.down, down)
      .off(eventMap.up, up)
      .off(eventMap.move, move)
      .off(eventMap.cancel, cancelAll)
    $(window).off('scroll', cancelAll)
    cancelAll()
    initialized = false
  }

  function setup(__eventMap){
    var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType

    unregisterTouchEvents()

    eventMap = (__eventMap && ('down' in __eventMap)) ? __eventMap :
      ('ontouchstart' in document ?
      { 'down': 'touchstart', 'up': 'touchend',
        'move': 'touchmove', 'cancel': 'touchcancel' } :
      'onpointerdown' in document ?
      { 'down': 'pointerdown', 'up': 'pointerup',
        'move': 'pointermove', 'cancel': 'pointercancel' } :
       'onmspointerdown' in document ?
      { 'down': 'MSPointerDown', 'up': 'MSPointerUp',
        'move': 'MSPointerMove', 'cancel': 'MSPointerCancel' } : false)

    // No API availables for touch events
    if (!eventMap) return

    if ('MSGesture' in window) {
      gesture = new MSGesture()
      gesture.target = document.body

      $(document)
        .bind('MSGestureEnd', function(e){
          var swipeDirectionFromVelocity =
            e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null
          if (swipeDirectionFromVelocity) {
            touch.el.trigger('swipe')
            touch.el.trigger('swipe'+ swipeDirectionFromVelocity)
          }
        })
    }

    down = function(e){
      if((_isPointerType = isPointerEventType(e, 'down')) &&
        !isPrimaryTouch(e)) return
      firstTouch = _isPointerType ? e : e.touches[0]
      if (e.touches && e.touches.length === 1 && touch.x2) {
        // Clear out touch movement data if we have it sticking around
        // This can occur if touchcancel doesn't fire due to preventDefault, etc.
        touch.x2 = undefined
        touch.y2 = undefined
      }
      now = Date.now()
      delta = now - (touch.last || now)
      touch.el = $('tagName' in firstTouch.target ?
        firstTouch.target : firstTouch.target.parentNode)
      touchTimeout && clearTimeout(touchTimeout)
      touch.x1 = firstTouch.pageX
      touch.y1 = firstTouch.pageY
      if (delta > 0 && delta <= 250) touch.isDoubleTap = true
      touch.last = now
      longTapTimeout = setTimeout(longTap, longTapDelay)
      // adds the current touch contact for IE gesture recognition
      if (gesture && _isPointerType) gesture.addPointer(e.pointerId)
    }

    move = function(e){
      if((_isPointerType = isPointerEventType(e, 'move')) &&
        !isPrimaryTouch(e)) return
      firstTouch = _isPointerType ? e : e.touches[0]
      cancelLongTap()
      touch.x2 = firstTouch.pageX
      touch.y2 = firstTouch.pageY

      deltaX += Math.abs(touch.x1 - touch.x2)
      deltaY += Math.abs(touch.y1 - touch.y2)
    }

    up = function(e){
      if((_isPointerType = isPointerEventType(e, 'up')) &&
        !isPrimaryTouch(e)) return
      cancelLongTap()

      // swipe
      if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
          (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

        swipeTimeout = setTimeout(function() {
          if (touch.el){
            touch.el.trigger('swipe')
            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
          }
          touch = {}
        }, 0)

      // normal tap
      else if ('last' in touch)
        // don't fire tap when delta position changed by more than 30 pixels,
        // for instance when moving to a point and back to origin
        if (deltaX < 30 && deltaY < 30) {
          // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
          // ('tap' fires before 'scroll')
          tapTimeout = setTimeout(function() {

            // trigger universal 'tap' with the option to cancelTouch()
            // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
            var event = $.Event('tap')
            event.cancelTouch = cancelAll
            // [by paper] fix -> "TypeError: 'undefined' is not an object (evaluating 'touch.el.trigger'), when double tap
            if (touch.el) touch.el.trigger(event)

            // trigger double tap immediately
            if (touch.isDoubleTap) {
              if (touch.el) touch.el.trigger('doubleTap')
              touch = {}
            }

            // trigger single tap after 250ms of inactivity
            else {
              touchTimeout = setTimeout(function(){
                touchTimeout = null
                if (touch.el) touch.el.trigger('singleTap')
                touch = {}
              }, 250)
            }
          }, 0)
        } else {
          touch = {}
        }
        deltaX = deltaY = 0
    }

    $(document).on(eventMap.up, up)
      .on(eventMap.down, down)
      .on(eventMap.move, move)

    // when the browser window loses focus,
    // for example when a modal dialog is shown,
    // cancel all ongoing events
    $(document).on(eventMap.cancel, cancelAll)

    // scrolling the window indicates intention of the user
    // to scroll, not tap or swipe, so cancel all ongoing events
    $(window).on('scroll', cancelAll)

    initialized = true
  }

  ;['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
    'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
    $.fn[eventName] = function(callback){ return this.on(eventName, callback) }
  })

  $.touch = { setup: setup }

  $(document).ready(setup)
})(Zepto)

//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var zepto = $.zepto, oldQsa = zepto.qsa, oldMatches = zepto.matches

  function visible(elem){
    elem = $(elem)
    return !!(elem.width() || elem.height()) && elem.css("display") !== "none"
  }

  // Implements a subset from:
  // http://api.jquery.com/category/selectors/jquery-selector-extensions/
  //
  // Each filter function receives the current index, all nodes in the
  // considered set, and a value if there were parentheses. The value
  // of `this` is the node currently being considered. The function returns the
  // resulting node(s), null, or undefined.
  //
  // Complex selectors are not supported:
  //   li:has(label:contains("foo")) + li:has(label:contains("bar"))
  //   ul.inner:first > li
  var filters = $.expr[':'] = {
    visible:  function(){ if (visible(this)) return this },
    hidden:   function(){ if (!visible(this)) return this },
    selected: function(){ if (this.selected) return this },
    checked:  function(){ if (this.checked) return this },
    parent:   function(){ return this.parentNode },
    first:    function(idx){ if (idx === 0) return this },
    last:     function(idx, nodes){ if (idx === nodes.length - 1) return this },
    eq:       function(idx, _, value){ if (idx === value) return this },
    contains: function(idx, _, text){ if ($(this).text().indexOf(text) > -1) return this },
    has:      function(idx, _, sel){ if (zepto.qsa(this, sel).length) return this }
  }

  var filterRe = new RegExp('(.*):(\\w+)(?:\\(([^)]+)\\))?$\\s*'),
      childRe  = /^\s*>/,
      classTag = 'Zepto' + (+new Date())

  function process(sel, fn) {
    // quote the hash in `a[href^=#]` expression
    sel = sel.replace(/=#\]/g, '="#"]')
    var filter, arg, match = filterRe.exec(sel)
    if (match && match[2] in filters) {
      filter = filters[match[2]], arg = match[3]
      sel = match[1]
      if (arg) {
        var num = Number(arg)
        if (isNaN(num)) arg = arg.replace(/^["']|["']$/g, '')
        else arg = num
      }
    }
    return fn(sel, filter, arg)
  }

  zepto.qsa = function(node, selector) {
    return process(selector, function(sel, filter, arg){
      try {
        var taggedParent
        if (!sel && filter) sel = '*'
        else if (childRe.test(sel))
          // support "> *" child queries by tagging the parent node with a
          // unique class and prepending that classname onto the selector
          taggedParent = $(node).addClass(classTag), sel = '.'+classTag+' '+sel

        var nodes = oldQsa(node, sel)
      } catch(e) {
        console.error('error performing selector: %o', selector)
        throw e
      } finally {
        if (taggedParent) taggedParent.removeClass(classTag)
      }
      return !filter ? nodes :
        zepto.uniq($.map(nodes, function(n, i){ return filter.call(n, i, nodes, arg) }))
    })
  }

  zepto.matches = function(node, selector){
    return process(selector, function(sel, filter, arg){
      return (!sel || oldMatches(node, sel)) &&
        (!filter || filter.call(node, null, arg) === node)
    })
  }
})(Zepto)

//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($, undefined){
  var prefix = '', eventPrefix,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
    testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty, transitionDuration, transitionTiming, transitionDelay,
    animationName, animationDuration, animationTiming, animationDelay,
    cssReset = {}

  function dasherize(str) { return str.replace(/([A-Z])/g, '-$1').toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : name.toLowerCase() }

  if (testEl.style.transform === undefined) $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + vendor.toLowerCase() + '-'
      eventPrefix = event
      return false
    }
  })

  transform = prefix + 'transform'
  cssReset[transitionProperty = prefix + 'transition-property'] =
  cssReset[transitionDuration = prefix + 'transition-duration'] =
  cssReset[transitionDelay    = prefix + 'transition-delay'] =
  cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
  cssReset[animationName      = prefix + 'animation-name'] =
  cssReset[animationDuration  = prefix + 'animation-duration'] =
  cssReset[animationDelay     = prefix + 'animation-delay'] =
  cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    speeds: { _default: 400, fast: 200, slow: 600 },
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback, delay){
    if ($.isFunction(duration))
      callback = duration, ease = undefined, duration = undefined
    if ($.isFunction(ease))
      callback = ease, ease = undefined
    if ($.isPlainObject(duration))
      ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
    if (duration) duration = (typeof duration == 'number' ? duration :
                    ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
    if (delay) delay = parseFloat(delay) / 1000
    return this.anim(properties, duration, ease, callback, delay)
  }

  $.fn.anim = function(properties, duration, ease, callback, delay){
    var key, cssValues = {}, cssProperties, transforms = '',
        that = this, wrappedCallback, endEvent = $.fx.transitionEnd,
        fired = false

    if (duration === undefined) duration = $.fx.speeds._default / 1000
    if (delay === undefined) delay = 0
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssValues[animationName] = properties
      cssValues[animationDuration] = duration + 's'
      cssValues[animationDelay] = delay + 's'
      cssValues[animationTiming] = (ease || 'linear')
      endEvent = $.fx.animationEnd
    } else {
      cssProperties = []
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
        else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

      if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
      if (duration > 0 && typeof properties === 'object') {
        cssValues[transitionProperty] = cssProperties.join(', ')
        cssValues[transitionDuration] = duration + 's'
        cssValues[transitionDelay] = delay + 's'
        cssValues[transitionTiming] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, wrappedCallback)
      } else
        $(this).unbind(endEvent, wrappedCallback) // triggered by setTimeout

      fired = true
      $(this).css(cssReset)
      callback && callback.call(this)
    }
    if (duration > 0){
      this.bind(endEvent, wrappedCallback)
      // transitionEnd is not always firing on older Android phones
      // so make sure it gets fired
      setTimeout(function(){
        if (fired) return
        wrappedCallback.call(that)
      }, ((duration + delay) * 1000) + 25)
    }

    // trigger page reflow so new elements can animate
    this.size() && this.get(0).clientLeft

    this.css(cssValues)

    if (duration <= 0) setTimeout(function() {
      that.each(function(){ wrappedCallback.call(this) })
    }, 0)

    return this
  }

  testEl = null
})(Zepto)

//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($, undefined){
  var document = window.document,
    origShow = $.fn.show, origHide = $.fn.hide, origToggle = $.fn.toggle

  function anim(el, speed, opacity, scale, callback) {
    if (typeof speed == 'function' && !callback) callback = speed, speed = undefined
    var props = { opacity: opacity }
    if (scale) {
      props.scale = scale
      el.css($.fx.cssPrefix + 'transform-origin', '0 0')
    }
    return el.animate(props, speed, null, callback)
  }

  function hide(el, speed, scale, callback) {
    return anim(el, speed, 0, scale, function(){
      origHide.call($(this))
      callback && callback.call(this)
    })
  }

  $.fn.show = function(speed, callback) {
    origShow.call(this)
    if (speed === undefined) speed = 0
    else this.css('opacity', 0)
    return anim(this, speed, 1, '1,1', callback)
  }

  $.fn.hide = function(speed, callback) {
    if (speed === undefined) return origHide.call(this)
    else return hide(this, speed, '0,0', callback)
  }

  $.fn.toggle = function(speed, callback) {
    if (speed === undefined || typeof speed == 'boolean')
      return origToggle.call(this, speed)
    else return this.each(function(){
      var el = $(this)
      el[el.css('display') == 'none' ? 'show' : 'hide'](speed, callback)
    })
  }

  $.fn.fadeTo = function(speed, opacity, callback) {
    return anim(this, speed, opacity, null, callback)
  }

  $.fn.fadeIn = function(speed, callback) {
    var target = this.css('opacity')
    if (target > 0) this.css('opacity', 0)
    else target = 1
    return origShow.call(this).fadeTo(speed, target, callback)
  }

  $.fn.fadeOut = function(speed, callback) {
    return hide(this, speed, null, callback)
  }

  $.fn.fadeToggle = function(speed, callback) {
    return this.each(function(){
      var el = $(this)
      el[
        (el.css('opacity') == 0 || el.css('display') == 'none') ? 'fadeIn' : 'fadeOut'
      ](speed, callback)
    })
  }

})(Zepto)

//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  $.fn.serializeArray = function() {
    var name, type, result = [],
      add = function(value) {
        if (value.forEach) return value.forEach(add)
        result.push({ name: name, value: value })
      }
    if (this[0]) $.each(this[0].elements, function(_, field){
      type = field.type, name = field.name
      if (name && field.nodeName.toLowerCase() != 'fieldset' &&
        !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
        ((type != 'radio' && type != 'checkbox') || field.checked))
          add($(field).val())
    })
    return result
  }

  $.fn.serialize = function(){
    var result = []
    this.serializeArray().forEach(function(elm){
      result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
    })
    return result.join('&')
  }

  $.fn.submit = function(callback) {
    if (0 in arguments) this.bind('submit', callback)
    else if (this.length) {
      var event = $.Event('submit')
      this.eq(0).trigger(event)
      if (!event.isDefaultPrevented()) this.get(0).submit()
    }
    return this
  }

})(Zepto)

//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  var _zid = 1, undefined,
      slice = Array.prototype.slice,
      isFunction = $.isFunction,
      isString = function(obj){ return typeof obj == 'string' },
      handlers = {},
      specialEvents={},
      focusinSupported = 'onfocusin' in window,
      focus = { focus: 'focusin', blur: 'focusout' },
      hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || zid(handler.fn) === zid(fn))
        && (!selector || handler.sel == selector)
    })
  }
  function parse(event) {
    var parts = ('' + event).split('.')
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }

  function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }

  function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }

  function add(element, events, fn, data, selector, delegator, capture){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []))
    events.split(/\s/).forEach(function(event){
      if (event == 'ready') return $(document).ready(fn)
      var handler   = parse(event)
      handler.fn    = fn
      handler.sel   = selector
      // emulate mouseenter, mouseleave
      if (handler.e in hover) fn = function(e){
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del   = delegator
      var callback  = delegator || fn
      handler.proxy = function(e){
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length
      set.push(handler)
      if ('addEventListener' in element)
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
  function remove(element, events, fn, selector, capture){
    var id = zid(element)
    ;(events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i]
      if ('removeEventListener' in element)
        element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = { add: add, remove: remove }

  $.proxy = function(fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function(event, data, callback){
    return this.on(event, data, callback)
  }
  $.fn.unbind = function(event, callback){
    return this.off(event, callback)
  }
  $.fn.one = function(event, selector, data, callback){
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function(){return true},
      returnFalse = function(){return false},
      ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
      eventMethods = {
        preventDefault: 'isDefaultPrevented',
        stopImmediatePropagation: 'isImmediatePropagationStopped',
        stopPropagation: 'isPropagationStopped'
      }

  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {
      source || (source = event)

      $.each(eventMethods, function(name, predicate) {
        var sourceMethod = source[name]
        event[name] = function(){
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      try {
        event.timeStamp || (event.timeStamp = Date.now())
      } catch (ignored) { }

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = { originalEvent: event }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function(selector, event, callback){
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function(selector, event, callback){
    return this.off(event, selector, callback)
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }

  $.fn.on = function(event, selector, data, callback, one){
    var autoRemove, delegator, $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (callback === undefined || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(_, element){
      if (one) autoRemove = function(e){
        remove(element, e.type, callback)
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function(e){
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {
          evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  $.fn.off = function(event, selector, callback){
    var $this = this
    if (event && !isString(event)) {
      $.each(event, function(type, fn){
        $this.off(type, selector, fn)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined

    if (callback === false) callback = returnFalse

    return $this.each(function(){
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function(event, args){
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function(){
      // handle focus(), blur() by calling them directly
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event)
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function(event, args){
    var e, result
    this.each(function(i, element){
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function(i, handler){
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;('focusin focusout focus blur load resize scroll unload click dblclick '+
  'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
  'change select keydown keypress keyup error').split(' ').forEach(function(event) {
    $.fn[event] = function(callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  $.Event = function(type, props) {
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
    if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Zepto)

//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

// The following code is heavily inspired by jQuery's $.fn.data()

;(function($){
  var data = {}, dataAttr = $.fn.data, camelize = $.camelCase,
    exp = $.expando = 'Zepto' + (+new Date()), emptyArray = []

  // Get value from node:
  // 1. first try key as given,
  // 2. then try camelized key,
  // 3. fall back to reading "data-*" attribute.
  function getData(node, name) {
    var id = node[exp], store = id && data[id]
    if (name === undefined) return store || setData(node)
    else {
      if (store) {
        if (name in store) return store[name]
        var camelName = camelize(name)
        if (camelName in store) return store[camelName]
      }
      return dataAttr.call($(node), name)
    }
  }

  // Store value under camelized key on node
  function setData(node, name, value) {
    var id = node[exp] || (node[exp] = ++$.uuid),
      store = data[id] || (data[id] = attributeData(node))
    if (name !== undefined) store[camelize(name)] = value
    return store
  }

  // Read all "data-*" attributes from a node
  function attributeData(node) {
    var store = {}
    $.each(node.attributes || emptyArray, function(i, attr){
      if (attr.name.indexOf('data-') == 0)
        store[camelize(attr.name.replace('data-', ''))] =
          $.zepto.deserializeValue(attr.value)
    })
    return store
  }

  $.fn.data = function(name, value) {
    return value === undefined ?
      // set multiple values via object
      $.isPlainObject(name) ?
        this.each(function(i, node){
          $.each(name, function(key, value){ setData(node, key, value) })
        }) :
        // get value from first element
        (0 in this ? getData(this[0], name) : undefined) :
      // set value on all elements
      this.each(function(){ setData(this, name, value) })
  }

  $.data = function(elem, name, value) {
    return $(elem).data(name, value)
  }

  $.hasData = function(elem) {
    var id = elem[exp], store = id && data[id]
    return store ? !$.isEmptyObject(store) : false
  }

  $.fn.removeData = function(names) {
    if (typeof names == 'string') names = names.split(/\s+/)
    return this.each(function(){
      var id = this[exp], store = id && data[id]
      if (store) $.each(names || store, function(key){
        delete store[names ? camelize(this) : key]
      })
    })
  }

  // Generate extended `remove` and `empty` functions
  ;['remove', 'empty'].forEach(function(methodName){
    var origFn = $.fn[methodName]
    $.fn[methodName] = function() {
      var elements = this.find('*')
      if (methodName === 'remove') elements = elements.add(this)
      elements.removeData()
      return origFn.call(this)
    }
  })
})(Zepto)

//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;
(function ($) {
    var jsonpID = +new Date(),
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        jsonType = 'application/json',
        htmlType = 'text/html',
        blankRE = /^\s*$/,
        originAnchor = document.createElement('a')

    originAnchor.href = window.location.href

    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
        var event = $.Event(eventName)
        $(context).trigger(event, data)
        return !event.isDefaultPrevented()
    }

    // trigger an Ajax "global" event
    function triggerGlobal(settings, context, eventName, data) {
        if (settings.global) return triggerAndReturn(context || document, eventName, data)
    }

    // Number of active Ajax requests
    $.active = 0

    function ajaxStart(settings) {
        if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
    }

    function ajaxStop(settings) {
        if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
    }

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    function ajaxBeforeSend(xhr, settings) {
        var context = settings.context
        if (settings.beforeSend.call(context, xhr, settings) === false ||
            triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
            return false

        triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
    }

    function ajaxSuccess(data, xhr, settings, deferred) {
        var context = settings.context,
            status = 'success'
        settings.success.call(context, data, status, xhr)
        if (deferred) deferred.resolveWith(context, [data, status, xhr])
        triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
        ajaxComplete(status, xhr, settings)
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings, deferred, data) {
        var context = settings.context
        console.error("ajax error: " + type + "\nurl: " + settings.url + "\n" + data)
        settings.error.call(context, xhr, type, settings, data)
        if (deferred) deferred.rejectWith(context, [xhr, type, error])
        triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
        ajaxComplete(type, xhr, settings)
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
        var context = settings.context
        settings.complete.call(context, xhr, status)
        triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
        ajaxStop(settings)
    }

    function ajaxDataFilter(data, type, settings) {
        if (settings.dataFilter == empty) return data
        var context = settings.context
        return settings.dataFilter.call(context, data, type)
    }

    // Empty function, used as default callback
    function empty() {}

    $.ajaxJSONP = function (options, deferred) {
        if (!('type' in options)) return $.ajax(options)

        var _callbackName = options.jsonpCallback,
            callbackName = ($.isFunction(_callbackName) ?
                _callbackName() : _callbackName) || ('Zepto' + (jsonpID++)),
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            abort = function (errorType) {
                $(script).triggerHandler('error', errorType || 'abort')
            },
            xhr = {
                abort: abort
            },
            abortTimeout

        if (deferred) deferred.promise(xhr)

        $(script).on('load error', function (e, errorType) {
            clearTimeout(abortTimeout)
            $(script).off().remove()

            if (e.type == 'error' || !responseData) {
                ajaxError(null, errorType || 'error', xhr, options, deferred)
            } else {
                ajaxSuccess(responseData[0], xhr, options, deferred)
            }

            window[callbackName] = originalCallback
            if (responseData && $.isFunction(originalCallback))
                originalCallback(responseData[0])

            originalCallback = responseData = undefined
        })

        if (ajaxBeforeSend(xhr, options) === false) {
            abort('abort')
            return xhr
        }

        window[callbackName] = function () {
            responseData = arguments
        }

        script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
        document.head.appendChild(script)

        if (options.timeout > 0) abortTimeout = setTimeout(function () {
            abort('timeout')
        }, options.timeout)

        return xhr
    }

    $.ajaxSettings = {
        // Default type of request
        type: 'GET',
        // Callback that is executed before request
        beforeSend: empty,
        // Callback that is executed if the request succeeds
        success: empty,
        // Callback that is executed the the server drops error
        error: empty,
        // Callback that is executed on request complete (both: error and success)
        complete: empty,
        // The context for the callbacks
        context: null,
        // Whether to trigger "global" Ajax events
        global: true,
        // Transport
        xhr: function (settings) {
            if (settings.crossDomain) { //强制使用plus跨域
                return new plus.net.XMLHttpRequest();
            }
            if ($.os.plus) {
                var originAnchor = document.createElement('a');
                originAnchor.href = window.location.href;
                //仅在webview的url为远程文件，且ajax请求的资源不同源下使用plus.net.XMLHttpRequest
                if (originAnchor.protocol !== 'file:') {
                    var urlAnchor = document.createElement('a');
                    urlAnchor.href = settings.url;
                    urlAnchor.href = urlAnchor.href;
                    settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host);
                    if (settings.crossDomain) {
                        return new plus.net.XMLHttpRequest();
                    }
                }
                if ($.os.ios && window.webkit && window.webkit.messageHandlers) { //wkwebview下同样使用5+ xhr
                    return new plus.net.XMLHttpRequest();
                }
                return new window.XMLHttpRequest()
            } else {
                return new window.XMLHttpRequest()
            }
        },
        // MIME types mapping
        // IIS returns Javascript as "application/x-javascript"
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json: jsonType,
            xml: 'application/xml, text/xml',
            html: htmlType,
            text: 'text/plain'
        },
        // Whether the request is to another domain
        crossDomain: false,
        // Default timeout
        timeout: 0,
        // Whether data should be serialized to string
        processData: true,
        // Whether the browser should be allowed to cache GET responses
        cache: true,
        //Used to handle the raw response data of XMLHttpRequest.
        //This is a pre-filtering function to sanitize the response.
        //The sanitized response should be returned
        dataFilter: empty
    }

    function mimeToDataType(mime) {
        if (mime) mime = mime.split(';', 2)[0]
        return mime && (mime == htmlType ? 'html' :
            mime == jsonType ? 'json' :
            scriptTypeRE.test(mime) ? 'script' :
            xmlTypeRE.test(mime) && 'xml') || 'text'
    }

    function appendQuery(url, query) {
        if (query == '') return url
        return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }

    // serialize payload and append it to the URL for GET requests
    function serializeData(options) {
        if (options.processData && options.data && $.type(options.data) != "string")
            options.data = $.param(options.data, options.traditional)
        if (options.data && (!options.type || options.type.toUpperCase() == 'GET' || 'jsonp' == options.dataType))
            options.url = appendQuery(options.url, options.data), options.data = undefined
    }

    $.ajax = function (options) {
        var settings = $.extend({}, options || {}),
            deferred = $.Deferred && $.Deferred(),
            urlAnchor, hashIndex
        for (key in $.ajaxSettings)
            if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

        ajaxStart(settings)

        if (!settings.crossDomain) {
            urlAnchor = document.createElement('a')
            urlAnchor.href = settings.url
            // cleans up URL for .href (IE only), see https://github.com/madrobby/zepto/pull/1049
            urlAnchor.href = urlAnchor.href
            settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
        }

        if (!settings.url) settings.url = window.location.toString()
        if ((hashIndex = settings.url.indexOf('#')) > -1) settings.url = settings.url.slice(0, hashIndex)
        serializeData(settings)

        var dataType = settings.dataType,
            hasPlaceholder = /\?.+=\?/.test(settings.url)
        if (hasPlaceholder) dataType = 'jsonp'

        if (settings.cache === false || (
                (!options || options.cache !== true) &&
                ('script' == dataType || 'jsonp' == dataType)
            ))
            settings.url = appendQuery(settings.url, '_=' + Date.now())

        if ('jsonp' == dataType) {
            if (!hasPlaceholder)
                settings.url = appendQuery(settings.url,
                    settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
            return $.ajaxJSONP(settings, deferred)
        }

        var mime = settings.accepts[dataType],
            headers = {},
            setHeader = function (name, value) {
                headers[name.toLowerCase()] = [name, value]
            },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(settings),
            nativeSetHeader = xhr.setRequestHeader,
            abortTimeout

        if (deferred) deferred.promise(xhr)

        if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
        setHeader('Accept', mime || '*/*')
        if (mime = settings.mimeType || mime) {
            if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
            xhr.overrideMimeType && xhr.overrideMimeType(mime)
        }
        if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
            setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

        if (settings.headers)
            for (name in settings.headers) setHeader(name, settings.headers[name])
        xhr.setRequestHeader = setHeader

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = empty
                clearTimeout(abortTimeout)
                var result, error = false
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
                    dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))

                    if (xhr.responseType == 'arraybuffer' || xhr.responseType == 'blob')
                        result = xhr.response
                    else {
                        result = xhr.responseText

                        try {
                            // http://perfectionkills.com/global-eval-what-are-the-options/
                            // sanitize response accordingly if data filter callback provided
                            result = ajaxDataFilter(result, dataType, settings)
                            if (dataType == 'script')(1, eval)(result)
                            else if (dataType == 'xml') result = xhr.responseXML
                            else if (dataType == 'json') {
                                result = result.trim()
                                result = blankRE.test(result) ? null : $.parseJSON(result)
                            }
                        } catch (e) {
                            error = e
                        }

                        if (error) return ajaxError(error, 'parsererror', xhr, settings, deferred)
                    }

                    ajaxSuccess(result, xhr, settings, deferred, result)
                } else {
                    ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred, result)
                }
            }
        }

        if (ajaxBeforeSend(xhr, settings) === false) {
            xhr.abort()
            ajaxError(null, 'abort', xhr, settings, deferred)
            return xhr
        }

        var async = 'async' in settings ? settings.async : true
        xhr.open(settings.type, settings.url, async, settings.username, settings.password)

        if (settings.xhrFields)
            for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

        for (name in headers) nativeSetHeader.apply(xhr, headers[name])

        if (settings.timeout > 0) abortTimeout = setTimeout(function () {
            xhr.onreadystatechange = empty
            xhr.abort()
            ajaxError(null, 'timeout', xhr, settings, deferred)
        }, settings.timeout)

        // avoid sending empty string (#319)
        xhr.send(settings.data ? settings.data : null)
        return xhr
    }

    // handle optional data/success arguments
    function parseArguments(url, data, success, dataType) {
        if ($.isFunction(data)) dataType = success, success = data, data = undefined
        if (!$.isFunction(success)) dataType = success, success = undefined
        return {
            url: url,
            data: data,
            success: success,
            dataType: dataType
        }
    }

    $.get = function ( /* url, data, success, dataType */ ) {
        var options = parseArguments.apply(null, arguments)
        options.type = 'GET'
        return $.ajax(options)
    }

    $.post = function ( /* url, data, success, dataType */ ) {
        var options = parseArguments.apply(null, arguments)
        options.type = 'POST'
        return $.ajax(options)
    }

    $.getJSON = function ( /* url, data, success */ ) {
        var options = parseArguments.apply(null, arguments)
        options.dataType = 'json'
        return $.ajax(options)
    }

    $.fn.load = function (url, data, success) {
        if (!this.length) return this
        var self = this,
            parts = url.split(/\s/),
            selector,
            options = parseArguments(url, data, success),
            callback = options.success
        if (parts.length > 1) options.url = parts[0], selector = parts[1]
        options.success = function (response) {
            self.html(selector ?
                $('<div>').html(response.replace(rscript, "")).find(selector) :
                response)
            callback && callback.apply(self, arguments)
        }
        $.ajax(options)
        return this
    }

    var escape = encodeURIComponent

    function serialize(params, obj, traditional, scope) {
        var type, array = $.isArray(obj),
            hash = $.isPlainObject(obj)
        $.each(obj, function (key, value) {
            type = $.type(value)
            if (scope) key = traditional ? scope :
                scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
            // handle data in serializeArray() format
            if (!scope && array) params.add(value.name, value.value)
            // recurse into nested objects
            else if (type == "array" || (!traditional && type == "object"))
                serialize(params, value, traditional, key)
            else params.add(key, value)
        })
    }

    $.param = function (obj, traditional) {
        var params = []
        params.add = function (key, value) {
            if ($.isFunction(value)) value = value()
            if (value == null) value = ""
            this.push(escape(key) + '=' + escape(value))
        }
        serialize(params, obj, traditional)
        return params.join('&').replace(/%20/g, '+')
    }
})(Zepto)
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function($){
  function detect(ua, platform){
    var os = this.os = {}, browser = this.browser = {},
      webkit = ua.match(/Web[kK]it[\/]{0,1}([\d.]+)/),
      android = ua.match(/(Android);?[\s\/]+([\d.]+)?/),
      osx = !!ua.match(/\(Macintosh\; Intel /),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
      iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/),
      webos = ua.match(/(webOS|hpwOS)[\s\/]([\d.]+)/),
      win = /Win\d{2}|Windows/.test(platform),
      wp = ua.match(/Windows Phone ([\d.]+)/),
      touchpad = webos && ua.match(/TouchPad/),
      kindle = ua.match(/Kindle\/([\d.]+)/),
      silk = ua.match(/Silk\/([\d._]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/),
      bb10 = ua.match(/(BB10).*Version\/([\d.]+)/),
      rimtabletos = ua.match(/(RIM\sTablet\sOS)\s([\d.]+)/),
      playbook = ua.match(/PlayBook/),
      chrome = ua.match(/Chrome\/([\d.]+)/) || ua.match(/CriOS\/([\d.]+)/),
      firefox = ua.match(/Firefox\/([\d.]+)/),
      firefoxos = ua.match(/\((?:Mobile|Tablet); rv:([\d.]+)\).*Firefox\/[\d.]+/),
      ie = ua.match(/MSIE\s([\d.]+)/) || ua.match(/Trident\/[\d](?=[^\?]+).*rv:([0-9.].)/),
      webview = !chrome && ua.match(/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/),
      safari = webview || ua.match(/Version\/([\d.]+)([^S](Safari)|[^M]*(Mobile)[^S]*(Safari))/),
      plus = ua.match(/Html5Plus/i),
      stream = ua.match(/StreamApp/i)

    // Todo: clean this up with a better OS/browser seperation:
    // - discern (more) between multiple browsers on android
    // - decide if kindle fire in silk mode is android or not
    // - Firefox on Android doesn't specify the Android version
    // - possibly devide in os, device and browser hashes

    if (browser.webkit = !!webkit) browser.version = webkit[1]

    if (android) os.android = true, os.version = android[2]
    if (iphone && !ipod) os.ios = os.iphone = true, os.version = iphone[2].replace(/_/g, '.')
    if (ipad) os.ios = os.ipad = true, os.version = ipad[2].replace(/_/g, '.')
    if (ipod) os.ios = os.ipod = true, os.version = ipod[3] ? ipod[3].replace(/_/g, '.') : null
    if (wp) os.wp = true, os.version = wp[1]
    if (webos) os.webos = true, os.version = webos[2]
    if (touchpad) os.touchpad = true
    if (blackberry) os.blackberry = true, os.version = blackberry[2]
    if (bb10) os.bb10 = true, os.version = bb10[2]
    if (rimtabletos) os.rimtabletos = true, os.version = rimtabletos[2]
    if (playbook) browser.playbook = true
    if (kindle) os.kindle = true, os.version = kindle[1]
    if (silk) browser.silk = true, browser.version = silk[1]
    if (!silk && os.android && ua.match(/Kindle Fire/)) browser.silk = true
    if (chrome) browser.chrome = true, browser.version = chrome[1]
    if (firefox) browser.firefox = true, browser.version = firefox[1]
    if (firefoxos) os.firefoxos = true, os.version = firefoxos[1]
    if (ie) browser.ie = true, browser.version = ie[1]
    if (safari && (osx || os.ios || win)) {
      browser.safari = true
      if (!os.ios) browser.version = safari[1]
    }
    if (webview) browser.webview = true
    if (plus) os.plus = true
    if (stream) os.stream = true

    os.tablet = !!(ipad || playbook || (android && !ua.match(/Mobile/)) ||
      (firefox && ua.match(/Tablet/)) || (ie && !ua.match(/Phone/) && ua.match(/Touch/)))
    os.phone  = !!(!os.tablet && !os.ipod && (android || iphone || webos || blackberry || bb10 ||
      (chrome && ua.match(/Android/)) || (chrome && ua.match(/CriOS\/([\d.]+)/)) ||
      (firefox && ua.match(/Mobile/)) || (ie && ua.match(/Touch/))))
  }

  detect.call($, navigator.userAgent, navigator.platform)
  // make available to unit tests
  $.__detect = detect

})(Zepto)

/*! art-template@4.12.1 for browser | https://github.com/aui/art-template */
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.template=t():e.template=t()}(this,function(){return function(e){function t(r){if(n[r])return n[r].exports;var i=n[r]={i:r,l:!1,exports:{}};return e[r].call(i.exports,i,i.exports,t),i.l=!0,i.exports}var n={};return t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:r})},t.n=function(e){var n=e&&e.__esModule?function(){return e["default"]}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=6)}([function(e,t,n){(function(t){e.exports=!1;try{e.exports="[object process]"===Object.prototype.toString.call(t.process)}catch(n){}}).call(t,n(4))},function(e,t,n){"use strict";var r=n(8),i=n(3),o=n(23),s=function(e,t){t.onerror(e,t);var n=function(){return"{Template Error}"};return n.mappings=[],n.sourcesContent=[],n},a=function c(e){var t=arguments.length>1&&arguments[1]!==undefined?arguments[1]:{};"string"!=typeof e?t=e:t.source=e,t=i.$extend(t),e=t.source,!0===t.debug&&(t.cache=!1,t.minimize=!1,t.compileDebug=!0),t.compileDebug&&(t.minimize=!1),t.filename&&(t.filename=t.resolveFilename(t.filename,t));var n=t.filename,a=t.cache,u=t.caches;if(a&&n){var p=u.get(n);if(p)return p}if(!e)try{e=t.loader(n,t),t.source=e}catch(d){var l=new o({name:"CompileError",path:n,message:"template not found: "+d.message,stack:d.stack});if(t.bail)throw l;return s(l,t)}var f=void 0,h=new r(t);try{f=h.build()}catch(l){if(l=new o(l),t.bail)throw l;return s(l,t)}var m=function(e,n){try{return f(e,n)}catch(l){if(!t.compileDebug)return t.cache=!1,t.compileDebug=!0,c(t)(e,n);if(l=new o(l),t.bail)throw l;return s(l,t)()}};return m.mappings=f.mappings,m.sourcesContent=f.sourcesContent,m.toString=function(){return f.toString()},a&&n&&u.set(n,m),m};a.Compiler=r,e.exports=a},function(e,t){Object.defineProperty(t,"__esModule",{value:!0}),t["default"]=/((['"])(?:(?!\2|\\).|\\(?:\r\n|[\s\S]))*(\2)?|`(?:[^`\\$]|\\[\s\S]|\$(?!\{)|\$\{(?:[^{}]|\{[^}]*\}?)*\}?)*(`)?)|(\/\/.*)|(\/\*(?:[^*]|\*(?!\/))*(\*\/)?)|(\/(?!\*)(?:\[(?:(?![\]\\]).|\\.)*\]|(?![\/\]\\]).|\\.)+\/(?:(?!\s*(?:\b|[\u0080-\uFFFF$\\'"~({]|[+\-!](?!=)|\.?\d))|[gmiyu]{1,5}\b(?![\u0080-\uFFFF$\\]|\s*(?:[+\-*%&|^<>!=?({]|\/(?![\/*])))))|(0[xX][\da-fA-F]+|0[oO][0-7]+|0[bB][01]+|(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?)|((?!\d)(?:(?!\s)[$\w\u0080-\uFFFF]|\\u[\da-fA-F]{4}|\\u\{[\da-fA-F]+\})+)|(--|\+\+|&&|\|\||=>|\.{3}|(?:[+\-\/%&|^]|\*{1,2}|<{1,2}|>{1,3}|!=?|={1,2})=?|[?~.,:;[\](){}])|(\s+)|(^$|[\s\S])/g,t.matchToToken=function(e){var t={type:"invalid",value:e[0]};return e[1]?(t.type="string",t.closed=!(!e[3]&&!e[4])):e[5]?t.type="comment":e[6]?(t.type="comment",t.closed=!!e[7]):e[8]?t.type="regex":e[9]?t.type="number":e[10]?t.type="name":e[11]?t.type="punctuator":e[12]&&(t.type="whitespace"),t}},function(e,t,n){"use strict";function r(){this.$extend=function(e){return e=e||{},s(e,e instanceof r?e:this)}}var i=n(0),o=n(12),s=n(13),a=n(14),c=n(15),u=n(16),p=n(17),l=n(18),f=n(19),h=n(20),m=n(22),d={source:null,filename:null,rules:[f,l],escape:!0,debug:!!i&&"production"!==process.env.NODE_ENV,bail:!0,cache:!0,minimize:!0,compileDebug:!1,resolveFilename:m,include:a,htmlMinifier:h,htmlMinifierOptions:{collapseWhitespace:!0,minifyCSS:!0,minifyJS:!0,ignoreCustomFragments:[]},onerror:c,loader:p,caches:u,root:"/",extname:".art",ignore:[],imports:o};r.prototype=d,e.exports=new r},function(e,t){var n;n=function(){return this}();try{n=n||Function("return this")()||(0,eval)("this")}catch(r){"object"==typeof window&&(n=window)}e.exports=n},function(e,t){},function(e,t,n){"use strict";var r=n(7),i=n(1),o=n(24),s=function(e,t){return t instanceof Object?r({filename:e},t):i({filename:e,source:t})};s.render=r,s.compile=i,s.defaults=o,e.exports=s},function(e,t,n){"use strict";var r=n(1),i=function(e,t,n){return r(e,n)(t)};e.exports=i},function(e,t,n){"use strict";function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var i=n(9),o=n(11),s="$data",a="$imports",c="print",u="include",p="extend",l="block",f="$$out",h="$$line",m="$$blocks",d="$$slice",v="$$from",g="$$options",y=function(e,t){return e.hasOwnProperty(t)},b=JSON.stringify,x=function(){function e(t){var n,i,y=this;r(this,e);var b=t.source,x=t.minimize,w=t.htmlMinifier;if(this.options=t,this.stacks=[],this.context=[],this.scripts=[],this.CONTEXT_MAP={},this.ignore=[s,a,g].concat(t.ignore),this.internal=(n={},n[f]="''",n[h]="[0,0]",n[m]="arguments[1]||{}",n[v]="null",n[c]="function(){var s=''.concat.apply('',arguments);"+f+"+=s;return s}",n[u]="function(src,data){var s="+g+".include(src,data||"+s+",arguments[2]||"+m+","+g+");"+f+"+=s;return s}",n[p]="function(from){"+v+"=from}",n[d]="function(c,p,s){p="+f+";"+f+"='';c();s="+f+";"+f+"=p+s;return s}",n[l]="function(){var a=arguments,s;if(typeof a[0]==='function'){return "+d+"(a[0])}else if("+v+"){"+m+"[a[0]]="+d+"(a[1])}else{s="+m+"[a[0]];if(typeof s==='string'){"+f+"+=s}else{s="+d+"(a[1])}return s}}",n),this.dependencies=(i={},i[c]=[f],i[u]=[f,g,s,m],i[p]=[v,u],i[l]=[d,v,f,m],i),this.importContext(f),t.compileDebug&&this.importContext(h),x)try{b=w(b,t)}catch(E){}this.source=b,this.getTplTokens(b,t.rules,this).forEach(function(e){e.type===o.TYPE_STRING?y.parseString(e):y.parseExpression(e)})}return e.prototype.getTplTokens=function(){return o.apply(undefined,arguments)},e.prototype.getEsTokens=function(e){return i(e)},e.prototype.getVariables=function(e){var t=!1;return e.filter(function(e){return"whitespace"!==e.type&&"comment"!==e.type}).filter(function(e){return"name"===e.type&&!t||(t="punctuator"===e.type&&"."===e.value,!1)}).map(function(e){return e.value})},e.prototype.importContext=function(e){var t=this,n="",r=this.internal,i=this.dependencies,o=this.ignore,c=this.context,u=this.options,p=u.imports,l=this.CONTEXT_MAP;y(l,e)||-1!==o.indexOf(e)||(y(r,e)?(n=r[e],y(i,e)&&i[e].forEach(function(e){return t.importContext(e)})):n="$escape"===e||"$each"===e||y(p,e)?a+"."+e:s+"."+e,l[e]=n,c.push({name:e,value:n}))},e.prototype.parseString=function(e){var t=e.value;if(t){var n=f+"+="+b(t);this.scripts.push({source:t,tplToken:e,code:n})}},e.prototype.parseExpression=function(e){var t=this,n=e.value,r=e.script,i=r.output,s=this.options.escape,a=r.code;i&&(a=!1===s||i===o.TYPE_RAW?f+"+="+r.code:f+"+=$escape("+r.code+")");var c=this.getEsTokens(a);this.getVariables(c).forEach(function(e){return t.importContext(e)}),this.scripts.push({source:n,tplToken:e,code:a})},e.prototype.checkExpression=function(e){for(var t=[[/^\s*}[\w\W]*?{?[\s;]*$/,""],[/(^[\w\W]*?\([\w\W]*?(?:=>|\([\w\W]*?\))\s*{[\s;]*$)/,"$1})"],[/(^[\w\W]*?\([\w\W]*?\)\s*{[\s;]*$)/,"$1}"]],n=0;n<t.length;){if(t[n][0].test(e)){var r;e=(r=e).replace.apply(r,t[n]);break}n++}try{return new Function(e),!0}catch(i){return!1}},e.prototype.build=function(){var e=this.options,t=this.context,n=this.scripts,r=this.stacks,i=this.source,c=e.filename,l=e.imports,d=[],x=y(this.CONTEXT_MAP,p),w=0,E=function(e,t){var n=t.line,i=t.start,o={generated:{line:r.length+w+1,column:1},original:{line:n+1,column:i+1}};return w+=e.split(/\n/).length-1,o},k=function(e){return e.replace(/^[\t ]+|[\t ]$/g,"")};r.push("function("+s+"){"),r.push("'use strict'"),r.push(s+"="+s+"||{}"),r.push("var "+t.map(function(e){return e.name+"="+e.value}).join(",")),e.compileDebug?(r.push("try{"),n.forEach(function(e){e.tplToken.type===o.TYPE_EXPRESSION&&r.push(h+"=["+[e.tplToken.line,e.tplToken.start].join(",")+"]"),d.push(E(e.code,e.tplToken)),r.push(k(e.code))}),r.push("}catch(error){"),r.push("throw {"+["name:'RuntimeError'","path:"+b(c),"message:error.message","line:"+h+"[0]+1","column:"+h+"[1]+1","source:"+b(i),"stack:error.stack"].join(",")+"}"),r.push("}")):n.forEach(function(e){d.push(E(e.code,e.tplToken)),r.push(k(e.code))}),x&&(r.push(f+"=''"),r.push(u+"("+v+","+s+","+m+")")),r.push("return "+f),r.push("}");var T=r.join("\n");try{var O=new Function(a,g,"return "+T)(l,e);return O.mappings=d,O.sourcesContent=[i],O}catch(F){for(var $=0,j=0,S=0,_=void 0;$<n.length;){var C=n[$];if(!this.checkExpression(C.code)){j=C.tplToken.line,S=C.tplToken.start,_=C.code;break}$++}throw{name:"CompileError",path:c,message:F.message,line:j+1,column:S+1,source:i,generated:_,stack:F.stack}}},e}();x.CONSTS={DATA:s,IMPORTS:a,PRINT:c,INCLUDE:u,EXTEND:p,BLOCK:l,OPTIONS:g,OUT:f,LINE:h,BLOCKS:m,SLICE:d,FROM:v,ESCAPE:"$escape",EACH:"$each"},e.exports=x},function(e,t,n){"use strict";var r=n(10),i=n(2)["default"],o=n(2).matchToToken,s=function(e){return e.match(i).map(function(e){return i.lastIndex=0,o(i.exec(e))}).map(function(e){return"name"===e.type&&r(e.value)&&(e.type="keyword"),e})};e.exports=s},function(e,t,n){"use strict";var r={"abstract":!0,await:!0,"boolean":!0,"break":!0,"byte":!0,"case":!0,"catch":!0,"char":!0,"class":!0,"const":!0,"continue":!0,"debugger":!0,"default":!0,"delete":!0,"do":!0,"double":!0,"else":!0,"enum":!0,"export":!0,"extends":!0,"false":!0,"final":!0,"finally":!0,"float":!0,"for":!0,"function":!0,"goto":!0,"if":!0,"implements":!0,"import":!0,"in":!0,"instanceof":!0,"int":!0,"interface":!0,"let":!0,"long":!0,"native":!0,"new":!0,"null":!0,"package":!0,"private":!0,"protected":!0,"public":!0,"return":!0,"short":!0,"static":!0,"super":!0,"switch":!0,"synchronized":!0,"this":!0,"throw":!0,"transient":!0,"true":!0,"try":!0,"typeof":!0,"var":!0,"void":!0,"volatile":!0,"while":!0,"with":!0,"yield":!0};e.exports=function(e){return r.hasOwnProperty(e)}},function(e,t,n){"use strict";function r(e,t,n,r){var i=new String(e);return i.line=t,i.start=n,i.end=r,i}var i=function(e,t){for(var n=arguments.length>2&&arguments[2]!==undefined?arguments[2]:{},i=[{type:"string",value:e,line:0,start:0,end:e.length}],o=0;o<t.length;o++)!function(e){for(var t=e.test.ignoreCase?"ig":"g",o=e.test.source+"|^$|[\\w\\W]",s=new RegExp(o,t),a=0;a<i.length;a++)if("string"===i[a].type){for(var c=i[a].line,u=i[a].start,p=i[a].end,l=i[a].value.match(s),f=[],h=0;h<l.length;h++){var m=l[h];e.test.lastIndex=0;var d=e.test.exec(m),v=d?"expression":"string",g=f[f.length-1],y=g||i[a],b=y.value;u=y.line===c?g?g.end:u:b.length-b.lastIndexOf("\n")-1,p=u+m.length;var x={type:v,value:m,line:c,start:u,end:p};if("string"===v)g&&"string"===g.type?(g.value+=m,g.end+=m.length):f.push(x);else{d[0]=new r(d[0],c,u,p);var w=e.use.apply(n,d);x.script=w,f.push(x)}c+=m.split(/\n/).length-1}i.splice.apply(i,[a,1].concat(f)),a+=f.length-1}}(t[o]);return i};i.TYPE_STRING="string",i.TYPE_EXPRESSION="expression",i.TYPE_RAW="raw",i.TYPE_ESCAPE="escape",e.exports=i},function(e,t,n){"use strict";(function(t){function r(e){return"string"!=typeof e&&(e=e===undefined||null===e?"":"function"==typeof e?r(e.call(e)):JSON.stringify(e)),e}function i(e){var t=""+e,n=a.exec(t);if(!n)return e;var r="",i=void 0,o=void 0,s=void 0;for(i=n.index,o=0;i<t.length;i++){switch(t.charCodeAt(i)){case 34:s="&#34;";break;case 38:s="&#38;";break;case 39:s="&#39;";break;case 60:s="&#60;";break;case 62:s="&#62;";break;default:continue}o!==i&&(r+=t.substring(o,i)),o=i+1,r+=s}return o!==i?r+t.substring(o,i):r}/*! art-template@runtime | https://github.com/aui/art-template */
var o=n(0),s=Object.create(o?t:window),a=/["&'<>]/;s.$escape=function(e){return i(r(e))},s.$each=function(e,t){if(Array.isArray(e))for(var n=0,r=e.length;n<r;n++)t(e[n],n);else for(var i in e)t(e[i],i)},e.exports=s}).call(t,n(4))},function(e,t,n){"use strict";var r=Object.prototype.toString,i=function(e){return null===e?"Null":r.call(e).slice(8,-1)},o=function s(e,t){var n=void 0,r=i(e);if("Object"===r?n=Object.create(t||{}):"Array"===r&&(n=[].concat(t||[])),n){for(var o in e)e.hasOwnProperty(o)&&(n[o]=s(e[o],n[o]));return n}return e};e.exports=o},function(e,t,n){"use strict";var r=function(e,t,r,i){var o=n(1);return i=i.$extend({filename:i.resolveFilename(e,i),bail:!0,source:null}),o(i)(t,r)};e.exports=r},function(e,t,n){"use strict";var r=function(e){console.error(e.name,e.message)};e.exports=r},function(e,t,n){"use strict";var r={__data:Object.create(null),set:function(e,t){this.__data[e]=t},get:function(e){return this.__data[e]},reset:function(){this.__data={}}};e.exports=r},function(e,t,n){"use strict";var r=n(0),i=function(e){if(r){return n(5).readFileSync(e,"utf8")}var t=document.getElementById(e);return t.value||t.innerHTML};e.exports=i},function(e,t,n){"use strict";var r={test:/{{([@#]?)[ \t]*(\/?)([\w\W]*?)[ \t]*}}/,use:function(e,t,n,i){var o=this,s=o.options,a=o.getEsTokens(i),c=a.map(function(e){return e.value}),u={},p=void 0,l=!!t&&"raw",f=n+c.shift(),h=function(t,n){console.warn((s.filename||"anonymous")+":"+(e.line+1)+":"+(e.start+1)+"\nTemplate upgrade: {{"+t+"}} -> {{"+n+"}}")};switch("#"===t&&h("#value","@value"),f){case"set":i="var "+c.join("").trim();break;case"if":i="if("+c.join("").trim()+"){";break;case"else":var m=c.indexOf("if");~m?(c.splice(0,m+1),i="}else if("+c.join("").trim()+"){"):i="}else{";break;case"/if":i="}";break;case"each":p=r._split(a),p.shift(),"as"===p[1]&&(h("each object as value index","each object value index"),p.splice(1,1));i="$each("+(p[0]||"$data")+",function("+(p[1]||"$value")+","+(p[2]||"$index")+"){";break;case"/each":i="})";break;case"block":p=r._split(a),p.shift(),i="block("+p.join(",").trim()+",function(){";break;case"/block":i="})";break;case"echo":f="print",h("echo value","value");case"print":case"include":case"extend":if(0!==c.join("").trim().indexOf("(")){p=r._split(a),p.shift(),i=f+"("+p.join(",")+")";break}default:if(~c.indexOf("|")){var d=a.reduce(function(e,t){var n=t.value,r=t.type;return"|"===n?e.push([]):"whitespace"!==r&&"comment"!==r&&(e.length||e.push([]),":"===n&&1===e[e.length-1].length?h("value | filter: argv","value | filter argv"):e[e.length-1].push(t)),e},[]).map(function(e){return r._split(e)});i=d.reduce(function(e,t){var n=t.shift();return t.unshift(e),"$imports."+n+"("+t.join(",")+")"},d.shift().join(" ").trim())}l=l||"escape"}return u.code=i,u.output=l,u},_split:function(e){e=e.filter(function(e){var t=e.type;return"whitespace"!==t&&"comment"!==t});for(var t=0,n=e.shift(),r=/\]|\)/,i=[[n]];t<e.length;){var o=e[t];"punctuator"===o.type||"punctuator"===n.type&&!r.test(n.value)?i[i.length-1].push(o):i.push([o]),n=o,t++}return i.map(function(e){return e.map(function(e){return e.value}).join("")})}};e.exports=r},function(e,t,n){"use strict";var r={test:/<%(#?)((?:==|=#|[=-])?)[ \t]*([\w\W]*?)[ \t]*(-?)%>/,use:function(e,t,n,r){return n={"-":"raw","=":"escape","":!1,"==":"raw","=#":"raw"}[n],t&&(r="/*"+r+"*/",n=!1),{code:r,output:n}}};e.exports=r},function(e,t,n){"use strict";var r=n(0),i=function(e,t){if(r){var i,o=n(21).minify,s=t.htmlMinifierOptions,a=t.rules.map(function(e){return e.test});(i=s.ignoreCustomFragments).push.apply(i,a),e=o(e,s)}return e};e.exports=i},function(e,t){!function(e){e.noop=function(){}}("object"==typeof e&&"object"==typeof e.exports?e.exports:window)},function(e,t,n){"use strict";var r=n(0),i=/^\.+\//,o=function(e,t){if(r){var o=n(5),s=t.root,a=t.extname;if(i.test(e)){var c=t.filename,u=!c||e===c,p=u?s:o.dirname(c);e=o.resolve(p,e)}else e=o.resolve(s,e);o.extname(e)||(e+=a)}return e};e.exports=o},function(e,t,n){"use strict";function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function o(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}function s(e){var t=e.name,n=e.source,r=e.path,i=e.line,o=e.column,s=e.generated,a=e.message;if(!n)return a;var c=n.split(/\n/),u=Math.max(i-3,0),p=Math.min(c.length,i+3),l=c.slice(u,p).map(function(e,t){var n=t+u+1;return(n===i?" >> ":"    ")+n+"| "+e}).join("\n");return(r||"anonymous")+":"+i+":"+o+"\n"+l+"\n\n"+t+": "+a+(s?"\n   generated: "+s:"")}var a=function(e){function t(n){r(this,t);var o=i(this,e.call(this,n.message));return o.name="TemplateError",o.message=s(n),Error.captureStackTrace&&Error.captureStackTrace(o,o.constructor),o}return o(t,e),t}(Error);e.exports=a},function(e,t,n){"use strict";e.exports=n(3)}])});
/**
 * back
 * @param {type} $
 * @param {type} window
 * @returns {undefined}
 */
;
(function ($, window) {
    if (!$.os.plus) return
    //首次按下back按键的时间
    var back__first = null;

    $.back = function () {
        if (typeof $.config.beforeback === 'function') {
            if ($.config.beforeback() === false) {
                return;
            }
        }
        if (!window.plus) {
            return false;
        }
        var wobj = plus.webview.currentWebview();
        var parent = wobj.parent();
        if (parent) {
            parent.evalJS('$&&$.back();');
        } else {
            wobj.canBack(function (e) {
                //by chb 暂时注释，在碰到类似popover之类的锚点的时候，需多次点击才能返回；
                if (e.canBack) { //webview history back
                    window.history.back();
                } else { //webview close or hide
                    //fixed by fxy 此处不应该用opener判断，因为用户有可能自己close掉当前窗口的opener。这样的话。opener就为空了，导致不能执行close
                    if (wobj.id === plus.runtime.appid) { //首页
                        //首页不存在opener的情况下，后退实际上应该是退出应用；
                        //首次按键，提示‘再按一次退出应用’
                        if (!back__first) {
                            back__first = new Date().getTime();
                            $.toast($.config.backToast || '再按一次退出应用');
                            setTimeout(function () {
                                back__first = null;
                            }, 2000);
                        } else {
                            if (new Date().getTime() - back__first < 2000) {
                                plus.runtime.quit();
                            }
                        }
                    } else { //其他页面，
                        if (wobj.preload) {
                            wobj.hide("auto");
                        } else {
                            //关闭页面时，需要将其打开的所有子页面全部关闭；
                            $.closeAll(wobj);
                        }
                    }
                }
            });
        }
        return true;
    };
})(Zepto, window);
/**
 * mui.init 5+
 * @param {type} $
 * @returns {undefined}
 */
;
(function ($) {
    if (!$.os.plus) return
    //默认页面动画
    var defaultShow = $.config.show;

    $.currentWebview = null;

    /**
     * 5+ event(5+没提供之前我自己实现)
     * @param {type} webview
     * @param {type} eventType
     * @param {type} data
     * @returns {undefined}
     */
    $.fire = function (webview, eventType, data) {
        if (webview) {
            if (typeof data === 'undefined') {
                data = '';
            } else if (typeof data === 'boolean' || typeof data === 'number') {
                webview.evalJS("typeof $!=='undefined'&&$.receive('" + eventType + "'," + data + ")");
                return;
            } else if ($.isPlainObject(data) || $.isArray(data)) {
                data = JSON.stringify(data || {}).replace(/\'/g, "\\u0027").replace(/\\/g, "\\u005c");
            }
            webview.evalJS("typeof $!=='undefined'&&$.receive('" + eventType + "','" + data + "')");
        }
    };
    /**
     * 5+ event(5+没提供之前我自己实现)
     * @param {type} eventType
     * @param {type} data
     * @returns {undefined}
     */
    $.receive = function (eventType, data) {
        if (eventType) {
            try {
                if (data && typeof data === 'string') {
                    data = JSON.parse(data);
                }
            } catch (e) {}
            $(document).trigger(eventType, data);
        }
    };
    var triggerPreload = function (webview) {
        if (!webview.preloaded) { //保证仅触发一次
            $.fire(webview, 'preload');
            var list = webview.children();
            for (var i = 0; i < list.length; i++) {
                $.fire(list[i], 'preload');
            }
            webview.preloaded = true;
        }
    };
    var trigger = function (webview, eventType, timeChecked) {
        if (timeChecked) {
            if (!webview[eventType + 'ed']) {
                $.fire(webview, eventType);
                var list = webview.children();
                for (var i = 0; i < list.length; i++) {
                    $.fire(list[i], eventType);
                }
                webview[eventType + 'ed'] = true;
            }
        } else {
            $.fire(webview, eventType);
            var list = webview.children();
            for (var i = 0; i < list.length; i++) {
                $.fire(list[i], eventType);
            }
        }

    };
    /**
     * 打开新窗口
     * @param {string} url 要打开的页面地址
     * @param {string} id 指定页面ID
     * @param {object} options 可选:参数,等待,窗口,显示配置{params:{},waiting:{},styles:{},show:{}}
     */
    $.openWindow = function (url, id, options) {
        if (typeof url === 'object') {
            options = url;
            url = options.url;
            id = options.id || url;
        } else {
            if (typeof id === 'object') {
                options = id;
                id = options.id || url;
            } else {
                id = id || url;
            }
        }
        if (!window.plus) {
            return;
        }

        options = options || {};
        var params = options.params || {};
        var webview = null,
            webviewCache = null,
            nShow, nWaiting;

        if ($.webviews[id]) {
            webviewCache = $.webviews[id];
            //webview真实存在，才能获取
            if (plus.webview.getWebviewById(id)) {
                webview = webviewCache.webview;
            }
        } else if (options.createNew !== true) {
            webview = plus.webview.getWebviewById(id);
        }

        if (webview) { //已缓存
            //每次show都需要传递动画参数；
            //预加载的动画参数优先级：openWindow配置>preloadPages配置>mui默认配置；
            nShow = webviewCache ? webviewCache.show : defaultShow;
            nShow = options.show ? $.extend(nShow, options.show) : nShow;
            nShow.autoShow && webview.show(nShow.aniShow, nShow.duration, function () {
                triggerPreload(webview);
                trigger(webview, 'pagebeforeshow', false);
            });
            if (webviewCache) {
                webviewCache.afterShowMethodName && webview.evalJS(webviewCache.afterShowMethodName + '(\'' + JSON.stringify(params) + '\')');
            }
            return webview;
        } else { //新窗口
            if (!url) {
                throw new Error('webview[' + id + '] does not exist');
            }

            //显示waiting
            var waitingConfig = $.extend(true, $.config.waiting, options.waiting)
            if (waitingConfig.autoShow) {
                nWaiting = plus.nativeUI.showWaiting(waitingConfig.title, waitingConfig.options);
            }

            //创建页面
            options = $.extend(options, {
                id: id,
                url: url
            });

            webview = $.createWindow(options);

            //显示
            nShow = $.extend(true, $.config.show, options.show);
            if (nShow.autoShow) {
                var showWebview = function () {
                    //关闭等待框
                    if (nWaiting) {
                        nWaiting.close();
                    }
                    //显示页面
                    webview.show(nShow.aniShow, nShow.duration, function () {}, nShow.extras);
                    options.afterShowMethodName && webview.evalJS(options.afterShowMethodName + '(\'' + JSON.stringify(params) + '\')');
                };
                //titleUpdate触发时机早于loaded，更换为titleUpdate后，可以更早的显示webview
                webview.addEventListener(nShow.event, showWebview, false);
                //loaded事件发生后，触发预加载和pagebeforeshow事件
                webview.addEventListener("loaded", function () {
                    triggerPreload(webview);
                    trigger(webview, 'pagebeforeshow', false);
                }, false);
            }
        }
        webview.nShow = nShow
		setTimeout(function() {
			!webview.isVisible() && $.showView(webview)
		}, nShow.delay)
        return webview;
    };

    $.openWindowWithTitle = function (options, titleConfig) {
        options = options || {};
        var url = options.url;
        var id = options.id || url;

        if (!$.os.plus) {
            //TODO 先临时这么处理：手机上顶层跳，PC上parent跳
            if ($.os.ios || $.os.android) {
                window.top.location.href = url;
            } else {
                window.parent.location.href = url;
            }
            return;
        }
        if (!window.plus) {
            return;
        }

        var params = options.params || {};
        var webview = null,
            webviewCache = null,
            nShow, nWaiting;

        if ($.webviews[id]) {
            webviewCache = $.webviews[id];
            //webview真实存在，才能获取
            if (plus.webview.getWebviewById(id)) {
                webview = webviewCache.webview;
            }
        } else if (options.createNew !== true) {
            webview = plus.webview.getWebviewById(id);
        }

        if (webview) { //已缓存
            //每次show都需要传递动画参数；
            //预加载的动画参数优先级：openWindow配置>preloadPages配置>mui默认配置；
            nShow = webviewCache ? webviewCache.show : defaultShow;
            nShow = options.show ? $.extend(nShow, options.show) : nShow;
            nShow.autoShow && webview.show(nShow.aniShow, nShow.duration, function () {
                triggerPreload(webview);
                trigger(webview, 'pagebeforeshow', false);
            });
            if (webviewCache) {
                webviewCache.afterShowMethodName && webview.evalJS(webviewCache.afterShowMethodName + '(\'' + JSON.stringify(params) + '\')');
            }
            return webview;
        } else { //新窗口
            if (!url) {
                throw new Error('webview[' + id + '] does not exist');
            }

            //显示waiting
            var waitingConfig = $.extend(true, $.config.waiting, options.waiting);
            if (waitingConfig.autoShow) {
                nWaiting = plus.nativeUI.showWaiting(waitingConfig.title, waitingConfig.options);
            }

            //创建页面
            options = $.extend(options, {
                id: id,
                url: url
            });

            webview = $.createWindow(options);

            if (titleConfig) { //处理原生头
                $.extend(true, $.config.titleConfig, titleConfig);
                var tid = $.config.titleConfig.id ? $.config.titleConfig.id : id + "_title";
                var view = new plus.nativeObj.View(tid, {
                    top: 0,
                    height: $.config.titleConfig.height,
                    width: "100%",
                    dock: "top",
                    position: "dock"
                });
                view.drawRect($.config.titleConfig.backgroundColor); //绘制背景色
                var _b = parseInt($.config.titleConfig.height) - 1;
                view.drawRect($.config.titleConfig.bottomBorderColor, {
                    top: _b + "px",
                    left: "0px"
                }); //绘制底部边线

                //绘制文字
                if ($.config.titleConfig.title.text) {
                    var _title = $.config.titleConfig.title;
                    view.drawText(_title.text, _title.position, _title.styles);
                }

                //返回图标绘制
                var _back = $.config.titleConfig.back;
                var backClick = null;
                //优先字体

                //其次是图片
                var _backImage = _back.image;
                if (_backImage.base64Data || _backImage.imgSrc) {
                    //TODO 此处需要处理百分比的情况
                    backClick = {
                        left: parseInt(_backImage.position.left),
                        right: parseInt(_backImage.position.left) + parseInt(_backImage.position.width)
                    };
                    var bitmap = new plus.nativeObj.Bitmap(id + "_back");
                    if (_backImage.base64Data) { //优先base64编码字符串
                        bitmap.loadBase64Data(_backImage.base64Data);
                    } else { //其次加载图片文件
                        bitmap.load(_backImage.imgSrc);
                    }
                    view.drawBitmap(bitmap, _backImage.sprite, _backImage.position);
                }

                //处理点击事件
                view.setTouchEventRect({
                    top: "0px",
                    left: "0px",
                    width: "100%",
                    height: "100%"
                });
                view.interceptTouchEvent(true);
                view.addEventListener("click", function (e) {
                    var x = e.clientX;

                    //返回按钮点击
                    if (backClick && x > backClick.left && x < backClick.right) {
                        if (_back.click && $.isFunction(_back.click)) {
                            _back.click();
                        } else {
                            webview.evalJS("window.$&&$.back();");
                        }
                    }
                }, false);
                webview.append(view);

            }

            //显示
            nShow = $.extend(true, $.config.show, options.show);
            if (nShow.autoShow) {
                //titleUpdate触发时机早于loaded，更换为titleUpdate后，可以更早的显示webview
                webview.addEventListener(nShow.event, function () {
                    //关闭等待框
                    if (nWaiting) {
                        nWaiting.close();
                    }
                    //显示页面
                    webview.show(nShow.aniShow, nShow.duration, function () {}, nShow.extras);
                }, false);
            }
        }
        return webview;
    };

    /**
     * 根据配置信息创建一个webview
     * @param {type} options
     * @param {type} isCreate
     * @returns {webview}
     */
    $.createWindow = function (options, isCreate) {
        if (!window.plus) {
            return;
        }
        var id = options.id || options.url;
        var webview;
        if (options.preload) {
            if ($.webviews[id] && $.webviews[id].webview.getURL()) { //已经cache
                webview = $.webviews[id].webview;
            } else { //新增预加载窗口
                //判断是否携带createNew参数，默认为false
                if (options.createNew !== true) {
                    webview = plus.webview.getWebviewById(id);
                }

                //之前没有，那就新创建	
                if (!webview) {
                    webview = plus.webview.create(options.url, id, $.extend(true, $.config.window, options.styles), $.extend({
                        preload: true
                    }, options.extras));
                    if (options.subpages) {
                        $.each(options.subpages, function (index, subpage) {
                            var subpageId = subpage.id || subpage.url;
                            if (subpageId) { //过滤空对象
                                var subWebview = plus.webview.getWebviewById(subpageId);
                                if (!subWebview) { //如果该webview不存在，则创建
                                    subWebview = plus.webview.create(subpage.url, subpageId, $.extend(true, $.config.window, subpage.styles), $.extend({
                                        preload: true
                                    }, subpage.extras));
                                }
                                webview.append(subWebview);
                            }
                        });
                    }
                }
            }

            //TODO 理论上，子webview也应该计算到预加载队列中，但这样就麻烦了，要退必须退整体，否则可能出现问题；
            $.webviews[id] = {
                webview: webview, //目前仅preload的缓存webview
                preload: true,
                show: $.extend(true, $.config.show, options.show),
                afterShowMethodName: options.afterShowMethodName //就不应该用evalJS。应该是通过事件消息通讯
            };
            //索引该预加载窗口
            var preloads = $.data.preloads;
            var index = preloads.indexOf(id);
            if (~index) { //删除已存在的(变相调整插入位置)
                preloads.splice(index, 1);
            }
            preloads.push(id);
            if (preloads.length > $.config.preloadLimit) {
                //先进先出
                var first = $.data.preloads.shift();
                var webviewCache = $.webviews[first];
                if (webviewCache && webviewCache.webview) {
                    //需要将自己打开的所有页面，全部close；
                    //关闭该预加载webview	
                    $.closeAll(webviewCache.webview);
                }
                //删除缓存
                delete $.webviews[first];
            }
        } else {
            if (isCreate !== false) { //直接创建非预加载窗口
                webview = plus.webview.create(options.url, id, $.extend(true, $.config.window, options.styles), options.extras);
                if (options.subpages) {
                    $.each(options.subpages, function (index, subpage) {
                        var subpageId = subpage.id || subpage.url;
                        var subWebview = plus.webview.getWebviewById(subpageId);
                        if (!subWebview) {
                            subWebview = plus.webview.create(subpage.url, subpageId, $.extend(true, $.config.window, subpage.styles), subpage.extras);
                        }
                        webview.append(subWebview);
                    });
                }
            }
        }
        return webview;
    };

    /**
     * 预加载
     */
    $.preload = function (options) {
        //调用预加载函数，不管是否传递preload参数，强制变为true
        if (!options.preload) {
            options.preload = true;
        }
        return $.createWindow(options);
    };

    /**
     *关闭当前webview打开的所有webview；
     */
    $.closeOpened = function (webview) {
        var opened = webview.opened();
        if (opened) {
            for (var i = 0, len = opened.length; i < len; i++) {
                var openedWebview = opened[i];
                var open_open = openedWebview.opened();
                if (open_open && open_open.length > 0) {
                    //关闭打开的webview
                    $.closeOpened(openedWebview);
                    //关闭自己
                    openedWebview.close("none");
                } else {
                    //如果直接孩子节点，就不用关闭了，因为父关闭的时候，会自动关闭子；
                    if (openedWebview.parent() !== webview) {
                        openedWebview.close('none');
                    }
                }
            }
        }
    };
    $.closeAll = function (webview, aniShow) {
        $.closeOpened(webview);
        if (aniShow) {
            webview.close(aniShow);
        } else {
            webview.close();
        }
    };

    /**
     * 批量创建webview
     * @param {type} options
     * @returns {undefined}
     */
    $.createWindows = function (options) {
        $.each(options, function (index, option) {
            //初始化预加载窗口(创建)和非预加载窗口(仅配置，不创建)
            $.createWindow(option, false);
        });
    };
    /**
     * 创建当前页面的子webview
     * @param {type} options
     * @returns {webview}
     */
    $.appendWebview = function (options) {
        if (!window.plus) {
            return;
        }
        var id = options.id || options.url;
        var webview;
        if (!$.webviews[id]) { //保证执行一遍
            //TODO 这里也有隐患，比如某个webview不是作为subpage创建的，而是作为target webview的话；
            if (!plus.webview.getWebviewById(id)) {
                webview = plus.webview.create(options.url, id, options.styles, options.extras);
            }
            //之前的实现方案：子窗口loaded之后再append到父窗口中；
            //问题：部分子窗口loaded事件发生较晚，此时执行父窗口的children方法会返回空，导致父子通讯失败；
            //     比如父页面执行完preload事件后，需触发子页面的preload事件，此时未append的话，就无法触发；
            //修改方式：不再监控loaded事件，直接append
            //by chb@20150521
            // webview.addEventListener('loaded', function() {
            plus.webview.currentWebview().append(webview);
            // });
            $.webviews[id] = options;

        }
        return webview;
    };

    $.showView = function(view) {
        view = view || $.currentWebview
        var opts = $.extend(true, defaultShow, view.nShow)
		view.show.apply(view, [opts.aniShow, opts.duration])
	}

    //全局webviews
    $.webviews = {};
    //预加载窗口索引
    $.data.preloads = [];
    //$.currentWebview
    $.plusReady(function () {
        $.currentWebview = plus.webview.currentWebview();
    });
    window.addEventListener('preload', function () {
        //处理预加载部分
        var webviews = $.config.preloadPages || [];
        $.plusReady(function () {
            $.each(webviews, function (index, webview) {
                $.createWindow($.extend(webview, {
                    preload: true
                }));
            });

        });
    });
    $.supportStatusbarOffset = function () {
        return $.os.plus && $.os.ios && parseFloat($.os.version) >= 7;
    };
})(Zepto);
/**
 * pullRefresh
 * @param {type} $
 * @returns {undefined}
 */
;
(function ($, document) {
    if (!$.os.plus) return
    // 下拉刷新
    $.pullDownRefresh = function (opts, cb) {
        var view = plus.webview.currentWebview()
        if ($.type(opts) === 'function') {
            cb = opts
            opts = $.config.pullrefresh.down
        } else {
            opts = $.extend($.config.pullrefresh.down, opts)
        }
        view.setPullToRefresh(opts, cb)
        opts.auto && begin()

        function begin() {
            setTimeout(function () {
                view.beginPullToRefresh()
            }, 15)
        }

        function end() {
            view.endPullToRefresh()
        }
        return {
            begin: begin,
            end: end
        }
    }

    // 上拉加载
    $.pullUpRefresh = function (opts, cb) {
        if ($.type(opts) === 'function') {
            cb = opts
            opts = $.config.pullrefresh.up
        } else {
            opts = $.extend($.config.pullrefresh.up, opts)
        }
        var lock, isOver, timer, page = 1
        var notDocment = opts.container && opts.container !== document
        var sElem = $(opts.container)
        var moreBtn = $('<div class="z-loading-up">' + opts.tipText + '</div>')
        moreBtn.hide()
        var done = function () {
            lock = true
            moreBtn.show().html(opts.loadingText)
            cb(++page)
        }
        sElem.append(moreBtn)
        sElem.on('scroll', function () {
            clearTimeout(timer)
            timer = setTimeout(function () {
                if (isOver) return
                var _this = sElem,
                    top = _this.scrollTop()
                var height = notDocment ? _this.innerHeight() : window.innerHeight
                var scrollHeight = notDocment ? _this.prop('scrollHeight') : document.documentElement.scrollHeight
                if (scrollHeight - top - height <= 0) {
                    lock || done()
                }
            }, 60)
        })

        return {
            reset: function () {
                page = 1
                lock = null
                isOver = false
                moreBtn.html(opts.tipText)
            },
            disabled: function () {
                lock = true
                moreBtn.addClass('z-disabled')
            },
            done: function (over) {
                lock = null
                if (over) {
                    isOver = over
                    moreBtn.html(opts.nonerText)
                } else {
                    moreBtn.html(opts.tipText)
                }
            }
        }
    }
})(Zepto, document);
// 原生弹框
;
(function ($, window) {
    if (!$.os.plus) return
    /**
     * 警告消息框
     */
    $.alert = function ( /* message, alertCB, title, buttonCapture */ ) {
        var args = getArgs(arguments)
        plus.nativeUI.alert(args['string'][0], args['function'][0], args['string'][2], args['string'][1])
    }

    /**
     * 确认消息框
     */
    $.confirm = function ( /* message, confirmCB, title, buttons */ ) {
        var args = getArgs(arguments)
        plus.nativeUI.confirm(args['string'][0], args['function'][0], args['string'][1], args['array'][0])
    }

    /**
     * 输入对话框
     */
    $.prompt = function ( /* message, promptCB, title, tip, buttons */ ) {
        var args = getArgs(arguments)
        plus.nativeUI.prompt(args['string'][0], args['function'][0], args['string'][1], args['string'][2], args['array'][0])
    }

    /**
     * 自动消失提示框
     */
    $.toast = function (message, options) {
        options = $.extend({
            duration: 'short',
            verticalAlign: 'bottom'
        }, options || {});

        plus.nativeUI.toast(message, options);
    };

    function getArgs(args) {
        var rets = {
            string: [],
            function: [],
            array: []
        }
        $.each(args, function (k, item) {
            var type = $.type(item)
            if (rets[type]) rets[type].push(item)
            else rets[type] = []
        })
        return rets
    }
})(Zepto, window)
;
(function ($) {
    if (!$.os.plus) return
    $.getStorage = function (keyName) {
        var value = plus.storage.getItem(keyName)
        if (value) {
            if ($.likeObject(value)) {
                return $.parseJSON(value)
            } else {
                return eval(value)
            }
        } else {
            return null
        }
    }
    $.setStorage = function (keyName, val) {
        keyName = keyName.toString()
        if ($.isObject(val) || $.isArray(val)) val = JSON.stringify(val)
        else val = val.toString()
        plus.storage.setItem(keyName, val)
        return $.getStorage(keyName)
    }
    $.removeStorage = function (keyName) {
        plus.storage.removeItem(keyName)
    }
    $.clearStorage = function (keyName) {
        plus.storage.clear()
    }
})(Zepto)
;
(function ($) {
    if (!$.os.plus) return
    var fileDoc = '_doc/',
        fileExt = '.txt',
        fileErr = ['文件写入失败: ', '文件创建失败: ', '文件获取失败: ']
        
    $.readFile = function (filename, success, error) {
        plus.io.resolveLocalFileSystemURL(filename, function (entry) {
            entry.file(function (file) {
                var fileReader = new plus.io.FileReader();
                fileReader.readAsText(file, 'utf-8');
                fileReader.onloadend = function (evt) {
                    evt.fileSize = file.size
                    evt.fileName = file.name
                    success && success(evt.target.result)
                }
            });
        }, function (e) {
            if (error) {
                error(e)
            } else {
                $.toast(fileErr[2] + e.message)
            }
        })
    }

    $.writeFile = function (path, data, cover, cb) {
        if ('function' === $.type(cover)) {
            cb = cover
            cover = true
        } else if ($.type(cover) === undef) cover = true
        var paths = path.split('/')
        var filepath = ''
        var filename = ''
        for (var i = 0; i < paths.length; i++) {
            if (i < paths.length - 1) {
                filepath += paths[i] + "/"
            } else {
                filename = paths[i] + fileExt
            }
        }
        plus.io.resolveLocalFileSystemURL(fileDoc + filepath, function (entry) {
            if (entry.isDirectory) {
                entry.getFile(filename, {
                    create: true
                }, function (fileEntry) {
                    fileEntry.createWriter(function (writer) {
                        writer.onerror = function (e) {
                            $.toast(fileErr[0] + e.message)
                        };
                        writer.onwriteend = function () {
                            cb && cb()
                        };
                        writer.seek(cover ? 0 : writer.length);
                        writer.write(data);
                    }, function (e) {
                        $.toast(fileErr[1] + e.message);
                    });
                }, function (e) {
                    $.toast(fileErr[2] + e.message);
                });
            }
        }, function (e) {
            $.toast(fileErr[2] + e.message)
        });
    }

    $.uploadFile = function (files, url, cb, filename) {
        filename = filename || 'pic'
        url = $.ajaxSettings.urlPrefix + url
        var task = plus.uploader.createUpload(url, {
                method: "POST"
            },
            function (t, status) {
                if (status == 200) {
                    t.responseText = t.responseText.trim()
                    cb($.parseJSON(t.responseText));
                } else {
                    console.error("上传失败：" + status);
                }
            }
        );
        $.each(files, function (k, f) {
            var key = filename.replace('[]', '[' + k + ']')
            task.addFile(f, {
                key: key
            });
        })
        task.start();
    }
})(Zepto)
;
(function ($) {
    if (!$.os.plus) return

    $.compressImage = function (images, cb) {
        if ($.type(images) === 'string') {
            images = [{
                src: images
            }]
        }
        var count = images.length
        var ret_imgs = []
        $.each(images, function (k, item) {
            if ($.type(item) === 'string') {
                item = {
                    src: item
                }
            }
            var filename = Math.floor(Math.random() * 1000000)
            var sufarr = item.src.split('.')
            var suf = sufarr[sufarr.length - 1]
            filename = filename + '.' + suf
            var opts = {
                src: item.src,
                dst: '_doc/' + filename,
                width: $.config.image.width || '700px',
                overwrite: true
            }
            if (item.rotate) opts.rotate = item.rotate
            plus.zip.compressImage(opts, function (e) {
                ret_imgs.push(e.target)
                if (ret_imgs.length === count) {
                    cb(ret_imgs)
                }
            }, function (e) {
                console.error(e.message);
                --count
            })
        });
    }

    $.useCamera = function (cb, opts) {
        opts = opts || {}
        opts = $.extend(true, {
            multiple: true,
            filter: 'image'
        }, opts)
        var bts = [{
            title: "现在拍摄"
        }, {
            title: "相册选取"
        }];
        plus.nativeUI.actionSheet({
                title: opts.filter === 'image' ? '选择图片' : '选择视频',
                cancel: "取消",
                buttons: bts
            },
            function (e) {
                if (1 === e.index) {
                    //拍照
                    var cmr = plus.camera.getCamera()
                    cmr[opts.filter === 'image' ? 'captureImage' : 'startVideoCapture'](function (file) {
                        plus.io.resolveLocalFileSystemURL(file, function (entry) {
                            plus.gallery.save(file);
                            cb(entry.toLocalURL())
                        }, function (e) {
                            console.log("读取拍照文件错误：" + e.message);
                        });
                    }, function (e) {
                        console.log(e.message)
                    }, {
                        filename: '_doc/gallery/'
                    })
                }
                if (2 === e.index) {
                    //相册选取
                    plus.gallery.pick(function (e) {
                        if (opts.multiple) {
                            $.each(e.files, function (k, f) {
                                cb(f);
                            })
                        } else {
                            cb(e)
                        }
                    }, function (e) {
                        console.log(e.message)
                    }, {
                        filter: opts.filter,
                        multiple: opts.multiple
                    });
                }
            }
        );
    }
})(Zepto)
// 优化模板引擎
;
(function ($, window) {
    if (!$.os.plus || !template) return
    var tempFiles = {}
    var tempLoadings = {}
    $.template = function (filename, data, cb) {
        if (!filename) {
            console.error('请先指定模板文件')
            return
        }
        var tempfile = tempFiles[filename]
        var data = null
        if (tempfile) {
            data = render()
            cb && cb(data)
        } else {
            if (!cb) {
                console.error('首次加载模板文件必须使用回调')
                return
            }
            if (tempLoadings[filename]) {
                $.toast('模板文件获取中，请稍后重试')
                return
            }
            $.loadTemplate(filename, function (html) {
                tempfile = tempFiles[filename] = html
                data = render()
                cb(data)
            })
        }
        return data

        function render() {
            return template.render(tempfile, data)
        }
    }

    $.loadTemplate = function (filename, cb) {
        if(tempFiles[filename]) return
        tempLoadings[filename] = true
        $.readFile($.config.template.path + filename + '.html', function (html) {
            delete tempLoadings[filename]
            tempFiles[filename] = html
            cb && cb(html)
        }, function (e) {
            delete tempLoadings[filename]
            $.toast('模板文件获取失败：' + e.message)
        })
    }

})(Zepto, window)
;
(function ($) {
    $.date = function (format, time) {
        var nowDt = new Date()
        var dt = nowDt
        var settings = $.config.date
        var defaultFormat = settings.format
        if ($.type(format) !== 'string') {
            time = format
            format = defaultFormat
        }
        if ($.type(time) !== 'undefined') {
            dt = new Date(time)
        }
        if (format === defaultFormat) {
            return convert()
        } else {
            return layout()
        }

        function layout() {
            var od = {
                y: dt.getFullYear(),
                M: dt.getMonth(),
                d: dt.getDate(),
                h: dt.getHours(),
                m: dt.getMinutes(),
                s: dt.getSeconds(),
                ms: dt.getMilliseconds(),
                z: dt.getTimezoneOffset(),
                wd: dt.getDay(),
                w: ["\u65E5", settings.numbers[1], "\u4E8C", settings.numbers[3], settings.numbers[4], settings.numbers[5], settings.numbers[6]]
            }
            var h12 = od.h > 12 ? od.h - 12 : od.h
            var o = {
                "y+": od.y,
                "M+": od.M + 1,
                "d+": od.d,
                "H+": od.h,
                "h+": h12 == 0 ? 12 : h12,
                "m+": od.m,
                "s+": od.s,
                "ms": od.ms,
                "a+": od.h > 12 || od.h == 0 ? "PM" : "AM",
                "w+": od.wd,
                "W+": od.w[od.wd],
                "q+": Math.floor((od.m + 3) / 3),
                "z+": od.z
            }
            if (format === defaultFormat && od.y !== nowDt.getFullYear()) {
                format = 'yyyy年' + format
            }
            for (var i in o) {
                if (new RegExp("(" + i + ")").test(format)) format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[i] : ("00" + o[i]).substr(("" + o[i]).length))
            }
            return format
        }

        function convert() {
            var distanceMillis = nowDt.getTime() - dt.getTime()
            if (Math.abs(distanceMillis) > settings.coverTime) return layout()
            var suffix = settings.prefixAgo
            var seconds = Math.abs(distanceMillis) / 1000
            var minutes = seconds / 60
            var hours = minutes / 60
            var days = hours / 24
            var years = days / 365
            var words = seconds < 45 && substitute(settings.seconds, Math.round(seconds)) || seconds < 90 && substitute(settings.minute, 1) || minutes < 45 && substitute(settings.minutes, Math.round(minutes)) || minutes < 90 && substitute(settings.hour, 1) || hours < 24 && substitute(settings.hours, Math.round(hours)) || hours < 42 && substitute(settings.day, 1) || days < 30 && substitute(settings.days, Math.round(days)) || days < 45 && substitute(settings.month, 1) || days < 365 && substitute(settings.months, Math.round(days / 30)) || years < 1.5 && substitute(settings.year, 1) || substitute(settings.years, Math.round(years));
            if (distanceMillis < 0) {
                suffix = settings.suffixAgo
            }
            return [words, suffix].join(settings.wordSeparator);

            function substitute(string, number) {
                var value = (settings.numbers && settings.numbers[number]) || number
                return string.replace(/%d/i, value)
            }
        }
    }
})(Zepto)
$(function () {
    var options = $.config;
    if ($.os.plus) {
        //设置ios顶部状态栏颜色；
        if ($.os.ios && $.config.statusBarBackground) {
            plus.navigator.setStatusBarBackground($.config.statusBarBackground);
        }
        if ($.os.android && parseFloat($.os.version) < 4.4) {
            //解决Android平台4.4版本以下，resume后，父窗体标题延迟渲染的问题；
            if (plus.webview.currentWebview().parent() == null) {
                document.addEventListener("resume", function () {
                    var body = document.body;
                    body.style.display = 'none';
                    setTimeout(function () {
                        body.style.display = '';
                    }, 10);
                });
            }
        }

        if ($.config.keyEventBind.backbutton) {
            plus.key.addEventListener('backbutton', function () {
                $.back()
            }, false);
        }
        if ($.config.keyEventBind.menubutton) {
            plus.key.addEventListener('menubutton', function () {
                if ($.menu) $.menu()
            }, false);
        }

        //沉浸状态栏
        if (!plus.navigator.isImmersedStatusbar()) {
            $('body').addClass('z-immersed')
        }
    }
    $('body').on('tap', '.z-action-back', function () {
        $.back()
    })
});