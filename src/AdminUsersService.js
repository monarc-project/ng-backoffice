(function () {

    angular
        .module('BackofficeApp')
        .factory('AdminUsersService', [ '$http', '$q', '$httpParamSerializer',
            AdminUsersService
        ]);

    // TODO: $resource
    function AdminUsersService($http, $q, $httpParamSerializer) {
        var self = this;

        var getUsers = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/data/admin_users.json?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createUser = function (params) {
            var promise = $q.defer();

            $http.post('/data/admin_users.json', params).then(
                function () { promise.resolve(); },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var deleteUser = function (id) {
            var promise = $q.defer();

            $http.delete('/data/admin_users.json?id=' + encodeURI(id)).then(
                function () { promise.resolve(); },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        return {
            getUsers: getUsers,
            createUser: createUser,
            deleteUser: deleteUser
        };
    }

})
();