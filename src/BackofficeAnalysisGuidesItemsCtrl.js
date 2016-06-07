(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnalysisGuidesItemsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', '$mdToast', '$stateParams', 'gettextCatalog', 'gettext', 'GuideService',
            BackofficeAnalysisGuidesItemsCtrl
        ]);

    /**
     * KB > Analysis Guides Items Controller for the Backoffice module
     */
    function BackofficeAnalysisGuidesItemsCtrl($scope, $mdDialog, $mdMedia, $mdToast, $stateParams, gettextCatalog,
                                               gettext, GuideService) {
        $scope.items = [
            {description: 'test 1', position: 1},
            {description: 'test 2', position: 2},
            {description: 'test 3', position: 3},
            {description: 'test 4', position: 4}
        ];

        $scope.updateItems = function () {
            GuideService.getItems().then(function (data) {
                if (data.items) {
                    $scope.items = data.items;
                }
            });
        }
        //$scope.updateItems();

        GuideService.getGuide($stateParams.guideId).then(function (data) {
            $scope.guide = data;
        })

        $scope.createNewItem = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'gettext', CreateItemDialogCtrl],
                templateUrl: '/views/dialogs/create.guides.items.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (item) {
                    GuideService.createItem(item,
                        function () {
                            $scope.updateItems();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The item has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };

        $scope.editItem = function (ev, item) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            GuideService.getItem(item.id).then(function (item) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'gettext', 'item', CreateItemDialogCtrl],
                    templateUrl: '/views/dialogs/create.guides.items.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        item: item
                    }
                })
                    .then(function (item) {
                        GuideService.updateItem(item,
                            function () {
                                $scope.updateItems();
                                $mdToast.show(
                                    $mdToast.simple()
                                        .textContent(gettext('The item has been updated successfully.'))
                                        .position('top right')
                                        .hideDelay(3000)
                                );
                            }
                        );
                    });
            });
        };

        $scope.getGuideLabel = function (type) {
            return GuideService.getCategoryLabel(type)
        };
    }


    function CreateItemDialogCtrl($scope, $mdDialog, gettext) {
        $scope.item = {
            type: null,
            mode: null,
            description: ''
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.item);
        };
    }

})();