(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeClientMgmtCtrl', [
            '$scope', '$mdToast', '$mdDialog', '$mdMedia', 'gettextCatalog', 'gettext', 'ClientService',
            'TableHelperService', 'ErrorService',
            BackofficeClientMgmtCtrl
        ]);

    /**
     * BO > CM
     */
    function BackofficeClientMgmtCtrl($scope, $mdToast, $mdDialog, $mdMedia, gettextCatalog, gettext, ClientService,
                                      TableHelperService, ErrorService) {
        TableHelperService.resetBookmarks();

        $scope.clients = TableHelperService.build('name', 10, 1, '');

        $scope.updateClients = function () {
            $scope.clients.promise = ClientService.getClients($scope.clients.query);
            $scope.clients.promise.then(
                function (data) {
                    $scope.clients.items = data;
                },

                function (status) {
                    ErrorService.notifyFetchError('clients', status);
                }
            )
        };
        $scope.removeClientsFilter = function () {
            TableHelperService.removeFilter($scope.clients);
        };


        $scope.createNewClient = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', CreateClientDialogCtrl],
                templateUrl: '/views/dialogs/create.clients.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (client) {
                    ClientService.createClient(client).then(
                        function () {
                            $scope.updateClients();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The client has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('created client'), status);
                        }
                    );
                }, function () {

                });
        };

        $scope.editClient = function (ev, client) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'client', CreateClientDialogCtrl],
                templateUrl: '/views/dialogs/create.clients.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen,
                locals: {
                    'client': client
                }
            })
                .then(function (client) {
                    ClientService.updateClient(client).then(
                        function () {
                            $scope.updateClients();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The client information has been updated successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('created client'), status);
                        }
                    );
                }, function () {

                });
        };

        $scope.deleteClient = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete "{{ name }}"?',  {name: item.name}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ClientService.deleteClient(item.id).then(
                    function () {
                        $scope.updateClients();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The client "{{firstname}} {{lastname}}" has been deleted.',
                                    {firstname: item.firstname, lastname: item.lastname}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    },

                    function (status) {
                        ErrorService.notifyFetchError(gettext('deleted client'), status);
                    }
                );
            }, function() {
            });
        };

        $scope.deleteClientMass = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected client(s)?',
                    {count: $scope.clients.selected.length}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.clients.selected, function (value, key) {
                    ClientService.deleteClient(value.id).then(
                        function () {
                            $scope.updateClients();
                        },

                        function (status) {
                            ErrorService.notifyFetchError(gettext('deleted clients'), status);
                        }
                    );
                });

                $scope.clients.selected = [];

            }, function() {
            });
        };

        TableHelperService.watchSearch($scope, 'clients.query.filter', $scope.clients.query, $scope.updateClients);
        $scope.updateClients();
    }


    function CreateClientDialogCtrl($scope, $mdDialog, client) {
        if (client != undefined && client != null) {
            $scope.client = client;
        } else {
            $scope.client = {
                name: '',
                proxy_alias: '',
                address: '',
                postalcode: '',
                phone: '',
                fax: '',
                email: '',
                employees_number: '',
                contact_fullname: '',
                contact_email: '',
                contact_phone: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.client);
        };
    }

})();