import pako from 'pako';
import plist from 'plist';
import datakeys from '../assets/levelparse/datakeys.json';
import util from './util';
const Buffer = require('buffer/').Buffer;

// this file contains functions to decode the CCLocalLevels.dat file from encrypted xml
// to json and to encode it back to xml

function plist_parse(data) {
    let val = data.toString();

    val = val.replace(/<d>/g, "<dict>").replace(/<\/d>/g, "</dict>");
    val = val.replace(/<k>/g, "<key>").replace(/<\/k>/g, "</key>");
    val = val.replace(/<s>/g, "<string>").replace(/<\/s>/g, "</string>");
    val = val.replace(/<i>/g, "<integer>").replace(/<\/i>/g, "</integer>");
    val = val.replace(/<r>/g, "<real>").replace(/<\/r>/g, "</real>");
    val = val.replace(/<a>/g, "<array>").replace(/<\/a>/g, "</array>");
    val = val.replace(/t \/>/g, "true/>");
    val = val.replace(/f \/>/g, "false/>");

    return plist.parse(val);
}

function corruptAlert() {
    localStorage.setItem('settings.gdLevelsPath', '');
    if(document.querySelector('#corruptSaveDialog')) return;
    util.confirm('corruptSaveDialog', 'The Level Data is Corrupt!',
    'GDExt has reset the level data file settings to default, try Refreshing the Page.\n' + 
    'If the issue remains, contact us "Via Help > Report a Bug"', {
        buttonYes: 'OK',
        buttonNo: 'Reload GDExt',
        onConfirm: t => {
            if(t) return;
            let event = new CustomEvent('electronApi', { detail: 'reload' });
            dispatchEvent(event);
        }
    });
}

export default {
    decode: (data) => {
        let err = false;
        try {
            function xor (str, key) {     
                str = String(str).split('').map(letter => letter.charCodeAt());
                let res = "";
                for (let i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);
                return res; 
            }
            if (data.startsWith('<?xml version="1.0"?>')) return data;
            let decoded = xor(data, 11);
            try { decoded = Buffer.from(decoded, 'base64') }
            catch (e) { err = true; }
            try { return new TextDecoder("utf-8").decode(pako.ungzip(decoded)) }
            catch (e) { err = true }
        } catch (e) {
            err = true;
        }
        if(err) {
            corruptAlert();
        }
    },
    xml2object: (xml) => {
        let pl = plist_parse(xml);

        let dataObj = [];

        let lvl_id = 0;

        try {
            while (pl.LLM_01["k_" + lvl_id]) {
                let level = {};

                for (let key in pl.LLM_01["k_" + lvl_id]) {
                    if (Object.prototype.hasOwnProperty.call(pl.LLM_01["k_" + lvl_id], key)) {
                        let value = pl.LLM_01["k_" + lvl_id][key];

                        if (datakeys[key]) {
                            if (datakeys[key] == "description")
                                level[datakeys[key]] = Buffer.from(value, "base64").toString();
                            else if (datakeys[key] == "data"){
                                let datDecoded = Buffer.from(value, 'base64');
                                let datUnzip = new TextDecoder("utf-8").decode(pako.ungzip(datDecoded));
                                level[datakeys[key]]  = datUnzip;
                            }
                            else
                                level[datakeys[key]] = value;
                        } else {
                            level[key] = value;
                        }
                    }
                }

                dataObj.push(level);
                
                lvl_id++;
            }
        } catch (e) {
            corruptAlert();
        }

        return dataObj;
    },
    object2xml: (obj) => {
        if(!Array.isArray(obj)) return {error: true, reason: 'notArray'};
        let xml = '<?xml version="1.0"?><plist version="1.0" gjver="2.0"><dict><k>LLM_01</k><d><k>_isArr</k><t />';
        let li = -1;
        obj.forEach(lvl => {
            li++;
            xml += `<k>k_${li}</k><d>`;
            let keys = Object.keys(lvl).map(key => Object.values(datakeys).includes(key) ? Object.keys(datakeys)[Object.values(datakeys).indexOf(key)] : key);
            keys.forEach(k => {
                let v = lvl[datakeys[k]] || lvl[k];
                if(k == 'k3') {
                    try { v = Buffer.from(v, 'utf-8').toString('base64').split('+').join('-').split('/').join('_') }
                    catch { return {error: true, reason: 'cannotDecodeLevelDescription'} } 
                } else if(k == 'k4') {
                    try { v = Buffer.from(pako.gzip(v)).toString('base64').split('+').join('-').split('/').join('_') }
                    catch { return {error: true, reason: 'cannotDecodeLevelData'} } 
                }
                let vtag = `<s>${v}</s>`;
                if(typeof v == 'number' && Math.round(v) == v) vtag = `<i>${v}</i>`;
                else if(typeof v == 'number') vtag = `<r>${v}</r>`;
                else if(typeof v == 'boolean') vtag = `<${v ? 't' : 'f'} />`;
                else if(typeof v == 'object') {
                    let vd = '';
                    Object.keys(v).forEach(vk => {
                        vd += `<k>${vk}</k><s>${v[vk]}</s>`;
                    });
                    vtag = `<d>${vd}</d>`;
                }
                xml += `<k>${k}</k>${vtag}`;
            });
            xml += '</d>';
        });
        xml += '</d><k>LLM_02</k><i>35</i></dict></plist>';
        return xml;
    }
}
