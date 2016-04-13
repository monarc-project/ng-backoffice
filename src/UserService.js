(function () {

        angular
            .module('BackofficeApp')
            .factory('UserService', [
                '$resource', '$q', 'localStorageService',
                UserService
            ]);

        function UserService($resource, $q, localStorageService) {
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

                // TODO: Real API call
                setTimeout(function () {
                    if (login == password) {
                        self.authenticated = true;
                        self.token = login + password;
                        self.permissionGroups = ['superadmin', 'dbadmin', 'sysadmin', 'accadmin'];

                        localStorageService.set('auth_token', self.token);
                        localStorageService.set('permission_groups', JSON.stringify(self.permissionGroups));

                        promise.resolve(true);
                    } else {
                        self.authenticated = false;
                        self.token = null;

                        promise.reject();
                    }
                }, 500);

                return promise.promise;
            };

            /**
             * Clears the active authentication and revokes the active authentication token
             * @returns Promise
             */
            var logout = function () {
                self.token = null;
                self.authenticated = false;

                // TODO: Ask API to revoke active token
                var promise = $q.defer();

                setTimeout(function () {
                    promise.resolve(true);
                }, 500);

                return promise.promise;
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