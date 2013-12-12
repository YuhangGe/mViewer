(function() {
    if(typeof app === 'undefined') {
        app = {};
    }
    $.extend(app, {
        bindTransitionEvents : function() {
            p_main = $("#panel-gallery");
            p_detail = $("#panel-detail");

            p_main.on("webkitTransitionEnd", onMainTranEnd);

            p_detail.on("webkitTransitionEnd", onDetailTranEnd);

            $head = $(".header");

        },
        togglePanel : function() {
            if(__busy__) {
                return false;
            }
            if(is_main_page) {
                __busy__ = true;
                is_main_page = false;
                p_detail.show();
                p_main.addClass("flip");
                beginHeadTime();
                beginScreenTime();
            } else {
                __busy__ = true;
                is_main_page = true;
                p_main.show();
                p_detail.addClass("flip");
                endHeadTime();
                endScreenTime();
            }
            return true;
        },
        toggleHead : function() {
            if(__busy__) {
                return;
            }
            if(is_head_shown) {
                hideHead();
            } else {
                showHead();
            }
        },
        resetHeadCounter : function() {
            screen_counter = 0;
            head_counter = 0;
            //只要点击了一下，都要重新把屏幕计时器关掉防止lock
            beginScreenTime();
        }
    });

    var is_main_page = true;
    var __busy__ = false;
    var p_main, p_detail, $head;
    var head_interval = null;
    var head_counter = 0;
    var is_head_shown = true;
    var screen_interval = null;
    var screen_counter = 0;
    var is_screen_keep = false;

    function beginHeadTime() {
        head_interval = window.setInterval(checkHead, 500);
    }

    function checkHead() {
        head_counter++;
        if(head_counter>=20) {
            //如果10秒没有操作，自动隐藏header
            hideHead();
        }
    }
    function _error(err) {
        $.log("error at lock screen:" + err);
    }
    function _success() {
        //do nothing
    }
    function beginScreenTime() {
        if(is_screen_keep===false) {
            $.keepScreen(_success, _error);
            is_screen_keep = true;
        }
        if(screen_interval===null) {
            screen_interval = window.setInterval(checkScreen, 500);
        }
    }

    function endScreenTime() {
        if(is_screen_keep===true) {
            $.freeScreen(_success, _error);
            is_screen_keep = false;
        }
        if(screen_interval!==null) {
            window.clearInterval(screen_interval);
            screen_interval = null;
        }
    }

    function checkScreen() {
        screen_counter++;
        //当前设定为30分钟后打开系统的屏幕锁计时器
        if(screen_counter>3600 && is_screen_keep === true) {
            $.freeScreen(_success, _error);
            is_screen_keep = false;
        }
    }

    function showHead() {
        __busy__ = true;
        $head.fadeIn(200, function() {
            is_head_shown = true;
            __busy__ = false;
            $.showStatusBar(function(){}, function(){});
        });
        head_counter = 0;
        head_interval = window.setInterval(checkHead, 500);
    }
    function hideHead() {
        __busy__ = true;
        if(head_interval!==null) {
            window.clearInterval(head_interval);
            head_interval = null;
        }
        $.hideStatusBar(function(){}, function(){});

        $head.fadeOut(300, function() {
            is_head_shown = false;
            __busy__ = false;
        })
    }
    function endHeadTime() {
        $head.show();
        is_head_shown = true;
        if(head_interval!==null) {
            window.clearInterval(head_interval);
            head_interval = null;
        }
    }
    function onMainTranEnd() {
        $.log2("m trend");

        if(is_main_page) {
            p_detail.hide();
            __busy__ = false;
        } else {
            p_detail.removeClass("flip");
        }

    }

    function onDetailTranEnd() {
        $.log2("d trend");
        if(is_main_page) {
            p_main.removeClass("flip");
        } else {
            p_main.hide();
            __busy__ = false;
        }
    }
})();