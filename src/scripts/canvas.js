import {GDRenderer} from './GDRenderW/main';
let gl, renderer, cvs, options;

export default {
    init: (canvas, lvl) => {
        options = {
            grid: true
        };
        gl = canvas.getContext("webgl");
        renderer = new GDRenderer(gl);
        cvs = canvas;
        renderer.loadGDExtLevel(lvl);
        renderer.renderLevel(cvs.width, cvs.height, options);
    },
    update: (canvas) => {
        if(!canvas) return;
        renderer.renderLevel(canvas.width, canvas.height, options);
    },
    moveTo: (x, y, z) => {
        renderer.camera.x = x;
        renderer.camera.y = y;
        renderer.camera.zoom = z;
    },
    getCoords: () => {
        return { x: renderer.camera.x, y: renderer.camera.y, z: renderer.camera.zoom }
    },
    setOption(opt, val) {
        options[opt] = val;
    }
}