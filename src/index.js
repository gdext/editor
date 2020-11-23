//imports
import app from './scripts/app';
import appelems from './scripts/appelements';
import './styles/general.css';
import './styles/app.css';
import './styles/ui.css';

window.onload = () => {
    app.createApp();
    appelems.generateNavbar(document.getElementById('appNavbar'));
    appelems.generateBottom(document.getElementById('appBottom'));
    appelems.generateMain(document.getElementById('appMain'));
}
