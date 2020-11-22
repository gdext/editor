const util = {
    createShader: function(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success)
            return shader;
    
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    },
    createProgram: function(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success)
            return program;
        
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    },
    createBuffer: function(gl, values) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
        return buffer;
    },
    enableBuffer: function(gl, buffer, attr, size) {
        gl.enableVertexAttribArray(attr);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.vertexAttribPointer(attr, size, gl.FLOAT, false, 0, 0);
    },
    enableTexture: function(gl, texture, uniLoc) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniLoc, 0);
    },
    xToSec: function(level, x) {
        let resSP = null
        x = x / 30;
        let lspd = (level.info.speed === undefined) ? 1 : parseInt(level.info.speed + 1);
        for (let sp of level.listSPs) {
            if (sp.x >= x)
                break;
            resSP = sp;
        }
        if (resSP != null) {
            let speed = null;
            if (resSP.id == gde.sids.HALF_SPEED)  {speed = 0}
            if (resSP.id == gde.sids.ONE_SPEED)   {speed = 1}
            if (resSP.id == gde.sids.TWO_SPEED)   {speed = 2}
            if (resSP.id == gde.sids.THREE_SPEED) {speed = 3}
            if (resSP.id == gde.sids.FOUR_SPEED)  {speed = 4}
            return resSP.secx + (x - resSP.x) / gde.bps[speed];
        } else {
            return x / gde.bps[lspd];
        }
    },
    xToCOL: function(level, x, col) {
        let resCOL = null;
        let channels = level.info.colors.filter(f => f.channel == col);
        let channel = null;
        if (channels.length > 0)
            channel = channels[0];
        if (level.listCOLs[col] != undefined) {
            for (let colo of level.listCOLs[col]) {
                if (colo.x >= x)
                    break;
                resCOL = colo;
            }
        }
        if (resCOL != null) {
            let delta = this.xToSec(level, x) - this.xToSec(level, resCOL.x);
            if (col == 1000)
                console.log(level);
            if (delta < resCOL.duration)
                return this.blendColor(resCOL.curCol, {r: resCOL.red, g: resCOL.green, b: resCOL.blue}, delta / resCOL.duration);
            else
                return {r: resCOL.red, g: resCOL.green, b: resCOL.blue};
        } else
            return channel != null ? {r: channel.r, g: channel.g, b: channel.b} : {r: 255, g: 255, b: 255};
    },
    toOne: function(col) {
        return {r: col.r/255, g: col.g/255, b: col.b/255};
    },
    blendComp: function(c1, c2, blend) {
        return c1 * (1-blend) + c2 * blend;
    },
    blendColor: function(col1, col2, blend) {
        return {r: this.blendComp(col1.r, col2.r, blend), b: this.blendComp(col1.b, col2.b, blend), g: this.blendComp(col1.g, col2.g, blend)};
    }
}

const gde = {
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
}

const VERT_SRC = `
attribute vec2 a_position;
attribute vec2 a_texcoord;

uniform mat3 model;
uniform mat3 proj;
uniform mat3 view;

uniform float camx;
uniform float camy;

varying vec2 o_texcoord;

void main() {
    vec3 pos = proj * (model * vec3(a_position, 1) + vec3(camx, camy, 1));
    gl_Position = vec4((pos * view).xy, 0.0, 1.0);
    o_texcoord = a_texcoord;
}`;

const FRAG_SRC = `
precision mediump float;

varying vec2 o_texcoord;
uniform sampler2D a_sampler;

uniform vec4 a_tint;

void main() {
    gl_FragColor = texture2D(a_sampler, o_texcoord) * a_tint;
}`;

