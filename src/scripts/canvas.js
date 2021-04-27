import {GDRenderer} from './GDRenderW/main';
import {EditorLevel} from './level';
import TopCanvas from './topcanvas';

let gl, renderer, cvs, options, level, top, sel;

let selectedObjs = [];

// this file contains all the high-levels functions to work with the renderer
// (load level, update screen, move camera, edit stuff, etc.)
export default {
    init: (canvas, top_canvas) => {
        options = {
            grid: true,
            custom_colors: {
                "-1": {r: 0, g: 0.7, b: 1, a: 1}
            }
        };
        gl = canvas.getContext("webgl");
        renderer = new GDRenderer(gl);
        cvs = canvas;

        top = new TopCanvas(top_canvas);
    },
    getLevel: () => {
        return level.getLevel();
    },
    update: (canvas) => {
        if(!canvas) return;
        renderer.renderLevel(level, canvas.width, canvas.height, options);
    },
    moveTo: (x, y, z) => {
        renderer.camera.x = x;
        renderer.camera.y = y;
        renderer.camera.zoom = z;

        if (sel) {
            let p1 = renderer.levelToScreenPos(sel.x1, sel.y1);
            let p2 = renderer.levelToScreenPos(sel.x2, sel.y2);

            top.setSelectionBox({
                x1: p1.x,
                y1: p1.y,
                x2: p2.x,
                y2: p2.y
            });
        }
    },
    getCoords: () => {
        return { x: renderer.camera.x, y: renderer.camera.y, z: renderer.camera.zoom }
    },
    setOption: (opt, val) => {
        options[opt] = val;
    },
    toggleOption: (opt) => {
        options[opt] = !options[opt];
    },
    initLevel: (lvl) => {
        level = new EditorLevel(renderer, lvl);
    },
    getObjects: (x, y) => {
        return level.getObjectsAt(x, y);
    },
    getObjectsFromRect: (rect) => {
        return level.getObjectsIn(rect);
    },
    screen2LevelCoords: (x, y) => {
        return renderer.screenToLevelPos(x, y);
    },
    beginSelectionBox: (x, y) => {
        let pos = renderer.screenToLevelPos(x, y);
        sel = {x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y};
    },
    selectTo: (x, y) => {
        let pos = renderer.screenToLevelPos(x, y);

        if(!sel) return;

        sel.x2 = pos.x;
        sel.y2 = pos.y;
        
        let p1 = renderer.levelToScreenPos(sel.x1, sel.y1);
        let p2 = renderer.levelToScreenPos(sel.x2, sel.y2);

        top.setSelectionBox({
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y
        });
    },
    selectObjectInSel: (sel) => {
        let x = Math.min(sel.x1, sel.x2);
        let y = Math.min(sel.y1, sel.y2);
        let w = Math.max(sel.x1, sel.x2) - x;
        let h = Math.max(sel.y1, sel.y2) - y;

        let rect = { x: x, y: y, w: w, h: h };

        let objids = level.getObjectsIn(rect);
        selectedObjs = objids;
        console.log(objids);

        options.colored_objects = {};
        objids.forEach(o => {
            options.colored_objects[o] = {
                base: -1,
                decor: -1
            }
        });
        renderer.renderLevel(level, cvs.width, cvs.height, options);
    },
    selectObjectAt: (x, y) => {
        let p = renderer.screenToLevelPos(x, y);
        console.log(p);
        level.getObjectsAt(p.x, p.y);
        let objid = top.setSelectionBox(sel);
        selectedObjs = [objid];
    },
    clearSelected: () => {
        selectedObjs = [];
        options.colored_objects = {};
        renderer.renderLevel(level, cvs.width, cvs.height, options);
    },
    closeSelectionBox: () => {
        sel = null;
        top.setSelectionBox(sel);
    },
    getSelection: () => {
        return sel;
    },
    getSelectedObjects: () => {
        return selectedObjs;
    },
    placeObject: (opt) => {
        if(!level) return;
        switch (opt.mode) {
            case 'add':
                if(Array.isArray(opt.data)) {
                    opt.data.forEach(d => {
                        let obj = level.createObject(d.id, d.x, d.y, true);
                        level.addObject(obj);
                    });
                } else {
                    let obj = level.createObject(opt.data.id, opt.data.x, opt.data.y, true);
                    level.addObject(obj);
                }
                level.confirmEdit();
                break;
            case 'remove':
                if(Array.isArray(opt.data)) {
                    opt.data.forEach(d => {
                        level.removeObject(d.id);
                    });
                } else {
                    level.removeObject(opt.data.id);
                }
                level.confirmEdit();
                break;
            case 'edit':
                if(Array.isArray(opt.data)) {
                    opt.data.forEach(d => {
                        level.editObject(d.id, opt.props);
                    });
                } else {
                    level.editObject(opt.data.id, opt.props);
                }
                level.confirmEdit();
                break;
            }
        renderer.renderLevel(level, cvs.width, cvs.height, options);
    }
}