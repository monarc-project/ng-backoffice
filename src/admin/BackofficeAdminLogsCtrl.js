(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAdminLogsCtrl', [
            '$scope', 'AdminLogsService', 'TableHelperService', '$location',
            BackofficeAdminLogsCtrl
        ]);

    /**
     * Admin Logs Controller for the Backoffice module
     */
    function BackofficeAdminLogsCtrl($scope, AdminLogsService, TableHelperService, $location) {
        $scope.logs = TableHelperService.build('-createdAt', 20, 1, '');

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

        $scope.switchToAmv = function(id){
            $location.path('/backoffice/kb/info/amvs/'+id);
        }

        TableHelperService.watchSearch($scope, 'logs.query.filter', $scope.logs.query, $scope.updateLogs);
    }
})();