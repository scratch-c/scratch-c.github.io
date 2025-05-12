<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="shortcut icon" href="/pics/hdico.ico">
  <title>scratch_szc's blog</title>
</head>
<body>
 <body>
<div id="head"></div>
<p><a href="https//www.luogu.com.cn/user/1260767">洛谷1260767</a></p>
<div id="bottem"></div>
</body>
    <script>
       fetch('part/head.html')
      .then(response => response.text())
      .then(html => document.getElementById('head').innerHTML = html);
        fetch('part/bottem.html')
      .then(response => response.text())
      .then(html => document.getElementById('head').innerHTML = html);
  </script>
</html>
