(function () {

    angular
        .module('BackofficeApp')
        .factory('CityService', [ '$resource', CityService ]);

    function CityService($resource) {
        var self = this;

        self.CityResource = $resource('/api/cities/:cityId', { cityId: '@id' }, {
            'update': {
                method: 'PUT'
            },
            'query': {
                isArray: false
            }
        });

        var getCities = function (params) {
            return self.CityResource.query(params).$promise;
        };

        var getCity = function (id) {
            return self.CityResource.query({cityId: id}).$promise;
        };

        var createCity = function (params, success, error) {
            new self.CityResource(params).$save(success, error);
        };

        var updateCity = function (params, success, error) {
            self.CityResource.update(params, success, error);
        };

        var deleteCity = function (id, success, error) {
            self.CityResource.delete({cityId: id}, success, error);
        };

        self.CountryResource = $resource('/api/countries/:countryId', { countryId: '@id' }, {
            'update': {
                method: 'PUT'
            },
            'query': {
                isArray: false
            }
        });

        var getCountries = function (params) {
            return self.CountryResource.query(params).$promise;
        };

        return {
            getCities: getCities,
            getCity: getCity,
            createCity: createCity,
            deleteCity: deleteCity,
            updateCity: updateCity,
            getCountries: getCountries
        };
    }

})
();
