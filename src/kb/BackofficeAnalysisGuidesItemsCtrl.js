(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnalysisGuidesItemsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', 'toastr', '$stateParams', 'gettextCatalog', 'GuideService',
            BackofficeAnalysisGuidesItemsCtrl
        ]);

    /**
     * KB > Analysis Guides Items Controller for the Backoffice module
     */
    function BackofficeAnalysisGuidesItemsCtrl($scope, $mdDialog, $mdMedia, toastr, $stateParams, gettextCatalog,
                                               GuideService) {

        $scope.updateItems = function () {
            GuideService.getItems({order: 'position', guide: $stateParams.guideId}).then(function (data) {
                if (data.items) {
                    $scope.items = data.items;
                }
            });
        }
        $scope.updateItems();

        GuideService.getGuide($stateParams.guideId).then(function (data) {
            $scope.guide = data;
        })

        $scope.createNewItem = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$q', 'ConfigService', 'GuideService', '$mdDialog', 'items', CreateItemDialogCtrl],
                templateUrl: 'views/dialogs/create.guides.items.html',
                targetEvent: ev,
                scope: $scope.$dialogScope.$new(),
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    items: $scope.items
                }
            })
                .then(function (item) {
                    item.guide = $stateParams.guideId;
                    GuideService.createItem(item,
                        function () {
                            $scope.updateItems();
                            toastr.success(gettextCatalog.getString('The item has been created successfully.'), gettextCatalog.getString('Creation successful'));
                        }
                    );
                }, function (reject) {
                  $scope.handleRejectionDialog(reject);
                });
        };

        $scope.editItem = function (ev, item) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            GuideService.getItem(item.id).then(function (item) {
                $mdDialog.show({
                    controller: ['$scope', '$q', 'ConfigService', 'GuideService', '$mdDialog', 'items', 'item', CreateItemDialogCtrl],
                    templateUrl: 'views/dialogs/create.guides.items.html',
                    targetEvent: ev,
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    scope: $scope.$dialogScope.$new(),
                    locals: {
                        items: $scope.items,
                        item: item
                    }
                })
                    .then(function (item) {
                        item.guide = $stateParams.guideId;
                        GuideService.updateItem(item,
                            function () {
                                $scope.updateItems();
                                toastr.success(gettextCatalog.getString('The item has been edited successfully.'), gettextCatalog.getString('Edition successful'));
                            }
                        );
                    }, function (reject) {
                      $scope.handleRejectionDialog(reject);
                    });
            });
        };

        $scope.deleteItem = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete item?',
                    {label: item.description1}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                GuideService.deleteItem(item.id,
                    function () {
                        $scope.updateItems();
                        toastr.success(gettextCatalog.getString('The item has been deleted.',
                                    {label: item.description1}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };


        $scope.getGuideLabel = function (type) {
            return GuideService.getCategoryLabel(type)
        };
    }


    function CreateItemDialogCtrl($scope, $q, ConfigService, GuideService, $mdDialog, items, item) {
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (item) {
            $scope.item = item;

            // Determine the position
            if (item.position == 1) {
                $scope.item.implicitPosition = 1;
            } else if (item.position == items.length) {
                $scope.item.implicitPosition = 2;
            } else {
                $scope.item.implicitPosition = 3;

                for (var i = 0; i < items.length; ++i) {
                    if (items[i].position == $scope.item.position - 1) {
                        $scope.item.previous = angular.copy(items[i]);
                        break;
                    }
                }
            }
        } else {
            $scope.item = {
                type: null,
                mode: null,
                description1: '',
                description2: '',
                description3: '',
                description4: '',
                implicitPosition: 2,
            };
        }

        $scope.queryItemSearch = function (query) {
            var q = $q.defer();

            GuideService.getItems({filter: query, order: 'position'}).then(function (x) {
                q.resolve(x.items);

            }, function (x) {
                q.reject(x);
            });

            return q.promise;
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            if ($scope.item.previous) {
                $scope.item.previous = $scope.item.previous.id;
            }
            $mdDialog.hide($scope.item);
        };
    }

})();
