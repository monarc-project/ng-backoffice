(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeClientMgmtCtrl', [
            '$scope', 'toastr', '$mdDialog', '$mdMedia', '$timeout', 'gettextCatalog', 'ClientService',
            'TableHelperService',
            BackofficeClientMgmtCtrl
        ]);

    /**
     * BO > CM
     */
    function BackofficeClientMgmtCtrl($scope, toastr, $mdDialog, $mdMedia, $timeout, gettextCatalog, ClientService,
                                      TableHelperService) {
        TableHelperService.resetBookmarks();

        $scope.clients = TableHelperService.build('name', 10, 1, '');

        $scope.updateClients = function () {
            $scope.clients.promise = ClientService.getClients($scope.clients.query);
            $scope.clients.promise.then(
                function (data) {
                    $scope.clients.items = data;
                }
            )
        };
        $scope.removeClientsFilter = function () {
            TableHelperService.removeFilter($scope.clients);
        };


        $scope.createNewClient = function (ev, client) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$q', 'toastr', 'gettextCatalog', 'ModelService', 'AdminServerGetService', 'client', CreateClientDialogCtrl],
                templateUrl: 'views/dialogs/create.clients.html',
                targetEvent: ev,
                scope: $scope.$dialogScope.$new(),
                preserveScope: false,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    'client': client
                }
            })
                .then(function (client) {
                    ClientService.createClient(client,
                        function () {
                            $scope.updateClients();
                            toastr.success(gettextCatalog.getString('The client has been created successfully.',
                                {clientName: client.name}), gettextCatalog.getString('Creation successful'));
                        },

                        function () {
                            $scope.createNewClient(ev, client);
                        }
                    );
                }, function (reject) {
                  $scope.handleRejectionDialog(reject);
                });
        };

        $scope.editClient = function (ev, client) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            var showDialog = function (clientData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', '$q', 'toastr', 'gettextCatalog', 'ModelService', 'AdminServerGetService', 'client', CreateClientDialogCtrl],
                    templateUrl: 'views/dialogs/create.clients.html',
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    scope: $scope.$dialogScope.$new(),
                    preserveScope: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'client': clientData
                    }
                })
                    .then(function (client) {
                        ClientService.updateClient(client,
                            function () {
                                $scope.updateClients();
                                toastr.success(gettextCatalog.getString('The client has been edited successfully.',
                                    {clientName: client.name}), gettextCatalog.getString('Edition successful'));
                            }
                        );
                    }, function (reject) {
                      $scope.handleRejectionDialog(reject);
                    });
            };

            if (client.id) {
                ClientService.getClient(client.id).then(function (clientData) {
                    showDialog(clientData);
                });
            } else {
                showDialog(client);
            }
        };

        $scope.deleteClient = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete client?',  {name: item.name}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ClientService.deleteClient(item.id,
                    function () {
                        $scope.updateClients();
                        toastr.success(gettextCatalog.getString('The client has been deleted.',
                                    {name: item.name}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            }, function() {
            });
        };

        $scope.deleteClientMass = function (ev) {
            var outpromise = null;

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the {{count}} selected client(s)?',
                    {count: $scope.clients.selected.length}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                angular.forEach($scope.clients.selected, function (value, key) {
                    ClientService.deleteClient(value.id);

                    if (outpromise) {
                        $timeout.cancel(outpromise);
                    }

                    outpromise = $timeout(function () {
                        $scope.updateClients();
                        toastr.success(gettextCatalog.getString('{{count}} clients have been deleted.',
                            {count: $scope.clients.selected.length}), gettextCatalog.getString('Deletion successful'));
                        $scope.clients.selected = [];
                    }, 350);
                });

            }, function() {
            });
        };

        TableHelperService.watchSearch($scope, 'clients.query.filter', $scope.clients.query, $scope.updateClients);
    }


    function CreateClientDialogCtrl($scope, $mdDialog, $q, toastr, gettextCatalog, ModelService, AdminServerGetService, client) {
        ModelService.getModels().then(function (x) {
            $scope.models = x.models;
        });

        AdminServerGetService.getServers().then(function (x) {
            $scope.servers = x.servers;
        });

        if (client != undefined && client != null) {
            $scope.client = client;
        } else {
            $scope.client = {
                name: '',
                proxyAlias: '',
                contact_email: '',
                model_id: null
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
