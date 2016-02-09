//var npmview = require('npmview');
var _ = require('./_mixin');
var fs = require('fs');
var forEach = require('async-foreach').forEach;
var spawn = require('child_process').spawn;

var AsIf = function (options) {
  this.options = options;
};

AsIf.prototype = {
  isModuleAccessible: function (package) {
    try {
      var mod = require(package);
    } catch (error) {
      return false;
    }
    return true;
  },
  view: function (package, callback) {
    var view = spawn('npm', ['view', package]);
    var json = '';
    view.stdout.on('data', function (data) {
      json += data.toString();
    });
    view.stderr.on('data', function (err) {
      json = err;
    });
    view.on('close', function (code) {
      try {
        json = eval('(' + json + ')');
        callback(undefined, {
          version: json.version,
          moduleInfo: json
        });
      } catch (error) {
        callback(error);
      }
    });
  },
  versionsByDate: function (viewData) {
    var byDate = {};
    for (var version in viewData.moduleInfo.time) {
      if (version !== 'created' && version !== 'modified') {
        var ms = Date.parse(viewData.moduleInfo.time[version]).toString();
        byDate[ms] = version;
      }
    }
    return _.sortKeysBy(byDate);
  },
  findAsIf: function (package, date, callback) {
    this.view(package, (function (err, data) {
      if (err) {
        return callback(err);
      }
      var byDate = this.versionsByDate(data);
      var last;

      for (var time in byDate) {
        if (parseFloat(time) > date.getTime()) {
          break;
        }
        last = time;
      }

      callback(undefined, byDate[last]);
    }).bind(this));
  },
  parseShrinkWrap: function (file) {
    var sw = require(file);
    var packages = {};

    var parseDependencies = (function (dependencies) {
      for (var name in dependencies) {
        packages[name] = dependencies[name].version;
        if (dependencies[name].dependencies) {
          parseDependencies(dependencies[name].dependencies);
        }
      }
    }).bind(this);

    // Build a huge list of all packages and their version as it exists in the shrinkwrap file
    parseDependencies(sw.dependencies);

    return packages;
  },
  shrinkwrapAsIf: function (file, date, callback) {
    var packages = _.pairs(this.parseShrinkWrap(file));
    var asIfPackages = {};
    var _this = this;

    forEach(packages, function (package, ix) {
      var done = this.async();

      _this.findAsIf(package[0], date, function (err, version) {
        if (err) {
          asIfPackages[package[0]] = {
            shrinkwrapVersion: package[1],
            versionAtDate: err.toString()
          };
        } else {
          asIfPackages[package[0]] = {
            shrinkwrapVersion: package[1],
            versionAtDate: version
          };
        }
        done();
      });
    }, function () {
      callback(asIfPackages);
    });
  }
};

module.exports = AsIf;
