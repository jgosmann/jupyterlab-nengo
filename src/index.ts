import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import '../style/index.css';


/**
 * Initialization data for the jupyterlab_nengo extension.
 */
const extension: JupyterLabPlugin<void> = {
  id: 'jupyterlab_nengo',
  autoStart: true,
  activate: (app: JupyterLab) => {
    console.log('JupyterLab extension jupyterlab_nengo is activated!');
  }
};

export default extension;
