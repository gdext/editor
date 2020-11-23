import navbarData from '../assets/navbar.json';
import buildtabData from '../assets/buildtab.json';
import logoSrc from '../assets/logo-mono.svg';
import icBuild from '../assets/ic-build.svg';
import icEdit from '../assets/ic-edit.svg';
import icDelete from '../assets/ic-delete.svg';
import icMinimize from '../assets/ic-minimize.svg';
import ui from './ui';
import util from './util';
import renderer from './canvas';
import levelparse from './levelparse';

export default {
    generateNavbar: (navbar) => {
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

        //add menus
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
                    menuOptions.innerHTML += `<div id="nav${o.id}" actionid="${o.id}">${o.name}</div>`;
                });
                menuOptions.innerHTML += `<separator></separator>`;
            });
            menu.appendChild(menuTitle);
            menu.appendChild(menuOptions);
            sectionOptions.appendChild(menu);
        });

        //add actions
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
            import(`../assets/${img.icon}`).then(({default: i}) => {
                action.src = i;
                sectionActions.appendChild(action);
            }).catch(() => {
                console.error('Cannot load asset');
            });
        });

        //autosaving
        let autosaveCheckbox = ui.createCheckbox('Autosaving', 'toggleAutosave', false);
        sectionCheckbox.appendChild(autosaveCheckbox);
    },
    generateMain: (elem) => {
        const navbar = document.getElementById('appNavbar');
        const bottom = document.getElementById('appBottom');

        const canvas = document.createElement('canvas');
        const canvasSize = util.calcCanvasSize(
            { width: window.innerWidth, height: window.innerHeight }, 
            navbar.getBoundingClientRect(), 
            bottom.getBoundingClientRect()
        );

        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        canvas.id = "render";
        elem.appendChild(canvas);

        let l = localStorage.getItem('lvlcode');
        //localStorage.setItem('lvlcode', l);

        renderer.init(canvas, levelparse.code2object(l));
        renderer.update(canvas);
        setInterval(() => {
            renderer.update(canvas);
        }, 5000);

        //mouse events
        canvas.onmousedown = (e) => {
            if(e.button == 1) {
                let coords = renderer.getCoords();
                window.onmousemove = (e1) => {
                    coords.x -= e1.movementX / coords.z;
                    coords.y -= e1.movementY / coords.z;
                    renderer.moveTo(coords.x, coords.y, coords.z);
                    renderer.update(canvas);
                }
                function stopMove() {
                    window.onmousemove = null;
                    window.onmouseup = null;
                    window.onmouseout = null;
                }
                window.onmouseup = stopMove;
                window.onmouseout = stopMove;
            }
        }

        canvas.onwheel = (e) => {
            let coords = renderer.getCoords();
            if(e.deltaY < 0) coords.z *= 1.1;
            else coords.z /= 1.1;
            renderer.moveTo(coords.x, coords.y, coords.z);
            renderer.update(canvas);
        }  
    },
    generateBottom: (elem) => {
        //tabs selector
        let tabs = document.createElement('div');
        tabs.classList.add('bottom-tabs');
        let content = document.createElement('div');
        content.classList.add('bottom-content');
        
        let tabsContent = [{ icon: icBuild, tab: 'tabBuild' }, { icon: icEdit, tab: 'tabEdit' }, { icon: icDelete, tab: 'tabDelete' }];
        tabsContent.forEach(t => {
            let tabButton = document.createElement('div');
            tabButton.classList.add('tab-selector');
            tabButton.title = t.tab.slice(3);
            let tabIcon = new Image();
            tabIcon.src = t.icon;
            tabButton.appendChild(tabIcon);
            tabButton.onclick = () => {
                tabsContent.forEach(nt => { document.getElementById(nt.tab).classList.remove('sel') });
                document.getElementById(t.tab).classList.add('sel');
                let tabSelectors = Object.values(document.getElementsByClassName('tab-selector'));
                tabSelectors.forEach(ts => { ts.classList.remove('sel') });
                tabButton.classList.add('sel');
            }

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
                util.loadObjects(buildContent, t.id, 128);
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

        //load objects
        util.loadObjects(buildContent, 'blocks', 128);

        let tab1 = document.getElementById('tabBuild');
        tab1.appendChild(buildTitle);
        tab1.appendChild(buildContent);
        tab1.appendChild(buildCategories);
        document.querySelector('.tab-category-selector').classList.add('sel');

        //minimize/maximize button
        let minBtn = document.createElement('img');
        minBtn.src = icMinimize;
        minBtn.classList.add('bottom-floatbutton');
        minBtn.onclick = () => elem.classList.toggle('min');
        elem.appendChild(minBtn);
    }
}