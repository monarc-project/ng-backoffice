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


        self.ItemResource = $resource('/api/guides-items/:itemId', { itemId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getItems = function (params) {
            return self.ItemResource.query(params).$promise;
        };

        var getItem = function (id) {
            return self.ItemResource.query({itemId: id}).$promise;
        };

        var createItem = function (params, success, error) {
            new self.ItemResource(params).$save(success, error);
        };

        var updateItem = function (params, success, error) {
            self.ItemResource.update(params, success, error);
        };

        var deleteItem = function (id, success, error) {
            self.ItemResource.delete({itemId: id}, success, error);
        };

        return {
            getGuides: getGuides,
            getGuide: getGuide,
            createGuide: createGuide,
            deleteGuide: deleteGuide,
            updateGuide: updateGuide,

            getItems: getItems,
            getItem: getItem,
            createItem: createItem,
            deleteItem: deleteItem,
            updateItem: updateItem,

        };
    }

})
();