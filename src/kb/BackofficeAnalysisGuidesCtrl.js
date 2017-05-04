(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnalysisGuidesCtrl', [
            '$scope', '$mdDialog', '$mdMedia', 'toastr', 'gettextCatalog', 'GuideService',
            BackofficeAnalysisGuidesCtrl
        ]);

    /**
     * KB > Analysis Guides Controller for the Backoffice module
     */
    function BackofficeAnalysisGuidesCtrl($scope, $mdDialog, $mdMedia, toastr, gettextCatalog, GuideService) {
        $scope.guides = [];

        $scope.updateGuides = function () {
            GuideService.getGuides().then(function (data) {
                if (data.guides) {
                    $scope.guides = data.guides;
                }
            });
        }
        $scope.updateGuides();

        $scope.createNewGuide = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', 'ConfigService', '$mdDialog', 'GuideService', CreateGuideDialogCtrl],
                templateUrl: 'views/dialogs/create.guides.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen
            })
                .then(function (guide) {
                    GuideService.createGuide(guide,
                        function () {
                            $scope.updateGuides();
                            toastr.success(gettextCatalog.getString('The guide has been created successfully.',
                                {guideLabel: guide.description1}), gettextCatalog.getString('Creation successful'));
                        }
                    );
                });
        };

        $scope.editGuide = function (ev, item) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', 'ConfigService', '$mdDialog', 'GuideService', 'guide', CreateGuideDialogCtrl],
                templateUrl: 'views/dialogs/create.guides.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    guide: item
                }
            })
                .then(function (guide) {
                    GuideService.updateGuide(guide,
                        function () {
                            $scope.updateGuides();
                            toastr.success(gettextCatalog.getString('The guide has been edited successfully.',
                                {guideLabel: guide.description1}), gettextCatalog.getString('Edition successful'));
                        }
                    );
                });
        };


        $scope.deleteGuide = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete this guide?',
                    {label: item.description}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                GuideService.deleteGuide(item.id,
                    function () {
                        $scope.updateGuides();
                        toastr.success(gettextCatalog.getString('The guide has been deleted.',
                            {label: item.description}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };
    }


    function CreateGuideDialogCtrl($scope, ConfigService, $mdDialog, GuideService, guide) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();
        $scope.categories = GuideService.getCategories()

        if (guide) {
            $scope.guide = angular.copy(guide);

            if ($scope.guide.type_id) {
                $scope.guide.type = $scope.guide.type_id;
            }
        } else {
            $scope.guide = {
                type: null,
                mode: null,
                description1: '',
                description2: '',
                description3: '',
                description4: ''
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.guide);
        };
    }

})();
