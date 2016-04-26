(function () {

    angular
        .module('BackofficeApp')
        .factory('ModelService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            ModelService
        ]);

    function ModelService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.ModelResource = $resource('/api/models/:modelId', { modelId: '@id' }, {'update': {method: 'PUT'}});

        var getModels = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/api/models?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createModel = function (params) {
            var promise = $q.defer();

            var model = new self.ModelResource(params);
            model.$save(function (model) {
                promise.resolve(model);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var updateModel = function (params) {
            var promise = $q.defer();

            self.ModelResource.update(params, function (model) {
                promise.resolve(model);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var deleteModel = function (id) {
            var promise = $q.defer();

            self.ModelResource.delete({modelId: id}, function () {
                promise.resolve();
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        return {
            getModels: getModels,
            createModel: createModel,
            deleteModel: deleteModel,
            updateModel: updateModel
        };
    }

})
();