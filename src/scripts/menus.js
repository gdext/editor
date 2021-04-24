// all the UI menus and elements stored in a form of GDExt UI system

import util from './util';
import quicktoolsData from '../assets/quicktools.json';

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
                                    max: 360,
                                    min: 0,
                                    unit: '°',
                                    defaultValue: () => { return '0' },
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
                                    icon: 'slide',
                                    min: 0.01,
                                    max: 32,
                                    scale: 0.1
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
                        alert('not now, MOM');
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
                        let event = new CustomEvent(btn.event, { detail: event.detail });
                        dispatchEvent(event);
                    }
                }
            });
        });

        return obj;
    }

}