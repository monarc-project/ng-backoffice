(function () {

    angular
        .module('BackofficeApp')
        .factory('AmvService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            AmvService
        ]);

    function AmvService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.AmvResource = $resource('/api/amvs/:amvId', { amvId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getAmvs = function (params) {
            return self.AmvResource.query(params).$promise;
        };

        var getAmv = function (id) {
            return self.AmvResource.query({amvId: id}).$promise;
        };


        var createAmv = function (params, success, error) {
            new self.AmvResource(params).$save(success, error);
        };

        var updateAmv = function (params, success, error) {
            self.AmvResource.update(params, success, error);
        };

        var deleteAmv = function (id) {
            self.AmvResource.delete({amvId: id}, success, error);
        };

        return {
            getAmvs: getAmvs,
            getAmv: getAmv,
            createAmv: createAmv,
            deleteAmv: deleteAmv,
            updateAmv: updateAmv
        };
    }

})
();