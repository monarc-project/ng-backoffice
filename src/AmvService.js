(function () {

    angular
        .module('BackofficeApp')
        .factory('AmvService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            AmvService
        ]);

    function AmvService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.AmvResource = $resource('/api/amvs/:amvId', { amvId: '@id' });

        var getAmvs = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/api/amvs?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createAmv = function (params) {
            var promise = $q.defer();

            var amv = new self.AmvResource(params);
            amv.$save(function (amv) {
                promise.resolve(amv);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var updateAmv = function (params) {
            var promise = $q.defer();

            self.AmvResource.update(params, function (amv) {
                promise.resolve(amv);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var deleteAmv = function (id) {
            var promise = $q.defer();

            self.AmvResource.delete({amvId: id}, function () {
                promise.resolve();
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        return {
            getAmvs: getAmvs,
            createAmv: createAmv,
            deleteAmv: deleteAmv,
            updateAmv: updateAmv
        };
    }

})
();