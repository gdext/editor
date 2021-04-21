function TopCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.sel = null;

    this.selbox_strokecol = "#3cbee6";
    this.selbox_fillcol = "#3cbee633";

    this.selbox_opacity = 1;

    this.fade_inter = null;

    this.fade_speed = 0.15;
    this.opacity = null;

    this.renderSelBox = (sel, op) => {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (!sel) return;

        ctx.strokeStyle = this.selbox_strokecol;
        ctx.fillStyle = this.selbox_fillcol;

        ctx.globalAlpha = this.selbox_opacity * op;
        ctx.lineWidth = "2";

        ctx.beginPath();
        ctx.rect(sel.x, sel.y, sel.w, sel.h);

        ctx.fill();
        ctx.stroke();
        
        ctx.closePath();
    }

    this.setSelectionBox = (sel) => {
        if (sel == null) {
            if (this.sel != null) {
                this.opacity = 1;
                let selection = this.sel;

                this.fade_inter = setInterval(() => {
                    this.opacity = Math.max(this.opacity - this.fade_speed, 0);
                    this.renderSelBox(selection, this.opacity);

                    if (this.opacity == 0)
                        clearInterval(this.fade_inter);
                }, 1000 / 60);
            }

            this.sel = sel;
            return;
        }

        if (this.fade_inter)
            clearInterval(this.fade_inter);

        let x = Math.min(sel.x1, sel.x2);
        let y = Math.min(sel.y1, sel.y2);

        let w = Math.max(sel.x1, sel.x2) - x;
        let h = Math.max(sel.y1, sel.y2) - y;

        this.sel = {x, y, w, h};

        this.renderSelBox(this.sel, 1);
    }
}

export default TopCanvas;