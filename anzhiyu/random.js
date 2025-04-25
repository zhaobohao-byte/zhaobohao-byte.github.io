var posts=["posts/a00d6121.html","posts/78bebd03.html","posts/fe09d13e.html","posts/18e3e2ea.html","posts/d30087eb.html","posts/951318a8.html","posts/6889b061.html","posts/30724d9a.html"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };