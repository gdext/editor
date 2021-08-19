import renderer from './canvas';
import keyboard from './keyboard';
import util from './util';

// this code block is by IliasHDZ

const width = 2;
let mainCanvas = document.querySelector('#top-render');

const radiusConst = 128;
const radiusAdd = 12;

function renderCircle(ctx, pos, radius, strokeColor, fillColor = "none") {
    ctx.strokeStyle = "#000";
    ctx.lineWidth   = width + 3;
    ctx.globalAlpha = 0.15;
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
    
    ctx.globalAlpha = 1;

    ctx.strokeStyle = strokeColor;
    if (fillColor != "none") ctx.fillStyle = fillColor;

    ctx.lineWidth = width;
    
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
    if (fillColor != "none") ctx.fill();
    ctx.stroke();
    ctx.closePath();
}

function distance( p1, p2 ) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;

    return Math.sqrt( dx * dx + dy * dy );
}

function normalize( x, y ) {
    let dis = distance( { x: 0, y: 0 }, { x: x, y: y } );
    return { x: x / dis, y: y / dis };
}

function renderLine(ctx, pos1, pos2, color) {
    ctx.lineWidth   = width + 3;
    ctx.strokeStyle = "#000";
    ctx.globalAlpha = 0.15;

    let vec = normalize( pos2.x - pos1.x, pos2.y - pos1.y );
    
    vec.x *= 1.5;
    vec.y *= 1.5;

    //console.log(vec);

    ctx.beginPath();

    ctx.moveTo( pos1.x - vec.x, pos1.y - vec.y );
    ctx.lineTo( pos2.x + vec.x, pos2.y + vec.y );
    
    ctx.stroke();
    ctx.closePath();

    ctx.lineWidth   = width;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;

    ctx.beginPath();

    ctx.moveTo( pos1.x, pos1.y );
    ctx.lineTo( pos2.x, pos2.y );

    ctx.stroke();
    ctx.closePath();
}

function renderOutwardLines( ctx, x, y, br, er, count, color, width ) {
    let seg = Math.PI * 2 / count;

    for (let i = 0; i < count; i++) {
        let angle = seg * i + Math.PI / 2;
        let vec   = {x: Math.cos(angle), y: Math.sin(angle)};

        ctx.beginPath();

        ctx.moveTo( vec.x * br + x, vec.y * br + y );
        ctx.lineTo( vec.x * er + x, vec.y * er + y );

        ctx.stroke();

        renderLine(ctx, { x: vec.x * br + x, y: vec.y * br + y },
                        { x: vec.x * er + x, y: vec.y * er + y }, color);
    }
}

function renderTarget (ctx, pos, col) {
    renderCircle(ctx, pos, 8, col);
    renderLine(ctx, {x: pos.x, y: pos.y - 12}, {x: pos.x, y: pos.y + 12}, col);
    renderLine(ctx, {x: pos.x - 12, y: pos.y}, {x: pos.x + 12, y: pos.y}, col);   
}

function getAngle( pos, mouse, count ) {
    let angle = ( Math.atan2( mouse.x - pos.x, pos.y - mouse.y ) - Math.PI / 2 + Math.PI * 2 ) % ( Math.PI * 2 );

    let seg = Math.PI * 2 / count;

    if (count == 0)
        return angle;

    for (let i = 0; i < count; i++) {
        let ang = seg * i;

        if (angle >= ang - seg / 2 && angle < ang + seg / 2)
            return ang;
    }

    return seg * 0;
}

