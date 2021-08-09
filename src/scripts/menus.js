// all the UI menus and elements stored in a form of GDExt UI system

import util from './util';
import canvas from './canvas';
import levelparse from './levelparse';
import quicktoolsData from '../assets/quicktools.json';
import gdrenderwData from './GDRenderW/assets/data.json';
import settingidsData from '../assets/levelparse/settingids.json';
import settingsData from '../assets/settings.json';
import songsData from '../assets/levelparse/songs.json';
import ui from './ui';
import actions from './actions';

function loadLevel(level) {
    let event = new CustomEvent('electronApi', { 
        detail: {
            detail: 'loadLevel',
            name: level.name,
            data: level.data,
            song: level.song
        }
    });
    dispatchEvent(event);
}


const bottomMenus = {
    editMenu: {
        properties: {
            type: 'container',
            direction: 'row',
            scroll: 'horizontal', 
            paddingX: 15,
            paddingY: 0
        },
        children: [
            // transform section
            ui.container('row', { align: 'end' }, [
                // transform columns
                ui.container('column', {}, [
                    // x position
                    ui.label('X Position'),
                    ui.numberInput('Number', {
                        id: 'editXPos',
                        defaultValue: () => { return '0' },
                        onValueChange: (v) => {
                            canvas.setRelativeTransform({
                                x: parseFloat(v)*3,
                            });
                        },
                        onIconDragEnd: () => {
                            let event = new CustomEvent('editor', { detail: {
                                action: 'update'
                            }});
                            dispatchEvent(event);
                        },
                        icon: 'slide',
                        defaultToInteger: true,
                        scale: 0.33
                    }),
                    
                    //y position
                    ui.label('Y Position', { marginTop: 5 }),
                    ui.numberInput('Number', {
                        id: 'editYPos',
                        defaultValue: () => { return '0' },
                        onValueChange: (v) => {
                            canvas.setRelativeTransform({
                                y: parseFloat(v)*3,
                            });
                        },
                        onIconDragEnd: () => {
                            let event = new CustomEvent('editor', { detail: {
                                action: 'update'
                            }});
                            dispatchEvent(event);
                        },
                        icon: 'slide',
                        defaultToInteger: true,
                        scale: 0.33
                    }),

                    //z layer
                    ui.label('Z Layer', { marginTop: 5 }),
                    ui.list(['B4', 'B3', 'B2', 'B1', 'T1', 'T2', 'T3'], { 
                        id: 'editZLayer',
                        selected:  () => { return 4 },
                        onSelectChange: (s, i) => {
                            let vals = {
                                'B4': -3, 'B3': -1, 'B2': 1, 'B1': 3, 
                                'T1': 5, 'T2': 7, 'T3': 9
                            }
                            canvas.setRelativeTransform({
                                zlayer: vals[i[s]]
                            });
                        }
                    })
                ]),

                ui.container('column', { id: 'test' }, [
                    // rotation
                    ui.label('Rotation'),
                    ui.numberInput('Degree', {
                        id: 'editRot',
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
                        onIconDragEnd: () => {
                            let event = new CustomEvent('editor', { detail: {
                                action: 'update'
                            }});
                            dispatchEvent(event);
                        },
                        icon: 'slide',
                        defaultToInteger: true,
                        scale: 1.33
                    }),
                    
                    //scale
                    ui.label('Scale', { marginTop: 5 }),
                    ui.numberInput('Number', {
                        id: 'editScale',
                        defaultValue: () => { return '1' },
                        onValueChange: (v) => {
                            canvas.setRelativeTransform({
                                scale: parseFloat(v),
                            });
                        },
                        onIconDragEnd: () => {
                            let event = new CustomEvent('editor', { detail: {
                                action: 'update'
                            }});
                            dispatchEvent(event);
                        },
                        icon: 'slide',
                        min: 0.1,
                        max: 8,
                        scale: 0.01
                    }),

                    //z order
                    ui.label('Z Order', { marginTop: 5 }),
                    ui.numberInput('Number', {
                        id: 'editZOrder',
                        defaultValue: () => { return '10' },
                        onValueChange: (v) => {
                            canvas.setRelativeTransform({
                                zorder: parseInt(v),
                            });
                        },
                        onIconDragEnd: () => {
                            let event = new CustomEvent('editor', { detail: {
                                action: 'update'
                            }});
                            dispatchEvent(event);
                        },
                        icon: 'slide',
                        scale: 0.5,
                        integerOnly: true
                    }),
                ]),

                // quick transform buttons
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
                                            rotation: -90,
                                            shiftcenter: true
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
                                            y: parseFloat(document.querySelector('#editChangeScale').getAttribute('multAmount')||30)
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
                                            rotation: 90,
                                            shiftcenter: true
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
                                            x: - parseFloat(document.querySelector('#editChangeScale').getAttribute('multAmount')||30)
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
                                text: 'x1',
                                textStyle: 'bold',
                                hint: 'Change Move Scale',
                                width: 40,
                                height: 40,
                                primary: false,
                                onClick: () => {
                                    let scaleMultipliers = [
                                        30, //1 scale
                                        3, // 1/10 scale
                                        0.6, // 1/50 scale
                                        150, //5 scale
                                    ];
                                    let scaleMultiplierText = ['x1', '1/10', '1/50', 'x5']
                                    let currentIndex = document.querySelector('#editChangeScale').getAttribute('multAmount');
                                    if(currentIndex != undefined) currentIndex = scaleMultipliers.indexOf(parseFloat(currentIndex));
                                    else currentIndex = 0;
                                    currentIndex++;
                                    if(currentIndex >= scaleMultipliers.length) currentIndex = 0;
                                    document.querySelector('#editChangeScale').setAttribute('multAmount', scaleMultipliers[currentIndex]);

                                    document.querySelector('#editChangeScale').querySelector('span').innerText = scaleMultiplierText[currentIndex];
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
                                            x: parseFloat(document.querySelector('#editChangeScale').getAttribute('multAmount')||30)
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
                                hint: 'Flip Vertically',
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
                                            y: - parseFloat(document.querySelector('#editChangeScale').getAttribute('multAmount')||30)
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
                },

                // group settings
                {
                    properties: {
                        type: 'container',
                        direction: 'column',
                        seperationLeft: 50,
                        uistretch: true
                    },
                    children: [
                        // groups
                        ui.label('Groups'),
                        ui.array(() => { return [] }, {
                            id: 'editGroup',
                            maxItems: 10,
                            width: 256,
                            addMenu: {
                                title: 'Add Group',
                                maxwidth: 150,
                                content: ui.container('column', { paddingX: 7, paddingY: 5}, [
                                    ui.numberInput('Group ID', {
                                        id: 'editGroupAddVal',
                                        defaultValue: () => {
                                            return 1;
                                        },
                                        min: 0,
                                        max: 999,
                                        icon: 'slide',
                                        integerOnly: true,
                                        marginBottom: 5
                                    }),
                                    ui.button('Next Free', { marginBottom: 5 }),
                                    ui.button('Add Group', { id: 'editGroupAddBtn', primary: true })
                                ]),
                                btnId: 'editGroupAddBtn',
                                valId: 'editGroupAddVal'
                            },
                            onValuesChange: (values, changes) => {
                                let prevGroups = canvas.getRelativeTransform().groups;
                                if(!prevGroups) return;

                                // for adding new groups
                                let addFilter = changes.add;
                                if(addFilter != '') {
                                    addFilter.forEach(ag => {
                                        if(prevGroups.remove.includes(ag)) 
                                            prevGroups.remove.splice(prevGroups.remove.indexOf(ag), 1);
                                        
                                        if(!prevGroups.add.includes(ag)) 
                                            prevGroups.add.push(ag);
                                    });
                                }
                                
                                // for removing newly added groups
                                let removeFilter = prevGroups.add.filter(f => changes.remove.includes(f));
                                if(removeFilter != '') {
                                    removeFilter.forEach(ag => {
                                        prevGroups.add.splice(prevGroups.add.indexOf(ag), 1);
                                        prevGroups.remove.push(ag);
                                    });
                                }

                                // for removing groups that existed on select
                                let removeOldFilter = prevGroups.all ? prevGroups.all.filter(f => changes.remove.includes(f)) : '';
                                if(removeOldFilter != '') {
                                    removeOldFilter.forEach(ag => {
                                        prevGroups.all.splice(prevGroups.all.indexOf(ag), 1);
                                        prevGroups.remove.push(ag);
                                    });
                                }

                                canvas.setRelativeTransform({
                                    groups: prevGroups
                                });
                            }
                        }),

                        // misc checkboxes
                        ui.container('row', { marginTop: 8.5, marginBottom: 8.5 }, [
                            ui.container('column', {}, [
                                ui.checkbox('No Fade', { checked: () => { return false } }),
                                ui.checkbox('Group Parent', { checked: () => { return false }, marginTop: 7 })
                            ]),
                            ui.container('column', {}, [
                                ui.checkbox('No Enter', { checked: () => { return false } }),
                                ui.checkbox('High Detail', { checked: () => { return false }, marginTop: 7 })
                            ])
                        ]),

                        // editor layers
                        ui.label('Editor Layers'),
                        ui.textInput('Coming Soon!', {
                            id: 'editELayers',
                            //defaultValue: () => { return '0' },
                            icon: 'pick'
                        }),
                    ]
                },

                // tools
                {
                    properties: {
                        type: 'container',
                        direction: 'column',
                        seperationLeft: 50
                    },
                    children: [
                        // tools
                        ui.container('column', {}, [
                            ui.label('Tools'),
                            {
                                properties: {
                                    type: 'container',
                                    isGrid: true,
                                    id: 'editTransformTools',
                                    columns: 2,
                                },
                                children: [
                                    ui.button(null, { id: 'editToolMove', icon: 'ic-move.svg',
                                        hint: 'Toggle Move Tool', iconHeight: 20, width: 40, 
                                        height: 40, primary: false
                                    }),
                                    ui.button(null, { id: 'editToolRotate', icon: 'ic-rotate.svg',
                                        hint: 'Toggle Rotate Tool', iconHeight: 20, width: 40, 
                                        height: 40, primary: false
                                    }),
                                    ui.button(null, { id: 'editToolScale', icon: 'ic-scale.svg',
                                        hint: 'Toggle Scale Tool', iconHeight: 20, width: 40, 
                                        height: 40, primary: false
                                    }),
                                    ui.button(null, { id: 'editToolSnap', icon: 'ic-magnet.svg',
                                        hint: 'Toggle Grid Snapping', iconHeight: 20, width: 40, 
                                        height: 40,primary: false
                                    }),
                                    ui.button('Free Move', { id: 'editToolFreeMove', textStyle: 'small',
                                        hint: 'Toggle Free Move', iconHeight: 20, width: 40, height: 40,
                                        primary: false
                                    }),
                                    ui.button(null, { id: 'editToolFilter', icon: 'ic-filter.svg',
                                        hint: 'Selection Filter', iconHeight: 20, width: 40, 
                                        height: 40, primary: false
                                    }),
                                ]
                            },
                        ]),

                    ]
                }
            ])
        ]
    },
    deleteMenu: {
        properties: {
            type: 'container',
            direction: 'row',
            paddingX: 15,
            paddingY: 0
        },
        children: [
            {
                properties: {
                    type: 'label',
                    text: 'Coming Soon!'
                }
            }
        ]
    }
}

