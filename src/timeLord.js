var _ = require('./_mixin');
var fs = require('fs');
var forEach = require('async-foreach').forEach;
var spawn = require('child_process').spawn;

var NPMTimeLord = function (options) {
  this.options = options;
};

NPMTimeLord.prototype = {
  /**
   * Runs `npm view` on the provided module.
   *
   * @param module The name of the npm module to inspect.
   * @param callback A function with (err, data) arguments.
   */
  view: function (module, callback) {
    var view = spawn('npm', ['view', module]);
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
  /**
   * Given module data returned by `view`, returns module names organized with mappings to JS Date objects for
   * when they were released.
   *
   * @param viewData Data in the structure returned by the `view` function.
   * @returns {Object} An Object with module names mapped to version numbers, sorted alphabetically.
   */
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
  /**
   * Find a given module version at a particular date.
   *
   * @param module The name of the node module.
   * @param date A Date object.
   * @param callback Function fitting the (err, response) structure.
   */
  findModuleVersionAtDate: function (module, date, callback) {
    this.view(module, (function (err, data) {
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
  /**
   * Parses a npm-shrinkwrap.json file, returning all dependencies recursively and their version information.
   *
   * @param file The npm-shrinkwrap.json filename to load.
   * @returns {Object}
   */
  parseShrinkWrapJSONFile: function (file) {
    var sw = require(file);
    var modules = {};

    var parseDependencies = (function (dependencies) {
      for (var name in dependencies) {
        modules[name] = dependencies[name].version;
        if (dependencies[name].dependencies) {
          parseDependencies(dependencies[name].dependencies);
        }
      }
    }).bind(this);

    // Build a huge list of all modules and their version as it exists in the shrinkwrap file
    parseDependencies(sw.dependencies);

    return modules;
  },
  /**
   * Returns all modules for a `npm-shrinkwrap.json` file at their latest version at a particular date in the past.
   *
   * @param file The filename in npm-shrinkwrap.json format.
   * @param date The JS Date object referencing a time in the past to get version information on.
   * @param callback Function fitting the (err, response) structure.
   */
  findShrinkwrapFileVersionsAtDate: function (file, date, callback) {
    var modules = _.pairs(this.parseShrinkWrapJSONFile(file));
    var asIfDatePackages = {};
    var _this = this;

    forEach(modules, function (module, ix) {
      var done = this.async();

      _this.findModuleVersionAtDate(module[0], date, function (err, version) {
        if (err) {
          asIfDatePackages[module[0]] = {
            shrinkwrapVersion: module[1],
            versionAtDate: err.toString()
          };
        } else {
          asIfDatePackages[module[0]] = {
            shrinkwrapVersion: module[1],
            versionAtDate: version ? version : 'did not exist'
          };
        }
        done();
      });
    }, function () {
      asIfDatePackages.meta = {
          runDate: new Date(),
          atDate: date
        };

      callback(asIfDatePackages);
    });
  }
};

module.exports = NPMTimeLord;
