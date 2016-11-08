(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAdminServerCtrl', [
            '$scope', '$state', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', 'AdminServerService',
            BackofficeAdminServerCtrl
        ]);

    /**
     * Admin Server Controller for the Backoffice module
     */
    function BackofficeAdminServerCtrl($scope, $state, toastr, $mdMedia, $mdDialog, gettextCatalog, AdminServerService) {
        $scope.servers = {};
        $scope.serversFilter = {};

        $scope.serversFilter.activeFilter = 1;
        var initServersFilter = true;
        $scope.$watch('serversFilter.activeFilter', function() {
            if (initServersFilter) {
                initServersFilter = false;
            } else {
                $scope.updateServers();
            }
        });

        $scope.updateServers = function () {
            AdminServerService.getServers({status: $scope.serversFilter.activeFilter}).then(
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
                clickOutsideToClose: false,
                fullscreen: useFullScreen
            })
                .then(function (server) {
                    AdminServerService.createServer(server,
                        function () {
                            $scope.updateServers();
                            toastr.success(gettextCatalog.getString('The server "{{label}}" has been created successfully.',
                                {label: server.label}), gettextCatalog.getString('Creation successful'));
                        }
                    );
                });
        };

        $scope.editServer = function (ev, server) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            AdminServerService.getServer(server.id).then(function (server) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'server', CreateServerDialogCtrl],
                    templateUrl: '/views/dialogs/create.servers.admin.html',
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'server': server
                    }
                })
                    .then(function (server) {
                        AdminServerService.updateServer(server,
                            function () {
                                $scope.updateServers();
                                toastr.success(gettextCatalog.getString('The server "{{label}}" has been updated successfully.',
                                    {label: server.label}), gettextCatalog.getString('Update successful'));
                            }
                        );
                    });
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
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AdminServerService.deleteServer(item.id,
                    function () {
                        $scope.updateServers();

                        toastr.success(gettextCatalog.getString('The server "{{label}}" has been deleted.',
                            {label: item.label}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };

        $scope.updateServers();
    }


    function CreateServerDialogCtrl($scope, $mdDialog, server) {
        if (server) {
            $scope.server = server;
        } else {
            $scope.server = {
                label: '',
                address: '',
                fqdn: '',
                login: '',
                port: '',
                ssh: false
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.server);
        };
    }

})();
