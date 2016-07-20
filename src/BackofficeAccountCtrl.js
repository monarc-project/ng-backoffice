(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAccountCtrl', [
            '$scope', 'gettext', 'gettextCatalog', 'toastr', '$http', 'UserService',
            BackofficeAccountCtrl
        ]);

    /**
     * Account Controller for the Backoffice module
     */
    function BackofficeAccountCtrl($scope, gettext, gettextCatalog, toastr, $http, UserService) {
        $scope.language = 'en';

        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        $scope.updatePassword = function () {
            $http.put('/api/user/password/' + UserService.getUserId(), $scope.password).then(function (data) {
                if (data.data.status == 'ok') {
                    toastr.success(gettext('Your password has been updated successfully'));
                }
            })
        }

        $scope.onLanguageChanged = function () {
            gettextCatalog.setCurrentLanguage($scope.language);
            $scope.updatePaginationLabels();
        }
    }
})();