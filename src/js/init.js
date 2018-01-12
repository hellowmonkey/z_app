$(function () {
    var options = $.config;
    if ($.os.plus) {
        //设置ios顶部状态栏颜色；
        if ($.os.ios && $.config.statusBarBackground) {
            plus.navigator.setStatusBarBackground($.config.statusBarBackground);
        }
        if ($.os.android && parseFloat($.os.version) < 4.4) {
            //解决Android平台4.4版本以下，resume后，父窗体标题延迟渲染的问题；
            if (plus.webview.currentWebview().parent() == null) {
                document.addEventListener("resume", function () {
                    var body = document.body;
                    body.style.display = 'none';
                    setTimeout(function () {
                        body.style.display = '';
                    }, 10);
                });
            }
        }

        if ($.config.keyEventBind.backbutton) {
			plus.key.addEventListener('backbutton', function(){
                $.back()
            }, false);
		}
		if ($.config.keyEventBind.menubutton) {
			plus.key.addEventListener('menubutton', function(){
                if($.menu)  $.menu()
            }, false);
		}
    }
});