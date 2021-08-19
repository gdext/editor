import ui from './ui';
import buildtabData from '../assets/buildtab.json';
import settingsData from '../assets/settings.json';
import buildPreview from './buildPreview';

if(!window.require) window.require = () => { return false }

// this file contains miscellaneous functions, like calculating stuff, loading objects and 
// creating dialogs

let unsavedChanges = false;

let closeFuncIds = [];
let prevFocusElement = {};

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
            bg.parentElement.removeChild(bg);
        }
    }, 250);
    closeFuncIds.shift();
    if(closeFuncIds.length <= 0) {
        window.removeEventListener('keydown', closeFunc);
    }

    if(prevFocusElement[id]) {
        prevFocusElement[id].focus();
    }
}

function openFunc(id) {
    closeFuncIds.unshift(id);
    window.addEventListener('keydown', closeFunc);
    prevFocusElement[id] = document.activeElement;
}
function closeFunc(e) {
    if(e.keyCode == 27) {
        closeDialog(closeFuncIds[0]);
        if(closeFuncIds.length <= 0) {
            window.removeEventListener('keydown', closeFunc);
        }
    }

    return false;
}

function updateTitle() {
    let lvlnum = parseInt(localStorage.getItem('lvlnumber'));
    let t = `${lvlnum >= 0 ? localStorage.getItem('lvlname') : 'Untitled'}${unsavedChanges ? '*' : ''} - GDExt`
    document.title = t;
}

function showNotif (id, text, time, type) {
    let oldNotification = document.querySelector('#' + id);
    if(oldNotification && oldNotification.classList.contains('app-notification')) {
        oldNotification.parentElement.removeChild(oldNotification);
    }

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

    document.body.appendChild(notification);
}

