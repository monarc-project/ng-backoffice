(function () {

    angular
        .module('BackofficeApp')
        .factory('ObjlibService', [ '$resource', ObjlibService ]);

    function ObjlibService($resource) {
        var self = this;

        self.ObjlibResource = $resource('/api/objlibs/:objlibId', { objlibId: '@id' },
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

        self.ObjlibCatResource = $resource('/api/objects-categories/:objlibId', { objlibId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getObjlibsCats = function (params) {
            return self.ObjlibCatResource.query(params).$promise;
        };

        var getObjlibCat = function (id) {
            return self.ObjlibCatResource.query({objlibId: id}).$promise;
        };

        var createObjlibCat = function (params, success, error) {
            new self.ObjlibCatResource(params).$save(success, error);
        };

        var updateObjlibCat = function (params, success, error) {
            self.ObjlibCatResource.update(params, success, error);
        };

        var deleteObjlibCat = function (id, success, error) {
            self.ObjlibCatResource.delete({objlibId: id}, success, error);
        };


        return {
            getObjlibs: getObjlibs,
            getObjlib: getObjlib,
            createObjlib: createObjlib,
            deleteObjlib: deleteObjlib,
            updateObjlib: updateObjlib,

            getObjlibsCats: getObjlibsCats,
            getObjlibCat: getObjlibCat,
            createObjlibCat: createObjlibCat,
            updateObjlibCat: updateObjlibCat,
            deleteObjlibCat: deleteObjlibCat
        };
    }

})
();