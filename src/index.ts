import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
    ABCWidgetFactory, DocumentRegistry
} from '@jupyterlab/docregistry';

import {
    PromiseDelegate
} from '@phosphor/coreutils';

import {
    Widget
} from '@phosphor/widgets';

import '../style/index.css';


export
class NengoViewer extends Widget implements DocumentRegistry.IReadyWidget {
    constructor(options: NengoViewer.IOptions) {
        super();

        let context = this._context = options.context;

        let iframe = document.createElement('iframe');
        iframe.src = 'http://localhost:8080/?filename=' + context.path;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allowFullscreen = true;
        this.node.appendChild(iframe);

        this.title.iconClass = 'nengo-icon';
        this.title.label = context.path;

        this._ready.resolve(undefined);
    }

    get ready() {
        return this._ready.promise;
    }

    private _context: DocumentRegistry.Context;
    private _ready = new PromiseDelegate<void>();
}


export
namespace NengoViewer {
    export
    interface IOptions {
        context: DocumentRegistry.Context;
    }
}


export
class NengoViewerFactory extends ABCWidgetFactory<
        NengoViewer, DocumentRegistry.IModel> {
    protected createNewWidget(context: DocumentRegistry.Context): NengoViewer {
        console.log(context)
        return new NengoViewer({ context });
    }
}


/**
 * Initialization data for the jupyterlab_nengo extension.
 */
const extension: JupyterLabPlugin<void> = {
    id: 'jupyterlab_nengo',
    autoStart: true,
    activate: (app: JupyterLab) => {
        const factory = new NengoViewerFactory({
            name: 'Nengo',
            fileTypes: ['python'],
        });
        app.docRegistry.addWidgetFactory(factory);
        console.log('JupyterLab extension jupyterlab_nengo is activated!');
    }
};

export default extension;
