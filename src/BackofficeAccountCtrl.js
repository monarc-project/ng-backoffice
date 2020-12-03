(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAccountCtrl', [
            '$scope', 'gettextCatalog', 'toastr', '$http', 'UserService', 'UserProfileService',
            BackofficeAccountCtrl
        ]);

    /**
     * Account Controller for the Backoffice module
     */
    function BackofficeAccountCtrl($scope, gettextCatalog, toastr, $http, UserService, UserProfileService) {
        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        $scope.refreshProfile = function () {
            UserProfileService.getProfile().then(function (data) {
                // Keep only the fields that matters for a clean PATCH
                $scope.user = {
                    firstname: data.firstname,
                    lastname: data.lastname,
                    email: data.email,
                };
            });
        };

        $scope.updateProfile = function () {
            UserProfileService.updateProfile($scope.user, function () {
                toastr.success(gettextCatalog.getString('Your profile has been updated successfully'), gettextCatalog.getString('Profile updated'));
            });
        }

        $scope.updatePassword = function () {
            $http.put('api/user/password/' + UserService.getUserId(), $scope.password).then(function (data) {
                if (data.data.status == 'ok') {
                    toastr.success(gettextCatalog.getString('Your password has been updated successfully'));
                }
            })
        }
    }
})();
