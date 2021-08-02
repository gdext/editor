import { util } from "./main"
import aligns from '../../assets/obj-align.json';
import utilscript from '../util';

import levelparse from './levelparse';

function getChunk(x) {
    return Math.floor(x / 992);
}

// By Parthik Gosar on Stack Overflow
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// By Parthik Gosar on Stack Overflow
function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return {
        h: h,
        s: s,
        v: v
    };
}

function changeByHSV(color, hsv) {
    let hsv_col = RGBtoHSV(color.r * 255, color.g * 255, color.b * 255);

    const loop = (v, max) => Math.abs( v % max ) / max;
    const bcol = (rgb) => new BaseColor(rgb.r / 255, rgb.g / 255, rgb.b / 255, color.opacity, color.blending);

    return bcol( HSVtoRGB( {
        h: loop( ( hsv_col.h * 360 + hsv.h ), 360 ),
        s: hsv.s_add ? loop( hsv_col.s * 100 + hsv.s, 100 ) : hsv_col.s * hsv.s,
        v: hsv.v_add ? loop( hsv_col.v * 100 + hsv.v, 100 ) : hsv_col.v * hsv.v
    } ) );
}

export function blendComp(c1, c2, blend) {
    return c1 * (1-blend) + c2 * blend;
}

export function blendColor(col1, col2, blend) {
    return {
        r: blendComp(col1.r, col2.r, blend),
        b: blendComp(col1.b, col2.b, blend),
        g: blendComp(col1.g, col2.g, blend),
        a: blendComp(col1.opacity, col2.opacity, blend)
    };
}

function lightBG(bg, p1) {
    let hsv = RGBtoHSV(bg);
    hsv.s -= 0.20;

    let ret = blendColor( p1, HSVtoRGB(hsv), hsv.v );
    return new BaseColor(ret.r, ret.g, ret.b, 1, true);
}

export function BaseColor(r, g, b, opacity = 1, blending = false) {
    this.type = 'BaseColor';

    this.r = r;
    this.g = g;
    this.b = b;

    this.opacity  = opacity;
    this.blending = blending;

    this.blendWith = (color, blend, blending = false) => {
        let ret = blendColor(this, color, blend);
        return new BaseColor(ret.r, ret.g, ret.b, ret.a, blending);
    }
}

export function colorFromRGBA(r, g, b, opacity = 1, blending = false) {
    return new BaseColor(r / 255, g / 255, b / 255, opacity, blending);
}

export function PlayerColor(player_color, opacity = 1, blending = false) {
    this.type = 'PlayerColor';

    this.color = player_color;

    this.opacity  = opacity;
    this.blending = blending;
}

export function CopyColor(copy_color, blending, copy_opacity, opacity, copy_hsv) {
    this.type = 'CopyColor';

    this.copy_color   = copy_color;
    this.blending     = blending;

    this.copy_opacity = copy_opacity;
    this.opacity      = opacity;

    this.copy_hsv     = copy_hsv;
}

export function MixedColor(color1, color2, blend) {
    this.type = 'MixedColor';

    this.color1 = color1;
    this.color2 = color2;

    this.blend  = blend;
}

export function createMixedColor(color1, color2, blend) {
    if (blend <= 0) return color1;
    if (blend >= 1) return color2;
    if (color1.type == "BaseColor" && color2.type == "BaseColor")
        return color1.blendWith(color2, blend, color2.blending);
    else
        return new MixedColor(color1, color2, blend);
}

export function createColorClass(r, g, b, pc, blending, copy_opacity, opacity, copy_color, copy_hsv) {
    if (copy_color != 0)
        return new CopyColor(copy_color, blending, copy_opacity, opacity, copy_hsv);

    if (pc != 0)
        return new PlayerColor(pc, opacity, blending);

    return new BaseColor(r, g, b, opacity, blending);
}

export function parseHSV(hsv) {
    return {
        h: +hsv[0],
        s: +hsv[1],
        s_add: hsv[3] == 1,
        v: +hsv[2],
        v_add: hsv[4] == 1
    };
}

export function getTriggerColor(trig) {
    return createColorClass(
        +trig.red / 255,
        +trig.green / 255,
        +trig.blue / 255,
        trig.pCol1 ? 1 : ( trig.pCol2 ? 2 : 0 ),
        trig.blending || false,
        trig.copyOpacity || false,
        +trig.opacity  || 1,
        +trig.copiedID || 0,
        parseHSV(trig.copiedHSV || [0, 1, 1, 0, 0])
    );
}

