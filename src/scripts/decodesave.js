import pako from 'pako';
import datakeys from '../assets/levelparse/datakeys.json';
const Buffer = require('buffer/').Buffer;

export default {
    decode: (data) => {
        function xor (str, key) {     
            str = String(str).split('').map(letter => letter.charCodeAt());
            let res = "";
            for (let i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);
            return res; 
        }
        if (data.startsWith('<?xml version="1.0"?>')) return data;
        let decoded = xor(data, 11);
        try { decoded = Buffer.from(decoded, 'base64') }
        catch (e) { return {error: true, reason: e} }
        try { return new TextDecoder("utf-8").decode(pako.ungzip(decoded)) }
        catch (e) { return {error: true, reason: 'corrupt'} }
    },
    xml2object: (xml) => {
        let dataSplitted = xml.split('<d><k>kCEK').slice(1);
        let dataObj = [];
        for(let i = 0; i < dataSplitted.length; i++){
            dataSplitted[i] = dataSplitted[i].split('<k>').join('|').split('</k>').join('|').split('|').slice(1, -2);
            dataSplitted[i].unshift('kCEK');
            let dat = {};
            let enterSecondList = false;
            for(let j = 0; j < dataSplitted[i].length; j+=2){
                let k = dataSplitted[i][j];
                let v = dataSplitted[i][j+1];
                let t = v.slice(0, 2);
                v = v.slice(3, -4);
                if(t == "<i") v = parseInt(v);
                else if(t == "<r") v = parseFloat(v);
                else if(t == "<t") v = true;
                else if(t == "<d") enterSecondList = datakeys[k] || k;
                if(t != "<d" && k.startsWith('k')) enterSecondList = false;
                if(v.endsWith && v.endsWith('</s></d>')) v = v.slice(0, -8);
                if(!enterSecondList) dat[datakeys[k] || k] = v;
                else{
                    if(typeof dat[enterSecondList] != 'object') dat[enterSecondList] = {};
                    if(t != "<d") dat[enterSecondList][k] = v;
                } 
                if(datakeys[k] == "description") dat[datakeys[k]] = Buffer.from(v, 'base64').toString();
                if(datakeys[k] == "data"){
                    let datDecoded = Buffer.from(v, 'base64');
                    let datUnzip = new TextDecoder("utf-8").decode(pako.ungzip(datDecoded));
                    dat[datakeys[k]] = datUnzip;
                }
            }
            dataObj.push(dat);
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
                let v = lvl[datakeys[k]];
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
                else if(typeof v == 'boolean') vtag = `<t />`;
                xml += `<k>${k}</k>${vtag}`;
            });
            xml += '</d>';
        });
        xml += '<k>LLM_02</k><i>35</i></dict></plist>';
        return xml;
    }
}