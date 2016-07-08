(function () {

    angular
        .module('BackofficeApp')
        .factory('ModelService', [ '$resource', ModelService ]);

    function ModelService($resource) {
        var self = this;

        self.ModelResource = $resource('/api/models/:modelId', { modelId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        self.ModelObjectResource = $resource('/api/models/:modelId/objects/:objectId', { modelId: '@modelId', objectId: '@objectId' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            })

        var getModels = function (params) {
            return self.ModelResource.query(params).$promise;
        };

        var getModel = function (id) {
            return self.ModelResource.query({modelId: id}).$promise;
        };

        var createModel = function (params, success, error) {
            new self.ModelResource(params).$save(success, error);
        };

        var updateModel = function (params, success, error) {
            self.ModelResource.update(params, success, error);
        };

        var deleteModel = function (id, success, error) {
            self.ModelResource.delete({modelId: id}, success, error);
        };

        var addExistingObject = function (model_id, object_id, success, error) {
            new self.ModelObjectResource({modelId: model_id, id: object_id}).$save(success, error);
        };

        return {
            getModels: getModels,
            getModel: getModel,
            createModel: createModel,
            deleteModel: deleteModel,
            updateModel: updateModel,
            addExistingObject: addExistingObject
        };
    }

})
();