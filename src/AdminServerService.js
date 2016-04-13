(function () {

    angular
        .module('BackofficeApp')
        .factory('AdminServerService', [ '$http', '$q', '$httpParamSerializer',
            AdminServerService
        ]);

    // TODO: $resource
    function AdminServerService($http, $q, $httpParamSerializer) {
        var self = this;

        var getServers = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/data/admin_servers.json?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createServer = function (params) {
            var promise = $q.defer();

            $http.post('/data/admin_servers.json', params).then(
                function () { promise.resolve(); },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var deleteServer = function (id) {
            var promise = $q.defer();

            $http.delete('/data/admin_servers.json?id=' + encodeURI(id)).then(
                function () { promise.resolve(); },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        return {
            getServers: getServers,
            createServer: createServer,
            deleteServer: deleteServer
        };
    }

})
();