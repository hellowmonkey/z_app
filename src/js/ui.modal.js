;
(function ($) {
    var zShade = null,
        zShades = 0,
        zIndex = 99,
        transTime = $.config.transTime,
        view,
        launchWebview,
        subNViews,
        objShade,
        objClick,
        animCls = $.config.animCls,
        anims = $.config.anims


    $.zIndex = function (z) {
        z = z || 1
        zIndex += z
        return zIndex
    }

    /**
     * 创建遮罩
     * @param  {fn} closeCb  关闭时的回调
     * @param  {str} opacity  透明度
     */
    $.createShade = function (closeCb, opacity) {
        if (!zShade) {
            zShade = $('<div class="z-shade" style="z-index:' + $.zIndex() + ';' + function () {
                return $.type(opacity) === 'undefined' ? 'opacity:' + opacity : ''
            }() + '"></div>')
            $('body').addClass('z-overflow')
            $('body').append(zShade)
        }
        zShade.show()
            ++zShades
        if ($.os.plus) {
            objClick = closeCb
            viewShade('show')
        }
        zShade.trigger('showed', zShades)
        zShade.on('touchstart', function () {
            closeCb && closeCb() && $.closeShade()
        })
        return zShade
    }
    /**
     * 关闭遮罩层
     * @param  {bool}   rm   是否强制关闭
     */
    $.closeShade = function (rm) {
        if (!zShade) return false
        if (rm) zShades = 0
        --zShades
        if (zShades <= 0) {
            zShade.trigger('hideed', zShades)
            zShades = 0
            zShade.remove()
            zShade = null
            $('body').removeClass('z-overflow')
            if ($.os.plus) viewShade('hide')
        }
    }
    // 模态框
    $.modal = function ( /* content, title, btns, cb */ ) {
        var args = $.orderArgs(arguments),
            content = args['string'][0],
            title = args['string'][1],
            btns = args['array'][0] || ['确认'],
            cb = args['function'][0]
        var animName = getAnim()
        var html = '<div class="z-modal ' + animCls + '">' + function () {
            return title ? '<div class="z-modal-header">' + title + '</div>' : ''
        }() + '<div class="z-modal-content z-border">' + content + '</div><div class="z-modal-footer">' + function () {
            var h = ''
            $.each(btns, function (k, item) {
                h += '<div class="z-modal-btn z-action-ripple">' + item + '</div>'
            });
            return h
        }() + '</div></div>'
        html = $(html)
        $.createShade()
        html.css('zIndex', $.zIndex())
        $('body').append(html)
        html.css('display', 'block').css('marginTop', -(html.height() / 2) + 'px').addClass(animName).trigger('showed', html)
        html.find('.z-modal-btn').tap(function () {
            if (cb && !cb($(this).index())) {
                $.closeModal(html)
            }
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

    // 原型上的modal
    $.fn.modal = function (opts, shadeCb) {
        $.createShade(shadeCb)
        opts = $.orderOpts(this, {
            'zIndex': $.zIndex(),
            'display': 'block',
            'top': '30%'
        }, opts, 'modal')
        return this.css(opts).trigger('showed')
    }

    // 原型上的关闭modal
    $.fn.closeModal = function () {
        return this.fadeOut(transTime, function () {
            $.closeShade()
        }).trigger('hideed')
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
            if (!objShade) {
                objShade = new plus.nativeObj.View('objShade', {
                    backgroundColor: 'rgba(0,0,0,.4)',
                    left: '0px',
                    bottom: '0px',
                    width: '100%',
                    height: '51px'
                })
                objShade.addEventListener('click', function () {
                    objClick && objClick()
                }, false)
            }
            objShade[type]()
        }
    }

    function getAnim() {
        return anims[Math.floor(Math.random() * anims.length)]
    }

    if ($.beforeback) {
        $.beforeback(function () {
            if ($.closeModal($('.z-modal')) !== false) return false
        })
    }

})(Zepto)