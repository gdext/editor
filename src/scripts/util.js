import buildtabData from '../assets/buildtab.json';
import buildPreview from './buildPreview';

let unsavedChanges = false;

export default {

    calcCanvasSize: (ws, ns, bms) => {
        let w = ws.width;
        let h = ws.height - ns.height - bms.height;
        console.log(h);
        return { width: w, height: h }
    },

    loadObjects: (elem, category, start, end, onclick, selobj) => {
        elem.innerHTML = "";
        if(!elem || !buildtabData.tabscontent[category]) return;
        let bti = -1;
        buildtabData.tabscontent[category].forEach(o => {
            bti++;
            if(bti > end || bti < start || bti > buildtabData.tabscontent[category].length) return;
            let obj = buildPreview.createPreview(o);
            if(selobj == o) obj.classList.add('sel');
            elem.appendChild(obj);
            obj.onclick = () => {
                onclick(o, obj);
            };
        });
    },

    calcBuildObjectsAmount: (bottom) => {
        let width = bottom.getBoundingClientRect().width;
        width -= 80; //to compensate for left/right arrows and paddings
        let objw = 45;
        return {
            amount: Math.floor(width/objw) * 3 - 1,
            parentw: Math.floor(width/objw)*45 + 'px'
        };
    },

    setUnsavedChanges: (v) => {
        unsavedChanges = v;
    },

    getUnsavedChanges: () => {
        return unsavedChanges;
    },

    setCursor: (n) => {
        document.body.style.cursor = n || "";
    }

}