export default {

    calcCanvasSize: (ws, ns, bms) => {
        let w = ws.width;
        let h = ws.height - ns.height - bms.height;

        return { width: w, height: h }
    }

}