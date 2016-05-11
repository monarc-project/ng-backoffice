(function () {

    angular
        .module('BackofficeApp')
        .factory('ClientService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            ClientService
        ]);

    function ClientService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.ClientResource = $resource('/api/clients/:clientId', { clientId: '@id' }, {
            'update': {
                method: 'PUT'
            },
            'query': {
                isArray: false
            }
        });

        var getClients = function (params) {
            return self.ClientResource.query(params).$promise;
        };

        var createClient = function (params, success, error) {
            new self.ClientResource(params).$save(success, error);
        };

        var updateClient = function (params, success, error) {
            self.ClientResource.update(params, success, error);
        };

        var deleteClient = function (id, success, error) {
            self.ClientResource.delete({clientId: id}, success, error);
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