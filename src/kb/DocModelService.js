(function () {

    angular
        .module('BackofficeApp')
        .factory('DocModelService', [ '$resource', 'gettextCatalog', DocModelService ]);

    function DocModelService($resource, gettextCatalog) {
        var self = this;

        self.DocModelResource = $resource('/api/docmodels/:docModelId', { docModelId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getDocModels = function (params) {
            return self.DocModelResource.query(params).$promise;
        };

        var getDocModel = function (id) {
            return self.DocModelResource.query({docModelId: id}).$promise;
        };

        var createDocModel = function (params, success, error) {
            new self.DocModelResource(params).$save(success, error);
        };

        var updateDocModel = function (params, success, error) {
            self.DocModelResource.update(params, success, error);
        };

        var deleteDocModel = function (id, success, error) {
            self.DocModelResource.delete({docModelId: id}, success, error);
        };
        

        const categoriesLabels = {
            1: gettextCatalog.getString("Document model for Context validation"),
            2: gettextCatalog.getString("Document model for Assets and models validation"),
            3: gettextCatalog.getString("Document model for Risk analysis")
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
            }
        ];



        return {
            getDocModels: getDocModels,
            getDocModel: getDocModel,
            createDocModel: createDocModel,
            deleteDocModel: deleteDocModel,
            updateDocModel: updateDocModel,

            getCategories: function () { return categories; },
            getCategoryLabel: function (id) { return categoriesLabels[id]; }
        };
    }

})
();