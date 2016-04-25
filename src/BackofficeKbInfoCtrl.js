(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbInfoCtrl', [
            '$scope', '$mdToast', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog', 'KBService',
            'TableHelperService', 'ErrorService', 'AssetService',
            BackofficeKbInfoCtrl
        ]);

    /**
     * BO > KB > INFO
     */
    function BackofficeKbInfoCtrl($scope, $mdToast, $mdMedia, $mdDialog, gettext, gettextCatalog, KBService,
                                  TableHelperService, ErrorService, AssetService) {
        TableHelperService.resetBookmarks();

        /*
         * ASSETS TAB
         */
        $scope.assets = TableHelperService.build('label', 10, 1, '');

        $scope.updateAssets = function () {
            $scope.assets.promise = KBService.getAssets($scope.assets.query);
            $scope.assets.promise.then(
                function (data) {
                    $scope.assets.items = data;
                },

                function (status) {
                    ErrorService.notifyFetchError('assets', status);
                }
            )
        };
        $scope.removeAssetsFilter = function () {
            TableHelperService.removeFilter($scope.assets);
        };

        TableHelperService.watchSearch($scope, 'assets.query.filter', $scope.assets.query, $scope.updateAssets);
        $scope.updateAssets();


        $scope.createNewAsset = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', CreateAssetDialogCtrl],
                templateUrl: '/views/dialogs/create.assets.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (asset) {
                    AssetService.createAsset(asset).then(
                        function () {
                            $scope.updateAssets();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The asset has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('created asset'), status);
                        }
                    );
                }, function () {

                });
        };

        $scope.editAsset = function (ev, asset) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'user', CreateAssetDialogCtrl],
                templateUrl: '/views/dialogs/create.users.admin.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'asset': asset
                }
            })
                .then(function (asset) {
                    AssetService.updateAsset(asset).then(
                        function () {
                            $scope.updateAssets();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The asset has been updated successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('updated asset'), status);
                        }
                    );
                }, function () {

                });
        };

        $scope.deleteAsset = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete asset "{{ label }}"?',
                    {label: item.label}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AssetService.deleteAsset(item.id).then(
                    function () {
                        $scope.updateAssets();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The asset "{{label}}" has been deleted.',
                                    {label: item.label}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    },

                    function (status) {
                        ErrorService.notifyFetchError(gettext('deleted asset'), status);
                    }
                );
            }, function() {
            });
        };
    }

    function CreateAssetDialogCtrl($scope, $mdDialog, asset) {
        if (asset != undefined && asset != null) {
            $scope.asset = asset;
        } else {
            $scope.asset = {
                mode: 1,
                code: '',
                type: 1,
                label: '',
                description: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.asset);
        };
    }
})();