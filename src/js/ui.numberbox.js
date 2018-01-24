// 数字输入框
;
(function ($) {
    var disabled = 'z-disabled'

    $.fn.numberbox = function (opts) {
        if (!this.length) return this
        return this.each(function () {
            var _this = $(this)
            var options = $.orderOpts(_this, $.config.numberbox, opts, 'numberbox-')
            numberBox(_this, options)
        })

        function numberBox(ele, opts) {
            var ipt = ele.find(opts.input)
            var next = ele.find(opts.next)
            var prev = ele.find(opts.prev)
            var step = parseFloat(opts.step)
            var max = parseFloat(opts.max)
            var min = parseFloat(opts.min)
            if (!ipt || !next || !prev || !ipt.length || !next.length || !prev.length) return
            if (max && max < min) max = min
            ipt.on('change', function () {
                var val = parseFloat(ipt.val())
                if (isNaN(val)) val = min
                if (val <= min) {
                    ipt.val(min)
                    prev.addClass(disabled)
                } else {
                    prev.removeClass(disabled)
                }
                if (max && val >= max) {
                    ipt.val(max)
                    next.addClass(disabled)
                } else {
                    next.removeClass(disabled)
                }
            })
            ipt.on('keyup', function () {
                ipt.change()
            })
            next.on('tap', function () {
                var val = parseFloat(ipt.val())
                if (next.hasClass(disabled)) return
                val += step
                ipt.val(val).change()
            })
            prev.on('tap', function () {
                var val = parseFloat(ipt.val())
                if (prev.hasClass(disabled)) return
                val -= step
                ipt.val(val).change()
            })
            ipt.change()
        }
    }

    
})(Zepto)