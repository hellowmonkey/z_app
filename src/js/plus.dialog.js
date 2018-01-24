// 原生弹框
;
(function ($, window) {
    if (!$.os.plus) return
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