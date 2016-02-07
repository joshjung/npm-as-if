var npmview = require('npmview');
var _ = require('underscore');

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
        console.error(err);
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
  findLatestAsIf: function (package, date, callback) {
    this.view(package, (function (err, data) {
      var byDate = this.versionsByDate(data);
      var last;

      for (var time in byDate) {
        if (parseFloat(time) > date.getTime()) {
          break;
        }
        last = time;
      }

      callback(byDate[last]);
    }).bind(this));
  }
};

module.exports = AsIf;
