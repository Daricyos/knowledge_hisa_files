odoo.define('wysiwyg.widgets.LinkDialogHisa', function (require) {
'use strict';

const Dialog = require('wysiwyg.widgets.Dialog');
const Link = require('wysiwyg.widgets.Link');
const rpc = require('web.rpc');


// This widget is there only to extend Link and be instantiated by LinkDialog.
const _DialogLinkWidget = Link.extend({
    template: 'wysiwyg.widgets.link.hisa',
    events: _.extend({}, Link.prototype.events || {}, {
        'change [name="link_style_color"]': '_onTypeChange',
    }),

    /**
     * @override
     */
    start: function () {
        console.log('hisa starts')
        this.buttonOptsCollapseEl = this.el.querySelector('#o_link_dialog_button_opts_collapse');
        this.$styleInputs = this.$('input.link-style');
        this.$styleInputs.prop('checked', false).filter('[value=""]').prop('checked', true);
        if (this.data.isNewWindow) {
            this.$('we-button.o_we_checkbox_wrapper').toggleClass('active', true);
        }
        this._request_hisa_files()
        return this._super.apply(this, arguments);
    },

    _request_hisa_files: async function() {
        var self = this;
        var result = await rpc.query({
          route: '/knowledge_hisa_files/get_hisa_files',
          params: {},
        });
        var data_list = this.$el.find('#brow')
        result.forEach( function(element) {
            data_list.append($('<option></option>').val(element['title']).html(element['objectUrl']));
        });
        this.$el.find("input[name=label]").on('change',function(){
            var $input = $(this).val()
            var $url = self.$el.find("input[name=url]")
            result.forEach( function(element) {
                if ($input == element['title']) {
                    $url.val(element['objectUrl'])
                }
            });
        });
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    save: function () {
        var data = this._getDataHisa();

        if (data === null) {
            var $url = this.$('input[name="url"]');
            $url.closest('.o_url_input').addClass('o_has_error').find('.form-control, .form-select').addClass('is-invalid');
            $url.focus();
            return Promise.reject();
        }
        this.data.content = data.content;
        this.data.url = data.url;
        var allWhitespace = /\s+/gi;
        var allStartAndEndSpace = /^\s+|\s+$/gi;
        var allBtnTypes = /(^|[ ])(btn-secondary|btn-success|btn-primary|btn-info|btn-warning|btn-danger)([ ]|$)/gi;
        this.data.classes = data.classes.replace(allWhitespace, ' ').replace(allStartAndEndSpace, '');
        if (data.classes.replace(allBtnTypes, ' ')) {
            this.data.style = {
                'background-color': '',
                'color': '',
            };
        }
        this.data.isNewWindow = data.isNewWindow;
        this.final_data = this.data;
        return Promise.resolve();
    },


    _getDataHisa: function () {
        var $url = this.$('input[name="url"]');
        var url = $url.val();
        var content = this.$('input[name="label"]').val() || url;

        if (!this.isButton && $url.prop('required') && (!url || !$url[0].checkValidity())) {
            return null;
        }

        const type = this._getLinkType();
        const customTextColor = this._getLinkCustomTextColor();
        const customFill = this._getLinkCustomFill();
        const customBorder = this._getLinkCustomBorder();
        const customBorderWidth = this._getLinkCustomBorderWidth();
        const customBorderStyle = this._getLinkCustomBorderStyle();
        const customClasses = this._getLinkCustomClasses();
        const size = this._getLinkSize();
        const shape = this._getLinkShape();
        const shapes = shape ? shape.split(',') : [];
        const style = ['outline', 'fill'].includes(shapes[0]) ? `${shapes[0]}-` : '';
        const shapeClasses = shapes.slice(style ? 1 : 0).join(' ');
        const classes = (this.data.className || '') +
            (type ? (` btn btn-${style}${type}`) : '') +
            (type === 'custom' ? customClasses : '') +
            (type && shapeClasses ? (` ${shapeClasses}`) : '') +
            (type && size ? (' btn-' + size) : '');
        var isNewWindow = this._isNewWindow(url);
        var doStripDomain = this._doStripDomain();
        if (
            url.indexOf('@') >= 0 && url.indexOf('mailto:') < 0 && !url.match(/^http[s]?/i) ||
            this._link && this._link.href.includes('mailto:') && !url.includes('mailto:')
        ) {
            url = ('mailto:' + url);
        } else if (url.indexOf(location.origin) === 0 && doStripDomain) {
            url = url.slice(location.origin.length);
        }
        var allWhitespace = /\s+/gi;
        var allStartAndEndSpace = /^\s+|\s+$/gi;

        console.log({
            content: content,
            url: this._correctLink(url),
            classes: classes.replace(allWhitespace, ' ').replace(allStartAndEndSpace, ''),
            customTextColor: customTextColor,
            customFill: customFill,
            customBorder: customBorder,
            customBorderWidth: customBorderWidth,
            customBorderStyle: customBorderStyle,
            oldAttributes: this.data.oldAttributes,
            isNewWindow: isNewWindow,
            doStripDomain: doStripDomain,
        })

        return {
            content: content,
            url: this._correctLink(url),
            classes: classes.replace(allWhitespace, ' ').replace(allStartAndEndSpace, ''),
            customTextColor: customTextColor,
            customFill: customFill,
            customBorder: customBorder,
            customBorderWidth: customBorderWidth,
            customBorderStyle: customBorderStyle,
            oldAttributes: this.data.oldAttributes,
            isNewWindow: isNewWindow,
            doStripDomain: doStripDomain,
        };
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _adaptPreview: function () {
        var data = this._getData();
        if (data === null) {
            return;
        }
        const attrs = {
            target: '_blank',
            href: data.url && data.url.length ? data.url : '#',
            class: `${data.classes.replace(/float-\w+/, '')} o_btn_preview`,
        };

        const $linkPreview = this.$("#link-preview");
        $linkPreview.attr(attrs);
        this._updateLinkContent($linkPreview, data, { force: true });
    },
    /**
     * @override
     */
    _doStripDomain: function () {
        return this.$('#o_link_dialog_url_strip_domain').prop('checked');
    },
    /**
     * @override
     */
    _getIsNewWindowFormRow() {
        return this.$('input[name="is_new_window"]').closest('.row');
    },
    /**
     * @override
     */
    _getLinkOptions: function () {
        const options = [
            'input[name="link_style_color"]',
            'select[name="link_style_size"] > option',
            'select[name="link_style_shape"] > option',
        ];
        return this.$(options.join(','));
    },
    /**
     * @override
     */
    _getLinkShape: function () {
        return this.$('select[name="link_style_shape"]').val() || '';
    },
    /**
     * @override
     */
    _getLinkSize: function () {
        return this.$('select[name="link_style_size"]').val() || '';
    },
    /**
     * @override
     */
    _getLinkType: function () {
        return this.$('input[name="link_style_color"]:checked').val() || '';
    },
    /**
     * @private
     */
    _isFromAnotherHostName: function (url) {
        if (url.includes(window.location.hostname)) {
            return false;
        }
        try {
            const Url = URL || window.URL || window.webkitURL;
            const urlObj = url.startsWith('/') ? new Url(url, window.location.origin) : new Url(url);
            return (urlObj.origin !== window.location.origin);
        } catch (_ignored) {
            return true;
        }
    },
    /**
     * @override
     */
    _isNewWindow: function (url) {
        if (this.options.forceNewWindow) {
            return this._isFromAnotherHostName(url);
        } else {
            return this.$('input[name="is_new_window"]').prop('checked');
        }
    },
    /**
     * @override
     */
    _setSelectOption: function ($option, active) {
        if ($option.is("input")) {
            $option.prop("checked", active);
        } else if (active) {
            $option.parent().find('option').removeAttr('selected').removeProp('selected');
            $option.parent().val($option.val());
            $option.attr('selected', 'selected').prop('selected', 'selected');
        }
    },
    /**
     * @override
     */
    _updateOptionsUI: function () {
        const el = this.el.querySelector('[name="link_style_color"]:checked');
        $(this.buttonOptsCollapseEl).collapse(el && el.value ? 'show' : 'hide');
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _onTypeChange() {
        this._updateOptionsUI();
    },
    /**
     * @override
     */
    _onURLInput: function () {
        this._super(...arguments);
        this.$('#o_link_dialog_url_input').closest('.o_url_input').removeClass('o_has_error').find('.form-control, .form-select').removeClass('is-invalid');
        this._adaptPreview();
    },
});

/**
 * Allows to customize link content and style.
 */
const LinkDialogHisa = Dialog.extend({
    init: function (parent, ...args) {
        this._super(...arguments);
        this.linkWidget = this.getLinkWidget(...args);
    },
    start: async function () {
        const res = await this._super(...arguments);
        await this.linkWidget.appendTo(this.$el);
        return res;
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Returns an instance of the widget that will be attached to the body of the
     * link dialog. One may overwrite this function and return an instance of
     * another widget to change the default logic.
     * @param {...any} args
     */
    getLinkWidget: function (...args) {
        return new _DialogLinkWidget(this, ...args);
    },

    /**
     * @override
     */
    save: function () {
        const _super = this._super.bind(this);
        const saveArguments = arguments;
        return this.linkWidget.save().then(() => {
            this.final_data = this.linkWidget.final_data;
            return _super(...saveArguments);
        });
    },
});

return LinkDialogHisa;
});
