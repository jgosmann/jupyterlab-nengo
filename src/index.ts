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

        this.title.iconClass = 'nengo-icon';
        this.title.label = context.path;

        let ready = this._ready;
        let iframe = document.createElement('iframe');
        this.node.appendChild(iframe);

        fetch('/nengo/start_gui').then(response => {
            return response.json();
        }).then(data => {
            iframe.src = '/nengo/' + data.port + '/?filename=' + 
                encodeURIComponent(context.path) +
                '&token=' + data.token;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.frameBorder = '0';
            iframe.allowFullscreen = true;
            ready.resolve(undefined);
        });
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
