import logging
import requests

from odoo import models, fields, api

_logger = logging.getLogger()


class HisaFileLink(models.Model):
    _name = 'ks.hisa.file.link'
    _description = 'Ks Hisa File Link'

    name = fields.Char()

    link = fields.Char()

    @api.model
    def _update_file_list(self):
        response = requests.get(
            'https://hisa-resources-public.hisausapps.org/api/resource/all')
        all_exists = self.search([])
        all_exists.unlink()
        for item in response.json():
            self.create({
                'name': item['title'],
                'link': item['objectUrl'],
            })
