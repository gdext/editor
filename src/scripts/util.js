import buildtabData from '../assets/buildtab.json';
import buildPreview from './buildPreview';

export default {

    calcCanvasSize: (ws, ns, bms) => {
        let w = ws.width;
        let h = ws.height - ns.height - bms.height;

        return { width: w, height: h }
    },

    loadObjects: (elem, category, amount) => {
        elem.innerHTML = "";
        if(!elem || !buildtabData.tabscontent[category] || !parseInt(amount)) return;
        let bti = -1;
        buildtabData.tabscontent[category].forEach(o => {
            bti++;
            if(bti > amount || bti > buildtabData.tabscontent[category].length) return;
            let obj = buildPreview.createPreview(o);
            elem.appendChild(obj);
        });
    }

}