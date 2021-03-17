import * as glMatrix from "./matrixgl/index"
import monitor from "./monitor"

import spritesheet from "./spritesheet.png"

import dataJson from "./data.json"

import bg1 from "./bg/1.png"
import bg2 from "./bg/2.png"
import bg3 from "./bg/3.png"
import bg4 from "./bg/4.png"
import bg5 from "./bg/5.png"
import bg6 from "./bg/6.png"
import bg7 from "./bg/7.png"
import bg8 from "./bg/8.png"
import bg9 from "./bg/9.png"
import bg10 from "./bg/10.png"
import bg11 from "./bg/11.png"
import bg12 from "./bg/12.png"
import bg13 from "./bg/13.png"
import bg14 from "./bg/14.png"
import bg15 from "./bg/15.png"
import bg16 from "./bg/16.png"
import bg17 from "./bg/17.png"
import bg18 from "./bg/18.png"
import bg19 from "./bg/19.png"
import bg20 from "./bg/20.png"

export const util = {
    /**
     * Creates and compiles the given shader and checks for errors. It then returns the shader.
     * @param {WebGLRenderingContext} gl gl context
     * @param {number} type shader type, gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
     * @param {string} source the shader source code
     * @returns gl shader or undefined if unsuccessful
     */
    createShader: function(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success)
            return shader;
    
        gl.deleteShader(shader);
    },
    /**
     * Takes the 2 given shaders and combines them into a WebGLProgram and also checks for errors
     * @param {WebGLRenderingContext} gl gl context
     * @param {WebGLShader} vertexShader the vertex shader
     * @param {WebGLShader} fragmentShader the fragment shader
     * @returns WebGLProgram or undefined if unsuccessful
     */
    createProgram: function(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success)
            return program;
        
        gl.deleteProgram(program);
    },
    /**
     * Takes in given values an puts them in a WebGLBuffer
     * @param {WebGLRenderingContext} gl 
     * @param {number[]} values 
     * @returns a WebGLBuffer containing the given values
     */
    createBuffer: function(gl, values) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
        return buffer;
    },
    /**
     * Enabling the given WebGLBuffer so that gl.drawArrays is called with it.
     * It will give the values contained in the buffer to the GPU to render.
     * It also asks for how the buffer is layouted and what components to give.
     * @param {WebGLRenderingContext} gl gl context
     * @param {WebGLBuffer} buffer buffer to be enabled
     * @param {number} attr the attribute index the buffer is going to be put in
     * @param {number} size number of components per vertex. usually 2 because of 2d
     */
    enableBuffer: function(gl, buffer, attr, size) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.vertexAttribPointer(attr, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attr);
    },
    /**
     * Enabling the given WebGLTexture so that gl.drawArrays is called with it.
     * It will take the texture and give it as a uniform for the shaders to use.
     * @param {WebGLRenderingContext} gl gl context
     * @param {WebGLTexture} texture the gl texture to be activated
     * @param {WebGLUniformLocation} uniLoc uniform location
     */
    enableTexture: function(gl, texture, uniLoc) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniLoc, 0);
    },
    /**
     * It takes in the texture cutout out of the spreadsheet and sets the correct uniforms of the cutout.
     * The cutout is 0.6 pixels smaller to avoid texture leaking from the nearing textures in the sheet.
     * @param {GDRenderer} renderer GDRenderer
     * @param {{x : number, y : number, w : number, h : number}} tex the texture cutout
     */
    setTexture: function(renderer, tex) {
        renderer.gl.uniform1f(renderer.textX, (tex.x+0.6)/renderer.mainT.width);
        renderer.gl.uniform1f(renderer.textY, (tex.y+0.6)/renderer.mainT.height);
        renderer.gl.uniform1f(renderer.textW, (tex.w-1.2)/renderer.mainT.width);
        renderer.gl.uniform1f(renderer.textH, (tex.h-1.2)/renderer.mainT.height);
    },
    /**
     * This sets the model matrix. The model matrix is the transformation of an object.
     * The vertex shader takes the model matrix in as 3 component matrix uniform and multiplies it
     * with the vertices of the texture rectangle so it applies the transformations.
     * @param {GDRenderer} renderer GDRenderer
     * @param {number} x the x position
     * @param {number} y the y position
     * @param {number} w the width scaling
     * @param {number} h the height scaling
     * @param {number} rot the rotation in angels (forgot if it was clockwise or counter-clockwise)
     */
    setModelMatrix: function(renderer, x, y, w, h, rot) {
        let model = glMatrix.mat3.create();

        glMatrix.mat3.translate(model, model, [x, y]);

        if (rot)
            glMatrix.mat3.rotate(model, model, (-rot) * Math.PI / 180);

        if (!h)
            glMatrix.mat3.scale(model, model, [w, w]);
        else
            glMatrix.mat3.scale(model, model, [w, h]);

        renderer.gl.uniformMatrix3fv(renderer.mmUni, false, model);
    },
    /**
     * Sets the view matrix. The view matrix is the transformation of the view (basically the camera).
     * For the rest, it basically does the same thing as the model matrix.
     * If the x, y, zoom values are not given. It will use the camera in the GDRenderer.
     * @param {GDRenderer} renderer GDRenderer
     * @param {number} x the x position of the camera
     * @param {number} y the y position of the camera
     * @param {number} zoom the zoom of the camera (basically scaling the scene)
     */
    setCamera: function(renderer, x, y, zoom) {
        if (x == undefined) {
            x = -renderer.camera.x;
            y = renderer.camera.y;
            zoom = renderer.camera.zoom;
        }

        let gl = renderer.gl;
        
        gl.uniform1f(renderer.cxUni, x);
        gl.uniform1f(renderer.cyUni, y);

        let matrix = glMatrix.mat3.create();
        if (zoom)
            glMatrix.mat3.scale(matrix, matrix, [zoom, zoom]);
        else
            glMatrix.mat3.scale(matrix, matrix, [1, 1]);
        
        gl.uniformMatrix3fv(renderer.vmUni, false, matrix);
    },
    /**
     * This sets the projection matrix so that the view looks 2d and normally scaled to the canvas.
     * Another example of a projection matrix is a perspective matrix that gives the 3d effect.
     * @param {GDRenderer} renderer GDRenderer
     */
    setProjection: function(renderer) {
        let matrix = glMatrix.mat3.create();
        glMatrix.mat3.scale(matrix, matrix, [2/renderer.width, 2/renderer.height]);

        renderer.gl.uniformMatrix3fv(renderer.pmUni, false, matrix);
    },
    /**
     * Sets the tint of the object for the next gl.drawArrays call. This is what basically makes objects different colors.
     * The given tint is then multiplied with every pixels of the object.
     * @param {GDRenderer} renderer GDRenderer
     * @param {{r : number, g : number, b : number, a : number}} tint the tint (values from 0 - 1)
     */
    setTint: function(renderer, tint) {
        let uniform = renderer.gl.getUniformLocation(renderer.gProg, "a_tint")
        renderer.gl.uniform4fv(uniform, new Float32Array([tint.r, tint.g, tint.b, tint.a]));
    },
    getSpeedPortal: function(obj) {
        if (obj.id == 200)
            return 0;
        if (obj.id == 201)
            return 1;
        if (obj.id == 202)
            return 2;
        if (obj.id == 203)
            return 3;
        if (obj.id == 1334)
            return 4;
        return null;
    },
    ups: {
        [0]: 258,
        [1]: 312,
        [2]: 388.8,
        [3]: 468,
        [4]: 578.1
    },
    /**
     * This function takes in a level and a x position and returns the time
     * it takes to get to that x position given you went through each speed portal
     * @param {GDExtLevel} level the level in GDExt JSON format. though it also needs the `sps` property.
     * @param {number} x the x position
     * @returns {number} the time to get to the x position in seconds.
     */
    xToSec: function(level, x) {
        var resSP = null;
        var lspd = null;
        lspd = parseInt((level.info.speed === undefined) ? 1 : (level.info.speed + 1));
        for (var i of level.sps) {
            let sp = level.data[i];
            if (parseFloat(sp.x) >= parseFloat(x))
                break;
            resSP = sp;
        }
        if (resSP != null) {
            var speed = null;
            speed = this.getSpeedPortal(resSP);
            return resSP.secx + (x - resSP.x) / parseFloat(this.ups[speed]);
        } else
            return parseFloat(x) / parseFloat(this.ups[lspd]);
    },
    /**
     * forgot what this does
     * @param {*} level 
     * @param {*} x 
     * @returns 
     */
    xToSecBC: function(level, x) {
        var resSP = null;
        var lspd = null;
        if (level.format == "GDRenderW")
            lspd = (level.keys.speed === undefined) ? 1 : (level.keys.speed + 1);
        if (level.format == "GDExt")
            lspd = parseInt((level.info.speed === undefined) ? 1 : (level.info.speed + 1));
        for (var sp of level.listSPs) {
            if (parseFloat(sp.x) >= parseFloat(x))
                break;
            resSP = sp;
        }
        if (resSP != null) {
            var speed = null;
            speed = this.getSpeedPortal(resSP);
            return resSP.secx + (x - resSP.x) / parseFloat(this.ups[speed]);
        } else
            return parseFloat(x) / parseFloat(this.ups[lspd]);
    },
    /**
     * Takes in a color object with properties `red, green, blue` (a color trigger for example).
     * And returns a color object in `r, g, b` format
     * @param {{red : number, green : number, blue : number}} col the long color object
     * @returns {{r : number, g : number, b : number}} col the long color object
     */
    longToShortCol(col) {
        return {r: parseFloat(col.red), g: parseFloat(col.green), b: parseFloat(col.blue)};
    },
    /**
     * Takes in the level, a x position and a color id and calculates the color
     * at that x position given you went through each speed portal.
     * @param {GDExtLevel} level the level in GDExt JSON format. though it also needs the `sps` property.
     * @param {number} x x position
     * @param {number} col color id
     * @returns {{r : number, g : number, b : number}}
     */
    xToCOL: function(level, x, col) {
        var resCOL = null;
        if (level.cts[col] != undefined) {
            for (let i of level.cts[col]) {
                let colo = level.data[i];
                if (colo.x >= x)
                    break;
                resCOL = colo;
            }
        }
        if (resCOL != null) {
            var delta = this.xToSec(level, x, true) - this.xToSec(level, resCOL.x);
            if (delta < parseFloat(resCOL.duration)) {
                return this.blendColor(resCOL.curCol, this.longToShortCol(resCOL), delta / resCOL.duration);
            } else
                return this.longToShortCol(resCOL);
        } else {
            var baseColor = level.info.colors.filter((f) => {return f.channel == col;});
            if (baseColor.length > 0) {
                baseColor = baseColor[0];

                return {r: baseColor.r, g: baseColor.g, b: baseColor.b};
            } else
                return {r: 255, g: 255, b: 255}
        }
    },
    /**
     * I think this one calculates a background color value
     * @param {*} level 
     * @param {*} x 
     * @param {*} col 
     * @returns 
     */
    xToCOLBC: function(level, x, col) {
        var resCOL = null;
        if (level.listCOLs[col] != undefined) {
            for (var colo of level.listCOLs[col]) {
                if (colo.x >= x)
                    break;
                resCOL = colo;
            }
        }
        if (resCOL != null) {
            var delta = this.xToSec(level, x, true) - this.xToSec(level, resCOL.x);
            if (delta < parseFloat(resCOL.duration)) {
                return this.blendColor(resCOL.curCol, this.longToShortCol(resCOL), delta / resCOL.duration);
            } else
                return this.longToShortCol(resCOL);
        } else {
            if (level.format == "GDRenderW")
                return level.keys.colors[col] != undefined ? this.longToShortCol(level.keys.colors[col]) : {r: 255, g: 255, b: 255};
            else if (level.format == "GDExt") {
                var baseColor = level.info.colors.filter((f) => {return f.channel == col;});
                if (baseColor.length > 0) {
                    baseColor = baseColor[0];

                    return {r: baseColor.r, b: baseColor.b, g: baseColor.g};
                } else
                    return {r: 255, b: 255, g: 255}
            }
        }
    },
    /**
     * This converts each color component so the values go from `0 - 255` to `0 - 1`
     * which is more useful for WebGL.
     * @param {{r: number, g: number, b: number}} col color value `0 - 255`
     * @returns color value `0 - 1`
     */
    toOne: function(col) {
        return {r: col.r/255, g: col.g/255, b: col.b/255};
    },
    /**
     * This interpolates the 2 color components depending on the `blend` value
     * @param {number} c1 color component 1
     * @param {number} c2 color component 2
     * @param {number} blend blend amount `0 - 1`
     * @returns result blend
     */
    blendComp: function(c1, c2, blend) {
        return c1 * (1-blend) + c2 * blend;
    },
    /**
     * This interpolates the 2 color values depending on the `blend` value
     * @param {{r: number, g: number, b: number}} col1 color value 1
     * @param {{r: number, g: number, b: number}} col2 color value 2
     * @param {number} blend blend amount `0 - 1`
     * @returns result blend
     */
    blendColor: function(col1, col2, blend) {
        return {r: this.blendComp(col1.r, col2.r, blend), b: this.blendComp(col1.b, col2.b, blend), g: this.blendComp(col1.g, col2.g, blend)};
    },
    /**
     * This function loads all the color triggers from a specific color id so that each
     * color trigger has a `curCol` which is the color currently at that trigger before
     * it gets converted and also lists the indexes of the color triggers so you dont have to
     * go through each object to find the color trigger needed. This is purely for optimisation.
     * @param {GDExtLevel} level the level in GDExt JSON format
     * @param {number} color the color id
     * @returns a list of all the indexes of each color trigger of that color id.
     */
    loadColors: function(level, color) {
        var listCOLs = [];

        if (level.format == "GDRenderW")
            for (const obj of level.objects) {
                if ((color == 1000 && obj.id == 29)
                || (color == 1001 && obj.id == 30)
                || (color == 1002 && obj.id == 104)
                || (color == 1003 && obj.id == 744)
                || (color == 1004 && obj.id == 105)
                || (color == 1 && obj.id == 221)
                || (color == 2 && obj.id == 717)
                || (color == 3 && obj.id == 718)
                || (color == 4 && obj.id == 743)
                || (color == 1 && obj.id == 899 && obj.targcol == undefined)
                || (obj.id == 899 && obj.targcol == color))
                    listCOLs.push(obj);
            }
        else if (level.format == "GDExt")
            for (const obj of level.data)
                if (obj.type == "trigger" && obj.info == "color" && (obj.color == "" + color || (color == 1 && !obj.color)))
                    listCOLs.push(obj);

        listCOLs.sort((a, b) => a.x - b.x);

        var lastCOL = {x: -200000, red: 255, blue: 255, green: 255, duration: 0};
        var curCol  = {r: 255, g: 255, b: 255};
        if (level.format == "GDRenderW") {
            if (level.keys.colors[color] != undefined) {
                lastCOL = {x: -200000, red: level.keys.colors[color].red, blue: level.keys.colors[color].blue, green: level.keys.colors[color].green, duration: 0};
                curCol = {r: level.keys.colors[color].red, b: level.keys.colors[color].blue, g: level.keys.colors[color].green};
            }
        } else if (level.format == "GDExt") {
            var baseColor = level.info.colors.filter((f) => {return f.channel == color;});
            if (baseColor.length > 0) {
                baseColor = baseColor[0];

                lastCOL = {x: -200000, red: baseColor.r, blue: baseColor.b, green: baseColor.g, duration: 0};
                curCol = {r: baseColor.r, b: baseColor.b, g: baseColor.g};
            }
        }

        for (const obj of listCOLs) {
            var delta = this.xToSec(level, obj.x) - this.xToSec(level, lastCOL.x);
            if (delta < lastCOL.duration) {
                curCol = this.blendColor(curCol, this.longToShortCol(lastCOL), delta / lastCOL.duration);
            } else {
                curCol = this.longToShortCol(lastCOL);
            }
            obj.curCol = curCol;
            lastCOL = obj;
        }
        return listCOLs;
    },
    zorder: {
        '-3': -4,
        '-1': -3,
        '1' : -2,
        '3' : -1,
        '5' : 1,
        '7' : 2,
        '9' : 3
    }
}

