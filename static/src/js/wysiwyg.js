/** @odoo-module **/

import { ComponentWrapper } from 'web.OwlCompatibility';
import { qweb as QWeb, _t } from 'web.core';
const OdooEditorLib = require('@web_editor/js/editor/odoo-editor/src/OdooEditor');
const Link = require('wysiwyg.widgets.Link');
const weWidgets = require('wysiwyg.widgets');
import Wysiwyg from 'web_editor.wysiwyg';

const getInSelection = OdooEditorLib.getInSelection;
const getDeepRange = OdooEditorLib.getDeepRange;
const setSelection = OdooEditorLib.setSelection;


Wysiwyg.include({
    /**
     * @override
     * @returns {Array[Object]}
     */
    _getPowerboxOptions: function () {
        const options = this._super();
        const {commands, categories} = options;
        if (this.options.knowledgeCommands) {
            commands.push({
                category: _t('Knowledge'),
                name: _t('Hisa File Links'),
                priority: 20,
                description: _t('Add Hisa File Link'),
                fontawesome: 'fa-link',
                isDisabled: () => this._filterCommandInBehavior() || this._filterCommandInTable(),
                callback: () => {
                    this.toggleLinkToolsHisa({forceDialog: true});
                }
            },
            );
        }
        return {...options, commands, categories};
    },

    toggleLinkToolsHisa(options = {}) {
        const linkEl = getInSelection(this.odooEditor.document, 'a');
        if (linkEl && (!linkEl.matches(this.customizableLinksSelector) || !linkEl.isContentEditable)) {
            return;
        }
        if (this.snippetsMenu && !options.forceDialog) {
            if (options.link && options.link.querySelector(mediaSelector) &&
                    !options.link.textContent.trim() && wysiwygUtils.isImg(this.lastElement)) {
                // If the link contains a media without text, the link is
                // editable in the media options instead.
                this.snippetsMenu._mutex.exec(() => {
                    // Wait for the editor panel to be fully updated.
                    core.bus.trigger('activate_image_link_tool');
                });
                return;
            }
            if (options.forceOpen || !this.linkTools) {
                const $btn = this.toolbar.$el.find('#create-link');
                if (!this.linkTools || ![options.link, ...wysiwygUtils.ancestors(options.link)].includes(this.linkTools.$link[0])) {
                    const { link } = Link.getOrCreateLink({
                        containerNode: this.odooEditor.editable,
                        startNode: options.link || this.lastMediaClicked,
                    });
                    if (!link) {
                        return
                    }
                    const linkToolsData = Object.assign({}, this.options.defaultDataForLinkTools);
                    this.linkTools = new weWidgets.LinkTools(this, {wysiwyg: this, noFocusUrl: options.noFocusUrl}, this.odooEditor.editable, linkToolsData, $btn, link );
                }
                this.linkTools.noFocusUrl = options.noFocusUrl;
                const _onClick = ev => {
                    if (
                        !ev.target.closest('#create-link') &&
                        (!ev.target.closest('.oe-toolbar') || !ev.target.closest('we-customizeblock-option')) &&
                        !ev.target.closest('.ui-autocomplete') &&
                        (!this.linkTools || ![ev.target, ...wysiwygUtils.ancestors(ev.target)].includes(this.linkTools.$link[0]))
                    ) {
                        // Destroy the link tools on click anywhere outside the
                        // toolbar if the target is the orgiginal target not in the original target.
                        this.destroyLinkTools();
                        this.odooEditor.document.removeEventListener('click', _onClick, true);
                        document.removeEventListener('click', _onClick, true);
                    }
                };
                this.odooEditor.document.addEventListener('click', _onClick, true);
                document.addEventListener('click', _onClick, true);
                if (!this.linkTools.$el) {
                    this.linkTools.appendTo(this.toolbar.$el);
                }
            } else {
                this.destroyLinkTools();
            }
        } else {
            const historyStepIndex = this.odooEditor.historySize() - 1;
            this.odooEditor.historyPauseSteps();
            let { link } = Link.getOrCreateLink({
                containerNode: this.odooEditor.editable,
                startNode: options.link,
            });
            if (!link) {
                return
            }
            const linkDialogHisa = new weWidgets.LinkDialogHisa(this, {
                forceNewWindow: this.options.linkForceNewWindow,
                wysiwyg: this,
            }, this.$editable[0], {
                needLabel: true
            }, undefined, link);
            linkDialogHisa.open();
            linkDialogHisa.on('save', this, data => {
                if (!data) {
                    return;
                }
                const linkWidget = linkDialogHisa.linkWidget;
//                console.log(this.$editable[0])
//                console.log(data.range)
                getDeepRange(this.$editable[0], {range: data.range, select: true});
                if (this.options.userGeneratedContent) {
                    data.rel = 'ugc';
                }
                linkWidget.applyLinkToDom(data);
                this.odooEditor.historyUnpauseSteps();
                this.odooEditor.historyStep();
                link = linkWidget.$link[0];
                this.odooEditor.setContenteditableLink(linkWidget.$link[0]);
                setSelection(link, 0, link, link.childNodes.length, false);
                // Focus the link after the dialog element is removed because
                // if the dialog element is still in the DOM at the time of
                // doing link.focus(), because there is the attribute tabindex
                // on the dialog element, the focus cannot occur.
                // Using a microtask to set the focus is hackish and might break
                // if another microtask which focuses an element in the dom
                // occurs at the same time (but this case seems unlikely).
                Promise.resolve().then(() => link.focus());
            });
            linkDialogHisa.on('closed', this, function () {
                this.odooEditor.historyUnpauseSteps();
                // If the linkDialog content has been saved
                // the previous selection in not relevant anymore.
                if (linkDialogHisa.destroyAction !== 'save') {
                    // Restore the selection after the dialog element isremoved
                    // because if the dialog element is still in the DOM at the
                    // time of doing restoreSelection(), it will trigger a new
                    // selection change which will undo this one. Using a
                    // microtask to set the focus is hackish and might break if
                    // another microtask which changes the selection in the dom
                    // occurs at the same time (but this case seems unlikely).
                    Promise.resolve().then(() => this.odooEditor.historyRevertUntil(historyStepIndex));
                }
            });
        }
    },

});
