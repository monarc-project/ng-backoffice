(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnalysisGuidesCtrl', [
            '$scope', '$mdDialog', '$mdMedia', '$mdToast', 'gettextCatalog', 'gettext', 'GuideService',
            BackofficeAnalysisGuidesCtrl
        ]);

    /**
     * KB > Analysis Guides Controller for the Backoffice module
     */
    function BackofficeAnalysisGuidesCtrl($scope, $mdDialog, $mdMedia, $mdToast, gettextCatalog, gettext, GuideService) {
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
                controller: ['$scope', '$mdDialog', 'gettext', CreateGuideDialogCtrl],
                templateUrl: '/views/dialogs/create.guides.html',
                targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: useFullScreen
            })
                .then(function (guide) {
                    GuideService.createGuide(guide,
                        function () {
                            $scope.updateGuides();
                            $mdToast.show(
                                $mdToast.simple()
                                    .textContent(gettext('The guide has been created successfully.'))
                                    .position('top right')
                                    .hideDelay(3000)
                            );
                        }
                    );
                });
        };
    }


    function CreateGuideDialogCtrl($scope, $mdDialog, gettext) {
        $scope.categories = [
            {
                id: 1,
                label: gettext("Risk analysis context")
            },
            {
                id: 2,
                label: gettext("Risk management context")
            },
            {
                id: 3,
                label: gettext("Summary assessment of trends and threats")
            },
            {
                id: 4,
                label: gettext("Summary of assets / impacts")
            },
        ];

        $scope.guide = {
            type: null,
            mode: null,
            description: ''
        };

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.guide);
        };
    }

})();