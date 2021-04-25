import decodesave from '../scripts/decodesave';
import levelparse from '../scripts/levelparse';
import canvas from './canvas';
import util from './util';
import songsData from '../assets/levelparse/songs.json';

let fs = null;
if(window.process) fs = window.require('fs');

// gbloab vars:
// defaultLevel is the default blank level data for when a new level is created
// gdPath is the path to GD's local levels
// dateSaved has the last time the level was saved in gdext
const defaultLevel = 'kS38,1_40_2_125_3_255_4_-1_6_1000_7_1|1_0_2_102_3_255_4_-1_6_1001_7_1|1_0_2_102_3_255_4_-1_6_1009_7_1|1_255_2_255_3_255_4_-1_6_1004_7_1|1_255_2_255_3_255_4_-1_6_1002_7_1|,kA13,0,kA15,0,kA16,0,kA14,,kA6,1,kA7,1,kA17,1,kA18,0,kS39,0,kA2,0,kA3,0,kA8,0,kA4,0,kA9,0,kA10,0,kA11,0';
let gdPath = '';
if(window.process) gdPath = window.process.env.LOCALAPPDATA + "\\GeometryDash\\CCLocalLevels.dat";

let dateSaved = null;

// read levels
function readLocalLevels() {
    if(!fs) return;
    if(!fs.existsSync(gdPath)) return -1; // -1 = gd is not installed
    let ccll = fs.readFileSync(gdPath).toString();
    ccll = decodesave.decode(ccll);
    let ccllJson = decodesave.xml2object(ccll);
    return ccllJson;
}

// change levels
function writeLocalLevels(ccll) {
    if(!fs) return;
    if(!fs.existsSync(gdPath)) return -1; // -1 = gd is not installed
    ccll = decodesave.object2xml(ccll);
    fs.writeFileSync(gdPath, ccll);
}

function checkGDExists() {
    if(!fs) return false;
    if(!fs.existsSync(gdPath)) return false;
    return true;
}

function loadLevel(n, cclll) {
    let ccll;
    if(cclll) ccll = cclll;
    else ccll = readLocalLevels();

    if(localStorage.getItem('lvlcode') != ccll[n].data && n < ccll.length) {
        localStorage.setItem('lvlcode', ccll[n].data);
        localStorage.setItem('lvlnumber', n);
        localStorage.setItem('lvlname', ccll[n].name);
        localStorage.setItem('lvlsong', ccll[n].song);
        window.location.reload();
    }
}

// this function pops up the unsaved changes dialog if the level has unsaved data
// and calls the "onConfirm" function with the first argument set to whether the user confirms or not
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

