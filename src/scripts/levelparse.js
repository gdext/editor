import propids from '../assets/levelparse/propids.json';
import settingids from '../assets/levelparse/settingids.json';
import objects from '../assets/levelparse/objects.json';

export default {
    code2object: (code) => {
        //transform level data to array
        let levelObjects = [];
        code.split(';').forEach(obj => {
            let data = {};
            let objSplitted = obj.split(',');
            for(let i = 0; i < objSplitted.length; i+=2){
                let val = (propids[objSplitted[i]] == 'groups') ? objSplitted[i+1].split('.') : ((propids[objSplitted[i]] == 'copiedHSV') ? objSplitted[i+1].split('a') : objSplitted[i+1]);
                data[propids[objSplitted[i]] || objSplitted[i]] = val;
            }
            //check if trigger, portal, orb, pad or pickup
            const types = ['triggers', 'portals', 'orbs', 'pads', 'pickups'];
            types.forEach(t => {
                if(objects[t].ids.includes(parseInt(data.id))){
                    data.type = t.slice(0, -1);
                    if(t == 'triggers' && Object.keys(settingids.colortriggers).includes(data.id)) {
                        data.color = settingids.colortriggers[data.id];
                    }
                    data.info = objects[t].names[objects[t].ids.indexOf(parseInt(data.id))];
                }
            });
            //check if text
            if(objects.text == data.id) {
                data.type = "text";
                if(data.text) {
                    try { data.text = atob(data.text, 'base64') }
                    catch { data.text = false };
                }
            }
            //default type
            if(!data.type) data.type = 'object';
            levelObjects.push(data);
        });
        levelObjects = levelObjects.slice(1, -1);
        //level settings
        let levelSettingsObj = {};
        let levelSettingsSplitted = code.split(';')[0].split(',');
        for(let i = 0; i < levelSettingsSplitted.length; i+=2){
            let val = levelSettingsSplitted[i+1];
            let key = settingids[levelSettingsSplitted[i]];
            if(key == "colors") levelSettingsObj[key] = val.split('|');
            else if(key) levelSettingsObj[key] = val;
            else levelSettingsObj[levelSettingsSplitted[i]] = val;
        }
        //level colors
        if(levelSettingsObj.colors) {
            let ci = -1;
            levelSettingsObj.colors.forEach(c => {
                ci++;
                let colorData = {};
                let colorSplitted = c.split('_');
                for(let i = 0; i < colorSplitted.length; i+=2){
                    let val = colorSplitted[i+1];
                    let key = settingids.colorprops[colorSplitted[i]];
                    if(key) colorData[key] = val;
                    else colorData[colorSplitted[i]] = val;
                }
                if(settingids.colorchannels[colorData.channel]) colorData.channelInfo = settingids.colorchannels[colorData.channel];
                levelSettingsObj.colors[ci] = colorData;
            });
            levelSettingsObj.colors = levelSettingsObj.colors.slice(0, -1);
        }else {
            //old color system
            levelSettingsObj.colors = [];
            let colorz = {};
            Object.keys(levelSettingsObj).forEach(k => {
                let v = levelSettingsObj[k];
                if(Object.values(settingids.colorchannels).includes(k.slice(0, -1))) {
                    let k2 = Object.keys(settingids.colorchannels)[Object.values(settingids.colorchannels).indexOf(k.slice(0, -1))];
                    if(!colorz[k.slice(0, -1)]) colorz[k.slice(0, -1)] = {};
                    colorz[k.slice(0, -1)][k.slice(-1)] = v;
                    if(k2) colorz[k.slice(0, -1)].channel = k2;
                }
            });
            levelSettingsObj.colors = Object.values(colorz);
        }
        return { info: levelSettingsObj, data: levelObjects }
    },
    object2code: (obj) => {
        let levelCode = "";
        //info to code
        Object.keys(obj.info).forEach(k => {
            let v = obj.info[k];
            if(k == "colors"){
                let newv = "";
                v.forEach(c => {
                    let ck = {};
                    Object.keys(c).forEach(cp => {
                        if(cp == "channelInfo") return;
                        let cpv = c[cp];
                        let cpk = cp;
                        if(settingids.colorprops.indexOf(cp) >= 0) cpk = settingids.colorprops.indexOf(cp);
                        ck[cpk] = cpv;
                    });
                    Object.keys(ck).forEach(cbj => newv += `${cbj}_${ck[cbj]}_`);
                    newv = newv.slice(0, -1);
                    newv += '|';
                });
                v = newv;
            }
            let kk = k;
            if(Object.values(settingids).includes(k)) kk = Object.keys(settingids)[Object.values(settingids).indexOf(k)];
            levelCode += `${kk},${v},`;
        });
        levelCode = levelCode.slice(0, -1) + ';';
        //data to code
        obj.data.forEach(o => {
            let customKeys = ['info', 'type'];
            Object.keys(o).forEach(ok => {
                if(customKeys.includes(ok)) return;
                let ov = o[ok];
                if(ok == 'groups') ov = ov.join('.');
                if(ok == 'text') ov = btoa(ov);
                if(propids.indexOf(ok) >= 0) ok = propids.indexOf(ok);
                levelCode += `${ok},${ov},`;
            });
            levelCode = levelCode.slice(0, -1) + ';';
        });
        return levelCode;
    }
}