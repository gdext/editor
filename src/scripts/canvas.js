import {GDRenderer} from './GDRenderW/main';
import {EditorLevel} from './GDRenderW/level';
import TopCanvas from './topcanvas';
import objectsData from '../assets/levelparse/objects.json';
import objAlignData from '../assets/obj-align.json';
import gdrenderwData from './GDRenderW/assets/data.json';
import util from './util';

let gl, renderer, cvs, options, level, top, sel;

let selectedObjs = [];
let relativeTransform = {
    /*x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    hflip: false,
    vflip: false,
    zorder: 0,
    center: {},
    objdata: {}*/
}
let globalPrevProps = {};

let undoHistory = [];
let currentHistoryPosition = 0;
let currentUndoGroup = null;

function addUndoGroupAction(obj) {
    if(typeof obj != 'object') return;
    if(!currentUndoGroup) currentUndoGroup = [];
    currentUndoGroup.push(obj);
}

function submitUndoGroup() {
    if(currentHistoryPosition > 0) {
        for(let i = 0; i < currentHistoryPosition; i++) {
            undoHistory.shift();
        }
    }
    currentHistoryPosition = 0;

    if(currentUndoGroup) undoHistory.unshift(currentUndoGroup);
    currentUndoGroup = null;
}

function moveInHistory(backward) {
    if(backward) {
        if(!undoHistory[currentHistoryPosition]) {
            console.log('Nothing to undo!');
            return;
        }
        let targetUndoGroup = undoHistory[currentHistoryPosition].slice();
        currentHistoryPosition++;
        targetUndoGroup.reverse();
        targetUndoGroup.forEach(action => {
            switch(action.type) {
                case 'addObject':
                    level.removeObject(action.key);
                    break;
                case 'editObject':
                    level.editObject(action.key, action.propsBefore);
                    break;
                case 'removeObject':
                    level.addObject(action.props);
                    break;
                case 'select':
                    selectedObjs = action.selectBefore;
                    selectObjects();
                    break;
                case 'levelSettings':
                    localStorage.setItem(action.key, action.valueBefore);
                    break;
            }
        });
    } else {
        if(currentHistoryPosition <= 0) {
            console.log('Nothing to redo!');
            currentHistoryPosition = 0;
            return;
        }
        currentHistoryPosition--;
        let targetUndoGroup = undoHistory[currentHistoryPosition].slice();
        targetUndoGroup.forEach(action => {
            switch(action.type) {
                case 'addObject':
                    let obj = level.createObject(action.props.id, action.props.x, action.props.y, true);
                    level.addObject(obj);
                    break;
                case 'editObject':
                    level.editObject(action.key, action.propsAfter);
                    break;
                case 'removeObject':
                    level.removeObject(action.key);
                    break;
                case 'select':
                    selectedObjs = action.selectAfter;
                    selectObjects();
                    break;
                case 'levelSettings':
                    localStorage.setItem(action.key, action.valueAfter);
                    break;
            }
        });
    }
    level.confirmEdit();
    renderer.renderLevel(level, cvs.width, cvs.height, options);
    util.updateTitle();
}

