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
    createShader: function(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success)
            return shader;
    
        gl.deleteShader(shader);
    },
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
    createBuffer: function(gl, values) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
        return buffer;
    },
    enableBuffer: function(gl, buffer, attr, size) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.vertexAttribPointer(attr, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attr);
    },
    enableTexture: function(gl, texture, uniLoc) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniLoc, 0);
    },
    setTexture: function(renderer, tex) {
        renderer.gl.uniform1f(renderer.textX, (tex.x+0.6)/renderer.mainT.width);
        renderer.gl.uniform1f(renderer.textY, (tex.y+0.6)/renderer.mainT.height);
        renderer.gl.uniform1f(renderer.textW, (tex.w-1.2)/renderer.mainT.width);
        renderer.gl.uniform1f(renderer.textH, (tex.h-1.2)/renderer.mainT.height);
    },
    setModelMatrix: function(renderer, x, y, w, h, rot) {
        let model = glMatrix.mat3.create();

        glMatrix.mat3.translate(model, model, [x, y]);

        if (rot)
            glMatrix.mat3.rotate(model, model, rot * Math.PI / 180);

        if (!h)
            glMatrix.mat3.scale(model, model, [w, w]);
        else
            glMatrix.mat3.scale(model, model, [w, h]);
        
        renderer.gl.uniformMatrix3fv(renderer.mmUni, false, model);
    },
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
    setProjection: function(renderer) {
        let matrix = glMatrix.mat3.create();
        glMatrix.mat3.scale(matrix, matrix, [2/renderer.width, 2/renderer.height]);

        renderer.gl.uniformMatrix3fv(renderer.pmUni, false, matrix);
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
    xToSec: function(level, x, lol) {
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
    longToShortCol(col) {
        return {r: parseFloat(col.red), b: parseFloat(col.blue), g: parseFloat(col.green)};
    },
    xToCOL: function(level, x, col) {
        var resCOL = null;
        if (level.listCOLs[col] != undefined) {
            for (var colo of level.listCOLs[col]) {
                if (colo.x >= x)
                    break;
                resCOL = colo;
            }
        }
        if (resCOL != null) {
            var delta = this.xToSec(level, x) - this.xToSec(level, resCOL.x, true);
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
    toOne: function(col) {
        return {r: col.r/255, g: col.g/255, b: col.b/255};
    },
    blendComp: function(c1, c2, blend) {
        return c1 * (1-blend) + c2 * blend;
    },
    blendColor: function(col1, col2, blend) {
        return {r: this.blendComp(col1.r, col2.r, blend), b: this.blendComp(col1.b, col2.b, blend), g: this.blendComp(col1.g, col2.g, blend)};
    },
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
                if (obj.type == "trigger" && obj.info == "color" && obj.color == "" + color)
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

function ObjectDef(gl, obj) {
    this.texture_i = null;
    this.texture_a = null;
    this.texture_b = null;
    this.texture_l = null;

    this.maincol = null;
    this.seccol  = null;

    this.zlayer  = null; // ex. B2, B1, T2
    this.zorder  = null;

    if (obj.sprite_i)
        this.texture_i = obj.sprite_i;
    if (obj.sprite_a)
        this.texture_a = obj.sprite_a;
    if (obj.sprite_b)
        this.texture_b = obj.sprite_b;
    if (obj.sprite_l)
        this.texture_l = obj.sprite_l;

    if (obj.mainCol)
        this.maincol = obj.mainCol;
    if (obj.secCol)
        this.seccol  = obj.secCol;
    
    this.zlayer  = obj.zlayer;
    this.zorder  = obj.zorder;
}

function Camera(x, y, zoom) {
    this.x = x;
    this.y = y;

    this.zoom = zoom;
}

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

    this.cache = {
        colors: {},
        parent: null,
        clear: function() {
            this.colors = {};
        },
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

    this.gProg = util.createProgram(gl, 
        util.createShader(gl, gl.VERTEX_SHADER, VERT_SRC),
        util.createShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC));

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const vertices = [
       -0.5,  0.5,
        0.5, -0.5,
       -0.5, -0.5,
       -0.5,  0.5,
        0.5,  0.5,
        0.5, -0.5,
    ];

    const texCoords = [
        0,  0,
        1,  1,
        0,  1,
        0,  0,
        1,  0,
        1,  1
    ];
    
    this.pBuff = util.createBuffer(gl, vertices);
    this.tBuff = util.createBuffer(gl, texCoords);

    this.pAttr = gl.getAttribLocation(this.gProg, "a_position");
    this.tAttr = gl.getAttribLocation(this.gProg, "a_texcoord");

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

    this.camera = new Camera(0, 0, 1);

    this.mainT = new Texture(this.gl, spritesheet);

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
    
    this.loadTextures();

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
        
        gl.uniform4fv(gl.getUniformLocation(this.gProg, "a_tint"), new Float32Array([tint.r, tint.g, tint.b, tint.a]));
        
        util.enableTexture(gl, tex.texture, this.spUni);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        return true;
    };

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
        gl.uniform4fv(gl.getUniformLocation(this.gProg, "a_tint"), new Float32Array([tint.r, tint.g, tint.b, tint.a]));

        util.enableTexture(gl, this.mainT.texture, this.spUni);

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.uniform1i(gl.getUniformLocation(this.gProg, "render_line"), 0);
    };

    this.renderTexture = (tex, x, y, rot, xflip, yflip, tint = {r: 1, g: 1, b: 1, a: 1}) => {
        if (tex == undefined)
            return;
        if (!this.mainT.loaded)
            return;
        
        var rx = (x - this.camera.x) * this.camera.zoom;
        var ry = (y + this.camera.y) * this.camera.zoom;

        var gl = this.gl;

        if (!(rx+tex.w/2+60 > -(this.width/2) && rx-tex.w/2-60 <= this.width/2))
            return;
        if (this.level.format == "GDRenderW")
            if (!(ry+tex.h/2+60 > -(this.height/2) && ry-tex.h/2-60 <= this.height/2))
                return;

        util.setTexture(this, tex);

        var sx = tex.w/62*30 * (xflip ? -1 : 1);
        var sy = tex.h/62*30 * (yflip ? -1 : 1);

        util.setModelMatrix(this, x, y, sx, sy, rot);

        gl.uniform4fv(gl.getUniformLocation(this.gProg, "a_tint"), new Float32Array([tint.r, tint.g, tint.b, tint.a]));

        util.enableTexture(gl, this.mainT.texture, this.spUni);
        
        monitor.startCategory("WebGL rendering");
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        monitor.endCategory("WebGL rendering");
    }

    this.renderObject = (obj) => {
        if (this.level.format == "GDRenderW") {
            var rot = (obj.rot === undefined) ? 0 : -obj.rot;
            var xflip = (obj.flip_hor === undefined) ? false : obj.flip_hor;
            var yflip = (obj.flip_ver === undefined) ? false : obj.flip_ver;
            var mainc = obj.maincolor;
            var secc  = obj.seccolor;
        } else if (this.level.format == "GDExt") {
            var rot = (obj.r === undefined) ? 0 : -obj.r;
            var xflip = (obj.flipx === undefined) ? false : obj.flipx;
            var yflip = (obj.flipy === undefined) ? false : obj.flipy;
            var mainc = obj.baseCol;
            var secc  = obj.decorCol;
        }

        var def = this.objectDefs[obj.id];

        if (!def)
            return;

        var maincol = this.cache.getColor(this, mainc);
        var seccol = this.cache.getColor(this, secc);

        monitor.startCategory("Object rendering");
        if (def.texture_i)
            this.renderTexture(def.texture_i, obj.x, obj.y, rot, xflip, yflip);
        if (def.texture_l)
            this.renderTexture(def.texture_l, obj.x, obj.y, rot, xflip, yflip, maincol);
        if (def.texture_b)
            this.renderTexture(def.texture_b, obj.x, obj.y, rot, xflip, yflip, seccol);
        if (def.texture_a)
            if (def.texture_l)
                this.renderTexture(def.texture_a, obj.x, obj.y, rot, xflip, yflip, seccol);
            else
                this.renderTexture(def.texture_a, obj.x, obj.y, rot, xflip, yflip, maincol);
        monitor.endCategory("Object rendering");
    }

    this.loadGDExtLevel = (level) => {
        this.level = level;
        this.level.format = "GDExt";

        var listSPs = [];
        for (const obj of this.level.data) {
            if (util.getSpeedPortal(obj))
                listSPs.push(obj);
        }
        listSPs.sort((a, b) => a.x - b.x);

        var lastSP = 0;
        var currSP = (this.level.info.speed === undefined) ? 1 : this.level.info.speed + 1;
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

        var zlayers = {};

        for (var i = -4; i < 4; i++) {
            if (i != 0) {
                zlayers[i] = [];
                for (var obj of this.level.data)
                    if (obj.z == i)
                        zlayers[i].push(obj);

                zlayers[i].sort((a, b) => (a.zlayer < b.zlayer) ? -1 : 1);
            }
        }

        this.level.zlayers = zlayers;
    }

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

    this.prepareRender = (width, height) => {
        var gl = this.gl;
        this.cache.clear();

        this.width  = width;
        this.height = height;

        gl.useProgram(this.gProg);

        util.enableBuffer(gl, this.pBuff, this.pAttr, 2);
        util.enableBuffer(gl, this.tBuff, this.tAttr, 2);

        util.setProjection(this);
    }

    this.renderLevel = (width, height, options = {}) => {
        if (!this.level)
            return;
        monitor.startFrame();
        var gl = this.gl;
        
        this.prepareRender(width, height);

        monitor.startCategory("Background rendering");

        var bgcol = this.cache.getColor(this, 1000);

        gl.viewport(0, 0, this.width, this.height);

        this.viewM = glMatrix.mat3.create();
        gl.uniformMatrix3fv(this.vmUni, false, this.viewM);

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

            this.renderLine(0, false, {r: 1, g: 1, b: 1, a: 1},   1.5, true);
            this.renderLine(0, true, {r: 0, g: 0.6, b: 0, a: 1}, 1.5, true);
        }

        util.setCamera(this);

        if (this.level)
            for (var i = -4; i < 4; i++)
                if (i != 0)
                    for (var obj of this.level.zlayers[i])
                        this.renderObject(obj);
    
        monitor.endFrame(false);
    };
}