(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeKbInfoCtrl', [
            '$scope', '$mdToast', 'gettextCatalog', 'KBService', 'TableHelperService', 'BreadcrumbService',
            BackofficeKbInfoCtrl
        ]);

    /**
     * BO > KB > INFO
     */
    function BackofficeKbInfoCtrl($scope, $mdToast, gettextCatalog, KBService, TableHelperService, BreadcrumbService) {
        TableHelperService.resetBookmarks();

        var showErrorToast = function (thing, status) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('An error occurred while fetching ' + thing + ': ' + status)
                    .position('top right')
                    .hideDelay(3000)
            );
        };

        BreadcrumbService.setItems([
            {'label': 'Home', 'sref': 'main'},
            {'label': 'KB management', 'sref': 'main.kb_mgmt'},
            {'label': 'Information risks', 'sref': 'main.kb_mgmt.info_risk'},
        ]);

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
                    showErrorToast('assets', status);
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