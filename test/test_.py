#!/usr/bin/env python
# coding: utf-8


from glob import glob
from os import path
import subprocess
from subprocess import PIPE
from unittest import TestCase


class TestHEPS(TestCase):
    pass


dir = path.dirname(path.abspath(__file__))
for html_path in glob(path.join(dir, '*.html')):
    def f(html_path):
        def g(self):
            cmd = [
                'phantomjs',
                path.join(dir, 'test_.js'),
                path.join(dir, '..', 'HEPS.user.js'),
                'file:///' + html_path
            ]
            cp = subprocess.run(cmd, shell=True, stdout=PIPE, stderr=PIPE)
            self.assertEqual(b'', cp.stdout)
            self.assertEqual(b'', cp.stderr)
        return g
    setattr(TestHEPS,
            'test_%s' % html_path.rsplit(path.sep, 1)[-1].rsplit('.', 1)[0],
            f(html_path))
