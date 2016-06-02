(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAccountCtrl', [
            '$scope', 'gettextCatalog',
            BackofficeAccountCtrl
        ]);

    /**
     * Account Controller for the Backoffice module
     */
    function BackofficeAccountCtrl($scope, gettextCatalog) {
        $scope.language = 'en';

        $scope.onLanguageChanged = function () {
            gettextCatalog.setCurrentLanguage($scope.language);
            $scope.updatePaginationLabels();
        }
    }
})();