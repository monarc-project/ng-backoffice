(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAnalysisGuidesCtrl', [
            '$scope', 'gettextCatalog', 'GuideService',
            BackofficeAnalysisGuidesCtrl
        ]);

    /**
     * KB > Analysis Guides Controller for the Backoffice module
     */
    function BackofficeAnalysisGuidesCtrl($scope, gettextCatalog, GuideService) {
        GuideService.getGuides().then(function (data) {
            $scope.guides = data.guides;
        });
    }
})();