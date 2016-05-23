(function () {

    angular
        .module('BackofficeApp')
        .factory('ObjlibService', [ '$resource', ObjlibService ]);

    function ObjlibService($resource) {
        var self = this;

        self.ObjlibResource = $resource('/api/rolf-objlibs/:objlibId', { objlibId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getObjlibs = function (params) {
            return self.ObjlibResource.query(params).$promise;
        };

        var getObjlib = function (id) {
            return self.ObjlibResource.query({objlibId: id}).$promise;
        };

        var createObjlib = function (params, success, error) {
            new self.ObjlibResource(params).$save(success, error);
        };

        var updateObjlib = function (params, success, error) {
            self.ObjlibResource.update(params, success, error);
        };

        var deleteObjlib = function (id, success, error) {
            self.ObjlibResource.delete({objlibId: id}, success, error);
        };

        return {
            getObjlibs: getObjlibs,
            getObjlib: getObjlib,
            createObjlib: createObjlib,
            deleteObjlib: deleteObjlib,
            updateObjlib: updateObjlib
        };
    }

})
();