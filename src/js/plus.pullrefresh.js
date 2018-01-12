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
        var done = function () {
            lock = true
            moreBtn.html(opts.loadingText)
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