(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAccountCtrl', [
            '$scope', 'gettext', 'gettextCatalog', 'toastr', '$http', 'UserService', 'UserProfileService',
            BackofficeAccountCtrl
        ]);

    /**
     * Account Controller for the Backoffice module
     */
    function BackofficeAccountCtrl($scope, gettext, gettextCatalog, toastr, $http, UserService, UserProfileService) {
        $scope.language = 'en';

        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        $scope.refreshProfile = function () {
            UserProfileService.getProfile().then(function (data) {
                $scope.user = data.data;
            });
        }
        $scope.refreshProfile();

        $scope.updateProfile = function () {
            UserProfileService.updateProfile($scope.user, function (data) {
                toastr.success(gettext('Your profile has been updated successfully'), gettext('Profile updated'));
            });
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