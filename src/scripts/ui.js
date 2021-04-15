import icPick from '../assets/ic-pick.svg';
import icSlide from '../assets/ic-slide.svg';
import icInfo from '../assets/ic-info.svg';
import icExit from '../assets/ic-exit.svg';
import icArrowLeft from '../assets/ic-arrowleft.svg';
import icArrowRight from '../assets/ic-arrowright.svg';
import icArrowDown from '../assets/ic-arrowdown.svg';
import keyboard from './keyboard';
import util from './util';

function UiObject() {

    this.createCheckbox = (name, id, state, options) => {
        let checkboxContainer = document.createElement('label');
        checkboxContainer.classList.add('ui-checkbox');
        checkboxContainer.innerText = name;
        if(options && options.light) checkboxContainer.classList.add('bbg');

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        if(id) checkbox.id = id;
        if(state) checkbox.checked = 'checked';

        let checkmark = document.createElement('span');
        checkmark.classList.add('checkbox-mark');

        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(checkmark);
        return checkboxContainer;
    }

    this.createButton = (name, id, icon, options) => {
        let button = document.createElement('button');
        button.classList.add('ui-button');

        let buttonText = document.createElement('span');
        buttonText.innerText = name;
        let buttonIcon = document.createElement('img');
        import(`../assets/${icon}`).then(({default: i}) => {
            buttonIcon.src = i;
        }).catch(() => {
            console.error('Cannot load asset');
        });
        buttonIcon.height = options.iconHeight;
        

        if(options && options.light) button.classList.add('bbg');
        if(options && options.primary) button.classList.add('primary');
        if(options && options.width) {
            button.style.width = options.width + 'px';
            button.style.minWidth = '0px';
        }
        if(options && options.height) button.style.height = options.height + 'px';
        if(icon && name) button.classList.add('s');
        if(id) button.id = id;

        if(icon) button.appendChild(buttonIcon);
        if(name) button.appendChild(buttonText);
        return button;
    }

    this.createInput = (type, options) => {
        let inputContainer = document.createElement('div');
        inputContainer.classList.add('ui-input');
        if(options && options.light) checkboxContainer.classList.add('bbg');

        let input = document.createElement('input');
        input.type = 'text';
        if(options.id) input.id = options.id;
        if(options.placeholder) input.placeholder = options.placeholder;

        if(options.defaultValue) input.value = options.defaultValue();
        if(type == 'number' && options.unit) input.value += options.unit;

        if(options.maxlength) input.maxLength = options.maxlength;
        if(options.minlength) input.minLength = options.minlength;

        if(options.max) input.max = options.max;
        if(options.min) input.min = options.min;

        inputContainer.appendChild(input);
        input.onchange = () => {
            //handle min/max
            if(input.value > options.max) input.value = options.max;
            else if(input.value < options.min) input.value = options.min;

            input.type = 'text'; 

            if(options.unit && !input.value.endsWith(options.unit)) {  input.value += options.unit; input.blur() }

            options.onValueChange(input.value);
        }
        input.onfocus = () => {
            inputContainer.classList.add('f');
            if(type == 'number') input.value = parseFloat(input.value);
            input.type = type;
        }
        input.onblur = () => {
            inputContainer.classList.remove('f');
            input.type = 'text';
        }

        if(options.icon) {
            let inputIcon = document.createElement('img');
            inputIcon.draggable = false;
            let src;
            let pointer = "";
            switch (options.icon) {
                case 'pick':
                    src = icPick;
                    pointer = 'pointer';
                    break;
                case 'slide':
                    src = icSlide;
                    pointer = 'e-resize';
                    break;
                case 'info':
                    src = icInfo;
                    pointer = 'pointer';
                    break;
            }
            inputIcon.src = src || (type == 'number' ? icSlide : icInfo);
            inputIcon.style.cursor = pointer || (type == 'number' ? 'e-resize' : 'pointer');

            let click = true;
            if(options.onIconClick) {
                inputIcon.onclick = e => {
                    if(click) options.onIconClick(e);
                }
            }

            if(type == 'number' && !options.onIconDrag) {
                function isInteger() {
                    return options.integerOnly || (options.defaultToInteger && !keyboard.getKeys().includes(16));
                }
                let v;
                let p;
                function moveFunction(e) {
                    click = false;
                    util.setCursor('e-resize');
                    let scale = options.scale || 1;
                    if(options.defaultToInteger && !isInteger()) scale = scale/10;
                    v += e.movementX * scale;
                    //handle min/max
                    if(v > options.max) v = options.max;
                    else if(v < options.min) v = options.min;

                    let pv = isInteger() ? Math.round(v) : Math.round(v*100)/100;
                    //handle numbers after the decimal point
                    if(!isInteger()) {
                        let afterDecimal = pv.toString().split('.')[1];
                        if(!afterDecimal) pv = pv + '.00';
                        else if(afterDecimal.length < 2) pv += '0';
                    }

                    if(options.unit) pv += options.unit;
                    p.value = pv;
                }
                function stopFunction() {
                    util.setCursor();
                    p.value = isInteger() ? Math.round(v) : Math.round(v*100)/100;
                    if(options.unit) p.value += options.unit;
                    document.removeEventListener('pointermove', moveFunction);
                    document.removeEventListener('pointerup', stopFunction);
                }

                inputIcon.onpointerdown = e => {
                    click = true;
                    p = e.target.parentElement.querySelector('input');
                    v = parseFloat(p.value);
                    document.addEventListener('pointermove', moveFunction);
                    document.addEventListener('pointerup', stopFunction);
                }
            }

            if(options.onIconDrag) {
                function moveFunction(e) {
                    click = false;
                    options.onIconDrag(e);
                }
                function stopFunction() {
                    document.removeEventListener('pointermove', moveFunction);
                    document.removeEventListener('pointerup', stopFunction);
                }

                inputIcon.onpointerdown = () => {
                    click = true;
                    document.addEventListener('pointermove', moveFunction);
                    document.addEventListener('pointerup', stopFunction);
                }
            }

            inputContainer.appendChild(inputIcon);
        }

        return inputContainer;
    }

    this.createTabs = (items, id, selected, options) => {
        let tabContainer = document.createElement('div');
        tabContainer.classList.add('ui-tabs');
        if(id) tabContainer.id = id;
        tabContainer.setAttribute('items', items.join('|'));
        tabContainer.setAttribute('value', selected);

        let ii = -1;
        items.forEach(i => {
            ii++;
            let localii = parseInt(ii);
            let tab = document.createElement('div');
            tab.classList.add('ui-tab-part');
            if(ii == selected) tab.classList.add('sel');
            tab.innerText = i;

            tab.onclick = () => {
                let prevsel = tabContainer.getElementsByClassName('sel')[0];
                prevsel.classList.remove('sel');
                tab.classList.add('sel');
                tabContainer.setAttribute('value', localii);
                if(options && options.onSelectChange) options.onSelectChange(localii, items);
            }

            tabContainer.appendChild(tab);
        });

        return tabContainer;
    }

    this.createList = (items, id, selected, options) => {
        let listContainer = document.createElement('div');
        listContainer.classList.add('ui-list');
        if(id) listContainer.id = id;
        listContainer.setAttribute('items', items.join('|'));
        listContainer.setAttribute('value', selected);

        let mode = 1;
        if(options && options.mode == 'dropdown') mode = 2;
        let listDisplay = document.createElement('p');
        listDisplay.classList.add('ui-list-display');
        listDisplay.innerText = items[selected];

        function updateSelected(n, mode) {
            var currentSelected = parseInt(listContainer.getAttribute('value'));
            if(mode) currentSelected=n;
            else currentSelected+=n;
            if(currentSelected >= items.length) currentSelected = 0;
            else if(currentSelected < 0) currentSelected = items.length-1;

            listDisplay.innerText = items[currentSelected];
            listContainer.setAttribute('value', currentSelected);

            if(options.onSelectChange) {
                options.onSelectChange(currentSelected, items);
            }
        }

        if(mode == 1) {
            let v;
            function moveFunction(e) {
                util.setCursor('e-resize');
                v += e.movementX * 0.06;
                if(v >= items.length) v = 0;
                else if(v < 0) v = items.length-1;
                updateSelected(Math.round(v), true);
            }
            function stopFunction() {
                util.setCursor();
                document.removeEventListener('pointermove', moveFunction);
                document.removeEventListener('pointerup', stopFunction);
            }

            listDisplay.onpointerdown = e => {
                v = parseInt(listContainer.getAttribute('value'));
                document.addEventListener('pointermove', moveFunction);
                document.addEventListener('pointerup', stopFunction);
            }

            let listArrowLeft = document.createElement('img');
            listArrowLeft.classList.add('ui-list-arrow');
            listArrowLeft.src = icArrowLeft
            listArrowLeft.onclick = () => {
                updateSelected(-1);
            }

            let listArrowRight = document.createElement('img');
            listArrowRight.classList.add('ui-list-arrow');
            listArrowRight.src = icArrowRight
            listArrowRight.onclick = () => {
                updateSelected(1);
            }

            listContainer.appendChild(listArrowLeft);
            listContainer.appendChild(listDisplay);
            listContainer.appendChild(listArrowRight);
        } else {
            listDisplay.classList.add('dropdown');
            let listDropdown = document.createElement('div');
            listDropdown.classList.add('ui-list-dropdown');

            let itemi = -1;
            items.forEach(item => {
                itemi++;
                let localitemi = itemi;
                let listDropdownItem = document.createElement('div');
                listDropdownItem.classList.add('ui-list-dropdown-item');
                listDropdownItem.innerText = item;
                listDropdownItem.onclick = () => {
                    updateSelected(localitemi, true);
                    setTimeout(() => {
                        closeFunction();
                    }, 64);
                }
                listDropdown.appendChild(listDropdownItem);
            });

            function closeFunction() {
                listDropdown.classList.remove('vis');
                document.removeEventListener('click', closeFunction);
            }

            let listArrowDropdown = document.createElement('img');
            listArrowDropdown.classList.add('ui-list-arrow');
            listArrowDropdown.src = icArrowDown;
            
            listContainer.onclick = () => {
                if(!listDropdown.classList.contains('vis')) {
                    listDropdown.classList.add('vis');
                    listDropdown.classList.remove('b');
                    let dropdownBox = listDropdown.getBoundingClientRect();
                    let listBox = listContainer.getBoundingClientRect();
                    let appBox = document.querySelector('#app').getBoundingClientRect();
                    listDropdown.style.top = (listBox.y + 28) + 'px';
                    listDropdown.style.left = (listBox.x - 1) + 'px';
                    listDropdown.style.width = listBox.width + 'px';
                    if(listBox.y + dropdownBox.height + 28 > appBox.height) {
                        listDropdown.classList.add('b');
                        listDropdown.style.top = (listBox.y - dropdownBox.height) + 'px';
                    }
                    setTimeout(() => {
                        document.addEventListener('click', closeFunction);
                    }, 64);
                }
                else closeFunction();
            }

            listContainer.appendChild(listDisplay);
            listContainer.appendChild(listArrowDropdown);
            listContainer.appendChild(listDropdown);
        }

        return listContainer;
    }

    this.createLabel = (id, text, style, options) => {
        let labelElement = document.createElement('p');
        labelElement.classList.add('ui-label');
        if(style) labelElement.classList.add(style);
        if(id) labelElement.id = id;
        labelElement.innerText = text;
        labelElement.style.color = options.color || "";

        if(options.textCutoff == 'trim') {
            labelElement.style.whiteSpace = 'nowrap';
            labelElement.style.overflow = 'hidden';
            labelElement.style.textOverflow = 'ellipsis';
        }
        if(options.marginTop) labelElement.style.marginTop = options.marginTop + 'px';
        if(options.marginBottom) labelElement.style.marginBottom = options.marginBottom + 'px';
        if(options.align == 'center') labelElement.style.textAlign = 'center';
        if(options.align == 'right') labelElement.style.textAlign = 'right';

        return labelElement;
    }

    this.createContainer = (id, title, direction, options) => {
        //create container itself
        let container = document.createElement('div');
        container.classList.add('ui-container');
        if(id) container.id = id;
        let directions = {row: 'r', column: 'c', inline: 'i'};
        container.classList.add(directions[direction] || 'c');
        container.style.padding = `${options.paddingY}px ${options.paddingX}px`;
        let scrolls = {none: '', vertical: 'sv', horizontal: 'sh', both: 'sb'};
        if(options.scroll) container.classList.add(scrolls[options.scroll]);
        if(options.isBottomBar) container.classList.add('bbg');

        //create title
        if(title) {
            let titleElem = document.createElement('p');
            titleElem.className = 'ui-label heading';
            titleElem.innerText = title;
            container.appendChild(title);
        }

        return container;
    }

    this.createDialog = (id, title, closeButton) => {
        let dialog = document.createElement('div');
        dialog.classList.add('ui-dialog');
        dialog.classList.add('uistretch');
        if(id) dialog.id = id;

        if(title) {
            let dialogTitle = document.createElement('h2');
            dialogTitle.innerText = title;
            dialog.appendChild(dialogTitle);
        }

        function openDialog() {
            dialog.classList.add('vis');
        }

        function closeDialog() {
            util.closeDialog(id);
        }

        if(closeButton) {
            let closeBtnElem = document.createElement('img');
            closeBtnElem.src = icExit;
            closeBtnElem.classList.add('ui-dialog-close');
            closeBtnElem.onclick = () => {
                closeDialog();
            }
            dialog.appendChild(closeBtnElem);
        }

        openDialog();
        return dialog;
    }

    this.createDialogBg = (id) => {
        let dialogBg = document.createElement('div');
        dialogBg.classList.add('ui-dialog-bg');
        dialogBg.id = id + 'Bg';

        return dialogBg;
    }

    this.createContextMenu = (id, title, options) => {
        let menu = document.createElement('div');
        menu.classList.add('ui-context-menu');
        menu.classList.add('uistretch');
        if(id) menu.id = id;
        if(options && options.maxwidth) menu.style.width = options.maxwidth;
        if(options && options.maxheight) menu.style.maxHeight = options.maxheight;
        if(options && options.x) menu.style.left = options.x + 'px';
        if(options && options.y) menu.style.top = options.y + 'px';

        if(title) {
            let menuTitle = document.createElement('p');
            menuTitle.classList.add('ui-label');
            menuTitle.classList.add('heading');
            menuTitle.classList.add('dialogtitle');
            menuTitle.innerText = title;
            menu.appendChild(menuTitle);
        }

        //if clicked outside context menu, remove it
        let clickedInsideContextMenu = false
        function windowClickEventListener() {
            let i = 0;
            while(!clickedInsideContextMenu && i < 100) {
                i++;
            }
            if(!clickedInsideContextMenu) {
                let menuParent = menu.parentElement;
                if(menuParent.parentElement) menuParent.parentElement.removeChild(menuParent);
                window.removeEventListener('mousedown', windowClickEventListener);
            }
            clickedInsideContextMenu = false;
        }

        window.addEventListener('mousedown', windowClickEventListener);

        menu.onmousedown = () => {
            clickedInsideContextMenu = true;
        }
        

        return menu;
    }

}

