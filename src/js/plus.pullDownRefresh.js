// 下拉刷新
;
(function ($, document, window) {
    if (!$.os.plus) return
    $.pullDownRefresh = function (opts, cb) {
        var view = plus.webview.currentWebview()
        if ($.type(opts) === 'function') {
            cb = opts
            opts = $.config.pullrefresh.down
        } else {
            opts = $.extend($.config.pullrefresh.down, opts)
        }
        view.setPullToRefresh(opts, cb)
        if (opts.auto) {
            setTimeout(function () {
                begin()
            }, 15)
        }

        function begin() {
            view.beginPullToRefresh()
        }

        function end() {
            view.endPullToRefresh()
        }
        return {
            begin: begin,
            end: end
        }
    }

})(Zepto, document, window);