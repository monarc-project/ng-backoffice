(function () {

    angular
        .module('BackofficeApp')
        .factory('MeasureService', [ '$resource', 'MassDeleteService', MeasureService ]);

    function MeasureService($resource, MassDeleteService) {
        var self = this;

        self.MeasureResource = $resource('/api/measures/:measureId', { measureId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'patch': {
                    method: 'PATCH'
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

        var deleteMassMeasure = function (ids, success, error) {
            MassDeleteService.deleteMass('/api/measures', ids, success, error);
        }

        var patchMeasure = function (id, params, success, error) {
            self.MeasureResource.patch({measureId: id}, params, success, error);
        }

        return {
            getMeasures: getMeasures,
            getMeasure: getMeasure,
            createMeasure: createMeasure,
            deleteMeasure: deleteMeasure,
            deleteMassMeasure: deleteMassMeasure,
            updateMeasure: updateMeasure,
            patchMeasure: patchMeasure
        };
    }

})
();