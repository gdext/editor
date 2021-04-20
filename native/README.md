# GDExt-native

It has a somewhat complicated build process that is not going to be mentioned here.

GDExt-native is used by GDExt to access native functions like checking if Geometry Dash is running.

It is written in C++ and consists of 2 parts:

- `gdext.node` Node.js (electron) addon: Built using node-gyp (electron-rebuild)

- `gdext.dll` Standalone DLL: Built using G++