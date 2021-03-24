import decodesave from '../scripts/decodesave';
import levelparse from '../scripts/levelparse';
import canvas from './canvas';
import util from './util';

let fs = null;
if(window.process) fs = window.require('fs');

const defaultLevel = 'kS38,1_40_2_125_3_255_4_-1_6_1000_7_1|1_0_2_102_3_255_4_-1_6_1001_7_1|1_0_2_102_3_255_4_-1_6_1009_7_1|1_255_2_255_3_255_4_-1_6_1004_7_1|1_255_2_255_3_255_4_-1_6_1002_7_1|,kA13,0,kA15,0,kA16,0,kA14,,kA6,1,kA7,1,kA17,1,kA18,0,kS39,0,kA2,0,kA3,0,kA8,0,kA4,0,kA9,0,kA10,0,kA11,0';

function readLocalLevels() {
    if(!fs) return;
    let ccll = fs.readFileSync(window.process.env.LOCALAPPDATA + "\\GeometryDash\\CCLocalLevels.dat").toString();
    ccll = decodesave.decode(ccll);
    let ccllJson = decodesave.xml2object(ccll);
    return ccllJson;
}

function writeLocalLevels(ccll) {
    if(!fs) return;
    ccll = decodesave.object2xml(ccll);
    fs.writeFileSync(window.process.env.LOCALAPPDATA + "\\GeometryDash\\CCLocalLevels.dat", ccll);
}

function confirmUnsavedChanges(onConfirm) {
    if(util.getUnsavedChanges()) {
        util.confirm(
            'unsavedChangesConfirm', 'Hold Up!', 
            'There are unsaved changes in your level! Are you sure you want to quit?',
            { buttonYes: 'Yes', buttonNo: 'No', onConfirm: onConfirm }
        );
    } else {
        onConfirm(true);
    }
}

function executeAction(action) {
    switch(action) {
        case 'load':
            confirmUnsavedChanges((t) => {
                if(t) {
                    if(fs) {
                        let ccll = readLocalLevels();
                        localStorage.setItem('lvlcode', ccll[0].data);
                        localStorage.setItem('lvlnumber', 0);
                        window.location.reload();
                    }
                    else util.alert('loadDialog', 'Couldn\'t load!', 'Reading files is only supported on GDExt desktop!', "OK")
                } 
            });
            break;
        case 'save':
            let levelObj = canvas.getLevel();
            let levelTxt = levelparse.object2code(levelObj);

            if(fs) {
                let ccll = readLocalLevels();
                if(localStorage.getItem('lvlnumber') == -1) {
                    let newlevel = {
                        kCEK:4,
                        name: "GDExt Level",
                        data: levelTxt,
                        author: ccll[0].author || '-',
                        k13: true,
                        k21: 2,
                        version: 1,
                        gameversion: 35,
                        editorcamx: 0,
                        editorcamy: 0,
                        editorcamz: 0
                    }
                    ccll.unshift(newlevel);
                } else {
                    ccll[parseInt(localStorage.getItem('lvlnumber'))].data = levelTxt;
                } 
                writeLocalLevels(ccll);
                util.setUnsavedChanges(false);
            } 
            else util.alert('saveDialog', 'Couldn\'t save!', 'Saving is only supported on GDExt desktop!', "OK");
            break;
        case 'new':
            confirmUnsavedChanges((t) => {
                if(t) {
                    localStorage.setItem('lvlcode', defaultLevel);
                    localStorage.setItem('lvlnumber', -1);
                    window.location.reload();
                }
            });
            break;
        case 'exit':
            confirmUnsavedChanges((t) => {
                if(t) {
                    let event = new CustomEvent('electronApi', { detail: 'quit' });
                    dispatchEvent(event);
                }
            });
            break;
    }
}

export default {
    init: () => {
        window.addEventListener('action', e => {
            executeAction(e.detail);
        });
    },
    executeAction: (action) => {
        executeAction(action);   
    }
}
