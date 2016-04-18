(function () {

    angular
        .module('BackofficeApp')
        .factory('ClientService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            ClientService
        ]);

    function ClientService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.ClientResource = $resource('/api/clients/:clientId', { clientId: '@id' });

        var getClients = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/api/clients?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createClient = function (params) {
            var promise = $q.defer();

            var client = new self.ClientResource(params);
            client.$save(function (client) {
                promise.resolve(client);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var updateClient = function (params) {
            var promise = $q.defer();

            var client = new self.ClientResource(params);
            client.$save(function (client) {
                promise.resolve(client);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var deleteClient = function (id) {
            var promise = $q.defer();

            self.ClientResource.delete({clientId: id}, function () {
                promise.resolve();
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        return {
            getClients: getClients,
            createClient: createClient,
            deleteClient: deleteClient,
            updateClient: updateClient
        };
    }

})
();