// all the UI menus and elements stored in a form of GDExt UI system

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

export default {

    getBottomMenus: () => {
        return bottomMenus;
    }

}