export default {

    calcCanvasSize: (ws, ns, bms) => {
        let w = ws.width;
        let h = ws.height - ns.height - bms.height;
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
      
    rgbToHex: (r, g, b) => {
        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
        return "#" + componentToHex(parseInt(r)) + componentToHex(parseInt(g)) + componentToHex(parseInt(b));
    },

    hexToRGB: (hex) => {
        let r = 0, g = 0, b = 0;
        // handling 3 digit hex
        if (hex.length == 4) {
           r = "0x" + hex[1] + hex[1];
           g = "0x" + hex[2] + hex[2];
           b = "0x" + hex[3] + hex[3];
           // handling 6 digit hex
        } else if (hex.length == 7) {
           r = "0x" + hex[1] + hex[2];
           g = "0x" + hex[3] + hex[4];
           b = "0x" + hex[5] + hex[6];
        };
     
        return{
           r: +r,
           g: +g,
           b: +b
        };
    },

    setUnsavedChanges: (v) => {
        unsavedChanges = v;
        updateTitle();
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

    createDialog: (id, title, closeButton, content, fullSize) => {
        ui.renderUiObject({
            properties: {
                type: 'dialog',
                id: id,
                title: title,
                closeButton: closeButton,
                fullSize: fullSize
            },
            children: content
        }, document.body);
        let elemContent = document.querySelector('#'+id).querySelector('.ui-element');
        let maxheight = document.querySelector('#app').getBoundingClientRect().height * 0.6;
        elemContent.style.marginTop = '10px';
        if(elemContent.getBoundingClientRect().height > maxheight)
            elemContent.style.height = maxheight + 'px';

        openFunc(id);
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
                                focusIndex: 0,
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

        openFunc(id);
    },

    confirm: (id, title, description, options) => {
        if(!options) return
        let buttons = [options.buttonYes || 'OK', options.buttonNo || 'Cancel'];

        ui.renderUiObject({
            properties: {
                type: 'dialog',
                id: id,
                title: title,
                closeButton: false
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
                                        focusIndex: 0,
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
                                        focusIndex: 1,
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

        openFunc(id);
    },

    prompt: (id, title, description, options) => {
        if(!options) return
        let buttons = [options.buttonYes || 'OK', options.buttonNo || 'Cancel'];
        let input = {
            type: 'textInput',
            id: id + 'Input',
            placeholder: options.placeholder || 'Enter Here',
            defaultValue: options.defaultValue,
            maxlength: options.maxlength || 32,
            marginBottom: 10,
            focusIndex: 0
        }
        if(options.type == 'number') {
            input = {
                type: 'numberInput',
                id: id + 'Input',
                placeholder: options.placeholder || 'Enter Here',
                defaultValue: options.defaultValue,
                min: options.min,
                max: options.max,
                marginBottom: 10,
                focusIndex: 0
            }
        }

        ui.renderUiObject({
            properties: {
                type: 'dialog',
                id: id,
                title: title,
                closeButton: false
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
                            properties: input
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
                                        focusIndex: 1,
                                        text: buttons[0],
                                        primary: true,
                                        onClick: () => {
                                            closeDialog(id);
                                            let inp = document.querySelector('#' + id + 'Input');
                                            if(options.onConfirm) options.onConfirm(inp ? inp.value : null);
                                        }
                                    }
                                },
                                {
                                    properties: {
                                        type: 'button',
                                        id: id + 'Cancel',
                                        focusIndex: 2,
                                        text: buttons[1],
                                        onClick: () => {
                                            closeDialog(id);
                                            if(options.onConfirm) options.onConfirm(null);
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }, document.body);

        openFunc(id);
    },

    showNotif: (id, text, time, type) => {
        showNotif(id, text, time, type);
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
    },

    openUrl: (url) => {
        if(window.process) {
            let { shell } = window.require('electron');
            shell.openExternal(url);
        } else {
            window.open(url);
        }
    },

    updateTitle: () => {
       updateTitle();
    },

    copyToClipboard: (data, key) => {
        let clipboardKey = key || 'default';
        if(!window.clipboard) window.clipboard = {};
        window.clipboard[clipboardKey] = data;
    },

    getClipboard: (key) => {
        if(!window.clipboard) return;
        let clipboardKey = key || 'default';
        return window.clipboard[clipboardKey];
    },

    applySettings: (key) => {
        switch(key) {
            case 'comingsoon':
                showNotif('settingsComingSoonNotif', 'Coming Soon!', 2500, 'warn');
                break;
            case 'guiZoom':
                let zoomLevels = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
                let zoomSel = parseInt(localStorage.getItem('settings.guiZoom') || settingsData.defaults.guiZoom);
                let event = new CustomEvent('electronApi', { detail: {
                    detail: 'setZoom',
                    zoom: zoomLevels[zoomSel] 
                }});
                dispatchEvent(event);
                break;
            case 'autosaveEnabled':
                let autosaveCheckbox = document.querySelector('#toggleAutosave');
                if(autosaveCheckbox) autosaveCheckbox.checked = localStorage.getItem('settings.autosaveEnabled') == '1';
                break;
            case 'showQuickTools':
                let canvasQuicktools = document.querySelector('#canvasQuickTools');
                if(canvasQuicktools) {
                    if(localStorage.getItem('settings.showQuickTools') == '1') canvasQuicktools.classList.add('hid');
                    else canvasQuicktools.classList.remove('hid');
                }
                break;
        }
    },

    pickFiles: (opt) => {
        if(window.gdext) return window.gdext.pickFilesElectron(opt);
        else return null;
    },

    waitForElement: (query, func) => {
        // if node already exists, execute immediately
        if(document.querySelector(query)) {
            func();
            return;
        }

        // else, wait for node using mutation observer
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (!mutation.addedNodes) return;   
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    let node = mutation.addedNodes[i];
                    if(document.querySelector(query) == node) {
                        // node exists
                        func();
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true, 
            subtree: true, 
            attributes: false, 
            characterData: false
        });   
    },

    radiansToDegrees: (radians) => {
        return radians * (180/Math.PI);
    },

    degreesToRadians: (degrees) => {
        return degrees / (180/Math.PI);
    }

}