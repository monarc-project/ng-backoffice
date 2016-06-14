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

        $scope.updateItems = function () {
            GuideService.getItems().then(function (data) {
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
                controller: ['$scope', 'ConfigService', '$mdDialog', 'gettext', CreateItemDialogCtrl],
                templateUrl: '/views/dialogs/create.guides.items.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (item) {
                    item.guide = $stateParams.guideId;
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
                    controller: ['$scope', 'ConfigService', '$mdDialog', 'gettext', 'item', CreateItemDialogCtrl],
                    templateUrl: '/views/dialogs/create.guides.items.html',
                    targetEvent: ev,
                    clickOutsideToClose: true,
                    fullscreen: useFullScreen,
                    locals: {
                        item: item
                    }
                })
                    .then(function (item) {
                        item.guide = $stateParams.guideId;
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

        $scope.deleteItem = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete item "{{ label }}"?',
                    {label: item.description1}))
                .textContent(gettext('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettext('Delete'))
                .cancel(gettext('Cancel'));
            $mdDialog.show(confirm).then(function() {
                GuideService.deleteItem(item.id,
                    function () {
                        $scope.updateItems();
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent(gettextCatalog.getString('The item "{{label}}" has been deleted.',
                                    {label: item.description1}))
                                .position('top right')
                                .hideDelay(3000)
                        );
                    }
                );
            });
        };


        $scope.getGuideLabel = function (type) {
            return GuideService.getCategoryLabel(type)
        };
    }


    function CreateItemDialogCtrl($scope, ConfigService, $mdDialog, gettext) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();

        $scope.item = {
            type: null,
            mode: null,
            description1: '',
            description2: '',
            description3: '',
            description4: '',
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.item);
        };
    }

})();