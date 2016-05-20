(function () {

        angular
            .module('BackofficeApp')
            .factory('UserService', [
                '$resource', '$http', '$q', 'localStorageService',
                UserService
            ]);

        function UserService($resource, $http, $q, localStorageService) {
            var self = this;

            self.token = null;
            self.authenticated = false;
            self.permissionGroups = [];

            var reauthenticate = function () {
                if (localStorageService.get('auth_token') != null) {
                    self.authenticated = true;
                    self.token = localStorageService.get('auth_token');
                    self.permissionGroups = JSON.parse(localStorageService.get('permission_groups'));
                    return true;
                } else {
                    return false;
                }
            };

            /**
             * Authenticates the user against the backend authentication API
             * @param login The username
             * @param password The password
             * @returns Promise
             */
            var authenticate = function (login, password) {
                var promise = $q.defer();

                $http.post('/auth', {login: login, password: password}).then(
                    function (data) {
                        self.authenticated = true;
                        self.token = data.data.token;
                        self.permissionGroups = ['superadmin', 'dbadmin', 'sysadmin', 'accadmin'];

                        localStorageService.set('auth_token', self.token);
                        localStorageService.set('permission_groups', JSON.stringify(self.permissionGroups));

                        promise.resolve(true);
                    },

                    function (data) {
                        self.authenticated = false;
                        self.token = null;

                        promise.reject();
                    }
                );

                return promise.promise;
            };

            /**
             * Clears the active authentication and revokes the active authentication token
             * @returns Promise
             */
            var logout = function () {
                self.token = null;
                self.authenticated = false;

                return $http.delete('/auth');
            };

            /**
             * @returns {null|string} The current active token, or null
             */
            var getToken = function () {
                return self.token;
            };

            /**
             * @returns {boolean} True if authenticated, false otherwise
             */
            var isAuthenticated = function () {
                return self.authenticated;
            };

            /**
             * @param group The group we need to check for permission (superadmin, sysadmin, dbadmin, accadmin)
             * @returns {boolean} True if the user has access to elements in the group, false otherwise
             */
            var isAllowed = function (group) {
                return (self.permissionGroups.indexOf(group) >= 0);
            };

            ////////////////////////////////////

            return {
                reauthenticate: reauthenticate,
                authenticate: authenticate,
                logout: logout,
                getToken: getToken,
                isAuthenticated: isAuthenticated,
                isAllowed: isAllowed
            };
        }

    })
();