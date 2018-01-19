;
(function ($) {
    var activeClass = 'z-active'
    var switchClass = 'z-switch'
    $.fn.switch = function (type) {
        this.each(function () {
            var _this = $(this)
            if (!_this.hasClass(switchClass)) return this
            if (type === 'show' && _this.hasClass(activeClass)) return this
            if (type === 'hide' && !_this.hasClass(activeClass)) return this
            var handle = _this.find('.z-switch-handle')
            if (_this.hasClass(activeClass)) {
                _this.removeClass(activeClass)
                handle.css({
                    'transform': '',
                    '-webkit-transform': '' 
                })
                _this.trigger('hideed', _this)
            } else {
                var w = _this.width() - handle.width()
                _this.addClass(activeClass)
                handle.css({
                    'transform': 'translate(' + w + 'px, 0px)',
                    '-webkit-transform': 'translate(' + w + 'px, 0px)'
                })
                _this.trigger('showed', _this)
            }
        })
        return this
    }
})(Zepto)