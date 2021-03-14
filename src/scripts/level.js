import { util } from "./GDRenderW/main"
import aligns from '../assets/obj-align.json';
import utilscript from '../scripts/util';

function getChunk(x) {
    return Math.floor(x / 992);
}

export function EditorLevel(renderer, level) {
    this.level = level;
    this.level.format = "GDExt";
    this.renderer = renderer;

    this.orderSortLog    = [];
    this.reloadColorTrgs = [];
    this.reloadSpeeds    = false;
    this.reloadCTriggers = false;

    console.log( level );

    this.getObject = function(i) {
        return this.level.data[i];
    }

    this.reloadSpeedPortals = function() {
        let sps = [];
        this.level.data.forEach((obj, i) => {
            if (util.getSpeedPortal(obj))
                sps.push(i);
        });

        sps.sort((a, b) => this.level.data[a].x - this.level.data[b].x );

        let lastSP = 0;
        let currSP = parseInt((this.level.info.speed === undefined) ? 1 : this.level.info.speed + 1);
        let secPas = 0;

        for (const i of sps) {
            let obj = this.getObject(i);
            var delta = obj.x - lastSP;
            secPas += delta / util.ups[currSP];
            obj.secx = secPas;
            currSP = util.getSpeedPortal(obj);
            lastSP = obj.x;
            this.level.data[i] = obj;
        }

        this.level.sps = sps;
    }

    this.loadCTriggers = function(color) {
        var listCOLs = [];

        this.level.data.forEach((obj, i) => {
            if (obj.type == "trigger" && obj.info == "color" && (obj.color == "" + color || (color == 1 && !obj.color)))
                listCOLs.push(i);
        });

        if (listCOLs.length == 0)
            return;

        listCOLs.sort((a, b) => this.getObject(a).x - this.getObject(b).x);

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

        for (const i of listCOLs) {
            let obj = this.getObject(i);
            var delta = util.xToSec(level, obj.x) - util.xToSec(level, lastCOL.x);
            if (delta < lastCOL.duration) {
                curCol = util.blendColor(curCol, util.longToShortCol(lastCOL), delta / lastCOL.duration);
            } else {
                curCol = util.longToShortCol(lastCOL);
            }
            obj.curCol = curCol;
            lastCOL = obj;
        }
        
        this.level.cts[color] = listCOLs;
    }

    this.removeObjectZList = function(key, chunkn, layern) {
        let chunk = this.level.lchunks[chunkn];

        if (chunk) {
            let layer = chunk[layern];
            if (layer) {
                let o = layer.indexOf(key);
                if (o != -1)
                    layer.splice(o, 1);
            }
        }
    }

    this.addZSort = function(chunk, layer) {
        for (let sort of this.orderSortLog)
            if (sort.c == chunk && sort.l == layer)
                return;
        this.orderSortLog.push({c: chunk, l: layer});
    }

    this.moveObjectZList = function(key, obj, chunk, layer) {
        if (getChunk(obj.x) != chunk || obj.z != layer) {
            this.removeObjectZList(key, getChunk(obj.x), obj.z);

            let chk = this.level.lchunks[chunk];

            if (!chk) {
                this.level.lchunks[chunk] = {};
                chk = {};
            }

            let lay = chk[layer];

            if (!lay)
                lay = [];

            lay.push(key);
            this.level.lchunks[chunk][layer] = lay;

            this.addZSort(chunk, layer);
        }
    }

    this.addColorT = function(color) {
        if (this.reloadColorTrgs.indexOf(color) != -1) {
            this.reloadColorTrgs.push(color);
        }
    }

    this.sortZLayer = function(chunk, layer) {
        this.level.lchunks[chunk][layer].sort((a, b) => (this.getObject(a).zorder < this.getObject(b).zorder) ? -1 : 1);
    }

    this.editObject = function(key, props) {
        let obj = this.getObject(key);

        let zprp = obj.z;
        let xprp = obj.x;

        if (props.z)
            zprp = props.z;
        if (props.x)
            xprp = props.x;

        this.moveObjectZList(key, obj, getChunk(xprp), zprp);

        if (obj.type == "trigger" && obj.info == "color") {
            if (!props.color) {
                if (obj.color != props.color) {
                    this.addColorT(obj.color);
                    this.addColorT(props.color);
                }
            } else
                this.addColorT(obj.color);
        }
        if (util.getSpeedPortal(obj))
            this.reloadSpeeds = true;

        for (var prop in props) {
            if (Object.prototype.hasOwnProperty.call(props, prop)) {
                this.level.data[key][prop] = props[prop];
            }
        }
    }

    this.confirmEdit = function() {
        for (let srt of this.orderSortLog) {
            this.sortZLayer(srt.c, srt.l);
        }

        if (this.reloadSpeeds) {
            this.reloadSpeedPortals();
            for (let i = 0; i < 1010; i++)
                this.loadCTriggers(i);
        } else if (this.reloadCTriggers) {
            this.loadCTriggers(i);
        } else if (this.reloadColorTrgs.length != 0) {
            for (let cl of this.reloadColorTrgs)
                this.loadCTriggers(ct);
        }
        
        this.orderSortLog = [];
        this.reloadColorTrgs = [];

        utilscript.setUnsavedChanges(true);
    }

    this.isInObject = function(key, x, y) {
        let obj = this.getObject(key);
        let def = renderer.objectDefs[obj.id];

        if (!def)
            return;

        let texture;

        if (def.texture_i)
            texture = def.texture_i;
        else if (def.texture_a)
            texture = def.texture_a;
        else if (def.texture_b)
            texture = def.texture_b;
        else if (def.texture_l)
            texture = def.texture_l;

        if (!texture)
            return;

        let width =  texture.w / 62 * 30;
        let height = texture.h / 62 * 30;

        let left  = parseFloat(obj.x) - width/2;
        let right = parseFloat(obj.x) + width/2;
        let top   = parseFloat(obj.y) + height/2;
        let bot   = parseFloat(obj.y) - height/2;

        let bool = (x >= left && x <= right && y <= top && y >= bot);

        return bool;
    }

    this.getObjectsAt = function(x, y) {
        let currChunk = getChunk(x);
        let extChunk;

        let objs = [];

        if (currChunk * 992 + 496 > x)
            extChunk = getChunk(x) - 1;
        else
            extChunk = getChunk(x) + 1;

        if (this.level.lchunks[currChunk])
            for (let i = -4; i < 5; i++)
                if (i != 0 && this.level.lchunks[currChunk][i])
                    for (let key of this.level.lchunks[currChunk][i])
                        if (this.isInObject(key, x, y))
                            objs.push(key);

        if (this.level.lchunks[extChunk])
            for (let i = -4; i < 5; i++)
                if (i != 0 && this.level.lchunks[extChunk][i])
                    for (let key of this.level.lchunks[extChunk][i])
                        if (this.isInObject(key, x, y))
                            objs.push(key);

        return objs;
    }

    this.addObject = function(obj) {
        let key = this.level.data.findIndex(Object.is.bind(null, undefined));

        if (key != -1)
            this.level.data[key] = obj;
        else
            key = this.level.data.push(obj) - 1;

        let chunk = this.level.lchunks[getChunk(obj.x)];

        if (!chunk) {
            this.level.lchunks[getChunk(obj.x)] = {};
            chunk = {};
        }

        let layer = chunk[obj.z];

        if (layer) {
            layer.push(key);
            this.addZSort(getChunk(obj.x), obj.z);
        } else
            this.level.lchunks[Math.floor(obj.x / 992)][obj.z] = [key];
    }

    this.createObject = function(id, x = 0, y = 0, grid_align = false) {
        let def = renderer.objectDefs[id];
        if (grid_align) {
            let alg = aligns[id];
            console.log(alg);
            if (alg) {
                if (alg.alignX == "left") {
                    x = x - 15 + def.width / 2;
                } else if (alg.alignX == "right") {
                    x = x + 15 - def.width / 2;
                } else if (alg.alignX != "center") {
                    x = x + alg.alignX;
                }

                if (alg.alignY == "bottom") {
                    y = y - 15 + def.height / 2;
                } else if (alg.alignY == "top") {
                    y = y + 15 - def.height / 2;
                } else if (alg.alignY != "center") {
                    y = y + alg.alignY;
                }
            }
        }
        let ret = {id: id, baseCol: def.maincol, x: x, y: y, z: def.zlayer, zorder: def.zorder};

        if (def.seccol != null)
            ret.decorCol = def.seccol;

        return ret;
    }

    this.getLevel = function() {
        return this.level;
    }

    this.removeObject = function(i) {
        let obj = this.level.data[i];
        delete this.level.data[i];

        if (!obj)
            return;
        let chunk = this.level.lchunks[getChunk(obj.x)];

        if (chunk) {
            let layer = chunk[obj.z];
            if (layer) {
                let o = layer.indexOf(i);
                if (o != -1)
                    layer.splice(o, 1);
            }
        }

        if (obj.type == "trigger" && obj.info == "color")
            this.loadCTriggers(parseInt(obj.color));

        if (util.getSpeedPortal(obj))
            this.reloadSpeeds = true;
    }

    this.reloadSpeedPortals();

    this.level.cts = {};
    for (var i = 1; i < 1010; i++)
        this.loadCTriggers(i);

    for (var obj of this.level.data) {
        if (!obj.z) {
            if (renderer.objectDefs[obj.id] != undefined)
                obj.z = renderer.objectDefs[obj.id].zlayer;
            else
                obj.z = -1;
        } else {
            obj.z = util.zorder[obj.z];
            if (!obj.z)
                obj.z = renderer.objectDefs[obj.id].zlayer;
        }

        if (!obj.order) {
            if (renderer.objectDefs[obj.id] != undefined)
                obj.order = renderer.objectDefs[obj.id].zorder;
            else
                obj.order = 5;
        }

        if (obj.baseCol == undefined)
            if (renderer.objectDefs[obj.id] != undefined)
                obj.baseCol = renderer.objectDefs[obj.id].maincol
            else
                obj.baseCol = 1004;
        
        if (obj.decorCol == undefined)
            if (renderer.objectDefs[obj.id] != undefined)
                if (renderer.objectDefs[obj.id].seccol != 0)
                    obj.decorCol = renderer.objectDefs[obj.id].seccol;
    }

    var zlayers = {};

    var lchunks = {};

    this.level.data.forEach((obj, i) => {
        let chunk = lchunks[Math.floor(obj.x / 992)];
        if (!chunk)
            chunk = {};

        if (!chunk[obj.z])
            chunk[obj.z] = [];

        chunk[obj.z].push(i);
        lchunks[Math.floor(obj.x / 992)] = chunk;
    });

    for (var chunk in lchunks)
        if (lchunks.hasOwnProperty(chunk))
            for (var zid in lchunks[chunk])
                if (lchunks[chunk].hasOwnProperty(zid)) {
                    var zlayer = lchunks[chunk][zid];
                    zlayer.sort((a, b) => (this.getObject(a).zorder < this.getObject(b).zorder) ? -1 : 1);
                    lchunks[chunk][zid] = zlayer;
                }

    this.level.lchunks = lchunks;
}