(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnalysisGuidesCtrl', [
            '$scope', '$mdDialog', '$mdMedia', 'toastr', 'gettextCatalog', 'gettext', 'GuideService',
            BackofficeAnalysisGuidesCtrl
        ]);

    /**
     * KB > Analysis Guides Controller for the Backoffice module
     */
    function BackofficeAnalysisGuidesCtrl($scope, $mdDialog, $mdMedia, toastr, gettextCatalog,
                                          gettext, GuideService) {
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
                templateUrl: '/views/dialogs/create.guides.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (guide) {
                    GuideService.createGuide(guide,
                        function () {
                            $scope.updateGuides();
                            toastr.success(gettextCatalog.getString('The guide "{{guideLabel}}" has been created successfully.',
                                {guideLabel: guide.description1}), gettext('Creation successful'));
                        }
                    );
                });
        };
    }


    function CreateGuideDialogCtrl($scope, ConfigService, $mdDialog, GuideService) {
        $scope.languages = ConfigService.getLanguages();
        $scope.language = ConfigService.getDefaultLanguageIndex();
        $scope.categories = GuideService.getCategories()

        $scope.guide = {
            type: null,
            mode: null,
            description1: '',
            description2: '',
            description3: '',
            description4: ''
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.guide);
        };
    }

})();
