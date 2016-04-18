(function () {

    angular
        .module('BackofficeApp')
        .factory('AdminUsersService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            AdminUsersService
        ]);

    function AdminUsersService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.UserResource = $resource('/api/admin/users/:userId', { userId: '@id' });

        var getUsers = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/api/admin/users?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createUser = function (params) {
            var promise = $q.defer();

            var user = new self.UserResource(params);
            user.$save(function (user) {
                promise.resolve(user);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var updateUser = function (params) {
            var promise = $q.defer();

            var user = new self.UserResource(params);
            user.$save(function (user) {
                promise.resolve(user);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var deleteUser = function (id) {
            var promise = $q.defer();

            self.UserResource.delete({userId: id}, function () {
                promise.resolve();
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        return {
            getUsers: getUsers,
            createUser: createUser,
            deleteUser: deleteUser,
            updateUser: updateUser
        };
    }

})
();