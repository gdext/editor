import {GDRenderer} from './GDRenderW/main';
import {EditorLevel} from './level';
let gl, renderer, cvs, options, level;

export default {
    init: (canvas) => {
        options = {
            grid: true
        };
        gl = canvas.getContext("webgl");
        renderer = new GDRenderer(gl);
        cvs = canvas;
    },
    update: (canvas) => {
        if(!canvas) return;
        renderer.renderLevel(level, canvas.width, canvas.height, options);
    },
    moveTo: (x, y, z) => {
        renderer.camera.x = x;
        renderer.camera.y = y;
        renderer.camera.zoom = z;
    },
    getCoords: () => {
        return { x: renderer.camera.x, y: renderer.camera.y, z: renderer.camera.zoom }
    },
    setOption: (opt, val) => {
        options[opt] = val;
    },
    initLevel: (lvl) => {
        level = new EditorLevel(renderer, lvl);
    },
    placeObject: (opt) => {
        if(!level) return;
        switch (opt.mode) {
            case 'add':
                if(Array.isArray(opt.data)) {
                    opt.data.forEach(d => {
                        let obj = level.createObject(d.id, d.x, d.y);
                        level.addObject(obj);
                    });
                } else {
                    let obj = level.createObject(opt.data.id, opt.data.x, opt.data.y);
                    level.addObject(obj);
                }
                break;
            case 'remove':
                if(Array.isArray(opt.data)) {
                    opt.data.forEach(d => {
                        level.removeObject(d.id);
                    });
                } else {
                    level.removeObject(opt.data.id);
                }
                break;
        }
    }
}