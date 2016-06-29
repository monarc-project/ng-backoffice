(function () {

    angular
        .module('BackofficeApp')
        .factory('AdminUsersService', ['$resource', AdminUsersService]);

    function AdminUsersService($resource) {
        var self = this;

        self.UserResource = $resource('/api/admin/users/:userId', {userId: '@id'},
            {
                'update': {
                    method: 'PUT'
                },
                'patch': {
                    method: 'PATCH'
                },
                'query': {
                    isArray: false
                }
            });

        var getUsers = function (params) {
            return self.UserResource.query(params).$promise;
        };

        var getUser = function (id) {
            return self.UserResource.query({userId: id}).$promise;
        };

        var createUser = function (params, success, error) {
            new self.UserResource(params).$save(success, error);
        };

        var updateUser = function (params, success, error) {
            self.UserResource.update(params, success, error);
        };

        var deleteUser = function (id, success, error) {
            self.UserResource.delete({userId: id}, success, error);
        };

        var patchUser = function (id, params, success, error) {
            self.UserResource.patch({userId: id}, params, success, error);
        }

        return {
            getUsers: getUsers,
            getUser: getUser,
            createUser: createUser,
            deleteUser: deleteUser,
            updateUser: updateUser,
            patchUser: patchUser
        };
    }

})
();