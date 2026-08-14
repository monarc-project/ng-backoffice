(function () {

    angular
        .module('BackofficeApp')
        .factory('ConfigService', [ '$http', ConfigService ]);

    function ConfigService($http) {
        var self = this;
        var flagCodes = {
            en: 'gb',
            ja: 'jp',
            zh: 'cn'
        };
        self.config = {
            languages: null,
            uiLanguageCodes: [],
            defaultLanguageIndex: null,
            mospApiUrl: null,
            appVersion: null,
        };

        var loadConfig = function (success) {
            $http.get('api/config').then(function (data) {
                self.config.languages = {}
                if (data.data.languages) {
                  for (lang in data.data.languages) {
                    let code = ISO6391.getCode(data.data.languages[lang]);
                    let AddLang = {
                      code: code,
                      flag: flagCodes[code] || code,
                      name: ISO6391.getName(code),
                      index: lang,
                    }
                    self.config.languages[lang] = AddLang;
                  }
                }

                if (data.data.appVersion) {
                  self.config.appVersion = data.data.appVersion;
                }
                if (data.data.defaultLanguageIndex) {
                    self.config.defaultLanguageIndex = data.data.defaultLanguageIndex;
                }
                self.config.uiLanguageCodes = data.data.uiLanguageCodes || [];

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
                return {1: {code:'en', name: 'English', flag: 'gb'}};
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

        var getLanguage = function (index) {
            var languages = getLanguages();
            if (index !== undefined && index !== null && languages[index]) {
                return languages[index];
            }

            var defaultLanguageIndex = getDefaultLanguageIndex();
            if (languages[defaultLanguageIndex]) {
                return languages[defaultLanguageIndex];
            }

            return {code:'en', name: 'English', flag: 'gb', index: 1};
        };

        var getDataLanguageIndex = function (index) {
            var languages = getLanguages();
            if (languages[index]) {
                return Number(index);
            }

            var defaultLanguageIndex = getDefaultLanguageIndex();
            if (languages[defaultLanguageIndex]) {
                return defaultLanguageIndex;
            }

            var languageIndexes = Object.keys(languages);
            return languageIndexes.length ? Number(languageIndexes[0]) : defaultLanguageIndex;
        };

        var getUiLanguages = function () {
            var uiLanguages = {};

            angular.forEach(self.config.uiLanguageCodes, function (code) {
                uiLanguages[code] = {
                    code: code,
                    flag: flagCodes[code] || code,
                    name: ISO6391.getName(code)
                };
            });

            return uiLanguages;
        };

        var getUiLanguage = function (code) {
            var uiLanguages = getUiLanguages();
            if (uiLanguages[code]) {
                return uiLanguages[code];
            }

            var languages = getLanguages();
            if (languages[code]) {
                return languages[code];
            }

            return uiLanguages[languages[getDefaultLanguageIndex()].code] || {code: 'en', flag: 'gb'};
        };

        var getMospApiUrl = function () {
           if (self.config.mospApiUrl) {
               return self.config.mospApiUrl;
           } else {
               // Fallback in case of error
               return 'https://objects.monarc.lu/api/v1/';
           }
       };

        var getVersion = function () {
          if (self.config.appVersion) {
            return self.config.appVersion;
          } else {
            return '';
          }
        };

        return {
            loadConfig: loadConfig,
            isLoaded: isLoaded,
            getLanguages: getLanguages,
            getLanguage: getLanguage,
            getDataLanguageIndex: getDataLanguageIndex,
            getUiLanguages: getUiLanguages,
            getUiLanguage: getUiLanguage,
            getDefaultLanguageIndex: getDefaultLanguageIndex,
            getMospApiUrl: getMospApiUrl,
            getVersion: getVersion,
        };
    }

})();