function selectObjects() {
    // color selected objects
    options.colored_objects = {};
    selectedObjs.forEach(k => {
        options.colored_objects[k] = {
            base: -1,
            decor: -1
        }
        globalPrevProps[k] = JSON.parse(JSON.stringify(level.getObject(k)));
    });
    renderer.renderLevel(level, cvs.width, cvs.height, options);

    //rel transform
    relativeTransform = {}
    if(selectedObjs.length < 1) return;
    relativeTransform = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        hflip: false,
        vflip: false,
        zorder: 0,
        absolute: false
    }

    if (selectedObjs.length == 1) {
        // absolute transform
        let obj = level.getObject(selectedObjs[0]);
        relativeTransform.center = {
            x: obj.x,
            y: obj.y
        }
        relativeTransform.x = obj.x;
        relativeTransform.y = obj.y;
        relativeTransform.rotation = obj.r || 0;
        relativeTransform.scale = obj.scale || 1;
        relativeTransform.hflip = obj.flipx == true;
        relativeTransform.vflip = obj.flipx == true;
        relativeTransform.zorder = obj.order || gdrenderwData[obj.id.toString()].zorder;
        relativeTransform.absolute = true;

        relativeTransform.objdata = {};
        relativeTransform.objdata[selectedObjs[0]] = {
            xFromCenter: 0,
            yFromCenter: 0, 
            scale: 1,
            rotation: 0,
            flipx: false,
            flipy: false,
            zorder: 0
        }
    } else {
        // calculate selection center
        let positions = {
            x: [],
            y: []
        }
        selectedObjs.forEach(o => {
            let od = level.getObject(o);
            if(!od) return
            if(od.x) positions.x.push(od.x);
            if(od.y) positions.y.push(od.y);
        });

        let posBounds = { 
            minx: Math.min(...positions.x), 
            maxx: Math.max(...positions.x), 
            miny: Math.min(...positions.y), 
            maxy: Math.max(...positions.y)
        }

        relativeTransform.center = {
            x: (posBounds.minx + posBounds.maxx)/2,
            y: (posBounds.miny + posBounds.maxy)/2
        }

        // object local variables
        relativeTransform.objdata = {};
        selectedObjs.forEach(o => {
            let od = level.getObject(o);
            relativeTransform.objdata[o] = {
                xFromCenter: od.x - relativeTransform.center.x,
                yFromCenter: od.y - relativeTransform.center.y, 
                scale: od.scale || 1,
                rotation: od.r || 0,
                flipx: od.flipx || false,
                flipy: od.flipy || false,
                zorder: od.order || gdrenderwData[od.id.toString()].zorder
            }
        });
    }
}

