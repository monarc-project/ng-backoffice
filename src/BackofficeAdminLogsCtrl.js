(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAdminLogsCtrl', [
            '$scope', '$state', '$mdToast', '$mdMedia', '$mdDialog', 'gettextCatalog', 'gettext', 'AdminLogsService',
            'TableHelperService',
            BackofficeAdminLogsCtrl
        ]);

    /**
     * Admin Logs Controller for the Backoffice module
     */
    function BackofficeAdminLogsCtrl($scope, $state, $mdToast, $mdMedia, $mdDialog, gettextCatalog, gettext,
                                      AdminLogsService, TableHelperService) {
        $scope.logs = TableHelperService.build('-createdAt', 25, 1, '');

        $scope.removeFilter = function () {
            TableHelperService.removeFilter($scope.logs);
        };

        $scope.updateLogs = function () {
            $scope.logs.promise = AdminLogsService.getLogs($scope.logs.query);
            $scope.logs.promise.then(
                function (data) {
                    $scope.logs.items = data;
                }
            );
        };

        TableHelperService.watchSearch($scope, 'logs.query.filter', $scope.logs.query, $scope.updateLogs);
    }
})();