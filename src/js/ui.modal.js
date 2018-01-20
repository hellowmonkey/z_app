;
(function ($) {
    var zShade = null,
        zShades = 0,
        zIndex = 99,
        transTime = $.config.transTime,
        view,
        launchWebview,
        subNViews,
        objShade

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
            zShade.show()
        }
        ++zShades
        if ($.os.plus) viewShade('show')
        createCb && createCb()
        zShade.trigger('showed', zShades)
        zShade.on('tap', function () {
            closeCb && closeCb() && $.closeShade()
        })
        return zShade
    }
    /**
     * 关闭遮罩层
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
            zShade.remove()
            zShade = null
            $('body').removeClass('z-overflow')
            if ($.os.plus) viewShade('hide')
            cb && cb()
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
            html.show(transTime).css('marginTop', -(html.height() / 3) + 'px').trigger('showed', html)
            html.find('.z-modal-btn').tap(function () {
                if (cb && !cb($(this).index())) {
                    $.closeModal(html)
                }
            })
        })
        return html
    }

    // 关闭模态框
    $.closeModal = function (box) {
        if (!box || !box.length) return false
        box.fadeOut(transTime, function () {
            $.closeShade()
            box.remove().trigger('hideed', box)
        })
    }

    function viewShade(type) {
        view = view || $.currentWebview
        type = type || 'show'
        launchWebview = launchWebview || plus.webview.getLaunchWebview()
        subNViews = subNViews || launchWebview.getStyle().subNViews
        if (subNViews && subNViews.length) {
            $.each(subNViews, function (k, item) {
                if (view.id === plus.runtime.appid || view.id === item.page_id) {
                    toggle()
                    return false
                }
            })
        }

        function toggle() {
            if(!objShade) {
                objShade = new plus.nativeObj.View('objShade', {
                    backgroundColor: 'rgba(0,0,0,.4)',
                    left: '0px',
                    bottom: '0px',
                    width: '100%',
                    height: '51px'
                })
            }
            objShade[type]()
        }
    }

    if ($.beforeback) {
        $.beforeback(function () {
            if ($.closeModal($('.z-modal')) !== false) return false
        })
    }

})(Zepto)