//imports
import app from './scripts/app';
import appelems from './scripts/appelements';
import decodesave from './scripts/decodesave';
import './styles/general.css';
import './styles/app.css';
import './styles/ui.css';

window.onload = () => {
    app.createApp();
    appelems.generateNavbar(document.getElementById('appNavbar'));
    appelems.generateBottom(document.getElementById('appBottom'));

    //TODO: remove this part
    let code = localStorage.getItem('code') ? localStorage.getItem('code') : prompt('Enter Level Code');
    localStorage.setItem('code', code);
    let decode = decodesave.decode(code);
    console.log(decode, decodesave.xml2object(decode));
    console.log(decodesave.object2xml(decodesave.xml2object(decode)));
}
