var posts=["posts/a00d6121.html","posts/fe09d13e.html","posts/78bebd03.html"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };