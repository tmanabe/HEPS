#!/usr/bin/env python
# coding: utf-8


from glob import glob
import subprocess
from subprocess import PIPE
import unittest


class TestHEPS(unittest.TestCase):
    pass


for html_path in glob(r'*.html'):
    def f(html_path):
        def g(self):
            cmd = ' '.join(['phantomjs',
                            'test_.js',
                            '../HEPS.user.js',
                            html_path])
            cp = subprocess.run(cmd, stdout=PIPE, stderr=PIPE)
            self.assertEqual(b'', cp.stdout)
            self.assertEqual(b'', cp.stderr)
        return g
    setattr(TestHEPS,
            'test_%s' % html_path.rsplit('.', 1)[0],
            f(html_path))
