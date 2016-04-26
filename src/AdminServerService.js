(function () {

    angular
        .module('BackofficeApp')
        .factory('AdminServerService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            AdminServerService
        ]);

    function AdminServerService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.ServerResource = $resource('/api/admin/servers/:serverId', { serverId: '@id' });

        var getServers = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/api/admin/servers?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createServer = function (params) {
            var promise = $q.defer();

            var server = new self.ServerResource(params);
            server.$save(function (server) {
                promise.resolve(server);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var updateServer = function (params) {
            var promise = $q.defer();

            self.ServerResource.update(params, function (server) {
                promise.resolve(server);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var deleteServer = function (id) {
            var promise = $q.defer();

            self.ServerResource.delete({serverId: id}, function () {
                promise.resolve();
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
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