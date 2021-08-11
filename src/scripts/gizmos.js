import renderer from './canvas';

// this code block is by IliasHDZ

const width = 2;
let mainCanvas = document.querySelector('#top-render');

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

    this.state  = "rotate";
    this.position = {x: 550, y: 300};

    this.center = {x: 0, y: 0};

    this.mouse = {x: 0, y: 0};

    this.hold       = false;
    this.hold_angle = 0;

    this.hold_mid   = false;
    this.mouse_off  = {x: 0, y: 0};

    this.angl_delta = 0;
    this.prev_angle = null;

    this.rot_states = [
        { radius: 100,  count: 4 },
        { radius: 200, count: 8 },
        { radius: Infinity, count: 0}
    ]

    this.curr_state
    this.prev_state

    this.setCenter = function(x, y) {
        this.center = {x: x, y: y};
    }

    this.changeMousePos = function(x, y) {
        this.mouse = {x: x, y: y};
    }

    this.mousePress = function() {
        let dist = distance( this.position, this.mouse );

        if (dist > 12) {
            let angle = getAngle( this.position, this.mouse, this.curr_state.count );

            this.hold       = true;
            this.hold_angle = angle;
            this.prev_angle = 0;
        } else {
            this.hold_mid  = true;
            this.mouse_off = {x: this.mouse.x - this.position.x, y: this.mouse.y - this.position.y};  
        }
    }

    this.mouseRelease = function() {
        let angle = getAngle( this.position, this.mouse, this.curr_state.count );

        this.hold       = false;
        this.hold_mid   = false;

        this.hold_angle = angle;
    }

    this.render = function() {
        let pos = this.position;

        if (this.state == "rotate") {
            let dist = distance( pos, this.mouse );

            this.prev_state = null;
            
            if (!this.hold)
                for (let state of this.rot_states) {
                    if (dist <= state.radius) {
                        this.curr_state = state;
                        break;
                    }
                    this.prev_state = state;
                }

            let angle = getAngle( pos, this.mouse, this.curr_state.count );

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

                ctx.strokeStyle = "#6b8eff";
                ctx.fillStyle   = "#fff";

                let radius;

                rot_callback(this.angl_delta - this.prev_angle);

                if (this.curr_state.radius == Infinity)
                    radius = 210;
                else
                    radius = this.curr_state.radius + 10;

                let bang = Math.min( this.hold_angle, this.hold_angle + this.angl_delta );
                let eang = Math.max( this.hold_angle, this.hold_angle + this.angl_delta );

                this.prev_angle = this.angl_delta;

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, bang, eang);
                ctx.stroke();
                ctx.closePath();
            }

            if (this.hold_mid) {
                this.position = {x: this.mouse.x - this.mouse_off.x, y: this.mouse.y - this.mouse_off.y};

                let cnt_dis = distance( this.position, this.center );
                if (cnt_dis <= 12) this.position = this.center;
            }

            if (dist > 12 && !this.hold_mid) {
                ctx.strokeStyle = "#ccc";

                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                if (this.hold)
                    ctx.lineTo(pos.x + Math.cos(this.hold_angle) * 2000, pos.y + Math.sin(this.hold_angle) * 2000);
                else
                    ctx.lineTo(pos.x + Math.cos(angle) * 2000, pos.y + Math.sin(angle) * 2000);
                ctx.stroke();
                ctx.closePath();

                canvas.style.cursor = "auto";
            } else {
                canvas.style.cursor = "move";
            }

            if (!this.hold_mid)
                renderOutwardLines( ctx, pos.x, pos.y,  this.curr_state.radius - 30, this.curr_state.radius - 10, this.curr_state.count, "#fff", 2 );

            if (this.hold) {
                ctx.strokeStyle = "#6b8eff";

                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x + Math.cos(angle) * 2000, pos.y + Math.sin(angle) * 2000);
                ctx.stroke();
                ctx.closePath();
            }

            if (this.hold_mid && !( this.position.x == this.center.x && this.position.y == this.center.y ) )
                renderCircle(ctx, this.center, 12, "#fff");

            renderCircle(ctx, pos, 12, "#6b8eff", "#fff");

            if (this.curr_state.radius != Infinity)
                renderCircle(ctx, pos, this.curr_state.radius, "#fff");//"#999");

            if (this.prev_state)
                renderCircle(ctx, pos, this.prev_state.radius, "#fff");//"#bbb");
        }
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
                currentGizmo = new TransformRotateGizmo(canvas.getContext('2d'), canvas, (r) => {
                    let prevrot = renderer.getRelativeTransform().rotation;
                    renderer.setRelativeTransform({
                        rotation: prevrot + r
                    });
                    update();
                });
                break;
        }

        update();
        return currentGizmo;
    },

    getGizmo: () => {
        return currentGizmo;
    },

    destroyGizmo: () => {
        currentGizmo = null;
        update();
    }

}