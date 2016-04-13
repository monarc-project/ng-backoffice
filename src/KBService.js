(function () {

    angular
        .module('BackofficeApp')
        .factory('KBService', [ '$http', '$q', '$httpParamSerializer',
            KBService
        ]);

    // TODO: $resource
    function KBService($http, $q, $httpParamSerializer) {
        var self = this;

        var getAssets = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/data/kb_assets.json?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        return {
            getAssets: getAssets
        };
    }

})
();