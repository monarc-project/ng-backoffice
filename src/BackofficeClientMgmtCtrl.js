(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeClientMgmtCtrl', [
            '$scope', 'toastr', '$mdDialog', '$mdMedia', 'gettextCatalog', 'gettext', 'ClientService',
            'TableHelperService',
            BackofficeClientMgmtCtrl
        ]);

    /**
     * BO > CM
     */
    function BackofficeClientMgmtCtrl($scope, toastr, $mdDialog, $mdMedia, gettextCatalog, gettext, ClientService,
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


        $scope.createNewClient = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$q', 'ModelService', 'CityService', CreateClientDialogCtrl],
                templateUrl: '/views/dialogs/create.clients.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (client) {
                    ClientService.createClient(client,
                        function () {
                            $scope.updateClients();
                            toastr.success(gettext('The client has been created successfully.'), gettext('Creation successful'));
                        }
                    );
                });
        };

        $scope.editClient = function (ev, client) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            ClientService.getClient(client.id).then(function (clientData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', '$q', 'ModelService', 'CityService', 'client', CreateClientDialogCtrl],
                    templateUrl: '/views/dialogs/create.clients.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        'client': clientData
                    }
                })
                    .then(function (client) {
                        ClientService.updateClient(client,
                            function () {
                                $scope.updateClients();
                                toastr.success(gettext('The client information has been updated successfully.'), gettext('Update successful'));
                            }
                        );
                    });
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
                ClientService.deleteClient(item.id,
                    function () {
                        $scope.updateClients();
                        toastr.success(gettextCatalog.getString('The client "{{name}}" has been deleted.',
                                    {name: item.name}), gettext('Deletion successful'));
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
                    ClientService.deleteClient(value.id,
                        function () {
                            $scope.updateClients();
                        }
                    );
                });

                $scope.clients.selected = [];

            }, function() {
            });
        };

        TableHelperService.watchSearch($scope, 'clients.query.filter', $scope.clients.query, $scope.updateClients);
    }


    function CreateClientDialogCtrl($scope, $mdDialog, $q, ModelService, CityService, client) {
        ModelService.getModels().then(function (x) {
            $scope.models = x.models;
        });

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
                contact_phone: '',
                model_id: null,
                country_id: null,
                city_id: null
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $scope.client.country_id = $scope.client.country.id;
            $scope.client.city_id = $scope.client.city.id;
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
    }

})();
