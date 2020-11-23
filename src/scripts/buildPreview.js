import spritesheet_img from '../assets/spritesheet_preview.png'
import spritesheet_json from '../assets/spritesheet_preview.json'

let image = new Image();

function drawObject(ctx, id) {
    let objs = spritesheet_json.filter((obj) => {return obj.name == id + ".png"});
    if (objs.length > 0) {
        let obj = objs[0];

        let big = Math.max(obj.w, obj.h);

        let ratio = Math.min(30 / big, 1);

        let width =  obj.w * ratio;
        let height = obj.h * ratio;

        ctx.drawImage(image, obj.x, obj.y, obj.w, obj.h, 15-width/2, 15-height/2, width, height);
    }
}

let drawToos = [];

image.onload = () => {
    for (let draw of drawToos)
        drawObject(draw.ctx, draw.id);

    drawToos = [];
}

image.src = spritesheet_img;

export default {
    createPreview: (id) => {
        const canvas = document.createElement("canvas");

        canvas.width = 30;
        canvas.height = 30;

        let ctx = canvas.getContext("2d");

        if (image.complete)
            drawObject(ctx, id);
        else
            drawToos.push({ctx: ctx, id: id});

        return canvas;
    }
}