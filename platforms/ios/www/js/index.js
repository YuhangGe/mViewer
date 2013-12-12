(function() {
    if(typeof app === 'undefined') {
        app = {};
    }
//    __test__ = null;

    var _h = false;

    app.test = function() {
        if(_h) {
            $.showStatusBar(function(){
                $.log2("show status bar");

            }, function(){
                $.log2("show err");

            });
            _h = false;
        } else {
            $.hideStatusBar(function() {
                $.log2("hide status bar");
            }, function() {
                $.log2("hide err");
            });
            _h = true;
        }

    }

    $.extend(app, {
        CUR_MODE : "gallery",
        ROOT_URL : "",
        ROOT_PATH : "",
        SLT_WIDTH : 300,
        SLT_HEIGHT : 300,
        CUR_IMAGE_LIST : null,
        ALL_IMAGE_LIST : [],
        CUR_ORIENTATION : "landscape",

        setTitle : function(title) {
           $("#h-title").text(title);
        },
        initialize: function() {
            document.addEventListener("deviceready", onDeviceReady, false);
//                    document.body.addEventListener('load', onDeviceReady, false);
        },
        bindEvents : function() {

            $.log("bind events");

            this.bindMainPageEvents();
            this.bindDetailPageEvents();
            this.bindTransitionEvents();
            this.bindEditEvents();
            $("#debug-btn").click(function() {
               app.test();
            })
            var _orientationLast = window.orientation;

            window.addEventListener('orientationchange', function() {
//                $.log2("or c");

                if(_orientationLast!==window.orientation) {
                    _orientationLast = window.orientation;
                    onOrientationChange(window.orientation);
                }
            }, false);
            /*
             * phonegap还没有提供before orientation change的事件，只能自己hack。
             * 见MainViewController.m文件中的willRotateToInterfaceOrientation函数
             */
            window.willRotateToOrientation = function(orientation){
//                $.log2("before ori: "+ orientation + " , " + window.orientation);
                if(_orientationLast!==orientation) {
                    _orientationLast = orientation;
                    onOrientationChange(orientation);
                }
                return true;
            };


            onOrientationChange(window.orientation);

            $("#image_list").on("click", ".image-div",function(e) {

                var _t=$(this), idx = Number($(this).attr("idx")), fn = app.CUR_IMAGE_LIST[idx];
                if(app.CUR_MODE==="gallery") {
                    app.showDetailPanel(idx);
                } else if(app.CUR_MODE==="edit") {
                    if(_t.hasClass("select-image")) {
                        _t.removeClass("select-image");
                        app.selectEditPhoto(fn, true);
                    } else {
                        _t.addClass("select-image");
                        app.selectEditPhoto(fn, false);
                    }
                }
            });


        },
        switchMode : function(mode) {
            switch (mode) {
                case 'gallery':
                    $("#panel-gallery").removeClass("edit-mode-list");

                    $("#btn-delete").hide();
                    $("#btn-rename").hide();
                    $("#btn-cancel").hide();
                    $("#btn-edit").show();
                    $("#btn-add").show();
                    $("#show-search").show();
                    app.setTitle(pre_title);
                    app.initGalleryMode();
                    break;
                case 'edit':
                    $("#panel-gallery").addClass("edit-mode-list");
                    $("#btn-delete").show();
                    $("#btn-rename").show();
                    $("#btn-cancel").show();
                    $("#btn-edit").hide();
                    $("#btn-add").hide();
                    $("#show-search").hide();
                    pre_title = $("#h-title").text();

                    app.initEditMode();
                    break;
                default :
                    return;
            }
            app.CUR_MODE = mode;
        },
        showMainPanel : function() {
            if(!app.togglePanel()){
                return;
            }
            $("#btn-add").show();
            $("#show-search").show();
            $("#btn-edit").show();
            $("#btn-back").hide();
            app.setTitle("所有图片");
            is_main_page = true;
        },
        showDetailPanel : function(idx) {
            //app.togglePanel() 延迟到img.onload中保证不会闪烁。
            $("#btn-add").hide();
            $("#show-search").hide();
            $("#btn-back").show();
            $("#btn-edit").hide();
            app.showImage(idx);
            is_main_page = false;
        },

        reloadPhoto : function() {
            thumb_dir = null;
            image_name_list.length = 0;
            thumb_name_list.length = 0;
            image_list.length = 0;
            tmp_thumb_arr.length = 0;
            tmp_thumb_idx = 0;
            loadImages();
        },
        reloadGallery : function() {
            reshowGallery();
        },
        getImageIndex : function(fn) {
            return app.CUR_IMAGE_LIST.indexOf(fn);
        }
    });

    function onOrientationChange(orientation) {
        if(orientation===90||orientation===-90) {
            app.CUR_ORIENTATION = "landscape";
            $(document.body).removeClass("portrait").addClass("landscape");

        } else {
            app.CUR_ORIENTATION = "portrait";
            $(document.body).removeClass("landscape").addClass("portrait");

        }
//        $.log2(app.CUR_ORIENTATION);

        if(!is_main_page) {
            app.resetDetailPage();
        }
    };

    function onDeviceReady() {

        app.bindEvents();


        loadImages();

    }

    var thumb_dir = null;
    var image_name_list = [];
    var thumb_name_list = [];
    var image_list = [];
    var pre_title = "";
    var root_path = "";
    var is_main_page = true;

    function _error(err) {
        $.log("error : " + err.code + ", " + err);
    }

    var tmp_thumb_arr = [];
    var tmp_thumb_idx = 0;

    function loadImages() {
        $.log2("try read filesystem");
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fs) {

            $.log2("get file system.");
            app.ROOT_URL = fs.root.toURL();
            root_path = fs.root.fullPath;
            app.ROOT_PATH = root_path;

            $.log2("root_path: " + root_path);
            fs.root.getDirectory("thumbnails", {create : true}, function(dir) {
                $.log2("get thumbnails dir");
                thumb_dir = dir;
                //首先读取所有缩略图
                dir.createReader().readEntries(function(entries) {
                    $.log2("get thumbnails list");
                    for(var i=0;i<entries.length;i++) {
                        var _e = entries[i], _en = _e.name;
//                        $.log2(_en);
                        if(_e.isFile && /\.thumb\.(jpg)|(png)|(jpeg)|(gif)|(bmp)$/i.test(_en)) {
                            thumb_name_list.push(_en.substr(0, _en.lastIndexOf(".", _en.length - 6)));
                        }
                    }
                    //然后读取所有图片
                    fs.root.createReader().readEntries(getImageList, _error);
                }, _error);
            }, function(err) {
//                $.log2("读取thumbnails文件夹失败");
                $.log(err);
            });

        }, function(evt) {
//            $.log2("加载文件系统出错！");
            $.log(evt.target);
        });
    }

    /*
     * 读取所有图片。并和缩略图进行对比。如果这张图没有缩略图片，则生成新的缩略图。
     */
    function getImageList(entries) {
        $.log2("get image list");
        var img_list = []
        for (var i=0; i<entries.length; i++) {
            var _e = entries[i], _en = _e.name;
//            $.log2(_en);
            if(_e.isFile && /\.(jpg)|(png)|(jpeg)|(bmp)|(gif)$/i.test(_en)) {
                var li = _en.lastIndexOf("."), i_n = _en.substr(0, li), po = _en.substr(li);
                    img_list.push(_e);
                image_list.push({
                    name : i_n,
                    post : po
                });
                image_name_list.push(i_n);
            }
        }

        for(var i=0;i<image_name_list.length;i++) {
            var i_n = image_name_list[i], idx = thumb_name_list.indexOf(i_n);
            if(idx<0) {
                tmp_thumb_arr.push({
                    image : img_list[i],
                    name : image_name_list[i]
                });
            }
        }


        convertThumbnail();


    }


    function convertThumbnail() {
        if(tmp_thumb_idx>=tmp_thumb_arr.length) {

            thumb_dir = null;
            tmp_thumb_arr.length = 0;
            thumb_name_list.length = 0;
            image_name_list.length = 0;
            showGallery();
        } else {
            var tmp = tmp_thumb_arr[tmp_thumb_idx], tf = tmp.image, tn = tmp.name;
            $.log2("convert thumbnail:" + tf.fullPath);
            $.saveThumbnailBySize(tf.fullPath, root_path+"/thumbnails/"+tn+".thumb.png", app.SLT_WIDTH, app.SLT_WIDTH, function() {
                $.log2("success save thumbnail : " + tn);
                /*
                 * 继续处理下一张图片
                 */
                tmp_thumb_idx++;
                convertThumbnail();
            }, function(err) {
                $.log("error when save thumb : " + err.code);
            });

        }
    }

    function showGallery() {
        $.log2("show gallery");
        var $il = $("#image_list").html("");

        if(image_list.length===0) {
            $il.html("<p>没有找到图片。请通过【添加】按钮添加图片，或者通过iTunes的文件共享添加图片文件。</p>");
            return;
        }


        app.ALL_IMAGE_LIST = image_list;
        app.CUR_IMAGE_LIST = image_list;

        reshowGallery();
    }

    function reshowGallery() {
        var img_list = app.CUR_IMAGE_LIST;
        var $il = $("#image_list").html("");
        for(var i=0;i<img_list.length;i++) {
            var i_n = img_list[i].name;
            $("<div class='image-div' idx='"+i+"'></div>").html("<div class='image-outer'><div class='image-inner'><img src='"+app.ROOT_URL+"/thumbnails/"+i_n+".thumb.png'/><i class='select'></i></div></div><p class='title'>"+i_n+"</p>")

                .appendTo($il);
        }
    }
})();
