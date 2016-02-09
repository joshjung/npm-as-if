#!/usr/bin/env node
var AsIf = require('./src/as-if');
var program = require('commander');
var path = require('path');
var semvercmp = require('semver-compare');
var _ =  require('./src/_mixin');

program
  .version('0.0.1')
  .usage('[options] <date> <shrinkwrapOrPackage>')
  .option('-f, --filter [type]', 'Filter output. \'-f=rollback\' filters only to versions that will need a rollback to be compatible with provided date. ')
  .option('-v, --verbose', 'Increase output verbosity')
  .parse(process.argv);

if (program.args.length !== 2) {
  console.error('Please provide an as if date and a shrinkwrap.json (prefixed with ./) or a package name');
  program.outputHelp();
  process.exit(1);
}

var date = new Date(program.args[0]);

var shrinkwrap = program.args[1][0] == '.' ? program.args[1] : undefined;
var package = !!shrinkwrap ? undefined : program.args[1];

var asIf = new AsIf({});

if (package) {
  asIf.findAsIf(package, date, console.log);
} else {
  asIf.shrinkwrapAsIf(path.join(__dirname, shrinkwrap), date, function (packages) {
    if (program.filter === 'rollback' || program.filter === 'r') {
      packages = _.pairs(packages);
      packages = packages.filter(function (p) {
        if (typeof p[1].shrinkwrapVersion === 'string' && typeof p[1].versionAtDate === 'string') {
          return semvercmp(p[1].shrinkwrapVersion, p[1].versionAtDate) == 1;
        }

        return false;
      });
      packages = _.object(packages);
    }
    console.log(packages);
  });
}
