# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

{
    'name': 'Knowledge Hisa Files',
    'summary': 'Centralize, manage, share and grow your knowledge library',
    'description': 'Centralize, manage, share and grow your knowledge library',
    'category': 'Productivity/Knowledge',
    'version': '16.0.0.0.0',
    'depends': [
        'knowledge',
        'web_editor',
        'web',
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/cron.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'OEEL-1',
    'assets': {
        'web_editor.assets_wysiwyg': [
            'knowledge_hisa_files/static/src/js/wysiwyg.js',
            'knowledge_hisa_files/static/src/js/link_dialog.js',
            'knowledge_hisa_files/static/src/js/widgets.js',
        ],
        'web.assets_backend': [
            'knowledge_hisa_files/static/src/xml/wysiwyg.xml',
        ],
    },
}
