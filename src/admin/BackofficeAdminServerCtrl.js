(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAdminServerCtrl', [
            '$scope', '$state', '$mdToast', '$mdMedia', '$mdDialog', 'gettextCatalog', 'gettext', 'AdminServerService',
            BackofficeAdminServerCtrl
        ]);

    /**
     * Admin Server Controller for the Backoffice module
     */
    function BackofficeAdminServerCtrl($scope, $state, $mdToast, $mdMedia, $mdDialog, gettextCatalog, gettext,
                                       AdminServerService) {
        $scope.servers = {};

        $scope.updateServers = function () {
            AdminServerService.getServers().then(
                function (data) {
                    $scope.servers = data;
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
                    AdminServerService.createServer(server,
                        function () {
                            $scope.updateServers();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The server has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

        $scope.toggleServerStatus = function (server) {
            AdminServerService.getServer(server.id).then(function (server_db) {
                server_db.status = !server_db.status;

                AdminServerService.updateServer(server_db, function () {
                    server.status = !server.status;
                });

            })
        }

        $scope.deleteServer = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete "{{label}}"?', { label: item.label }))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AdminServerService.deleteServer(item.id,
                    function () {
                        $scope.updateServers();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The server "{{label}}" has been deleted.',
                                    {label: item.label}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
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