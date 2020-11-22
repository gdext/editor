import spritesheet_img from '../assets/spritesheet_preview.png'
import spritesheet_json from '../assets/spritesheet_preview.json'

var image = new Image();

function drawObject(ctx, id) {
    var objs = spritesheet_json.filter((obj) => {return obj.name == id + ".png"});
    console.log(ctx, image);
    if (objs.length > 0) {
        var obj = objs[0];

        var big = Math.max(obj.w, obj.h);

        var ratio = Math.min(30 / big, 1);

        var width =  obj.w * ratio;
        var height = obj.h * ratio;

        ctx.drawImage(image, obj.x, obj.y, obj.w, obj.h, 15-width/2, 15-height/2, width, height);
    }
}

var drawToos = [];

image.onload = () => {
    for (var draw of drawToos)
        drawObject(draw.ctx, draw.id);

    drawToos = [];
}

image.src = spritesheet_img;

export default {
    createPreview: (id) => {
        var canvas = document.createElement("canvas");

        canvas.width = 30;
        canvas.height = 30;

        var ctx = canvas.getContext("2d");

        if (image.complete)
            drawObject(ctx, id);
        else
            drawToos.push({ctx: ctx, id: id});

        return canvas;
    }
}