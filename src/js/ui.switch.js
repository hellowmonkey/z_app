;
(function ($) {
    var activeClass = 'z-active'
    var switchClass = 'z-switch'
    $.fn.switch = function (type) {
        if (!this.length) return this
        this.each(function () {
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
        return this
    }
})(Zepto)