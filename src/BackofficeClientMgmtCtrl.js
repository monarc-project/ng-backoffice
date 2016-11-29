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
                controller: ['$scope', '$mdDialog', '$q', 'toastr', 'gettextCatalog', 'ModelService', 'CityService', 'AdminServerGetService', 'client', CreateClientDialogCtrl],
                templateUrl: '/views/dialogs/create.clients.html',
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
                            toastr.success(gettextCatalog.getString('The client "{{clientName}}" has been created successfully.',
                                {clientName: client.name}), gettextCatalog.getString('Creation successful'));
                        },

                        function () {
                            $scope.createNewClient(ev, client);
                        }
                    );
                });
        };

        $scope.editClient = function (ev, client) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            var showDialog = function (clientData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', '$q', 'toastr', 'gettextCatalog', 'ModelService', 'CityService', 'AdminServerGetService', 'client', CreateClientDialogCtrl],
                    templateUrl: '/views/dialogs/create.clients.html',
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
                                toastr.success(gettextCatalog.getString('The client "{{clientName}}" information has been updated successfully.',
                                    {clientName: client.name}), gettextCatalog.getString('Update successful'));
                            }
                        );
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
                .title(gettextCatalog.getString('Are you sure you want to delete "{{ name }}"?',  {name: item.name}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ClientService.deleteClient(item.id,
                    function () {
                        $scope.updateClients();
                        toastr.success(gettextCatalog.getString('The client "{{name}}" has been deleted.',
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


    function CreateClientDialogCtrl($scope, $mdDialog, $q, toastr, gettextCatalog, ModelService, CityService, AdminServerGetService, client) {
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
                address: '',
                postalcode: '',
                phone: '',
                fax: '',
                email: '',
                employees_number: '',
                contactFullname: '',
                contact_email: '',
                contact_phone: '',
                model_id: null,
                country_id: null,
                city_id: null,
                country: null,
                city: null
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            if ($scope.client.country) {
                $scope.client.country_id = $scope.client.country.id;
            }
            if ($scope.client.city) {
                $scope.client.city_id = $scope.client.city.id;
            }
            $mdDialog.hide($scope.client);
        };

        $scope.queryCountrySearch = function (query) {
            var q = $q.defer();

            CityService.getCountries({filter: query}).then(function (x) {
                q.resolve(x.countries);
            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.queryCitySearch = function (query) {
            var q = $q.defer();

            CityService.getCities({filter: query, country_id: $scope.client.country.id}).then(function (x) {
                q.resolve(x.cities);
            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.selectedCountryItemChange = function (item) {
            $scope.client.country = item;
            if (item) {
                $scope.client.city = null;
            }
        };

        $scope.createCity = function (city) {
            if ($scope.client.country) {
                CityService.createCity({country_id: $scope.client.country.id, label: city}, function (data) {
                    $scope.client.city = {
                        country_id: $scope.client.country.id,
                        label: city,
                        id: data.id
                    };

                    toastr.success(gettextCatalog.getString("The city {{label}} has been created", {label: city}));
                })
            } else {
                toastr.error(gettextCatalog.getString("You must select a country first"));
            }
        }
    }

})();
