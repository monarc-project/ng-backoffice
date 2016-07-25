(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAccountCtrl', [
            '$scope', 'gettext', 'gettextCatalog', 'toastr', '$http', 'UserService', 'UserProfileService', 'ConfigService',
            BackofficeAccountCtrl
        ]);

    /**
     * Account Controller for the Backoffice module
     */
    function BackofficeAccountCtrl($scope, gettext, gettextCatalog, toastr, $http, UserService, UserProfileService, ConfigService) {
        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        $scope.languages = ConfigService.getLanguages();

        $scope.refreshProfile = function () {
            UserProfileService.getProfile().then(function (data) {
                // Keep only the fields that matters for a clean PATCH
                $scope.user = {
                    firstname: data.firstname,
                    lastname: data.lastname,
                    email: data.email,
                    phone: data.phone,
                    language: data.language
                };
            });
        };

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
            gettextCatalog.setCurrentLanguage($scope.languages[$scope.user.language].substring(0, 2).toLowerCase());
            $scope.updatePaginationLabels();
            $scope.updateProfile();
        }
    }
})();