function updateRelativeTransform(obj, shiftcenter) {
    if(!relativeTransform.objdata) return;
    Object.assign(relativeTransform, obj);
    let changedProps = {
        pos: false,
        rot: false,
        scale: false,
        flip: false,
        zorder: false
    }
    if(relativeTransform.x || relativeTransform.y) changedProps.pos = true;
    if(relativeTransform.rotation) changedProps.rot = true;
    if(relativeTransform.scale) changedProps.scale = true;
    if(relativeTransform.hflip || relativeTransform.vflip) changedProps.flip = true; 
    if(relativeTransform.zorder) changedProps.zorder = true; 

    if(relativeTransform.rotation < 0) relativeTransform.rotation += 360;
    else if(relativeTransform.rotation >= 360) relativeTransform.rotation -= 360;

    let objid;
    let objidn;
    let objcontent;
    if(shiftcenter) {
        objid = level.getObject(Object.keys(relativeTransform.objdata)[0]);
        if(objid) objid = objid.id.toString();
        else objid = null;
        objidn = objid ? parseInt(objid) : null;
        relativeTransform.center.x -= objAlignData[objid] ? objAlignData[objid].alignX : 0;
        relativeTransform.center.x -= objAlignData[objid] ? objAlignData[objid].alignY : 0;
        
        objcontent = relativeTransform.objdata[Object.keys(relativeTransform.objdata)[0]];
        objcontent.xFromCenter += objAlignData[objid] ? objAlignData[objid].alignX : 0;
        objcontent.yFromCenter += objAlignData[objid] ? objAlignData[objid].alignY : 0;
    }
    
    //pre-calculate rotation
    function toRadians (angle) {
        return angle * (Math.PI / 180);
    }
    let rotToRad = toRadians(relativeTransform.rotation)
    let sinRot = Math.sin(rotToRad);
    let cosRot = Math.cos(rotToRad);

    Object.keys(relativeTransform.objdata).forEach(k => {
        let v = relativeTransform.objdata[k];
        let od = level.getObject(k);

        if(relativeTransform.absolute) {
            od.x = relativeTransform.x;
            od.y = relativeTransform.y;
            od.scale = relativeTransform.scale;
            od.flipx = relativeTransform.hflip ? 1 : null;
            od.flipy = relativeTransform.vflip ? 1 : null;
            od.order = relativeTransform.zorder;

            let targetRot = relativeTransform.rotation;
            if(od && objectsData.solids.includes(od.id)) targetRot = Math.round(targetRot/90)*90;
            if(targetRot < 0) targetRot += 360;
            else if(targetRot >= 360) targetRot -= 360;
            //relativeTransform.rotation = targetRot;
            od.r = targetRot;

            if(shiftcenter) {
                let targetX, targetY;
                targetX = v.xFromCenter;
                targetY = v.yFromCenter;
                let newTargetX = (targetX * cosRot) + (targetY * sinRot);
                let newTargetY = (targetY * cosRot) - (targetX * sinRot);
                targetX = newTargetX;
                targetY = newTargetY;

                console.log(targetX, targetY);
                od.x = relativeTransform.center.x + targetX;
                od.y = relativeTransform.center.y + targetY;
            }
        } else {
            //relative transform init
            let targetX, targetY;
            targetX = v.xFromCenter;
            targetY = v.yFromCenter;

            //relative transform scale
            if(changedProps.scale) {
                targetX *= relativeTransform.scale || 1;
                targetY *= relativeTransform.scale || 1;
            }

            //relative transofrm rotate
            if(changedProps.rot) {
                let newTargetX = (targetX * cosRot) + (targetY * sinRot);
                let newTargetY = (targetY * cosRot) - (targetX * sinRot);
                targetX = newTargetX;
                targetY = newTargetY;
            }

            //relative transform flip
            if(changedProps.flip) {
                if(relativeTransform.hflip) targetX *= -1;
                if(relativeTransform.vflip) targetY *= -1;
            }

            //relative transform z order
            if(changedProps.zorder) {
                od.order = v.zorder + relativeTransform.zorder;
            }

            //relative transform x,y
            if(changedProps.pos) {
                targetX += relativeTransform.x;
                targetY += relativeTransform.y;
            }

            //relative transform finish
            targetX += relativeTransform.center.x;
            targetY += relativeTransform.center.y;
            targetX = Math.round(targetX*1000/30)/1000*30;
            targetY = Math.round(targetY*1000/30)/1000*30;

            //relative transform apply
            let targetScale = v.scale * relativeTransform.scale;
            if(targetScale > 16) targetScale = 16;
            let targetRot = v.rotation + relativeTransform.rotation;
            targetRot *= relativeTransform.hflip ? -1 : 1;
            targetRot *= relativeTransform.vflip ? -1 : 1;
            if(targetRot < 0) targetRot += 360;
            else if(targetRot >= 360) targetRot -= 360;

            od.x = targetX;
            od.y = targetY;
            od.scale = targetScale;

            if(relativeTransform.hflip ^ v.flipx) od.flipx = 1;
            else od.flipx = null;
            if(relativeTransform.vflip ^ v.flipy) od.flipy = 1;
            else od.flipy = null;

            if(od && objectsData.solids.includes(od.id)) od.r = Math.round(targetRot/90)*90;
            else od.r = targetRot;
        }

        level.editObject(k, od);
    });

    if(shiftcenter) {
        relativeTransform.center.x += objAlignData[objid] ? objAlignData[objid].alignX : 0;
        relativeTransform.center.x += objAlignData[objid] ? objAlignData[objid].alignY : 0;
        objcontent.xFromCenter -= objAlignData[objid] ? objAlignData[objid].alignX : 0;
        objcontent.yFromCenter -= objAlignData[objid] ? objAlignData[objid].alignY : 0;
        relativeTransform.shiftcenter = false;
    }

    level.confirmEdit();
    renderer.renderLevel(level, cvs.width, cvs.height, options);
}

