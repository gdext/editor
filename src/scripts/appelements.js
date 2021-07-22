import navbarData from '../assets/navbar.json';
import buildtabData from '../assets/buildtab.json';

import logoSrc from '../assets/logo-mono.svg';
import logoGDRenderW from '../assets/logo-gdrenderw.svg';
import icBuild from '../assets/ic-build.svg';
import icEdit from '../assets/ic-edit.svg';
import icDelete from '../assets/ic-delete.svg';
import icMinimize from '../assets/ic-minimize.svg';
import icInfo from '../assets/ic-info.svg';
import icClose from '../assets/ic-close.svg';

import ui from './ui';
import util from './util';
import renderer from './canvas';
import levelparse from './levelparse';
import actionsExec from './actions';
import keyboard from './keyboard';
import menus from './menus';

let buildSelection = 1;
let selectedTab = 0; // 0 - build, 1 - edit, 2 - delete

export default {
    generateNavbar: (navbar) => {
        // build navbar from DOM elements
        const navbarLeft = document.createElement('div');
        navbarLeft.classList.add('navbar-element');
        navbarLeft.classList.add('navbar-left');
        navbar.appendChild(navbarLeft);

        const navbarRight = document.createElement('div');
        navbarRight.classList.add('navbar-element');
        navbarRight.classList.add('navbar-right');
        navbar.appendChild(navbarRight);

        //add sections
        let sectionLogo = document.createElement('div');
        sectionLogo.classList.add('navbar-section');
        let sectionOptions = document.createElement('div');
        sectionOptions.classList.add('navbar-section');
        navbarLeft.appendChild(sectionLogo);
        navbarLeft.appendChild(sectionOptions);

        let sectionCheckbox = document.createElement('div');
        sectionCheckbox.classList.add('navbar-section');
        let sectionActions = document.createElement('div');
        sectionActions.classList.add('navbar-section');
        navbarRight.appendChild(sectionCheckbox);
        navbarRight.appendChild(sectionActions);

        //logo
        let logo = new Image();
        logo.src = logoSrc;
        logo.classList.add('logo');
        logo.height = 20;
        sectionLogo.appendChild(logo);

        //add menus on the left (from '../assets/navbar.json')
        let menus = navbarData.left;
        menus.forEach(m => {
            let menu = document.createElement('div');
            menu.tabIndex = 0;
            menu.classList.add('navbar-menu');
            let menuTitle = document.createElement('div');
            menuTitle.classList.add('menu-title')
            menuTitle.innerText = m.title;
            let menuOptions = document.createElement('div');
            menuOptions.classList.add('menu-options');
            m.options.forEach(c =>{
                c.forEach(o => {
                    let menuOption = document.createElement('div');
                    menuOption.id = 'nav' + o.id;
                    menuOption.setAttribute('actionid', o.id);
                    menuOption.innerText = o.name;
                    menuOption.onclick = () => {
                        actionsExec.executeAction(o.id);
                        menu.blur();
                    }
                    menuOptions.appendChild(menuOption);
                });
                let separator = document.createElement('separator');
                menuOptions.appendChild(separator);
            });
            menu.appendChild(menuTitle);
            menu.appendChild(menuOptions);
            sectionOptions.appendChild(menu);
        });

        //add actions on the right (from '../assets/navbar.json')
        let actions = navbarData.right;
        actions.forEach(a => {
            let img = null;
            navbarData.left.forEach(m => {
                m.options.forEach(c => {
                    let filter = c.filter(f => f.id == a)[0];
                    if(filter) img = filter;
                });
            });
            
            let action = document.createElement('img');
            action.classList.add('navbar-action');
            action.setAttribute('actionid', img.id);
            action.title = img.name;
            action.onclick = () => {
                actionsExec.executeAction(img.id);
            }
            action.style.display = 'none';
            sectionActions.appendChild(action);
            import(`../assets/${img.icon}`).then(({default: i}) => {
                action.src = i;
                action.style.display = '';
            }).catch(() => {
                console.error('Cannot load asset');
                action.style.display = '';
            });
        });

        //autosaving checkbox
        ui.renderUiObject({
            properties: {
                type: 'checkbox',
                id: 'toggleAutosave',
                text: 'Autosaving',
                checked: function(){
                    if(localStorage.getItem('settings.autosaveEnabled') == '1') {
                        return true;
                    } else {
                        return false;
                    }
                },
                onCheckChange: function(c) {
                    if(c) {
                        localStorage.setItem('settings.autosaveEnabled', '1');
                    } else {
                        localStorage.setItem('settings.autosaveEnabled', '0');
                    }
                }
            }
        }, sectionCheckbox);

        ui.renderUiObject({
            properties: {
                type: 'label',
                id: 'autosaveTimeLabel',
                style: 'italic',
                color: '#888',
                text: 'Last saved a while back'
            }
        }, sectionCheckbox);
    },
    generateMain: (elem) => {
        // create canvas element
        const navbar = document.getElementById('appNavbar');
        const bottom = document.getElementById('appBottom');

        const canvasLoader = document.createElement('div');
        canvasLoader.id = 'bottom-render';
        const canvasLoaderLogo = document.createElement('img');
        canvasLoaderLogo.src = logoGDRenderW;
        canvasLoaderLogo.draggable = 'false';
        const canvasLoaderHeading = document.createElement('p');
        canvasLoaderHeading.id = 'bottom-render-text'
        canvasLoaderHeading.innerText = 'Loading GDRenderW';

        const canvasLoaderProgress = document.createElement('div');
        canvasLoaderProgress.classList.add('progress-bar-holder');
        const canvasLoaderProgressBar = document.createElement('div');
        canvasLoaderProgressBar.id = 'bottom-render-progress';
        canvasLoaderProgressBar.classList.add('progress-bar-content');
        canvasLoaderProgress.appendChild(canvasLoaderProgressBar);
        canvasLoader.appendChild(canvasLoaderLogo);
        canvasLoader.appendChild(canvasLoaderHeading);
        canvasLoader.appendChild(canvasLoaderProgress);

        const canvas = document.createElement('canvas');
        let canvasSize = util.calcCanvasSize(
            { width: window.innerWidth, height: window.innerHeight }, 
            navbar.getBoundingClientRect(), 
            bottom.getBoundingClientRect()
        );

        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        canvas.id = "render";
        canvas.classList.add('hid');

        const top_canvas = document.createElement('canvas');
        top_canvas.width = canvasSize.width;
        top_canvas.height = canvasSize.height;
        top_canvas.id = "top-render";

        const canvasUi = document.createElement('div');
        canvasUi.style.width = canvasSize.width + 'px';
        canvasUi.style.height = canvasSize.height + 'px';
        canvasUi.classList.add('main-canvas-ui');

        let canvasUiOptions = document.createElement('div');
        canvasUiOptions.className = 'canvas-ui-element t l';
        ui.renderUiObject(menus.getCanvasMenus().canvasOptions, canvasUiOptions);
        canvasUi.appendChild(canvasUiOptions);

        let canvasUiQuicktools = document.createElement('div');
        canvasUiQuicktools.className = 'canvas-ui-element t r';
        canvasUiQuicktools.id = 'canvasQuickTools';
        if(localStorage.getItem('settings.showQuickTools') == '1') {
            canvasUiQuicktools.classList.add('hid');
        }

        let quicktoolsContent = document.createElement('div');
        ui.renderUiObject(menus.getQuickToolsMenu(), quicktoolsContent);
        canvasUiQuicktools.appendChild(quicktoolsContent);

        let quicktoolsInfo = document.createElement('span');
        quicktoolsInfo.innerText = 'Quick Tools |';
        let quicktoolsIcInfo = document.createElement('img');
        quicktoolsIcInfo.src = icInfo;
        quicktoolsIcInfo.onclick = () => {
            util.alert(
                'quickToolsInfoDialog', 
                'Quick Tools', 
                'Quick Tools provides an easy way to access most used functions.\n' + 
                'You can organize the quick tools buttons and change their functions.\n' +
                'You can also close the quick tools panel (can be re-opened in Settings > Editor)\n',
                'OK'
            );
        }
        let quicktoolsIcClose = document.createElement('img');
        quicktoolsIcClose.src = icClose;
        quicktoolsIcClose.onclick = () => {
            localStorage.setItem('settings.showQuickTools', '1');
            util.showNotif(
                'quickToolsCloseNotif',
                'Quick Tools were closed. If you want to re-open them, go to Settings > Editor',
                5000
            )
            canvasUiQuicktools.classList.add('hid');
        }
        quicktoolsInfo.appendChild(quicktoolsIcInfo);
        quicktoolsInfo.appendChild(quicktoolsIcClose);
        canvasUiQuicktools.appendChild(quicktoolsInfo);
        
        canvasUi.appendChild(canvasUiQuicktools);

        elem.appendChild(canvasLoader);
        elem.appendChild(canvas);
        elem.appendChild(top_canvas);
        elem.appendChild(canvasUi);

        // load level data of the selected level
        let l = {
            data: localStorage.getItem('lvlcode'),
            name: localStorage.getItem('lvlname'),
            song: localStorage.getItem('lvlsong'),
        }
        if(localStorage.getItem('lvlnumber') && localStorage.getItem('lvlnumber') != '-1') {
            l = actionsExec.getLevelData(localStorage.getItem('lvlnumber'));
            localStorage.setItem('lvlcode', l.data);
            localStorage.setItem('lvlname', l.name);
            localStorage.setItem('lvlsong', l.song);
        }
        util.updateTitle();

        // initialize canvas, update it every 5 seconds
        renderer.init(canvas, top_canvas);
        renderer.initLevel(levelparse.code2object(l.data));
        renderer.update(canvas);
        setInterval(() => {
            renderer.update(canvas);
        }, 5000);

        //mouse events
        function beginScreenPanning(e) {
            let coords = renderer.getCoords();
            let moving = true;
            let drag = false;
            util.setCursor('grab');
            function update() {
                renderer.update(canvas);
                if (moving)
                    window.requestAnimationFrame(update);
            }
            update();
            window.onmousemove = (e1) => {
                drag = true;
                coords.x -= e1.movementX / coords.z;
                coords.y -= e1.movementY / coords.z;
                renderer.moveTo(coords.x, coords.y, coords.z);
            }
            function stopMove() {
                window.onmousemove = null;
                window.onmouseup = null;
                window.onmouseout = null;
                moving = false;
                renderer.update(canvas);
                util.setCursor();
                if(!drag) {
                    let prevsel = renderer.getSelectedObjects().slice();
                    renderer.selectObjectAt(e.offsetX, e.offsetY, true);
                    let sel = renderer.getSelectedObjects();
                    if(Array.isArray(sel) && sel.length > 0) {
                        let event = new CustomEvent('bottom', { detail: {
                            action: 'selectObject',
                            id: renderer.getObjectByKey(sel[0]).id
                        }});
                        dispatchEvent(event);
                    } else {
                        renderer.selectObjectByKey(prevsel);
                    }
                }
            }
            window.onmouseup = stopMove;
            window.onmouseout = stopMove;
        }

        function beginObjectBuilding(e) {
            if(document.activeElement.id != 'app') return;
            let eX = e.offsetX;
            let eY = e.offsetY;
            let coordsArray = [];
            let moving = true;
            renderer.clearSelected(true);
            function update() {
                let coords = renderer.screen2LevelCoords(eX, eY);
                let tx = Math.floor(coords.x/30)*30 + 15;
                let ty = Math.floor(coords.y/30)*30 + 15;
                let ta = tx + '|' + ty;
                if(!coordsArray.includes(ta)) {
                    let objkeys = renderer.placeObject({ mode: 'add', data: { id: buildSelection, x: tx, y: ty }, dontSubmitUndo: true });
                    if(objkeys) renderer.selectObjectByKey(objkeys, true);
                    renderer.update(canvas);
                    coordsArray.push(ta);
                }
                if (moving)
                    window.requestAnimationFrame(update);
            }
            update();
            top_canvas.onpointermove = (e1) => {
                eX = e1.offsetX;
                eY = e1.offsetY;
            }
            
            function stop() {
                top_canvas.onpointermove = null;
                window.onpointerup = null;
                moving = false;
                window.onpointerout = null;
                renderer.update(canvas);
                renderer.submitUndoGroup();
            }
            window.onpointerup = stop;
            window.onpointerout = stop;
        }

        function beginObjectSelection(e) {
            let eX = e.offsetX;
            let eY = e.offsetY;
            renderer.beginSelectionBox(eX, eY);
            let moving = true;
            function update() {
                renderer.selectTo(eX, eY);
                if (moving)
                    window.requestAnimationFrame(update);
            }
            update();
            top_canvas.onpointermove = (e1) => {
                eX = e1.offsetX;
                eY = e1.offsetY;
            }
            
            function stop() {
                top_canvas.onpointermove = null;
                window.onpointerup = null;
                moving = false;
                window.onpointerout = null;

                let selection = renderer.getSelection();
                let selectionSize = Math.max(Math.abs(selection.x1 - selection.x2), Math.abs(selection.y1 - selection.y2))
                if(selectionSize > 0) renderer.selectObjectInSel(selection, keyboard.getKeys().includes(16));
                else renderer.selectObjectAt(eX, eY, true, keyboard.getKeys().includes(16));
                renderer.closeSelectionBox();
                updateEditInputs();
            }
            window.onpointerup = stop;
            window.onpointerout = stop;
        }

        function beginScreenZooming(e, mode) {
            let coords = renderer.getCoords();
            if(!mode || mode == 0) {
                if(e.deltaY >= 0) coords.z *= 1 - (e.deltaY/1000);
                else coords.z /= 1 - (e.deltaY/-1000);

                if(coords.z > 10) coords.z = 10;
                else if(coords.z < 0.2) coords.z = 0.2;
            } else {
                let a = ['z', 'x', 'y']
                let b = a[mode];
                coords[b] += (e.deltaY/4)/coords.z;
            }
            renderer.moveTo(coords.x, coords.y, coords.z);
            renderer.update(canvas);
        }

        function updateEditInputs() {
            let relativeTransform = renderer.getRelativeTransform();

            // position
            let xposinput = document.querySelector('#editXPos');
            let yposinput = document.querySelector('#editYPos');
            let editrow1 = xposinput.parentElement.parentElement;
            xposinput.setAttribute('unit', '');
            yposinput.setAttribute('unit', '');
            if(relativeTransform.x != undefined && relativeTransform.y != undefined) {
                if(!relativeTransform.absolute) {
                    xposinput.setAttribute('unit', ' (relative)');
                    yposinput.setAttribute('unit', ' (relative)');
                }
                xposinput.value = relativeTransform.x/3 + xposinput.getAttribute('unit');
                yposinput.value = relativeTransform.y/3 + yposinput.getAttribute('unit');
                editrow1.classList.remove('disabled');
            } else {
                xposinput.value = '';
                yposinput.value = '';
                editrow1.classList.add('disabled');
            }

            // rotation & scale
            let rotinput = document.querySelector('#editRot');
            let scaleinput = document.querySelector('#editScale');
            let zorderinput = document.querySelector('#editZOrder');
            let editrow2 = rotinput.parentElement.parentElement;
            let editrow3 = rotinput.parentElement.parentElement.parentElement.children[2];
            rotinput.setAttribute('unit', '°');
            scaleinput.setAttribute('unit', '');
            zorderinput.setAttribute('unit', '');
            if(relativeTransform.rotation != undefined && relativeTransform.scale != undefined && relativeTransform.zorder != undefined) {
                if(!relativeTransform.absolute) {
                    rotinput.setAttribute('unit', '° (relative)');
                    scaleinput.setAttribute('unit', ' (relative)');
                    zorderinput.setAttribute('unit', ' (relative)');
                }
                rotinput.value = relativeTransform.rotation + rotinput.getAttribute('unit');
                scaleinput.value = relativeTransform.scale + scaleinput.getAttribute('unit');
                zorderinput.value = relativeTransform.zorder + zorderinput.getAttribute('unit');
                editrow2.classList.remove('disabled');
                editrow3.classList.remove('disabled');
            } else {
                rotinput.value = '';
                scaleinput.value = '';
                zorderinput.value = '';
                editrow2.classList.add('disabled');
                editrow3.classList.add('disabled');
            }
        }

        function finishObjectTransform() {
            let data = [];
            renderer.getSelectedObjects().forEach(k => {
                data.push({ id: k, props: renderer.getObjectByKey(k) });
            });
            renderer.placeObject({
                mode: 'edit',
                data: data
            });
        }

        updateEditInputs();

        //renderer events
        window.addEventListener('renderer', e => {
            if(e.detail == 'toggleTroubleshoot') {
                renderer.toggleOption('troubleshoot');
                renderer.update(canvas);
            }
        });

        top_canvas.onmousedown = (e) => {
            if(e.button == 1) {
                beginScreenPanning(e);
            }
        }

        top_canvas.onpointerdown = (e) => {
            if(e.button == 0) {
                if(keyboard.getKeys().includes(32)) {
                    beginScreenPanning();
                } else {
                    if(selectedTab == 0) beginObjectBuilding(e);
                    else beginObjectSelection(e);
                }
            }
        }

        // zoom canvas buttons
        setTimeout(() => {
            document.querySelector('#levelZoomIn').onclick = () => {
                beginScreenZooming({deltaY: -200}, 0);
            }
            document.querySelector('#levelZoomOut').onclick = () => {
                beginScreenZooming({deltaY: 200}, 0);
            }
        }, 100);

        // TODO: Replace the text context menu with data from menus.js
        top_canvas.oncontextmenu = (e) => {
            //test context menu
            ui.renderUiObject(menus.getContextMenu('editObjectNormal', {x: e.pageX, y: e.pageY}), document.body);
            return false;
        }

        //on resize
        function resizeCanvas() {
            canvasSize = util.calcCanvasSize(
                { width: window.innerWidth, height: window.innerHeight }, 
                navbar.getBoundingClientRect(), 
                bottom.getBoundingClientRect()
            );
            canvas.width = canvasSize.width;
            canvas.height = canvasSize.height;
            
            top_canvas.width = canvasSize.width;
            top_canvas.height = canvasSize.height;

            canvasUi.style.width = canvasSize.width + 'px';
            canvasUi.style.height = canvasSize.height + 'px';
            renderer.update(canvas);
        }

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('resizeCanvas', resizeCanvas);

        //on viewport scroll
        top_canvas.onwheel = (e) => {
            let mode = 0;
            let keys = keyboard.getKeys()
            if(keys.includes(16)) mode = 1;
            else if(keys.includes(17)) mode = 2;
            beginScreenZooming(e, mode);
            return false;
        }  


        
        //editor events
        window.addEventListener('editor', (e) => {
            let detail = e.detail;
            if(typeof detail != 'object') return;
            let data = [];
            let keys;
            switch(detail.action) {
                case 'delete':
                    data = [];
                    renderer.getSelectedObjects().forEach(k => {
                        data.push({ id: k });
                    });
                    renderer.placeObject({
                        mode: 'remove',
                        data: data
                    });
                    document.querySelector('#app').focus();
                    break;
                case 'duplicate':
                    data = [];
                    renderer.getSelectedObjects().forEach(k => {
                        let props = JSON.parse(JSON.stringify(renderer.getObjectByKey(k)));
                        props.x += 30;
                        props.y -= 30;
                        data.push(props);
                    });
                    keys = renderer.placeObject({
                        mode: 'add',
                        data: data,
                        disableCenterCorrection: true,
                        dontSubmitUndo: true
                    });
                    renderer.selectObjectByKey(keys);
                    document.querySelector('#app').focus();
                    break;
                case 'transform':
                    data = [];
                    if(detail.mode == 'add') {
                        let relativeTransform = renderer.getRelativeTransform();
                        Object.keys(detail.data).forEach(k => {
                            let v = detail.data[k];
                            if(k == 'shiftcenter') relativeTransform[k] = v;
                            else if(v == '$invert') relativeTransform[k] = !relativeTransform[k];
                            else relativeTransform[k] += v;
                        });
                        renderer.setRelativeTransform(relativeTransform);
                    } else {
                        renderer.setRelativeTransform(detail.data);
                    }
                    updateEditInputs();
                    finishObjectTransform();
                    break;
                case 'update': 
                    if(!detail.softUpdate) updateEditInputs();
                    if(!detail.softUpdate) finishObjectTransform();
                    renderer.update(canvas);
                    break;
                case 'deselect': 
                    renderer.clearSelected();
                    break;
                case 'copy':
                    let center = JSON.parse(JSON.stringify(renderer.getRelativeTransform().center));
                    center.x = Math.round(center.x/30)*30;
                    center.y = Math.round(center.y/30)*30;

                    let clipboard = [];
                    renderer.getSelectedObjects().forEach(k => {
                        let obj = JSON.parse(JSON.stringify(renderer.getObjectByKey(k)));
                        obj.x = obj.x - center.x;
                        obj.y = obj.y - center.y;
                        clipboard.push(obj);
                    });
                    util.copyToClipboard(clipboard, 'objdata');
                    break;
                case 'cut':
                    let center2 = JSON.parse(JSON.stringify(renderer.getRelativeTransform().center));
                    center2.x = Math.round(center2.x/30)*30;
                    center2.y = Math.round(center2.y/30)*30;

                    let clipboard2 = [];
                    renderer.getSelectedObjects().forEach(k => {
                        let obj = JSON.parse(JSON.stringify(renderer.getObjectByKey(k)));
                        obj.x = obj.x - center2.x;
                        obj.y = obj.y - center2.y;
                        clipboard2.push(obj);
                    });
                    util.copyToClipboard(clipboard2, 'objdata');

                    data = [];
                    renderer.getSelectedObjects().forEach(k => {
                        data.push({ id: k });
                    });
                    renderer.placeObject({
                        mode: 'remove',
                        data: data,
                        dontSubmitUndo: true
                    });
                    renderer.clearSelected();

                    break;
                case 'paste':
                    let getclipboard = util.getClipboard('objdata');
                    let screen = renderer.screen2LevelCoords(canvasSize.width/2, canvasSize.height/2);
                    let newcenter = {
                        x: screen.x,
                        y: screen.y
                    };
                    newcenter.x = Math.round(newcenter.x/30)*30;
                    newcenter.y = Math.round(newcenter.y/30)*30;
                     
                    data = [];
                    getclipboard.forEach(obj => {
                        let objj = JSON.parse(JSON.stringify(obj));
                        objj.x += newcenter.x;
                        objj.y += newcenter.y;
                        data.push(objj);
                    });
                    keys = renderer.placeObject({
                        mode: 'add',
                        data: data,
                        disableCenterCorrection: true,
                        dontSubmitUndo: true
                    });
                    renderer.selectObjectByKey(keys);
                    break;
            }
        });
    },
    generateBottom: (elem) => {
        //tabs selector
        let tabs = document.createElement('div');
        tabs.classList.add('bottom-tabs');
        let content = document.createElement('div');
        content.classList.add('bottom-content');
        
        // create tabs and tab contents
        let tabsContent = [{ icon: icBuild, tab: 'tabBuild', id: 0 }, { icon: icEdit, tab: 'tabEdit', id: 1 }, { icon: icDelete, tab: 'tabDelete', id: 2 }];
        tabsContent.forEach(t => {
            // generate tab button selector
            let tabButton = document.createElement('div');
            tabButton.classList.add('tab-selector');
            tabButton.title = t.tab.slice(3);
            let tabIcon = new Image();
            tabIcon.src = t.icon;
            tabButton.appendChild(tabIcon);
            tabButton.onclick = () => {
                tabsContent.forEach(nt => { document.getElementById(nt.tab).classList.remove('sel') });
                document.getElementById(t.tab).classList.add('sel');
                selectedTab = t.id;
                let tabSelectors = Object.values(document.getElementsByClassName('tab-selector'));
                tabSelectors.forEach(ts => { ts.classList.remove('sel') });
                tabButton.classList.add('sel');
            }

            // generate tab holder
            let tab = document.createElement('div');
            tab.classList.add('bottom-tab');
            tab.id = t.tab;

            tabs.appendChild(tabButton);
            content.appendChild(tab);
        });

        elem.appendChild(tabs);
        elem.appendChild(content);
        let firstTab = document.querySelector('.bottom-tab');
        if(firstTab) firstTab.classList.add('sel');
        let firstTabSel = document.querySelector('.tab-selector');
        if(firstTabSel) firstTabSel.classList.add('sel');

        //build tab categories
        const buildContentBlocks = document.createElement('div');
        buildContentBlocks.classList.add('tab-content-blocks');
        const buildContentNext = document.createElement('div');
        buildContentNext.classList.add('tab-content-button');
        const buildContentPrevious = document.createElement('div');
        buildContentPrevious.classList.add('tab-content-button');

        // build tab vars
        let lastCategory = 'blocks';
        let page = 0;
        let keepPageOverride = false;

        // generate build tab
        let buildTitle = document.createElement('h4');
        buildTitle.innerText = 'Build';
        let buildContent = document.createElement('div');
        buildContent.classList.add('tab-content');
        let buildCategories = document.createElement('div');
        buildCategories.classList.add('tab-categories');
        buildtabData.tabs.forEach(t => {
            let buildCategory = document.createElement('div');
            buildCategory.classList.add('tab-category-selector');
            buildCategory.id = 'bcat' + t.id;
            buildCategory.title = t.name;
            buildCategory.onclick = () => {
                let catSelectors = Object.values(document.getElementsByClassName('tab-category-selector'));
                catSelectors.forEach(cs => { cs.classList.remove('sel') });
                buildCategory.classList.add('sel');
                buildTitle.innerText = `Build: ${t.name}`;
                //load objects
                if(!keepPageOverride) page = 0;
                loadObjs(t.id, page);
                lastCategory = t.id;
                keepPageOverride = false;
            }
            let categoryIcon = document.createElement('img');
            import(`../assets/buildtab/${t.icon}.svg`).then(({default: i}) => {
                categoryIcon.src = i;
                buildCategory.appendChild(categoryIcon);
            }).catch(() => {
                console.error('Cannot load asset');
            });
            buildCategories.appendChild(buildCategory);
        });

        //load objects into the build tab

        buildContent.appendChild(buildContentPrevious);
        buildContent.appendChild(buildContentBlocks);
        buildContent.appendChild(buildContentNext);

        function getObjs(category, pagee) {
            let ow = util.calcBuildObjectsAmount(buildContent);
            let l = Math.ceil(buildtabData.tabscontent[category].length / ow.amount);
            if(pagee > l-1) { 
                pagee = l;
                return 'h';
            }
            return {
                start: ow.amount*pagee+pagee,
                end: ow.amount*(pagee+1)+pagee
            }
        }

        function loadObjs(category, pagee) {
            buildContentBlocks.style.width = "";
            let ow = util.calcBuildObjectsAmount(buildContent);
            let l = Math.ceil(buildtabData.tabscontent[category].length / ow.amount);

            buildContentPrevious.classList.remove('lock');
            buildContentNext.classList.remove('lock');
            if(pagee == 0) buildContentPrevious.classList.add('lock');
            if(pagee >= l-1) buildContentNext.classList.add('lock');
            if(pagee > l-1) { 
                pagee = l;
                return 'h';
            }

            util.loadObjects(buildContentBlocks, category, ow.amount*pagee+pagee, ow.amount*(pagee+1)+pagee, (id, obj) => {
                let selobj = document.querySelector('canvas.sel');
                if(selobj) selobj.classList.remove('sel');
                buildSelection = id;
                obj.classList.add('sel');
            }, buildSelection);
            buildContentBlocks.style.width = ow.parentw;
        }

        function focusOnObj(id) {
            let categories = buildtabData.tabscontent;
            let targetCategory = null;
            Object.keys(categories).forEach(k => {
                let v = categories[k];
                if(Array.isArray(v) && v.includes(id)) targetCategory = k;
            });
            if(!targetCategory) return false;

            let targetIndex = categories[targetCategory].indexOf(id);
            if(targetIndex < 0) return false;

            let event = new CustomEvent('bottom', { detail: {
                action: 'setTab',
                tab: 0
            }});
            dispatchEvent(event);
            document.getElementById('bcat'+targetCategory).click();

            let targetPage = -1;
            let pi = 0;
            let done = false
            while(!done) {
                let objsdata = getObjs(targetCategory, pi);
                if(objsdata == 'h') done = true;
                else if(objsdata && objsdata.start <= targetIndex && objsdata.end >= targetIndex) {
                    done = true;
                    targetPage = parseInt(pi);
                }
                pi++;
            }
            if(targetPage < 0) return false;

            buildSelection = id;
            keepPageOverride = true;
            page = targetPage;
        }

        // append build tab
        let tab1 = document.getElementById('tabBuild');
        tab1.appendChild(buildTitle);
        tab1.appendChild(buildContent);
        tab1.appendChild(buildCategories);
        document.querySelector('.tab-category-selector').classList.add('sel');

        loadObjs('blocks', page);
        window.addEventListener('resize', () => {
            loadObjs(lastCategory, page);
        });
        buildContentNext.onclick = () => {
            page++;
            let h = getObjs(lastCategory, page);
            if(h == 'h') page--;
            loadObjs(lastCategory, page);
        }
        buildContentPrevious.onclick = () => {
            if(page > 0) {
                page--;
                loadObjs(lastCategory, page);
            }
        }

        let buildTabSelObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type == "attributes") {
                loadObjs(lastCategory, page);
                let event = new CustomEvent('editor', { detail: {
                    action: 'update'
                }});
                dispatchEvent(event);
              }
            });
        });

        //edit tab
        let tab2 = document.getElementById('tabEdit');
        let editTitle = document.createElement('h4');
        editTitle.innerText = 'Edit';
        tab2.appendChild(editTitle);
        let editContent = document.createElement('div');
        ui.renderUiObject(menus.getBottomMenus().editMenu, editContent);
        tab2.appendChild(editContent);

        //delete tab
        let tab3 = document.getElementById('tabDelete');
        let deleteTitle = document.createElement('h4');
        deleteTitle.innerText = 'Delete';
        tab3.appendChild(deleteTitle);
        let deleteContent = document.createElement('div');
        ui.renderUiObject(menus.getBottomMenus().deleteMenu, deleteContent);
        tab3.appendChild(deleteContent);

        buildTabSelObserver.observe(tab1, { attributes: true });
        buildTabSelObserver.observe(tab2, { attributes: true });

        //minimize/maximize button
        const resizeEvent = new Event('resizeCanvas');
        let minBtn = document.createElement('img');
        minBtn.src = icMinimize;
        minBtn.classList.add('bottom-floatbutton');
        minBtn.onclick = () => {
            elem.classList.toggle('min');
            window.dispatchEvent(resizeEvent);
        }
        elem.appendChild(minBtn);

        //bottom part events
        window.addEventListener('bottom', (e) => {
            let detail = e.detail;
            if(typeof detail != 'object') return;
            switch(detail.action) {
                case 'selectObject':
                    focusOnObj(detail.id);
                    break;
                case 'setTab':
                    //0 - build, 1 - edit, 2 - delete
                    if(detail.tab > 2 || detail.tab < 0) return;
                    document.getElementsByClassName('tab-selector')[detail.tab].click();
                    switch(detail.tab) {
                        case 0:
                            document.querySelector('#tabBuild').classList.add('sel');
                            break;
                        case 1:
                            document.querySelector('#tabEdit').classList.add('sel');
                            break;
                        case 2:
                            document.querySelector('#tabDelete').classList.add('sel');
                            break;
                    }
            }
        });
    }
}
