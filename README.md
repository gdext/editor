# GDExt - An External Geometry Dash Editor
[![](https://img.shields.io/discord/773470525761650698?label=discord%20server&color=7289da)](https://discord.gg/HdrvKDxxp5)
[![](https://img.shields.io/github/issues/gdext/editor)](https://github.com/gdext/editor/issues)
[![](https://img.shields.io/github/license/gdext/editor)](https://github.com/gdext/editor/blob/master/LICENSE)

**Welcome to GDExt's repo! :)**
This is an external Geometry Dash editor built using electron and webpack. This repo contains the code for the editor's page itself. However, it doesn't include the `/dist` directory and any of the code related to electron.

## Getting Started
After you've cloned the repository, type `npm install` to install all the modules. All the code is located in the `/src` directory. Here's more info:
* `/src/assets` contains all the assets, excluding scripts and styles
* `/src/scripts` contains all the scripts
* `/src/styles` contains, guess what? That's right - css styles
* `/src/index.js` is the entry script

## Running Locally (via web browser)
To run GDExt locally, create new folder named `/dist` in the root directory. Navigate into it and create an HTML file with the script with src attribute set to `bundle.js`, something like that:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GDExt</title>
</head>
<body>
    <script src="bundle.js"></script>
</body>
</html>
```
After that, navigate back to the root directory and run:
```
npm run build
```
You should then be able to run GDExt by opening `/dist/index.js` in your web browser.

## Contribute
GDExt is still far, far, FAR from finished, so if you want to contribute and help, feel free to do so!
[Create a Pull Request](https://github.com/gdext/editor/pulls)
[Leave an Issue](https://github.com/gdext/editor/issues)