// this file contains all the high-levels functions to work with the renderer
// (load level, update screen, move camera, edit stuff, etc.)
export default {
    init: (canvas, top_canvas) => {
        options = {
            grid: true,
            custom_colors: {
                "-1": {r: 0, g: 0.8, b: 1, a: 0.7, i: true}
            }
        };
        gl = canvas.getContext("webgl");
        renderer = new GDRenderer(gl, (e) => {
            document.querySelector('#bottom-render-progress').style.width = (e.progress*100) + '%';
            if(e.loaded) {
                setTimeout(() => {
                    let event = new CustomEvent('editor', { detail: {
                        action: 'update',
                        softUpdate: true
                    }});
                    dispatchEvent(event);
                    document.querySelector('#render').classList.remove('hid');
                }, 100);
                document.querySelector('#bottom-render-progress').style.width = '100%';
                setTimeout(() => {
                    document.querySelector('#bottom-render-progress').style.background = '#f88';
                    document.querySelector('#bottom-render-progress').parentElement.style.borderColor = '#f88';
                    document.querySelector('#bottom-render-text').innerText = 'There was a problem loading the level!';
                    document.querySelector('#bottom-render-text').style.color = '#f88';
                }, 5000);
            }
        });
        cvs = canvas;

        top = new TopCanvas(top_canvas);
    },
    getLevel: () => {
        return level.getLevel();
    },
    update: (canvas) => {
        if(!canvas) return;
        renderer.renderLevel(level, canvas.width, canvas.height, options);
    },
    moveTo: (x, y, z) => {
        renderer.camera.x = x;
        renderer.camera.y = y;
        renderer.camera.zoom = z;

        if (sel) {
            let p1 = renderer.levelToScreenPos(sel.x1, sel.y1);
            let p2 = renderer.levelToScreenPos(sel.x2, sel.y2);

            top.setSelectionBox({
                x1: p1.x,
                y1: p1.y,
                x2: p2.x,
                y2: p2.y
            });
        }
    },
    getCoords: () => {
        return { x: renderer.camera.x, y: renderer.camera.y, z: renderer.camera.zoom }
    },
    setOption: (opt, val) => {
        options[opt] = val;
    },
    toggleOption: (opt) => {
        options[opt] = !options[opt];
    },
    initLevel: (lvl) => {
        level = new EditorLevel(renderer, lvl);
    },
    getObjectByKey: (key) => {
        return level.getObject(key);
    },
    getObjects: (x, y) => {
        return level.getObjectsAt(x, y);
    },
    getObjectsFromRect: (rect) => {
        return level.getObjectsIn(rect);
    },
    screen2LevelCoords: (x, y) => {
        return renderer.screenToLevelPos(x, y);
    },
    beginSelectionBox: (x, y) => {
        let pos = renderer.screenToLevelPos(x, y);
        sel = {x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y};
    },
    selectTo: (x, y) => {
        let pos = renderer.screenToLevelPos(x, y);

        if(!sel) return;

        sel.x2 = pos.x;
        sel.y2 = pos.y;
        
        let p1 = renderer.levelToScreenPos(sel.x1, sel.y1);
        let p2 = renderer.levelToScreenPos(sel.x2, sel.y2);

        top.setSelectionBox({
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y
        });
    },
    selectObjectInSel: (sel, additive) => {
        let x = Math.min(sel.x1, sel.x2);
        let y = Math.min(sel.y1, sel.y2);
        let w = Math.max(sel.x1, sel.x2) - x;
        let h = Math.max(sel.y1, sel.y2) - y;

        let rect = { x: x, y: y, w: w, h: h };

        let objids = level.getObjectsIn(rect);
        let prevSelect = selectedObjs.slice();
        if(additive) {
            objids.forEach(k => {
                if(!selectedObjs.includes(k)) selectedObjs.push(k);
            });
        } else {
            selectedObjs = objids;
        }
        
        selectObjects();
        addUndoGroupAction({
            type: 'select',
            selectBefore: prevSelect,
            selectAfter: selectedObjs
        });
        submitUndoGroup();
    },
    selectObjectAt: (x, y, cycle, additive) => {
        let p = renderer.screenToLevelPos(x, y);

        let objid;
        if(cycle) {
            objid = [level.cycleObjectAt(p.x, p.y)];
            if(objid[0] == null) objid = [];
        }
        else objid = level.getObjectsAt(p.x, p.y);

        let prevSelect = selectedObjs.slice();
        if(additive) {
            objid.forEach(k => {
                if(selectedObjs.includes(k)) selectedObjs.splice(selectedObjs.indexOf(k), 1);
                else selectedObjs.push(k);
            });
        } else {
            selectedObjs = objid;
        }
        selectObjects();
        addUndoGroupAction({
            type: 'select',
            selectBefore: prevSelect,
            selectAfter: selectedObjs
        });
        submitUndoGroup();
    },
    selectObjectByKey: (k, dontSubmitUndo) => {
        let prevSelect = selectedObjs.slice();
        if(Array.isArray(k)) {
            let objid = [];
            k.forEach(kk => {
                objid.push(kk);
            });
            selectedObjs = objid;
        } else {
            selectedObjs = [k];
        }
        selectObjects(); 
        addUndoGroupAction({
            type: 'select',
            selectBefore: prevSelect,
            selectAfter: selectedObjs
        });
        if(!dontSubmitUndo) submitUndoGroup();
    },
    clearSelected: (dontSubmitUndo) => {
        let prevSelect = selectedObjs.slice();
        selectedObjs = [];
        selectObjects();
        relativeTransform = {};
        globalPrevProps = {};
        addUndoGroupAction({
            type: 'select',
            selectBefore: prevSelect,
            selectAfter: selectedObjs
        });
        if(!dontSubmitUndo) submitUndoGroup();
    },
    closeSelectionBox: () => {
        sel = null;
        top.setSelectionBox(sel);
    },
    getSelection: () => {
        return sel;
    },
    getSelectedObjects: () => {
        return selectedObjs;
    },
    getRelativeTransform: () => {
        return relativeTransform;
    },
    setRelativeTransform: (obj) => {
        updateRelativeTransform(obj, obj.shiftcenter);
    },
    placeObject: (opt) => {
        if(!level) return;

        let optdata = [];
        if(Array.isArray(opt.data)) {
            optdata = opt.data;
        } else {
            optdata = [opt.data];
        }

        let keys = [];
        switch (opt.mode) {
            case 'add':
                optdata.forEach(d => {
                    let obj = level.createObject(d.id, d.x, d.y, !opt.disableCenterCorrection);
                    Object.keys(d).forEach(k => {
                        if(k == 'id' || k == 'x' || k == 'y') return;
                        let v = d[k];
                        obj[k] = v;
                    });
                    let objkey = level.addObject(obj);
                    keys.push(objkey);
                    addUndoGroupAction({
                        type: 'addObject',
                        key: objkey,
                        props: {
                            id: d.id,
                            x: d.x,
                            y: d.y
                        }
                    });
                });
                break;
            case 'remove':
                optdata.forEach(d => {
                    let obj = level.getObject(d.id);
                    level.removeObject(d.id);
                    keys.push(d.id);
                    addUndoGroupAction({
                        type: 'removeObject',
                        key: d.id,
                        props: obj
                    });
                });
                break;
            case 'edit':
                optdata.forEach(d => {
                    let prevPropsAll = globalPrevProps[d.id] || level.getObject(d.id);
                    let props = d.props || opt.props;
                    let prevProps = {};
                    Object.keys(props).forEach(k => {
                        if(props[k]) prevProps[k] = prevPropsAll[k] || 0;
                    });
                    level.editObject(d.id, d.props || opt.props);
                    globalPrevProps[d.id] = JSON.parse(JSON.stringify(level.getObject(d.id)));
                    keys.push(d.id);
                    addUndoGroupAction({
                        type: 'editObject',
                        key: d.id,
                        propsBefore: prevProps,
                        propsAfter: JSON.parse(JSON.stringify(props))
                    });
                });
                break;
        }
        level.confirmEdit();
        renderer.renderLevel(level, cvs.width, cvs.height, options);
        if(!opt.dontSubmitUndo) submitUndoGroup();
        return keys;
    },
    addUndoGroupAction: (obj, dontSubmitUndo) => {
        addUndoGroupAction(obj);
        if(!dontSubmitUndo) submitUndoGroup();
    },
    submitUndoGroup: () => {
        submitUndoGroup();
    },
    moveInHistory: (t) => {
        moveInHistory(t);
    }
}
