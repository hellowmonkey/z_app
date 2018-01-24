// 透明导航
;
(function ($, window) {
    var rgbaRegex = /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)$/;
    var getColor = function (colorStr) {
        var matches = colorStr.match(rgbaRegex);
        if (matches && matches.length === 5) {
            return [
                matches[1],
                matches[2],
                matches[3],
                matches[4]
            ];
        }
        return [];
    };

    $.fn.transparent = function (opts) {
        if (!this.length) return this
        var self = this
        var color = self.css('background-color')
        var colors = getColor(color)
        var top
        opts = $.orderOpts(self, $.config.transparent, opts, 'transparent-')
        if (!colors.length) throw new Error("ui.transparent: 元素背景颜色必须为RGBA");
        $(window).on('scroll', function () {
            var _this = $(this)
            var scrollTop = _this.scrollTop()
            if (scrollTop < opts.start) {
                scrollTop = opts.start
            } else if (scrollTop > opts.end) {
                scrollTop = opts.end
            }
            var opacity = parseFloat(scrollTop / opts.end)
            if (top === scrollTop) return
            self.css('background-color', 'rgba(' + colors[0] + ',' + colors[1] + ',' + colors[2] + ',' + opacity + ')').trigger('change', {
                opacity: opacity
            })
            top = scrollTop
        })

        return this
    }
})(Zepto, window)