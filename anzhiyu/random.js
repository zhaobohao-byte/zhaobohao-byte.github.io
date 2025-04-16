var posts=["2025/04/16/latex论文写作-（三）/","2025/04/14/latex论文写作-（五）/","2025/04/16/控制算法（一）-粒子群算法/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };