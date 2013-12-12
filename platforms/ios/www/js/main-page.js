/**
 * User: xiaoge
 * At: 13-7-25 12:14
 * Email: abraham1@163.com
 */
(function() {
    if(typeof app === 'undefined') {
        app = {};
    }
    $.extend(app, {
        initGalleryMode : function() {
            $("#image_list .select-image").removeClass("select-image");
        },
        bindMainPageEvents : function() {

            $("#import-albums").addMouseDownEvent(importPhoneFromLibrary);
            $("#btn-import").addMouseDownEvent(doImportFromLibrary);
            $("#show-search").addMouseDownEvent(showSearchDialog);
            $("#btn-search").addMouseDownEvent(doSearchPhoto);
            $("#btn-search-back").addMouseDownEvent( function() {
                if(app.CUR_IMAGE_LIST === app.ALL_IMAGE_LIST) {
                    $.log2("current in on all image");
                    return;
                }
                app.CUR_IMAGE_LIST = app.ALL_IMAGE_LIST;
                app.reloadGallery();
                app.setTitle("所有图片");
            });

            $("#btn-add").addMouseDownEvent(showImportDialog);

            $("#btn-back").addMouseDownEvent(function() {
                app.showMainPanel();
            });


            $(document.body).addMouseDownEvent(function(e) {
                if(e.originalEvent.touches && e.originalEvent.touches.length===3) {
                    $("#debug-panel").toggle();
                }
            });

            $("#dialog-mask").addMouseDownEvent(function() {
                closeImportDialog();
                closeAlbumsDialog();
                closeSearchDialog();
            });

        }
    });


    var albums_shown = false;
    var albums_list = null;
    var photo_list = null;
    var select_photo_list = [];
    var search_image_list = [];

    function _error(err) {
        $.log2(err);
    }

    function showSearchDialog(e) {
        showDailogMask();
        $("#search-dialog").fadeIn(350);
    }

    function showImportDialog(e) {
        showDailogMask();
        $("#import-dialog").fadeIn(350);
    }
    function doSearchPhoto() {
        var txt = $("#txt-search").val().trim();
        if(txt==="") {
            alert("请输入搜索的内容！");
            return;
        }
        search_image_list.length = 0;
        var a_list = app.ALL_IMAGE_LIST;
        for(var i=0;i<a_list.length;i++) {
            var _n = a_list[i].name;
            if(_n.indexOf(txt)>=0) {
                search_image_list.push(a_list[i]);
            }
        }
        if(search_image_list.length===0) {
            alert("没有找到任何符合搜索条件的图片！");
            return;
        }
        app.CUR_IMAGE_LIST = search_image_list;
        app.reloadGallery();
        app.setTitle("搜索结果："+txt);
        app.resetCurrentImageIndex();
    }
    function importPhoneFromLibrary(e) {

        $.log("import lib");
        if(albums_shown) {
            return;
        }

        albums_shown = true;
        albums_list = null;
        photo_list = null;
        select_photo_list.length = 0;

        $("#albums-list").html("").show();
        $("#thumb-list").html("").hide();
        $("#select-thumb-list").html("");
        $("#select-number").text("0");

        $("#albums-dialog").fadeIn(350);

        $.getAllGroups(function(arr) {
            albums_list = arr;
            var $al = $("#albums-list").html("");
            for(var i=0;i<arr.length;i++) {
                var _a = arr[i];
                if(_a.poster==null||_a.number==null||_a.name==null) {
                    continue;
                }
                var _n = _a.name;
                if(_a.name==='Camera Roll') {
                    //相机胶卷
                    _n = "相机胶卷";
                } else if(_a.name==='My Photo Stream') {
                    _n ="我的照片流";
                }
                var $li = $("<li idx='"+i+"'></li>").append(
                    $('<img class="thumb"  src="data:image/jpeg;base64,'+_a.poster+'"><div><h3>'+_n+'</h3><p>'+_a.number+'</p></div>'
                        + '<img class="rarrow" src="img/rarrow.png">')
                ).click(function() {
                    var idx = Number($(this).attr("idx"));
                    var _a = albums_list[idx];
                        showAlbumPhotos(_a.name);
                });

                if(_a.name==='Camera Roll') {
                    $al.prepend($li);
                } else {
                    $al.append($li);
                }
            }
        }, function(err) {
            $.log2(err);
        });
    }

    function showAlbumPhotos(group_name) {
        $("#albums-list").hide();
        $("#thumb-list").show();

        $.getAllAssetsByGroupName(group_name, function(arr) {
            photo_list = arr;
           var $tl = $("#thumb-list");
           for(var i=0;i<arr.length;i++) {
               var _a = arr[i];
               var $t = $("<div idx='"+i+"' class='thumb'></div>").append(
                   $("<img src='data:image/jpeg;base64,"+_a.thumbnail+"'/>")
                   ).click(function() {
                        var idx = Number($(this).attr("idx"));
                       selectAlbumPhoto(photo_list[idx]);
                   });
               $tl.append($t);
           }
        }, function(err) {
            $.log2(err);
        });

    }

    function selectAlbumPhoto(p) {
        select_photo_list.push(p);
        $("#select-thumb-list").append(
            $("<div class='thumb'></div>").append(
                $("<img src='data:image/jpeg;base64,"+ p.thumbnail+"'/>")
            ).append(
                    $("<span idx='"+(select_photo_list.length-1)+"' class='delete'><img src='img/delete.png'/></span>")
                )
        ).on("click", ".delete", function() {
            var idx = Number($(this).attr("idx"));
            $(this).parent().remove();
            select_photo_list.splice(idx, 1);
            $("#select-number").text(select_photo_list.length);

            });
        $("#select-number").text(select_photo_list.length);
    }

    function doImportFromLibrary(e) {

        if(select_photo_list.length===0) {
            alert("请先选择图片！");
            return;
        }
        var _d = new Date(),
            _t = _d.getFullYear()+"-"+(_d.getMonth()+1)+"-"+_d.getDate()+" "+_d.getHours()+":"+_d.getMinutes();

        _t = prompt("请输入图片名称：", _t);
        if(_t==null||_t.trim()==="") {
            alert("导入图片一定要有名称！");
            return;
        }

        var url_arr = [];
        for(var i=0;i<select_photo_list.length;i++) {
            url_arr.push(select_photo_list[i].url);
        }
        $.saveAssets(url_arr, _t, app.ROOT_PATH, function() {
            closeAlbumsDialog();
            closeImportDialog();
            app.setTitle("所有图片");
            window.setTimeout(function() {
                app.reloadPhoto();
            }, 0);
        }, function(err) {
            alert("导入失败！");
            $.log2(err);
        });
    }
    function closeImportDialog() {
        $("#import-dialog").fadeOut(150, function() {
            hideDialogMask();
        });
    }
    function closeAlbumsDialog() {
        $("#albums-dialog").fadeOut(150, function() {
            hideDialogMask();
        });
        albums_shown = false;
    }
    function closeSearchDialog() {
        hideDialogMask();

        $("#search-dialog").fadeOut(150, function() {
        });
    }

    function showDailogMask() {
        $("#dialog-mask").show();
    }
    function hideDialogMask() {
        $("#dialog-mask").hide();
    }
})();