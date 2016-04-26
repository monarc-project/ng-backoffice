(function () {

    angular
        .module('BackofficeApp')
        .factory('ThreatService', [ '$resource', '$http', '$q', '$httpParamSerializer',
            ThreatService
        ]);

    function ThreatService($resource, $http, $q, $httpParamSerializer) {
        var self = this;

        self.ThreatResource = $resource('/api/threats/:threatId', { threatId: '@id' });
        self.ThreatThemeResource = $resource('/api/threats/themes/:themeId', { themeId: '@id' });

        // Threats
        var getThreats = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/api/threats?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createThreat = function (params) {
            var promise = $q.defer();

            var threat = new self.ThreatResource(params);
            threat.$save(function (threat) {
                promise.resolve(threat);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var updateThreat = function (params) {
            var promise = $q.defer();

            var threat = new self.ThreatResource(params);
            threat.$save(function (threat) {
                promise.resolve(threat);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var deleteThreat = function (id) {
            var promise = $q.defer();

            self.ThreatResource.delete({threatId: id}, function () {
                promise.resolve();
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };


        // Themes
        var getThemes = function (params) {
            var promise = $q.defer();
            var q = $httpParamSerializer(params);

            $http.get('/api/threats/themes?' + q).then(
                function (data) { promise.resolve(data.data);  },
                function (data) { promise.reject(data.status); }
            );

            return promise.promise;
        };

        var createTheme = function (params) {
            var promise = $q.defer();

            var theme = new self.ThreatThemeResource(params);
            theme.$save(function (theme) {
                promise.resolve(theme);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var updateTheme = function (params) {
            var promise = $q.defer();

            var theme = new self.ThreatThemeResource(params);
            theme.$save(function (theme) {
                promise.resolve(theme);
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };

        var deleteTheme = function (id) {
            var promise = $q.defer();

            self.ThreatThemeResource.delete({themeId: id}, function () {
                promise.resolve();
            }, function (error) {
                promise.reject(error.status);
            });

            return promise.promise;
        };


        return {
            getThreats: getThreats,
            createThreat: createThreat,
            deleteThreat: deleteThreat,
            updateThreat: updateThreat,

            getThemes: getThemes,
            createTheme: createTheme,
            deleteTheme: deleteTheme,
            updateTheme: updateTheme
        };
    }

})
();