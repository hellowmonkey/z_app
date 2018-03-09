$(function () {
    var activeClass = 'z-active'
    var options = $.config;
    if ($.os.plus) {
        //设置ios顶部状态栏颜色；
        if ($.os.ios && $.config.statusBarBackground) {
            plus.navigator.setStatusBarBackground($.config.statusBarBackground);
        }
        //解决Android平台4.4版本以下，resume后，父窗体标题延迟渲染的问题；
        if ($.os.android && parseFloat($.os.version) < 4.4 && $.currentWebview.parent() == null) {
            document.addEventListener("resume", function () {
                var body = document.body;
                body.style.display = 'none';
                setTimeout(function () {
                    body.style.display = '';
                }, 10);
            });
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
        $('body').on('tap', '.z-action-album', function (event) {
            event.stopPropagation()
            var self = this
            var group = $(this).data('album-group')
            var images = []
            var current = 0
            group = group === null ? '' : '[data-album-group="' + group + '"]'
            $('.z-action-album' + group).each(function (k) {
                var _this = $(this)
                var src = _this.data('album-src') || this.src || _this.backgroundImage()
                if (self === this) current = k
                src && images.push(src)
            })
            plus.nativeUI.previewImage(images, {
                current: current,
                indicator: 'number'
            })
        })

        // 打开新页面
        $('body').on('click', 'a,.z-action-link', function (event) {
            event.preventDefault()
            var _this = $(this)
            var href = _this.attr('href') || _this.data('link-target')
            var opts = _this.data('link-opts')
            var suf = '.html'
            if (!href) return false
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
            if (opts) {
                opts = JSON.parse(opts)
                options = $.extend(options, opts)
            }
            $.openWindow(options)
            return false
        })
    }

    // 返回
    $('body').on('tap', '.z-action-back', function () {
        $.back()
    })

    // disabled阻止
    $('body').on('tap', '.z-disabled,:disabled', function (event) {
        event.stopPropagation()
        event.preventDefault()
        return false
    })
    $('.z-disabled,:disabled').on('tap', function (event) {
        event.stopPropagation()
        event.preventDefault()
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

    // 水波纹
    var ripples = $.config.ripples.join(',')
    $(document).on('tap', ripples, function (event) {
        event.stopPropagation()
        var _this = $(this)
        var size = Math.max(this.offsetWidth, this.offsetHeight)
        var color = (_this.is('[class*="z-color-"]') || _this.hasClass('z-ripple-light')) ? 'rgba(255,255,255,0)' : 'rgba(0,0,0,0)'
        var offset = _this.offset()
        var top = event.detail.touch.y1 - offset.top
        var left = event.detail.touch.x1 - offset.left
        _this.addClass('z-ripple').append('<div class="z-ripple-bg" style="top:' + top +
            'px;left:' + left + 'px"></div>')
        setTimeout(function () {
            _this.find('.z-ripple-bg').css({
                boxShadow: '0 0 0 ' + size + 'px ' + color,
            })
        }, 10)
        setTimeout(function () {
            _this.removeClass('z-ripple').find('.z-ripple-bg').remove()
        }, 400)
    })

    // 关闭alert
    $('body').on('tap', '.z-alert .z-close', function () {
        var box = $(this).closest('.z-alert')
        box.hide(300, function () {
            box.remove()
        })
    })

    // 数字输入框
    $('.z-action-numberbox').numberbox()

    // 下拉组件
    $('body').on('tap', '.z-action-dropdown', function (event) {
        var _this = $(this)
        var target = _this.data('dropdown-target')
        if (target) target = $(target)
        else target = _this.find('.z-dropdown')
        if (!target.length) return this
        var position = _this.position()
        var top = position.top + _this.height() + 2
        var left = position.left - 160 + _this.width() / 2 + 16
        target.modal({
            top: top + 'px',
            left: left + 'px'
        }, function () {
            target.closeModal()
        })
    })

    // 轮播
    $('.z-action-slider').each(function(){
        $(this).slider()
    })

    // 图片懒加载
    $('.z-action-lazyimg').lazyimg()

    // 透明导航
    $('.z-action-transparent').transparent()

});