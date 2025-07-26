<?php
// 手动定义Typecho站点URL常量
define('__TYPECHO_SITE_URL', 'http://localhost');

// 模拟服务器环境变量
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_URI'] = '/';
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

ob_start();
include("index.php");
$content = ob_get_contents();
ob_end_clean();

// 修复可能的相对路径问题
$content = str_replace('href="/', 'href="./', $content);
$content = str_replace('src="/', 'src="./', $content);

file_put_contents("index.html", $content);
echo "Static page generated successfully!";
?>