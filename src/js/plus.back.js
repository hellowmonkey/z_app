/**
 * back
 * @param {type} $
 * @param {type} window
 * @returns {undefined}
 */
;
(function ($, window) {
    // if (!$.os.plus) return
    //首次按下back按键的时间
    var back__first = null;

    $.beforeback = function (cb) {
        $.config.beforeback.push(cb)
    }

    $.back = function () {
        var backs = $.config.beforeback
        for (var i = 0; i < backs.length; i++) {
            if (backs[i]() === false) return
        }
        if (!$.os.plus) {
            window.history.go(-1)
            return false;
        }
        var wobj = plus.webview.currentWebview();
        var parent = wobj.parent();
        if (parent) {
            parent.evalJS('$&&$.back();');
        } else {
            wobj.canBack(function (e) {
                //by chb 暂时注释，在碰到类似popover之类的锚点的时候，需多次点击才能返回；
                if (e.canBack) { //webview history back
                    window.history.back();
                } else { //webview close or hide
                    //fixed by fxy 此处不应该用opener判断，因为用户有可能自己close掉当前窗口的opener。这样的话。opener就为空了，导致不能执行close
                    if (wobj.id === plus.runtime.appid) { //首页
                        //首页不存在opener的情况下，后退实际上应该是退出应用；
                        //首次按键，提示‘再按一次退出应用’
                        if (!back__first) {
                            back__first = new Date().getTime();
                            $.toast($.config.backToast || '再按一次退出应用');
                            setTimeout(function () {
                                back__first = null;
                            }, 2000);
                        } else {
                            if (new Date().getTime() - back__first < 2000) {
                                plus.runtime.quit();
                            }
                        }
                    } else { //其他页面，
                        if (wobj.preload) {
                            wobj.hide("auto");
                        } else {
                            //关闭页面时，需要将其打开的所有子页面全部关闭；
                            $.closeAll(wobj);
                        }
                    }
                }
            });
        }
    };
})(Zepto, window);