const gdr = {
    gl:    null,
    gProg: null,
    pBuff: null,
    pAttr: null,
    tBuff: null,
    tAttr: null,
    mmUni: null,
    pmUni: null,
    vmUni: null,
    cxUni: null,
    cyUni: null,
    projM: null,
    viewM: null,
    spUni: null,
    textures: {},
    zorders: {},
    camera: {x: 0, y: 0, zoom: 1},
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
    getSongUrl: function(id, f) {
        let r = new XMLHttpRequest();
        if (!parseInt(id))
            return false;
        r.open("GET", "http://localhost:8567/getSongID/" + id);
        r.onreadystatechange = () => {
            if (r.readyState != 3)
                return;
            if (r.response == "-1") {
                f(false);
                return;
            }
            f("http://localhost:8567" + r.response)
        }
        r.onerr = () => {
            f(false);
        }
        r.send();
    },
    loadColors: function(level, color) {
        var listCOLs = [];

        var channels = level.info.colors.filter(f => f.channel == color);

        if(channels.length == 0)
            return undefined;

        var channel = channels[0];

        for (const obj of level.data)
            if (obj.type == "trigger" && obj.info == "color" && obj.color == color)
                listCOLs.push(obj);

        listCOLs.sort((a, b) => a.x - b.x);

        var lastCOL = {x: -200000, red: 255, blue: 255, green: 255, duration: 0};
        var curCol  = {r: 255, g: 255, b: 255};
        if (channel != undefined) {
            lastCOL = {x: -200000, red: channel.r, blue: channel.b, green: channel.g, duration: 0};
            curCol = {r: channel.r, b: channel.b, g: channel.g};
        }

        for (const obj of listCOLs) {
            var delta = util.xToSec(level, obj.x) - util.xToSec(level, lastCOL.x);
            if (delta < lastCOL.duration) {
                curCol = util.blendColor(curCol, {r: lastCOL.red, b: lastCOL.blue, g: lastCOL.green}, delta / lastCOL.duration);
            } else {
                curCol = {r: lastCOL.red, b: lastCOL.blue, g: lastCOL.green};
            }
            obj.curCol = curCol;
            lastCOL = obj;
        }
        return listCOLs;
    },
    zlays: {
        [-3]: -4,
        [-1]: -3,
        [1]:  -2,
        [3]:  -1,
        [5]:   1,
        [7]:   2,
        [9]:   3
    },
    prepareLevel: function(level) {
        for (var obj of level.data) {
            if (obj.z == undefined) {
                if (this.zorders[obj.id] != undefined)
                    obj.z = this.zorders[obj.id].zl;
                else
                    obj.z = -1;
            } else {
                obj.z = this.zlays[obj.z];
            }
            if (obj.order == undefined) {
                if (this.zorders[obj.id] != undefined)
                    obj.order = this.zorders[obj.id].zo;
                else
                    obj.order = 5;
            }
        }
        return level;
    },
    updateChanges: function(level) {
        var listSPs = [];
        for (var obj of level.data)
            if (obj.type == "portal")
                if (obj.info == "slow" ||
                    obj.info == "normal" ||
                    obj.info == "fast" ||
                    obj.info == "faster" ||
                    obj.info == "fastest")
                    listSPs.push(obj);
        
        listSPs.sort((a, b) => a.x - b.x);

        var lastSP = 0;
        var currSP = (level.info.speed === undefined) ? gde.speed.ONE : parseInt(level.info.speed);
        var secPas = 0;

        for (const obj of listSPs) {
            var delta = obj.x - lastSP;
            secPas += delta / gde.bps[currSP];
            obj.secx = secPas;
            if (obj.info == "slow")  {currSP = 0}
            if (obj.info == "normal")   {currSP = 1}
            if (obj.info == "fast")   {currSP = 2}
            if (obj.info == "faster") {currSP = 3}
            if (obj.info == "fastest")  {currSP = 4}
            lastSP = obj.x;
        }
        
        level.listSPs = listSPs;

        var listCOLs = {};
        listCOLs[1] = this.loadColors(level, 1);
        listCOLs[2] = this.loadColors(level, 2);
        listCOLs[3] = this.loadColors(level, 3);
        listCOLs[4] = this.loadColors(level, 4);
        listCOLs[1000] = this.loadColors(level, 1000);
        listCOLs[1001] = this.loadColors(level, 1001);
        listCOLs[1002] = this.loadColors(level, 1002);
        listCOLs[1003] = this.loadColors(level, 1003);
        listCOLs[1004] = this.loadColors(level, 1004);

        var zlayers = {};

        for (var i = -4; i < 4; i++) {
            if (i != 0) {
                zlayers[i] = [];
                for (var obj of level.data)
                    if (obj.z == i)
                        zlayers[i].push(obj);

                zlayers[i].sort((a, b) => (a.z < b.z) ? -1 : 1);
            }
        }

        level.zlayers = zlayers;
        level.listCOLs = listCOLs;

        return level;
    },
    loadImage: function(url) {
        var gl = this.gl;

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        var image = new Image();

        var tex = {
            t: texture, w: 1, h: 1, i: image
        };

        image.onload = function() {
            tex.w = image.width;
            tex.h = image.height;

            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        image.src = url;

        return tex;
    },
    loadImages: function() {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var objs = JSON.parse(xhr.responseText);

                for (var i = 0; i < 2000; i++) {
                    if (objs[i] != undefined) {
                        var obj = objs[i];
                        gdr.textures[obj.id] = {};
                        if (obj.l != undefined)
                            gdr.textures[obj.id].l = gdr.loadImage("GDRenderW/obj/" + obj.l);
                        if (obj.i != undefined)
                            gdr.textures[obj.id].i = gdr.loadImage("GDRenderW/obj/" + obj.i);
                        if (obj.a != undefined) {
                            gdr.textures[obj.id].a = gdr.loadImage("GDRenderW/obj/" + obj.a);
                            gdr.textures[obj.id].o = obj.o;
                        }
                        if (obj.b != undefined)
                            gdr.textures[obj.id].b = gdr.loadImage("GDRenderW/obj/" + obj.b);
                    }
                }
            }
        }
        xhr.open("GET", "GDRenderW/obj/data.json", true);

        xhr.send();
    },
    loadZOrders: function() {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var objs = JSON.parse(xhr.responseText);

                for (var i = 0; i < 2000; i++) {
                    var obj = objs.objs[i];
                    if (obj != undefined) {
                        gdr.zorders[i] = {};
                        gdr.zorders[i].zl = objs.opts[obj].zl;
                        gdr.zorders[i].zo = objs.opts[obj].zo;
                    }
                }
            }
        }
        xhr.open("GET", "GDRenderW/obj/zorder.json", true);

        xhr.send();
    },
    init: function(gl) {
        gdr.gl = gl;

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

        this.projM = glMatrix.mat3.create();
        glMatrix.mat3.scale(this.projM, this.projM, [2/gl.canvas.width, 2/gl.canvas.height]);

        this.loadImages();
        this.loadZOrders();
    },
    renderTexture: function(tex, x, y, rot, flip, flop, tint) {
        if (tex == undefined)
            return;
        if (!tex.i.complete)
            return;
        var rx = (x - this.camera.x) * this.camera.zoom;
        var ry = (y + this.camera.y) * this.camera.zoom;

        var gl = this.gl;

        /*if (!(rx+tex.w/2+800 > -(gl.canvas.width/2) && rx-tex.w/2-800 <= gl.canvas.width/2))
            return;
        if (!(ry+tex.h/2+800 > -(gl.canvas.height/2) && ry-tex.h/2-800 <= gl.canvas.height/2))
            return;*/

        var sx = tex.w/62*30 * (flip ? -1 : 1);
        var sy = tex.h/62*30 * (flop ? -1 : 1);

        var model = glMatrix.mat3.create();
        glMatrix.mat3.translate(model, model, [x, y]);
        glMatrix.mat3.rotate(model, model, rot * Math.PI / 180);
        glMatrix.mat3.scale(model, model, [sx, sy]);

        gl.uniformMatrix3fv(this.mmUni, false, model);
        var tinted = glMatrix.vec4.create();
        tinted[0] = tint.r; tinted[1] = tint.g; tinted[2] = tint.b; tinted[3] = tint.a;
        gl.uniform4fv(gl.getUniformLocation(this.gProg, "a_tint"), tinted);

        util.enableTexture(gl, tex.t, this.spUni);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    renderObject: function(level, obj, bg) {
        var tex = this.textures[obj.id];

        if (tex == undefined)
            return;

        var lbg = {r: Math.min(255, bg.r + 44) / 255,
                   g: Math.min(255, bg.g + 44) / 255,
                   b: Math.min(255, bg.b + 44) / 255};
        
        var rot   = (obj.r === undefined) ? 0 : -obj.r;
        var flipx = (obj.flipx === undefined) ? false : obj.flipx;
        var flipy = (obj.flipy === undefined) ? false : obj.flipy;

        if (tex.i != undefined)
            this.renderTexture(tex.i, obj.x, obj.y, rot, flipx, flipy, {r: 1, g: 1, b: 1, a: 1});
        if (tex.l != undefined) {
            var tint = null;
            if (obj.baseCol != undefined)
                tint = util.xToCOL(level, gdr.camera.x, obj.baseCol);
            else
                tint = lbg;
            tint = util.toOne(tint);
            tint.a = 0.9;
            this.renderTexture(tex.l, obj.x, obj.y, rot, flipx, flipy, tint)
        }
        if (tex.b != undefined) {
            var tint = null;
            if (obj.decorCol != undefined)
                tint = util.xToCOL(level, gdr.camera.x, obj.decorCol);
            else
                tint = util.xToCOL(level, gdr.camera.x, 1);
            tint = util.toOne(tint);
            tint.a = 1;
            this.renderTexture(tex.b, obj.x, obj.y, rot, flipx, flipy, tint);
        }
        if (tex.a != undefined) {
            var tint = null;
            if (obj.baseCol != undefined)
                tint = util.xToCOL(level, gdr.camera.x, obj.baseCol);
            else
                if (tex.o || (tex.b != undefined || tex.i != undefined))
                    tint = util.xToCOL(level, gdr.camera.x, 1004);
                else
                    tint = util.xToCOL(level, gdr.camera.x, 1);
            tint = util.toOne(tint);
            tint.a = 1;
            this.renderTexture(tex.a, obj.x, obj.y, rot, flipx, flipy, tint);
        }
    },
    renderLevel: function(level) {
        var gl = this.gl

        var bgcol = util.xToCOL(level, this.camera.x, 1000);

        gl.clearColor(bgcol.r/255, bgcol.g/255, bgcol.b/255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.gProg);

        this.viewM = glMatrix.mat3.create();
        glMatrix.mat3.scale(this.viewM, this.viewM, [this.camera.zoom, this.camera.zoom]);

        util.enableBuffer(gl, this.pBuff, this.pAttr, 2);
        util.enableBuffer(gl, this.tBuff, this.tAttr, 2);

        gl.uniformMatrix3fv(this.pmUni, false, this.projM);
        gl.uniformMatrix3fv(this.vmUni, false, this.viewM);

        gl.uniform1f(this.cxUni, -this.camera.x);
        gl.uniform1f(this.cyUni, this.camera.y);

        for (var i = -4; i < 4; i++) {
            if (i != 0) {
                for (var obj of level.zlayers[i]) {
                    this.renderObject(level, obj, bgcol);
                }
            }
        }
    }
}

export default {

    init: (levelData) => {
        let canvas = document.getElementById("render"); // Takes the canvas element
        let gl = canvas.getContext("webgl"); // Gets the webgl context

        gdr.init(gl); // Initializes the engine with the context
        gdr.renderLevel(levelData); // Takes the level object and just renders it on the canvas
    }

}
