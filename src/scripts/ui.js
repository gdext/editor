function createCheckbox (name, id, state, options) {
    let checkboxContainer = document.createElement('label');
    checkboxContainer.classList.add('ui-checkbox');
    checkboxContainer.innerText = name;
    if(options && options.light) checkboxContainer.classList.add('bbg');

    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    if(state) checkbox.checked = 'checked';

    let checkmark = document.createElement('span');
    checkmark.classList.add('checkbox-mark');

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(checkmark);
    return checkboxContainer;
}

function createButton (name, id, icon, options) {
    let button = document.createElement('button');
    button.classList.add('ui-button');

    let buttonText = document.createElement('span');
    buttonText.innerText = name;
    let buttonIcon = document.createElement('img');
    buttonIcon.src = icon;

    if(options && options.light) button.classList.add('bbg');
    button.id = id;

    if(icon) button.appendChild(buttonIcon);
    button.appendChild(buttonText);
    return button;
}

export default {
    createCheckbox: (name, id, state, options) => {
        return createCheckbox(name, id, state, options);
    },

    renderUiObject: (obj, elem) => {
        function cycle(o, e) {
            let elementContainer = document.createElement('div');
            let p = o.properties;
            elementContainer.classList.add('ui-element');

            switch(o.properties.type) {
                case 'checkbox':
                    let checkboxElement = createCheckbox(p.text, p.id, p.checked());
                    checkboxElement.getElementsByTagName('input')[0].onchange = () => {
                        let c = checkboxElement.getElementsByTagName('input')[0].checked;
                        p.onCheckChange(c);
                    }
                    elementContainer.appendChild(checkboxElement);
                    break;
                case 'button':
                    let buttonElement = createButton(p.text, p.id, p.icon);
                    buttonElement.onclick = p.onClick;
                    elementContainer.appendChild(buttonElement);
                    break;
            }

            e.appendChild(elementContainer);

            if(o.children) {
                o.children.forEach(c => {
                    cycle(c, elementContainer);
                });
            }
        }

        cycle(obj, elem);
    }
}

