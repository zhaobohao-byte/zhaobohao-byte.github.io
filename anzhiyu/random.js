var posts=["posts/78bebd03.html","posts/a00d6121.html","posts/fe09d13e.html"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };