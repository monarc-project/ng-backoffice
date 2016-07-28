(function () {

    angular
        .module('BackofficeApp')
        .factory('AnrService', [ '$resource', AnrService ]);

    function AnrService($resource) {
        var self = this;

        self.LibraryResource = $resource('/api/anr/:anrId/library/:objectId', { anrId: '@anrId', objectId: '@objectId' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            })

        var addExistingObjectToLibrary = function (anr_id, object_id, success, error) {
            new self.LibraryResource({anrId: anr_id, objectId: object_id}).$save(success, error);
        };

        var addNewObjectToLibrary = function (anr_id, object, success, error) {
            var obj_pump = angular.copy(object);
            obj_pump.anrId = anr_id;
            new self.LibraryResource(obj_pump).$save(success, error);
        };

        var getObjectsLibrary = function (anr_id) {
            return self.LibraryResource.query({anrId: anr_id}).$promise;
        };

        return {
            addExistingObjectToLibrary: addExistingObjectToLibrary,
            addNewObjectToLibrary: addNewObjectToLibrary,
            getObjectsLibrary: getObjectsLibrary
        };
    }

})
();