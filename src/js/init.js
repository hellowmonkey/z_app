$(function () {
    var activeClass = 'z-active'
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

        // 相册
        $('body').on('tap', '.mui-action-album', function (event) {
            event.stopPropagation()
            var self = this
            var group = $(this).data('album-group')
            var images = []
            var current = 0
            group = group === null ? '' : '[data-album-group="' + group + '"]'
            $('.mui-action-album' + group).each(function (k) {
                var _this = $(this)
                var src = _this.data('album-src') || this.src || _this.getBackgroundUrl()
                if (self === this) current = k
                images.push(src)
            })
            plus.nativeUI.previewImage(images, {
                current: current,
                indicator: 'number'
            })
        })
    }
    // 返回
    $('body').on('tap', '.z-action-back', function () {
        $.back()
    })

    // 打开新页面
    $('body').on('click', 'a,.z-action-link', function (event) {
        event.stopPropagation()
        event.preventDefault()
        var _this = $(this)
        var href = _this.attr('href') || _this.data('link-href')
        var opts = _this.data('link-opts')
        var suf = '.html'
        var pathIndex = href.indexOf(suf)
        if (pathIndex === -1) return false
        var filename = href.substr(0, pathIndex)
        var ids = filename.split('/')
        var id = ids[ids.length - 1]
        var url = filename + suf
        var options = {
            url: url,
            id: id,
            extras: $.parseUrlQuery(href)
        }
        if (opts) options = $.extend(options, opts)
        $.openWindow(options)
        return false
    })

    // 输入框
    $('body').on('focus', '.z-input-item .z-input', function () {
        var _this = $(this)
        var box = _this.closest('.z-input-item')
        var btn = box.find('.z-input-clear-btn')
        if (_this.hasClass('z-input-clear') && !btn.length) {
            box.prepend('<span class="z-input-clear-btn">&times;</span>')
        }
        box.addClass(activeClass)
    })
    $('body').on('blur', '.z-input-item .z-input', function () {
        $(this).closest('.z-input-item').removeClass(activeClass)
    })
    $('body').on('tap', '.z-input-clear-btn', function (event) {
        event.stopPropagation()
        $(this).closest('.z-input-item').find('.z-input').val('')
    })

    // switch
    $('body').on('tap', '.z-switch', function (event) {
        event.stopPropagation()
        $(this).switch()
    })

    // 水波纹
    var ripples = $.config.ripples.join(',')
    $(document).on('tap', ripples, function (event) {
        event.stopPropagation()
        var _this = $(this)
        var size = Math.max(this.offsetWidth, this.offsetHeight)
        var color = (_this.is('[class*="z-color-"]') || _this.hasClass('z-ripple-light')) ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.3)'
        var offset = _this.offset()
        var top = event._args.touch.y1 - offset.top
        var left = event._args.touch.x1 - offset.left
        _this.removeClass('z-ripple').find('.z-ripple-bg').remove()
        _this.addClass('z-ripple').append('<div class="z-ripple-bg" style="top:' + top +
            'px;left:' + left + 'px"></div>')
        setTimeout(function () {
            _this.find('.z-ripple-bg').css({
                boxShadow: '0 0 0 ' + size + 'px ' + color,
                borderRadius: 0,
                opacity: 0,
                backgroundColor: color
            })
        }, 10)
        setTimeout(function () {
            _this.removeClass('z-ripple').find('.z-ripple-bg').remove()
        }, 350)
    })

    $('body').on('tap', '.z-disabled,:disabled', function(event){
        event.stopPropagation()
        event.preventDefault()
        return false
    })
    $('.z-disabled,:disabled').on('tap', function(event){
        event.stopPropagation()
        event.preventDefault()
        return false
    })
});