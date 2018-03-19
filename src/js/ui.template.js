// 优化模板引擎
;
(function ($, window) {
    if (!template) return
    var tempFiles = {}
    var tempLoadings = {}
    $.template = function (filename, tempData, cb) {
        if (!filename) {
            console.error('请先指定模板文件')
            return
        }
        var tempfile = tempFiles[filename]
        var data = null
        if (tempfile) {
            data = render()
            cb && cb(data)
        } else {
            if (!cb) {
                console.error('首次加载模板文件必须使用回调')
                return
            }
            if (tempLoadings[filename]) {
                $.toast('模板文件获取中，请稍后重试')
                return
            }
            $.loadTemplate(filename, function (html) {
                tempfile = tempFiles[filename] = html
                data = render()
                cb(data)
            })
        }
        return data

        function render() {
            return template.render(tempfile, tempData)
        }
    }

    $.loadTemplate = function (filename, cb) {
        if (tempFiles[filename]) return
        var script = $('script#' + filename + '[type="text/html"]')
        if (script.length) {
            callback(script.html())
            return
        }
        tempLoadings[filename] = true
        $.readFile($.config.template.path + filename + '.html', function (html) {
            callback(html)
        }, function (e) {
            delete tempLoadings[filename]
            $.toast('模板文件获取失败：' + e.message)
        })

        function callback(html) {
            delete tempLoadings[filename]
            tempFiles[filename] = html
            cb && cb(html)
        }
    }

})(Zepto, window)