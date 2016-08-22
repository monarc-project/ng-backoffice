(function () {

    angular
        .module('BackofficeApp')
        .factory('AnrService', [ '$resource', '$http', AnrService ]);

    function AnrService($resource, $http) {
        var self = this;

        self.AnrResource = $resource('/api/anr/:anrId', { anrId: '@anrId' },
            {
                'update': {
                    method: 'PUT'
                },
                'patch': {
                    method: 'PATCH'
                },
                'query': {
                    isArray: false
                }
            });

        self.LibraryResource = $resource('/api/anr/:anrId/library/:objectId', { anrId: '@anrId', objectId: '@objectId' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        self.InstanceResource = $resource('/api/anr/:anrId/instances/:instId', { anrId: '@anrId', instId: '@instId' },
            {
                'update': {
                    method: 'PUT'
                },
                'patch': {
                    method: 'PATCH'
                },
                'query': {
                    isArray: false
                }
            });

        self.ScalesResource = $resource('/api/anr/:anrId/scales/:scaleId', { anrId: '@anrId', scaleId: '@scaleId' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        self.ScalesCommentResource = $resource('/api/anr/:anrId/scales/:scaleId/comments/:row/:column', { anrId: '@anrId', scaleId: '@scaleId', row: "@row", column:"@column" },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });


        // ANRs
        var patchAnr = function (anr_id, fields, success, error) {
            // For some reason, if we use a Resource here for PATCH, Angular builds the parameters inside the query
            // string instead of the request body (even if we request from another resource that works!). Fallback to
            // $http for now.
            //var obj_pump = angular.copy(fields);
            //obj_pump.anrId = anr_id;
            //self.InstanceResource.patch(obj_pump, success, error);

            $http.patch('/api/anr/' + anr_id, fields).then(success, error);
        };

        // Object library
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

        // Instances
        var getInstances = function (anr_id) {
            return self.InstanceResource.query({anrId: anr_id}).$promise;
        };

        var getInstance = function (anr_id, instance_id) {
            return self.InstanceResource.query({anrId: anr_id, instId: instance_id}).$promise;
        };

        var addInstance = function (anr_id, object_id, parent_id, position, success, error) {
            new self.InstanceResource({object: object_id, parent: parent_id, position: position, anrId: anr_id}).$save(success, error);
        };

        var moveInstance = function (anr_id, instance_id, parent_id, position, success, error) {
            self.InstanceResource.patch({instId: instance_id, anrId: anr_id, parent: parent_id, position: position}, success, error);
        };

        // Scales
        var getScales = function (anr_id) {
            return self.ScalesResource.query({anrId: anr_id}).$promise;
        };

        var updateScale = function (anr_id, type, min, max, success, error) {
            return self.ScalesResource.update({anrId: anr_id, scaleId: type, min: min, max: max}, success, error);
        };

        // Scales comments
        var getScaleComments = function (anr_id, type, row, column) {
            return self.ScalesCommentResource.query({anrId: anr_id, scaleId: type, row: row, column: column}).$promise;
        };

        var updateScaleComment = function (anr_id, type, comment, row, column, success, error) {
            return self.ScalesResource.update({anrId: anr_id, scaleId: type, row: row, column: column, comment: comment}, success, error);
        };



        return {
            patchAnr: patchAnr,

            addExistingObjectToLibrary: addExistingObjectToLibrary,
            addNewObjectToLibrary: addNewObjectToLibrary,
            getObjectsLibrary: getObjectsLibrary,

            getScales: getScales,
            updateScale: updateScale,
            getScaleComments: getScaleComments,

            getInstances: getInstances,
            getInstance: getInstance,
            addInstance: addInstance,
            moveInstance: moveInstance
        };
    }

})
();