var posts=["2025/04/14/hello-world/","2025/04/14/test/","2025/04/14/使用Overleaf快速管理参考文献（基于TIE格式要求）/","2025/04/14/示例一个md文件/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };