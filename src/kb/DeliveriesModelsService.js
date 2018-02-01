(function () {

    angular
        .module('BackofficeApp')
        .factory('DeliveriesModelsService', [ '$resource', 'gettextCatalog', DeliveriesModelsService ]);

    function DeliveriesModelsService($resource, gettextCatalog) {
        var self = this;

        self.DeliveryModelResource = $resource('api/deliveriesmodels/:deliveryModelId', { deliveryModelId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getDeliveriesModels = function (params) {
            return self.DeliveryModelResource.query(params).$promise;
        };

        var getDeliveryModel = function (id) {
            return self.DeliveryModelResource.query({deliveryModelId: id}).$promise;
        };

        var createDeliveryModel = function (params, success, error) {
            new self.DeliveryModelResource(params).$save(success, error);
        };

        var updateDeliveryModel = function (params, success, error) {
            self.DeliveryModelResource.update(params, success, error);
        };

        var deleteDeliveryModel = function (id, success, error) {
            self.DeliveryModelResource.delete({deliveryModelId: id}, success, error);
        };

        const categoriesLabels = {
            1: "1 - ".concat(gettextCatalog.getString("Deliverable template for context validation")),
            2: "2 - ".concat(gettextCatalog.getString("Deliverable template for model validation")),
            3: "3 - ".concat(gettextCatalog.getString("Deliverable template for final report")),
            4: "4 - ".concat(gettextCatalog.getString("Implementation plan"))
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
            }
        ];

        return {
            getDeliveriesModels: getDeliveriesModels,
            getDeliveryModel: getDeliveryModel,
            createDeliveryModel: createDeliveryModel,
            updateDeliveryModel: updateDeliveryModel,
            deleteDeliveryModel: deleteDeliveryModel,

            getCategories: function () { return categories; },
            getCategoryLabel: function (id) { return categoriesLabels[id]; }
        };
    }

})
();
