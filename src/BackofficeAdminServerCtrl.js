(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAdminServerCtrl', [
            '$scope', '$state', '$mdToast', '$mdMedia', '$mdDialog', 'gettextCatalog', 'gettext', 'AdminServerService',
            'ErrorService',
            BackofficeAdminServerCtrl
        ]);

    /**
     * Admin Server Controller for the Backoffice module
     */
    function BackofficeAdminServerCtrl($scope, $state, $mdToast, $mdMedia, $mdDialog, gettextCatalog, gettext,
                                       AdminServerService, ErrorService) {
        $scope.servers = {};

        $scope.updateServers = function () {
            AdminServerService.getServers().then(
                function (data) {
                    $scope.servers = data;
                },

                function (status) {
                    ErrorService.notifyFetchError(gettext('servers'), status);
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
                                    .textContent(gettext('The server has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('created server'), status);
                        }
                    );
                }, function () {

                });
        };

        $scope.deleteServer = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete "{{label}}"?', { label: item.label }))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                AdminServerService.deleteServer(item.id).then(
                    function () {
                        $scope.updateServers();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The server "{{label}}" has been deleted.',
                                    {label: item.label}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    },

                    function (status) {
                        ErrorService.notifyFetchError(gettext('deleted server'), status);
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