import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
    IChangedArgs
} from '@jupyterlab/coreutils';

import {
    DocumentManager
} from '@jupyterlab/docmanager';

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
        let docManager = this._docManager = options.docManager;
        this._path = context.path;

        this.title.iconClass = 'nengo-icon';
        this.title.label = context.path;

        let ready = this._ready;
        let iframe = this._iframe = document.createElement('iframe');
        this.node.appendChild(iframe);

        iframe.onload = () => {
            if (!iframe.contentWindow.hasOwnProperty('Nengo')) {
                return;
            }

            console.log('load');

            let ace = this._ace = (iframe.contentWindow as any).Nengo.ace;

            // Handle editor synchronization
            ace.editor.on('input', (e: any) => {
                if (ace.editor.getValue() != context.model.value.text) {
                    context.model.value.text = ace.editor.getValue();
                }
            });

            context.model.contentChanged.connect(
                this.onModelContentChanged, this);

            // Handle synchronization of save state
            iframe.contentDocument.getElementById('Save_file').addEventListener(
                'click', () => {
                    if (context.model.dirty) {
                        context.model.dirty = false;
                        context.save();
                    }
                }
            );

            context.model.stateChanged.connect(this.onModelStateChanged, this);

            // Handle synchronization of renames
            this._mutationObserver = new MutationObserver(
                (mutations: Array<MutationRecord>) => {
                    for (let mutation of mutations) {
                        if (mutation.type == 'childList') {
                            this._path = mutation.addedNodes[0].textContent;
                            docManager.overwrite(
                                mutation.removedNodes[0].textContent,
                                this._path);
                        }
                    }
                }
            );
            this._mutationObserver.observe(
                iframe.contentDocument.getElementById('filename'),
                { childList: true });
            context.pathChanged.connect(this.onPathChanged, this);
        };

        fetch('/nengo/start_gui').then(response => {
            return response.json();
        }).then(data => {
            this._port = data.port;
            this._token = data.token;

            iframe.src = this.url(context.path);
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

    public url(path: string) {
        return ('/nengo/' + this._port + '/?filename=' + 
            encodeURIComponent(path) + '&token=' + this._token);
    }

    public dispose() {
        super.dispose();
        this._context.model.contentChanged.disconnect(
            this.onModelContentChanged, this);
        this._context.model.stateChanged.disconnect(
            this.onModelStateChanged, this);
        this._context.pathChanged.disconnect(this.onPathChanged, this);
        this._mutationObserver.disconnect();
        this._iframe = undefined;
        this._ace = undefined;
    }

    protected onModelContentChanged(model: DocumentRegistry.ICodeModel) {
        if (model.value.text != this._ace.editor.getValue()) {
            this._ace.editor.setValue(model.value.text, 1);
        }
    }

    protected onModelStateChanged(
            model: DocumentRegistry.ICodeModel,
            changed: IChangedArgs<DocumentRegistry.ICodeModel>) {
        if (changed.name == 'dirty') {
            if (changed.newValue) {
                this._ace.enable_save();
            } else {
                this._ace.disable_save();
            }
        }
    }

    protected onPathChanged(
            context: DocumentRegistry.Context,
            path: string) {
        this._docManager.rename(this._path + '.cfg', path + '.cfg');
        this._path = path;
        this._iframe.src = this.url(path);
        this.title.label = path;
    }

    private _context: DocumentRegistry.Context;
    private _docManager: DocumentManager;
    private _ready = new PromiseDelegate<void>();

    private _iframe: HTMLIFrameElement;
    private _ace: any;
    private _path: string;

    private _mutationObserver: MutationObserver;

    private _port: number;
    private _token: string;
}


export
namespace NengoViewer {
    export
    interface IOptions {
        context: DocumentRegistry.IContext<DocumentRegistry.ICodeModel>;
        docManager: DocumentManager;
    }
}


export
class NengoViewerFactory
extends ABCWidgetFactory<NengoViewer, DocumentRegistry.ICodeModel> {
    constructor(options: NengoViewerFactory.IOptions) {
        super(options);

        this._docManager = options.docManager;
    }

    protected createNewWidget(
        context: DocumentRegistry.IContext<
            DocumentRegistry.ICodeModel>): NengoViewer {
        return new NengoViewer({ context, docManager: this._docManager });
    }

    private _docManager: DocumentManager;
}


export
namespace NengoViewerFactory {
    export
    interface IOptions extends DocumentRegistry.IWidgetFactoryOptions {
        docManager: DocumentManager;
    }
}


/**
 * Initialization data for the jupyterlab_nengo extension.
 */
const extension: JupyterLabPlugin<void> = {
    id: 'jupyterlab_nengo',
    autoStart: true,
    activate: (app: JupyterLab) => {
        let opener = {open: (widget: Widget) => { }};
        let docManager = new DocumentManager({
            registry: app.docRegistry,
            manager: app.serviceManager,
            opener
        });

        const factory = new NengoViewerFactory({
            name: 'Nengo',
            fileTypes: ['python'],
            docManager
        });

        app.docRegistry.addWidgetFactory(factory);
        console.log('JupyterLab extension jupyterlab_nengo is activated!');
    }
};

export default extension;
