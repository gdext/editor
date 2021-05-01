import shortcuts from '../assets/shortcuts.json';

/*
shift - 16
ctrl - 17
alt - 18
*/

let keys = [];

export default {
    init: () => {
        window.onkeydown = (e) => {
            if(!keys.includes(e.keyCode)) keys.push(e.keyCode);
            keys.sort((a,b) => a-b);

            //trigger an event
            let targetEvent = shortcuts.filter(f => f.keys == keys.join())[0];
            if(!targetEvent) return;

            if(targetEvent.type == 'event') {
                if(targetEvent.focus) {
                    if(document.activeElement && document.activeElement.id != targetEvent.focus) return;
                    else if(!document.activeElement) return;
                }
                let event = new CustomEvent(targetEvent.eventName, { detail: targetEvent.eventInfo });
                dispatchEvent(event);
            }

            return false;
        }

        window.onkeyup = (e) => {
            let i = keys.indexOf(e.keyCode);
            if(i >= 0) keys.splice(i, 1);
        }

        window.addEventListener('blur', () => { keys = [] });
    },
    getKeys: () => {
        return keys;
    }
}