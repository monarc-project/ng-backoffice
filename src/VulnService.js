(function () {

    angular
        .module('BackofficeApp')
        .factory('VulnService', [ '$resource', VulnService ]);

    function VulnService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.VulnResource = $resource('/api/vulns/:vulnId', { vulnId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getVulns = function (params) {
            return self.VulnResource.query(params).$promise;
        };

        var getVuln = function (id) {
            return self.VulnResource.query({vulnId: id}).$promise;
        };

        var createVuln = function (params, success, error) {
            new self.VulnResource(params).$save(success, error);
        };

        var updateVuln = function (params, success, error) {
            self.VulnResource.update(params, success, error);
        };

        var deleteVuln = function (id, success, error) {
            self.VulnResource.delete({vulnId: id}, success, error);
        };

        return {
            getVulns: getVulns,
            getVuln: getVuln,
            createVuln: createVuln,
            deleteVuln: deleteVuln,
            updateVuln: updateVuln
        };
    }

})
();