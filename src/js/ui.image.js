/* 图片相关 */ ;
(function ($, window) {
    var scrollEle = $(window)
    var winHeight = scrollEle.height()

    // 背景图
    $.fn.backgroundImage = function (src) {
        if (src) {
            return this.css('backgroundImage', 'url(' + src + ')')
        } else {
            return this.css('backgroundImage').replace(/url\([\'\"]?(.*?)[\'\"]?\)/g, "$1")
        }
    }

    // 加载图片
    $.loadImg = function (url, cb, error) {
        var img = new Image()
        img.src = url
        if (img.complete) {
            cb(img)
            return img
        }
        img.onload = function () {
            img.onload = null
            cb(img)
        }
        img.onerror = function (e) {
            img.onerror = null
            error && error(e)
        }
        return img
    }

    // 图片懒加载
    $.fn.lazyimg = function (cb) {
        if (!this.length) return this
        var haveScroll, timer, _this = this
        render()
        $(window).on('scroll', function () {
            clearTimeout(timer)
            timer = setTimeout(function () {
                render()
            }, 60)
        })

        return this

        function show(item) {
            var src = item.data('lazyimg-src')
            if (src) {
                $.loadImg(src, function () {
                    var ele = item[0]
                    if (ele.tagName === 'img') {
                        ele.src = src
                    } else {
                        item.backgroundImage(src)
                    }
                    item.removeAttr('data-lazyimg-src')
                    cb && cb(item)
                    item.trigger('showed', item)
                })
            }
        }

        function render(othis) {
            var end = scrollEle.scrollTop() + winHeight
            _this.each(function () {
                var item = $(this)
                var top = item.offset().top
                if (top <= end) {
                    show(item)
                }
            })
        }
    }
})(Zepto, window)