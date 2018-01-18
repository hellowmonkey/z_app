;
(function ($) {
    var zShade = null,
        zShades = 0,
        zIndex = 99,
        transTime = $.config.transTime,
        view,
        launchWebview,
        subNViews

    $.zIndex = function (z) {
        z = z || 1
        zIndex += z
        return zIndex
    }

    /**
     * 创建遮罩
     * @param  {fn} createCb 成功后的回调
     * @param  {fn} closeCb  关闭时的回调
     * @param  {str} opacity  透明度
     */
    $.createShade = function (createCb, closeCb, opacity) {
        if (!zShade) {
            zShade = $('<div class="z-shade" style="z-index:' + $.zIndex() + ';' + function () {
                return $.type(opacity) === 'undefined' ? 'opacity:' + opacity : ''
            }() + '"></div>')
            $('body').addClass('z-overflow')
            $('body').append(zShade)
            zShade.fadeIn(transTime, createCb && createCb)
        } else {
            createCb && createCb()
        }
        ++zShades
        zShade.on('tap', function () {
            closeCb && closeCb() && $.closeShade()
        })
        return zShade
    }
    /**
     * 关闭遮罩层
     * @param  {num}   time 过渡时间
     * @param  {fn} cb   关闭后的回调
     * @param  {bool}   rm   是否强制关闭
     */
    $.closeShade = function (time, cb, rm) {
        if (!zShade) return false
        zShade.trigger('hideed', zShades)
        if (rm) zShades = 0
            --zShades
        if (zShades <= 0) {
            zShades = 0
            if ($.type(time) === 'function') {
                cb = time
                time = transTime
            }
            time = time || transTime
            zShade.fadeOut(time, function () {
                zShade.remove()
                $('body').removeClass('z-overflow')
                zShade = null
                cb && cb()
            })
        }
    }
    // 模态框
    $.modal = function ( /* content, title, btns, cb */ ) {
        var args = $.getArgs(arguments),
            content = args['string'][0],
            title = args['string'][1],
            btns = args['array'][0] || ['确认'],
            cb = args['function'][0]
        var html = '<div class="z-modal">' + function () {
            return title ? '<div class="z-modal-header">' + title + '</div>' : ''
        }() + '<div class="z-modal-content z-border">' + content + '</div><div class="z-modal-footer">' + function () {
            var h = ''
            $.each(btns, function (k, item) {
                h += '<div class="z-modal-btn z-action-ripple">' + item + '</div>'
            });
            return h
        }() + '</div></div>'
        html = $(html)
        $.createShade(function () {
            html.css('zIndex', $.zIndex())
            $('body').append(html)
            html.show(transTime).css('marginTop', -(html.height() / 1.7) + 'px')
            html.find('.z-modal-btn').tap(function () {
                if (cb && !cb($(this).index())) {
                    $.closeModal(html)
                }
            })
        })
        // if ($.os.plus) viewShade(0)
        return html
    }

    function viewShade(opacity) {
        view = view || $.currentWebview
        launchWebview = launchWebview || plus.webview.getLaunchWebview()
        subNViews = subNViews || launchWebview.getStyle().subNViews
        if (subNViews && subNViews.length) {
            $.each(subNViews, function (k, item) {
                if (item.page_id === view.id) {
                    toggle(opacity)
                    return false
                }
            })
        }

        function toggle(opacity) {
            var opts = []
            $.each(subNViews, function (k, item) {
                item.styles.opacity = opacity
                opts[k] = item
            })
            launchWebview.updateSubNViews(opts)
        }
    }


    // 关闭模态框
    $.closeModal = function (box) {
        if (!box || !box.length) return false
        box.fadeOut(transTime, function () {
            box.remove()
            $.closeShade()
            // viewShade(1)
        })
    }

    if ($.beforeback) {
        $.beforeback(function () {
            if ($.closeModal($('.z-modal')) !== false) return false
        })
    }

})(Zepto)