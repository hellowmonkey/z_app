// 原生弹框
;
(function ($, window) {
    if (!$.os.plus) {
        $.alert = window.alert;
        $.confirm = window.confirm;
        $.prompt = window.prompt;
        $.actionSheet = $.noop;
        $.toast = console.log;
        return
    }
    /**
     * 警告消息框
     */
    $.alert = function ( /* message, alertCB, title, buttonCapture */ ) {
        var args = $.orderArgs(arguments)
        plus.nativeUI.alert(args['string'][0], args['function'][0], args['string'][2], args['string'][1])
    }

    /**
     * 确认消息框
     */
    $.confirm = function ( /* message, confirmCB, title, buttons */ ) {
        var args = $.orderArgs(arguments)
        plus.nativeUI.confirm(args['string'][0], args['function'][0], args['string'][1], args['array'][0])
    }

    /**
     * 输入对话框
     */
    $.prompt = function ( /* message, promptCB, title, tip, buttons */ ) {
        var args = $.orderArgs(arguments)
        plus.nativeUI.prompt(args['string'][0], args['function'][0], args['string'][1], args['string'][2], args['array'][0])
    }

    /* 选择按钮框 */
    $.actionSheet = function ( /* opts, cb */ ) {
        var args = $.orderArgs(arguments)
        var objs = args['object'][0]
        var opts = {}
        opts.title = objs ? objs.title : args['string'][0]
        opts.cancel = objs ? objs.cancel : args['string'][1]
        opts.buttons = objs ? objs.buttons : args['array'][0]
        if (!opts.buttons || !opts.buttons.length) return
        $.each(opts.buttons, function (k, item) {
            if ($.type(item) === 'string') {
                opts.buttons[k] = {
                    title: item
                }
            }
        })
        plus.nativeUI.actionSheet(opts, args['function'][0])
    }

    /**
     * 自动消失提示框
     */
    $.toast = function (message, options) {
        options = $.extend({
            duration: 'short',
            verticalAlign: 'bottom'
        }, options || {});

        plus.nativeUI.toast(message, options);
    };

})(Zepto, window)