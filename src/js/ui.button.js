// 按钮loading
;
(function ($) {
    var disabled = 'z-disabled'
    var newText = 'button-text'
    var oldText = 'button-oldtext'
    var loading = $.config.buttonLoading
    $.fn.button = function (type, loadingText) {
        if (!this.length) return this
        this.each(function () {
            var _this = $(this)
            var text = ''
            if (type === 'loading' && _this.hasClass(disabled)) return this
            if (type === 'reset' && !_this.hasClass(disabled)) return this
            if (_this.hasClass(disabled)) {
                text = _this.data(oldText)
                _this.removeClass(disabled).removeData(oldText).removeAttr('disabled').html(text)
            } else {
                text = loadingText || _this.data(newText) || ''
                text = loading + text
                _this.addClass(disabled).data(oldText, _this.html()).attr('disabled', 'disabled').html(text)
            }
        })
        return this
    }
})(Zepto)