export function getFirstColor(base) {
    const ret = createColorClass(
        +base.r / 255,
        +base.g / 255,
        +base.b / 255,
        base.pcolor == -1 ? 0 : +base.pcolor,
        base.blending || false,
        base.copyalpha || false,
        +base.alpha || 1,
        +base.copychannel || 0,
        parseHSV(base.copiedHSV || [0, 1, 1, 0, 0])
    );
    return ret;
}

export function EditorLevel(renderer, level) {
    this.renderer = renderer;

    this.orderSortLog    = [];
    this.reloadColorTrgs = [];
    this.reloadSpeeds    = false;
    this.reloadCTriggers = false;

    this.player_colors = [
        new BaseColor(1, 0.5, 0.5),
        new BaseColor(0.5, 0.5, 1)
    ];

    if (typeof level == "string")
        this.level = levelparse.code2object(level);
    else
        this.level = level;

    this.level.format = "gdext";
    
    /**
     * This interpolates the 2 color components depending on the `blend` value
     * @param {number} c1 color component 1
     * @param {number} c2 color component 2
     * @param {number} blend blend amount `0 - 1`
     * @returns result blend
     */
     this.blendComp = (c1, c2, blend) => {
        return c1 * (1-blend) + c2 * blend;
    }
    /**
     * This interpolates the 2 color values depending on the `blend` value
     * @param {{r: number, g: number, b: number}} col1 color value 1
     * @param {{r: number, g: number, b: number}} col2 color value 2
     * @param {number} blend blend amount `0 - 1`
     * @returns result blend
     */
    this.blendColor = (col1, col2, blend) => {
        let ret = {r: this.blendComp(col1.r, col2.r, blend), b: this.blendComp(col1.b, col2.b, blend), g: this.blendComp(col1.g, col2.g, blend)};
        if (col1.a) ret.a = this.blendComp(col1.a, col2.a, blend);

        return ret;
    }

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

    this.pickColor = (o) => {
        return { r: o.r / 255, g: o.g / 255, b: o.b / 255, a: o.a };
    }

    this.pickColorFromTrigger = (o) => {
        return { r: o.red / 255, g: o.green / 255, b: o.blue / 255, a: o.opacity || 1 };
    }

    this.getBaseColor = (color) => {
        let base  = this.level.info.colors.filter(f => f.channel == color);

        if (base.length > 0) return getFirstColor(base[0]);
        else return new BaseColor(1, 1, 1, 1, false);
    }

    this.fetchColor = (color, x, log = {}) => {
        if (color.type == "BaseColor") return color;
        else if (color.type == "PlayerColor") {
            let col = this.player_colors[color.color - 1];
            return new BaseColor(col.r, col.g, col.b, color.opacity, color.blending);
        } else if (color.type == "CopyColor") {
            let col = this.getColorAt(x, color.copy_color, log);

            if (!color.copy_opacity) col.opacity = color.opacity;
            col.blending = color.blending;

            col = changeByHSV(col, color.copy_hsv);
            return col;
        } else if (color.type == "MixedColor") {
            let c1 = this.fetchColor( color.color1, x );
            let c2 = this.fetchColor( color.color2, x );

            return c1.blendWith( c2, color.blend, c2.blending );
        } else return new BaseColor(1, 1, 1, 1, false);
    }

    this.colorTriggerBlend = (pX, nX, pDuration) => {
        let pSec = this.getTimeAt(pX);
        let nSec = this.getTimeAt(nX);

        return (nSec - pSec) / pDuration;
    }

    this.pulseTriggerBlend = (pX, nX, pFadeIn, pHold, pFadeOut) => {
        let pSec = this.getTimeAt(pX);
        let nSec = this.getTimeAt(nX);

        let fiSec = this.getTimeAt(pX + pFadeIn);
        let hSec = this.getTimeAt(pX + pFadeIn + pHold);

        if (nSec < fiSec) return (nSec - pSec) / pFadeIn;
        else if (nSec < hSec) return 1;
        else return 1 - (nSec - hSec) / pFadeOut;
    }

    this.loadCTriggers = function(color) {
        let level = this.level;
        let data  = level.data;

        let base = this.getBaseColor(color);

        let trgs = [];

        for (let [k, v] of Object.entries(data))
            if (v.type == 'trigger' &&
                v.info == 'color' &&
                util.getColorTriggerChannel(v) == color)
                trgs.push(k);
        
        trgs.sort( (a, b) => data[a].x - data[b].x );

        let pX        = -1000000000;
        let pDuration = 0;
        
        let bColor, eColor = base;

        for (let k of trgs) {
            let o = data[k];

            bColor = createMixedColor( bColor, eColor, this.colorTriggerBlend(pX, +o.x, pDuration) );
            eColor = getTriggerColor(o);

            pX        = +o.x;
            pDuration = +o.duration;

            o.begin_color = bColor;
            o.end_color   = eColor;
        }

        this.level.cts[color] = trgs;
    }

    this.getTimeAt = (x) => {
        let level = this.level;

        let base = (+level.info.speed || 0) + 1;
        let portal;

        for (let k of level.sps) {
            let sp = level.data[k];

            if (+sp.x >= +x) break;
            portal = sp;
        }

        if (!portal) return +x / util.ups[base];
        else {
            let spd = util.getSpeedPortal(portal);
            return portal.secx + (x - +portal.x) / util.ups[spd];
        }
    },

    this.getColorAt = (x, col, log = {}) => {
        switch (+col) {
        case 1005: return new BaseColor(1, 0, 0);
        case 1006: return new BaseColor(1, 0, 0);
        case 1007: return lightBG(this.getColorAt(x, 1000, log), this.player_colors[0]);
        }

        let level = this.level;
        let base = this.getBaseColor( col );

        let trigger;
        if (level.cts[col])
            for (let k of level.cts[col]) {
                let trg = level.data[k];

                if (+trg.x >= x) break;
                trigger = trg;
            }

        if (log[col])
            if (log[col] == 4) return new BaseColor(1, 1, 1);
            else log[col]++;
        else log[col] = 1;

        if (trigger) {
            return this.fetchColor(
                createMixedColor( 
                    trigger.begin_color,
                    trigger.end_color,
                    this.colorTriggerBlend(+trigger.x, x, +trigger.duration)
                ),
                x,
                log
            );
        }
        else return this.fetchColor( base, x, log );
    },

    this.removeObjectZList = function(key, chunkn, layern) {
        let chunk = this.level.lchunks[chunkn];

        if (chunk) {
            let layer = chunk[layern];

            if (layer) {
                let o = Math.max(layer.indexOf(key + ""), layer.indexOf(+key));
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

    this.moveObjectZList = function(key, obj, chunk, layer, order) {
        if (getChunk(obj.x) != chunk || obj.z != layer || obj.order != order) {
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
        this.level.lchunks[chunk][layer].sort((a, b) => (this.getObject(a).order < this.getObject(b).order) ? -1 : 1);
    }

    this.editObject = function(key, props) {
        let obj = this.getObject(key);

        let zprp = obj.z;
        let oprp = obj.order;
        let xprp = obj.x;

        if (props.z)
            zprp = props.z;
        if (props.order)
            oprp = props.order;
        if (props.x)
            xprp = props.x;

        this.moveObjectZList(key, obj, getChunk(xprp), zprp, oprp);

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

    this.compareArray = function(a1, a2) {
        if (a1.length != a2.length) return false;
        for (let i of a1) if (!a2.includes(i)) return false;
        return true;
    }

    this.cycleObjects = [];
    this.cycleIndex   = 0;

    this.cycleObjectAt = function(x, y) {
        let objs = this.getObjectsAt(x, y);

        if (objs.length == 0) return null;

        objs.sort((a, b) => {
            let o1 = this.level.data[a];
            let o2 = this.level.data[b];

            let l1 = o1.z;
            let l2 = o2.z;

            if (!l1) l1 = renderer.objectDefs[o1.id].zlayer;
            if (!l2) l2 = renderer.objectDefs[o2.id].zlayer;

            let delta = l1 - l2;
            if (delta != 0) return delta;

            let z1 = o1.order;
            let z2 = o2.order;

            if (!z1) z1 = renderer.objectDefs[o1.id].zorder;
            if (!z2) z2 = renderer.objectDefs[o2.id].zorder;

            return z1 - z2;
        });
        objs.reverse();

        if (this.cycleObjects.length == 0) {
            this.cycleObjects = objs;
            this.cycleIndex   = 0;
        } else
            if (this.compareArray(objs, this.cycleObjects)) {
                this.cycleIndex++;
                if(this.cycleIndex >= this.cycleObjects.length) this.cycleIndex = 0;
            } else {
                this.cycleObjects = objs;
                this.cycleIndex   = 0;
            }

        return this.cycleObjects[this.cycleIndex];
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
        let ret = {id: id, x: x, y: y, z: def.zlayer, order: def.zorder};

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

    let zlayers = [-3, -1, 1, 3, 5, 7, 9];

    for (var obj of this.level.data) {
        const def = renderer.objectDefs[obj.id];

        if (!obj.z)
            obj.z = ( def ? util.exportZLayer(def.zlayer) : null ) || -1;
        
        if (!zlayers.includes(obj.z))
            obj.z = util.exportZLayer(def.zlayer);

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
                    zlayer.sort((a, b) => (this.getObject(a).order < this.getObject(b).order) ? -1 : 1);
                    lchunks[chunk][zid] = zlayer;
                }

    this.level.lchunks = lchunks;
}