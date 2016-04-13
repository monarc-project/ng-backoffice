(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAdminServerCtrl', [
            '$scope', '$state', '$mdToast', '$mdMedia', '$mdDialog', 'gettextCatalog', 'AdminServerService',
            BackofficeAdminServerCtrl
        ]);

    /**
     * Admin Server Controller for the Backoffice module
     */
    function BackofficeAdminServerCtrl($scope, $state, $mdToast, $mdMedia, $mdDialog, gettextCatalog, AdminServerService) {
        $scope.servers = {};

        var showErrorToast = function (thing, status) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent('An error occurred while fetching ' + thing + ': ' + status)
                    .position('top right')
                    .hideDelay(3000)
            );
        };

        $scope.updateServers = function () {
            AdminServerService.getServers().then(
                function (data) {
                    $scope.servers = data;
                },

                function (status) {
                    showErrorToast('servers', status);
                }
            );
        };

        $scope.createNewServer = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', CreateServerDialogCtrl],
                templateUrl: '/views/dialogs/create.servers.admin.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (server) {
                    AdminServerService.createServer(server).then(
                        function () {
                            $scope.updateServers();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent('The server has been created successfully.')
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            showErrorToast('created server', status);
                        }
                    );
                }, function () {

                });
        };

        $scope.deleteServer = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure you want to delete "' + item.label + '"?')
                .textContent('This operation is irreversible.')
                .targetEvent(ev)
                .ok('Delete')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                AdminServerService.deleteServer(item.id).then(
                    function () {
                        $scope.updateServers();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent('The server "' + item.label + '" has been deleted.')
                                .position('top right')
                                .hideDelay(3000)
                        );
                    },

                    function (status) {
                        showErrorToast('deleted server', status);
                    }
                );
            }, function() {
            });
        };

        $scope.updateServers();
    }


    function CreateServerDialogCtrl($scope, $mdDialog) {
        $scope.server = {
            label: '',
            address: '',
            fqdn: '',
            login: '',
            port: '',
            ssh: false
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.server);
        };
    }

})();