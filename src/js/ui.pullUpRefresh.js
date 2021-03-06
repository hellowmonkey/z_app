// 上拉加载
;
(function ($, document, window) {
    $.pullUpRefresh = function (opts, cb) {
        if ($.type(opts) === 'function') {
            cb = opts
            opts = $.config.pullrefresh.up
        } else {
            opts = $.extend($.config.pullrefresh.up, opts || {})
        }
        var lock, isOver, timer, page = 1
        var sElem = $(opts.container)
        var moreBtn = $('<div class="z-loading-up">' + opts.tipText + '</div>')
        moreBtn.hide()
        var done = function () {
            lock = true
            moreBtn.show().html(opts.loadingText)
            cb && cb(++page)
        }
        sElem.append(moreBtn)
        if ($.os.plus) {
            document.addEventListener("plusscrollbottom", function () {
                if (isOver) return
                lock || done()
            }, false);
        } else {
            $(window).on('scroll', function () {
                clearTimeout(timer)
                timer = setTimeout(function () {
                    if (isOver) return
                    var _this = $(window),
                        scrollTop = _this.scrollTop(),
                        scrollHeight = $(document).height(),
                        windowHeight = _this.height()
                    if (scrollTop + windowHeight >= scrollHeight) {
                        lock || done()
                    }
                }, 60)
            })
        }

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
})(Zepto, document, window);