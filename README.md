mViewer
=======
Music Viewer  

查看乐谱软件，其实就是图片查看软件，只不过可以显示图片名，可以搜索，可以导入图片。

最重要的是，可以防止屏幕自动关闭。这一点太重要了，尼玛弹几分钟吉他就要去开一次屏幕的蛋疼谁能理解！！  

使用phonegap开发，外观高访ios7自带图片查看软件。。。

tip：要让phonegap的ios7的程序可以控制状态栏的显示和隐藏，需要在Info.plist文件中加入:  
* Status bar is initially hidden: YES
* View controller-based status bar appearance: NO
然后在phonegap的插件中使用代码:  
`[[UIApplication sharedApplication] setStatusBarHidden:YES withAnimation:UIStatusBarAnimationNone];`

