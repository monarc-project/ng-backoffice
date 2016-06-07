(function () {

    angular
        .module('BackofficeApp')
        .factory('AdminLogsService', ['$resource', AdminLogsService]);

    function AdminLogsService($resource) {
        var self = this;

        self.LogResource = $resource('/api/admin/historical/:logId', {logId: '@id'},
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getLogs = function (params) {
            return self.LogResource.query(params).$promise;
        };

        var getLog = function (id) {
            return self.LogResource.query({logId: id}).$promise;
        };

        var createLog = function (params, success, error) {
            new self.LogResource(params).$save(success, error);
        };

        var updateLog = function (params, success, error) {
            self.LogResource.update(params, success, error);
        };

        var deleteLog = function (id, success, error) {
            self.LogResource.delete({logId: id}, success, error);
        };

        return {
            getLogs: getLogs,
            getLog: getLog,
            createLog: createLog,
            deleteLog: deleteLog,
            updateLog: updateLog
        };
    }

})
();