/**
 * Deprecated way of parsing the GD level code that was used when GDRenderW was
 * a standalone project.
 * @deprecated
 */
export const GDRParse = {
    headkeys: {
        // Current Keys
        kA2: {n: "gamemode", t: "gamemode"},
        kA3: {n: "minimode", t: "bool"},
        kA4: {n: "speed", t: "speed"},
        kA6: {n: "background", t: "int"},
        kA7: {n: "ground", t: "int"},
        kA8: {n: "dualmode", t: "bool"},
        kA9: {n: "startpos", t: "bool"},
        kA10: {n: "twoplayer", t: "bool"},
        kA11: {n: "flipgravity", t: "bool"},
        kA13: {n: "songoffset", t: "float"},
        kA14: {n: "guidelines", t: "guidelines"},
        kA15: {n: "fadein", t: "bool"},
        kA16: {n: "fadeout", t: "bool"},
        kA17: {n: "groundline", t: "int"},
        kA18: {n: "font", t: "int"},
        kS38: {n: "colors", t: "colors"},
        kS39: {n: "colorpage", t: "int"},
        // Pre-2.0 Keys
        kS29: {n: "bgd", t: "19col"},
        kS30: {n: "gnd", t: "19col"},
        kS31: {n: "line", t: "19col"},
        kS32: {n: "obj", t: "19col"},
        kS33: {n: "col1", t: "19col"},
        kS34: {n: "col2", t: "19col"},
        kS35: {n: "col3", t: "19col"},
        kS36: {n: "col4", t: "19col"},
        kS37: {n: "3dl", t: "19col"},
    },
    colprops: {
        1: {n: "red", t: "int"},
        2: {n: "green", t: "int"},
        3: {n: "blue", t: "int"},
        4: {n: "plrcol", t: "plrcol"},
        5: {n: "blending", t: "bool"},
        6: {n: "id", t: "int"},
        7: {n: "opacity", t: "float"},
        9: {n: "copyid", t: "int"},
        10: {n: "copyidhsv", t: "int"},
        17: {n: "copyopacity", t: "bool"},
    },
    objprops: {
        1: {n: "id", t: "int"},
        2: {n: "x", t: "float"},
        3: {n: "y", t: "float"},
        4: {n: "flip_hor", t: "bool"},
        5: {n: "flip_ver", t: "bool"},
        6: {n: "rot", t: "float"},
        7: {n: "red", t: "int"},
        8: {n: "green", t: "int"},
        9: {n: "blue", t: "int"},
        10: {n: "duration", t: "float"},
        11: {n: "touch_trig", t: "bool"},
        12: {n: "secretcoinid", t: "int"},
        13: {n: "specialcheck", t: "bool"},
        14: {n: "groundtint", t: "bool"},
        15: {n: "playercol1", t: "bool"},
        16: {n: "playercol2", t: "bool"},
        17: {n: "blending", t: "bool"},
        20: {n: "editorlay1", t: "bool"},
        21: {n: "maincolor", t: "int"},
        22: {n: "seccolor", t: "int"},
        23: {n: "targcol", t: "int"},
        24: {n: "zlayer", t: "int"},
        25: {n: "zorder", t: "int"},
        28: {n: "offsetx", t: "float"},
        29: {n: "offsety", t: "float"},
        30: {n: "easing", t: "int"}, // TODO: Easing
        31: {n: "text", t: "string"},
        32: {n: "scale", t: "float"},
        34: {n: "group_parent", t: "bool"},
        35: {n: "opacity", t: "float"},
        41: {n: "maincolorhsv_enabled", t: "bool"},
        42: {n: "seccolorhsv_enabled", t: "bool"},
        43: {n: "maincolorhsv", t: "float"}, // TODO: HSV
        44: {n: "seccolorhsv", t: "float"}, // TODO: HSV
        45: {n: "fadein", t: "float"},
        46: {n: "hold", t: "float"},
        47: {n: "fadeout", t: "float"},
        48: {n: "pulse_mode", t: "int"}, // TODO: Pulse Mode
        49: {n: "copycolorhsv", t: "float"}, // TODO: HSV
        50: {n: "copycolorid", t: "int"},
        51: {n: "targetgroupid", t: "int"},
        52: {n: "pulsetarget_type", t: "int"}, // TODO: Pulse Target Type
        54: {n: "teleportal_yellowoffset", t: "float"},
        56: {n: "activate_group", t: "bool"},
        57: {n: "groupids", t: "int"}, // TODO: VERY IMPORTNANT! Integer Array
        58: {n: "lockplrx", t: "bool"}, 
        59: {n: "lockplry", t: "bool"},
        60: {n: "copy_opacity", t: "bool"},
        61: {n: "editorlay2", t: "int"},
        62: {n: "spawn_trigger", t: "bool"},
        63: {n: "spawn_delay", t: "float"},
        64: {n: "dont_fade", t: "bool"},
        65: {n: "main_only", t: "bool"},
        66: {n: "detail_only", t: "bool"},
        67: {n: "dont_enter", t: "bool"},
        68: {n: "degrees", t: "int"},
        69: {n: "times_360", t: "int"},
        // TODO: Add rest!!!
    },
    gde: {
        gamemode: {
            CUBE:   0,
            SHIP:   1,
            BALL:   2,
            UFO:    3,
            WAVE:   4,
            ROBOT:  5,
            SPIDER: 6
        },
        speed: {
            HALF:  0,
            ONE:   1,
            TWO:   2,
            THREE: 3,
            FOUR:  4
        },
        bps: {
            0: 8.6,
            1: 10.4,
            2: 12.96,
            3: 15.6,
            4: 19.27,
        },
        sids: {
            HALF_SPEED : 200,
            ONE_SPEED  : 201,
            TWO_SPEED  : 202,
            THREE_SPEED: 203,
            FOUR_SPEED : 1334,
        },
        plrcol: {
            NONE: 0,
            COL1: 1,
            COL2: 2
        },
        guidecol: {
            ORANGE: 0.8,
            YELLOW: 0.9,
            GREEN: 1
        }
    },
    getOnlineLevel: function(id, f) {
        let r = new XMLHttpRequest();
        if (!parseInt(id))
            return false;
        r.open("GET", "https://gdbrowser.com/api/level/" + id + "?download=true", true);
        r.onload = (o) => {
            if (o.responseText == "-1")
                f(false);
            var o = JSON.parse(r.responseText);
            o.data = this.decryptLevel(o.data, false);
            f(o);
        }
        r.send();
        return true;
    },
    parseKey: function(key, value, keys) {
        const def = this.headkeys[key];
        
        if (def == undefined) {
            switch (key) {
                case "kS1":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1000] == undefined) {keys.colors[1000]={}};
                    keys.colors[1000].r = parseInt(value);
                    break;
                case "kS2":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1000] == undefined) {keys.colors[1000]={}};
                    keys.colors[1000].g = parseInt(value);
                    break;
                case "kS3":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1000] == undefined) {keys.colors[1000]={}};
                    keys.colors[1000].b = parseInt(value);
                    break;
                case "kS4":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1001] == undefined) {keys.colors[1001]={}};
                    keys.colors[1001].r = parseInt(value);
                    break;
                case "kS5":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1001] == undefined) {keys.colors[1001]={}};
                    keys.colors[1001].g = parseInt(value);
                    break;
                case "kS6":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1001] == undefined) {keys.colors[1001]={}};
                    keys.colors[1001].b = parseInt(value);
                    break;
                case "kS7":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1002] == undefined) {keys.colors[1002]={}};
                    keys.colors[1002].r = parseInt(value);
                    break;
                case "kS8":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1002] == undefined) {keys.colors[1002]={}};
                    keys.colors[1002].g = parseInt(value);
                    break;
                case "kS9":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1002] == undefined) {keys.colors[1002]={}};
                    keys.colors[1002].b = parseInt(value);
                    break;
                case "kS10":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1004] == undefined) {keys.colors[1004]={}};
                    keys.colors[1004].r = parseInt(value);
                    break;
                case "kS11":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1004] == undefined) {keys.colors[1004]={}};
                    keys.colors[1004].g = parseInt(value);
                    break;
                case "kS12":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1004] == undefined) {keys.colors[1004]={}};
                    keys.colors[1004].b = parseInt(value);
                    break;
                case "kS13":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1] == undefined) {keys.colors[1]={}};
                    keys.colors[1].b = parseInt(value);
                    break;
                case "kS14":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1] == undefined) {keys.colors[1]={}};
                    keys.colors[1].b = parseInt(value);
                    break;
                case "kS15":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1] == undefined) {keys.colors[1]={}};
                    keys.colors[1].b = parseInt(value);
                    break;
                case "kS16":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1000] == undefined) {keys.colors[1000]={}};
                    keys.colors[1000].plrcol = parseInt(value);
                    break;
                case "kS17":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1001] == undefined) {keys.colors[1001]={}};
                    keys.colors[1001].plrcol = parseInt(value);
                    break;
                case "kS18":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1002] == undefined) {keys.colors[1002]={}};
                    keys.colors[1002].plrcol = parseInt(value);
                    break;
                case "kS19":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1004] == undefined) {keys.colors[1004]={}};
                    keys.colors[1004].plrcol = parseInt(value);
                    break;
                case "kS20":
                    if (keys.colors == undefined) {keys.colors={}};
                    if (keys.colors[1] == undefined) {keys.colors[1]={}};
                    keys.colors[1].plrcol = parseInt(value);
                    break;
                default:
                    return null;
            }
        } else {
            var res = {};
            if (def.t == "int")
                keys[def.n] = parseInt(value);
            else if (def.t == "bool")
                keys[def.n] = (value == 1);
            else if (def.t == "float")
                keys[def.n] = parseFloat(value);
            else if (def.t == "colors") {
                var prevLine = 0;
                var colors = {};
                for (let i = 0; i < value.length; i++) {
                    if (value.charAt(i) == "|") {
                        var colset = value.substring(prevLine, i);
                        var proplist = {};
                        var splite = colset.split("_");
                        for (let j = 0; j < splite.length / 2; j++) {
                            proplist[splite[j*2]] = splite[j*2+1];
                        }
                        var parsd = {};
                        for (var j in proplist) {
                            if (proplist.hasOwnProperty(j)) { 
                                const defo = this.colprops[j];
                                if (defo != undefined) {
                                    if (defo.t == "int")
                                        parsd[defo.n] = parseInt(proplist[j]);
                                    else if (defo.t == "float")
                                        parsd[defo.n] = parseFloat(proplist[j]);
                                    else if (defo.t == "bool")
                                        parsd[defo.n] = (proplist[j] == 1);
                                    else {
                                        if (this.gde[defo.t] != undefined) {
                                            parsd[defo.n] = parseInt(proplist[j]);
                                        }
                                    }
                                }
                            }
                        }
                        colors[proplist[6]] = parsd;
                        prevLine = i + 1;
                    }
                }
                keys[def.n] = colors;
            }
            else if (def.t == "guidelines") {
                var guides = [];
                var isSecVal = false;
                var timestamp = null;
                var lastSquig = 0;
                for (let i = 0; i < value.length; i++) {
                    if (value.charAt(i) == "~") {
                        if (!isSecVal) {
                            timestamp = parseFloat(value.substring(lastSquig, i));
                        } else {
                            var colval = parseFloat(value.substring(lastSquig, i));
                            guides.push({time: timestamp, col: colval});
                        }
                        lastSquig = i + 1;
                        isSecVal = !isSecVal;
                    }
                }
                keys[def.n] = guides;
            } else {
                if (this.gde[def.t] != undefined) {
                    keys[def.n] = parseInt(value);
                }
            }
        }
        return keys;
    },
    parseObject: function(objstr) {
        if (objstr == undefined)
            return null;
        var splite = objstr.split(",");
        var res = {}
        for (let i = 0; i < splite.length/2; i++) {
            var propid = parseInt(splite[i*2]);
            var valus  = splite[i*2+1];
            var def    = this.objprops[propid];
            if (def != undefined) {
                if (def.t == "int")
                    res[def.n] = parseInt(valus);
                else if (def.t == "float")
                    res[def.n] = parseFloat(valus);
                else if (def.t == "bool")
                    res[def.n] = (valus == 1);
                else if (def.t == "string")
                    res[def.n] = atob(valus);
                else {
                    if (this.gde[def.t] != undefined) {
                        res[def.n] = parseInt(valus);
                    }
                }
            }
        }
        return res;
    },
    decryptLevel: function(data, official) {
        if (official)
            data = 'H4sIAAAAAAAAA' + data;
        var decoded  = atob(data.replace(/_/g, '/').replace(/-/g, '+'));
        
        var dnc      = new TextDecoder();
        var inflated = pako.inflate(decoded, {windowBits: [15 | 32]});
        return dnc.decode(inflated);
    },
    parseLevel: function(data) {
        var header = null;
        var objects = null;
        for (let i = 0; i < data.length; i++) {
            if (data.charAt(i) == ";") {
                header = data.substring(0, i);
                objects = data.substring(i+1, data.length);
                break
            }
        }
        var lastCom = 0;
        var valueNx = false;
        var currKey = "";
        var keys = {};
        for (let i = 0; i < header.length; i++) {
            if (header.charAt(i) == ",") {
                if (!valueNx)
                    currKey = header.substring(lastCom, i);
                else {
                    var val = header.substring(lastCom, i);
                    var ret = this.parseKey(currKey, val, keys);
                    if (ret != null)
                        keys = ret;
                    currKey = "";
                }
                valueNx = !valueNx;
                lastCom = i + 1;
            }
        }
        var objtable = objects.split(";");
        delete objtable[objtable.length-1];

        var objs = []

        for (let i = 0; i < objtable.length; i++) {
            var eege = this.parseObject(objtable[i])
            if (eege != null) {
                objs.push(eege);
            }
        }

        return {keys: keys, objects: objs};
    }
}

