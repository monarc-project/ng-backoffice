(function () {
  angular
    .module('BackofficeApp')
    .factory('AdminLogsService', ['$resource', AdminLogsService]);

  function AdminLogsService($resource) {
    var self = this;

    self.LogResource = $resource('api/admin/historical/:logId', {logId: '@id'}, {
      'query': {
        isArray: false
      }
    });

    const getLogs = function (params) {
      return self.LogResource.query(params).$promise;
    };

    return {
      getLogs: getLogs
    };
  }
})();
