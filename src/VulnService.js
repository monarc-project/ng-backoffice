(function () {

    angular
        .module('BackofficeApp')
        .factory('VulnService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            VulnService
        ]);

    function VulnService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.VulnResource = $resource('/api/vulns/:vulnId', { vulnId: '@id' }, {'update': {method: 'PUT'}});

        var getVulns = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/api/vulns?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createVuln = function (params) {
            var promise = $q.defer();

            var vuln = new self.VulnResource(params);
            vuln.$save(function (vuln) {
                promise.resolve(vuln);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var updateVuln = function (params) {
            var promise = $q.defer();

            self.VulnResource.update(params, function (vuln) {
                promise.resolve(vuln);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var deleteVuln = function (id) {
            var promise = $q.defer();

            self.VulnResource.delete({vulnId: id}, function () {
                promise.resolve();
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        return {
            getVulns: getVulns,
            createVuln: createVuln,
            deleteVuln: deleteVuln,
            updateVuln: updateVuln
        };
    }

})
();