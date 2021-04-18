import ui from './ui';
import buildtabData from '../assets/buildtab.json';
import buildPreview from './buildPreview';

let unsavedChanges = false;

function closeDialog (id) {
    let dialog = document.getElementById(id);
    if(!dialog) return;

    dialog.classList.add('closing');
    let bg = document.getElementById(id + 'Bg');
    if(bg && bg.parentElement) bg.style.animation = 'fadeOut ease 0.3s';
    setTimeout(() => {
        dialog.classList.remove('vis');
        if(dialog.parentElement) dialog.parentElement.removeChild(dialog);
        if(bg && bg.parentElement) {
            let rootelem = bg.parentElement;
            bg.parentElement.removeChild(bg);
            rootelem.parentElement.removeChild(rootelem);
        }
    }, 250);
}

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
    },

    isGDRunning: () => {
        return window.gdext ? window.gdext.isGdRunning : undefined;
    },

    createDialog: (id, title, closeButton, content) => {
        ui.renderUiObject({
            properties: {
                type: 'dialog',
                id: id,
                title: title,
                closeButton: closeButton
            },
            children: content
        }, document.body);
    },

    closeDialog: (id) => {
        closeDialog(id);
    },

    alert: (id, title, description, button, dontShowAgain) => {
        let obj = {
            properties: {
                type: 'dialog',
                id: id,
                title: title,
                closeButton: true
            },
            children: [
                {
                    properties: {
                        type: 'container',
                        paddingX: 15,
                        paddingY: 10,
                    },
                    children: [
                        {
                            properties: {
                                type: 'label',
                                text: description,
                                align: 'center',
                                marginBottom: 10,
                            }
                        },
                        {
                            properties: {
                                type: 'button',
                                id: id + 'Ok',
                                text: button,
                                primary: true,
                                onClick: () => {
                                    closeDialog(id);
                                }
                            }
                        }
                    ]
                }
            ]
        }
        if(dontShowAgain) 
            obj.children[0].children.push({
                properties: {
                    type: 'checkbox',
                    id: id + 'DontShowAgain',
                    text: 'Don\'t show this again',
                    marginTop: 8,
                    checked: () => {
                        return false
                    },
                    onCheckChange: (t) => {
                        if(t) localStorage.setItem(`${id}DontShowAgain`, 'true');
                        else localStorage.setItem(`${id}DontShowAgain`, 'false');
                    }
                }
            });
        ui.renderUiObject(obj, document.body);
    },

    confirm: (id, title, description, options) => {
        if(!options) return
        let buttons = [options.buttonYes || 'OK', options.buttonNo || 'Cancel'];

        ui.renderUiObject({
            properties: {
                type: 'dialog',
                id: id,
                title: title,
                closeButton: true
            },
            children: [
                {
                    properties: {
                        type: 'container',
                        paddingX: 15,
                        paddingY: 10,
                    },
                    children: [
                        {
                            properties: {
                                type: 'label',
                                text: description,
                                align: 'center',
                                marginBottom: 10,
                            }
                        },
                        {
                            properties: {
                                type: 'container',
                                direction: 'row'
                            },
                            children: [
                                {
                                    properties: {
                                        type: 'button',
                                        id: id + 'Ok',
                                        text: buttons[0],
                                        primary: true,
                                        onClick: () => {
                                            closeDialog(id);
                                            if(options.onConfirm) options.onConfirm(true);
                                        }
                                    }
                                },
                                {
                                    properties: {
                                        type: 'button',
                                        id: id + 'Cancel',
                                        text: buttons[1],
                                        onClick: () => {
                                            closeDialog(id);
                                            if(options.onConfirm) options.onConfirm(false);
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }, document.body);
    },

    showNotif: (id, text, time, type) => {
        let notification = document.createElement('div');
        notification.classList.add('app-notification');
        notification.id = id;
        notification.innerText = text;
        if(type) notification.classList.add(type);

        setTimeout(() => {
            notification.classList.add('cls');
            setTimeout(() => {
                if(notification.parentElement) notification.parentElement.removeChild(notification);
            }, 800);
        }, time);

        document.getElementById('app').appendChild(notification);
    },

    getTimeDifferenceText: (date) =>{
        let now = new Date();
        let diff = (now - date);
        let text;
        if(diff < 30000) text = 'just now';
        else if(diff < 3600000) text = `${Math.round(diff/60000)} minutes ago`;
        else if(diff < 36000000) text = `${Math.floor(diff/3600000)} hours ago`;
        else text = `a while back`;

        return text;
    }

}