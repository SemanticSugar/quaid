"""
MIT License

Copyright (c) 2010, Ben Ogle

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""

import os, sys, closureapi
import getopt

OUT_FILE = 'build/jquery.quaid.min'

#this sucks. apologies.
JSDOC = '../../jsdoc/'

JSDOC_COMMAND = 'java -jar %(jsd)sjsrun.jar %(jsd)sapp/run.js -d=doc/ -t=%(jsd)stemplates/codeview src/' % {'jsd':JSDOC}

MODULES = [
    'core',
    'log',
    'util',
    'validation',
    'widget',
    'form',
    #'simpleconsole',
]

curdir = os.path.dirname(__file__)
def filename(module, folder=None):
    dirs = [curdir]
    if folder: dirs.append(folder)
    dirs.append('%s.js' % module)
    return os.path.join(*dirs)

def compress(modules, version=None):
    """
    Will compress the modules into a single file.
    """
    out = OUT_FILE
    if version:
        out = '%s.%s' % (out, version)
    out = filename(out)
    
    fnames = [filename(m, 'src') for m in modules]
    closureapi.compress(out, fnames, level=1)
    
    print 'Compressed to %s' % out

def gen_docs():
    """
    Generate the jsdoc.
    """
    import subprocess, shlex
    print 'Generating docs...'
    p = subprocess.Popen(shlex.split(JSDOC_COMMAND))
    p.wait()

def usage():
    print '%s [options] [modules]' % (sys.argv[0],)
    print 'Options:'
    print '    -h            -- This'
    print '    -v <version>  -- The version of the compressed js file'
    print '    -d            -- Generate docs'
    print 'Modules:'
    print '    core log util form widget validation'

if __name__ == '__main__':
    """ Meow """
    try:
        opts, args = getopt.getopt(sys.argv[1:], "hv:d", ["help", "version=", "docs"])
    except getopt.GetoptError, err:
        # print help information and exit:
        print str(err) # will print something like "option -a not recognized"
        usage()
        sys.exit(2)
    
    version = None
    docs = False
    for o, a in opts:
        if o in ("-h", "--help"):
            usage()
            sys.exit()
        elif o in ("-v", "--version"):
            version = a
        elif o in ("-d", "--docs"):
            docs = True
        else:
            assert False, "unhandled option"

    modules = None
    if args:
        modules = [m for m in args if m in MODULES]
    
    if not modules:
        modules = MODULES
    
    compress(modules, version)
    
    if docs:
        gen_docs()
    
    

