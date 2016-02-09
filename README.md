# npm-as-if
npm utility that builds a package.json "as if" an arbitrary date in the past. Useful for recovery of builds that were unintentionally broken by someone else's update.

# Shrinkwrapping

This package assumes a fairly good knowledge of semver versioning and build processes in npm, including shrinkwrapping. 

For information on shrinkwrapping your `package.json`, see [here](https://docs.npmjs.com/cli/shrinkwrap).

# Individual Packages

If you want to see what version a package was at a date in the past, you can do the following:

    npm-time-lord 01-01-2015 connect
    2.27.6

Or at a specific time:

    npm-time-lord 2015-12-17T03:24:00 connect
    2.30.2

# Entire `npm-shrinkwrap.json` files 

Typical use might be something like this:

    npm-time-lord 01-01-2013 ./test/hasharray-shrinkwrap.json
    
Output by default is JSON of package names to their versions as listed in the dependencies:

    {
      "debug": {
        "shrinkwrapVersion": "1.0.4",
        "versionAtDate": "0.7.0"
      },
      "ms": {
        "shrinkwrapVersion": "0.6.2",
        "versionAtDate": "0.5.0"
      },
      "jclass": {
        "shrinkwrapVersion": "1.0.1",
        "versionAtDate": "did not exist"
      },
      "meta": {
        "runDate": "2016-02-09T19:22:23.214Z",
        "atDate": "2013-01-01T06:00:00.000Z"
      }
    }

The date we ran `npm-time-lord` was Feb 9th, 2016 and the date at which we ran against in the past was Jan 1st, 2013.

In this case, there was no version information available for `jclass` on Jan 1st, 2013.

# Filtering

If you want to filter output to only versions that would need to be changed in order to match a date in the past, you
can run a filter like so:

    npm-time-lord -f rollback 01-01-2014 ./test/hasharray-shrinkwrap.json
    
This will output only those modules that need to be rolled back to be compatible with that date, and the date that
was the latest at that time:

    {
      "debug": {
        "shrinkwrapVersion": "1.0.4",
        "versionAtDate": "0.7.4"
      },
      "jclass": {
        "shrinkwrapVersion": "1.0.1",
        "versionAtDate": "0.2.5"
      }
    }

# Under Construction

This project is under construction still and I would absolutely love help developing it.

Issues to address:

* We need to avoid calling out to `npm view` as a spawned process if we can avoid it. I attempted to use the `npmview` module but was running into bugs.
* Develop option to spit out a new npm-shrinkwrap.json at the specified date
* Ensure that outputted version information does not conflict with the semver range in the original package.json

# License

The MIT License (MIT)

Copyright (c) 2016 Joshua Jung

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

