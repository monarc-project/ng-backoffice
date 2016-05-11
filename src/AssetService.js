(function () {

    angular
        .module('BackofficeApp')
        .factory('AssetService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            AssetService
        ]);

    function AssetService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.AssetResource = $resource('/api/assets/:assetId', { assetId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getAssets = function (params) {
            return self.AssetResource.query(params).$promise;
        };

        var createAsset = function (params, success, error) {
            new self.AssetResource(params).$save(success, error);
        };

        var updateAsset = function (params, success, error) {
            self.AssetResource.update(params, success, error);
        };

        var deleteAsset = function (id, success, error) {
            self.AssetResource.delete({assetId: id}, success, error);
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