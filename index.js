var AsIf = require('./src/as-if');
var program = require('commander');

program
  .version('0.0.1')
  .usage('[options] <date> <shrinkwrapOrPackage>')
  .option('-v, --verbose', 'Increase output verbosity')
  .parse(process.argv);

if (program.args.length !== 2) {
  console.error('Please provide an as if date and a shrinkwrap.json (prefixed with ./) or a package name');
  process.exit(1);
}

var date = new Date(program.args[0]);

var shrinkwrap = program.args[1][0] == '.' ? program.args[1] : undefined;
var package = !!shrinkwrap ? undefined : program.args[1];

var asIf = new AsIf({});

if (package) {
  asIf.findLatestAsIf(package, date, console.log);
}