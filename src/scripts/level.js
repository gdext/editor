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

    this.getObject = function(i) {
        return this.level.data[i];
    }

    this.reloadSpeedPortals = function() {
        let sps = [];
        this.level.data.forEach((obj, i) => {
            if (util.getSpeedPortal(obj) != null)
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
        let level  = this.level;

        let objs   = level.data;
        let ctriggers = [];

        let base   = level.info.colors.filter(f => f.channel == color);

        if (base.length > 0) base = base[0]
        else base = {r: 255, g: 255, b: 255, a: 255};

        objs.forEach((obj, i) => {
            if (obj.type == "trigger" &&
                obj.info == "color" &&
                (obj.color || 1) == color)
                ctriggers.push(i);
        });

        ctriggers.sort( (a, b) => objs[a].x - objs[b].x );

        let pcol = {r: base.r, g: base.g, b: base.b};
        let ccol = pcol;

        let csec = -100000;
        let cdur = 0;

        for (let i of ctriggers) {
            let obj   = objs[i];
            let delta = util.xToSec(level, obj.x) - csec;

            pcol =  util.blendColor(pcol, ccol, Math.min(delta / cdur, 1));
            ccol =  util.longToShortCol(obj);

            csec += delta;
            cdur =  obj.duration;

            obj.curCol = pcol;
        }
        
        this.level.cts[color] = ctriggers;
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
        if (util.getSpeedPortal(obj) != null)
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

    this.getObjectDimensions = function(obj) {
        let def = this.renderer.objectDefs[obj.id];

        if (!def)
            return {
                width:  0,
                height: 0
            };

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
            return {
                width:  0,
                height: 0
            };

        return {
            width:  texture.w / 62 * 30 * (+obj.scale || 1),
            height: texture.h / 62 * 30 * (+obj.scale || 1)
        }
    }

    this.getObjectRect = function(obj) {
        let dim = this.getObjectDimensions(obj);

        return {
            left:   +obj.x - dim.width/2,
            right:  +obj.x + dim.width/2,
            top:    +obj.y + dim.height/2,
            bottom: +obj.y - dim.height/2
        };
    }

    this.isInObject = function(key, x, y) {
        let obj = this.getObject(key);
        let r = this.getObjectRect(obj);

        /* TODO: Support for rotated objects */

        return x >= r.left && x <= r.right && y <= r.top && y >= r.bottom;
    }

    this.rotatePoint = function(cosRot, sinRot, point) {
        return {
            x: point[0] * cosRot + point[1] * sinRot,
            y: -(point[0] * sinRot) + point[1] * cosRot
        };
    }

    this.invertRotatePoint = function(cosRot, sinRot, point) {
        return {
            x: point[0] * cosRot - point[1] * sinRot,
            y: point[0] * sinRot + point[1] * cosRot
        };
    }

    this.rotatePointAroundOrigin = function(cosRot, sinRot, origin, point) {
        let ret = this.rotatePoint(cosRot, sinRot, [point[0] - origin[0], point[1] - origin[1]]);

        ret.x += origin[0];
        ret.y += origin[1];
        
        return ret;
    }

    this.invertRotatePointAroundOrigin = function(cosRot, sinRot, origin, point) {
        let ret = this.invertRotatePoint(cosRot, sinRot, [point[0] - origin[0], point[1] - origin[1]]);

        ret.x += origin[0];
        ret.y += origin[1];
        
        return ret;
    }

    this.objRectPoints = function(cosRot, sinRot, obj) {
        let dim = this.getObjectDimensions(obj);
        dim = {width: dim.width / 2, height: dim.height / 2};
        return [
            this.rotatePointAroundOrigin(cosRot, sinRot, [+obj.x, +obj.y], [
                +obj.x - dim.width,
                +obj.y - dim.height
            ]),
            this.rotatePointAroundOrigin(cosRot, sinRot, [+obj.x, +obj.y], [
                +obj.x + dim.width,
                +obj.y - dim.height
            ]),
            this.rotatePointAroundOrigin(cosRot, sinRot, [+obj.x, +obj.y], [
                +obj.x - dim.width,
                +obj.y + dim.height
            ]),
            this.rotatePointAroundOrigin(cosRot, sinRot, [+obj.x, +obj.y], [
                +obj.x + dim.width,
                +obj.y + dim.height
            ])
        ];
    }

    this.collidesWithObject = function(key, box) {
        let obj = this.getObject(key);
        let r = this.getObjectRect(obj);

        let cosRot = Math.cos((+obj.r || 0) / 180 * Math.PI);
        let sinRot = Math.sin((+obj.r || 0) / 180 * Math.PI);

        let points = this.objRectPoints(cosRot, sinRot, obj);

        for (let p of points)
            if (p.x >= box.left   && p.x <= box.right &&
                p.y >= box.bottom && p.y <= box.top) return true;

        let selectPoint = [
            [box.left, box.top],
            [box.right, box.top],
            [box.left, box.bottom],
            [box.right, box.bottom]
        ];

        for (let i = 0; i < 4; i++)
            selectPoint[i] = this.invertRotatePointAroundOrigin(cosRot, sinRot, [+obj.x, +obj.y], selectPoint[i]);

        for (let p of selectPoint)
            if (p.x >= r.left   && p.x <= r.right &&
                p.y >= r.bottom && p.y <= r.top) return true;

        return false;
    }

    this.getObjectsAt = function(x, y) {
        let objs = [];

        for (let i = 0; i < this.level.data.length; i++)
             if (this.level.data[i] && this.isInObject(i, x, y))
                  objs.push(i);

        return objs;
    }

    this.getObjectsIn = function(rect) {
        let objs = [];

        let camB = Math.floor( rect.x / 992 );
        let camE = Math.floor( (rect.x + rect.w) / 992 );

        let r = {
            left:   rect.x,
            right:  rect.x + rect.w,
            top:    rect.y + rect.h,
            bottom: rect.y
        };

        for (let i = 0; i < this.level.data.length; i++)
             if (this.level.data[i] && this.collidesWithObject(i, r))
                  objs.push(i);

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

        if (util.getSpeedPortal(obj) != null)
            this.reloadSpeeds = true;

        let layer = chunk[obj.z];

        if (layer) {
            layer.push(key);
            this.addZSort(getChunk(obj.x), obj.z);
        } else
            this.level.lchunks[Math.floor(obj.x / 992)][obj.z] = [key];

        return key;
    }

    this.createObject = function(id, x = 0, y = 0, grid_align = false) {
        let def = renderer.objectDefs[id];
        if (grid_align) {
            let alg = aligns[id];
            if (alg) {
                if (alg.alignX == "left")
                    x = x - 15 + def.width / 2;
                else if (alg.alignX == "right")
                    x = x + 15 - def.width / 2;
                else if (alg.alignX != "center")
                    x = x + alg.alignX;

                if (alg.alignY == "bottom")
                    y = y - 15 + def.height / 2;
                else if (alg.alignY == "top")
                    y = y + 15 - def.height / 2;
                else if (alg.alignY != "center")
                    y = y + alg.alignY;
            }
        }
        let ret = {id: id, x: x, y: y, z: def.zlayer, zorder: def.zorder};

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

        if (util.getSpeedPortal(obj) != null)
            this.reloadSpeeds = true;
    }

    this.reloadSpeedPortals();

    this.level.cts = {};
    for (var i = 1; i < 1010; i++)
        this.loadCTriggers(i);

    for (var obj of this.level.data) {
        const def = renderer.objectDefs[obj.id];

        if (!obj.z)
            obj.z = ( def ? def.zlayer : null ) || -1;
        else
            obj.z = util.zorder[obj.z] ||
                    ( def ? def.zlayer : null ) || -1;

        obj.order = obj.order || ( def ? def.zorder : null ) || 5;
    }

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