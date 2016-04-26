(function () {

    angular
        .module('BackofficeApp')
        .factory('AssetService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            AssetService
        ]);

    function AssetService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.AssetResource = $resource('/api/assets/:assetId', { assetId: '@id' });

        var getAssets = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/api/assets?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createAsset = function (params) {
            var promise = $q.defer();

            var asset = new self.AssetResource(params);
            asset.$save(function (asset) {
                promise.resolve(asset);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var updateAsset = function (params) {
            var promise = $q.defer();

            self.AssetResource.update(params, function (asset) {
                promise.resolve(asset);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var deleteAsset = function (id) {
            var promise = $q.defer();

            self.AssetResource.delete({assetId: id}, function () {
                promise.resolve();
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        return {
            getAssets: getAssets,
            createAsset: createAsset,
            deleteAsset: deleteAsset,
            updateAsset: updateAsset
        };
    }

})
();