function TransformRotateGizmo(ctx, canvas, rot_callback) {
    this.ctx    = ctx;
    this.canvas = canvas;

    this.position = {x: 0, y: 0};

    this.center = {x: 0, y: 0};

    this.mouse = {x: 0, y: 0};

    this.hold       = false;
    this.hold_angle = 0;

    this.hold_mid   = false;
    this.mouse_off  = {x: 0, y: 0};

    this.angl_delta = 0;
    this.prev_angle = null;

    this.hover = false;

    this.rot_states = [
        { radius: radiusConst*0.5, dist: radiusConst*0.5, count: 4 },
        { radius: radiusConst, dist: Infinity, count: 8 },
        { radius: Infinity, dist: Infinity, count: 0}
    ]

    this.curr_state;
    this.prev_state;


    this.setCenter = function(x, y) {
        this.center = {x: x, y: y};
    }
    this.setPos = function(x, y) {
        console.log(x, y);
        this.position = {x: x, y: y};
    }

    this.changeMousePos = function(x, y) {
        this.mouse = {x: x, y: y};

        let dist = distance( renderer.level2ScreenCoords(this.position), this.mouse );
        if(dist > radiusConst + radiusAdd || (dist < radiusConst - radiusAdd && dist > 12)) 
            this.hover = false;
        else 
            this.hover = true;

        // define colors
        this.colorMain = this.hover || this.hold ? "#fff" : "#ffffffaa";
        this.colorSecondary = this.hover || this.hold ? "#3CBEE6" : "#3CBEE6aa";
        this.colorDark = this.hover || this.hold ? "#333" : "#333333aa";
    }

    this.changeMousePos(0,0);

    this.mousePress = function() {
        let posScreen = renderer.level2ScreenCoords(this.position);
        let dist = distance( posScreen, this.mouse );

        if(dist > radiusConst + radiusAdd || (dist < radiusConst - radiusAdd && dist > 12)) return false;

        if (dist > 12) {
            let angle = getAngle( posScreen, this.mouse, this.curr_state.count );
            
            this.hold       = true;
            this.hold_angle = angle;
            this.prev_angle = 0;
            rot_callback(0, true);
        } else {
            this.hold_mid  = true;
            this.mouse_off = {x: this.mouse.x - posScreen.x, y: this.mouse.y - posScreen.y};  
        }

        return true;
    }

    this.mouseRelease = function() {
        let angle = getAngle( renderer.level2ScreenCoords(this.position), this.mouse, this.curr_state.count );
        
        if(this.hold) this.hold_angle = angle;

        if(!this.hold_mid) {
            let prevPos = JSON.parse(JSON.stringify(this.position)); // json stuff to break the reference
    
            // reset selected
            renderer.applySelection();
    
            setTimeout(() => {this.position = prevPos}, 10);
        }

        this.hold       = false;
        this.hold_mid   = false;

        setTimeout(() => {this.render()}, 250);
    }

    this.render = function() {
        // initialize gizmo
        let pos = renderer.level2ScreenCoords(this.position);
        let dist = distance( pos, this.mouse );
        this.prev_state = null;
        
        // if shift pressed, turn on snapping
        if (keyboard.getKeys().includes(16))
            for (let state of this.rot_states) {
                if (dist <= state.dist) {
                    this.curr_state = state;
                    break;
                }
                this.prev_state = state;
            }
        else {
            this.prev_state = this.rot_states[this.rot_states.length - 2];
            this.curr_state = this.rot_states[this.rot_states.length - 1];
        } 

        // if no objects are selected, don't show the gizmo
        if(renderer.getSelectedObjects().length < 1) return;

        // obj center
        let rt = renderer.getRelativeTransform();
        if(this.center.x == this.position.x && this.center.y == this.position.y) {
            this.position.x = rt.center.x;
            this.position.y = rt.center.y;
        }
        this.setCenter(rt.center.x, rt.center.y);

        let angle = getAngle( pos, this.mouse, this.curr_state.count );

        let targetAng = this.hold_angle;
        let targetRadius = radiusConst;

        if (this.hold) {
            this.angl_delta = angle - this.hold_angle;

            let ang = this.angl_delta;

            if (ang < 0)
                ang = Math.PI * 2 + ang;

            ang = ang % (Math.PI * 2);

            //console.log(ang / Math.PI * 180);

            if ( ang > Math.PI )
                ang = -Math.PI + (ang - Math.PI);

            this.angl_delta = ang;

            // console.log( ang / Math.PI * 180 );

            if (this.prev_angle == null) this.prev_angle = this.angl_delta;

            ctx.strokeStyle = this.colorSecondary;
            ctx.fillStyle   = this.colorMain;

            let radius;

            rot_callback(this.angl_delta - this.prev_angle, false);

            if (this.curr_state.radius == Infinity)
                radius = radiusConst;
            else
                radius = this.curr_state.radius + 10;

            // handle circle on hold
            targetAng += ang;
            targetRadius = radius;

            let bang = Math.min( this.hold_angle, this.hold_angle + this.angl_delta );
            let eang = Math.max( this.hold_angle, this.hold_angle + this.angl_delta );

            this.prev_angle = this.angl_delta;

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, bang, eang);
            ctx.stroke();
            ctx.closePath();
        }
        
        if (this.hold_mid) {
            this.position = renderer.screen2LevelCoords({x: this.mouse.x - this.mouse_off.x, y: this.mouse.y - this.mouse_off.y});

            let cnt_dis = distance( this.position, this.center );
            if (cnt_dis <= 12 / renderer.getCoords().z) this.position = this.center;
        }

        if (dist > 12 && !this.hold_mid) {
            ctx.strokeStyle = "#ccc";

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            if (this.hold)
                ctx.lineTo(pos.x + Math.cos(this.hold_angle) * 2000, pos.y + Math.sin(this.hold_angle) * 2000);
            ctx.stroke();
            ctx.closePath();

            canvas.style.cursor = "";
        } else {
            canvas.style.cursor = "move";
        }

        
        if (this.hold) {
            if (!this.hold_mid)
                renderOutwardLines( ctx, pos.x, pos.y,  this.curr_state.radius - 30, this.curr_state.radius - 10, this.curr_state.count, this.colorSecondary, 2 );
            
                ctx.strokeStyle = this.colorSecondary;

            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x + Math.cos(angle) * 2000, pos.y + Math.sin(angle) * 2000);
            ctx.stroke();
            ctx.closePath();
        }

       

        // center circle
        if (this.hold_mid && !( this.position.x == this.center.x && this.position.y == this.center.y ) )
            renderTarget(ctx, renderer.level2ScreenCoords(this.center), this.colorSecondary);
            //renderCircle(ctx, renderer.level2ScreenCoords(this.center), 12, this.colorMain);

        renderTarget(ctx, pos, this.colorMain);

        let rad1 = this.hold && this.curr_state ? this.curr_state.radius : radiusConst;
        let rad2 = this.hold && this.prev_state ? this.prev_state.radius : radiusConst;

        if (this.curr_state.radius != Infinity)
            renderCircle(ctx, pos, rad1, this.colorMain);

        if (this.prev_state)
            renderCircle(ctx, pos, rad2, this.colorMain);

        // handle circle render
        renderCircle(ctx, {
            x: pos.x + targetRadius * Math.cos(targetAng), y: pos.y + targetRadius * Math.sin(targetAng)
        }, 12, this.colorSecondary, this.colorDark);
    }
}