// main function for executing actions like saving, loading, etc.
function executeAction(action) {
    switch(action) {
        case 'load':
            confirmUnsavedChanges((t) => {
                if(t) {
                    if(fs) {
                        if(!checkGDExists()) {
                            util.alert('loadDialog', 'Couldn\'t load!', 'Geometry Dash is not detected on your computer! Make sure you install GD before saving/loading levels.', "OK");
                            return;
                        }
                        
                        let ccll = readLocalLevels();
                        let obj = {
                            properties: {
                                type: 'container',
                                id: 'loadDialogLevels',
                                direction: 'column',
                                scroll: 'vertical'
                            },
                            children: [
                                
                            ]
                        };
                        let lnum = -1;
                        ccll.forEach(l => {
                            lnum++;
                            let locallnum = lnum;
                            let song = l.customsong;
                            if(!song) song = songsData[l.song || 1];

                            let lengths = ['Tiny', 'Short', 'Medium', 'Long', 'XL'];
                            
                            let description = `♫ ${song} | ${lengths[l.length || 0]} | ${l.verified ? 'Verified' : 'Unverified'}`;

                            obj.children.push({
                                properties: {
                                    type: 'card',
                                    id: 'loadDialogLevel'+locallnum,
                                    title: l.name,
                                    description: description,
                                    onClick: () => {
                                        loadLevel(locallnum, ccll);
                                    }
                                }
                            });
                        });

                        util.createDialog('loadDialog', 'Select a Level to Load', true, [obj]);
                    }
                    else util.alert('loadDialog', 'Couldn\'t load!', 'Reading files is only supported on GDExt desktop!', "OK");
                } 
            });
            break;
        case 'save':
            let levelObj = canvas.getLevel();
            let levelTxt = levelparse.object2code(levelObj);

            if(window.gdext && window.gdext.isGdRunning) {
                util.alert('saveDialog', 'Couldn\'t save!', 'Geometry Dash is currently running! Please close it and try again.', "OK")
                return;
            }

            if(fs) {
                if(!checkGDExists()) util.alert('saveDialog', 'Couldn\'t save!', 'Geometry Dash is not detected on your computer! Make sure you install GD before saving/loading levels.', "OK");

                let ccll = readLocalLevels();
                if(localStorage.getItem('lvlnumber') == -1) {
                    let newlevel = {
                        kCEK:4,
                        name: localStorage.getItem('lvlname') || "GDExt Level",
                        song: localStorage.getItem('lvlsong') || 1,
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
                    localStorage.setItem('lvlnumber', 0);
                } else {
                    ccll[parseInt(localStorage.getItem('lvlnumber'))].data = levelTxt;
                    ccll[parseInt(localStorage.getItem('lvlnumber'))].name = localStorage.getItem('lvlname');
                    ccll[parseInt(localStorage.getItem('lvlnumber'))].song = localStorage.getItem('lvlsong');
                } 
                writeLocalLevels(ccll);
                util.setUnsavedChanges(false);
                util.showNotif('levelSavedNotif', 'Level Saved!', 4500, 'success');
                localStorage.setItem('lvlcode', levelTxt);

                dateSaved = new Date();
                let autosaveTimeLabel = document.querySelector('#autosaveTimeLabel');
                if(autosaveTimeLabel) autosaveTimeLabel.innerText = 'Last saved just now';
            } 
            else util.alert('saveDialog', 'Couldn\'t save!', 'Saving is only supported on GDExt desktop!', "OK");
            break;
        case 'new':
            confirmUnsavedChanges((t) => {
                if(t) {
                    localStorage.setItem('lvlcode', defaultLevel);
                    localStorage.setItem('lvlnumber', -1);
                    localStorage.setItem('lvlname', 'GDExt Level');
                    localStorage.setItem('lvlsong', 1);
                    window.location.reload();
                }
            });
            break;
        case 'exit':
            confirmUnsavedChanges((t) => {
                if(t) {
                    window.gdext.isActuallyClosing = true;
                    let event = new CustomEvent('electronApi', { detail: 'quit' });
                    dispatchEvent(event);
                } else {
                    window.gdext.isActuallyClosing = null;
                }
            });
            break;
        case 'reload':
            confirmUnsavedChanges((t) => {
                if(t) {
                    let event = new CustomEvent('electronApi', { detail: 'reload' });
                    dispatchEvent(event);
                }
            });
            break;
        case 'renameLevel':
            util.prompt('renameDialog', 'Rename Level', 'Enter the new name of the level:', {
                defaultValue: () => { return localStorage.getItem('lvlname') },
                maxlength: 20,
                onConfirm: (v) => {
                    console.log(v);
                    if(v) {
                        localStorage.setItem('lvlname', v);
                        util.setUnsavedChanges(true);
                    }
                }
            });
            break;
        case 'about':
            util.alert('aboutDialog', 'About GDExt', 'TODO: Add about screen');
            break;
        case 'githubissue':
            util.openUrl('https://github.com/gdext/editor/issues/new/choose');
            break;
        case 'githubwiki':
            util.openUrl('https://github.com/gdext/editor/wiki');
            break;
        case 'githubrepo':
            util.openUrl('https://github.com/gdext/editor');
            break;
        case 'gddocs':
            util.openUrl('http://docs.gdprogra.me/');
            break;
        case 'discord':
            util.openUrl('https://discord.gg/s8hzqyxJKW');
            break;
    }
}

export default {
    init: () => {
        window.addEventListener('action', e => {
            executeAction(e.detail);
        });

        //notify if gd is running
        window.addEventListener('gdRunningStateChange', e => {
            console.log('GD Running State changes to: ', e.detail);
            if(localStorage.getItem(`gdRunningAlertDontShowAgain`) != 'true') {
                if(e.detail) {
                    util.alert('gdRunningAlert', 'Looks Like You\'ve Opened GD!', 'For stability reasons, you won\'t be able to save levels in GDExt until you close Geometry Dash', 'Got It', true);     
                } else {
                    if(document.querySelector('#gdRunningAlert')) util.closeDialog('gdRunningAlert');
                }
            }
        });

        //autosaving
        let autosaveInterval = setInterval(() => {
            if(localStorage.getItem('settings.autosaveEnabled') == '1') {
                let autosaveTimeLabel = document.querySelector('#autosaveTimeLabel');
                if(autosaveTimeLabel) autosaveTimeLabel.innerText = 'Autosaving...';
                executeAction('save');
            }
        }, 600000); //600,000 (10 minutes)

        //last saved text
        let lastSavedTextInterval = setInterval(() => {
            let autosaveTimeLabel = document.querySelector('#autosaveTimeLabel');
            if(autosaveTimeLabel) autosaveTimeLabel.innerText = 'Last saved ' + (dateSaved ? util.getTimeDifferenceText(dateSaved) : 'a while back');
        }, 60000);

        //check if level has changed on focus
        window.addEventListener('focus', () => {
            if(localStorage.getItem('lvlnumber') && localStorage.getItem('lvlnumber') != '-1') {
                let level = readLocalLevels()[localStorage.getItem('lvlnumber')];
                if(level.data != localStorage.getItem('lvlcode')) {
                    if(document.querySelector('#fileChangedConfirm')) return;
                    util.confirm(
                        'fileChangedConfirm', 'The Level Was Modified Externally', 
                        'Would you like to reload it? (You will lose all of your unsaved data)',
                        {
                            buttonYes: 'Yes', buttonNo: 'No', onConfirm: (t) => {
                                if(t) window.location.reload();
                                else localStorage.setItem('lvlcode', level.data);
                            } 
                        }
                    );
                }
            }
        });
    },
    executeAction: (action) => {
        executeAction(action);   
    },
    getLevelData: (num) => {
        if(checkGDExists()) { 
            let ccll = readLocalLevels();
            return ccll[num];
        }
    }
}
