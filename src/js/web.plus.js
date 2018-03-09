/* plus的web处理 */ ;
(function ($, window) {
    if ($.os.plus) return
    var noop = $.noop

    // plus.back
    $.beforeback = noop;
    $.back = function () {
        window.history.go(-1)
    }

    // plus.dialog
    $.alert = window.alert;
    $.confirm = window.confirm;
    $.prompt = window.prompt;
    $.actionSheet = noop;
    $.toast = console.log;

    // plus.file
    $.readFile = function (filename, success, error) {
        var suf = '_www'
        if (filename.indexOf(suf) === -1) return
        filename = filename.replace(suf, $.config.host)
        $.get(filename, 'html', function (data) {
            success(data)
        }, error)
    }
    $.writeFile = noop;
    $.uploadFile = noop;

    // plus.image
    $.compressImage = noop;
    $.useCamera = noop;

    // plus.pullDownRefresh
    $.pullDownRefresh = function (opts, cb) {
        if ($.type(opts) === 'function') {
            cb = opts
            opts = $.config.pullrefresh.down
        } else {
            opts = $.extend($.config.pullrefresh.down, opts || {})
        }
        if (opts.auto) cb()
        return {
            begin: cb,
            end: noop
        }
    }

    // plus.webview
    $.fire = $.receive = $.createWindow = $.preload = $.closeOpened = $.closeAll = $.createWindows = $.appendWebview = $.showView = $.supportStatusbarOffset = noop;
    $.openWindow = function (url) {
        location.href = url
    }
    $.openWindowWithTitle = function (options) {
        location.href = options.url
    }
    $.currentWebview = {}

    window.plus = null

})(Zepto, window)