const fs = require("fs");

const html = 
`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GDExt</title>
</head>
<body>
    <script src="bundle.js"></script>
    <script src="electron.js"></script>
</body>
</html>`;

fs.writeFileSync("dist/index.html", html);