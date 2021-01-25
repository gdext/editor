# GDExt - An External Geometry Dash Editor
[![](https://img.shields.io/discord/773470525761650698?label=discord%20server&color=7289da)](https://discord.gg/HdrvKDxxp5)
[![](https://img.shields.io/github/issues/gdext/editor)](https://github.com/gdext/editor/issues)
[![](https://img.shields.io/github/license/gdext/editor)](https://github.com/gdext/editor/blob/master/LICENSE)

**Welcome to GDExt's repo! :)**
This is an external Geometry Dash editor built using electron and webpack. This repo contains the code for the editor's page itself. However, it doesn't include the `/dist` directory and any of the code related to electron.

![GDExt](https://i.imgur.com/YRC7zHz.png)

## Getting Started
After you've cloned the repository, type `npm install` (Node.js is required, obviously) to install all the modules. All the code is located in the `/src` directory. Here's more info:
* `/src/assets` contains all the assets, excluding scripts and styles
* `/src/scripts` contains all the scripts
* `/src/styles` contains, guess what? That's right - css styles
* `/src/index.js` is the entry script

## Running Locally (via web browser)
To run GDExt locally, open command prompt in the root directory and run the command below to generate the web page:
```
npm run build
```
After that, run a local http server with:
```
npx http-server -p 8000 -c -1
```

When all of the steps above are complete, you should be able to run GDExt by opening `localhost:8000/dist` in your web browser.

## Installing the app (currently Windows-only)
You can download GDExt as a standalone app here: https://github.com/gdext/electron/releases

## Contribute
GDExt is still far, far, FAR from finished, so if you want to contribute and help, feel free to do so!
[Create a Pull Request](https://github.com/gdext/editor/pulls)
[Leave an Issue](https://github.com/gdext/editor/issues)

