(function () {

    angular
        .module('BackofficeApp')
        .controller('BackofficeAccountCtrl', [
            '$scope', 'gettextCatalog', 'toastr', '$http', 'UserService', 'UserProfileService',
            'ConfigService', 'localStorageService',
            BackofficeAccountCtrl
        ]);

    /**
     * Account Controller for the Backoffice module
     */
    function BackofficeAccountCtrl($scope, gettextCatalog, toastr, $http, UserService, UserProfileService,
                                   ConfigService, localStorageService) {
        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        var ensureLanguagesLoaded = function () {
            if (ConfigService.isLoaded()) {
                $scope.languages = ConfigService.getLanguages();
                $scope.languagesNames = {};
                angular.copy($scope.languages, $scope.languagesNames);
                for (lang in $scope.languages) {
                     $scope.languagesNames[lang] = ISO6391.getName($scope.languages[lang] == 'gb' ? 'en' : $scope.languages[lang]);
                }
                $scope.lang_selected = $scope.languages[UserService.getUiLanguage()];
            } else {
                setTimeout(ensureLanguagesLoaded, 500);
            }
        };
        ensureLanguagesLoaded();

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

                if (!$scope.user.language) {
                    $scope.user.language = UserService.getUiLanguage();
                }
            });
        };

        $scope.refreshProfile();

        $scope.updateProfile = function () {
            UserProfileService.updateProfile($scope.user, function (data) {
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

        $scope.changeLanguage = function (lang_id) {
            UserService.setUiLanguage(lang_id);
            $scope.user.language = lang_id;
            gettextCatalog.setCurrentLanguage($scope.languages[lang_id]);
            $scope.lang_selected = $scope.languages[lang_id];
            $scope.updatePaginationLabels();
            $scope.updateProfile();
        }
    }
})();