function quickButton(id, icon, hint, primary = false, props = {}, children = []) {
    return ui.button(undefined, Object.assign(props, { id, icon, hint, iconHeight: 20, width: 40, height: 40, primary }), children);
}

const canvasMenus = {
    canvasOptions: ui.container('row', {}, [
        quickButton('levelSettingsBtn', 'ic-settings.svg', 'Level Settings', true, {
            onClick: () => openLevelSettings()
        }),
        quickButton('levelZoomIn', 'ic-zoomin.svg', 'Zoom In'),
        quickButton('levelZoomOut', 'ic-zoomout.svg', 'Zoom Out'),
        quickButton('levelPlaytestBtn', 'ic-play.svg', 'Playtest Level (in Geometry Dash)', false, {
            onClick: () => {
                let gdPath = localStorage.getItem('settings.gdpath');
                let levelObj = canvas.getLevel();
                let levelTxt = levelparse.object2code(levelObj);
                if(!window.process) {
                    util.alert('gdPathFailDialog', 'Playtesting is not supported\nin GDExt Web', 'Please use the desktop version', 'OK');
                } else if(gdPath == 'steam') {
                    loadLevel({
                        data: levelTxt, 
                        name: localStorage.getItem('lvlname'),
                        song: localStorage.getItem('lvlsong')
                    });
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
                                    loadLevel({
                                        data: levelTxt, 
                                        name: localStorage.getItem('lvlname'),
                                        song: localStorage.getItem('lvlsong')
                                    });
                                } else {
                                    util.alert('gdPathFailDialog', 'Pirated GD is not yet supported', 'So yeah... get $2 and buy official GD, nerd', 'OK');
                                }
                            }
                        }    
                    )
                }   
            }
        }),
    ]),
    quickTools: ui.container(undefined, {
        isGrid: true,
        columns: 3
    }, [])
}

