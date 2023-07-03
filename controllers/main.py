import logging
import requests
from odoo import http

_logger = logging.getLogger(__name__)


class KnowledgeHisaFiles(http.Controller):

    @http.route('/knowledge_hisa_files/get_hisa_files', type='json', auth="public", methods=['POST'], website=True)
    def get_hisa_files(self, **kwargs):
        response = requests.get('https://hisa-resources-public.hisausapps.org/api/resource/all')
        return response.json()