let uiObject = new UiObject();

export default {
    renderUiObject: (obj, elem) => {
        function cycle(o, e) {
            let elementContainer = document.createElement('div');
            let p = o.properties;
            elementContainer.classList.add('ui-element');
            let targetElement;

            switch(o.properties.type) {
                case 'checkbox':
                    let checkboxElement = uiObject.createCheckbox(p.text, p.id, p.checked());
                    checkboxElement.getElementsByTagName('input')[0].onchange = () => {
                        let c = checkboxElement.getElementsByTagName('input')[0].checked;
                        p.onCheckChange(c);
                    }
                    elementContainer.appendChild(checkboxElement);
                    break;
                case 'button':
                    let buttonElement = uiObject.createButton(p.text, p.id, p.icon, p);
                    buttonElement.onclick = p.onClick;
                    elementContainer.appendChild(buttonElement);
                    break;
                case 'textInput':
                    let inputElement = uiObject.createInput('text', p);
                    elementContainer.appendChild(inputElement);
                    break;
                case 'numberInput':
                    let ninputElement = uiObject.createInput('number', p);
                    elementContainer.appendChild(ninputElement);
                    break;
                case 'tabs':
                    let tabsElement = uiObject.createTabs(p.items, p.id, p.selected(), { onSelectChange: p.onSelectChange });
                    elementContainer.appendChild(tabsElement);
                    break;
                case 'list':
                    let listElement = uiObject.createList(p.items, p.id, p.selected(), p);
                    elementContainer.appendChild(listElement);
                    break;
                case 'label':
                    let labelElement = uiObject.createLabel(p.id, p.text, p.style, p);
                    elementContainer.appendChild(labelElement);
                    break;
                case 'container':
                    let containerElement = uiObject.createContainer(p.id, p.title, p.direction, p);
                    elementContainer.appendChild(containerElement);
                    targetElement = containerElement;
                    break;
                case 'dialog':
                    let dialogElement = uiObject.createDialog(p.id, p.title, p.closeButton);
                    let dialogBgElement = uiObject.createDialogBg(p.id);

                    dialogBgElement.appendChild(dialogElement);
                    elementContainer.appendChild(dialogBgElement);
                    targetElement = dialogElement;
                    break;
                case 'contextMenu':
                    let menuElement = uiObject.createContextMenu(p.id, p.title, p);
                    elementContainer.appendChild(menuElement);
                    targetElement = menuElement;
                    break;
            }

            e.appendChild(elementContainer);

            if(!targetElement) return;
            if(o.children) {
                o.children.forEach(c => {
                    cycle(c, targetElement);
                });
            }
        }

        cycle(obj, elem);
    }
}

