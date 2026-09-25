import '@backstage/cli/asset-types';
import ReactDOM from 'react-dom/client';
// Les deux polices de la charte, servies par le portail lui-meme depuis leurs
// paquets, a version figee: aucun appel a un service de polices exterieur,
// le portail s affiche pareil sur n importe quel serveur, meme ferme.
import '@fontsource-variable/manrope';
import '@fontsource-variable/space-grotesk';
import '@backstage/ui/css/styles.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(App.createRoot());
