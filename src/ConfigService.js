(function () {

    angular
        .module('BackofficeApp')
        .factory('ConfigService', [ '$http', ConfigService ]);

    function ConfigService($http) {
        var self = this;
        self.config = {
            languages: null,
            defaultLanguageIndex: null,
            mospApiUrl: null,
        };

        var loadConfig = function (success) {
            $http.get('api/config').then(function (data) {
                self.config.languages = {}
                if (data.data.languages) {
                    for (lang in data.data.languages) {
                        self.config.languages[lang] = ISO6391.getCode(data.data.languages[lang]);
                    }
                }
                if (data.data.defaultLanguageIndex) {
                    self.config.defaultLanguageIndex = data.data.defaultLanguageIndex;
                }

                if (data.data.mospApiUrl !== undefined) {
                    self.config.mospApiUrl = data.data.mospApiUrl;
                } else {
                    self.config.mospApiUrl = 'https://objects.monarc.lu/api/v1/';
                }

                if (success) {
                    success();
                }
            });
        };

        var isLoaded = function () {
            return !!self.config.languages;
        };

        var getLanguages = function () {
            if (self.config.languages) {
                return self.config.languages;
            } else {
                // Fallback in case of error
                return {1: 'gb'};
            }
        };

        var getDefaultLanguageIndex = function () {
            if (self.config.defaultLanguageIndex) {
                return self.config.defaultLanguageIndex;
            } else {
                // Fallback in case of error
                return 1;
            }
        };

        var getMospApiUrl = function () {
           if (self.config.mospApiUrl) {
               return self.config.mospApiUrl;
           } else {
               // Fallback in case of error
               return 'https://objects.monarc.lu/api/v1/';
           }
       };

        return {
            loadConfig: loadConfig,
            isLoaded: isLoaded,
            getLanguages: getLanguages,
            getDefaultLanguageIndex: getDefaultLanguageIndex,
            getMospApiUrl: getMospApiUrl
        };
    }

})();
