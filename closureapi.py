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

import httplib, urllib, sys
import StringIO
import getopt

WHITESPACE_ONLY = 'WHITESPACE_ONLY'
SIMPLE_OPTIMIZATIONS = 'SIMPLE_OPTIMIZATIONS'
ADVANCED_OPTIMIZATIONS = 'ADVANCED_OPTIMIZATIONS'
COMPILATION_LEVELS = [WHITESPACE_ONLY, SIMPLE_OPTIMIZATIONS, ADVANCED_OPTIMIZATIONS]

OUT_FILE = 'compressed.js'
DEFAULT_LEVEL = 1

def string_compress(js_string, level=SIMPLE_OPTIMIZATIONS):
    """
    compresses a string of js with the closure compiler web service
    
    returns a compressed string of js
    
    Modified code from:
    http://code.google.com/closure/compiler/docs/api-tutorial1.html
    """
    
    params = urllib.urlencode([
        ('js_code', js_string),
        ('compilation_level', level),
        ('output_format', 'text'),
        ('output_info', 'compiled_code'),
    ])
    
    # Always use the following value for the Content-type header.
    headers = { "Content-type": "application/x-www-form-urlencoded" }
    conn = httplib.HTTPConnection('closure-compiler.appspot.com')
    conn.request('POST', '/compile', params, headers)
    response = conn.getresponse()
    data = response.read()
    conn.close
    
    l_orig, l_new = len(js_string), len(data)
    perc = float(l_new)/float(l_orig) * 100.0
    print 'Compressed %d to %d : %.2f%% of original size' % (l_orig, l_new, perc)
    
    return data

def concat(filenames):
    s = StringIO.StringIO()
    for file in filenames:
        f = open(file, 'r')
        s.write(f.read())
        f.close()
    return s.getvalue()

def compress(out_file, input_fnames, level=DEFAULT_LEVEL):
    out_file = out_file or OUT_FILE
    level = level or DEFAULT_LEVEL
    
    compressed = string_compress(concat(input_fnames), COMPILATION_LEVELS[level])
    
    out = open(out_file, 'w')
    out.write(compressed)
    out.close()
    
if __name__ == '__main__':
    opts, args = getopt.getopt(sys.argv[1:], 'ho:l:', ['help', 'output=', 'level='])
    
    out_file = None
    level = DEFAULT_LEVEL
    
    for opt, arg in opts:
        if opt in ('-h', '--help'):
            usage()
            sys.exit(2)
        elif opt in ('-o', '--output'):
            out_file = arg
        elif opt in ('-l', '--level'):
            try:
                level = int(arg)
            except TypeError: 
                usage()
                sys.exit(1)
    
    compress(out_file, args, level)
