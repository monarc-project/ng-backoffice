(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbInfoCtrl', [
            '$scope', '$mdToast', 'gettextCatalog', 'KBService', 'TableHelperService', 'ErrorService',
            BackofficeKbInfoCtrl
        ]);

    /**
     * BO > KB > INFO
     */
    function BackofficeKbInfoCtrl($scope, $mdToast, gettextCatalog, KBService, TableHelperService, ErrorService) {
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

        /*
        $scope.$watch('assets.query.filter', function (newValue, oldValue) {
            if (!oldValue) {
                assetsBookmark = $scope.assets.query.page;
            }

            if (newValue !== oldValue) {
                $scope.assets.query.page = 1;
            }

            if (!newValue) {
                $scope.assets.query.page = assetsBookmark;
            }

            $scope.updateAssets($scope.assets.query);
        });*/
    }

})();