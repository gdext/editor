import levelparse from './levelparse';
import pako from 'pako';
const Buffer = require('buffer/').Buffer;
const defaultLevel = 'kS38,1_40_2_125_3_255_4_-1_6_1000_7_1|1_0_2_102_3_255_4_-1_6_1001_7_1|1_0_2_102_3_255_4_-1_6_1009_7_1|1_255_2_255_3_255_4_-1_6_1004_7_1|1_255_2_255_3_255_4_-1_6_1002_7_1|,kA13,0,kA15,0,kA16,0,kA14,,kA6,1,kA7,1,kA17,1,kA18,0,kS39,0,kA2,0,kA3,0,kA8,0,kA4,0,kA9,0,kA10,0,kA11,0';

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
                    localStorage.setItem('lvlnumber', -1);
                    localStorage.removeItem('lvlid');
                    window.location.reload();
                });
        } else if(!localStorage.getItem('lvlcode')) {
            localStorage.setItem('lvlcode', defaultLevel);
            localStorage.setItem('lvlnumber', -1);
            window.location.reload();
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
                    localStorage.setItem('lvlnumber', -1);
                    window.location.reload();
                    break;
                case 'import from id':
                    fetch(`https://gdbrowser.com/api/level/${prompt('level id')}?download`)
                        .then(r => r.json())
                        .then(data => {
                            let datDecoded = Buffer.from(data.data, 'base64');
                            let datUnzip = new TextDecoder("utf-8").decode(pako.ungzip(datDecoded));
                            localStorage.setItem('lvlcode', datUnzip);
                            localStorage.setItem('lvlnumber', -1);
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