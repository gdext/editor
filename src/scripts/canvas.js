import {GDRenderer} from './GDRenderW/main';
let gl, renderer;
let cvs;

export default {
    init: (canvas, lvl) => {
        gl = canvas.getContext("webgl");
        renderer = new GDRenderer(gl);
        cvs = canvas;
        renderer.loadGDExtLevel(lvl);
        console.log(cvs.width, cvs.height)
        renderer.renderLevel(cvs.width, cvs.height);
    },
    update: (canvas) => {
        if(!canvas) return;
        renderer.renderLevel(canvas.width, canvas.height);
    },
    moveTo: (x, y, z) => {
        renderer.camera.x = x;
        renderer.camera.y = y;
        renderer.camera.zoom = z;
    },
    getCoords: () => {
        return { x: renderer.camera.x, y: renderer.camera.y, z: renderer.camera.zoom }
    }
}