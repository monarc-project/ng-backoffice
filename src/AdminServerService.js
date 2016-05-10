(function () {

    angular
        .module('BackofficeApp')
        .factory('AdminServerService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            AdminServerService
        ]);

    function AdminServerService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.ServerResource = $resource('/api/admin/servers/:serverId', { serverId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });


        var getServers = function (params) {
            return self.ServerResource.query(params).$promise;
        };

        var createServer = function (params, success, error) {
            new self.ServerResource(params).$save(success, error);
        };

        var updateServer = function (params, success, error) {
            self.ServerResource.update(params, success, error);
        };

        var deleteServer = function (id, success, error) {
            self.ServerResource.delete({serverId: id}, success, error);
        };

        return {
            getServers: getServers,
            createServer: createServer,
            deleteServer: deleteServer,
            updateServer: updateServer
        };
    }

})
();