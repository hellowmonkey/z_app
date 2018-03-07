;
(function ($) {
    var activeClass = 'z-active'
    var switchClass = 'z-switch'
    var switchEl = '.' + switchClass
    var disabledClass = 'z-disabled'
    var startX, moveX
    $.fn.switch = function (type) {
        if (!this.length) return this
        return this.each(function () {
            var _this = $(this)
            if (!_this.hasClass(switchClass)) return this
            if (type === 'show' && _this.hasClass(activeClass)) return this
            if (type === 'hide' && !_this.hasClass(activeClass)) return this
            var handle = _this.find('.z-switch-handle')
            var transName = $.fx.cssPrefix + 'transform'
            var transOpts = {}
            if (_this.hasClass(activeClass)) {
                _this.removeClass(activeClass)
                transOpts[transName] = ''
                handle.css(transOpts)
                _this.trigger('hideed', _this)
            } else {
                var w = _this.width() - handle.width()
                _this.addClass(activeClass)
                transOpts[transName] = 'translate(' + w + 'px, 0px)'
                handle.css(transOpts)
                _this.trigger('showed', _this)
            }
        })
    }

    $(function () {
        var eventMap = $.eventMap
        $('body').on('tap', switchEl, function (event) {
            event.stopPropagation()
            var _this = $(this)
            if (_this.hasClass(disabledClass)) return
            _this.switch()
        })

        $('body').on(eventMap.down, switchEl, function (event) {
            startHandler(event, this)
        })
        $('body').on(eventMap.move, switchEl, function (event) {
            moveHandler(event, this)
        })
        $('body').on(eventMap.up, switchEl, function (event) {
            endHandler(event, this)
        })
        $('body').on(eventMap.cancel, switchEl, function (event) {
            endHandler(event, this)
        })
    })

    function startHandler(e, ele) {
        if ($(ele).hasClass(disabledClass)) return
        startX = getX(e)
    }

    function moveHandler(e, ele) {
        var _this = $(ele)
        moveX = getX(e) - startX
        if (_this.hasClass(disabledClass) || !startX || !moveX || Math.abs(moveX) < _this.width() * 0.2) return
        _this.switch(moveX > 0 ? 'show' : 'hide')
    }

    function endHandler(e, ele) {
        startX = moveX = null
    }

    function getX(e) {
        return e.targetTouches ? e.targetTouches[0].pageX : e.pageX
    }


})(Zepto)