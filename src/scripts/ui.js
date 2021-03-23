import icPick from '../assets/ic-pick.svg';
import icSlide from '../assets/ic-slide.svg';
import icInfo from '../assets/ic-info.svg';
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

            if(!input.value.endsWith(options.unit)) {  input.type = 'text'; input.value += options.unit; input.blur() }

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
                    v += e.movementX * (options.scale || 1);
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
        let scrolls = {none: '', vertical: 'sv', horizontal: 'sh'};
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

}

let uiObject = new UiObject();

export default {
    createCheckbox: (name, id, state, options) => {
        return uiObject.createCheckbox(name, id, state, options);
    },

    renderUiObject: (obj, elem) => {
        function cycle(o, e) {
            let elementContainer = document.createElement('div');
            let p = o.properties;
            elementContainer.classList.add('ui-element');

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
                case 'label':
                    let labelElement = uiObject.createLabel(p.id, p.text, p.style, {textCutoff: p.textCutoff, color: p.color});
                    elementContainer.appendChild(labelElement);
                    break;
                case 'container':
                    let containerElement = uiObject.createContainer(p.id, p.title, p.direction, p);
                    elementContainer.appendChild(containerElement);
                    break;
            }

            e.appendChild(elementContainer);

            if(o.children) {
                o.children.forEach(c => {
                    cycle(c, elementContainer.children[0]);
                });
            }
        }

        cycle(obj, elem);
    }
}

