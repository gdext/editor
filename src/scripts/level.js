import { util } from "./GDRenderW/main"

export function EditorLevel(renderer, level) {
    this.level = level;
    this.level.format = "GDExt";
    this.renderer = renderer;

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

    this.addObject = function(obj) {
        let key = this.level.data.findIndex(Object.is.bind(null, undefined));

        if (key != -1)
            this.level.data[key] = obj;
        else
            key = this.level.data.push(obj) - 1;

        console.log("A");

        let chunk = this.level.lchunks[Math.floor(obj.x / 992)];

        if (!chunk)
            this.level.lchunks[Math.floor(obj.x / 992)] = {};

        let layer = chunk[obj.z];

        console.log("B");

        if (layer) {
            layer.push(key);
            layer.sort((a, b) => (this.getObject(a).zorder < this.getObject(b).zorder) ? -1 : 1);

            this.level.lchunks[Math.floor(obj.x / 992)][obj.z] = layer;
        } else
            this.level.lchunks[Math.floor(obj.x / 992)][obj.z] = [key];
    }

    this.createObject = function(id, x = 0, y = 0) {
        let def = renderer.objectDefs[id];
        let ret = {id: id, baseCol: def.maincol, x: x, y: y, z: def.zlayer, zorder: def.zorder};

        if (def.seccol != null)
            ret.decorCol = def.seccol;

        return ret;
    }

    console.log(renderer);

    this.removeObject = function(i) {
        let obj = this.level.data[i];
        delete this.level.data[i];

        let chunk = this.level.lchunks[Math.floor(obj.x / 992)];

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
            this.reloadSpeedPortals();
    }

    this.reloadSpeedPortals();

    this.level.cts = {};
    for (var i = 1; i < 1010; i++)
        this.loadCTriggers(i);

    for (var obj of this.level.data) {
        if (obj.z == undefined) {
            if (renderer.objectDefs[obj.id] != undefined)
                obj.z = renderer.objectDefs[obj.id].zlayer;
            else
                obj.z = -1;
        } else
            obj.z = util.zorder[obj.z];
        if (obj.order == undefined) {
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

    console.log(this);
}