/**
 * The source code of the vertex shader
 */
const VERT_SRC = `
attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform mat3 model;
uniform mat3 proj;
uniform mat3 view;

uniform float camx;
uniform float camy;

uniform float textX;
uniform float textY;
uniform float textW;
uniform float textH;

varying vec2 o_texcoord;

void main(void) {
    vec3 pos = proj * (model * vec3(a_position, 1) + vec3(camx, camy, 1));
    gl_Position = vec4((pos * view).xy, 0.0, 1.0);
    o_texcoord = vec2(a_texcoord.x * textW + textX, a_texcoord.y * textH + textY);
}`;


/**
 * The source code of the fragment shader
 */
const FRAG_SRC = `
precision mediump float;

varying vec2 o_texcoord;
uniform sampler2D a_sampler;

uniform vec4 a_tint;
uniform int  render_line;

void main(void) {
    if (render_line == 1)
        gl_FragColor = a_tint;
    else
        gl_FragColor = texture2D(a_sampler, o_texcoord) * a_tint;
}`;

/**
 * This is a texture class that automatically creates a texture.
 * @param {WebGLRenderingContext} gl gl context
 * @param {string} url url of the texture
 */
function Texture(gl, url) {
    this.width = null;
    this.height = null;

    this.loaded = false;

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    this.image = new Image();

    var tex = this;

    this.image.onload = function() {
        tex.width = this.width;
        tex.height = this.height;

        gl.bindTexture(gl.TEXTURE_2D, tex.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        tex.loaded = true;
    }

    this.image.src = url;
}

/**
 * This is the object definition class that contains where its textures are located, their size,
 * their default color id and their default zlayer and zorder.
 * This is loaded from the `data.json` file.
 * @param {WebGLRenderingContext} gl gl context
 * @param {{}} obj an object from `data.json`
 */
function ObjectDef(gl, obj) {
    this.texture_i = null;
    this.texture_a = null;
    this.texture_b = null;
    this.texture_l = null;

    this.width = 0;
    this.height = 0;

    this.maincol = null;
    this.seccol  = null;

    this.zlayer  = null; // ex. B2, B1, T2
    this.zorder  = null;

    if (obj.sprite_i) {
        this.texture_i = obj.sprite_i;
        this.width = Math.max(this.width, obj.sprite_i.w) / 62 * 30;
        this.height = Math.max(this.height, obj.sprite_i.h) / 62 * 30;
    } if (obj.sprite_a) {
        this.texture_a = obj.sprite_a;
        this.width = Math.max(this.width, obj.sprite_a.w) / 62 * 30;
        this.height = Math.max(this.height, obj.sprite_a.h) / 62 * 30;
    } if (obj.sprite_b) {
        this.texture_b = obj.sprite_b;
        this.width = Math.max(this.width, obj.sprite_b.w) / 62 * 30;
        this.height = Math.max(this.height, obj.sprite_b.h) / 62 * 30;
    } if (obj.sprite_l) {
        this.texture_l = obj.sprite_l;
        this.width = Math.max(this.width, obj.sprite_l.w) / 62 * 30;
        this.height = Math.max(this.height, obj.sprite_l.h) / 62 * 30;
    }

    if (obj.mainCol)
        this.maincol = obj.mainCol;
    if (obj.secCol)
        this.seccol  = obj.secCol;
    
    this.zlayer  = obj.zlayer;
    this.zorder  = obj.zorder;
}

/**
 * This is a very simple camera class.
 * @param {number} x x position
 * @param {number} y y position
 * @param {number} zoom zoom
 */
function Camera(x, y, zoom) {
    this.x = x;
    this.y = y;

    this.zoom = zoom;
}

/**
 * The core of GDRenderW. The GDRenderer class contains (almost) everything for rendering a level.
 * @param {WebGLRenderingContext} gl 
 */
export function GDRenderer(gl) {
    this.gl =    gl;
    this.gProg = null;
    this.pBuff = null;
    this.pAttr = null;
    this.tBuff = null;
    this.tAttr = null;
    this.mmUni = null;
    this.pmUni = null;
    this.vmUni = null;
    this.cxUni = null;
    this.cyUni = null;
    this.projM = null;
    this.viewM = null;
    this.textX = null;
    this.textY = null;
    this.textW = null;
    this.textH = null;
    this.spUni = null;
    this.mainT = null;

    this.width = null;
    this.height = null;

    this.level = null;

    this.objectDefs = {};

    this.camera = null;

    this.bgs = {};

    /**
     * This cache caches simple variables and current color value
     * so they don't have to be calculated every time
     */
    this.cache = {
        colors: {},
        parent: null,
        camX1: null,
        camX2: null,
        objCount: 0,
        /**
         * This clears the cache
         */
        clear: function() {
            this.colors = {};
            this.objCount = 0;
        },
        /**
         * This will get the current color of a color id depending on the camera's x position.
         * This also caches the color and returns that cached color if it gets called again.
         * @param {GDRenderer} renderer the renderer since the function is too far in the hiërarchy.
         * @param {number} color color id
         * @returns {{r: number, g: number, b: number}} the color from `0 - 1`
         */
        getColor: function(renderer, color) {
            monitor.startCategory("Color calculation");
            if (color == 1010)
                return {r: 1, g: 1, b: 1, a: 1};
            if (this.colors[color])
                return this.colors[color];

            this.colors[color] = util.toOne(util.xToCOL(renderer.level, renderer.camera.x, color));
            this.colors[color].a = 1;
            monitor.endCategory("Color calculation");
            return this.colors[color];
        }
    }

    this.gl = gl;

    // Creates the gl program using the shader source codes above
    this.gProg = util.createProgram(gl, 
        util.createShader(gl, gl.VERTEX_SHADER, VERT_SRC),
        util.createShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC));

    // This enables blending so that objects can be seen through transparent objects 
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // These are the vertices of a rectangle since textures are rectangulair.
    // This is used in the rendering process.
    const vertices = [
       -0.5,  0.5,
        0.5, -0.5,
       -0.5, -0.5,
       -0.5,  0.5,
        0.5,  0.5,
        0.5, -0.5,
    ];

    // These are the corresponding texture coordinates.
    const texCoords = [
        0,  0,
        1,  1,
        0,  1,
        0,  0,
        1,  0,
        1,  1
    ];
    
    // This creates the 2 buffers for the vertices and texture coordinates so they can be used
    // be the shaders.
    this.pBuff = util.createBuffer(gl, vertices);
    this.tBuff = util.createBuffer(gl, texCoords);

    // These are the attribute locations so that each of the 2 buffers above can be linked to
    // the attribute variables in the shader code called ´a_position´ and ´a_texcoord´
    this.pAttr = gl.getAttribLocation(this.gProg, "a_position");
    this.tAttr = gl.getAttribLocation(this.gProg, "a_texcoord");

    // These are all the other uniform locations
    this.mmUni = gl.getUniformLocation(this.gProg, "model");
    this.pmUni = gl.getUniformLocation(this.gProg, "proj");
    this.vmUni = gl.getUniformLocation(this.gProg, "view");
    
    this.cxUni = gl.getUniformLocation(this.gProg, "camx");
    this.cyUni = gl.getUniformLocation(this.gProg, "camy");

    this.spUni = gl.getUniformLocation(this.gProg, "a_sampler");
    
    this.textX = gl.getUniformLocation(this.gProg, "textX");
    this.textY = gl.getUniformLocation(this.gProg, "textY");
    this.textW = gl.getUniformLocation(this.gProg, "textW");
    this.textH = gl.getUniformLocation(this.gProg, "textH");

    // This is the camera
    this.camera = new Camera(0, 0, 1);

    // This is the texture of the spritesheet
    this.mainT = new Texture(this.gl, spritesheet);

    /**
     * This takes the data json and creates all the object definitions and also
     * load all the background textures.
     */
    this.loadTextures = () => {
        for (var i = 0; i < 2000; i++) {
            var obj = dataJson[i];
            if (obj != undefined)
                this.objectDefs[i] = new ObjectDef(this.gl, obj);
        }

        this.bgs[1] = new Texture(this.gl, bg1); // I know it's not beatiful but shut up.
        this.bgs[2] = new Texture(this.gl, bg2);
        this.bgs[3] = new Texture(this.gl, bg3);
        this.bgs[4] = new Texture(this.gl, bg4);
        this.bgs[5] = new Texture(this.gl, bg5);
        this.bgs[6] = new Texture(this.gl, bg6);
        this.bgs[7] = new Texture(this.gl, bg7);
        this.bgs[8] = new Texture(this.gl, bg8);
        this.bgs[9] = new Texture(this.gl, bg9);
        this.bgs[10] = new Texture(this.gl, bg10);
        this.bgs[11] = new Texture(this.gl, bg11);
        this.bgs[12] = new Texture(this.gl, bg12);
        this.bgs[13] = new Texture(this.gl, bg13);
        this.bgs[14] = new Texture(this.gl, bg14);
        this.bgs[15] = new Texture(this.gl, bg15);
        this.bgs[16] = new Texture(this.gl, bg16);
        this.bgs[17] = new Texture(this.gl, bg17);
        this.bgs[18] = new Texture(this.gl, bg18);
        this.bgs[19] = new Texture(this.gl, bg19);
        this.bgs[20] = new Texture(this.gl, bg20);
    }
    
    // Then runs it lol
    this.loadTextures();

    /**
     * This tries to render the background.
     * @param {number} bg background id
     * @param {{r: number, g: number, b: number}} tint the tint of the background
     * @returns true if successful, false if not
     */
    this.renderBG = (bg, tint) => {
        var tex = this.bgs[bg];
        if (!tex.loaded)
            return false;

        var gl = this.gl;

        util.setCamera(this, 0, 0);
        
        var size = Math.max(this.width, this.height);
        util.setModelMatrix(this, 0, 0, size);

        gl.uniform1f(this.textX, 0);
        gl.uniform1f(this.textY, 0);
        gl.uniform1f(this.textW, 1);
        gl.uniform1f(this.textH, 1);
        
        util.setTint(this, tint);
        
        util.enableTexture(gl, tex.texture, this.spUni);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        return true;
    };

    this.renderRect = (x, y, width, height, tint = {r: 1, g: 1, b: 1, a: 1}, toCamera = false) => {
        let gl = this.gl;

        gl.uniform1i(gl.getUniformLocation(this.gProg, "render_line"), 1);
        
        if (toCamera)
            util.setCamera(this);
        else
            util.setCamera(this, 0, 0);

        let zoom = this.camera.zoom;

        util.setModelMatrix(this, x, y, width, height);

        util.setTint(this, tint);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.uniform1i(gl.getUniformLocation(this.gProg, "render_line"), 0);
    }

    /**
     * This draws a line and is used for the grid
     * @param {number} x if vertical is true, this is the x position. Otherwise it is the y position
     * @param {boolean} vertical if the line is vertical or not.
     * @param {{r: number, g: number, b: number, a: number}} tint this is the color of the line. White by default.
     * @param {number} width line width (1 by default)
     * @param {boolean} toCamera whenever the line should stick to the camera (false by default)
     */
    this.renderLine = (x, vertical, tint = {r: 1, g: 1, b: 1, a: 1}, width = 1, toCamera = false) => {
        let gl = this.gl;

        gl.uniform1i(gl.getUniformLocation(this.gProg, "render_line"), 1);
        
        if (!toCamera)
            util.setCamera(this, 0, 0);

        if (!vertical) {
            if (!toCamera)
                util.setModelMatrix(this, 0, -this.height/2 + x, this.width, width);
            else {
                util.setCamera(this, 0, this.camera.y, this.camera.zoom);
                util.setModelMatrix(this, 0, x, this.width / this.camera.zoom, width / this.camera.zoom);
            }
        } else {
            if (!toCamera)
                util.setModelMatrix(this, -this.width/2 + x, 0, width, this.height);
            else {
                util.setCamera(this, -this.camera.x, 0, this.camera.zoom);
                util.setModelMatrix(this, x, 0, width / this.camera.zoom, this.height / this.camera.zoom);
            }
        }
        util.setTint(this, tint);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.uniform1i(gl.getUniformLocation(this.gProg, "render_line"), 0);
    };

    /**
     * This will try to render a texture of an object
     * @param {{x: number, y: number, w: number, h: number}} tex texture cutout
     * @param {number} x x position
     * @param {number} y y position
     * @param {number} rot rotation in angles
     * @param {boolean} xflip whenever it should be horizontally flipped
     * @param {boolean} yflip whenever it should be vertically flipped
     * @param {{r: 1, g: 1, b: 1, a: 1}} tint the tint of the texture (white by default)
     * @param {number} scale the scaling of the texture
     * @returns 
     */
    this.renderTexture = (tex, x, y, rot, xflip, yflip, tint = {r: 1, g: 1, b: 1, a: 1}, scale = 1) => {
        if (tex == undefined)
            return;

        var gl = this.gl;

        util.setTexture(this, tex);

        var sx = tex.w * 0.48387096774 * xflip * scale;
        var sy = tex.h * 0.48387096774 * yflip * scale;

        util.setModelMatrix(this, x, y, sx, sy, rot, true);

        util.setTint(this, tint);

        //monitor.endCategory("Object rendering");
        monitor.startCategory("WebGL rendering");
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        monitor.endCategory("WebGL rendering");
        //monitor.startCategory("Object rendering");
    }

    /**
     * This will render the given object
     * @param {{}} obj object to be rendered
     * @returns 
     */
    this.renderObject = (obj) => {
        var def = this.objectDefs[obj.id];

        if (!def)
            return;

        if (obj.x > this.cache.camX2 || obj.x < this.cache.camX1)
            return;

        if (this.level.format == "GDRenderW") {
            var rot   = obj.rot;
            var xflip = (obj.flip_hor === undefined) ? 1 : (obj.flip_hor ? -1 : 1);
            var yflip = (obj.flip_ver === undefined) ? 1 : (obj.flip_ver ? -1 : 1);
            var mainc = obj.maincolor;
            var secc  = obj.seccolor;
        } else if (this.level.format == "GDExt") {
            var rot   = obj.r;
            var xflip = (obj.flipx === undefined) ? 1 : (obj.flipx ? -1 : 1);
            var yflip = (obj.flipy === undefined) ? 1 : (obj.flipy ? -1 : 1);
            var mainc = obj.baseCol;
            var secc  = obj.decorCol;
        }

        this.cache.objCount++;

        var maincol = this.cache.getColor(this, mainc);
        var seccol = this.cache.getColor(this, secc);

        var def_tint = {r: 1, g: 1, b: 1, a: 1};
        var slc      = obj.scale || 1;

        monitor.startCategory("Object rendering");
        if (def.texture_i)
            this.renderTexture(def.texture_i, obj.x, obj.y, rot, xflip, yflip, def_tint, slc);
        if (def.texture_l)
            this.renderTexture(def.texture_l, obj.x, obj.y, rot, xflip, yflip, maincol, slc);
        if (def.texture_b)
            this.renderTexture(def.texture_b, obj.x, obj.y, rot, xflip, yflip, seccol, slc);
        if (def.texture_a)
            if (def.texture_l)
                this.renderTexture(def.texture_a, obj.x, obj.y, rot, xflip, yflip, seccol, slc);
            else
                this.renderTexture(def.texture_a, obj.x, obj.y, rot, xflip, yflip, maincol, slc);
        monitor.endCategory("Object rendering");
    }

    /**
     * Takes in a level position (30 units per block) and converts it into a screen position.
     * @param {number} x x position
     * @param {number} y y position
     * @returns {{x: number, y: number}} screen position
     */
    this.levelToScreenPos = (x, y) => {
        let cX = x - this.camera.x;
        let cY = -( y + this.camera.y );
        return {x: (cX * this.camera.zoom) + this.width / 2, y: (cY * this.camera.zoom) + this.height / 2}
    }

    /**
     * Takes in a screen position and converts it into a level position (30 units per block).
     * @param {number} x x position
     * @param {number} y y position
     * @returns {{x: number, y: number}} level position
     */
    this.screenToLevelPos = (x, y) => {
        let cX = (x - this.width / 2) / this.camera.zoom;
        let cY = (y - this.height / 2) / this.camera.zoom;
        return {x: this.camera.x + cX, y: -this.camera.y - cY}
    }

    /**
     * This will load in a level in the GDExt level json format
     * @param {GDExtLevel} level level json
     */
    this.loadGDExtLevel = (level) => {
        this.level = level;
        this.level.format = "GDExt";

        // Loads all the indexes of each speed portal to a seperate table for preformance
        let listSPs = [];
        for (const obj of this.level.data) {
            if (util.getSpeedPortal(obj))
                listSPs.push(obj);
        }
        listSPs.sort((a, b) => a.x - b.x);

        let lastSP = 0;
        let currSP = parseInt((this.level.info.speed === undefined) ? 1 : this.level.info.speed + 1);
        let secPas = 0;

        for (const obj of listSPs) {
            var delta = obj.x - lastSP;
            secPas += delta / util.ups[currSP];
            obj.secx = secPas;
            currSP = util.getSpeedPortal(obj);
            lastSP = obj.x;
        }

        this.level.listSPs = listSPs;

        // Loads all the indexes of each color trigger to a seperate table for preformance
        this.level.listCOLs = {};
        for (var i = 1; i < 1010; i++)
            this.level.listCOLs[i] = util.loadColors(this.level, i);

        for (var obj of this.level.data) {
            if (obj.z == undefined) {
                if (this.objectDefs[obj.id] != undefined)
                    obj.z = this.objectDefs[obj.id].zlayer;
                else
                    obj.z = -1;
            } else
                obj.z = util.zorder[obj.z];
            if (obj.order == undefined) {
                if (this.objectDefs[obj.id] != undefined)
                    obj.order = this.objectDefs[obj.id].zorder;
                else
                    obj.order = 5;
            }
            if (obj.baseCol == undefined)
                if (this.objectDefs[obj.id] != undefined)
                    obj.baseCol = this.objectDefs[obj.id].maincol
                else
                    obj.baseCol = 1004;
            
            if (obj.decorCol == undefined)
                if (this.objectDefs[obj.id] != undefined)
                    if (this.objectDefs[obj.id].seccol != 0)
                        obj.decorCol = this.objectDefs[obj.id].seccol;
        }

        // This will structure the level in level chunks
        /* This is the layout of level chunks:
            lchunks = {
                0: { <-- The objects in the first 992 units of the level
                    1: [ <-- The objects in z layer 1 (T1)
                        43, <--| Indexes of the objects contained here
                        12,    | These indexes are the indexes for the level.data table
                        342
                    ]
                }
            }
        */
        var zlayers = {};

        var lchunks = {};

        for (var obj of this.level.data) {
            let chunk = lchunks[Math.floor(obj.x / 992)];
            if (!chunk)
                chunk = {};

            if (!chunk[obj.z])
                chunk[obj.z] = [];

            chunk[obj.z].push(obj);
            lchunks[Math.floor(obj.x / 992)] = chunk;
        }

        for (var chunk in lchunks)
            if (lchunks.hasOwnProperty(chunk))
                for (var zid in lchunks[chunk])
                    if (lchunks[chunk].hasOwnProperty(zid)) {
                        var zlayer = lchunks[chunk][zid];
                        zlayer.sort((a, b) => (a.zorder < b.zorder) ? -1 : 1);
                        lchunks[chunk][zid] = zlayer;
                    }


        // Level chunks get stored here:
        this.level.lchunks = lchunks;
    }

    /**
     * This loads the old GDRenderW level format
     * @param {{}} level level
     * @deprecated
     */
    this.loadGDRLevel = (level) => {
        this.level = level;
        this.level.format = "GDRenderW";

        var listSPs = [];
        for (const obj of this.level.objects) {
            if (util.getSpeedPortal(obj))
                listSPs.push(obj);
        }
        listSPs.sort((a, b) => a.x - b.x);

        var lastSP = 0;
        var currSP = (this.level.keys.speed === undefined) ? 1 : this.level.keys.speed + 1;
        var secPas = 0;

        for (const obj of listSPs) {
            var delta = obj.x - lastSP;
            secPas += delta / util.ups[currSP];
            obj.secx = secPas;
            currSP = util.getSpeedPortal(obj);
            lastSP = obj.x;
        }

        this.level.listSPs = listSPs;

        this.level.listCOLs = {};
        for (var i = 1; i < 1010; i++)
            this.level.listCOLs[i] = util.loadColors(this.level, i);

        for (var obj of this.level.objects) {
            if (obj.zorder == undefined) {
                if (this.objectDefs[obj.id] != undefined)
                    obj.zorder = this.objectDefs[obj.id].zlayer;
                else
                    obj.zorder = -1;
            } else {
                if (obj.zorder <= 1)
                    obj.zorder -= 2;
                else
                    obj.zorder -= 1;
            }
            if (obj.zlayer == undefined) {
                if (this.objectDefs[obj.id] != undefined)
                    obj.zlayer = this.objectDefs[obj.id].zorder;
                else
                    obj.zlayer = 5;
            }
            if (obj.maincolor == undefined)
                if (this.objectDefs[obj.id] != undefined)
                    obj.maincolor = this.objectDefs[obj.id].maincol
                else
                    obj.maincolor = 1004;
            
            if (obj.seccolor == undefined)
                if (this.objectDefs[obj.id] != undefined)
                    if (this.objectDefs[obj.id].seccol != 0)
                        obj.seccolor = this.objectDefs[obj.id].seccol;
        }

        var zlayers = {};
        
        for (var i = -4; i < 4; i++) {
            if (i != 0) {
                zlayers[i] = [];
                for (var obj of this.level.objects)
                    if (obj.zorder == i)
                        zlayers[i].push(obj);

                zlayers[i].sort((a, b) => (a.zlayer < b.zlayer) ? -1 : 1);
            }
        }

        this.level.zlayers = zlayers;
    }

    /**
     * This function prepares for rendering
     * @param {number} width width of the canvas
     * @param {number} height height of the canvas
     */
    this.prepareRender = (width, height) => {
        var gl = this.gl;

        // Clears the cache
        this.cache.clear();

        // Sets dimensions
        this.width  = width;
        this.height = height;

        // Makes WebGL use the program
        gl.useProgram(this.gProg);

        // Enables the buffers
        util.enableBuffer(gl, this.pBuff, this.pAttr, 2);
        util.enableBuffer(gl, this.tBuff, this.tAttr, 2);

        // Sets the 2d projection
        util.setProjection(this);
    }

    /**
     * This will render the whole level
     * @param {EditorLevel} level editor level
     * @param {number} width canvas width
     * @param {number} height canvas height
     * @param {{grid?: boolean}} options rendering options
     */
    this.renderLevel = (level, width, height, options = {}) => {
        let startTime = window.performance.now();
        if (!level.level)
            return;

        this.level = level.level;

        // Starts the monitor
        monitor.startFrame();
        var gl = this.gl;

        // Prepares for rendering
        this.prepareRender(width, height);

        monitor.startCategory("Background rendering");

        var bgcol = this.cache.getColor(this, 1000);

        gl.viewport(0, 0, this.width, this.height);

        // Sets a default view matrix for drawing the background
        this.viewM = glMatrix.mat3.create();
        gl.uniformMatrix3fv(this.vmUni, false, this.viewM);

        // Tries rendering the background. If not, it will render it as a plain color
        if (this.level.format == "GDRenderW")
            if (!this.renderBG(this.level.keys.background === undefined ? 1 : this.level.keys.background, bgcol)) {
                gl.clearColor(bgcol.r, bgcol.g, bgcol.b, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        if (this.level.format == "GDExt") {
            if (!this.renderBG(this.level.info.bg ? Math.max( 1, this.level.info.bg ) : 1 , bgcol)) {
                gl.clearColor(bgcol.r, bgcol.g, bgcol.b, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        }

        monitor.endCategory("Background rendering");

        monitor.startCategory("Grid rendering");

        // Calculates the begin x and end x of the camera viewing rectangle
        this.cache.camX1 = this.camera.x - this.width / this.camera.zoom / 2 - 60;
        this.cache.camX2 = this.camera.x + this.width / this.camera.zoom / 2 + 60;

        // This will render the grid
        if (options.grid) {
            let cw = this.width / this.camera.zoom;
            let ch = this.height / this.camera.zoom;

            let x1 = this.camera.x - cw / 2;
            let y1 = -this.camera.y - ch / 2;

            let x2 = this.camera.x + cw / 2;
            let y2 = -this.camera.y + ch / 2;

            const BLACK = {r: 0, g: 0, b: 0, a: 1};
            const BLOCK = 30;

            for (let x = Math.floor(x1/BLOCK) * BLOCK; x <= Math.floor(x2/BLOCK) * BLOCK; x+=BLOCK)
                this.renderLine(x, true, BLACK, 0.7, true);
            for (let y = Math.floor(y1/BLOCK) * BLOCK; y <= Math.floor(y2/BLOCK) * BLOCK; y+=BLOCK)
                this.renderLine(y, false, BLACK, 0.7, true);

            this.renderLine(0, true, {r: 0, g: 0.6, b: 0, a: 1}, 1.5, true);

            let bx = Math.max( 0, this.cache.camX1 );
            let ex = this.cache.camX2;

            this.renderRect(bx + (ex - bx) / 2, 0, ex - bx, 1.5, {r: 1, g: 1, b: 1, a: 1}, true);
        }
        monitor.endCategory("Grid rendering");

        if (!this.mainT.loaded) {
            monitor.endFrame(false);
            return;
        }

        //console.log(this);

        // This sets the view matrix to the camera's view
        util.setCamera(this);

        // This will enable the spritesheet texture
        util.enableTexture(gl, this.mainT.texture, this.spUni);

        // This calculates the first chunk in viewing range and the last chunk
        let camB = Math.floor( this.cache.camX1 / 992 );
        let camE = Math.floor( this.cache.camX2 / 992 );

        // This renders each object in each z layer in each level chunk
        for (let c = camB; c <= camE; c++)
            if (this.level.lchunks[c]) {
                let chunk = this.level.lchunks[c];
                for (let i = -4; i <= 3; i++)
                    if (i != 0 && chunk[i]) {
                        for (let obj of chunk[i])
                            this.renderObject(this.level.data[obj]);
                    }
            }

        var frameTime = window.performance.now() - startTime;

        //console.log((1000 / frameTime) + " FPS");

        monitor.endFrame(false);
        //console.log(monitor.getTime("Object rendering") / this.cache.objCount + "ms per object");
        //console.log(this.cache.objCount);
    };
}