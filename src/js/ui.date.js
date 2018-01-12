;
(function ($) {
    $.date = function (format, time) {
        var nowDt = new Date()
        var dt = nowDt
        var settings = $.config.date
        var defaultFormat = settings.format
        if ($.type(format) !== 'string') {
            time = format
            format = defaultFormat
        }
        if ($.type(time) !== 'undefined') {
            dt = new Date(time)
        }
        if (format === defaultFormat) {
            return convert()
        } else {
            return layout()
        }

        function layout() {
            var od = {
                y: dt.getFullYear(),
                M: dt.getMonth(),
                d: dt.getDate(),
                h: dt.getHours(),
                m: dt.getMinutes(),
                s: dt.getSeconds(),
                ms: dt.getMilliseconds(),
                z: dt.getTimezoneOffset(),
                wd: dt.getDay(),
                w: ["\u65E5", settings.numbers[1], "\u4E8C", settings.numbers[3], settings.numbers[4], settings.numbers[5], settings.numbers[6]]
            }
            var h12 = od.h > 12 ? od.h - 12 : od.h
            var o = {
                "y+": od.y,
                "M+": od.M + 1,
                "d+": od.d,
                "H+": od.h,
                "h+": h12 == 0 ? 12 : h12,
                "m+": od.m,
                "s+": od.s,
                "ms": od.ms,
                "a+": od.h > 12 || od.h == 0 ? "PM" : "AM",
                "w+": od.wd,
                "W+": od.w[od.wd],
                "q+": Math.floor((od.m + 3) / 3),
                "z+": od.z
            }
            if (format === defaultFormat && od.y !== nowDt.getFullYear()) {
                format = 'yyyy年' + format
            }
            for (var i in o) {
                if (new RegExp("(" + i + ")").test(format)) format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[i] : ("00" + o[i]).substr(("" + o[i]).length))
            }
            return format
        }

        function convert() {
            var distanceMillis = nowDt.getTime() - dt.getTime()
            if (Math.abs(distanceMillis) > settings.coverTime) return layout()
            var suffix = settings.prefixAgo
            var seconds = Math.abs(distanceMillis) / 1000
            var minutes = seconds / 60
            var hours = minutes / 60
            var days = hours / 24
            var years = days / 365
            var words = seconds < 45 && substitute(settings.seconds, Math.round(seconds)) || seconds < 90 && substitute(settings.minute, 1) || minutes < 45 && substitute(settings.minutes, Math.round(minutes)) || minutes < 90 && substitute(settings.hour, 1) || hours < 24 && substitute(settings.hours, Math.round(hours)) || hours < 42 && substitute(settings.day, 1) || days < 30 && substitute(settings.days, Math.round(days)) || days < 45 && substitute(settings.month, 1) || days < 365 && substitute(settings.months, Math.round(days / 30)) || years < 1.5 && substitute(settings.year, 1) || substitute(settings.years, Math.round(years));
            if (distanceMillis < 0) {
                suffix = settings.suffixAgo
            }
            return [words, suffix].join(settings.wordSeparator);

            function substitute(string, number) {
                var value = (settings.numbers && settings.numbers[number]) || number
                return string.replace(/%d/i, value)
            }
        }
    }
})(Zepto)