(function () {

    angular
        .module('BackofficeApp')
        .factory('MeasureService', [ '$resource', MeasureService ]);

    function MeasureService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.MeasureResource = $resource('/api/measures/:measureId', { measureId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getMeasures = function (params) {
            return self.MeasureResource.query(params).$promise;
        };

        var getMeasure = function (id) {
            return self.MeasureResource.query({measureId: id}).$promise;
        };

        var createMeasure = function (params, success, error) {
            new self.MeasureResource(params).$save(success, error);
        };

        var updateMeasure = function (params, success, error) {
            self.MeasureResource.update(params, success, error);
        };

        var deleteMeasure = function (id, success, error) {
            self.MeasureResource.delete({measureId: id}, success, error);
        };

        return {
            getMeasures: getMeasures,
            getMeasure: getMeasure,
            createMeasure: createMeasure,
            deleteMeasure: deleteMeasure,
            updateMeasure: updateMeasure
        };
    }

})
();