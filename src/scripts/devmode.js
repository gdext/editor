import levelparse from './levelparse';
import pako from 'pako';
const Buffer = require('buffer/').Buffer;

export default {
    init: () => {
        console.log('Dev mode activated!');
        //instantly load level by id
        if(localStorage.getItem('lvlid')) {
            fetch(`https://gdbrowser.com/api/level/${localStorage.getItem('lvlid')}?download`)
                .then(r => r.json())
                .then(data => {
                    let datDecoded = Buffer.from(data.data, 'base64');
                    let datUnzip = new TextDecoder("utf-8").decode(pako.ungzip(datDecoded));
                    localStorage.setItem('lvlcode', datUnzip);
                    localStorage.removeItem('lvlid');
                    window.location.reload();
                });
        }

        window.addEventListener('devmode', e => {
            let devprompt = prompt('Dev Mode Prompt. Enter Command:');
            switch(devprompt) {
                case 'lvlcode':
                    console.log(localStorage.getItem('lvlcode'));
                    break;
                case 'lvlobject':
                    console.log(levelparse.code2object(localStorage.getItem('lvlcode')));
                    break;
                case 'import code':
                    localStorage.setItem('lvlcode', prompt('Enter Level Code'));
                    window.location.reload();
                    break;
                case 'import from id':
                    fetch(`https://gdbrowser.com/api/level/${prompt('level id')}?download`)
                        .then(r => r.json())
                        .then(data => {
                            let datDecoded = Buffer.from(data.data, 'base64');
                            let datUnzip = new TextDecoder("utf-8").decode(pako.ungzip(datDecoded));
                            localStorage.setItem('lvlcode', datUnzip);
                            window.location.reload();
                        });
                    break;
                case 'help':
                    console.log(`lvlcode - show level's raw code
lvlobject - show level code decoded to js object
import code - load level code
import from id - load level using it's id`);
                    alert('Check your console');
                    break;
            }
        });
    }
}