// end code block

let currentGizmo;

function update () {
    renderer.update(document.querySelector('#render'));
}

export default {

    init: () => {
        mainCanvas = document.querySelector('#top-render');
    },
    
    createGizmo: (type, canvas) => {
        if(!canvas) canvas = mainCanvas;
        switch (type) {
            case 'rotate':
                currentGizmo = new TransformRotateGizmo(canvas.getContext('2d'), canvas, (r, f) => {
                    let rt = renderer.getRelativeTransform();
                    
                    let prevrot = rt.rotation;

                    let objp = rt.center;

                    let newrot = Math.round((prevrot + util.radiansToDegrees(r))*1000)/1000;
                    let dis = distance(objp, currentGizmo.position);
                    let ang = getAngle(objp, currentGizmo.position, 0);

                    let newx = Math.cos(ang) * dis;
                    let newy = Math.sin(ang) * dis;

                    ang -= util.degreesToRadians(newrot);
                    newx -= Math.cos(ang) * dis;
                    newy -= Math.sin(ang) * dis;
                    
                    renderer.setRelativeTransform({
                        rotation: newrot,
                        x: newx,
                        y: newy
                    });
                    update();
                });
                break;
        }

        if(currentGizmo) currentGizmo.render();
        return currentGizmo;
    },

    getGizmo: () => {
        return currentGizmo;
    },

    destroyGizmo: () => {
        currentGizmo = null;
        mainCanvas.getContext('2d').clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    }

}