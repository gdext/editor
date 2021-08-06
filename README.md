# GDExt - An External Geometry Dash Editor
[![](https://img.shields.io/discord/773470525761650698?label=discord%20server&color=7289da)](https://discord.gg/HdrvKDxxp5)
[![](https://img.shields.io/github/issues/gdext/editor)](https://github.com/gdext/editor/issues)
[![](https://img.shields.io/github/license/gdext/editor)](https://github.com/gdext/editor/blob/master/LICENSE)

**Welcome to GDExt's repo! :)**
This is an external Geometry Dash editor built using electron and webpack. This repo contains the code for the editor's page itself. However, it doesn't include the `/dist` directory and any of the code related to electron.
> **Note:** This is still a work in progress.

![GDExt](https://camo.githubusercontent.com/c745ac36f87b4676570d1dec9ff4bd1c60d60cabeec05e01f3677662de250244/68747470733a2f2f7062732e7477696d672e636f6d2f6d656469612f457a5f2d4d71375751414d6d4a6a773f666f726d61743d6a7067266e616d653d6c61726765)
[more screenshots can be found here](screenshots.md)

## Getting Started
After you've cloned the repository, type `npm install` (Node.js is required, obviously) to install all the modules. All the code is located in the `/src` directory. Here's more info:
* `/src/assets` contains all the assets, excluding scripts and styles
* `/src/scripts` contains all the scripts
* `/src/styles` contains, guess what? That's right - css styles
* `/src/index.js` is the entry script

## Running Locally (via web browser)
Make sure Webpack is installed (it should be, if you followed all of the steps above), if not you may do:
```
npm install -g webpack-dev-server
```
To run GDExt locally, open command prompt in the root folder and run the command below to generate the web page:
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

[Discord Server](https://discord.gg/s8hzqyxJKW)
