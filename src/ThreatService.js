(function () {

    angular
        .module('BackofficeApp')
        .factory('ThreatService', [ '$resource', ThreatService ]);

    function ThreatService($resource) {
        var self = this;

        self.ThreatResource = $resource('/api/threats/:threatId', { threatId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });
        self.ThreatThemeResource = $resource('/api/threats/themes/:themeId', { themeId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        // Threats
        var getThreats = function (params) {
            return self.ThreatResource.query(params).$promise;
        };

        var getThreat = function (id) {
            return self.ThreatResource.query({threatId: id}).$promise;
        };

        var createThreat = function (params, success, error) {
            new self.ThreatResource(params).$save(success, error);
        };

        var updateThreat = function (params, success, error) {
            self.ThreatResource.update(params, success, error);
        };

        var deleteThreat = function (id, success, error) {
            self.ThreatResource.delete({threatId: id}, success, error);
        };


        // Themes
        var getThemes = function (params) {
            return self.ThreatThemeResource.query(params).$promise;
        };

        var getTheme = function (id) {
            return self.ThreatThemeResource.query({themeId: id}).$promise;
        };

        var createTheme = function (params, success, error) {
            new self.ThreatThemeResource(params).$save(success, error);
        };

        var updateTheme = function (params, success, error) {
            self.ThreatThemeResource.update(params, success, error);
        };

        var deleteTheme = function (id, success, error) {
            self.ThreatThemeResource.delete({themeId: id}, success, error);
        };


        return {
            getThreats: getThreats,
            getThreat: getThreat,
            createThreat: createThreat,
            deleteThreat: deleteThreat,
            updateThreat: updateThreat,

            getThemes: getThemes,
            getTheme: getTheme,
            createTheme: createTheme,
            deleteTheme: deleteTheme,
            updateTheme: updateTheme
        };
    }

})
();