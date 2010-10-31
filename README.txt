Hi. Quaid is a simple library on top of jQuery with the goal of speeding up your developmnent
time. Quaid doesnt want you to write the same basic stuff you need at the beginning of each
project anymore. Quaid wants you to slam out clean, consistent, modular plugins without
frustration or cruft. Quaid knows you constantly forget how to connect the jquery.form
plugin with the jquery.validate plugin, and that you want consistent logging functionality,
so Quaid provides it. Quaid understands that it's hard to deal with client-side validation
and server-side validation in the same form, so Quaid does that too (elegantly, of course).
Quaid is tired of you littering your HTML templates with loading image tags, then continually
repeating the same css and js to deal with said loading image, so Quaid has a whole module for
robustly handling loading.

Quaid is here to help. Promise. It's even in the name. Quaid loosely stands for j(QU)ery (AID).

At the time of writing, Quaid is 17k compressed.

You're looking at the code repo. Here's what's going on:

README.txt      - This! Really!
TODO.txt        - self explain

closureapi.py   - A python module for compressing js with the google's closure webservice
build.py        - Compresses the library with closureapi.py.
                  'python build.py' will build the whole library
                  You can specify just the modules you want, though.
                  'python build.py core util log' will build just the core stuff.

build/          - Has the entire compressed library
src/            - Code!
test/           - Tests for the code


RUNNING THE TESTS

If you feel so inclined, you can run Quaid's tests. The tests use QUnit, and sadly require a
webserver that runs php. I am pretty lazy in this department so I just downloaded MAMP
(http://www.mamp.info).

Point a simlink from your server's www directory to Quaid's test directory and load
up test.html.

DOC

Proper docs are at http://benogle.com/quaid.
