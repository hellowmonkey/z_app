;
(function ($, window) {
    var localStorage = window.localStorage

    $.plusReady(function () {
        localStorage = plus.storage
    })

    $.getStorage = function (keyName) {
        var value = localStorage.getItem(keyName)
        if (value) {
            if ($.likeObject(value)) {
                return $.parseJSON(value)
            }
            return value
        } else {
            return null
        }
    }
    $.setStorage = function (keyName, val) {
        keyName = keyName.toString()
        if (typeof val === 'object') val = JSON.stringify(val)
        else val = val.toString()
        localStorage.setItem(keyName, val)
        return $.getStorage(keyName)
    }
    $.removeStorage = function (keyName) {
        localStorage.removeItem(keyName)
    }
    $.clearStorage = function (keyName) {
        localStorage.clear()
    }
})(Zepto, window)