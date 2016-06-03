(function () {

    angular
        .module('BackofficeApp')
        .factory('GuideService', [ '$resource', GuideService ]);

    function GuideService($resource) {
        var self = this;

        self.GuideResource = $resource('/api/guides/:guideId', { guideId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getGuides = function (params) {
            return self.GuideResource.query(params).$promise;
        };

        var getGuide = function (id) {
            return self.GuideResource.query({guideId: id}).$promise;
        };

        var createGuide = function (params, success, error) {
            new self.GuideResource(params).$save(success, error);
        };

        var updateGuide = function (params, success, error) {
            self.GuideResource.update(params, success, error);
        };

        var deleteGuide = function (id, success, error) {
            self.GuideResource.delete({guideId: id}, success, error);
        };

        return {
            getGuides: getGuides,
            getGuide: getGuide,
            createGuide: createGuide,
            deleteGuide: deleteGuide,
            updateGuide: updateGuide
        };
    }

})
();