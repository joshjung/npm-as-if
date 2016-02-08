var npmview = require('npmview');
var _ = require('underscore');
var fs = require('fs');
var forEach = require('async-foreach').forEach;

_.mixin({
  'sortKeysBy': function (obj, comparator) {
    var keys = _.sortBy(_.keys(obj), function (key) {
      return comparator ? comparator(obj[key], key) : key;
    });

    return _.object(keys, _.map(keys, function (key) {
      return obj[key];
    }));
  }
});

var AsIf = function (options) {
  this.options = options;
};

AsIf.prototype = {
  view: function (package, callback) {
    npmview(package, function(err, version, moduleInfo) {
      if (err) {
        console.error('ERROR', err);
        callback(err);
        return;
      }

      callback(undefined, {
        version: version,
        moduleInfo: moduleInfo
      });
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
    console.log(file);
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
          asIfPackages[package[0]] = err;
        } else {
          asIfPackages[package[0]] = {
            previously: package[1],
            asIf: version
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
