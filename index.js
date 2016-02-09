#!/usr/bin/env node
var TimeLord = require('./src/timeLord');
var program = require('commander');
var path = require('path');
var semvercmp = require('semver-compare');
var _ =  require('./src/_mixin');

program
  .version('0.0.1')
  .usage('npm-time-lord [options] <date> <shrinkwrapOrModule>')
  .option('-f, --filter [type]', 'Filter displayed modules for npm-shrinkwrap.json. \'-f=rollback\' filters only to versions that will need a rollback to be compatible with provided date. ')
  .option('-v, --verbose', 'Increase output verbosity')
  .parse(process.argv);

if (program.args.length !== 2) {
  console.error('Please provide an as if date and a shrinkwrap.json (prefixed with ./) or a module name');
  program.outputHelp();
  process.exit(1);
}

var date = new Date(program.args[0]);

var shrinkwrap = program.args[1][0] == '.' ? program.args[1] : undefined;
var module = !!shrinkwrap ? undefined : program.args[1];

var timeLord = new TimeLord({});

if (module) {
  timeLord.findModuleVersionAtDate(module, date, function (err, version) {
    console.log(version);
  });
} else {
  timeLord.findShrinkwrapFileVersionsAtDate(path.join(__dirname, shrinkwrap), date, function (modules) {
    if (program.filter === 'rollback' || program.filter === 'r') {
      modules = _.pairs(modules);
      modules = modules.filter(function (p) {
        if (p[0] === 'meta') {
          return false;
        }

        if (typeof p[1].shrinkwrapVersion === 'string' && typeof p[1].versionAtDate === 'string') {
          return semvercmp(p[1].shrinkwrapVersion, p[1].versionAtDate) == 1;
        }

        return false;
      });
      modules = _.object(modules);
    }
    console.log(JSON.stringify(modules, undefined, 2));
  });
}
