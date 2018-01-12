;
(function ($) {
    if (!$.os.plus) return
    $.getStorage = function (keyName) {
        var value = plus.storage.getItem(keyName)
        if (value) {
            if ($.likeObject(value)) {
                return $.parseJSON(value)
            } else {
                return eval(value)
            }
        } else {
            return null
        }
    }
    $.setStorage = function (keyName, val) {
        keyName = keyName.toString()
        if ($.isObject(val) || $.isArray(val)) val = JSON.stringify(val)
        else val = val.toString()
        plus.storage.setItem(keyName, val)
        return $.getStorage(keyName)
    }
    $.removeStorage = function (keyName) {
        plus.storage.removeItem(keyName)
    }
    $.clearStorage = function (keyName) {
        plus.storage.clear()
    }
})(Zepto)