(function () {

    angular
        .module('BackofficeApp')
        .factory('GuideService', [ '$resource', 'gettext', GuideService ]);

    function GuideService($resource, gettext) {
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


        const categoriesLabels = {
            1: gettext("Risk analysis context"),
            2: gettext("Risk management context"),
            3: gettext("Summary assessment of trends and threats"),
            4: gettext("Summary of assets / impacts")
        }

        const categories = [
            {
                id: 1,
                label: categoriesLabels[1]
            },
            {
                id: 2,
                label: categoriesLabels[2]
            },
            {
                id: 3,
                label: categoriesLabels[3]
            },
            {
                id: 4,
                label: categoriesLabels[4]
            },
        ];



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

            getCategories: function () { return categories; },
            getCategoryLabel: function (id) { return categoriesLabels[id]; }
        };
    }

})
();