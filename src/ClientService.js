(function () {

    angular
        .module('BackofficeApp')
        .factory('ClientService', [ '$resource', ClientService ]);

    function ClientService($resource) {
        var self = this;

        self.ClientResource = $resource('api/clients/:clientId', { clientId: '@id' }, {
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

        var getClient = function (id) {
            return self.ClientResource.query({clientId: id}).$promise;
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
            getClient: getClient,
            createClient: createClient,
            deleteClient: deleteClient,
            updateClient: updateClient
        };
    }

    angular
        .module('BackofficeApp')
        .factory('AdminServerGetService', [ '$resource', AdminServerGetService ]);

    function AdminServerGetService($resource) {
        var self = this;

        self.ServerResource = $resource('api/admin/serversget/:serverId', { serverId: '@id' },
            {
                'query': {
                    isArray: false
                }
            });


        var getServers = function (params) {
            return self.ServerResource.query(params).$promise;
        };

        var getServer = function (id) {
            return self.ServerResource.query({serverId: id}).$promise;
        };

        return {
            getServers: getServers,
            getServer: getServer
        };
    }

})
();