var posts=["2025/04/16/latex论文写作-（三）/","2025/04/14/latex论文写作-（五）/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };