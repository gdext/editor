// all the UI menus and elements stored in a form of GDExt UI system

import util from './util';
import canvas from './canvas';
import levelparse from './levelparse';
import quicktoolsData from '../assets/quicktools.json';

function loadLevel(levelTxt, lvlName) {
    let event = new CustomEvent('electronApi', { 
        detail: {
            detail: 'loadLevel',
            name: lvlName,
            data: levelTxt
        }
    });
    dispatchEvent(event);
}


const bottomMenus = {
    editMenu: {
        properties: {
            type: 'container',
            direction: 'row',
            scroll: 'both', 
            paddingX: 15,
            paddingY: 0
        },
        children: [
            // transform section
            {
                properties: {
                    type: 'container',
                    direction: 'row',
                },
                children: [
                    {
                        properties: {
                            type: 'container',
                            direction: 'column',
                        },
                        children: [
                            // x position
                            {
                                properties: {
                                    type: 'label',
                                    text: 'X Position',
                                }
                            },
                            {
                                properties: {
                                    type: 'numberInput',
                                    id: 'editXPos',
                                    placeholder: 'Number',
                                    defaultValue: () => { return '0' },
                                    onValueChange: (v) => {
                                        canvas.setRelativeTransform({
                                            x: parseFloat(v)*3,
                                        });
                                    },
                                    icon: 'slide',
                                    defaultToInteger: true,
                                    scale: 0.33
                                }
                            },
                            //y position
                            {
                                properties: {
                                    type: 'label',
                                    text: 'Y Position',
                                    marginTop: 5
                                }
                            },
                            {
                                properties: {
                                    type: 'numberInput',
                                    id: 'editYPos',
                                    placeholder: 'Number',
                                    defaultValue: () => { return '0' },
                                    onValueChange: (v) => {
                                        canvas.setRelativeTransform({
                                            y: parseFloat(v)*3,
                                        });
                                    },
                                    icon: 'slide',
                                    defaultToInteger: true,
                                    scale: 0.33
                                }
                            },
                            //z layer
                            {
                                properties: {
                                    type: 'label',
                                    text: 'Z Layer',
                                    marginTop: 5
                                }
                            },
                            {
                                properties: {
                                    type: 'list',
                                    id: 'editZLayer',
                                    items: ['B4', 'B3', 'B2', 'B1', 'T1', 'T2', 'T3'],
                                    selected:  () => { return 4 },
                                }
                            }
                        ]
                    },
                    {
                        properties: {
                            type: 'container',
                            id: 'test',
                            direction: 'column',
                        },
                        children: [
                            // rotation
                            {
                                properties: {
                                    type: 'label',
                                    text: 'Rotation',
                                }
                            },
                            {
                                properties: {
                                    type: 'numberInput',
                                    id: 'editRot',
                                    placeholder: 'Degree',
                                    max: 359,
                                    min: 0,
                                    wrapAround: true,
                                    unit: '°',
                                    defaultValue: () => { return '0' },
                                    onValueChange: (v) => {
                                        canvas.setRelativeTransform({
                                            rotation: parseFloat(v),
                                        });
                                    },
                                    icon: 'slide',
                                    defaultToInteger: true,
                                    scale: 1.33
                                }
                            },
                            //scale
                            {
                                properties: {
                                    type: 'label',
                                    text: 'Scale',
                                    marginTop: 5
                                }
                            },
                            {
                                properties: {
                                    type: 'numberInput',
                                    id: 'editScale',
                                    placeholder: 'Number',
                                    defaultValue: () => { return '1' },
                                    onValueChange: (v) => {
                                        canvas.setRelativeTransform({
                                            scale: parseFloat(v),
                                        });
                                    },
                                    icon: 'slide',
                                    min: 0.1,
                                    max: 8,
                                    scale: 0.01
                                }
                            },
                            //z order
                            {
                                properties: {
                                    type: 'label',
                                    text: 'Z Order',
                                    marginTop: 5
                                }
                            },
                            {
                                properties: {
                                    type: 'numberInput',
                                    id: 'editZOrder',
                                    placeholder: 'Number',
                                    defaultValue: () => { return '10' },
                                    icon: 'slide',
                                    scale: 0.5,
                                    integerOnly: true
                                }
                            },
                        ]
                    },
                    {
                        properties: {
                            type: 'container',
                            isGrid: true,
                            id: 'editTransformTools',
                            columns: 3,
                        },
                        children: [
                            {
                                properties: {
                                    type: 'button',
                                    id: 'editRotate90CCW',
                                    icon: 'ic-rotateccw.svg',
                                    hint: 'Rotate 90 CCW',
                                    iconHeight: 20,
                                    width: 40,
                                    height: 40,
                                    primary: false,
                                    onClick: () => {
                                        let event = new CustomEvent('editor', { detail: {
                                            action: 'transform',
                                            mode: 'add',
                                            data: {
                                                rotation: -90
                                            } 
                                        }});
                                        dispatchEvent(event);
                                    }
                                }
                            },
                            {
                                properties: {
                                    type: 'button',
                                    id: 'editMoveUp',
                                    icon: 'ic-moveup.svg',
                                    hint: 'Move Up',
                                    iconHeight: 20,
                                    width: 40,
                                    height: 40,
                                    primary: false,
                                    onClick: () => {
                                        let event = new CustomEvent('editor', { detail: {
                                            action: 'transform',
                                            mode: 'add',
                                            data: {
                                                y: 30
                                            }
                                        }});
                                        dispatchEvent(event);
                                    }
                                }
                            },
                            {
                                properties: {
                                    type: 'button',
                                    id: 'editRotate90CW',
                                    icon: 'ic-rotatecw.svg',
                                    hint: 'Rotate 90 CW',
                                    iconHeight: 20,
                                    width: 40,
                                    height: 40,
                                    primary: false,
                                    onClick: () => {
                                        let event = new CustomEvent('editor', { detail: {
                                            action: 'transform',
                                            mode: 'add',
                                            data: {
                                                rotation: 90
                                            } 
                                        }});
                                        dispatchEvent(event);
                                    }
                                }
                            },
                            {
                                properties: {
                                    type: 'button',
                                    id: 'editMoveLeft',
                                    icon: 'ic-moveleft.svg',
                                    hint: 'Move Left',
                                    iconHeight: 20,
                                    width: 40,
                                    height: 40,
                                    primary: false,
                                    onClick: () => {
                                        let event = new CustomEvent('editor', { detail: {
                                            action: 'transform',
                                            mode: 'add',
                                            data: {
                                                x: -30
                                            }
                                        }});
                                        dispatchEvent(event);
                                    }
                                }
                            },
                            {
                                properties: {
                                    type: 'button',
                                    id: 'editChangeScale',
                                    text: '1/15',
                                    textStyle: 'bold',
                                    hint: 'Change Move Scale',
                                    width: 40,
                                    height: 40,
                                    primary: false,
                                    onClick: () => {
                                        document.querySelector('#editChangeScale').querySelector('span').innerText = '1/30';
                                    }
                                }
                            },
                            {
                                properties: {
                                    type: 'button',
                                    id: 'editMoveRight',
                                    icon: 'ic-moveright.svg',
                                    hint: 'Move Right',
                                    iconHeight: 20,
                                    width: 40,
                                    height: 40,
                                    primary: false,
                                    onClick: () => {
                                        let event = new CustomEvent('editor', { detail: {
                                            action: 'transform',
                                            mode: 'add',
                                            data: {
                                                x: 30
                                            }
                                        }});
                                        dispatchEvent(event);
                                    }
                                }
                            },
                            {
                                properties: {
                                    type: 'button',
                                    id: 'editFlipV',
                                    icon: 'ic-flipv.svg',
                                    hint: 'Move Vertically',
                                    iconHeight: 20,
                                    width: 40,
                                    height: 40,
                                    primary: false,
                                    onClick: () => {
                                        let event = new CustomEvent('editor', { detail: {
                                            action: 'transform',
                                            mode: 'add',
                                            data: {
                                                vflip: '$invert'
                                            } 
                                        }});
                                        dispatchEvent(event);
                                    }
                                }
                            },
                            {
                                properties: {
                                    type: 'button',
                                    id: 'editMoveDown',
                                    icon: 'ic-movedown.svg',
                                    hint: 'Move Down',
                                    iconHeight: 20,
                                    width: 40,
                                    height: 40,
                                    primary: false,
                                    onClick: () => {
                                        let event = new CustomEvent('editor', { detail: {
                                            action: 'transform',
                                            mode: 'add',
                                            data: {
                                                y: -30
                                            } 
                                        }});
                                        dispatchEvent(event);
                                    }
                                }
                            },
                            {
                                properties: {
                                    type: 'button',
                                    id: 'editFlipH',
                                    icon: 'ic-fliph.svg',
                                    hint: 'Flip Horizontally',
                                    iconHeight: 20,
                                    width: 40,
                                    height: 40,
                                    primary: false,
                                    onClick: () => {
                                        let event = new CustomEvent('editor', { detail: {
                                            action: 'transform',
                                            mode: 'add',
                                            data: {
                                                hflip: '$invert'
                                            } 
                                        }});
                                        dispatchEvent(event);
                                    }
                                }
                            },
                        ]
                    }
                ]
            }
        ]
    }
}


const canvasMenus = {
    canvasOptions: {
        properties: {
            type: 'container',
            direction: 'row'
        },
        children: [
            {
                properties: {
                    type: 'button',
                    id: 'levelSettingsBtn',
                    icon: 'ic-settings.svg',
                    hint: 'Level Settings',
                    iconHeight: 20,
                    width: 40,
                    height: 40,
                    primary: true,
                    onClick: () => {
                        util.alert('levelSettingsDialog', 'Level Settings', 'are empty rn, sorry :/', 'Æ');
                    }
                }
            },
            {
                properties: {
                    type: 'button',
                    id: 'levelZoomIn',
                    icon: 'ic-zoomin.svg',
                    hint: 'Zoom In',
                    iconHeight: 20,
                    width: 40,
                    height: 40,
                    primary: false
                }
            },
            {
                properties: {
                    type: 'button',
                    id: 'levelZoomOut',
                    icon: 'ic-zoomout.svg',
                    hint: 'Zoom Out',
                    iconHeight: 20,
                    width: 40,
                    height: 40,
                    primary: false
                }
            },
            {
                properties: {
                    type: 'button',
                    id: 'levelPlaytestBtn',
                    icon: 'ic-play.svg',
                    iconHeight: 20,
                    hint: 'Playtest Level (in Geometry Dash)',
                    width: 40,
                    height: 40,
                    primary: false,
                    onClick: () => {
                        let gdPath = localStorage.getItem('settings.gdpath');
                        let levelObj = canvas.getLevel();
                        let levelTxt = levelparse.object2code(levelObj);
                        if(!window.process) {
                            util.alert('gdPathFailDialog', 'Playtesting is not supported\nin GDExt Web', 'Please use the desktop version', 'OK');
                        } else if(gdPath == 'steam') {
                            loadLevel(levelTxt, localStorage.getItem('lvlname'));
                        } else {
                            util.confirm(
                                'gdPathDialog', 'GD Playtesting',
                                'Before playtesting, please specify the location of your Geometry Dash app',
                                {
                                    buttonYes: 'I use Steam version',
                                    buttonNo: 'I use pirated version',
                                    onConfirm: (t) => {
                                        if(t) {
                                            localStorage.setItem('settings.gdpath', 'steam');
                                            loadLevel(levelTxt, localStorage.getItem('lvlname'));
                                        } else {
                                            util.alert('gdPathFailDialog', 'Pirated GD is not yet supported', 'So yeah... get $2 and buy official GD, nerd', 'OK');
                                        }
                                    }
                                }    
                            )
                        }
                    }
                }
            }
        ]
    },
    quickTools: {
        properties: {
            type: 'container',
            isGrid: true,
            columns: 3
        },
        children: [
            
        ]
    }
}

export default {

    getBottomMenus: () => {
        return bottomMenus;
    },

    getCanvasMenus: () => {
        return canvasMenus;
    },
    
    getQuickToolsMenu: () => {
        let obj = canvasMenus.quickTools;

        quicktoolsData.default.forEach(id => {
            let f = quicktoolsData.actions.filter(a => a.id == id);
            let props = {};
            if(id.startsWith('*')) {
                f = quicktoolsData.actions.filter(a => a.id == id.slice(1));
                props.locked = true;
            }
            let btn = f;
            if(btn.length > 0) btn = btn[0];
            else return;

            obj.children.push({
                properties: {
                    type: 'button',
                    icon: btn.icon,
                    hint: btn.hint,
                    iconHeight: 20,
                    width: 40,
                    height: 40,
                    primary: false,
                    onClick: () => {
                        let event = new CustomEvent(btn.event, { detail: btn.detail });
                        dispatchEvent(event);
                    }
                }
            });
        });

        return obj;
    }

}