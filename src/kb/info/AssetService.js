(function () {

    angular
        .module('BackofficeApp')
        .factory('AssetService', [ '$resource', AssetService ]);

    function AssetService($resource) {
        var self = this;

        self.AssetResource = $resource('/api/assets/:assetId', { assetId: '@id' },
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

        var getAssets = function (params) {
            return self.AssetResource.query(params).$promise;
        };

        var getAsset = function (id) {
            return self.AssetResource.query({assetId: id}).$promise;
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

        var patchAsset = function (id, params, success, error) {
            self.AssetResource.patch({assetId: id}, params, success, error);
        }

        return {
            getAssets: getAssets,
            getAsset: getAsset,
            createAsset: createAsset,
            deleteAsset: deleteAsset,
            updateAsset: updateAsset,
            patchAsset: patchAsset
        };
    }

})
();