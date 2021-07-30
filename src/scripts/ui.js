import icPick from '../assets/ic-pick.svg';
import icSlide from '../assets/ic-slide.svg';
import icFolder from '../assets/ic-folder.svg';
import icInfo from '../assets/ic-info.svg';
import icEdit from '../assets/ic-edit2.svg';
import icExit from '../assets/ic-exit.svg';
import icArrowLeft from '../assets/ic-arrowleft.svg';
import icArrowRight from '../assets/ic-arrowright.svg';
import icArrowDown from '../assets/ic-arrowdown.svg';
import keyboard from './keyboard';
import util from './util';

// UiObject contains functions to create all types of UI elements
// renderUiObject puts all these UiObjects together and returns them as DOM elements

let sliderCount = 0;

function UiObject() {

    this.createCheckbox = (name, id, state, options) => {
        let checkboxContainer = document.createElement('label');
        checkboxContainer.classList.add('ui-checkbox');
        checkboxContainer.innerText = name;
        if(options && options.big) checkboxContainer.classList.add('big');
        if(options && options.marginTop) checkboxContainer.style.marginTop = options.marginTop + 'px';
        if(options && options.marginBottom) checkboxContainer.style.marginBottom = options.marginBottom + 'px';

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
        if(options.textStyle) {
            if(options.textStyle == 'bold') buttonText.style.fontWeight = 600;
            else if(options.textStyle == 'italic') buttonText.style.fontStyle = 'italic';
            else if(options.textStyle == 'small') {
                buttonText.style.fontWeight = 600;
                buttonText.style.fontSize = '10px';
            }
        }
        if(options.hint) button.title = options.hint;
        let buttonIcon = document.createElement('img');
        let isize = {w: 0, h: 0}
        import(`../assets/${icon}`).then(({default: i}) => {
            buttonIcon.src = i;
            let iimg = new Image();
            iimg.src = i;
            isize.w = iimg.width;
            isize.h = iimg.height;
        }).catch(() => {
            console.error('Cannot load asset');
        });
        if(isize.h < isize.w) buttonIcon.width = options.iconHeight;   
        else buttonIcon.height = options.iconHeight; 

        if(options && options.light) button.classList.add('bbg');
        if(options && options.primary) button.classList.add('primary');
        if(options && options.width) {
            button.style.width = options.width + 'px';
            button.style.minWidth = '0px';
        }
        if(options.marginTop != undefined) button.style.marginTop = options.marginTop + 'px';
        if(options.marginBottom != undefined) button.style.marginBottom = options.marginBottom + 'px';
        if(options && options.height) button.style.height = options.height + 'px';
        if(icon && name) button.classList.add('s');
        if(id) button.id = id;

        setTimeout(() => {
            if(options.focusIndex != null) button.tabIndex = options.focusIndex + 1;
            if(options.focusIndex == 0) {
                button.focus();
            }
        }, 100);

        if(icon) button.appendChild(buttonIcon);
        if(name) button.appendChild(buttonText);
        return button;
    }

    this.createInput = (type, options) => {
        let inputContainer = document.createElement('div');
        inputContainer.classList.add('ui-input');
        if(options && options.light) inputContainer.classList.add('bbg');

        if(options && options.marginTop) inputContainer.style.marginTop = options.marginTop + 'px';
        if(options && options.marginBottom) inputContainer.style.marginBottom = options.marginBottom + 'px';

        let input = document.createElement('input');
        if(type == 'number') input.type = 'text';
        else input.type = type;
        if(options.id) input.id = options.id;
        if(options.placeholder) input.placeholder = options.placeholder;

        if(options.defaultValue) input.value = options.defaultValue();
        if(type == 'number' && options.unit) {
            input.setAttribute('unit', options.unit);
            input.value += options.unit;
        }

        if(options.uneditable) {
            input.disabled = true;
            inputContainer.onmouseover = () => {
                input.title = input.value;
            }
        }

        if(options.maxlength) input.maxLength = options.maxlength;
        if(options.minlength) input.minLength = options.minlength;

        if(options.max) input.max = options.max;
        if(options.min) input.min = options.min;

        inputContainer.appendChild(input);

        setTimeout(() => {
            if(options.focusIndex != null) input.tabIndex = options.focusIndex + 1;
            if(options.focusIndex == 0) {
                input.focus();
            }
        }, 100);

        input.onchange = () => {
            //handle min/max
            if(input.value > options.max) input.value = options.max;
            else if(input.value < options.min) input.value = options.min;

            if(type == 'number') input.type = 'text'; 

            if(input.getAttribute('unit') && !input.value.endsWith(input.getAttribute('unit'))) {  input.value += input.getAttribute('unit'); input.blur() }

            if(options.onValueChange) options.onValueChange(input.value);
        }
        input.onfocus = () => {
            inputContainer.classList.add('f');
            if(type == 'number') {
                if(parseFloat(input.value).toString() == 'NaN') input.value = options.defaultValue ? options.defaultValue() : 0;
                else input.value = parseFloat(input.value);
            }
            input.type = type;
        }
        input.onblur = () => {
            inputContainer.classList.remove('f');
            if(type == 'number') input.type = 'text';
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
                case 'edit':
                    src = icEdit;
                    pointer = 'pointer';
                    break;
                case 'folder':
                    src = icFolder;
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
            } else if(type == 'color') {
                inputIcon.onclick = () => {
                    input.click();
                    input.focus();
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
                    if(v > options.max) {
                        if(options.wrapAround) v = options.min || 0;
                        else v = options.max;
                    }
                    else if(v < options.min) {
                        if(options.wrapAround) v = options.max || 0;
                        else v = options.min;
                    }

                    let pv = isInteger() ? Math.round(v) : Math.round(v*100)/100;
                    console.log('pv', pv);
                    if(pv.toString() == 'NaN') pv = options.defaultValue ? options.defaultValue() : 0;
                    //handle numbers after the decimal point
                    if(!isInteger()) {
                        let afterDecimal = pv.toString().split('.')[1];
                        if(!afterDecimal) pv = pv + '.00';
                        else if(afterDecimal.length < 2) pv += '0';
                    }

                    if(input.getAttribute('unit')) pv += input.getAttribute('unit');
                    p.value = pv;
                    if(options.onValueChange) options.onValueChange(pv);
                }
                function stopFunction() {
                    util.setCursor();
                    if(Math.round(v).toString() != 'NaN') p.value = isInteger() ? Math.round(v) : Math.round(v*100)/100;
                    if(input.getAttribute('unit')) p.value += input.getAttribute('unit');
                    document.removeEventListener('pointermove', moveFunction);
                    document.removeEventListener('pointerup', stopFunction);
                    if(options.onIconDragEnd) options.onIconDragEnd();
                }

                inputIcon.onpointerdown = e => {
                    click = true;
                    p = e.target.parentElement.querySelector('input');
                    if(parseFloat(p.value).toString() == 'NaN') v = options.defaultValue ? options.defaultValue() : 0;
                    else v = parseFloat(p.value);
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
                    if(options.onIconDragEnd) options.onIconDragEnd();
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
        if(options && options.onSelectChange) {
            setTimeout(() => {
                options.onSelectChange(selected, items);
            }, 10);
        }

        if(options.style && options.style == 'header') tabContainer.classList.add('header');

        if(options.marginTop != undefined) tabContainer.style.marginTop = options.marginTop + 'px';
        if(options.marginBottom != undefined) tabContainer.style.marginBottom = options.marginBottom + 'px';

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

        if(options.marginTop != undefined) listContainer.style.marginTop = options.marginTop + 'px';
        if(options.marginBottom != undefined) listContainer.style.marginBottom = options.marginBottom + 'px';

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
                if(options.dontWrap) {
                    if(v >= items.length) v = items.length-1;
                    else if(v < 0) v = 0;
                } else {
                    if(v >= items.length) v = 0;
                    else if(v < 0) v = items.length-1;
                }
                updateSelected(Math.round(v), true);
            }
            function stopFunction() {
                util.setCursor();
                document.removeEventListener('pointermove', moveFunction);
                document.removeEventListener('pointerup', stopFunction);
                if(options.onSelectStop) {
                    options.onSelectStop(parseInt(listContainer.getAttribute('value')), items);
                }
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
                if(options.onSelectStop) {
                    options.onSelectStop(parseInt(listContainer.getAttribute('value')), items);
                }
            }

            let listArrowRight = document.createElement('img');
            listArrowRight.classList.add('ui-list-arrow');
            listArrowRight.src = icArrowRight
            listArrowRight.onclick = () => {
                updateSelected(1);
                if(options.onSelectStop) {
                    options.onSelectStop(parseInt(listContainer.getAttribute('value')), items);
                }
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
                    listDropdown.style.left = listBox.x + 'px';
                    listDropdown.style.width = (listBox.width - 2) + 'px';
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
        if(options.marginTop != undefined) labelElement.style.marginTop = options.marginTop + 'px';
        if(options.marginBottom != undefined) labelElement.style.marginBottom = options.marginBottom + 'px';
        if(options.align == 'center') labelElement.style.textAlign = 'center';
        if(options.align == 'right') labelElement.style.textAlign = 'right';

        return labelElement;
    }

    this.createIcon = (id, src, srcType, options) => {
        let iconElement = document.createElement('img');
        iconElement.classList.add('ui-icon');
        if(id) iconElement.id = id;

        if(srcType == 'asset') {
            import(`../assets/${src}`).then(({default: i}) => {
                iconElement.src = i;
            }).catch(() => {
                console.error('Cannot load icon asset');
            });
        } else {
            iconElement.src = src;
        }

        if(options.width) iconElement.style.width = options.width + 'px';
        if(options.height) iconElement.style.height = options.height + 'px';    
        
        if(options.marginTop != undefined) iconElement.style.marginTop = options.marginTop + 'px';
        if(options.marginBottom != undefined) iconElement.style.marginBottom = options.marginBottom + 'px';

        return iconElement;
    }

    this.createImage = (id, src, options) => {
        let imgElement = document.createElement('img');
        imgElement.classList.add('ui-image');
        if(id) imgElement.id = id;
            
        imgElement.src = src;

        if(options.width) imgElement.style.width = options.width + 'px';
        if(options.height) imgElement.style.height = options.height + 'px';    
        if(options.round) imgElement.classList.add('round');

        if(options.marginTop != undefined) imgElement.style.marginTop = options.marginTop + 'px';
        if(options.marginBottom != undefined) imgElement.style.marginBottom = options.marginBottom + 'px';

        return imgElement;
    }
    
    this.createSlider = (id, value, label, options) => {
        let obj = {};

        let sep =  options.labelSeparator || ': ';

        let sliderElement = document.createElement('input');
        sliderElement.type = 'range';
        let idd = id || 'slider-' + sliderCount;
        sliderElement.id = idd;
        sliderCount++;
        sliderElement.classList.add('ui-slider');
        sliderElement.value = value;
        sliderElement.min = options.min || 0;
        sliderElement.max = options.max || 10;
        if(options.integerOnly) sliderElement.step = 1;
        else sliderElement.step = 0.02;

        let sliderStyle = document.createElement('style');
        sliderElement.appendChild(sliderStyle);

        obj.slider = sliderElement;

        let labelElement = null;
        if(label) {
            labelElement = document.createElement('p');
            labelElement.classList.add('ui-label');
            labelElement.innerText = options.label + sep + value;
            obj.label = labelElement;

            if(options.marginTop != undefined) labelElement.style.marginTop = options.marginTop + 'px';
        } else {
            if(options.marginTop != undefined) sliderElement.style.marginTop = options.marginTop + 'px';
        }
        if(options.marginBottom != undefined) sliderElement.style.marginBottom = options.marginBottom + 'px';

        function updateSliderGradient() {
            //change slider background gradien
            //i cant stress enough how bad this implementation is
            //but theres no other way to do it with webkit
            let v = parseFloat(sliderElement.value);
            let mn = parseFloat(sliderElement.min);
            let mx = parseFloat(sliderElement.max);
            let percent = (v - mn) / (mx-mn);
            sliderStyle.innerText = `
                #${idd}::-webkit-slider-runnable-track {
                    background: -webkit-linear-gradient(left, #3C94E4 ${percent*100}%, #5A5A5A 0%);
                }
                .bbg #${idd}::-webkit-slider-runnable-track {
                    background: -webkit-linear-gradient(left, #fff ${percent*100}%, #1865c5 0%);
                }
            `;
        }

        updateSliderGradient();

        sliderElement.oninput = () => {    
            if(labelElement) labelElement.innerText = options.label + sep + sliderElement.value;
            if(options.onValueChange) options.onValueChange(sliderElement.value);
            updateSliderGradient();
        }
        return obj;
    }

    this.createContainer = (id, title, direction, options) => {
        //create container itself
        let container = document.createElement('div');
        container.classList.add('ui-container');
        if(id) container.id = id;
        if(options.isGrid) {
            container.classList.add('grid');
            if(options.columns) {
                container.style.columnCount = options.columns;
                let s = '';
                for(let i = 0; i < parseInt(options.columns); i++) {
                    s+='auto ';
                }
                container.style.gridTemplateColumns = s;
            }
        } else {
            let directions = {row: 'r', column: 'c', inline: 'i'};
            container.classList.add(directions[direction] || 'c');
        }
        container.style.padding = `${options.paddingY}px ${options.paddingX}px`;
        let scrolls = {none: '', vertical: 'sv', horizontal: 'sh', both: 'sb'};
        if(options.scroll)
            container.classList.add(scrolls[options.scroll]);
        if(options.scroll == 'horizontal') {
            container.onwheel = (e) => {
                container.scrollLeft += e.deltaY/4;
            }
        }
        
        if(options.isBottomBar) container.classList.add('bbg');
        if(options.invisible) container.style.display = 'none';
        if(options.seperationRight != undefined) container.style.marginRight = options.seperationRight + 'px';
        if(options.seperationLeft != undefined) container.style.marginLeft = options.seperationLeft + 'px';
        if(options && options.marginTop) container.style.marginTop = options.marginTop + 'px';
        if(options && options.marginBottom) container.style.marginBottom = options.marginBottom + 'px';
        if(options.align == 'end') container.style.alignItems = 'flex-end';
        else if(options.align == 'start') container.style.alignItems = 'flex-start';


        //create title
        if(title) {
            let titleElem = document.createElement('p');
            titleElem.className = 'ui-label heading';
            titleElem.innerText = title;
            titleElem.style.marginTop = 0;
            container.appendChild(titleElem);

            if(options.collapsible) {
                titleElem.classList.add('colps');
                let titleIcon = document.createElement('img');
                titleIcon.src = icArrowDown;
                titleElem.appendChild(titleIcon);
                titleElem.onclick = () => {
                    container.classList.toggle('collapsed');
                }
            }
            if(options.collapsible && options.collapsed) {
                container.classList.add('collapsed');
            }
        }

        return container;
    }

    this.createCard = (id, title, description, options) => {
        let card = document.createElement('div');
        card.classList.add('ui-card');
        card.id = id;

        let cardTitle = document.createElement('h4');
        cardTitle.innerText = title;
        card.appendChild(cardTitle);

        let cardDesc = document.createElement('p');
        cardDesc.innerText = description;
        card.appendChild(cardDesc);

        if(options.onClick) card.onclick = options.onClick;

        return card;
    }
    
    this.createDialog = (id, title, closeButton, fullSize) => {
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
        if(fullSize) {
            dialog.classList.add('fullsize');
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
        menu.tabIndex = 2;
        setTimeout(() => {
            menu.focus();
        }, 25);
        if(id) menu.id = id;
        if(options && options.maxwidth) menu.style.width = options.maxwidth + 'px';
        if(options && options.maxheight) menu.style.maxHeight = options.maxheight + 'px';
        if(options && options.x) menu.style.left = options.x + 'px';
        if(options && options.y) menu.style.top = options.y + 'px';

        function fixMenuHeight() {
            let maxy = document.querySelector('#app').getBoundingClientRect().height - menu.getBoundingClientRect().height - 10;
            if(parseInt(menu.style.top) > maxy) {
                menu.style.top = maxy + 'px';
            }

            let maxh = document.querySelector('#app').getBoundingClientRect().height - parseInt(menu.style.top) - 10;
            if(!options.maxheight) menu.style.maxHeight = maxh + 'px';
        }
        setTimeout(() => {
            fixMenuHeight();
        }, 8);

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
                if(menuParent) menuParent.removeChild(menu);
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

const ui = {
    renderUiObject: (obj, elem) => {
        function cycle(o, e) {
            let elementContainer = document.createElement('div');
            let p = o.properties;
            let targetElement;

            switch(o.properties.type) {
                case 'checkbox':
                    let checkboxElement = uiObject.createCheckbox(p.text, p.id, p.checked(), p);
                    checkboxElement.getElementsByTagName('input')[0].onchange = () => {
                        let c = checkboxElement.getElementsByTagName('input')[0].checked;
                        if(p.onCheckChange) p.onCheckChange(c);
                    }
                    if(p.disabled) checkboxElement.classList.add('disabled');
                    elementContainer = checkboxElement;
                    break;
                case 'button':
                    let buttonElement = uiObject.createButton(p.text, p.id, p.icon, p);
                    buttonElement.onclick = p.onClick;
                    if(p.disabled) buttonElement.classList.add('disabled');
                    elementContainer = buttonElement;
                    break;
                case 'textInput':
                    let inputElement = uiObject.createInput('text', p);
                    if(p.disabled) inputElement.classList.add('disabled');
                    elementContainer = inputElement;
                    break;
                case 'numberInput':
                    let ninputElement = uiObject.createInput('number', p);
                    if(p.disabled) ninputElement.classList.add('disabled');
                    elementContainer = ninputElement;
                    break;
                case 'colorInput':
                    let cinputElement = uiObject.createInput('color', p);
                    if(p.disabled) cinputElement.classList.add('disabled');
                    elementContainer = cinputElement;
                    break;
                case 'tabs':
                    let tabsElement = uiObject.createTabs(p.items, p.id, p.selected(), p);
                    if(p.disabled) tabsElement.classList.add('disabled');
                    elementContainer = tabsElement;
                    break;
                case 'list':
                    let listElement = uiObject.createList(p.items, p.id, p.selected(), p);
                    if(p.disabled) listElement.classList.add('disabled');
                    elementContainer = listElement;
                    break;
                case 'label':
                    let labelElement = uiObject.createLabel(p.id, p.text, p.style, p);
                    if(p.disabled) labelElement.classList.add('disabled');
                    elementContainer = labelElement;
                    break;
                case 'icon':
                    let iconElement = uiObject.createIcon(p.id, p.src, p.srcType, p);
                    if(p.disabled) iconElement.classList.add('disabled');
                    elementContainer = iconElement;
                    break;
                case 'image':
                    let imgElement = uiObject.createImage(p.id, p.src, p);
                    if(p.disabled) imgElement.classList.add('disabled');
                    elementContainer = imgElement;
                    break;
                case 'slider':
                    let sliderContainer = document.createElement('div');
                    sliderContainer.classList.add('ui-element');
                    elementContainer = sliderContainer;
                    let slider = uiObject.createSlider(p.id, p.defaultValue(), p.label, p);
                    let sliderElement = slider.slider;
                    let labelElement2 = slider.label;
                    if(p.disabled) sliderElement.classList.add('disabled');
                    if(labelElement2) elementContainer.appendChild(labelElement2);
                    elementContainer.appendChild(sliderElement);
                    elementContainer.style.flexDirection = 'column';
                    break;
                case 'container':
                    let containerElement = uiObject.createContainer(p.id, p.title, p.direction, p);
                    if(p.disabled) containerElement.classList.add('disabled');
                    elementContainer = containerElement;
                    targetElement = containerElement;
                    break;
                case 'card':
                    let cardElement = uiObject.createCard(p.id, p.title, p.description, p);
                    if(p.disabled) cardElement.classList.add('disabled');
                    elementContainer = cardElement;
                    break;
                case 'dialog':
                    let dialogElement = uiObject.createDialog(p.id, p.title, p.closeButton, p.fullSize);
                    let dialogBgElement = uiObject.createDialogBg(p.id);

                    dialogBgElement.appendChild(dialogElement);
                    elementContainer = dialogBgElement;
                    targetElement = dialogElement;
                    break;
                case 'contextMenu':
                    let menuElement = uiObject.createContextMenu(p.id, p.title, p);
                    elementContainer = menuElement;
                    targetElement = menuElement;
                    break;
            }

            if(p.uistretch) elementContainer.classList.add('uistretch');
            else if(p.uiunstretch) elementContainer.classList.add('uiunstretch');

            e.appendChild(elementContainer);
            elementContainer.classList.add('ui-element');

            if(p.onCreate) {
                setTimeout(() => {
                    p.onCreate();
                }, 5);
            }

            if(!targetElement) return;
            if(o.children) {
                o.children.forEach(c => {
                    cycle(c, targetElement);
                });
            }
        }

        cycle(obj, elem);
    },
    /**
     * Creates a general UIElement
     * @param {string} type element type
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    create: (type, props = {}, children = []) => {
        return {
            properties: Object.assign(props, { type }),
            children
        };
    },
    /**
     * Creates a checkbox
     * @param {string} text checkbox text
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    checkbox: (text, props = {}, children = []) =>
        ui.create('checkbox', Object.assign(props, { text }), children),
    /**
     * Creates a button
     * @param {string} text button text
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    button: (text, props = {}, children = []) =>
        ui.create('button', Object.assign(props, { text }), children),
    /**
     * Creates a textInput
     * @param {string} placeholder textInput placeholder
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    textInput: (placeholder, props = {}, children = []) =>
        ui.create('textInput', Object.assign(props, { placeholder }), children),
    /**
     * Creates a numberInput
     * @param {string} placeholder numberInput placeholder
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    numberInput: (placeholder, props = {}, children = []) =>
        ui.create('numberInput', Object.assign(props, { placeholder }), children),
    /**
     * Creates a colorInput
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    colorInput: (props = {}, children = []) =>
        ui.create('colorInput', props, children),
    /**
     * Creates a tabs element
     * @param {[]} items tabs items
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    tabs: (items, props = {}, children = []) =>
        ui.create('tabs', Object.assign(props, { items }), children),
    /**
     * Creates a list
     * @param {[]} items list items
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    list: (items, props = {}, children = []) =>
        ui.create('list', Object.assign(props, { items }), children),
    /**
     * Creates a label
     * @param {string} text label text
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    label: (text, props = {}, children = []) =>
        ui.create('label', Object.assign(props, { text }), children),
    /**
     * Creates an icon
     * @param {string} src icon source
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    icon: (src, props = {}, children = []) =>
        ui.create('icon', Object.assign(props, { src }), children),
     /**
     * Creates an image
     * @param {string} src image source
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    image: (src, props = {}, children = []) =>
        ui.create('image', Object.assign(props, { src }), children),
    /**
     * Creates a slider
     * @param {string} label slider label
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    slider: (label, props = {}, children = []) =>
        ui.create('slider', Object.assign(props, { label }), children),
    /**
     * Creates a container
     * @param {string} direction container direction
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    container: (direction, props = {}, children = []) =>
        ui.create('container', Object.assign(props, { direction }), children),
    /**
     * Creates a card
     * @param {string} title card title
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    card: (title, props = {}, children = []) =>
        ui.create('card', Object.assign(props, { title }), children),
    /**
     * Creates a dialog
     * @param {string} title dialog title
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    dialog: (title, props = {}, children = []) =>
        ui.create('dialog', Object.assign(props, { title }), children),
    /**
     * Creates a contextMenu
     * @param {string} title contextMenu title
     * @param {{}} props element properties
     * @param {[]} children element children
     * @returns UIElement
     */
    contextMenu: (title, props = {}, children = []) =>
        ui.create('contextMenu', Object.assign(props, { title }), children),
}

export default ui;