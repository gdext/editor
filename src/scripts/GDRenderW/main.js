import * as glMatrix from "./matrixgl/index"
import monitor from "./monitor"

import spritesheet from "./spritesheet.png"

import dataJson from "./data.json"

import VERT_SRC from "./vertex_shader.vsh"
import FRAG_SRC from "./fragment_shader.fsh"

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

import font1_img  from "./font/font1.png"
import font1_json from "./font/font1.json"

import chatfont_img  from "./font/chat_font.png"
import chatfont_json from "./font/chat_font.json"

const TEXTURE_INSET = 0.6;

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

        let message = gl.getShaderInfoLog(shader);

        console.error("SHADER ERROR: " + message);
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
    enableTexture: function(renderer, texture, uniLoc) {
        let gl = renderer.gl;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
        gl.uniform1i(uniLoc, 0);

        renderer.current_texture = texture;
    },
    /**
     * It takes in the texture cutout out of the spreadsheet and sets the correct uniforms of the cutout.
     * The cutout is 0.6 pixels smaller to avoid texture leaking from the nearing textures in the sheet.
     * @param {GDRenderer} renderer GDRenderer
     * @param {{x : number, y : number, w : number, h : number}} tex the texture cutout
     */
    setTexture: function(renderer, tex) {
        if (!renderer.current_texture) return;
        let tx = renderer.current_texture;

        let w = tx.width;
        let h = tx.height;

        let texM = glMatrix.mat3.create();

        glMatrix.mat3.translate(texM, texM, [(tex.x + TEXTURE_INSET) / w, (tex.y + TEXTURE_INSET) / h]);
        glMatrix.mat3.scale(texM, texM, [(tex.w - TEXTURE_INSET * 2) / w, (tex.h - TEXTURE_INSET) / h]);

        renderer.gl.uniformMatrix3fv(renderer.textM, false, texM);
    },
    /**
     * Sets the texture so that it renders the whole thing.
     * @param {GDRenderer} renderer 
     */
    setFullTexture: function(renderer) {
        let texM = glMatrix.mat3.create();
        renderer.gl.uniformMatrix3fv(renderer.textM, false, texM);
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
    color255: function(r = 255, g = 255, b = 255, a = 255) {
        return {r, g, b, a};
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
    color_names: {
        1000: "BG",
        1001: "G1",
        1002: "LINE",
        1003: "3DL",
        1004: "OBJ"
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
            var baseColor = level.info.colors.filter((f) => {return f.channel == col;});
            if (baseColor.length > 0) {
                baseColor = baseColor[0];

                return {r: baseColor.r, b: baseColor.b, g: baseColor.g};
            } else
                return {r: 255, b: 255, g: 255}
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

        for (const obj of level.data)
            if (obj.type == "trigger" && obj.info == "color" && (obj.color == "" + color || (color == 1 && !obj.color)))
                listCOLs.push(obj);

        listCOLs.sort((a, b) => a.x - b.x);

        var lastCOL = {x: -200000, red: 255, blue: 255, green: 255, duration: 0};
        var curCol  = {r: 255, g: 255, b: 255};
        var baseColor = level.info.colors.filter((f) => {return f.channel == color;});
        if (baseColor.length > 0) {
            baseColor = baseColor[0];

            lastCOL = {x: -200000, red: baseColor.r, blue: baseColor.b, green: baseColor.g, duration: 0};
            curCol = {r: baseColor.r, b: baseColor.b, g: baseColor.g};
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        tex.loaded = true;
    }

    this.image.src = url;
}

function Font(gl, json, img) {
    this.json = json;
    this.img  = img;

    this.tex  = new Texture(gl, this.img);

    this.getChar = function(char) {
        for (let c of this.json.chars)
            if (c.letter == char) return c;
    }

    this.getKerning = function(char1, char2) {
        for (let k of this.json.kernings)
            if (k.first == char1 && k.second == char2) return k.amount;

        return 0;
    }
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

    this.maincol = obj.mainCol || 1004;
    this.seccol  = obj.secCol  || 1;
    
    this.zlayer  = obj.zlayer;
    this.zorder  = obj.zorder;
}

/**
 * This is a kinda simple camera class.
 * @param {number} x x position
 * @param {number} y y position
 * @param {number} zoom zoom
 */
function Camera(x, y, zoom) {
    this.x = x;
    this.y = y;

    this.zoom = zoom;

    /**
     * DOES NOT WORK
     */
    this.zoomTo = function(zoom, x, y) {
        let dx = x - this.x;
        let dy = y - this.y;

        let dz = this.zoom - zoom;

        this.x += dx * dz;
        this.y += dy * dz;

        this.zoom = zoom;
    }
}

/**
 * The core of GDRenderW. The GDRenderer class contains (almost) everything for rendering a level.
 * @param {WebGLRenderingContext} gl 
 */
export function GDRenderer(gl) {
    this.gl    = gl;
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
    this.spUni = null;
    this.mainT = null;

    this.textM = null;

    this.width = null;
    this.height = null;

    this.level = null;

    this.objectDefs = {};

    this.camera = null;

    this.bgs = {};

    this.current_texture = null;

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

            if (renderer.current_options.custom_colors) {
                let cst = renderer.current_options.custom_colors;
                if (cst[color])
                    return cst[color];
            }

            if (color == 1005 || color == 1006 || color == 1007) // P1, P2, LBG
                return {r: 1, g: 1, b: 1, a: 1};
            
            if (color == 1010) // BLACK
                return {r: 0, g: 0, b: 0, a: 1};
            if (color == 1011) // WHITE (unverified color id)
                return {r: 1, g: 1, b: 1, a: 1};

            /* LIGHTER TO BE ADDED (color id 1012 (unverified color id) ) */

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

    this.textM = gl.getUniformLocation(this.gProg, "textM");

    // This is the camera
    this.camera = new Camera(0, 0, 1);

    // This is the texture of the spritesheet
    this.mainT = new Texture(this.gl, spritesheet);

    this.current_options = {};

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

        this.font = new Font(this.gl, font1_json, font1_img);

        this.chat_font = new Font(this.gl, chatfont_json, chatfont_img);
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

        util.setFullTexture(this);
        
        util.setTint(this, tint);
        
        util.enableTexture(this, tex, this.spUni);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        return true;
    };

    /**
     * This draws a rectangle and is used for the grid
     * @param {number} x x position (center)
     * @param {number} y y position (center)
     * @param {number} width width of the rectangle
     * @param {number} height height of the rectangle
     * @param {{r: number, g: number, b: number, a: number}} tint This is the color of the rectangle. White by default.
     * @param {boolean} toCamera whenever the line should stick to the camera (false by default)
     */
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

    this.renderText = (text, x, y, font, scale = 0.5, tint = {r: 1, g: 1, b: 1, a: 1}, toCamera = true, centered = true) => {
        let gl = this.gl;

        if (toCamera)
            util.setCamera(this);
        else util.setCamera(this, 0, 0, 1);

        util.enableTexture(this, font.tex, this.spUni);

        y += 30 * 1.1 * scale;

        let len = 0;

        if (centered)
            for (let i = 0; i < text.length; i++) {
                let char = font.getChar(text[i]);

                let krn = 0;

                if (text[i + 1]) krn = font.getKerning(char, font.getChar(text[i + 1]) );
                len += char.advance + krn;
            }

        let adv = 0;

        util.setTint(this, tint);

        for (let i = 0; i < text.length; i++) {
            let c    = text[i];
            let char = font.getChar(c);

            let nxt;
            if (text[i + 1])
                nxt = font.getChar(text[i + 1]);

            let krn = 0;

            if (nxt) krn = font.getKerning(char, nxt);

            util.setTexture(this, {x: char.x, y: char.y, w: char.width, h: char.height});
            util.setModelMatrix(this, x + (adv + char.xoffset + char.width / 2 + krn - len / 2) * scale, y - (char.yoffset + char.height / 2) * scale, char.width * scale, char.height * scale);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            adv += char.advance + krn;
        }
        
        util.enableTexture(this, this.mainT, this.spUni);
    }

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

        var sx = tex.w * 0.48387096774 * xflip * scale;
        var sy = tex.h * 0.48387096774 * yflip * scale;

        util.setModelMatrix(this, x, y, sx, sy, rot, true);
        util.setTint(this, tint);
        util.setTexture(this, tex);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    /**
     * This will render the given object
     * @param {{}} obj object to be rendered
     * @param {number} key the key of the object in the object array
     * @returns 
     */
    this.renderObject = (obj, key = -1) => {
        var def = this.objectDefs[obj.id];

        if (!def && obj.type != "text")
            return;

        if ((obj.x > this.cache.camX2 || obj.x < this.cache.camX1) && obj.type != "text")
            return;

        var rot   = obj.r;
        var xflip = ( obj.flipx ? -1 : 1 ) || 1;
        var yflip = ( obj.flipx ? -1 : 1 ) || 1;
        var mainc = obj.baseCol  || ( def ? def.maincol : null ) || 1004;
        var secc  = obj.decorCol || ( def ? def.seccol : null )  || 1;

        var maincol = this.cache.getColor(this, mainc);
        var seccol = this.cache.getColor(this, secc);

        this.cache.objCount++;

        var def_tint = {r: 1, g: 1, b: 1, a: 1};
        var slc      = obj.scale || 1;

        if (obj._MICHIGUN) maincol = {r: 1, g: 1, b: 1, a: 0.5};

        if (this.current_options.colored_objects) {
            let cld = this.current_options.colored_objects;
            if (cld[key]) {
                maincol = this.cache.getColor(cld[key].base)  || maincol;
                seccol  = this.cache.getColor(cld[key].decor) || seccol;
            }
        }

        monitor.startCategory("Object rendering");
        if (obj.type == "text") {
            this.renderText(obj.text, +obj.x, +obj.y, this.font, 0.5 * slc, maincol); // TODO: Text Rotation!!!
        } else {
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
        }

        let text;

        if (obj.type == "trigger") {
            switch (obj.info) {
                case "color":
                    text = util.color_names[+obj.color] || obj.color; break;
                case "toggle":
                case "touch":   
                case "pulse":  
                case "stop":
                case "spawn":
                case "follow":
                case "alpha":
                case "animate":
                    text = obj.targetGroupID; break;
            }
        }

        if (text) this.renderText(text, +obj.x - 1, +obj.y - 4, this.font, Math.min(0.5 / text.length, 0.25));
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

    this.renderGUIText = (text, x, y) => {
        this.renderText(text,
                        x - this.width / 2,
                        -y + this.height / 2,
                        this.chat_font,
                        0.6,
                        {r: 1, g: 1, b: 1, a: 1},
                        false, false);
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

        this.current_options = options || {};

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
        if (!this.renderBG(this.level.info.bg ? Math.max( 1, this.level.info.bg ) : 1 , bgcol)) {
            gl.clearColor(bgcol.r, bgcol.g, bgcol.b, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
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

            this.renderRect(bx + (ex - bx) / 2, 0, ex - bx, 1.5 / this.camera.zoom, {r: 1, g: 1, b: 1, a: 1}, true);
        }
        monitor.endCategory("Grid rendering");

        /*for (let gl of this.level.info.guidelines) {
            //this.renderLine(util., true, {r: 1, g: 1, b: 1, a: 1}, 0.7, true);
        }*/

        if (!this.mainT.loaded) {
            monitor.endFrame(false);
            return;
        }

        // This sets the view matrix to the camera's view
        util.setCamera(this);

        // This will enable the spritesheet texture
        util.enableTexture(this, this.mainT, this.spUni);

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
                            this.renderObject(this.level.data[obj], obj);
                    }
            }

        console.log(this.level);
        
        /*   RIP /\/\/\   */
        this.renderObject({id: 8, x: -1005, y: 15, _MICHIGUN: true});
        this.renderObject({id: 8, x: -1035, y: 15, _MICHIGUN: true});
        this.renderObject({id: 8, x: -1065, y: 15, _MICHIGUN: true});

        var frameTime = window.performance.now() - startTime;

        let fps = Math.round(1000 / frameTime);
        let spo = Math.round(monitor.getTime("Object rendering") / this.cache.objCount * 100) / 100;

        const DOWN = 30;

        if (options.troubleshoot) {
            this.renderGUIText(`GDRenderW by IliasHDZ (for GDExt), ${fps} FPS, ${this.cache.objCount} Objects, ${spo} ms per object`, 10, 30);
            this.renderGUIText(gl.getParameter(gl.VERSION), 10, 30 + DOWN);

            this.renderGUIText(`Camera   X: ${Math.round(this.camera.x * 100) / 100}, Y: ${Math.round(this.camera.y * 100) / 100}, Zoom: ${Math.round(this.camera.zoom * 100) / 100}`, 10, 30 + DOWN * 3);

            this.renderGUIText(`Object rendering:          ${Math.round(monitor.getTime("Object rendering") * 100) / 100}ms`, 10, 30 + DOWN * 5);
            this.renderGUIText(`Background rendering: ${Math.round(monitor.getTime("Background rendering") * 100) / 100}ms`, 10, 30 + DOWN * 6);
            this.renderGUIText(`Grid rendering:               ${Math.round(monitor.getTime("Grid rendering") * 100) / 100}ms`, 10, 30 + DOWN * 7);
        }

        //console.log((1000 / frameTime) + " FPS");

        monitor.endFrame(false);
        //console.log(monitor.getTime("Object rendering") / this.cache.objCount + "ms per object");
        //console.log(this.cache.objCount);
    };
}