const contextMenus = {
    editObject: {
        normal: {
            properties: {
                type: 'contextMenu',
                id: 'editObjMenu',
                title: 'Edit Object',
                x: 0,
                y: 0
            },
            children: [
                {
                    properties: {
                        type: 'container',
                        paddingX: 7,
                        paddingY: 5
                    },
                    children: [
                        {
                            properties: {
                                type: 'label',
                                text: 'Color',
                                style: 'bold'
                            }
                        },
                        {
                            properties: {
                                type: 'container',
                                direction: 'row',
                                paddingX: 0,
                                paddingY: 5
                            },
                            children: [
                                //base color
                                {
                                    properties: {
                                        type: 'container',
                                        direction: 'column'
                                    },
                                    children: [
                                        {
                                            properties: {
                                                type: 'label',
                                                text: 'Base'
                                            }
                                        },
                                        {
                                            properties: {
                                                type: 'numberInput',
                                                id: 'editobjBaseColor',
                                                defaultValue: () => {
                                                    return 0;
                                                },
                                                integerOnly: true,
                                                icon: 'pick'
                                            }
                                        }
                                    ]
                                },
                                // detail color
                                {
                                    properties: {
                                        type: 'container',
                                        direction: 'column'
                                    },
                                    children: [
                                        {
                                            properties: {
                                                type: 'label',
                                                text: 'Detail'
                                            }
                                        },
                                        {
                                            properties: {
                                                type: 'numberInput',
                                                id: 'editobjDetailColor',
                                                defaultValue: () => {
                                                    return 0;
                                                },
                                                integerOnly: true,
                                                icon: 'pick'
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            properties: {
                                type: 'button',
                                text: 'Edit Colors',
                                marginTop: 3,
                                marginBottom: 5
                            }
                        }
                    ]
                }
            ]
        }
    },
    objColor: {
        normal: {
            properties: {
                type: 'contextMenu',
                id: 'colorChannelEditMenu',
                title: 'Color Channel',
                x: 0,
                y: 0,
                maxwidth: 150
            },
            children: [
                {
                    properties: {
                        type: 'container',
                        paddingX: 7,
                        paddingY: 10
                    },
                    children: [
                        {
                            properties: {
                                type: 'label',
                                text: 'Type',
                                marginTop: 0
                            }
                        },
                        {
                            properties: {
                                type: 'tabs',
                                items: ['Number', 'Special'],
                                selected: () => {
                                    return 0;
                                },
                                id: 'colorChannelEditType',
                                onSelectChange: (n) => {
                                    if(!document.querySelector('#colorChannelTypeNumber')) return;
                                    if(n == 0) {
                                        document.querySelector('#colorChannelTypeNumber').style.display = '';
                                        document.querySelector('#colorChannelTypeSpecial').style.display = 'none';
                                    } else {
                                        document.querySelector('#colorChannelTypeNumber').style.display = 'none';
                                        document.querySelector('#colorChannelTypeSpecial').style.display = '';
                                    }
                                }
                            }
                        },
                        {
                            properties: {
                                type: 'container',
                                direction: 'column',
                                id: 'colorChannelTypeNumber',
                            },
                            children: [
                                {
                                    properties: {
                                        type: 'label',
                                        text: 'Channel ID'
                                    }
                                },
                                {
                                    properties: {
                                        type: 'numberInput',
                                        min: 0,
                                        max: 999,
                                        integerOnly: true,
                                        defaultValue: () => {
                                            return 1;
                                        },
                                        icon: 'slide',
                                        id: 'colorChannelEditChannelID'
                                    }
                                },
                                {
                                    properties: {
                                        type: 'button',
                                        text: 'Next Free ID',
                                        marginTop: 5
                                    }
                                },
                                {
                                    properties: {
                                        type: 'label',
                                        text: 'Channel Color',
                                        marginTop: 5
                                    }
                                },
                                {
                                    properties: {
                                        type: 'colorInput',
                                        defaultValue: () => {
                                            return '#ffffff';
                                        },
                                        icon: 'edit',
                                        id: 'colorChannelEditChannelColor'
                                    }
                                },
                                {
                                    properties: {
                                        type: 'checkbox',
                                        text: 'Blending',
                                        checked: () => {
                                            return false;
                                        },
                                        marginTop: 5,
                                        id: 'colorChannelEditChannelBlending'
                                    }
                                }
                            ]
                        },
                        {
                            properties: {
                                type: 'container',
                                direction: 'column',
                                id: 'colorChannelTypeSpecial',
                                invisible: true,
                            },
                            children: [
                                {
                                    properties: {
                                        type: 'label',
                                        text: 'Special Channel Name'
                                    }
                                },
                                {
                                    properties: {
                                        type: 'list',
                                        mode: 'dropdown',
                                        items: [
                                            'Player 1', 'Player 2',
                                            'Light BG', 'Default'
                                        ],
                                        selected: () => {
                                            return 0;
                                        },
                                        id: 'colorChannelEditSpecial'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    properties: {
                        type: 'container',
                        paddingX: 7,
                        paddingY: 7,
                        isBottomBar: true,
                        title: 'HSV Modify',
                        collapsible: true,
                        collapsed: true
                    },
                    children: [
                        {
                            properties: {
                                type: 'slider',
                                defaultValue: () => {
                                    return 0;
                                },
                                integerOnly: true,
                                min: -180,
                                max: 180,
                                marginBottom: 0,
                                label: 'Hue'
                            }
                        },
                        {
                            properties: {
                                type: 'slider',
                                defaultValue: () => {
                                    return 0;
                                },
                                min: -1,
                                max: 1,
                                marginBottom: 5,
                                label: 'Saturation'
                            }
                        },
                        {
                            properties: {
                                type: 'tabs',
                                items: ['Multiply', 'Add'],
                                selected: () => {
                                    return 1;
                                }
                            }
                        },
                        {
                            properties: {
                                type: 'slider',
                                defaultValue: () => {
                                    return 1;
                                },
                                min: 0,
                                max: 2,
                                marginBottom: 5,
                                labelSeparator: ': x',
                                label: 'Value'
                            }
                        },
                        {
                            properties: {
                                type: 'tabs',
                                items: ['Multiply', 'Add'],
                                selected: () => {
                                    return 0;
                                }
                            }
                        }
                    ]
                }
            ]
        }
    }
}

const settingsMenus = {
    general: {
        properties: {
            type: 'container',
            direction: 'row',
            align: 'start'
        },
        children: [
            {
                properties: {
                    type: 'container',
                    direction: 'column',
                    seperationRight: 15
                },
                children: [
                    {
                        properties: {
                            type: 'label',
                            text: 'Language'
                        }
                    },
                    {
                        properties: {
                            type: 'list',
                            mode: 'dropdown',
                            items: [
                                'English', 'Coming Soon',
                                'El'
                            ],
                            selected: () => {
                                return localStorage.getItem('settings.language') ? parseInt(localStorage.getItem('settings.language')) : settingsData.defaults.language;
                            },
                            onSelectChange: () => {
                                util.applySettings('comingsoon');
                            },
                            id: 'settingsLanguage'
                        }
                    }
                ]
            },
            {
                properties: {
                    type: 'container',
                    direction: 'column'
                },
                children: [
                    {
                        properties: {
                            type: 'label',
                            text: 'GUI Zoom Level'
                        }
                    },
                    {
                        properties: {
                            type: 'list',
                            mode: 'horizontal',
                            items: [
                                '50%', '67%', '75%', '80%', '90%',
                                '100%', '110%', '125%', '150%', '175%', '200%'
                                
                            ],
                            dontWrap: true,
                            selected: () => {
                                return localStorage.getItem('settings.guiZoom') ? parseInt(localStorage.getItem('settings.guiZoom')) : settingsData.defaults.guiZoom;
                            },
                            onSelectStop: (s) => {
                                localStorage.setItem('settings.guiZoom', s);
                                util.applySettings('guiZoom');
                            },
                            id: 'settingsGuiZoom'
                        }
                    }
                ]
            }
        ]
    },
    editor: {
        properties: {
            type: 'container',
            direction: 'row',
            align: 'start'
        },
        children: [
            {
                properties: {
                    type: 'container',
                    direction: 'column',
                    seperationRight: 15
                },
                children: [
                    {
                        properties: {
                            type: 'checkbox',
                            text: 'Autosaving',
                            big: true,
                            checked: () => {
                                return localStorage.getItem('settings.autosaveEnabled') == '1';
                            },
                            onCheckChange: (c) => {
                                if(c) {
                                    localStorage.setItem('settings.autosaveEnabled', '1');
                                } else {
                                    localStorage.setItem('settings.autosaveEnabled', '0');
                                }
                                util.applySettings('autosaveEnabled');

                                let h = document.querySelector('#settingsAutosaveRelatedSettings');
                                if(h) {
                                    if(c) h.classList.remove('disabled');
                                    else h.classList.add('disabled');
                                }
                            },
                            onCreate: () => {
                                let h = document.querySelector('#settingsAutosaveRelatedSettings');
                                if(h && localStorage.getItem('settings.autosaveEnabled') != '1') 
                                    h.classList.add('disabled');
                            },
                            id: 'settingsAutosaveEnabled'
                        }
                    },
                    {
                        properties: {
                            type: 'container',
                            direction: 'column',
                            id: 'settingsAutosaveRelatedSettings'
                        },
                        children: [
                            {
                                properties: {
                                    type: 'label',
                                    text: 'Autosave Interval',
                                    marginTop: 10,
                                }
                            },
                            {
                                properties: {
                                    type: 'list',
                                    mode: 'dropdown',
                                    items: [
                                        '5 Minutes', '10 Minutes', '15 Minutes',
                                        '30 Minutes', '1 Hour'
                                    ],
                                    selected: () => {
                                        return localStorage.getItem('settings.autosaveInterval') ? parseInt(localStorage.getItem('settings.autosaveInterval')) : settingsData.defaults.autosaveInterval;
                                    },
                                    onSelectChange: () => {
                                        util.applySettings('comingsoon');
                                    },
                                    id: 'settingsAutosaveInterval'
                                }
                            }
                        ]
                    },
                    {
                        properties: {
                            type: 'checkbox',
                            text: 'Show Quick Tools',
                            big: true,
                            marginTop: 20,
                            checked: () => {
                                if(!localStorage.getItem('settings.showQuickTools')) return true;
                                return localStorage.getItem('settings.showQuickTools') == '0';
                            },
                            onCheckChange: (c) => {
                                if(c) {
                                    localStorage.setItem('settings.showQuickTools', '0');
                                } else {
                                    localStorage.setItem('settings.showQuickTools', '1');
                                }
                                util.applySettings('showQuickTools');

                                let h = document.querySelector('#settingsOrganizeQuickTools');
                                if(h) {
                                    if(c) h.classList.remove('disabled');
                                    else h.classList.add('disabled');
                                }
                            },
                            onCreate: () => {
                                let h = document.querySelector('#settingsOrganizeQuickTools');
                                if(h && localStorage.getItem('settings.showQuickTools') == '1') 
                                    h.classList.add('disabled');
                            },
                            id: 'settingsShowQuickTools'
                        }
                    },
                    {
                        properties: {
                            type: 'button',
                            text: 'Organize Quick Tools',
                            marginTop: 10,
                            id: 'settingsOrganizeQuickTools'
                        }
                    }
                ]
            },
            {
                properties: {
                    type: 'container',
                    direction: 'column'
                },
                children: [
                    {
                        properties: {
                            type: 'label',
                            text: 'GD Levels File Location',
                            marginTop: 0,
                        }
                    },
                    {
                        properties: {
                            type: 'textInput',
                            placeholder: 'Default',
                            id: 'settingsGdLevelsPath',
                            uneditable: true,
                            icon: 'folder',
                            defaultValue: () => {
                                return localStorage.getItem('settings.gdLevelsPath') || '';
                            },
                            onIconClick: () => {
                                let path = util.pickFiles({
                                    defaultPath: actions.getGDPath(),
                                    filters: [
                                        { name: 'GD Data Files', extensions: ['dat'] },
                                        { name: 'All Files', extensions: ['*'] },
                                    ],
                                    properties: [ 'openFile' ]
                                });
                                document.querySelector('#settingsGdLevelsPath').value = path || '';
                                localStorage.setItem('settings.gdLevelsPath', path || '');
                                actions.updateGDPath();
                            }
                        }
                    },
                    {
                        properties: {
                            type: 'button',
                            text: 'Use Default',
                            marginTop: 7,
                            marginBottom: 7,
                            onClick: () => {
                                let targetInput = document.querySelector('#settingsGdLevelsPath');
                                if(targetInput) targetInput.value = '';
                                localStorage.setItem('settings.gdLevelsPath', '');
                            }
                        }
                    }
                ]
            }
        ]
    },
    flags: {
        properties: {
            type: 'container',
            direction: 'column',
            align: 'start',
            scroll: 'vertical'
        },
        children: [
            ui.label('Appearance', { style: 'heading', marginBottom: 10 }),
            ui.container('row', { align: 'start', marginBottom: 20 }, [
                ui.container('column', { seperationRight: 15 }, [
                    ui.checkbox('Show Grid', { checked: () => { return true }, big: true, marginBottom: 10 }),
                    ui.checkbox('Show Colors', { checked: () => { return true }, big: true, marginBottom: 10 }),
                    ui.checkbox('Show Alpha', { checked: () => { return true }, big: true }),
                    ui.label('If disabled, all objects have 100% opacity, regardless of alpha triggers',
                    {  marginBottom: 10, style: 'small' } ),
                    ui.checkbox('Show Lines', { checked: () => { return true }, big: true }),
                ]),
                ui.container('column', { }, [
                    ui.checkbox('Show Collision Boxes', { checked: () => { return true }, big: true, marginBottom: 10 }),
                    ui.checkbox('Show Duration Lines', { checked: () => { return false }, big: true, marginBottom: 10 }),
                    ui.checkbox('Show Ground Texture', { checked: () => { return false }, big: true }),
                    ui.label('If disabled, the ground is shown as a line, instead of an actual ground texture',
                    {  marginBottom: 10, style: 'small' } ),
                    ui.checkbox('Show Object Info', { checked: () => { return false }, big: true }),
                ])
            ]),

            ui.label('Functionality', { style: 'heading', marginBottom: 10 }),
            ui.container('row', { align: 'start', marginBottom: 20 }, [
                ui.container('column', { seperationRight: 15 }, [
                    ui.checkbox('Scroll Wheel to Zoom', { checked: () => { return true }, big: true }),
                    ui.label('If disabled, scroll wheel is used to move the camera vertically, instead of zoomin in/out',
                    {  marginBottom: 10, style: 'small' } ),
                ]),
                ui.container('column', { }, [
                    ui.checkbox('Selection Cycle', { checked: () => { return false }, big: true }),
                    ui.label('Cycle between all the objects, that collide with the mouse pointer, when selecting',
                    {  marginBottom: 10, style: 'small' } ),
                ])
            ])
        ]
    },
    level: {
        properties: {
            type: 'container',
            scroll: 'vertical'
        },
        children: [
            ui.container('row', { align: 'start', paddingX: 15, paddingY: 10 }, [
                ui.container('column', { seperationRight: 15 }, [
                    ui.label('Colors', { style: 'heading', marginBottom: 10 }),
                    ui.button('Customize Level Colors', { 
                        marginBottom: 20,
                        onClick: () => { util.applySettings('comingsoon') }
                    }),

                    ui.label('Texture', { style: 'heading', marginBottom: 10 }),
                    ui.container('column', { disabled: true }, [
                        ui.label('Background'),
                        ui.list(
                            ['Background 1'],
                            { selected: () => { return 0 } }
                        ),
                        ui.label('Ground', { marginTop: 5 }),
                        ui.list(
                            ['Ground 1'],
                            { selected: () => { return 0 } }
                        ),
                        ui.label('Ground Line Style', { marginTop: 5 }),
                        ui.tabs(
                            ['Gradient', 'Constant'],
                            { selected: () => { return 0 } }
                        ),
                        ui.label('Font', { marginTop: 5 }),
                        ui.list(
                            ['Font 1 (Pusab)'],
                            { selected: () => { return 0 }, marginBottom: 20 }
                        ),
                    ]),

                    ui.label('Song Guidelines', { style: 'heading', marginBottom: 10 }),
                    ui.button('Open Guidelines Editor', { 
                        marginBottom: 20,
                        onClick: () => { util.applySettings('comingsoon') } 
                    })
                ]),
                ui.container('column', {}, [
                    ui.label('Game Mode', { style: 'heading', marginBottom: 10 }),
                    ui.label('Starting Game Mode'),
                    ui.list(
                        ['Cube', 'Ship', 'Ball', 'UFO', 'Wave', 'Robot', 'Spider'],
                        { 
                            selected: () => { return parseInt(canvas.getSetting('gamemode') || 0) }, 
                            onSelectChange: (s) => { canvas.setSetting('gamemode', s) },
                            mode: 'dropdown' 
                        }
                    ),

                    ui.container('row', { marginTop: 7 }, [
                        ui.checkbox('Mini mode', { 
                            checked: () => { return canvas.getSetting('mini') == '1' },
                            onCheckChange: (c) => {  canvas.setSetting('mini', c * 1) }
                        }),
                        ui.checkbox('Dual mode', { 
                            checked: () => { return canvas.getSetting('dual') == '1' },
                            onCheckChange: (c) => {  canvas.setSetting('dual', c * 1) }
                        })
                    ]),
                    ui.checkbox('2-Player mode', { 
                        marginTop: 7, 
                        checked: () => { return canvas.getSetting('2p') == '1' },
                        onCheckChange: (c) => {  canvas.setSetting('2p', c * 1) }
                    }),
                    ui.label('In dual mode players are controlled separately. This is often used in ' +
                    'levels for 2 players and minigames', { style: 'small' } ),

                    ui.label('Speed', { marginTop: 10 }),
                    ui.tabs(
                        ['0.5x', '1x', '2x', '3x', '4x'],
                        { 
                            selected: () => { 
                                let speed = parseInt(canvas.getSetting('speed') || 0); 
                                if(speed == 1) speed = 0;
                                else if(speed == 0) speed = 1;
                                return speed;
                            }, 
                            onSelectChange: (s) => {
                                if(s == 1) s = 0;
                                else if(s == 0) s = 1;
                                canvas.setSetting('speed', s);
                            },
                            marginBottom: 20 
                        }
                    ),

                    ui.label('Song', { style: 'heading', marginBottom: 10 }),
                    ui.tabs(
                        ['Official', 'Custom'],
                        { 
                            selected: () => { return 0 }, 
                            onSelectChange: (s) => { if(s) util.applySettings('comingsoon') } 
                        }
                    ),
                    ui.label('Official Song Name', { marginTop: 5 }),
                    ui.list(
                        songsData.slice(1),
                        { 
                            selected: () => { return parseInt(localStorage.getItem('lvlsong') || 1) - 1 },
                            onSelectChange: (s) => { localStorage.setItem('lvlsong', s+1) }
                        }
                    ),
                    ui.label('Start Offset (in seconds)', { marginTop: 5 }),
                    ui.container('row', {}, [
                        ui.numberInput(
                            'Number',
                            { 
                                defaultValue: () => { return parseFloat(canvas.getSetting('songoffset') || 0) }, 
                                icon: 'slide', 
                                min: 0,
                                onValueChange: (v) => {
                                    canvas.setSetting('songoffset', v);
                                },
                                scale: 0.1
                            }
                        ),
                        ui.button(null, { 
                            icon: 'ic-play.svg', iconHeight: 14, width: 32, height: 30,
                            onClick: () => { util.applySettings('comingsoon') }
                        })
                    ]),
                    ui.container('row', { marginTop: 7 }, [
                        ui.checkbox('Fade in', { 
                            checked: () => { return canvas.getSetting('songfadein') == '1' },
                            onCheckChange: (c) => {  canvas.setSetting('songfadein', c * 1) }
                        }),
                        ui.checkbox('Fade out', { 
                            checked: () => { return canvas.getSetting('songfadeout') == '1' },
                            onCheckChange: (c) => {  canvas.setSetting('songfadeout', c * 1) }
                        })
                    ]),
                ])
            ])
        ]
    },
}

function openLevelSettings() {
    util.createDialog('settingsDialog', 'Level Settings', true, [settingsMenus.level], true);
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
                    iconHeight: btn.customHeight ? btn.customHeight : 20,
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
    },

    getContextMenu: (type, options) => {
        let obj = {};
        switch(type) {
            case 'editObjectNormal':
                obj = contextMenus.editObject.normal;
                let baseColorInput = obj.children[0].children[1].children[0].children[1];
                let detailColorInput = obj.children[0].children[1].children[1].children[1];

                baseColorInput.properties.onValueChange = v => {
                    onColorIdInputChange(v, 0);
                }
                detailColorInput.properties.onValueChange = v => {
                    onColorIdInputChange(v, 1);
                }
                let selectedColors = null;
                let targetColor = 0; // 0 - base, 1 - detail

                function onColorIdInputChange(v, col) {
                    let vv = v;
                    if(Object.values(settingidsData.colorchannelnames).includes(v)) {
                        vv = Object.keys(settingidsData.colorchannelnames)[Object.values(settingidsData.colorchannelnames).indexOf(v)];
                    }
                    let sel = canvas.getSelectedObjects();
                    let data = [];
                    sel.forEach(k => {
                        data.push({ id: k });
                    });
                    let props = {};
                    if(col == 0) {
                        props.baseCol = parseInt(vv);
                    } else {
                        props.decorCol = parseInt(vv);
                    }
                    canvas.placeObject({
                        mode: 'edit',
                        data: data,
                        props: props
                    });
                }

                function onColorInputChange(v) {
                    let colinp = document.querySelector(targetColor ? '#editobjDetailColor' : '#editobjBaseColor');
                    let col = canvas.getLevel().info.colors.filter(f => f.channel == colinp.value);
                    let h = util.hexToRGB(v);
                    if(col != '') {
                        col[0].r = h.r;
                        col[0].g = h.g;
                        col[0].b = h.b;
                    } else {
                        canvas.getLevel().info.colors.push({ 
                            r: h.r, g: h.g, b: h.b, a: 1, alpha: 1,
                            channel: colinp.value,
                            channelInfo: colinp.value,
                            pcolor: "-1"
                        });
                        console.log(canvas.getLevel().info.colors);
                    }
                }

                function onColorInputClick(e, targetc) {
                    targetColor = targetc;
                    colorInputValue(targetColor);

                    let obj2 = contextMenus.objColor.normal;
                    obj2.properties.x = e.pageX+5;
                    obj2.properties.y = e.pageY-15;

                    let colorChannelMode = obj2.children[0].children[1];
                    if(Object.keys(settingidsData.colorchannelnames).includes(selectedColors.toString())) {
                        colorChannelMode.properties.selected = () => { return 1 };
                    } else {
                        colorChannelMode.properties.selected = () => { return 0 };
                    }
                    let colorChannelId = obj2.children[0].children[2].children[1];
                    let colorChannelColor = obj2.children[0].children[2].children[4];
                    let colorChannelBlending = obj2.children[0].children[2].children[5];

                    let colorChannelSpecial = obj2.children[0].children[3].children[1];

                    colorChannelSpecial.properties.selected = () => {
                        let items = colorChannelSpecial.properties.items;
                        console.log(items);
                        let r;
                        if(settingidsData.colorchannelnames[selectedColors]) {
                            let b = settingidsData.colorchannelnames[selectedColors];
                            console.log(b);
                            r = items.indexOf(b);
                            let a = targetColor ? 'secCol' : 'mainCol';
                            
                            let sel = canvas.getSelectedObjects();
                            let isDefault = true;
                            sel.forEach(k => {
                                let id = canvas.getObjectByKey(k).id;
                                if(selectedColors != gdrenderwData[id][a]) isDefault = false;
                            });
                            
                            if(isDefault) r = items.indexOf('Default');
                        } else {
                            r = 0;
                        }
                        
                        return r;
                    }

                    colorChannelSpecial.properties.onSelectChange = (s, ims) => {
                        let col;
                        if(ims[s] == 'Default') {
                            let a = targetColor ? 'secCol' : 'mainCol';
                            let sel = canvas.getSelectedObjects();
                            let id = canvas.getObjectByKey(sel[0]).id;
                            col = gdrenderwData[id][a]
                        } else {
                            col = ims[s];
                        }
                        document.querySelector(targetColor ? '#editobjDetailColor' : '#editobjBaseColor').value = col;
                        document.querySelector(targetColor ? '#editobjDetailColor' : '#editobjBaseColor').onchange();
                    }

                    colorChannelId.properties.defaultValue = () => {
                        return selectedColors || 0;
                    }

                    colorChannelColor.properties.onValueChange = onColorInputChange;

                    function updateColor(element) {
                        let targetCol = canvas.getLevel().info.colors.filter(f => parseInt(f.channel) == selectedColors);
                        targetCol = targetCol != '' ? targetCol[0] : { r: 255, g: 255, b: 255, blending: 0 }
                    
                        let r;
                        switch(element) {
                            case 0:
                                r = util.rgbToHex(targetCol.r, targetCol.g, targetCol.b);
                                break;
                            case 1:
                                r = targetCol.blending == 1;
                                break;
                        }

                        return r;
                    }

                    let targetCol = canvas.getLevel().info.colors.filter(f => parseInt(f.channel) == selectedColors);
                    targetCol = targetCol != '' ? targetCol[0] : { r: 255, g: 255, b: 255, blending: 0 }
                    colorChannelColor.properties.defaultValue = () => {
                        return updateColor(0);
                    }
                    colorChannelBlending.properties.checked = () => {
                        return updateColor(1);
                    }

                    colorChannelId.properties.onValueChange = (v) => {
                        selectedColors = v;
                        let colorInp = document.querySelector('#colorChannelEditChannelColor');
                        let colorBlend = document.querySelector('#colorChannelEditChannelBlending');
                        if(colorInp) colorInp.value = updateColor(0);
                        if(colorBlend) colorBlend.checked = updateColor(1);

                        document.querySelector(targetColor ? '#editobjDetailColor' : '#editobjBaseColor').value = v;
                        document.querySelector(targetColor ? '#editobjDetailColor' : '#editobjBaseColor').onchange();
                    }

                    let el = document.querySelector('#editObjMenu');
                    if(!el) el = document.body;
                    ui.renderUiObject(obj2, el);
                }

                function colorInputValue(col) {
                    let sel = canvas.getSelectedObjects();
                    if(!sel.length) return 0;
                    
                    //check if the values are equal
                    let valuesEqual = true;
                    let vals = [];
                    sel.forEach(k => {
                        let obj = canvas.getObjectByKey(k);
                        let c = col ? obj.decorCol : obj.baseCol;
                        let a = col ? 'secCol' : 'mainCol';
                        let v = c == undefined ? (gdrenderwData[obj.id] ? gdrenderwData[obj.id][a] : 1) : c;
                        vals.push(v);
                        vals.forEach(vv => {
                            if(vv != v) valuesEqual = false;
                        });
                    });

                    //return
                    if(valuesEqual) {
                        selectedColors = vals[0];
                        let clrname = settingidsData.colorchannelnames[vals[0]];
                        return clrname ? clrname : vals[0];
                    }
                    else {
                        selectedColors = 'Mixed';
                        return 'Mixed';
                    }
                }

                baseColorInput.properties.onIconClick = (e) => {
                    onColorInputClick(e, 0);
                }
                baseColorInput.properties.defaultValue = () => {
                    return colorInputValue(0);
                }
                detailColorInput.properties.onIconClick = (e) => {
                    onColorInputClick(e, 1);
                }
                detailColorInput.properties.defaultValue = () => {
                    return colorInputValue(1);
                }
                break;
        }
        if(options) {
            obj.properties.x = options.x;
            obj.properties.y = options.y;
        }
        return obj;
    },

    openSettings: (n) => {
        //level settings
        if(n == 4) {
            openLevelSettings();
            return;
        }

        let settingsTabs = {
            properties: {
                type: 'tabs',
                items: [],
                selected: () => {
                    return n || 0;
                },
                id: 'settingsCategories',
                marginBottom: 10,
                style: 'header',
                onSelectChange: (n) => {
                    settingsData.categories.forEach(c => {
                        let id = '#settingsCategory' + c.id;
                        if(!document.querySelector(id)) return;
                        document.querySelector(id).style.display = 'none';
                    });
                    let targetId = '#settingsCategory' + settingsData.categories[n].id;
                    document.querySelector(targetId).style.display = '';
                }
            }
        }
        settingsData.categories.forEach(c => {
            settingsTabs.properties.items.push(c.name);
        });

        let obj = {
            properties: {
                type: 'container',
                direction: 'column',
                paddingX: 15,
                paddingY: 10,
            },
            children: [
                settingsTabs
            ]
        }

        settingsData.categories.forEach(c => {
            if(settingsMenus[c.id]) {
                let objcat = settingsMenus[c.id];
                objcat.properties.id = 'settingsCategory' + c.id;
                obj.children.push(objcat);
            }
        });
        
        util.createDialog('settingsDialog', 'GDExt Settings', true, [obj], true);
    }

}
